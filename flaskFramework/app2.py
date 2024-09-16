from flask import Flask, jsonify
import pandas as pd
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
import datetime

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
        SELECT 
        c.Date_column, 
        c.Amount, 
        c.Area_Number, 
        c.CU_M, 
        p.places_name
        FROM 
        customers c
        JOIN 
        places p 
        ON 
        c.Area_Number = p.Area_Number

        ORDER BY 
            STR_TO_DATE(c.Date_column, '%Y-%b') ASC;

        """
        df = pd.read_sql(query, engine)
        print("Data fetched from database:", df.head())

        # Convert 'Date_column' to datetime with the specified format
        df['Date_column'] = pd.to_datetime(df['Date_column'], format='%Y-%b')

        # Feature Engineering
        df['Year'] = df['Date_column'].dt.year
        df['Month'] = df['Date_column'].dt.month
        df['Day_of_Week'] = df['Date_column'].dt.dayofweek
        df['Rolling_Mean_Amount'] = df['Amount'].rolling(window=3).mean()
        df['Rolling_Std_Amount'] = df['Amount'].rolling(window=3).std()
        df['Rolling_Mean_CU_M'] = df['CU_M'].rolling(window=3).mean()
        df['Rolling_Std_CU_M'] = df['CU_M'].rolling(window=3).std()
        
        # Handle missing values if any
        df.fillna(method='bfill', inplace=True)

        # Set 'Date_column' as index for the entire DataFrame
        df.set_index('Date_column', inplace=True)

        # Resample and aggregate the entire DataFrame
        df_monthly = df.resample('M').sum()

        # Decompose 'Amount' series
        decomposition = seasonal_decompose(df_monthly['Amount'], model='additive')
        trend = decomposition.trend.dropna()
        seasonal = decomposition.seasonal.dropna()
        residual = decomposition.resid.dropna()

        # Apply differencing to the residual (deseasonalized) data to make it stationary
        differenced_residual = residual.diff().dropna()

        # Use CU_M as an exogenous variable, truncate to match the differenced residuals
        exog = df_monthly['CU_M'].loc[differenced_residual.index]  # Ensure alignment of index

        # Fit ARIMA model on the differenced residual of 'Amount' using CU_M as exogenous
        model_income = ARIMA(differenced_residual, exog=exog, order=(4, 0, 0))
        model_income_fit = model_income.fit()

        # Forecast using the ARIMA model
        forecast_residual = model_income_fit.forecast(steps=12, exog=exog[-12:])

        # Reverse the differencing
        last_residual_value = residual[-1]  # Last actual value before differencing
        forecast_residual_original_scale = forecast_residual.cumsum() + last_residual_value

        # Add back the seasonal component to revert to the original scale
        seasonal_last_period = seasonal[-12:]  # Use the last 12 months of the seasonal component
        forecast_income_original_scale = forecast_residual_original_scale + seasonal_last_period.values






        # Fit ARIMA model for CU_M (cubic meter usage)
        model_cum = ARIMA(df_monthly['CU_M'], order=(5, 1, 0))
        model_cum_fit = model_cum.fit()
        forecast_cum = model_cum_fit.forecast(steps=12)


        # Prepare forecasts for each area
        area_income_predictions = {}
        area_cum_predictions = {}

        for area in df['Area_Number'].unique():
            area_df = df[df['Area_Number'] == area].copy()
            area_df = area_df.resample('M').sum()

            if len(area_df) > 0:
                decomposition_area = seasonal_decompose(area_df['Amount'], model='additive')
                residual_area = decomposition_area.resid.dropna()
                differenced_residual_area = residual_area.diff().dropna()

                # Align exog (CU_M) with the differenced residuals for each area
                exog_area = area_df['CU_M'].loc[differenced_residual_area.index]
                model_income_area = ARIMA(differenced_residual_area, exog=exog_area, order=(5, 0, 0))
                model_income_fit_area = model_income_area.fit()
                forecast_residual_area = model_income_fit_area.forecast(steps=12, exog=exog_area[-12:])

                # Reverse the differencing for area
                last_residual_area_value = residual_area[-1]  # Last value before differencing
                forecast_residual_area_original_scale = forecast_residual_area.cumsum() + last_residual_area_value

                # Add back seasonal component for area
                seasonal_last_period_area = decomposition_area.seasonal[-12:]
                forecast_income_area_original_scale = forecast_residual_area_original_scale + seasonal_last_period_area.values

                area_income_predictions[area] = forecast_income_area_original_scale.tolist()

                model_cum_area = ARIMA(area_df['CU_M'], order=(5, 1, 0))
                model_cum_fit_area = model_cum_area.fit()
                forecast_cum_area = model_cum_fit_area.forecast(steps=12)
                area_cum_predictions[area] = forecast_cum_area.tolist()

        place_names = df[['Area_Number', 'places_name']].drop_duplicates().set_index('Area_Number').to_dict()['places_name']

        future_dates = [df.index[-1] + pd.DateOffset(months=i) for i in range(1, 13)]
        response = {
            'dates': [date.strftime('%Y-%m') for date in future_dates],
            'predictions': [float(value) for value in forecast_income_original_scale.tolist()],
            'cum_predictions': [float(value) for value in forecast_cum.tolist()],
            'area_income_predictions': {place_names.get(area, str(area)): [float(value) for value in forecasts] for area, forecasts in area_income_predictions.items()},
            'area_cum_predictions': {place_names.get(area, str(area)): [float(value) for value in forecasts] for area, forecasts in area_cum_predictions.items()}
        }

        return jsonify(response)
    
    except Exception as e:
        import traceback
        app.logger.error("Error occurred:\n%s", traceback.format_exc())
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)
