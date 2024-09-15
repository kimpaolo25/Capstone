<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="./css/admin.css">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="./javascript/admin.js" defer></script>
    <script src="./javascript/prediction.js" defer></script>
</head>
<body>
    <header>
        <img src="./image/icon.png" alt="Logo" class="logo">
        <a href="#" class="dashboard-button" id="dashButton">Dashboard</a>
        <a href="billManager.php" class="bills-button" id="billsButton">Bill Manager</a>
        <a href="index.php" class="exit-button" id="exitButton">
            <img src="./image/out.png" alt="Exit">
        </a>
    </header>

    <div class="dashboard">
        <!-- Card for Monthly Income Chart -->
        <div class="card_chart">
            <h2>Predicted Monthly Income</h2>
            <canvas id="monthlyIncomeChart"></canvas>
        </div>

        <!-- Card for Monthly CU_M Chart -->
        <div class="card_chart">
            <h2>Predicted Monthly CU_M</h2>
            <canvas id="monthlyCUMChart"></canvas>
        </div>

        <!-- Card for Predicted Income per Area Number -->
        <div class="card_chart">
            <h2>Predicted Income per Area</h2>
            <canvas id="incomePerAreaChart"></canvas>
        </div>

        <!-- Card for Predicted CU_M per Area Number -->
        <div class="card_chart">
            <h2>Predicted CU_M per Area</h2>
            <canvas id="cumPerAreaChart"></canvas>
        </div>
    </div>
</body>
</html>
