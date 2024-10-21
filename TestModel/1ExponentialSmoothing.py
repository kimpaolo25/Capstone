from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from sklearn.metrics import mean_squared_error, mean_absolute_error
from statsmodels.tsa.holtwinters import ExponentialSmoothing  # Importing ExponentialSmoothing

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

        # Forecasting Amount using Exponential Smoothing
        model_amount = ExponentialSmoothing(df_monthly['Amount'], seasonal='add', seasonal_periods=12)
        model_amount_fit = model_amount.fit()

        # Forecast for the next 12 months
        forecast_amount = model_amount_fit.forecast(steps=12)

        # Forecasting CU_M using Exponential Smoothing
        model_cum = ExponentialSmoothing(df_monthly['CU_M'], seasonal='mul', seasonal_periods=12)
        model_cum_fit = model_cum.fit()

        # Forecast for the next 12 months
        forecast_cum = model_cum_fit.forecast(steps=12)

        # Historical amounts for accuracy metrics
        historical_amounts = df_monthly['Amount'].values
        historical_cum = df_monthly['CU_M'].values

        # Calculate accuracy metrics for Amount
        mse_amount = mean_squared_error(historical_amounts[-12:], forecast_amount[:12])
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(historical_amounts[-12:], forecast_amount[:12])
        mape_amount = np.mean(np.abs((historical_amounts[-12:] - forecast_amount[:12]) / historical_amounts[-12:])) * 100

        # Calculate accuracy metrics for CU_M
        mse_cum = mean_squared_error(historical_cum[-12:], forecast_cum[:12])
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(historical_cum[-12:], forecast_cum[:12])
        mape_cum = np.mean(np.abs((historical_cum[-12:] - forecast_cum[:12]) / historical_cum[-12:])) * 100

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")
        
        print(df_summary)

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + 
                     [(df_monthly.index[-1] + pd.DateOffset(months=i)).strftime('%Y-%m') for i in range(1, 13)],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum],
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
