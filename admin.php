<?php
session_start();

// Check if the user is logged in
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    // Redirect to login page if not logged in
    header("Location: index.php");
    exit();
}
?>

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
    <script src="./javascript/descriptive.js" defer></script>
</head>
<body>
    <header>
        <img src="./image/icon.png" alt="Logo" class="logo">
        <a href="#" class="dashboard-button" id="dashButton">Dashboard</a>
        <a href="billManager.php" class="bills-button" id="billsButton">Bill Manager</a>
        <a href="logout.php" class="exit-button" id="exitButton">
            <img src="./image/out.png" alt="Exit">
        </a>
    </header>

    <h2 class="desc">Descriptive Analytics</h2>

    <div class="descDashboard">
        <!-- Card for Number of Bills This Month -->
        <div class="card_chart">
            <h2>Number of Bills This Month</h2>
            <div id="billsThisMonth">Loading...</div>
        </div>

        <!-- Card for Number of Bills This Year -->
        <div class="card_chart">
            <h2>Number of Bills This Year</h2>
            <div id="billsThisYear">Loading...</div>
        </div>

        <!-- Card for Overall Income -->
        <div class="card_chart">
            <h2>Overall Expected Income</h2>
            <div id="overallIncome">Loading...</div>
        </div>
        </div>


    <div class="descDashboard2">
        <!-- New Cards -->
        <!-- Chart for Total Amount Income per Year -->
<div class="card_chart">
    <h2>Total Income per Year</h2>
    <canvas id="incomeChart"></canvas>
</div>


<div class="card_chart">
    <h2>Total Income per Area</h2>
    <canvas id="incomeAreaChart"></canvas>
</div>


<div class="card_chart">
    <h2>Total Income per Month</h2>
    <canvas id="incomeMonthChart"></canvas>
</div>


        <div class="card_chart">
            <h2>Cubic meter Consumption per Month</h2>
            <canvas id="cubicMeterChart"></canvas>
        </div>
    </div>


    <h2 class="desc">Predictive Analytics</h2>

    <div class="dashboard">
        <!-- Card for Monthly Income Chart -->
        <div class="card_chart">
            <h2>Predicted Monthly Income</h2>
            <canvas id="monthlyIncomeChart"></canvas>
        </div>

        <!-- Card for Monthly CU_M Chart -->
        <div class="card_chart">
            <h2>Predicted Monthly Cubic Meter</h2>
            <canvas id="monthlyCUMChart"></canvas>
        </div>
    </div>
</body>
</html>
