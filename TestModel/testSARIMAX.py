from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.metrics import mean_squared_error, mean_absolute_error
from itertools import product

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

        def grid_search_sarimax(train_data, order_range, seasonal_order):
            best_aic = float('inf')
            best_params = None
            best_model = None
            
            for param in product(*order_range):
                try:
                    model = SARIMAX(train_data, order=param, seasonal_order=seasonal_order)
                    results = model.fit(disp=False)
                    if results.aic < best_aic:
                        best_aic = results.aic
                        best_params = param
                        best_model = results
                except Exception as e:
                    continue
            
            return best_params, best_model, best_aic

        # Grid search for Amount
        order_range_amount = [range(0, 3), range(0, 2), range(0, 3)]  # (p, d, q)
        seasonal_order_amount = (0, 0, 0, 0)  # No seasonal component
        best_params_amount, best_model_amount, best_aic_amount = grid_search_sarimax(
            train['Amount'], order_range_amount, seasonal_order_amount
        )

        print(f'Best SARIMAX Parameters for Amount: {best_params_amount} with AIC: {best_aic_amount}')

        # Forecasting Amount
        forecast_steps = len(test)
        forecast_amount = best_model_amount.get_forecast(steps=forecast_steps)
        forecast_amount_mean = forecast_amount.predicted_mean

        # Grid search for CU_M
        order_range_cum = [range(0, 3), range(0, 2), range(0, 3)]  # (p, d, q)
        seasonal_order_cum = (0, 0, 0, 0)  # No seasonal component
        best_params_cum, best_model_cum, best_aic_cum = grid_search_sarimax(
            train['CU_M'], order_range_cum, seasonal_order_cum
        )

        print(f'Best SARIMAX Parameters for CU_M: {best_params_cum} with AIC: {best_aic_cum}')

        # Forecasting CU_M
        forecast_cum = best_model_cum.get_forecast(steps=forecast_steps)
        forecast_cum_mean = forecast_cum.predicted_mean

        # Calculate accuracy metrics for Amount
        test_amount = test['Amount']
        mse_amount = mean_squared_error(test_amount, forecast_amount_mean)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount_mean)
        mape_amount = np.mean(np.abs((test_amount - forecast_amount_mean) / test_amount)) * 100

        # Calculate accuracy metrics for CU_M
        test_cum = test['CU_M']
        mse_cum = mean_squared_error(test_cum, forecast_cum_mean)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum_mean)
        mape_cum = np.mean(np.abs((test_cum - forecast_cum_mean) / test_cum)) * 100

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in test.index],
            'test_original_amounts': [float(value) for value in test_amount.tolist()],
            'forecasted_amounts': [float(value) for value in forecast_amount_mean.tolist()],
            'test_original_cum': [float(value) for value in test_cum.tolist()],
            'forecasted_cum': [float(value) for value in forecast_cum_mean.tolist()],
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
