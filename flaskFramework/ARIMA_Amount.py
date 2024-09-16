from flask import Flask, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
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
        query = """
        SELECT * FROM customers
        """
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

        # Decompose the series to remove trend (using Amount)
        decomposition = seasonal_decompose(df_monthly['Amount'], model='additive', period=12)
        trend = decomposition.trend.dropna()

        # Remove the trend to work with stationarity
        trend_removed = df_monthly['Amount'] - trend
        trend_removed = trend_removed.dropna()

        # Fit ARIMA model on trend-removed (stationary) data
        model_income = ARIMA(trend_removed, exog=df_monthly['CU_M'].loc[trend_removed.index], order=(4, 0, 0))
        model_income_fit = model_income.fit()

        # Create a forecast
        forecast_steps = 12
        forecast_trend_removed = model_income_fit.forecast(steps=forecast_steps, exog=df_monthly['CU_M'].iloc[-forecast_steps:])
        
        # Revert forecast to original scale by adding back the trend
        trend_future = trend[-forecast_steps:].values  # Use the last observed trend values as future trend
        # Ensure length match between forecast and trend_future
        if len(trend_future) < forecast_steps:
            trend_future = np.pad(trend_future, (0, forecast_steps - len(trend_future)), 'constant', constant_values=(0))
        forecast_income = forecast_trend_removed + trend_future

        # Calculate MSE, RMSE, and MAE
        # Ensure the length match between actual values and forecasted values
        actual_values = df_monthly['Amount'][-forecast_steps:]  # Actual values for comparison
        if len(forecast_income) != len(actual_values):
            forecast_income = forecast_income[:len(actual_values)]
        mse = mean_squared_error(actual_values, forecast_income)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(actual_values, forecast_income)
        
        print(f'MSE: {mse}')
        print(f'RMSE: {rmse}')
        print(f'MAE: {mae}')

        # Fit ARIMA model for CU_M (cubic meter usage) without decomposition
        model_cum = ARIMA(df_monthly['CU_M'], order=(5, 1, 0))
        model_cum_fit = model_cum.fit()
        forecast_cum = model_cum_fit.forecast(steps=forecast_steps)

        # Prepare forecasts for each area
        area_income_predictions = {}
        area_cum_predictions = {}

        for area in df['Area_Number'].unique():
            area_df = df[df['Area_Number'] == area].copy()
            area_df = area_df.resample('M').sum()

            if len(area_df) > 0:
                decomposition_area = seasonal_decompose(area_df['Amount'], model='additive', period=12)
                trend_area = decomposition_area.trend.dropna()
                trend_removed_area = area_df['Amount'] - trend_area
                trend_removed_area = trend_removed_area.dropna()

                model_income_area = ARIMA(trend_removed_area, exog=area_df['CU_M'].loc[trend_removed_area.index], order=(5, 0, 0))
                model_income_fit_area = model_income_area.fit()
                forecast_trend_removed_area = model_income_fit_area.forecast(steps=forecast_steps, exog=area_df['CU_M'].iloc[-forecast_steps:])

                trend_future_area = trend_area[-forecast_steps:].values  # Use last observed trend as future trend
                forecast_income_area = forecast_trend_removed_area + trend_future_area
                area_income_predictions[str(area)] = forecast_income_area.tolist()

                model_cum_area = ARIMA(area_df['CU_M'], order=(5, 1, 0))
                model_cum_fit_area = model_cum_area.fit()
                forecast_cum_area = model_cum_fit_area.forecast(steps=forecast_steps)
                area_cum_predictions[str(area)] = forecast_cum_area.tolist()

        future_dates = [df.index[-1] + pd.DateOffset(months=i) for i in range(1, forecast_steps + 1)]
        response = {
            'dates': [date.strftime('%Y-%m') for date in future_dates],
            'predictions': [float(value) for value in forecast_income.tolist()],
            'cum_predictions': [float(value) for value in forecast_cum.tolist()],
            'area_income_predictions': {str(area): [float(value) for value in forecasts] for area, forecasts in area_income_predictions.items()},
            'area_cum_predictions': {str(area): [float(value) for value in forecasts] for area, forecasts in area_cum_predictions.items()},
            'mse': mse,
            'rmse': rmse,
            'mae': mae
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
