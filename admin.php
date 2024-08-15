<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="./css/admin.css">
    <script src="./Javascript/sweetalert.js"></script>
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
        <div class="card">Paid this Month</div>
        <div class="card">Month Income</div>
        <div class="card">Year Income</div>
        <div class="card chart">Total Amount Income per Year</div>
        <div class="card chart">Total Income per Area</div>
        <div class="card chart">Income per Month</div>
        <div class="card chart">Cubic meter Consumption per Month</div>
    </div>

    <script src="./Javascript/admin.js"></script>

</body>
</html>
