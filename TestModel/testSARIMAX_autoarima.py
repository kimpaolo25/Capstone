from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
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

        # Convert 'Date_column' to datetime
        df['Date_column'] = pd.to_datetime(df['Date_column'], format='%Y-%b')

        # Handle missing values
        df.fillna(0, inplace=True)

        # Remove rows where CU_M is negative
        df = df[df['CU_M'] >= 0]

        # Remove rows where CU_M values exceed a threshold
        threshold = 1250
        df = df[df['CU_M'] <= threshold]

        # Set 'Date_column' as index
        df.set_index('Date_column', inplace=True)

        # Resample to monthly and sum Amount and CU_M
        df_monthly = df.resample('M').agg({
            'Amount': 'sum',
            'CU_M': 'sum'
        })

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Auto ARIMA for Amount
        model_amount = auto_arima(train['Amount'], seasonal=False, stepwise=True, trace=True)
        forecast_steps = len(test)
        forecast_amount = model_amount.predict(n_periods=forecast_steps)

        print(f'Best ARIMA Parameters for Amount: {model_amount.order} with AIC: {model_amount.aic()}')

        # Auto ARIMA for CU_M
        model_cum = auto_arima(train['CU_M'], seasonal=False, stepwise=True, trace=True)
        forecast_cum = model_cum.predict(n_periods=forecast_steps)

        print(f'Best ARIMA Parameters for CU_M: {model_cum.order} with AIC: {model_cum.aic()}')

        # Calculate accuracy metrics for Amount
        test_amount = test['Amount']
        mse_amount = mean_squared_error(test_amount, forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount)
        mape_amount = np.mean(np.abs((test_amount - forecast_amount) / test_amount)) * 100

        # Calculate accuracy metrics for CU_M
        test_cum = test['CU_M']
        mse_cum = mean_squared_error(test_cum, forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum)
        mape_cum = np.mean(np.abs((test_cum - forecast_cum) / test_cum)) * 100

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in test.index],
            'test_original_amounts': [float(value) for value in test_amount.tolist()],
            'forecasted_amounts': [float(value) for value in forecast_amount.tolist()],
            'test_original_cum': [float(value) for value in test_cum.tolist()],
            'forecasted_cum': [float(value) for value in forecast_cum.tolist()],
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
            }
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
