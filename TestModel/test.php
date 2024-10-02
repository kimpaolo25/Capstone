<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forecast Visualization</title>
    <!-- Include Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Include SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        h1 {
            text-align: center;
            margin-bottom: 20px;
        }
        .chart-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        canvas {
            max-width: 100%;
        }
    </style>
</head>
<body>

    <h1>Forecast Visualization</h1>

    <div class="chart-container">
        <canvas id="monthlyIncomeChart"></canvas>
    </div>
    <div class="chart-container">
        <canvas id="monthlyCUMChart"></canvas>
    </div>

    <script src="./prediction.js"></script> <!-- Link to your prediction.js -->

</body>
</html>
