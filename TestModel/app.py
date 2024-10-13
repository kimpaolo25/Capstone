from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.statespace.sarimax import SARIMAX
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
        print("Data fetched from database:", df.tail())

        # Convert 'Date_column' to datetime with the specified format
        df['Date_column'] = pd.to_datetime(df['Date_column'], format='%Y-%b')

        # Handle missing values
        df.fillna(0, inplace=True)

        # Remove rows where CU_M is negative or exceeds the threshold
        df = df[(df['CU_M'] >= 0) & (df['CU_M'] <= 1250)]

        # Set 'Date_column' as index
        df.set_index('Date_column', inplace=True)

        # Resample to monthly and sum Amount and CU_M
        df_monthly = df.resample('M').agg({
            'Amount': 'sum',
            'CU_M': 'sum'
        })

        # Data summary
        df_summary = df_monthly.describe()
        print("Data summary after feature engineering:", df_summary)

        # Use fixed orders for SARIMAX
        order_amount = (1, 0, 0)
        seasonal_order_amount = (1, 0, 0, 12)

        order_cum = (1, 0, 2)
        seasonal_order_cum = (1, 0, 0, 12)

        # ---- Log Transformation for Amount ----
        df_monthly['Amount_log'] = np.log1p(df_monthly['Amount'])  # log1p for handling zeroes
        model_amount = SARIMAX(df_monthly['Amount_log'], order=order_amount, seasonal_order=seasonal_order_amount)
        model_amount_fit = model_amount.fit(disp=False)

        # Forecast for the next 12 months
        forecast_steps = 12
        forecast_amount = model_amount_fit.get_forecast(steps=forecast_steps)
        forecast_amount_mean = forecast_amount.predicted_mean

        # ---- Apply Moving Average for CU_M ----
        window_size = 3  # Change this window size as needed
        df_monthly['CU_M_ma'] = df_monthly['CU_M'].rolling(window=window_size).mean().fillna(df_monthly['CU_M'])  # Apply moving average

        # Log transformation for CU_M (after applying moving average)
        df_monthly['CU_M_log'] = np.log1p(df_monthly['CU_M_ma'])  # log1p for handling zeroes
        model_cum = SARIMAX(df_monthly['CU_M_log'], order=order_cum, seasonal_order=seasonal_order_cum)
        model_cum_fit = model_cum.fit(disp=False)

        # Forecast for the next 12 months
        forecast_cum = model_cum_fit.get_forecast(steps=forecast_steps)
        forecast_cum_mean = forecast_cum.predicted_mean

        # Reverse the log transformations for Amount and CU_M
        forecast_amount_reversed = np.expm1(forecast_amount_mean)  # expm1 for reversing log1p
        forecast_cum_reversed = np.expm1(forecast_cum_mean)  # expm1 for reversing log1p

        # Historical amounts for accuracy metrics
        historical_amounts = df_monthly['Amount'].values
        historical_cum = df_monthly['CU_M'].values

        # Calculate accuracy metrics for Amount
        mse_amount = mean_squared_error(historical_amounts[-forecast_steps:], forecast_amount_reversed)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(historical_amounts[-forecast_steps:], forecast_amount_reversed)
        mape_amount = np.mean(np.abs((historical_amounts[-forecast_steps:] - forecast_amount_reversed) / historical_amounts[-forecast_steps:])) * 100

        # Calculate accuracy metrics for CU_M
        mse_cum = mean_squared_error(historical_cum[-forecast_steps:], forecast_cum_reversed)  # No skip
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(historical_cum[-forecast_steps:], forecast_cum_reversed)
        mape_cum = np.mean(np.abs((historical_cum[-forecast_steps:] - forecast_cum_reversed) / historical_cum[-forecast_steps:])) * 100

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")
        
        print(df_summary)

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + 
                     [(df_monthly.index[-1] + pd.DateOffset(months=i)).strftime('%Y-%m') for i in range(1, forecast_steps + 1)],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount_reversed],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum_reversed],
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
