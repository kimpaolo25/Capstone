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
    <title>Manage Account</title>
    <link rel="stylesheet" href="./css/manage_acc.css">
    <script src="./Javascript/sweetalert.js"></script>
</head>
<body>

    <header>
        <img src="./image/icon.png" alt="Logo" class="logo">
        <a href="admin.php" class="dashboard-button" id="dashButton">Dashboard</a>
        <a href="billManager.php" class="bills-button" id="billsButton">Bill Manager</a>
        <a href="manage_acc.php" class="accs-button" id="accsButton">Manage Account</a>
        <a href="index.php" class="exit-button" id="exitButton">
            <img src="./image/out.png" alt="Exit">
        </a>
    </header>

    <div class="container">
        <h1>Manage Account</h1>

        <div class="table-controls">
        <div class="add-button-container">
            <button id="addButton">Add</button>
        </div>
        </div>


        <!-- Accounts Table -->
        <div class="table-container">
            <h2>Accounts List</h2>
            <table id="dataTable">
                <thead>
                    <tr>
                        <th class="account-id">Account ID</th> <!-- Hidden column -->
                        <th>Name</th>
                        <th>Username</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Example row structure -->
                    <tr>

                    </tr>
                </tbody>
            </table>
        </div>


<!-- Add Account Modal -->
<div id="addModal" class="add_acc">
    <div class="manage_acc-content">
        <span id="close" class="close-button" onclick="closeModal()"></span>
        <div class="manage_acc-header">Update Account</div>

        <form id="addUserForm"> <!-- Ensure this ID matches -->
            <div class="manage_acc-field">
                <input type="text" id="modalAddName" name="name" class="manageAccInput-field" required />
                <label for="modalName" class="manageAccLabel">Name:</label>
            </div>

            <div class="manage_acc-field">
                <input type="text" id="modalAddUname" name="username" class="manageAccInput-field" required />
                <label for="modalUname" class="manageAccLabel">Username:</label>
            </div>

            <div class="manage_acc-field">
                <input type="password" id="modalPass" name="password" class="manageAccInput-field" required />
                <label for="modalPass" class="manageAccLabel">Password:</label>
            </div>

            <div class="manage_acc-field">
                <input type="password" id="modalAddConfirmpass" name="confirm_password" class="manageAccInput-field" required />
                <label for="modalConfirmpass" class="manageAccLabel">Confirm Password:</label>
            </div>

            <div class="checkbox-container">
                <input type="checkbox" id="addChk" onclick="togglePasswordVisibility()"> Show Password
            </div>

            <div class="manage_acc-button">
                <button type="submit" id="submitAccountButton">Submit</button>
            </div>
        </form>
    </div>
</div>




<!-- Update Account Modal -->
<div id="updateModal" class="manage_acc">
    <div class="manage_acc-content">
        <span id="close" class="close-button" onclick="closeModal()"></span>
        <div class="manage_acc-header">Update Account</div>

        <form id="updateUserForm"> <!-- Ensure this ID matches -->
            <div class="manage_acc-field">
                <input type="text" id="modalName" name="name" class="manageAccInput-field" required />
                <label for="modalName" class="manageAccLabel">Name:</label>
            </div>

            <div class="manage_acc-field">
                <input type="text" id="modalUname" name="username" class="manageAccInput-field" required />
                <label for="modalUname" class="manageAccLabel">Username:</label>
            </div>

            <div class="manage_acc-field">
                <input type="password" id="modalCurrentpass" name="current_password" class="manageAccInput-field" required />
                <label for="modalCurrentpass" class="manageAccLabel">Current Password:</label>
            </div>

            <div class="manage_acc-field">
                <input type="password" id="modalNewpass" name="new_password" class="manageAccInput-field" required />
                <label for="modalNewpass" class="manageAccLabel">New Password:</label>
            </div>

            <div class="manage_acc-field">
                <input type="password" id="modalConfirmpass" name="confirm_password" class="manageAccInput-field" required />
                <label for="modalConfirmpass" class="manageAccLabel">Confirm Password:</label>
            </div>

            <div class="checkbox-container">
                <input type="checkbox" id="chk" onclick="togglePasswordVisibility()"> Show Password
            </div>

            <div class="manage_acc-button">
                <button type="submit" id="saveAccountButton">Save Changes</button>
                <button type="reset" id="resetAccountButton">Reset</button>
            </div>
        </form>
    </div>
</div>



    <script src="./javascript/manage_acc.js" defer></script>
    <script src="./Javascript/utils.js"></script>
</body>
</html>
