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
        forecast_steps = 12
        forecast_trend_removed = model_income_fit.forecast(steps=forecast_steps, exog=df_monthly['CU_M'].iloc[-forecast_steps:])

        # Revert forecast to original scale by adding back the trend and applying exp
        trend_future = trend[-forecast_steps:].values  # Use last observed trend as future trend
        if len(trend_future) < forecast_steps:
            trend_future = np.pad(trend_future, (0, forecast_steps - len(trend_future)), 'constant', constant_values=(0))
        forecast_log_income = forecast_trend_removed + trend_future
        forecast_income = np.exp(forecast_log_income)  # Revert back to original scale

        future_dates = [df_monthly.index[-1] + pd.DateOffset(months=i) for i in range(1, forecast_steps + 1)]

        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in future_dates],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_income.tolist()]
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
