<?php
session_start();

if (!isset($_SESSION['loggedin']) || $_SESSION['user_level'] != 1) {
    // Redirect non-admin users back to the login page or an error page
    header('Location: admin.php');
    exit;
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


<!-- Headers Controls -->
    <header>
        <img src="./image/icon.png" alt="Logo" class="logo">
        <a href="admin.php" class="dashboard-button" id="dashButton">Dashboard</a>
        <a href="billManager.php" class="bills-button" id="billsButton">Bill Manager</a>
        <a href="manage_acc.php" class="accs-button" id="accsButton">Manage Account</a>
        <a href="javascript:void(0)" class="exit-button" id="exitButton">
            <img src="./image/out.png" alt="Exit">
        </a>
    </header>

    <div class="container">
        <h1>Manage Account</h1>

        <div class="table-controls">
    <div class="add-button-container">
        <button id="addButton">Add</button>
        <button id="activityLogsButton">Activity Logs</button> <!-- New Activity Logs Button -->
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

<!-- Activity Logs Modal -->
<div id="activityLogsModal" class="logsModal">
    <div class="logsModal-content">
        <span class="close-button" onclick="closeActivityLogsModal()"></span>
        <h2>Activity Logs</h2>
        <div class="logs-container">
            <ul id="activityLogsList">
                <li>

                </li>
                <!-- More log entries can be added here -->
            </ul>
        </div>
    </div>
</div>        


<!-- Add Account Modal -->
<div id="addModal" class="add_acc">
    <div class="manage_acc-content">
        <span id="close" class="close-button" onclick="closeModal()"></span>
        <div class="manage_acc-header">Add Account</div>

        <form id="addUserForm">
            <div class="manage_acc-field">
                <input type="text" id="modalAddName" name="name" class="manageAccInput-field" required />
                <label for="modalAddName" class="manageAccLabel">Name:</label>
            </div>

            <div class="manage_acc-field">
                <input type="text" id="modalAddUname" name="username" class="manageAccInput-field" required />
                <label for="modalAddUname" class="manageAccLabel">Username:</label>
            </div>

            <div class="manage_acc-field">
                <input type="password" id="modalPass" name="password" class="manageAccInput-field" required />
                <label for="modalPass" class="manageAccLabel">Password:</label>
            </div>

            <div class="manage_acc-field">
                <input type="password" id="modalAddConfirmpass" name="confirm_password" class="manageAccInput-field" required />
                <label for="modalAddConfirmpass" class="manageAccLabel">Confirm Password:</label>
            </div>

            <div class="manage_acc-field">
                <select id="userLevel" name="user_level" class="manageAccInput-field" required>
                    <option value="" disabled selected hidden></option> <!-- Placeholder Option -->
                    <option value="1">Admin</option>
                    <option value="2">Staff</option>
                </select>
                <label for="modalUserLevel" class="manageAccLabel">User Role</label>
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
                <input type="text" id="modalCurrentuname" name="current_username" class="manageAccInput-field" required/>
                <label for="modalCurrentuname" class="manageAccLabel">Current Username:</label>
            </div>

            <div class="manage_acc-field">
                <input type="text" id="modalUname" name="username" class="manageAccInput-field" required/>
                <label for="modalUname" class="manageAccLabel">New Username:</label>
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

            <!-- Add User Level Dropdown -->
            <div class="manage_acc-field">
                <select id="modalUserLevel" name="user_level" class="manageAccInput-field select-dropdown" required>
                    <option value="" disabled selected hidden></option> <!-- Placeholder Option -->
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                </select>
                <label for="modalUserLevel" class="manageAccLabel">User Level</label>
            </div>


            <div class="checkbox-container">
                <input type="checkbox" id="chk" onclick="togglePasswordVisibility()"> Show Password
            </div>

            <div class="manage_acc-button">
                <button type="submit" id="saveAccountButton">Save Changes</button>
                <button type="reset" id="resetAccountButton" onclick="handleReset()">Reset</button>
            </div>
        </form>
    </div>
</div>

    <script src="./javascript/manage_acc.js" defer></script>
    <script src="./Javascript/utils.js"></script>
    <script src="./Javascript/admin.js" defer></script>
    <script src="./javascript/fetchActivitylogs.js" defer></script>
</body>
</html>
