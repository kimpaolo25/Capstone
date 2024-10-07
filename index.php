<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Analysis of Water Income</title>
    <link rel="stylesheet" href="./css/index.css">
    <link rel="stylesheet" href="./css/login.css">
    <script src="./Javascript/sweetalert.js"></script>  
    <link rel="icon" type="image/png" href="./image/icon.png"> 
</head>
<body>


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


    <div class="container">
        <div class="content">
            <img src="./image/icon.png" alt="Logo" class="logo">
            <h1>Dashboard Analysis of <br> Water Income</h1>
            <p>PRWAI Descriptive and Predictive Analysis of Water <br> Income through the use of Dashboard</p>
            <a  class="button" id="loginButton" onclick="showLoginModal()">Get Started</a>
        </div>
    </div>
    
    <script src="./Javascript/modal_login.js"></script>
</body>
</html>
