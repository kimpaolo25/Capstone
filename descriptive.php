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
        <a href="#" class="login-button" id="loginButton">Admin Login</a>
    </header>

    <!-- Login Modal -->
    <div id="loginModal" class="wrapper">
        <div class="login-wrapper">
            <span class="close-button" onclick="document.getElementById('loginModal').style.display='none'"></span>
            <div class="login-header">Login</div>
            <div class="login-form">
                    <div class="input-wrapper">
                        <input type="text" id="username" 
                        class="input-field" required/>
                        <label for="username"
                        class="label">Username</label>
                        <i class="bx bx-user icon"></i>
                        <span class="icon">&#128100;</span>
                    </div>

                    <div class="input-wrapper">
                        <input type="password" id="password" 
                        class="input-field" required/>
                        <label for="password"
                        class="label">Password</label>
                        <i class="bx bx-lock-alt icon"></i>
                        <span class="icon">&#128274;</span>
                    </div>

                    <div class="checkbox-container">
                            <input type="checkbox" id="chk"> Show Password
                        </div>
                    
                    <div class="input-wrapper">
                        <input type="submit"
                        id="loginButton1"
                        class="input-login"
                        value="Login" />
                    </div>
                    <!-- For Testing only -->
                    <script>
                    document.getElementById('loginButton1').addEventListener('click', function() {
                        window.location.href = 'admin.php';
                        });
</script>

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
    <script src="./Javascript/password.js"></script>

</body>
</html>
