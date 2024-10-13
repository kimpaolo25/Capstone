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

# Database URI with no password
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

        # Seasonal Decomposition
        decomposition_amount = seasonal_decompose(df_monthly['Amount'], model='add')
        trend_amount = decomposition_amount.trend.dropna()

        decomposition_cum = seasonal_decompose(df_monthly['CU_M'], model='add')
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

        # Fit models for Amount and CU_M on the entire dataset
        forecast_amount_arima, forecast_amount_exp, best_order_amount = fit_models_and_forecast(trend_amount, 12)
        forecast_cum_arima, forecast_cum_exp, best_order_cum = fit_models_and_forecast(trend_cum, 12)

        # Combine forecasts using weighted averages
        weight_arima = 0.6
        weight_exp = 0.4
        forecast_amount_combined = weight_arima * forecast_amount_arima + weight_exp * forecast_amount_exp
        forecast_cum_combined = weight_arima * forecast_cum_arima + weight_exp * forecast_cum_exp

        # Create future dates for the next 12 months
        future_dates_amount = pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=12, freq='M')

        # For error metrics, we need historical data for the next 12 months
        historical_amounts_future = df_monthly['Amount'].values[-12:] if len(df_monthly) >= 12 else [0] * 12
        historical_cum_future = df_monthly['CU_M'].values[-12:] if len(df_monthly) >= 12 else [0] * 12

        # Calculate error metrics for Amount
        mse_amount = mean_squared_error(historical_amounts_future, forecast_amount_combined)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(historical_amounts_future, forecast_amount_combined)
        mape_amount = np.mean(np.abs((historical_amounts_future - forecast_amount_combined) / historical_amounts_future)) * 100

        # Calculate error metrics for CU_M
        mse_cum = mean_squared_error(historical_cum_future, forecast_cum_combined)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(historical_cum_future, forecast_cum_combined)
        mape_cum = np.mean(np.abs((historical_cum_future - forecast_cum_combined) / historical_cum_future)) * 100

        # Print the accuracy metrics
        print(f"Amount Forecast - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Forecast - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")
        
        # Add this block to describe the test set
        dataframe = df.describe()
        print("Testing Data Summary:", dataframe)

        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in future_dates_amount],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount_combined.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum_combined.tolist()],
            'data_summary': df_summary.to_dict(),
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500



if __name__ == '__main__':
    app.run(port=5000, debug=True)
