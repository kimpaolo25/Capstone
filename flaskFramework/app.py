from flask import Flask, jsonify
import pandas as pd
from flask_cors import CORS
from sqlalchemy import create_engine
from statsmodels.tsa.arima.model import ARIMA
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
        SELECT c.Date_column, c.Amount, c.Area_Number, c.CU_M, p.places_name
        FROM customers c
        JOIN places p ON c.Area_Number = p.Area_Number
        WHERE c.Date_column IS NOT NULL
        ORDER BY c.Date_column ASC
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

        # Fit ARIMA model for overall income
        model_income = ARIMA(df_monthly['Amount'], order=(5, 1, 0))
        model_income_fit = model_income.fit()
        forecast_income = model_income_fit.forecast(steps=12)

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
                model_income_area = ARIMA(area_df['Amount'], order=(5, 1, 0))
                model_income_fit = model_income_area.fit()
                forecast_income_area = model_income_fit.forecast(steps=12)
                area_income_predictions[area] = forecast_income_area.tolist()

                model_cum_area = ARIMA(area_df['CU_M'], order=(5, 1, 0))
                model_cum_fit = model_cum_area.fit()
                forecast_cum_area = model_cum_fit.forecast(steps=12)
                area_cum_predictions[area] = forecast_cum_area.tolist()

        place_names = df[['Area_Number', 'places_name']].drop_duplicates().set_index('Area_Number').to_dict()['places_name']
        
        future_dates = [df.index[-1] + pd.DateOffset(months=i) for i in range(1, 13)]
        response = {
            'dates': [date.strftime('%Y-%m') for date in future_dates],
            'predictions': [float(value) for value in forecast_income.tolist()],
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
