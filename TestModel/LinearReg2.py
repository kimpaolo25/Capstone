from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.linear_model import LinearRegression

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
        print("Data fetched from database:", df.tail())

        # Convert 'Date_column' to datetime with the specified format
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

        # Data summary
        df_summary = df_monthly.describe()
        print("Data summary after feature engineering:", df_summary)

        # Create a time index for linear regression (e.g., 1, 2, 3,...)
        df_monthly['time_index'] = np.arange(len(df_monthly))

        # Linear Regression model for Amount
        X_amount = df_monthly[['time_index']]
        y_amount = df_monthly['Amount']
        model_amount = LinearRegression()
        model_amount.fit(X_amount, y_amount)

        # Forecast for the next 12 months
        future_time_index = np.arange(len(df_monthly), len(df_monthly) + 12).reshape(-1, 1)
        forecast_amount = model_amount.predict(future_time_index)

        # Linear Regression model for CU_M
        y_cum = df_monthly['CU_M']
        model_cum = LinearRegression()
        model_cum.fit(X_amount, y_cum)

        # Forecast for the next 12 months
        forecast_cum = model_cum.predict(future_time_index)

        # Historical values for accuracy metrics
        historical_amounts = df_monthly['Amount'].values
        historical_cum = df_monthly['CU_M'].values

        # Calculate accuracy metrics for Amount
        mse_amount = mean_squared_error(historical_amounts, model_amount.predict(X_amount))
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(historical_amounts, model_amount.predict(X_amount))
        mape_amount = np.mean(np.abs((historical_amounts - model_amount.predict(X_amount)) / historical_amounts)) * 100

        # Calculate accuracy metrics for CU_M
        mse_cum = mean_squared_error(historical_cum, model_cum.predict(X_amount))
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(historical_cum, model_cum.predict(X_amount))
        mape_cum = np.mean(np.abs((historical_cum - model_cum.predict(X_amount)) / historical_cum)) * 100

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + 
                     [(df_monthly.index[-1] + pd.DateOffset(months=i)).strftime('%Y-%m') for i in range(1, 13)],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum],
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
