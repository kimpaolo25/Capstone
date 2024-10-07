from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from pmdarima import auto_arima
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error, mean_absolute_error
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

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

        # Apply first differencing to 'Amount' and 'CU_M' to make them stationary
        df_monthly['Amount_diff'] = df_monthly['Amount'].diff().dropna()
        df_monthly['CU_M_diff'] = df_monthly['CU_M'].diff().dropna()

        # Split data into training and testing sets
        train_size = int(len(df_monthly) * 0.8)  # 80% for training
        train, test = df_monthly[:train_size], df_monthly[train_size:]

        # ---- ARIMA for Amount_diff ----
        model_auto_arima_amount = auto_arima(train['Amount_diff'].dropna(), seasonal=False, stepwise=True, trace=True)
        best_order_amount = model_auto_arima_amount.order
        model_amount = ARIMA(train['Amount_diff'].dropna(), order=best_order_amount)
        model_amount_fit = model_amount.fit()

        # ARIMA Forecast for Amount_diff
        forecast_steps = len(test)
        forecast_amount_diff = model_amount_fit.get_forecast(steps=forecast_steps).predicted_mean

        # Revert the differencing to get original scale forecast
        forecast_amount = forecast_amount_diff.add(df_monthly['Amount'].iloc[-len(forecast_amount_diff):].values)

        # ---- Neural Network for Residuals ----
        # Calculate residuals (ARIMA's error)
        residuals_amount = train['Amount_diff'].dropna() - model_amount_fit.fittedvalues

        # Prepare input features for NN
        X_train = residuals_amount.values.reshape(-1, 1)  # Use residuals as input
        y_train = train['Amount_diff'].dropna().values  # Actual values

        # Define and train a simple NN model
        nn_model = Sequential()
        nn_model.add(Dense(64, input_dim=1, activation='relu'))
        nn_model.add(Dense(32, activation='relu'))
        nn_model.add(Dense(1))  # Single output for forecasting
        nn_model.compile(optimizer='adam', loss='mse')

        # Train the neural network
        nn_model.fit(X_train, y_train, epochs=50, batch_size=16, verbose=0)

        # Use the neural network to predict on the test residuals (error correction)
        forecast_residuals_nn = nn_model.predict(forecast_amount_diff.values.reshape(-1, 1))

        # Add ARIMA and NN forecast results
        final_forecast_amount = forecast_amount + forecast_residuals_nn.flatten()

        # ---- ARIMA for CU_M_diff ----
        model_auto_arima_cum = auto_arima(train['CU_M_diff'].dropna(), seasonal=False, stepwise=True, trace=True)
        best_order_cum = model_auto_arima_cum.order
        model_cum = ARIMA(train['CU_M_diff'].dropna(), order=best_order_cum)
        model_cum_fit = model_cum.fit()

        # ARIMA Forecast for CU_M_diff
        forecast_cum_diff = model_cum_fit.get_forecast(steps=forecast_steps).predicted_mean

        # Revert the differencing to get original scale forecast
        forecast_cum = forecast_cum_diff.add(df_monthly['CU_M'].iloc[-len(forecast_cum_diff):].values)

        # Accuracy checking using testing data
        test_amount = test['Amount']
        test_cum = test['CU_M']

        # Align forecast with actuals for Amount
        mse_amount = mean_squared_error(test_amount, final_forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, final_forecast_amount)
        mape_amount = np.mean(np.abs((test_amount - final_forecast_amount) / test_amount)) * 100

        # Align forecast with actuals for CU_M
        mse_cum = mean_squared_error(test_cum, forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum)
        mape_cum = np.mean(np.abs((test_cum - forecast_cum) / test_cum)) * 100

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

        # Prepare the response for both Amount and CU_M forecasts
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in test.index],

            # Historical and forecasted amounts with ARIMA + Neural Network correction
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in final_forecast_amount.tolist()],
            
            # Historical CU_M values and forecasted CU_M values (from ARIMA only for simplicity)
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
