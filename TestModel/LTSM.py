from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

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

        # Scale the data
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(df_monthly[['Amount', 'CU_M']])

        # Prepare data for LSTM
        time_step = 5  # Number of previous time steps to use for prediction
        X, y_amount, y_cum = [], [], []

        for i in range(len(scaled_data) - time_step):
            X.append(scaled_data[i:i + time_step])
            y_amount.append(scaled_data[i + time_step, 0])  # Predicting 'Amount'
            y_cum.append(scaled_data[i + time_step, 1])    # Predicting 'CU_M'

        # Convert lists to numpy arrays
        X = np.array(X)
        y_amount = np.array(y_amount)
        y_cum = np.array(y_cum)

        # Check the shape of X before reshaping
        print("Original shape of X:", X.shape)  # X shape will be (n_samples, time_step, 2)

        # Split data into training and testing sets
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_amount_train, y_amount_test = y_amount[:train_size], y_amount[train_size:]
        y_cum_train, y_cum_test = y_cum[:train_size], y_cum[train_size:]

        # Reshape input to be [samples, time steps, features]
        # In this case, we will have 2 features (Amount and CU_M)
        X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], X_train.shape[2])
        X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], X_test.shape[2])

        # Debugging shape checks
        print("Shape of X_train after reshape:", X_train.shape)  # Expecting (n_samples, time_step, 2)
        print("Shape of X_test after reshape:", X_test.shape)    # Expecting (n_samples, time_step, 2)

        # Build the LSTM model
        model = Sequential()
        model.add(LSTM(50, return_sequences=True, input_shape=(time_step, 2)))
        model.add(LSTM(50, return_sequences=False))
        model.add(Dense(25))
        model.add(Dense(2))  # 2 output neurons for 'Amount' and 'CU_M'

        model.compile(optimizer='adam', loss='mean_squared_error')

        # Train the model
        model.fit(X_train, np.column_stack((y_amount_train, y_cum_train)), batch_size=1, epochs=10)

        # Make predictions
        predicted = model.predict(X_test)

        # Inverse transform the predictions to get them back to the original scale
        predicted = scaler.inverse_transform(predicted)

        # Inverse transform the actual test values
        y_test_inverse = scaler.inverse_transform(np.column_stack((y_amount_test, y_cum_test)))

        # Split the predicted values back into amount and CU_M
        forecast_amount = predicted[:, 0]
        forecast_cum = predicted[:, 1]

        # Accuracy checking using testing data
        test_amount = y_test_inverse[:, 0]
        test_cum = y_test_inverse[:, 1]

        # Calculate MSE, RMSE, MAE, and MAPE for both Amount and CU_M
        mse_amount = mean_squared_error(test_amount, forecast_amount)
        rmse_amount = np.sqrt(mse_amount)
        mae_amount = mean_absolute_error(test_amount, forecast_amount)
        mape_amount = np.mean(np.abs((test_amount - forecast_amount) / test_amount)) * 100

        mse_cum = mean_squared_error(test_cum, forecast_cum)
        rmse_cum = np.sqrt(mse_cum)
        mae_cum = mean_absolute_error(test_cum, forecast_cum)
        mape_cum = np.mean(np.abs((test_cum - forecast_cum) / test_cum)) * 100

        # Print the accuracy metrics
        print(f"Amount Model - MSE: {mse_amount}, RMSE: {rmse_amount}, MAE: {mae_amount}, MAPE: {mape_amount}%")
        print(f"CU_M Model - MSE: {mse_cum}, RMSE: {rmse_cum}, MAE: {mae_cum}, MAPE: {mape_cum}%")

        # Prepare the response
        response = {
            'dates': [date.strftime('%Y-%m') for date in df_monthly.index] + [date.strftime('%Y-%m') for date in pd.date_range(start=df_monthly.index[-1] + pd.DateOffset(months=1), periods=len(test_amount), freq='M')],
            'historical_amounts': [float(value) for value in df_monthly['Amount'].tolist()],
            'forecasted_amounts': [None] * len(df_monthly['Amount'].tolist()) + [float(value) for value in forecast_amount.tolist()],
            'historical_cum': [float(value) for value in df_monthly['CU_M'].tolist()],
            'forecasted_cum': [None] * len(df_monthly['CU_M'].tolist()) + [float(value) for value in forecast_cum.tolist()],
            'mape_amount': mape_amount,
            'mape_cum': mape_cum
        }

        return jsonify(response)

    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
