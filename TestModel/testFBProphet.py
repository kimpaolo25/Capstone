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

        # Log transform the data to stabilize variance
        train_amount = train.reset_index()[['Date_column', 'Amount']].rename(columns={'Date_column': 'ds', 'Amount': 'y'})
        train_cum = train.reset_index()[['Date_column', 'CU_M']].rename(columns={'Date_column': 'ds', 'CU_M': 'y'})

        # Apply log transformation (add 1 to avoid log(0))
        train_amount['y'] = np.log(train_amount['y'] + 1)
        train_cum['y'] = np.log(train_cum['y'] + 1)

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

        # Extract the forecasted values and exponentiate to revert log transformation
        forecast_amount_values = np.exp(forecast_amount['yhat'].tail(12).values) - 1  # Subtract 1 to reverse log transformation
        forecast_cum_values = np.exp(forecast_cum['yhat'].tail(12).values) - 1  # Subtract 1 to reverse log transformation

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
        
        # Print the describe of the test data
        print("Descriptive statistics of the test data:")
        print(test.describe())

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in test.index],
            'test_original_amounts': [float(value) for value in test_amount.tolist()],
            'forecasted_amounts': [float(value) for value in forecast_amount_values.tolist()],
            'test_original_cum': [float(value) for value in test_cum.tolist()],
            'forecasted_cum': [float(value) for value in forecast_cum_values.tolist()],
            'accuracy': {
                'amount': {
                    'mse': mse_amount,
                    'rmse': rmse_amount,
                    'mae': mae_amount,
                    'mape': mape_amount
                },
                'cum': {
                    'mse': mse_cum,
                    'rmse': rmse_cum,
                    'mae': mae_cum,
                    'mape': mape_cum
                }
            },
            'data_summary': df_monthly.describe().to_dict()
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
