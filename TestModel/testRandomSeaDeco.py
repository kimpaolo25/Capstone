from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.metrics import mean_squared_error, mean_absolute_error
import random

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
        # Fetch data from the database
        query = "SELECT * FROM customers"
        df = pd.read_sql(query, engine)
        print("Data fetched from database:", df.head())

        # Convert 'Date_column' to datetime with the specified format
        df['Date_column'] = pd.to_datetime(df['Date_column'], format='%Y-%b')

        # Handle missing values
        df.fillna(0, inplace=True)

        # Remove rows where CU.M. is negative
        df = df[df['CU_M'] >= 0]

        # Define the threshold for large values
        threshold = 1250

        # Remove rows where CU.M. values exceed the threshold
        df = df[df['CU_M'] <= threshold]

        # Set 'Date_column' as index for the entire DataFrame
        df.set_index('Date_column', inplace=True)

        # Feature Engineering: Resample to monthly and sum Amount and CU_M
        df_monthly = df.resample('M').agg({
            'Amount': 'sum',
            'CU_M': 'sum'
        })

        # Seasonal Decomposition
        decomposition_amount = seasonal_decompose(df_monthly['Amount'], model='additive')
        decomposition_cum = seasonal_decompose(df_monthly['CU_M'], model='additive')

        # Extract trend and seasonality
        df_monthly['Trend_Amount'] = decomposition_amount.trend
        df_monthly['Trend_CU_M'] = decomposition_cum.trend

        # Handle NaNs resulting from decomposition
        df_monthly.dropna(inplace=True)

        # Split data into training and testing sets (80% training, 20% testing)
        train_size = int(len(df_monthly) * 0.8)
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # ---- Random Search for ARIMA for Trend_Amount ----
        best_mse_amount = float('inf')
        best_order_amount = None

        for _ in range(100):  # Number of random trials
            p = random.randint(0, 3)
            d = random.randint(0, 1)
            q = random.randint(0, 3)
            try:
                model_amount = ARIMA(train['Trend_Amount'].dropna(), order=(p, d, q))
                model_amount_fit = model_amount.fit()
                mse = mean_squared_error(train['Trend_Amount'].dropna(), model_amount_fit.fittedvalues)

                if mse < best_mse_amount:
                    best_mse_amount = mse
                    best_order_amount = (p, d, q)

            except Exception:
                continue

        print("Best ARIMA order for Amount:", best_order_amount)

        # Fit best ARIMA model
        model_amount = ARIMA(train['Trend_Amount'].dropna(), order=best_order_amount)
        model_amount_fit = model_amount.fit()

        # Forecast on the test data length
        forecast_steps = len(test)
        forecast_amount_diff = model_amount_fit.get_forecast(steps=forecast_steps)
        forecast_amount = forecast_amount_diff.predicted_mean

        # ---- Random Search for ARIMA for Trend_CU_M ----
        best_mse_cum = float('inf')
        best_order_cum = None

        for _ in range(100):  # Number of random trials
            p = random.randint(0, 3)
            d = random.randint(0, 1)
            q = random.randint(0, 3)
            try:
                model_cum = ARIMA(train['Trend_CU_M'].dropna(), order=(p, d, q))
                model_cum_fit = model_cum.fit()
                mse = mean_squared_error(train['Trend_CU_M'].dropna(), model_cum_fit.fittedvalues)

                if mse < best_mse_cum:
                    best_mse_cum = mse
                    best_order_cum = (p, d, q)

            except Exception:
                continue

        print("Best ARIMA order for CU_M:", best_order_cum)

        # Fit best ARIMA model
        model_cum = ARIMA(train['Trend_CU_M'].dropna(), order=best_order_cum)
        model_cum_fit = model_cum.fit()

        # Forecast on the test data length
        forecast_cum_diff = model_cum_fit.get_forecast(steps=forecast_steps)
        forecast_cum = forecast_cum_diff.predicted_mean

        # Get the testing data
        test_amount = test['Amount']
        test_cum = test['CU_M']

        # Align forecast with actuals (ensure correct length)
        forecast_amount_aligned = forecast_amount[:len(test_amount)]
        forecast_cum_aligned = forecast_cum[:len(test_cum)]

        # Calculate Accuracy Metrics
        mse_amount = mean_squared_error(test_amount, forecast_amount_aligned)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount_aligned)

        mse_cum = mean_squared_error(test_cum, forecast_cum_aligned)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum_aligned)

        # Calculate MAPE
        mape_amount = np.mean(np.abs((test_amount - forecast_amount_aligned) / test_amount)) * 100
        mape_cum = np.mean(np.abs((test_cum - forecast_cum_aligned) / test_cum)) * 100

        # Print the accuracy metrics for testing evaluation
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

        # Prepare the response to visualize only the testing and forecasted data, and include accuracy
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
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
