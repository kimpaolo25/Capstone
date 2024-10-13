from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from pmdarima import auto_arima
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.metrics import mean_squared_error, mean_absolute_error

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

        # Convert 'Date_column' to datetime
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

        # Log transformation
        df_monthly['Log_Amount'] = np.log(df_monthly['Amount'].replace(0, np.nan)).dropna()
        df_monthly['Log_CU_M'] = np.log(df_monthly['CU_M'].replace(0, np.nan)).dropna()

        # Add df.describe() after the feature engineering
        df_summary = df_monthly.describe()
        print("Data summary after feature engineering:", df_summary)

        # Split data into training and testing sets (80% training, 20% testing)
        train_size = int(len(df_monthly) * 0.8)
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # ---- ARIMA for Log_Amount ----
        model_auto_arima_amount = auto_arima(train['Log_Amount'].dropna(), seasonal=False, stepwise=True, trace=True)
        best_order_amount = model_auto_arima_amount.order
        model_amount = ARIMA(train['Log_Amount'].dropna(), order=best_order_amount)
        model_amount_fit = model_amount.fit()

        # ---- Exponential Smoothing for Amount ----
        model_exp_smoothing_amount = ExponentialSmoothing(train['Log_Amount'].dropna(), trend='add', seasonal=None)
        model_exp_fit_amount = model_exp_smoothing_amount.fit()

        # Forecast on the test data length
        forecast_steps = len(test)
        forecast_amount_arima = model_amount_fit.forecast(steps=forecast_steps)
        forecast_amount_exp = model_exp_fit_amount.forecast(steps=forecast_steps)

        # Combine forecasts (simple average)
        forecast_amount_combined = np.exp((forecast_amount_arima + forecast_amount_exp) / 2)

        # ---- ARIMA for Log_CU_M ----
        model_auto_arima_cum = auto_arima(train['Log_CU_M'].dropna(), seasonal=False, stepwise=True, trace=True)
        best_order_cum = model_auto_arima_cum.order
        model_cum = ARIMA(train['Log_CU_M'].dropna(), order=best_order_cum)
        model_cum_fit = model_cum.fit()

        # ---- Exponential Smoothing for CU_M ----
        model_exp_smoothing_cum = ExponentialSmoothing(train['Log_CU_M'].dropna(), trend='add', seasonal=None)
        model_exp_fit_cum = model_exp_smoothing_cum.fit()

        # Forecast on the test data length
        forecast_cum_arima = model_cum_fit.forecast(steps=forecast_steps)
        forecast_cum_exp = model_exp_fit_cum.forecast(steps=forecast_steps)

        # Combine forecasts (simple average)
        forecast_cum_combined = np.exp((forecast_cum_arima + forecast_cum_exp) / 2)

        # Get the testing data
        test_amount = test['Amount']
        test_cum = test['CU_M']

        # Align forecast with actuals (ensure correct length)
        forecast_amount_aligned = forecast_amount_combined[:len(test_amount)]
        forecast_cum_aligned = forecast_cum_combined[:len(test_cum)]

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
            'data_summary': df_summary.to_dict()  # Include the summary in the response
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
