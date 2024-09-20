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

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Fit auto_arima model to find the best order for 'Amount'
        model_auto_arima_amount = auto_arima(
            train['Amount'],
            exogenous=train['CU_M'],
            seasonal=False,  # Adjust if needed
            stepwise=True,
            trace=True
        )

        best_order_amount = model_auto_arima_amount.order

        # Fit auto_arima model to find the best order for 'CU_M'
        model_auto_arima_cum = auto_arima(
            train['CU_M'],
            exogenous=train['Amount'],
            seasonal=False,  # Adjust if needed
            stepwise=True,
            trace=True
        )

        best_order_cum = model_auto_arima_cum.order

        # Initialize lists to store the rolling forecasts
        rolling_forecast_amount = []
        rolling_forecast_cum = []

        # Rolling forecast loop
        for t in range(len(test)):
            current_train_amount = pd.concat([train['Amount'], test['Amount'][:t]])
            current_train_cum = pd.concat([train['CU_M'], test['CU_M'][:t]])

            model_amount = SARIMAX(
                current_train_amount,
                exog=current_train_cum,
                order=best_order_amount,
                seasonal_order=(0, 0, 0, 0),
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            model_amount_fit = model_amount.fit(disp=False)

            model_cum = SARIMAX(
                current_train_cum,
                exog=current_train_amount,
                order=best_order_cum,
                seasonal_order=(0, 0, 0, 0),
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            model_cum_fit = model_cum.fit(disp=False)

            forecast_amount = model_amount_fit.forecast(steps=1, exog=test['CU_M'][t:t+1])
            forecast_cum = model_cum_fit.forecast(steps=1, exog=test['Amount'][t:t+1])

            rolling_forecast_amount.append(forecast_amount.values[0])
            rolling_forecast_cum.append(forecast_cum.values[0])

        # Forecast future dates
        future_dates = pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), end='2025-12', freq='MS')

        # First, forecast CU_M for the future periods
        future_exog_amount = df_monthly['Amount'].values[-len(future_dates):]
        forecast_cum_future = model_cum_fit.get_forecast(steps=len(future_dates), exog=future_exog_amount)
        forecast_cum_values = forecast_cum_future.predicted_mean

        # Next, forecast Amount for the future periods using the forecasted CU_M
        forecast_amount_future = model_amount_fit.get_forecast(steps=len(future_dates), exog=forecast_cum_values)
        forecast_amount_values = forecast_amount_future.predicted_mean

        # Reverse differencing for the forecasted values
        last_known_amount = df_monthly['Amount'].iloc[-1]
        forecast_amount_original_scale = last_known_amount + forecast_amount_values.cumsum()

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in test.index] + [date.strftime('%Y-%m') for date in future_dates],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in rolling_forecast_amount] + [float(value) for value in forecast_amount_original_scale],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in rolling_forecast_cum] + [float(value) for value in forecast_cum_values],
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)