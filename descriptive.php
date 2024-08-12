<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Descriptive Dashboard</title>
    <link rel="stylesheet" href="./css/descriptive.css">
</head>
<body>
    <header>
        <img src="./image/icon.png" alt="Logo" class="logo">
        <a href="#" class="login-button" id="loginButton">Admin Login</a>
    </header>

<!-- Login Modal -->
<div id="loginModal" class="modal">
    <div class="modal-content">
        <span class="close-button" onclick="document.getElementById('loginModal').style.display='none'">&times;</span>
        <div class="login-container">
            <h1>Admin Login</h1>
            <form>
                <div class="input-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" required>
                    <span class="icon">&#128100;</span>
                </div>
                <div class="input-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                    <span class="icon">&#128274;</span>
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    </div>
</div>

    <div class="dashboard">
        <div class="card">Paid this Month</div>
        <div class="card">Month Income</div>
        <div class="card">Year Income</div>
        <div class="card chart">Total Amount Income per Year</div>
        <div class="card chart">Total Income per Area</div>
        <div class="card chart">Income per Month</div>
        <div class="card chart">Cubic meter Consumption per Month</div>
    </div>

    <script src="./Javascript/modal_login.js"></script>

</body>
</html>
