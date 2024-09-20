from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPRegressor

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

        # Define features and target
        # For simplicity, we'll use the raw data itself as features.
        # More sophisticated feature engineering can be applied if needed.
        X_train = train[['CU_M']].values
        y_train_amount = train['Amount'].values
        y_train_cum = train['CU_M'].values

        X_test = test[['CU_M']].values
        y_test_amount = test['Amount'].values
        y_test_cum = test['CU_M'].values

        # Standardize features
        scaler_X = StandardScaler()
        X_train_scaled = scaler_X.fit_transform(X_train)
        X_test_scaled = scaler_X.transform(X_test)

        # Fit ANN model for 'Amount'
        model_ann_amount = MLPRegressor(hidden_layer_sizes=(50,), activation='relu', solver='adam', max_iter=1000)
        model_ann_amount.fit(X_train_scaled, y_train_amount)
        forecast_amount = model_ann_amount.predict(X_test_scaled)

        # Fit ANN model for 'CU_M'
        model_ann_cum = MLPRegressor(hidden_layer_sizes=(50,), activation='relu', solver='adam', max_iter=1000)
        model_ann_cum.fit(X_train_scaled, y_train_cum)
        forecast_cum = model_ann_cum.predict(X_test_scaled)

        # Accuracy checking using testing data
        mse_amount = mean_squared_error(y_test_amount, forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(y_test_amount, forecast_amount)

        mse_cum = mean_squared_error(y_test_cum, forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(y_test_cum, forecast_cum)

        # Print the accuracy metrics
        print(f"ANN Model for Amount - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}")
        print(f"ANN Model for CU_M - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=len(test), freq='M')],
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
