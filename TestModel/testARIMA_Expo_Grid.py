from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from pmdarima import auto_arima
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.model_selection import ParameterGrid

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
        seasonal_amount = decomposition_amount.seasonal

        decomposition_cum = seasonal_decompose(train['CU_M'], model='add')
        trend_cum = decomposition_cum.trend.dropna()
        seasonal_cum = decomposition_cum.seasonal

        # Grid Search for ARIMA
        param_grid_arima = {'order': [(p, d, q) for p in range(0, 3) for d in range(0, 2) for q in range(0, 3)]}
        best_aic = float("inf")
        best_order_amount = None

        for params in ParameterGrid(param_grid_arima):
            try:
                model = ARIMA(trend_amount.dropna(), order=params['order'])
                model_fit = model.fit()
                if model_fit.aic < best_aic:
                    best_aic = model_fit.aic
                    best_order_amount = params['order']
            except Exception as e:
                continue

        # Fit the best ARIMA model
        model_amount = ARIMA(trend_amount.dropna(), order=best_order_amount)
        model_amount_fit = model_amount.fit()

        # Fit Exponential Smoothing
        model_exp_smoothing_amount = ExponentialSmoothing(trend_amount, trend='add', seasonal='add', seasonal_periods=12)
        model_exp_fit_amount = model_exp_smoothing_amount.fit()

        # Forecasting
        forecast_steps = len(test)
        forecast_amount_arima = model_amount_fit.forecast(steps=forecast_steps)
        forecast_amount_exp = model_exp_fit_amount.forecast(steps=forecast_steps)

        # Combine forecasts (simple average)
        forecast_amount_combined = (forecast_amount_arima + forecast_amount_exp) / 2

        # Repeat for CU_M
        param_grid_cum = {'order': [(p, d, q) for p in range(0, 3) for d in range(0, 2) for q in range(0, 3)]}
        best_aic_cum = float("inf")
        best_order_cum = None

        for params in ParameterGrid(param_grid_cum):
            try:
                model = ARIMA(trend_cum.dropna(), order=params['order'])
                model_fit = model.fit()
                if model_fit.aic < best_aic_cum:
                    best_aic_cum = model_fit.aic
                    best_order_cum = params['order']
            except Exception as e:
                continue

        model_cum = ARIMA(trend_cum.dropna(), order=best_order_cum)
        model_cum_fit = model_cum.fit()

        model_exp_smoothing_cum = ExponentialSmoothing(trend_cum, trend='add', seasonal='add', seasonal_periods=12)
        model_exp_fit_cum = model_exp_smoothing_cum.fit()

        forecast_cum_arima = model_cum_fit.forecast(steps=forecast_steps)
        forecast_cum_exp = model_exp_fit_cum.forecast(steps=forecast_steps)

        forecast_cum_combined = (forecast_cum_arima + forecast_cum_exp) / 2

        test_amount = test['Amount']
        test_cum = test['CU_M']

        forecast_amount_aligned = forecast_amount_combined[:len(test_amount)]
        forecast_cum_aligned = forecast_cum_combined[:len(test_cum)]

        mse_amount = mean_squared_error(test_amount, forecast_amount_aligned)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount_aligned)

        mse_cum = mean_squared_error(test_cum, forecast_cum_aligned)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum_aligned)

        mape_amount = np.mean(np.abs((test_amount - forecast_amount_aligned) / test_amount)) * 100
        mape_cum = np.mean(np.abs((test_cum - forecast_cum_aligned) / test_cum)) * 100

        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

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
