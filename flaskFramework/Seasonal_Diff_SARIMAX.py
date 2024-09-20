from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.statespace.sarimax import SARIMAX
from pmdarima import auto_arima
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

        # Print df_monthly for debugging
        print("Monthly aggregated data:")
        print(df_monthly)

        # Apply seasonal differencing to 'Amount' and 'CU_M' to make them stationary
        seasonal_period = 12  # Assuming monthly data with yearly seasonality
        df_monthly['Amount_diff'] = df_monthly['Amount'].diff(seasonal_period).dropna()
        df_monthly['CU_M_diff'] = df_monthly['CU_M'].diff(seasonal_period).dropna()

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Print train and test sizes for debugging
        print(f"Training data size: {len(train)}, Testing data size: {len(test)}")

        # ---- ARIMA for Amount_diff ----
        # Fit auto_arima model to find the best order for 'Amount_diff'
        model_auto_arima_amount = auto_arima(
            train['Amount_diff'].dropna(),
            seasonal=False,  # Adjust if needed
            stepwise=True,
            trace=True
        )

        # Print the best order found by auto_arima for 'Amount_diff'
        print(f"Best order found for Amount_diff: {model_auto_arima_amount.order}")

        # Use the best order found by auto_arima
        best_order_amount = model_auto_arima_amount.order

        # Fit SARIMAX model for 'Amount_diff' with seasonal differencing
        model_amount = SARIMAX(
            train['Amount_diff'].dropna(),
            order=best_order_amount,
            seasonal_order=(0, 1, 0, seasonal_period),  # Seasonal differencing order (0, 1, 0, 12)
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        model_amount_fit = model_amount.fit()

        # Create a forecast for 'Amount_diff'
        forecast_steps = len(test)
        forecast_amount_diff = model_amount_fit.get_forecast(steps=forecast_steps)
        forecast_amount_diff_mean = forecast_amount_diff.predicted_mean

        # Revert the differencing to get the original scale forecast
        forecast_amount = forecast_amount_diff_mean + df_monthly['Amount'].shift(seasonal_period)[-forecast_steps:].values

        future_dates_amount = [test.index[i] for i in range(forecast_steps)]

        # ---- ARIMA for CU_M_diff ----
        # Fit auto_arima model to find the best order for 'CU_M_diff'
        model_auto_arima_cum = auto_arima(
            train['CU_M_diff'].dropna(),
            seasonal=False,  # Adjust if needed
            stepwise=True,
            trace=True
        )

        # Print the best order found by auto_arima for 'CU_M_diff'
        print(f"Best order found for CU_M_diff: {model_auto_arima_cum.order}")

        # Use the best order found by auto_arima
        best_order_cum = model_auto_arima_cum.order

        # Fit SARIMAX model for 'CU_M_diff' with seasonal differencing
        model_cum = SARIMAX(
            train['CU_M_diff'].dropna(),
            order=best_order_cum,
            seasonal_order=(0, 1, 0, seasonal_period),  # Seasonal differencing for CU_M
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        model_cum_fit = model_cum.fit()

        # Create a forecast for 'CU_M_diff'
        forecast_cum_diff = model_cum_fit.get_forecast(steps=forecast_steps)
        forecast_cum_diff_mean = forecast_cum_diff.predicted_mean

        # Revert the differencing to get the original scale forecast for CU_M
        forecast_cum = forecast_cum_diff_mean + df_monthly['CU_M'].shift(seasonal_period)[-forecast_steps:].values

        future_dates_cum = [test.index[i] for i in range(forecast_steps)]

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
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum.tolist()],
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
