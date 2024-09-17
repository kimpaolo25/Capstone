from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose

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
        query = """
        SELECT * FROM customers
        """
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

        # Forecasting Amount
        # Apply log transformation to Amount
        df_monthly['Log_Amount'] = np.log(df_monthly['Amount'].replace(0, np.nan))  # Replace 0 with NaN to avoid log(0)

        # Decompose the series to remove trend (using Log_Amount)
        decomposition = seasonal_decompose(df_monthly['Log_Amount'].dropna(), model='additive', period=12)
        trend = decomposition.trend.dropna()

        # Remove the trend to work with stationarity
        trend_removed = df_monthly['Log_Amount'] - trend
        trend_removed = trend_removed.dropna()

        # Fit ARIMA model on trend-removed (stationary) data
        model_income = ARIMA(trend_removed, exog=df_monthly['CU_M'].loc[trend_removed.index], order=(4, 0, 0))
        model_income_fit = model_income.fit()

        # Create a forecast
        forecast_steps = 15  # Updated to forecast up to December 2025
        forecast_trend_removed = model_income_fit.forecast(steps=forecast_steps, exog=df_monthly['CU_M'].iloc[-forecast_steps:])

        # Revert forecast to original scale by adding back the trend and applying exp
        trend_future = trend[-forecast_steps:].values  # Use last observed trend as future trend
        if len(trend_future) < forecast_steps:
            trend_future = np.pad(trend_future, (0, forecast_steps - len(trend_future)), 'constant', constant_values=(0))
        forecast_log_income = forecast_trend_removed + trend_future
        forecast_income = np.exp(forecast_log_income)  # Revert back to original scale

        future_dates_income = [df_monthly.index[-1] + pd.DateOffset(months=i) for i in range(1, forecast_steps + 1)]

        # Forecasting CU_M
        # Decompose CU_M to remove trend and seasonality
        decomposition_cum = seasonal_decompose(df_monthly['CU_M'], model='additive', period=12)
        trend_cum = decomposition_cum.trend.dropna()
        seasonal_cum = decomposition_cum.seasonal.dropna()

        # Remove trend and seasonal components from CU_M
        trend_seasonal_removed_cum = df_monthly['CU_M'] - trend_cum - seasonal_cum
        trend_seasonal_removed_cum = trend_seasonal_removed_cum.dropna()

        # Fit ARIMA model on trend-seasonal-removed (stationary) data
        model_cum = ARIMA(
            trend_seasonal_removed_cum,
            exog=df_monthly['Amount'].loc[trend_seasonal_removed_cum.index],
            order=(1, 0, 0)
        )
        model_cum_fit = model_cum.fit()

        # Create a forecast
        forecast_trend_seasonal_removed_cum = model_cum_fit.forecast(steps=forecast_steps, exog=df_monthly['Amount'].iloc[-forecast_steps:])

        # Revert forecast to original scale by adding back the trend and seasonal components
        trend_future_cum = trend_cum[-forecast_steps:].values
        seasonal_future_cum = seasonal_cum[-forecast_steps:].values
        if len(trend_future_cum) < forecast_steps:
            trend_future_cum = np.pad(trend_future_cum, (0, forecast_steps - len(trend_future_cum)), 'constant', constant_values=(0))
            seasonal_future_cum = np.pad(seasonal_future_cum, (0, forecast_steps - len(seasonal_future_cum)), 'constant', constant_values=(0))
        forecast_cum = forecast_trend_seasonal_removed_cum + trend_future_cum + seasonal_future_cum

        future_dates_cum = [df_monthly.index[-1] + pd.DateOffset(months=i) for i in range(1, forecast_steps + 1)]

        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in future_dates_income],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_income.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum.tolist()]
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
