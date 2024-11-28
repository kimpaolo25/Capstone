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
        <p style="text-align: justify;">
Effective Date: November 25, 2024<br><br>
Welcome to the Pansol Rural Waterworks Association Inc. (PRWAI) website. By accessing or using our services, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.<br><br>

<strong>1. Acceptance of Terms</strong><br>
By using this website, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website.<br><br>

<strong>2. Changes to Terms</strong><br>
PRWAI reserves the right to modify these terms at any time. Any changes will be effective immediately upon posting on this site. Your continued use of the website after changes are made constitutes your acceptance of the new terms.<br><br>

<strong>3. Use of the Website</strong><br>
- You agree to use the website only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else's use of the website.<br>
- You must not misuse our site by knowingly introducing viruses, trojans, worms, or other malicious software.<br><br>

<strong>4. Intellectual Property</strong><br>
All content on this website, including text, graphics, logos, and images, is the property of PRWAI or its content suppliers and is protected by copyright and intellectual property laws. You may not reproduce, distribute, or create derivative works from any content without prior written permission from PRWAI.<br><br>

<strong>5. User Accounts</strong><br>
To access certain features of our website, the admin will create an account for you based on the information you provide. You agree to provide accurate and complete information during registration and to update it as necessary to keep it accurate. You are responsible for maintaining the confidentiality of your account credentials.<br><br>

<strong>6. Limitation of Liability</strong><br>
PRWAI will not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your access to or use of (or inability to access or use) this website or any content on it.<br><br>

<strong>7. Contact Information</strong><br>
If you have any questions about these Terms and Conditions, please contact us at <span style="color: blue; text-decoration: underline;">pansolwaterworks@yahoo.com.ph</span>
<br><br>

By using our website, you signify your acceptance of these Terms and Conditions. If you do not agree to these terms, please refrain from using our site. Thank you for visiting PRWAI!
</p>
    </div>
</div>

<!-- Privacy Policy Modal -->
<div id="privacyModal" class="policyWrapper">
    <div class="policy-wrapper">
        <div class="policy-header">Privacy Policy</div>
        <span class="close-button" onclick="hidePrivacyModal()"></span>
        <p style="text-align: justify;">
    Effective Date: November 25, 2024<br><br>
    Pansol Rural Waterworks Association Inc. (PRWAI) is committed to protecting your privacy. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website or use our services. Please read this policy carefully to understand our practices regarding your personal information.<br><br>

    <strong>1. Information We Collect</strong><br>
    We may collect the following types of information:<br>
    Personal Information: Information such as name and login credentials.<br>
    Usage Data: Information about how you use our website and services, including your IP address, browser type, pages visited, and time spent on those pages.<br>
    Billing Information: This encompasses information related to billing, including your billing area, cubic meter consumed, amount to be paid, and name of the consumer.<br><br>

    <strong>2. How We Use Your Information</strong><br>
    PRWAI uses the information we collect for various purposes, including:<br>
    - To analyze the trends of movements of PRWAI water income.<br>
    - To forecast or predict the income of PRWAI water income.<br>
    - To improve our decision-making and insights generation.<br><br>

    <strong>3. Disclosure of Your Information</strong><br>
    We do not sell or rent your billing information to third parties. We may share your information in the following circumstances:<br>
    Legal Requirements: We may disclose your personal information if required to do so by law or in response to valid requests by public authorities.<br>
    Protection of Rights: We may disclose your information when we believe in good faith that such action is necessary to comply with the law, protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.<br>
    Aggregated Data: We may share aggregated or anonymized data that does not directly identify you with third parties for research and analysis purposes.<br><br>

    <strong>4. Data Security</strong><br>
    The security of your data is important to us. We implement reasonable security measures to protect your personal information from unauthorized access, use, alteration, or destruction. However, no method of transmission over the internet or method of electronic storage is 100% secure.<br><br>

    <strong>5. Consumer Rights</strong><br>
    Consumers have specific rights regarding their personal information, which are designed to protect their privacy and ensure transparency in how their data is handled. Depending on your location, you may have the following rights:<br>
    Right to Access: You have the right to request access to the personal data we hold about you. This allows you to receive a copy of your information and verify how we are using it.<br>
    Right to Rectification: You have the right to request correction of any inaccurate or incomplete personal data we hold about you. We strive to ensure that your information is accurate and up-to-date.<br>
    Right to Deletion: Under certain conditions, you have the right to request the deletion of your personal data. This right allows you to ask us to erase your information when it is no longer necessary for the purposes for which it was collected or when you withdraw your consent.<br><br>

    <strong>6. Changes to This Privacy Policy</strong><br>
    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.<br><br>

    <strong>7. Contact Us</strong><br>
    If you have any questions about this Privacy Policy or our data practices, please contact us at <span style="color: blue; text-decoration: underline;">pansolwaterworks@yahoo.com.ph</span>.<br><br>

    By using our website and services, you consent to the terms outlined in this Privacy Policy. Thank you for trusting PRWAI with your information!
</p>

    </div>
</div>



<!-- Body Content -->
    <div class="container">
    <div class="content">
        <img src="./image/icon.png" alt="Logo" class="logo">
        <h1>Dashboard Analysis of <br> Water Income</h1>
        <p>PRWAI Descriptive and Predictive Analysis of Water <br> Income through the use of Dashboard</p>
        <a class="button" id="loginButton" onclick="showLoginModal()">Get Started</a>
        <footer id="footer">
    <p1>By clicking the Get Started button, you agree to PRWAI <a href="#" onclick="showTermsModal()" class="custom-link">Terms and Conditions of Use</a>.</p1>
    <br>
    <p1>To learn more about how PRWAI collects, uses, and protects information, please see <a href="#" onclick="showPrivacyModal()" class="custom-link">PRWAI Privacy Policy</a>.</p1>
</footer>
    </div>

</div>
    
<script src="./Javascript/terms_policy.js"></script>
    <script src="./Javascript/modal_login.js"></script>
    <script src="./Javascript/password.js"></script>
</body>
</html>
