from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.seasonal import seasonal_decompose
from sklearn.metrics import mean_squared_error, mean_absolute_error
import itertools

app = Flask(__name__)
CORS(app)

# Database URI with no password
DATABASE_URI = 'mysql+mysqlconnector://root:@localhost/prwai_data'
engine = create_engine(DATABASE_URI)

def find_best_sarimax_order(series):
    # Define parameter ranges for p, d, q, P, D, Q
    p = d = q = range(0, 3)  # Adjust ranges as needed
    seasonal_P = seasonal_D = seasonal_Q = range(0, 2)  # Adjust ranges as needed
    seasonal_periods = [12]  # Monthly data
    
    # Create a list of all parameter combinations
    pdq = list(itertools.product(p, d, q))
    seasonal_pdq = list(itertools.product(seasonal_P, seasonal_D, seasonal_Q))

    best_aic = float("inf")
    best_order = None
    best_seasonal_order = None

    for param in pdq:
        for seasonal_param in seasonal_pdq:
            try:
                model = SARIMAX(series, order=param, seasonal_order=seasonal_param + (12,))
                results = model.fit(disp=False)
                
                if results.aic < best_aic:
                    best_aic = results.aic
                    best_order = param
                    best_seasonal_order = seasonal_param
            except:
                continue

    return best_order + best_seasonal_order

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

        # Apply log transformation
        df_monthly['Amount_log'] = np.log(df_monthly['Amount'].replace(0, np.nan))  # Avoid log(0)
        df_monthly['CU_M_log'] = np.log(df_monthly['CU_M'].replace(0, np.nan))  # Avoid log(0)

        # Data summary
        df_summary = df_monthly.describe()
        print("Data summary after feature engineering:", df_summary)

        # ---- First Differencing on Amount ----
        df_monthly['Amount_diff'] = df_monthly['Amount'].diff().dropna()

        # ---- SARIMAX for Amount_diff ----
        best_order_amount = find_best_sarimax_order(df_monthly['Amount_diff'].dropna())
        model_amount = SARIMAX(df_monthly['Amount_diff'].dropna(), 
                               order=best_order_amount[:3], 
                               seasonal_order=best_order_amount[3:] + (12,))
        model_amount_fit = model_amount.fit(disp=False)

        # Forecast for the next 12 months for Amount
        forecast_steps = 12
        forecast_amount_diff = model_amount_fit.get_forecast(steps=forecast_steps)
        forecast_amount_diff_mean = forecast_amount_diff.predicted_mean

        # Revert differencing to get the original scale forecast for 'Amount'
        last_observation = df_monthly['Amount'].iloc[-1]
        forecast_amount = [last_observation + forecast_amount_diff_mean[0]]
        for i in range(1, forecast_steps):
            forecast_amount.append(forecast_amount[i-1] + forecast_amount_diff_mean[i])

        # ---- Seasonal Decomposition for CU_M ----
        decomposition = seasonal_decompose(df_monthly['CU_M'], model='additive', period=12)
        seasonal = decomposition.seasonal
        trend = decomposition.trend
        residual = decomposition.resid

        # ---- SARIMAX for CU_M_log ----
        best_order_cum = find_best_sarimax_order(df_monthly['CU_M_log'].dropna())
        model_cum = SARIMAX(df_monthly['CU_M_log'].dropna(), 
                            order=best_order_cum[:3], 
                            seasonal_order=best_order_cum[3:] + (12,))
        model_cum_fit = model_cum.fit(disp=False)

        # Forecast for the next 12 months for CU_M
        forecast_cum_log = model_cum_fit.get_forecast(steps=forecast_steps)
        forecast_cum_log_mean = forecast_cum_log.predicted_mean

        # Revert the log transformation to get the original scale forecast for 'CU_M'
        forecast_cum = np.exp(forecast_cum_log_mean)

        # ---- Accuracy metrics ----
        historical_amounts = df_monthly['Amount'].values
        historical_cum = df_monthly['CU_M'].values

        # Align forecast with actuals
        forecast_amount_aligned = forecast_amount_diff_mean[:len(historical_amounts[-forecast_steps:])]
        forecast_cum_aligned = forecast_cum_log_mean[:len(historical_cum[-forecast_steps:])]

        # Calculate accuracy metrics for Amount
        mse_amount = mean_squared_error(historical_amounts[-forecast_steps:], forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(historical_amounts[-forecast_steps:], forecast_amount)
        mape_amount = np.mean(np.abs((historical_amounts[-forecast_steps:] - forecast_amount) / historical_amounts[-forecast_steps:])) * 100

        # Calculate accuracy metrics for CU_M
        mse_cum = mean_squared_error(historical_cum[-forecast_steps:], forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(historical_cum[-forecast_steps:], forecast_cum)
        mape_cum = np.mean(np.abs((historical_cum[-forecast_steps:] - forecast_cum) / historical_cum[-forecast_steps:])) * 100

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

        # Print the best order found for both models
        print(f"Best order found for Amount: {best_order_amount}")
        print(f"Best order found for CU_M: {best_order_cum}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + 
                     [(df_monthly.index[-1] + pd.DateOffset(months=i)).strftime('%Y-%m') for i in range(1, forecast_steps + 1)],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum.tolist()],
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
