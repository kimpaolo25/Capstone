from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from sklearn.linear_model import LinearRegression
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

        # Remove rows where CU.M. is negative
        df = df[df['CU_M'] >= 0]

        # Define the threshold for large values
        threshold = 1250

        # Remove rows where CU.M. values exceed the threshold
        df = df[df['CU_M'] <= threshold]

        # Set 'Date_column' as index for the entire DataFrame
        df.set_index('Date_column', inplace=True)

        # Feature Engineering: Resample to monthly and sum Amount and CU_M
        df_monthly = df.resample('M').agg({
            'Amount': 'sum',
            'CU_M': 'sum'
        })

        # Create lag features for linear regression
        df_monthly['Amount_Lag1'] = df_monthly['Amount'].shift(1)
        df_monthly['CU_M_Lag1'] = df_monthly['CU_M'].shift(1)

        # Drop rows with NaNs created by shifting
        df_monthly.dropna(inplace=True)

        # Split data into training and testing sets (80% training, 20% testing)
        train_size = int(len(df_monthly) * 0.8)
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Prepare the data for linear regression
        X_train = train[['Amount_Lag1']]
        y_train_amount = train['Amount']
        y_train_cum = train['CU_M']

        # Fit Linear Regression model for Amount
        model_amount = LinearRegression()
        model_amount.fit(X_train, y_train_amount)

        # Fit Linear Regression model for CU_M
        model_cum = LinearRegression()
        model_cum.fit(X_train, y_train_cum)

        # Prepare test data
        X_test = test[['Amount_Lag1']]
        test_amount = test['Amount']
        test_cum = test['CU_M']

        # Make predictions
        forecast_amount = model_amount.predict(X_test)
        forecast_cum = model_cum.predict(X_test)

        # Calculate Accuracy Metrics
        mse_amount = mean_squared_error(test_amount, forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount)

        mse_cum = mean_squared_error(test_cum, forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum)

        # Calculate MAPE
        mape_amount = np.mean(np.abs((test_amount - forecast_amount) / test_amount)) * 100
        mape_cum = np.mean(np.abs((test_cum - forecast_cum) / test_cum)) * 100

        # Print the accuracy metrics for testing evaluation
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

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
            },
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
