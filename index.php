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

    <!-- Terms and Conditions Modal -->
<div id="termsModal" class="termsWrapper">
    <div class="terms-wrapper">
        <div class="terms-header">Terms and Conditions</div>
        <span class="close-button" onclick="hideTermsModal()"></span>
        <p>Terms and conditions content goes here...</p>
    </div>
</div>

<!-- Privacy Policy Modal -->
<div id="privacyModal" class="policyWrapper">
    <div class="policy-wrapper">
        <div class="policy-header">Privacy Policy</div>
        <span class="close-button" onclick="hidePrivacyModal()"></span>
        <p>Privacy policy content goes here...</p>
    </div>
</div>



<!-- Body Content -->
    <div class="container">
    <div class="content">
        <img src="./image/icon.png" alt="Logo" class="logo">
        <h1>Dashboard Analysis of <br> Water Income</h1>
        <p>PRWAI Descriptive and Predictive Analysis of Water <br> Income through the use of Dashboard</p>
        <a class="button" id="loginButton" onclick="showLoginModal()">Get Started</a>
    </div>
    <footer>
    <p1>By clicking the Get Started button, you agree to PRWAI <a href="#" onclick="showTermsModal()" class="custom-link">Terms and Conditions of Use</a>.</p1>
    <br>
    <p1>To learn more about how PRWAI collects, uses, and protects information, please see <a href="#" onclick="showPrivacyModal()" class="custom-link">PRWAI Privacy Policy</a>.</p1>
</footer>
</div>
    
<script src="./Javascript/terms_policy.js"></script>
    <script src="./Javascript/modal_login.js"></script>
    <script src="./Javascript/password.js"></script>
</body>
</html>
