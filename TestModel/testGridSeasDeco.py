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

# Database URI
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

        # Remove rows where CU.M. is negative
        df = df[df['CU_M'] >= 0]

        # Define the threshold for large values
        threshold = 1250

        # Remove rows where CU.M. values exceed the threshold
        df = df[df['CU_M'] <= threshold]

        # Set 'Date_column' as index
        df.set_index('Date_column', inplace=True)

        # Feature Engineering: Resample to monthly and sum Amount and CU_M
        df_monthly = df.resample('M').agg({
            'Amount': 'sum',
            'CU_M': 'sum'
        })

        # Seasonal Decomposition
        decomposition_amount = seasonal_decompose(df_monthly['Amount'], model='additive')
        decomposition_cum = seasonal_decompose(df_monthly['CU_M'], model='additive')

        # Extract trend and seasonality
        df_monthly['Trend_Amount'] = decomposition_amount.trend
        df_monthly['Trend_CU_M'] = decomposition_cum.trend

        # Handle NaNs resulting from decomposition
        df_monthly.dropna(inplace=True)

        # Split data into training and testing sets (80% training, 20% testing)
        train_size = int(len(df_monthly) * 0.8)
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # ---- Grid Search for SARIMAX for Trend_Amount ----
        best_mse_amount = float('inf')
        best_order_amount = None
        best_seasonal_order_amount = None

        # Define parameter ranges
        p = d = q = range(0, 3)
        P = D = Q = range(0, 2)
        m = 12  # Seasonal period (e.g., 12 for monthly seasonality)

        # Create a grid of all possible combinations
        param_combinations = list(itertools.product(p, d, q))
        seasonal_param_combinations = list(itertools.product(P, D, Q))

        for order in param_combinations:
            for seasonal_order in seasonal_param_combinations:
                try:
                    model_amount = SARIMAX(train['Trend_Amount'].dropna(),
                                           order=order,
                                           seasonal_order=(seasonal_order[0], seasonal_order[1], seasonal_order[2], m),
                                           enforce_stationarity=False,
                                           enforce_invertibility=False)
                    model_amount_fit = model_amount.fit(disp=False)
                    mse = mean_squared_error(train['Trend_Amount'].dropna(), model_amount_fit.fittedvalues)

                    if mse < best_mse_amount:
                        best_mse_amount = mse
                        best_order_amount = order
                        best_seasonal_order_amount = (seasonal_order[0], seasonal_order[1], seasonal_order[2], m)

                except Exception as e:
                    print(f"Error fitting model with order={order} and seasonal_order={seasonal_order}: {str(e)}")
                    continue

        # Fit best SARIMAX model for Amount
        model_amount = SARIMAX(train['Trend_Amount'].dropna(),
                               order=best_order_amount,
                               seasonal_order=best_seasonal_order_amount,
                               enforce_stationarity=False,
                               enforce_invertibility=False)
        model_amount_fit = model_amount.fit(disp=False)

        # Forecast on the test data length
        forecast_steps = len(test)
        forecast_amount = model_amount_fit.get_forecast(steps=forecast_steps).predicted_mean

        # ---- Grid Search for SARIMAX for Trend_CU_M ----
        best_mse_cum = float('inf')
        best_order_cum = None
        best_seasonal_order_cum = None

        for order in param_combinations:
            for seasonal_order in seasonal_param_combinations:
                try:
                    model_cum = SARIMAX(train['Trend_CU_M'].dropna(),
                                        order=order,
                                        seasonal_order=(seasonal_order[0], seasonal_order[1], seasonal_order[2], m),
                                        enforce_stationarity=False,
                                        enforce_invertibility=False)
                    model_cum_fit = model_cum.fit(disp=False)
                    mse = mean_squared_error(train['Trend_CU_M'].dropna(), model_cum_fit.fittedvalues)

                    if mse < best_mse_cum:
                        best_mse_cum = mse
                        best_order_cum = order
                        best_seasonal_order_cum = (seasonal_order[0], seasonal_order[1], seasonal_order[2], m)

                except Exception as e:
                    print(f"Error fitting model with order={order} and seasonal_order={seasonal_order}: {str(e)}")
                    continue

        # Fit best SARIMAX model for CU_M
        model_cum = SARIMAX(train['Trend_CU_M'].dropna(),
                            order=best_order_cum,
                            seasonal_order=best_seasonal_order_cum,
                            enforce_stationarity=False,
                            enforce_invertibility=False)
        model_cum_fit = model_cum.fit(disp=False)

        # Forecast on the test data length
        forecast_cum = model_cum_fit.get_forecast(steps=forecast_steps).predicted_mean

        # Get the testing data
        test_amount = test['Amount']
        test_cum = test['CU_M']

        # Align forecast with actuals (ensure correct length)
        forecast_amount_aligned = forecast_amount[:len(test_amount)]
        forecast_cum_aligned = forecast_cum[:len(test_cum)]

        # Calculate Accuracy Metrics
        mse_amount = mean_squared_error(test_amount, forecast_amount_aligned)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount_aligned)

        mse_cum = mean_squared_error(test_cum, forecast_cum_aligned)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum_aligned)

        # Calculate MAPE
        mape_amount = np.mean(np.abs((test_amount - forecast_amount_aligned) / test_amount)) * 100
        mape_cum = np.mean(np.abs((test_cum - forecast_cum_aligned) / test_cum)) * 100

        # Print the accuracy metrics for testing evaluation
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")
        
        print("Best SARIMAX order for Amount:", best_order_amount, "Seasonal order:", best_seasonal_order_amount)
        print("Best SARIMAX order for CU_M:", best_order_cum, "Seasonal order:", best_seasonal_order_cum)

        # Prepare the response to visualize only the testing and forecasted data, and include accuracy
        response = {
            'dates': [date.strftime('%Y-%m') for date in test.index],
            'test_original_amounts': [float(value) for value in test_amount.tolist()],
            'forecasted_amounts': [float(value) for value in forecast_amount_aligned.tolist()],
            'test_original_cum': [float(value) for value in test_cum.tolist()],
            'forecasted_cum': [float(value) for value in forecast_cum_aligned.tolist()],
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
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)