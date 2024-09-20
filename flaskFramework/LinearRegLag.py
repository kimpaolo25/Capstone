from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.holtwinters import ExponentialSmoothing
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

        # Add lag features
        for lag in range(1, 13):  # Example: create lag features for 1 to 12 months
            df_monthly[f'Amount_lag_{lag}'] = df_monthly['Amount'].shift(lag)
            df_monthly[f'CU_M_lag_{lag}'] = df_monthly['CU_M'].shift(lag)

        # Drop rows with NaN values created by lagging
        df_monthly.dropna(inplace=True)

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # Define features and target for Amount
        features_amount = [f'Amount_lag_{lag}' for lag in range(1, 13)] + [f'CU_M_lag_{lag}' for lag in range(1, 13)]
        target_amount = 'Amount'

        # Fit Linear Regression model for 'Amount'
        model_lr_amount = LinearRegression()
        model_lr_amount.fit(train[features_amount], train[target_amount])

        # Create a forecast for 'Amount'
        forecast_steps = len(test)
        forecast_amount = model_lr_amount.predict(test[features_amount])

        # Accuracy checking for Amount
        test_amount = test['Amount']
        mse_amount = mean_squared_error(test_amount, forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount)

        print(f"Linear Regression Model for Amount - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}")

        # Fit ETS model for 'CU_M'
        model_ets_cum = ExponentialSmoothing(
            train['CU_M'],
            trend='add',
            seasonal='add',
            seasonal_periods=12
        )
        model_ets_cum_fit = model_ets_cum.fit()

        # Create a forecast for 'CU_M'
        forecast_cum = model_ets_cum_fit.forecast(steps=forecast_steps)

        # Accuracy checking for CU_M
        test_cum = test['CU_M']
        mse_cum = mean_squared_error(test_cum, forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum)

        print(f"ETS Model for CU_M - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=forecast_steps, freq='M')],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum.tolist()]
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
