from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from prophet import Prophet
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

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Print train and test sizes for debugging
        print(f"Training data size: {len(train)}, Testing data size: {len(test)}")

        # Prepare data for Prophet
        train_amount = train.reset_index()[['Date_column', 'Amount']].rename(columns={'Date_column': 'ds', 'Amount': 'y'})
        train_cum = train.reset_index()[['Date_column', 'CU_M']].rename(columns={'Date_column': 'ds', 'CU_M': 'y'})

        # Initialize and fit Prophet models
        model_amount = Prophet()
        model_cum = Prophet()

        model_amount.fit(train_amount)
        model_cum.fit(train_cum)

        # Create future DataFrame for 12 months ahead
        future = model_amount.make_future_dataframe(periods=12, freq='M')
        forecast_amount = model_amount.predict(future)

        future_cum = model_cum.make_future_dataframe(periods=12, freq='M')
        forecast_cum = model_cum.predict(future_cum)

        # Extract the forecasted values
        forecast_amount_values = forecast_amount['yhat'].tail(12).values
        forecast_cum_values = forecast_cum['yhat'].tail(12).values

        # Align forecasts with actuals for accuracy calculation
        test_amount = test['Amount'].values[-12:]  # Taking last 12 for comparison
        test_cum = test['CU_M'].values[-12:]  # Taking last 12 for comparison

        # Calculate MAPE
        mape_amount = np.mean(np.abs((test_amount - forecast_amount_values) / test_amount)) * 100
        mape_cum = np.mean(np.abs((test_cum - forecast_cum_values) / test_cum)) * 100

        # Calculate MAE, MSE, RMSE
        mae_amount = mean_absolute_error(test_amount, forecast_amount_values)
        mse_amount = mean_squared_error(test_amount, forecast_amount_values)
        rmse_amount = np.sqrt(mse_amount)

        mae_cum = mean_absolute_error(test_cum, forecast_cum_values)
        mse_cum = mean_squared_error(test_cum, forecast_cum_values)
        rmse_cum = np.sqrt(mse_cum)

        # Print the accuracy results
        print(f"Amount Model - MAPE: {mape_amount}%, MAE: {mae_amount}, MSE: {mse_amount}, RMSE: {rmse_amount}")
        print(f"CU_M Model - MAPE: {mape_cum}%, MAE: {mae_cum}, MSE: {mse_cum}, RMSE: {rmse_cum}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in forecast_amount['ds'].tail(12)],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount_values.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum_values.tolist()],
            'mape_amount': mape_amount,
            'mae_amount': mae_amount,
            'mse_amount': mse_amount,
            'rmse_amount': rmse_amount,
            'mape_cum': mape_cum,
            'mae_cum': mae_cum,
            'mse_cum': mse_cum,
            'rmse_cum': rmse_cum,
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
