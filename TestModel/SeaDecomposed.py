from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.metrics import mean_squared_error, mean_absolute_error
import itertools

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

        # Remove rows where CU_M is negative
        df = df[df['CU_M'] >= 0]

        # Define the threshold for large values
        threshold = 1250

        # Remove rows where CU_M values exceed the threshold
        df = df[df['CU_M'] <= threshold]

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

        # Define ARIMA parameters
        p = range(0, 3)  # AR terms
        d = range(0, 2)  # Differencing (not used for seasonal decomposition)
        q = range(0, 3)  # MA terms

        # Perform seasonal decomposition for Amount
        decomposition_amount = seasonal_decompose(df_monthly['Amount'], model='add', period=12)
        trend_amount = decomposition_amount.trend.dropna()
        seasonal_amount = decomposition_amount.seasonal

        # Forecasting using ARIMA on the trend component
        trend_amount = trend_amount.dropna()  # Ensure no NaN values
        best_order_amount, best_model_amount = grid_search_arima(trend_amount, p, d, q)

        # Create a forecast for 'Amount' based on the trend component
        forecast_amount_diff = best_model_amount.get_forecast(steps=12)  # Forecasting 12 steps ahead
        forecast_amount_diff_mean = forecast_amount_diff.predicted_mean
        
        # Combine forecast with seasonal component
        last_seasonal_value = seasonal_amount.iloc[-1]
        forecast_amount = forecast_amount_diff_mean + last_seasonal_value

        # Perform seasonal decomposition for CU_M
        decomposition_cum = seasonal_decompose(df_monthly['CU_M'], model='add', period=12)
        trend_cum = decomposition_cum.trend.dropna()
        seasonal_cum = decomposition_cum.seasonal

        # Forecasting using ARIMA on the trend component
        trend_cum = trend_cum.dropna()  # Ensure no NaN values
        best_order_cum, best_model_cum = grid_search_arima(trend_cum, p, d, q)

        # Create a forecast for 'CU_M' based on the trend component
        forecast_cum_diff = best_model_cum.get_forecast(steps=12)  # Forecasting 12 steps ahead
        forecast_cum_diff_mean = forecast_cum_diff.predicted_mean
        
        # Combine forecast with seasonal component
        last_seasonal_value_cum = seasonal_cum.iloc[-1]
        forecast_cum = forecast_cum_diff_mean + last_seasonal_value_cum

        # Calculate accuracy metrics
        historical_amounts = df_monthly['Amount'].values
        historical_cum = df_monthly['CU_M'].values
        
        # For accuracy checking, we'll use historical data for comparison
        if len(historical_amounts) > 12:
            test_amount = historical_amounts[-12:]  # Last 12 for testing
            test_cum = historical_cum[-12:]  # Last 12 for testing

            # Align forecast with actuals
            forecast_amount_aligned = forecast_amount[:len(test_amount)]
            forecast_cum_aligned = forecast_cum[:len(test_cum)]

            mse_amount = mean_squared_error(test_amount, forecast_amount_aligned)
            rmse_amount = np.sqrt(mse_amount)
            mae_amount = mean_absolute_error(test_amount, forecast_amount_aligned)

            # Calculate MAPE for Amount
            mape_amount = np.mean(np.abs((test_amount - forecast_amount_aligned) / test_amount)) * 100

            mse_cum = mean_squared_error(test_cum, forecast_cum_aligned)
            rmse_cum = np.sqrt(mse_cum)
            mae_cum = mean_absolute_error(test_cum, forecast_cum_aligned)

            # Calculate MAPE for CU_M
            mape_cum = np.mean(np.abs((test_cum - forecast_cum_aligned) / test_cum)) * 100

            # Print the accuracy metrics
            print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
            print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")
        
        print(f"Best order found for Amount: {best_order_amount}")
        print(f"Best order found for CU_M: {best_order_cum}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + 
                     [(df_monthly.index[-1] + pd.DateOffset(months=i)).strftime('%Y-%m') for i in range(1, 13)],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum.tolist()],
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

def grid_search_arima(y, p_range, d_range, q_range):
    best_aic = float("inf")
    best_order = None
    best_model = None

    # Generate all combinations of p, d, q
    for p_val, d_val, q_val in itertools.product(p_range, d_range, q_range):
        try:
            model = ARIMA(y, order=(p_val, d_val, q_val))
            model_fit = model.fit()
            aic = model_fit.aic
            
            if aic < best_aic:
                best_aic = aic
                best_order = (p_val, d_val, q_val)
                best_model = model_fit
        except Exception as e:
            # Handle any issues with fitting the model
            continue
    
    return best_order, best_model

if __name__ == '__main__':
    app.run(port=5000, debug=True)
