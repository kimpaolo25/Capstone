from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.metrics import mean_squared_error, mean_absolute_error
import itertools  # Import itertools for generating combinations

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
        
        # Remove rows where CU.M. is negative or exceeds the threshold
        df = df[(df['CU_M'] >= 0) & (df['CU_M'] <= 1250)]

        # Set 'Date_column' as index
        df.set_index('Date_column', inplace=True)

        # Resample to monthly and sum Amount and CU_M
        df_monthly = df.resample('M').agg({
            'Amount': 'sum',
            'CU_M': 'sum'
        })

        # Apply differencing to make series stationary
        df_monthly['Amount_diff'] = df_monthly['Amount'].diff().dropna()
        df_monthly['CU_M_diff'] = df_monthly['CU_M'].diff().dropna()

        # Data summary
        df_summary = df_monthly.describe()
        print("Data summary after feature engineering:", df_summary)

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        def find_best_sarimax_order(data, seasonal_periods=12):
            """
            Function to find the best SARIMAX order using brute force and AIC.
            Limits the range of p, d, q, P, D, Q for performance.
            """
            best_aic = float('inf')
            best_order = None
            
            # Reduced ranges for parameters
            p_range = range(0, 3)  # p = 0, 1, 2
            d_range = range(0, 2)  # d = 0, 1
            q_range = range(0, 3)  # q = 0, 1, 2
            P_range = range(0, 2)  # P = 0, 1
            D_range = range(0, 2)  # D = 0, 1
            Q_range = range(0, 2)  # Q = 0, 1

            # Generate all combinations of the parameters
            for p, d, q, P, D, Q in itertools.product(p_range, d_range, q_range, P_range, D_range, Q_range):
                try:
                    model = SARIMAX(data, order=(p, d, q), seasonal_order=(P, D, Q, seasonal_periods))
                    model_fit = model.fit(disp=False)
                    aic = model_fit.aic
                    
                    if aic < best_aic:
                        best_aic = aic
                        best_order = (p, d, q, P, D, Q)
                except:
                    continue  # Ignore models that fail to fit

            # Ensure best_order is not None
            return best_order if best_order is not None else (0, 0, 0, 0, 0, 0)  # Default to (0,0,0,0) if none found

        # ---- SARIMAX for Amount_diff ----
        best_order_amount = find_best_sarimax_order(train['Amount_diff'].dropna())
        model_amount = SARIMAX(train['Amount_diff'].dropna(), order=best_order_amount[:3], seasonal_order=(best_order_amount[3], best_order_amount[4], best_order_amount[5], 12))
        model_amount_fit = model_amount.fit(disp=False)

        # Forecast on the test data length
        forecast_steps = len(test)
        forecast_amount_diff = model_amount_fit.get_forecast(steps=forecast_steps)
        forecast_amount_diff_mean = forecast_amount_diff.predicted_mean

        # Revert the differencing to get the original scale forecast for 'Amount'
        forecast_amount = forecast_amount_diff_mean.add(df_monthly['Amount'].iloc[train_size - 1])

        # ---- SARIMAX for CU_M_diff ----
        best_order_cum = find_best_sarimax_order(train['CU_M_diff'].dropna())
        model_cum = SARIMAX(train['CU_M_diff'].dropna(), order=best_order_cum[:3], seasonal_order=(best_order_cum[3], best_order_cum[4], best_order_cum[5], 12))
        model_cum_fit = model_cum.fit(disp=False)

        # Forecast on the test data length
        forecast_cum_diff = model_cum_fit.get_forecast(steps=forecast_steps)
        forecast_cum_diff_mean = forecast_cum_diff.predicted_mean

        # Revert the differencing to get the original scale forecast for 'CU_M'
        forecast_cum = forecast_cum_diff_mean.add(df_monthly['CU_M'].iloc[train_size - 1])

        # Get the testing data
        test_amount = test['Amount']
        test_cum = test['CU_M']

        # Align forecast with actuals
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
        print(f"Amount Model - Best Order: {best_order_amount}, MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - Best Order: {best_order_cum}, MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

        # Prepare the response to include the summary only
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
            'data_summary': df_summary.to_dict()  # Include the summary in the response
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
