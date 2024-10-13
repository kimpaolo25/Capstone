from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.model_selection import ParameterGrid
from sklearn.ensemble import GradientBoostingRegressor

app = Flask(__name__)
CORS(app)

DATABASE_URI = 'mysql+mysqlconnector://root:@localhost/prwai_data'
engine = create_engine(DATABASE_URI)

@app.route('/')
def index():
    return '<h1>This is For Admin Only</h1>'

@app.route('/predict', methods=['GET'])
def predict():
    try:
        query = "SELECT * FROM customers"
        df = pd.read_sql(query, engine)
        print("Data fetched from database:", df.head())

        df['Date_column'] = pd.to_datetime(df['Date_column'], format='%Y-%b')
        df.fillna(0, inplace=True)
        df = df[df['CU_M'] >= 0]
        threshold = 1250
        df = df[df['CU_M'] <= threshold]
        df.set_index('Date_column', inplace=True)

        df_monthly = df.resample('M').agg({'Amount': 'sum', 'CU_M': 'sum'})
        df_summary = df_monthly.describe()
        print("Data summary after feature engineering:", df_summary)

        train_size = int(len(df_monthly) * 0.8)
        train, test = df_monthly[:train_size], df_monthly[train_size:]
        

        # Seasonal Decomposition
        decomposition_amount = seasonal_decompose(train['Amount'], model='add')
        trend_amount = decomposition_amount.trend.dropna()

        decomposition_cum = seasonal_decompose(train['CU_M'], model='add')
        trend_cum = decomposition_cum.trend.dropna()

        # Function to fit and return forecasts for ARIMA and Exponential Smoothing
        def fit_models_and_forecast(trend_data, steps):
            best_aic = float("inf")
            best_order = None
            
            # Grid Search for ARIMA
            for params in ParameterGrid({'order': [(p, d, q) for p in range(0, 3) for d in range(0, 2) for q in range(0, 3)]}):
                try:
                    model = ARIMA(trend_data.dropna(), order=params['order'])
                    model_fit = model.fit()
                    if model_fit.aic < best_aic:
                        best_aic = model_fit.aic
                        best_order = params['order']
                except Exception:
                    continue

            model_arima = ARIMA(trend_data.dropna(), order=best_order).fit()
            model_exp = ExponentialSmoothing(trend_data, trend='add', seasonal='add', seasonal_periods=12).fit()

            forecast_arima = model_arima.forecast(steps=steps)
            forecast_exp = model_exp.forecast(steps=steps)

            return forecast_arima, forecast_exp, best_order

        # Fit models for Amount and CU_M
        forecast_amount_arima, forecast_amount_exp, best_order_amount = fit_models_and_forecast(trend_amount, len(test))
        forecast_cum_arima, forecast_cum_exp, best_order_cum = fit_models_and_forecast(trend_cum, len(test))

        # Combine forecasts using weighted averages
        weight_arima = 0.6
        weight_exp = 0.4
        forecast_amount_combined = weight_arima * forecast_amount_arima + weight_exp * forecast_amount_exp
        forecast_cum_combined = weight_arima * forecast_cum_arima + weight_exp * forecast_cum_exp

        # Stacking models
        X_train_amount = np.column_stack((forecast_amount_arima, forecast_amount_exp))
        X_train_cum = np.column_stack((forecast_cum_arima, forecast_cum_exp))
        y_train_amount = train['Amount'][-len(X_train_amount):]
        y_train_cum = train['CU_M'][-len(X_train_cum):]

        model_stacking_amount = GradientBoostingRegressor()
        model_stacking_cum = GradientBoostingRegressor()

        model_stacking_amount.fit(X_train_amount, y_train_amount)
        model_stacking_cum.fit(X_train_cum, y_train_cum)

        # Forecast using stacking
        forecast_amount_stacked = model_stacking_amount.predict(X_train_amount)
        forecast_cum_stacked = model_stacking_cum.predict(X_train_cum)

        # Evaluate and print results
        test_amount = test['Amount']
        test_cum = test['CU_M']

        forecast_amount_aligned = forecast_amount_combined[:len(test_amount)]
        forecast_cum_aligned = forecast_cum_combined[:len(test_cum)]

        mse_amount = mean_squared_error(test_amount, forecast_amount_aligned)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount_aligned)
        mape_amount = np.mean(np.abs((test_amount - forecast_amount_aligned) / test_amount)) * 100

        mse_cum = mean_squared_error(test_cum, forecast_cum_aligned)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum_aligned)
        mape_cum = np.mean(np.abs((test_cum - forecast_cum_aligned) / test_cum)) * 100

        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")
        
        print(f"Best ARIMA order for Amount: {best_order_amount}")
        print(f"Best ARIMA order for CU_M: {best_order_cum}")
        
        # Add this block to describe the test set
        test_summary = test.describe()
        print("Testing Data Summary:", test_summary)

        response = {
            'dates': [date.strftime('%Y-%m') for date in test.index],
            'test_original_amounts': [float(value) for value in test_amount.tolist()],
            'forecasted_amounts': [float(value) for value in forecast_amount_aligned.tolist()],
            'test_original_cum': [float(value) for value in test_cum.tolist()],
            'forecasted_cum': [float(value) for value in forecast_cum_aligned.tolist()],
            'accuracy': {
                'amount': {
                    'mse': mse_amount,
                    'rmse': rmse_amount,
                    'mae': mae_amount,
                    'mape': mape_amount
                },
                'cum': {
                    'mse': mse_cum,
                    'rmse': rmse_cum,
                    'mae': mae_cum,
                    'mape': mape_cum
                }
            },
            'data_summary': df_summary.to_dict()
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
