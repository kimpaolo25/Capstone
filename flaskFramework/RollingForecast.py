from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.statespace.sarimax import SARIMAX
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

        # Fit auto_arima model to find the best order for 'Amount'
        model_auto_arima_amount = auto_arima(
            train['Amount'],
            exogenous=train['CU_M'],
            seasonal=False,  # Adjust if needed
            stepwise=True,
            trace=True
        )

        # Print the best order found by auto_arima for 'Amount'
        print(f"Best order found for Amount: {model_auto_arima_amount.order}")

        # Use the best order found by auto_arima
        best_order_amount = model_auto_arima_amount.order

        # Fit auto_arima model to find the best order for 'CU_M'
        model_auto_arima_cum = auto_arima(
            train['CU_M'],
            exogenous=train['Amount'],
            seasonal=False,  # Adjust if needed
            stepwise=True,
            trace=True
        )

        # Print the best order found by auto_arima for 'CU_M'
        print(f"Best order found for CU_M: {model_auto_arima_cum.order}")

        # Use the best order found by auto_arima
        best_order_cum = model_auto_arima_cum.order

        # Initialize lists to store the rolling forecasts
        rolling_forecast_amount = []
        rolling_forecast_cum = []

        # Rolling forecast loop
        for t in range(len(test)):
            # Update train set with one more observation
            current_train_amount = pd.concat([train['Amount'], test['Amount'][:t]])
            current_train_cum = pd.concat([train['CU_M'], test['CU_M'][:t]])

            # Fit SARIMAX model for 'Amount' with exogenous variables
            model_amount = SARIMAX(
                current_train_amount,
                exog=current_train_cum,
                order=best_order_amount,
                seasonal_order=(0, 0, 0, 0),  # Adjust if needed
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            model_amount_fit = model_amount.fit(disp=False)

            # Fit SARIMAX model for 'CU_M' with exogenous variables
            model_cum = SARIMAX(
                current_train_cum,
                exog=current_train_amount,
                order=best_order_cum,
                seasonal_order=(0, 0, 0, 0),  # Adjust if needed
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            model_cum_fit = model_cum.fit(disp=False)

            # Make one-step-ahead forecasts
            forecast_amount = model_amount_fit.forecast(steps=1, exog=test['CU_M'][t:t+1])
            forecast_cum = model_cum_fit.forecast(steps=1, exog=test['Amount'][t:t+1])

            # Append forecasts to the rolling forecast lists
            rolling_forecast_amount.append(forecast_amount.values[0])
            rolling_forecast_cum.append(forecast_cum.values[0])

        # Accuracy checking using testing data
        test_amount = test['Amount']
        test_cum = test['CU_M']

        # Calculate accuracy metrics
        mse_amount = mean_squared_error(test_amount, rolling_forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, rolling_forecast_amount)

        mse_cum = mean_squared_error(test_cum, rolling_forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, rolling_forecast_cum)

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in test.index],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in rolling_forecast_amount],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in rolling_forecast_cum],
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
