from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from pmdarima import auto_arima
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings

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

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Print train and test sizes for debugging
        print(f"Training data size: {len(train)}, Testing data size: {len(test)}")

        # Feature Engineering for Amount
        # Decompose the series
        decomposition = seasonal_decompose(train['Amount'], model='additive', period=12)
        trend = decomposition.trend.dropna()

        # Remove trend
        trend_removed = train['Amount'] - trend
        trend_removed = trend_removed.dropna()

        # Fit auto_arima model to find the best order for Amount
        model_auto_arima_amount = auto_arima(
            trend_removed,
            seasonal=False,
            stepwise=True,
            trace=True
        )

        # Print the best order found by auto_arima for Amount
        print(f"Best order found for Amount: {model_auto_arima_amount.order}")

        # Use the best order found by auto_arima
        best_order_amount = model_auto_arima_amount.order

        # Fit ARIMA model to the trend-removed data
        model_amount = ARIMA(trend_removed, order=best_order_amount)
        model_amount_fit = model_amount.fit()

        # Forecast future values for Amount
        future_dates = pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), end='2025-12', freq='MS')
        
        # Ensure the steps match the number of future dates
        steps = len(future_dates)
        forecast_amount = model_amount_fit.get_forecast(steps=steps)
        forecast_amount_values = forecast_amount.predicted_mean

        # Reverse differencing for the forecasted values
        last_known_amount = df_monthly['Amount'].iloc[-1]
        forecast_amount_original_scale = last_known_amount + forecast_amount_values.cumsum()

        # Accuracy checking for Amount using testing data
        test_amount = test['Amount']

        # Calculate accuracy metrics for Amount
        mse_amount = mean_squared_error(test_amount, forecast_amount_original_scale[:len(test)])
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount_original_scale[:len(test)])

        # Print the accuracy metrics for Amount
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}")

        # Forecast for CU_M using auto_arima and SARIMAX
        model_auto_arima_cum = auto_arima(
            train['CU_M'],
            exogenous=train['Amount'],
            seasonal=False,
            stepwise=True,
            trace=True
        )

        # Print the best order found by auto_arima for CU_M
        print(f"Best order found for CU_M: {model_auto_arima_cum.order}")

        # Use the best order found by auto_arima
        best_order_cum = model_auto_arima_cum.order

        # Initialize lists to store the rolling forecasts for CU_M
        rolling_forecast_cum = []

        # Rolling forecast loop for CU_M
        for t in range(len(test)):
            # Update train set with one more observation
            current_train_cum = pd.concat([train['CU_M'], test['CU_M'][:t]])
            current_train_amount = pd.concat([train['Amount'], test['Amount'][:t]])

            # Fit SARIMAX model for CU_M with exogenous variables
            model_cum = SARIMAX(
                current_train_cum,
                exog=current_train_amount,
                order=best_order_cum,
                seasonal_order=(0, 0, 0, 0),  # Adjust if needed
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            model_cum_fit = model_cum.fit(disp=False)

            # Make one-step-ahead forecast
            forecast_cum = model_cum_fit.forecast(steps=1, exog=test['Amount'][t:t+1])
            rolling_forecast_cum.append(forecast_cum.values[0])

        # Accuracy checking using testing data for CU_M
        test_cum = test['CU_M']

        # Calculate accuracy metrics for CU_M
        mse_cum = mean_squared_error(test_cum, rolling_forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, rolling_forecast_cum)

        # Print the accuracy metrics for CU_M
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in test.index] + [date.strftime('%Y-%m') for date in future_dates],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount_original_scale] + [None] * len(future_dates),
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in rolling_forecast_cum] + [None] * len(future_dates),
            'accuracy_amount': {'MSE': mse_amount, 'RMSE': rmse_amount, 'MAE': mae_amount},
            'accuracy_cum': {'MSE': mse_cum, 'RMSE': rmse_cum, 'MAE': mae_cum}
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
