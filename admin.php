<?php
session_start();

if (!isset($_SESSION['loggedin']) || ($_SESSION['user_level'] != 1 && $_SESSION['user_level'] != 2)) {
    // Redirect non-admin and non-staff users back to the login page or an error page
    header('Location: index.php');
    exit;
}

// Fetch the user's name from the session for the personalized greeting
$userName = $_SESSION['name'];
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
        
        <!-- Navigation Links -->
        <a href="admin.php" class="dashboard-button" id="dashButton">Dashboard</a>
        <a href="billManager.php" class="bills-button" id="billsButton">Bill Manager</a>
        <?php if (isset($_SESSION['user_level']) && $_SESSION['user_level'] == 1): ?>
        <!-- Only show "Manage Account" if user is an admin (user_level == 1) -->
        <a href="manage_acc.php" class="accs-button" id="accsButton">Manage Account</a>
        <?php endif; ?>
        <a href="javascript:void(0)" class="exit-button" id="exitButton">
            <img src="./image/out.png" alt="Exit">
        </a>
    </header>

    <!-- Personalized Greeting -->
    <h2 class="userName">Good Day, <?php echo htmlspecialchars($userName); ?>!</h2>

    <h2 class="desc">Descriptive Analytics</h2>

    <div class="descDashboard">
        <!-- Card for Number of Bills This Month -->
        <div class="card_chart">
            <h2>Total Number of Bills This Month</h2>
            <div id="billsThisMonth">Loading...</div>
        </div>

        <!-- Card for Number of Bills This Year -->
        <div class="card_chart">
            <h2>Total Number of Bills This Year</h2>
            <div id="billsThisYear">Loading...</div>
        </div>

        <!-- Card for Overall Income -->
        <div class="card_chart">
            <h2>Expected Income This Year</h2>
            <div id="overallIncome">Loading...</div>
        </div>
    </div>

    <div class="descDashboard2">
        <!-- New Cards -->
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
