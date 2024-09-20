from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.holtwinters import ExponentialSmoothing
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

        # Calculate Moving Averages
        moving_avg_amount = df_monthly['Amount'].rolling(window=2).mean()  # Example: 3-month moving average
        moving_avg_cum = df_monthly['CU_M'].rolling(window=2).mean()      # Example: 3-month moving average

        # Add moving averages to the DataFrame
        df_monthly['Moving_Avg_Amount'] = moving_avg_amount
        df_monthly['Moving_Avg_CU_M'] = moving_avg_cum

        # Print df_monthly for debugging
        print("Monthly aggregated data with moving averages:")
        print(df_monthly)

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Fit ETS model for 'Amount'
        model_ets_amount = ExponentialSmoothing(
            train['Amount'],
            trend='add',
            seasonal='add',
            seasonal_periods=12
        )
        model_ets_amount_fit = model_ets_amount.fit()

        # Create a forecast for 'Amount'
        forecast_steps = len(test)
        forecast_amount = model_ets_amount_fit.forecast(steps=forecast_steps)

        # Accuracy checking using testing data
        test_amount = test['Amount']
        mse_amount = mean_squared_error(test_amount, forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount)

        # Print the accuracy metrics
        print(f"ETS Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=forecast_steps, freq='M')],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [None] * len(forecast_amount)  # For simplicity, not using ETS for CU_M here
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
