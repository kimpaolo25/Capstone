from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.seasonal import seasonal_decompose
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

        # Remove rows where CU_M is negative or exceeds the threshold
        df = df[(df['CU_M'] >= 0) & (df['CU_M'] <= 1250)]

        # Set 'Date_column' as index
        df.set_index('Date_column', inplace=True)

        # Resample to monthly and sum Amount and CU_M
        df_monthly = df.resample('M').agg({
            'Amount': 'sum',
            'CU_M': 'sum'
        })

        # ---- First Differencing on Amount ----
        df_monthly['Amount_diff'] = df_monthly['Amount'].diff().dropna()

        # ---- SARIMAX for Amount_diff with fixed order ----
        order_amount = (0, 0, 0)  # Fixed non-seasonal order
        seasonal_order_amount = (1, 0, 0, 12)  # Fixed seasonal order
        model_amount = SARIMAX(df_monthly['Amount_diff'].dropna(), 
                                order=order_amount, 
                                seasonal_order=seasonal_order_amount)
        model_amount_fit = model_amount.fit(disp=False)

        # Forecast for the next 12 months for Amount
        forecast_steps = 12
        forecast_amount_diff = model_amount_fit.get_forecast(steps=forecast_steps)
        forecast_amount_diff_mean = forecast_amount_diff.predicted_mean

        # Reverse the differencing for Amount
        last_amount = df_monthly['Amount'].iloc[-1]
        forecast_amount = [last_amount + forecast_amount_diff_mean[0]]
        for i in range(1, forecast_steps):
            forecast_amount.append(forecast_amount[i-1] + forecast_amount_diff_mean[i])

        # ---- Log Transformation for CU_M with Seasonal Decomposition ----
        df_monthly['CU_M_log'] = np.log1p(df_monthly['CU_M'])  # log1p for handling zeroes

        # Perform seasonal decomposition on the log-transformed CU_M
        seasonal_decomp = seasonal_decompose(df_monthly['CU_M_log'].dropna(), model='add', period=12)
        
        # Use trend and seasonal components
        trend = seasonal_decomp.trend.dropna()
        seasonal = seasonal_decomp.seasonal.dropna()

        # Combine trend and seasonal for modeling
        combined = trend + seasonal
        combined = combined.dropna()  # Remove NaN values after combining

        # First differencing the combined trend and seasonal data
        trend_seasonal_diff = combined.diff().dropna()

        # Fit SARIMAX model for CU_M with fixed order
        order_cum = (0, 0, 0)  # Fixed non-seasonal order
        seasonal_order_cum = (1, 0, 0, 12)  # Fixed seasonal order
        model_cum = SARIMAX(trend_seasonal_diff, order=order_cum,
                             seasonal_order=seasonal_order_cum)
        model_cum_fit = model_cum.fit(disp=False)

        # Forecast for the next 12 months for CU_M
        forecast_cum = model_cum_fit.get_forecast(steps=forecast_steps)
        forecast_cum_diff = forecast_cum.predicted_mean

        # Reverse the differencing for CU_M
        last_cu_m_log = combined.iloc[-1]  # Last value of the combined series
        forecast_cum = [last_cu_m_log + forecast_cum_diff[0]]
        for i in range(1, forecast_steps):
            forecast_cum.append(forecast_cum[i-1] + forecast_cum_diff[i])

        # Apply exponential function to reverse log transformation
        forecast_cum_reversed = np.expm1(forecast_cum)

        # ---- Accuracy metrics ----
        historical_amounts = df_monthly['Amount'].values
        historical_cum = df_monthly['CU_M'].values

        # Calculate accuracy metrics for Amount
        mse_amount = mean_squared_error(historical_amounts[-forecast_steps:], forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(historical_amounts[-forecast_steps:], forecast_amount)
        mape_amount = np.mean(np.abs((historical_amounts[-forecast_steps:] - forecast_amount) / historical_amounts[-forecast_steps:])) * 100

        # Calculate accuracy metrics for CU_M
        mse_cum = mean_squared_error(historical_cum[-forecast_steps:], forecast_cum_reversed)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(historical_cum[-forecast_steps:], forecast_cum_reversed)
        mape_cum = np.mean(np.abs((historical_cum[-forecast_steps:] - forecast_cum_reversed) / historical_cum[-forecast_steps:])) * 100

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + 
                     [(df_monthly.index[-1] + pd.DateOffset(months=i)).strftime('%Y-%m') for i in range(1, forecast_steps + 1)],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount],
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
