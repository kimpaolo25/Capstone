from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from pmdarima import auto_arima
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error, mean_absolute_error
from scipy import stats  # Importing the stats module

app = Flask(__name__)
CORS(app)

# Database URI with no password
DATABASE_URI = 'mysql+mysqlconnector://root:@localhost/prwai_data'
engine = create_engine(DATABASE_URI)

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

        # Remove rows where CU_M is negative
        df = df[df['CU_M'] >= 0]

        # Define the threshold for large values
        threshold = 1250
        df = df[df['CU_M'] <= threshold]

        # Outlier detection and removal using Z-score
        df = df[(np.abs(stats.zscore(df['CU_M'])) < 3)]
        df = df[(np.abs(stats.zscore(df['Amount'])) < 3)]

        # Set 'Date_column' as index for the entire DataFrame
        df.set_index('Date_column', inplace=True)

        # Feature Engineering: Resample to monthly and sum Amount and CU_M
        df_monthly = df.resample('M').agg({
            'Amount': 'sum',
            'CU_M': 'sum'
        })

        # Apply log transformation to 'Amount' and 'CU_M'
        df_monthly['Amount_log'] = np.log(df_monthly['Amount'].replace(0, np.nan))
        df_monthly['CU_M_log'] = np.log(df_monthly['CU_M'].replace(0, np.nan))

        # Calculate moving average
        moving_average_window = 3  # Example: 3-month moving average
        df_monthly['Amount_moving_avg'] = df_monthly['Amount'].rolling(window=moving_average_window).mean()
        df_monthly['CU_M_moving_avg'] = df_monthly['CU_M'].rolling(window=moving_average_window).mean()

        # Apply seasonal differencing to the log-transformed 'Amount' and 'CU_M'
        seasonal_period = 12  # Monthly data, so seasonal period is 12
        df_monthly['Amount_log_seasonal_diff'] = df_monthly['Amount_log'] - df_monthly['Amount_log'].shift(seasonal_period)
        df_monthly['CU_M_log_seasonal_diff'] = df_monthly['CU_M_log'] - df_monthly['CU_M_log'].shift(seasonal_period)

        # Fill NA values for differencing
        df_monthly.fillna(0, inplace=True)

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # ---- ARIMA for Amount_log_seasonal_diff ----
        model_auto_arima_amount = auto_arima(
            train['Amount_log_seasonal_diff'],
            seasonal=False,
            stepwise=True,
            trace=True
        )
        print(f"Best order found for Amount_log_seasonal_diff: {model_auto_arima_amount.order}")

        best_order_amount = model_auto_arima_amount.order
        model_amount = ARIMA(
            train['Amount_log_seasonal_diff'],
            order=best_order_amount
        )
        model_amount_fit = model_amount.fit()

        # Create a forecast for 'Amount_log_seasonal_diff'
        forecast_steps = len(test)
        forecast_amount_log_seasonal_diff = model_amount_fit.get_forecast(steps=forecast_steps)
        forecast_amount_log_seasonal_diff_mean = forecast_amount_log_seasonal_diff.predicted_mean

        # Revert the seasonal differencing and log transformation
        last_observed_value_amount_log = df_monthly['Amount_log'].iloc[-1]
        forecast_amount_log = forecast_amount_log_seasonal_diff_mean + df_monthly['Amount_log'].iloc[-len(forecast_amount_log_seasonal_diff_mean):].values
        forecast_amount = np.exp(forecast_amount_log)

        # ---- ARIMA for CU_M_log_seasonal_diff ----
        model_auto_arima_cum = auto_arima(
            train['CU_M_log_seasonal_diff'],
            seasonal=False,
            stepwise=True,
            trace=True
        )
        print(f"Best order found for CU_M_log_seasonal_diff: {model_auto_arima_cum.order}")

        best_order_cum = model_auto_arima_cum.order
        model_cum = ARIMA(
            train['CU_M_log_seasonal_diff'],
            order=best_order_cum
        )
        model_cum_fit = model_cum.fit()

        # Create a forecast for 'CU_M_log_seasonal_diff'
        forecast_cum_log_seasonal_diff = model_cum_fit.get_forecast(steps=forecast_steps)
        forecast_cum_log_seasonal_diff_mean = forecast_cum_log_seasonal_diff.predicted_mean

        # Revert the seasonal differencing and log transformation
        last_observed_value_cum_log = df_monthly['CU_M_log'].iloc[-1]
        forecast_cum_log = forecast_cum_log_seasonal_diff_mean + df_monthly['CU_M_log'].iloc[-len(forecast_cum_log_seasonal_diff_mean):].values
        forecast_cum = np.exp(forecast_cum_log)

        # Create future dates for Amount and CU_M forecasts
        future_dates_amount = pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=forecast_steps, freq='ME')
        future_dates_cum = pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=forecast_steps, freq='ME')

        # Align forecast with actuals
        test_amount = test['Amount']
        test_cum = test['CU_M']
        forecast_amount_aligned = forecast_amount[:len(test_amount)]
        forecast_cum_aligned = forecast_cum[:len(test_cum)]

        # Define MAPE calculation function
        def mean_absolute_percentage_error(y_true, y_pred):
            return np.mean(np.abs((y_true - y_pred) / y_true)) * 100

        # Calculate accuracy metrics for Amount
        mse_amount = mean_squared_error(test_amount, forecast_amount_aligned)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount_aligned)
        mape_amount = mean_absolute_percentage_error(test_amount, forecast_amount_aligned)

        # Calculate accuracy metrics for CU_M
        mse_cum = mean_squared_error(test_cum, forecast_cum_aligned)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum_aligned)
        mape_cum = mean_absolute_percentage_error(test_cum, forecast_cum_aligned)

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in future_dates_amount],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum.tolist()],
            'accuracy_metrics': {
                'amount': {
                    'MSE': mse_amount,
                    'RMSE': rmse_amount,
                    'MAE': mae_amount,
                    'MAPE': mape_amount
                },
                'CU_M': {
                    'MSE': mse_cum,
                    'RMSE': rmse_cum,
                    'MAE': mae_cum,
                    'MAPE': mape_cum
                }
            }
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n" + traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
