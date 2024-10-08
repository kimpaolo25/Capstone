from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from pmdarima import auto_arima
from statsmodels.tsa.statespace.sarimax import SARIMAX  # Changed to SARIMAX for SARIMA
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

        # Convert 'Date_column' to datetime with the specified format
        df['Date_column'] = pd.to_datetime(df['Date_column'], format='%Y-%b')

        # Handle missing values
        df.fillna(0, inplace=True)

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

        # Apply seasonal differencing to the log-transformed 'Amount' and 'CU_M'
        seasonal_period = 12  # Monthly data, so seasonal period is 12
        df_monthly['Amount_log_seasonal_diff'] = df_monthly['Amount_log'] - df_monthly['Amount_log'].shift(seasonal_period)
        df_monthly['CU_M_log_seasonal_diff'] = df_monthly['CU_M_log'] - df_monthly['CU_M_log'].shift(seasonal_period)

        # Use the existing data for forecasting, no need to drop NA here
        df_monthly.fillna(0, inplace=True)  # Fill NA values for differencing, if necessary

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Print train and test sizes for debugging
        print(f"Training data size: {len(train)}, Testing data size: {len(test)}")

        # ---- SARIMA for Amount_log_seasonal_diff ----
        # Fit auto_arima model to find the best order for 'Amount_log_seasonal_diff'
        model_auto_arima_amount = auto_arima(
            train['Amount_log_seasonal_diff'],
            seasonal=True,  # Enable seasonality
            m=12,  # Seasonal period (12 months)
            stepwise=True,
            trace=True
        )

        # Print the best order found by auto_arima for 'Amount_log_seasonal_diff'
        print(f"Best SARIMA order for Amount_log_seasonal_diff: {model_auto_arima_amount.order}, seasonal_order: {model_auto_arima_amount.seasonal_order}")

        # Use the best order found by auto_arima
        best_order_amount = model_auto_arima_amount.order
        best_seasonal_order_amount = model_auto_arima_amount.seasonal_order

        # Fit SARIMA model for 'Amount_log_seasonal_diff'
        model_amount = SARIMAX(
            train['Amount_log_seasonal_diff'],
            order=best_order_amount,
            seasonal_order=best_seasonal_order_amount
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

        future_dates_amount = pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=forecast_steps, freq='M')

        # ---- SARIMA for CU_M_log_seasonal_diff ----
        # Fit auto_arima model to find the best order for 'CU_M_log_seasonal_diff'
        model_auto_arima_cum = auto_arima(
            train['CU_M_log_seasonal_diff'],
            seasonal=True,  # Enable seasonality
            m=12,  # Seasonal period (12 months)
            stepwise=True,
            trace=True
        )

        # Print the best order found by auto_arima for 'CU_M_log_seasonal_diff'
        print(f"Best SARIMA order for CU_M_log_seasonal_diff: {model_auto_arima_cum.order}, seasonal_order: {model_auto_arima_cum.seasonal_order}")

        # Use the best order found by auto_arima
        best_order_cum = model_auto_arima_cum.order
        best_seasonal_order_cum = model_auto_arima_cum.seasonal_order

        # Fit SARIMA model for 'CU_M_log_seasonal_diff'
        model_cum = SARIMAX(
            train['CU_M_log_seasonal_diff'],
            order=best_order_cum,
            seasonal_order=best_seasonal_order_cum
        )
        model_cum_fit = model_cum.fit()

        # Create a forecast for 'CU_M_log_seasonal_diff'
        forecast_cum_log_seasonal_diff = model_cum_fit.get_forecast(steps=forecast_steps)
        forecast_cum_log_seasonal_diff_mean = forecast_cum_log_seasonal_diff.predicted_mean

        # Revert the seasonal differencing and log transformation
        last_observed_value_cum_log = df_monthly['CU_M_log'].iloc[-1]
        forecast_cum_log = forecast_cum_log_seasonal_diff_mean + df_monthly['CU_M_log'].iloc[-len(forecast_cum_log_seasonal_diff_mean):].values
        forecast_cum = np.exp(forecast_cum_log)

        future_dates_cum = pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=forecast_steps, freq='M')

        # Accuracy checking using testing data
        test_amount = test['Amount']
        test_cum = test['CU_M']

        # Align forecast with actuals
        forecast_amount_aligned = forecast_amount[:len(test_amount)]
        forecast_cum_aligned = forecast_cum[:len(test_cum)]

        mse_amount = mean_squared_error(test_amount, forecast_amount_aligned)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount_aligned)

        mse_cum = mean_squared_error(test_cum, forecast_cum_aligned)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum_aligned)

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in future_dates_amount],
            'historical_amounts': [float(value) for value in np.exp(df_monthly['Amount_log'].replace(np.nan, 0)).tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount.tolist()],
            'historical_cum': [float(value) for value in np.exp(df_monthly['CU_M_log'].replace(np.nan, 0)).tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum.tolist()],
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
