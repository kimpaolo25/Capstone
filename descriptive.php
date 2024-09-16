<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Descriptive Dashboard</title>
    <link rel="stylesheet" href="./css/descriptive.css">
    <script src="./Javascript/sweetalert.js"></script>
</head>
<body>
    <header>
        <a href="index.php" class="logo-button" id="logoButton">
            <img src="./image/icon.png" alt="Logo" class="logo">
        </a>
        <a href="#" class="login-button" id="loginButton" onclick="showLoginModal()">Admin Login</a>
    </header>

    <!-- Login Modal -->
    <div id="loginModal" class="wrapper" style="display: none;">
        <div class="login-wrapper">
            <span class="close-button" onclick="hideLoginModal()"></span>
            <div class="login-header">Login</div>
            <div class="login-form">
                <form id="loginForm">
                    <div class="input-wrapper">
                        <input type="text" id="username" name="username" class="input-field" required />
                        <label for="username" class="label">Username</label>
                        <span class="icon">&#128100;</span>
                    </div>

                    <div class="input-wrapper">
                        <input type="password" id="password" name="password" class="input-field" required />
                        <label for="password" class="label">Password</label>
                        <span class="icon">&#128274;</span>
                    </div>

                    <div class="checkbox-container">
                        <input type="checkbox" id="chk" onclick="togglePasswordVisibility()"> Show Password
                    </div>

                    <div class="input-wrapper">
                        <input type="submit" id="loginButton1" class="input-login" value="Login" />
                    </div>

                    <div id="loginError" style="color: red;"></div>
                </form>
            </div>
        </div>
    </div>

    <div class="dashboard">
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


    <script src="./Javascript/descriptive.js"></script>
    <script src="./Javascript/modal_login.js"></script>
    <script src="./Javascript/password.js"></script>
</body>
</html>
