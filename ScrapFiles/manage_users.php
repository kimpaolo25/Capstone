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
    <title>User Management</title>
    <link rel="stylesheet" href="./css/manage_user.css">
    <script src="./Javascript/sweetalert.js"></script>
</head>
<body>

    <header>
        <img src="./image/icon.png" alt="Logo" class="logo">
        <a href="admin.php" class="dashboard-button" id="dashButton">Dashboard</a>
        <a href="billManager.php" class="bills-button" id="billsButton">Bill Manager</a>
        <a href="manage_acc.php" class="accs-button" id="accsButton">Manage Account</a>
        <a href="manage_user.php" class="user-manage" id="userManage">User Management</a>
        <a href="javascript:void(0)" class="exit-button" id="exitButton" onclick="confirmLogout()">
            <img src="./image/out.png" alt="Exit">
        </a>
    </header>

    <div class="container">
        <h1>User Management</h1>

        <div class="table-controls">
        <div class="add-button-container">
            <button id="addButton">Add</button>
        </div>
        </div>


        <!-- Accounts Table -->
        <div class="table-container">
            <h2>User List</h2>
            <table id="dataTable">
                <thead>
                    <tr>
                        <th class="account-id">User ID</th> <!-- Hidden column -->
                        <th>Name</th>
                        <th>Area</th>
                        <th>Status</th>
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


<!-- Update Account Modal -->
<div id="updateModal" class="update_user">
    <div class="manage_user-content">
        <span id="close" class="close-button" onclick="closeModal()"></span>
        <div class="manage_user-header">Update User</div>

        <form id="updateUserForm">
            <div class="manage_user-field">
                <input type="text" id="modalUpdateName" name="name" class="manageUserInput-field" required />
                <label for="modalUpdateName" class="manageUserLabel">Name:</label>
            </div>

            <div class="manage_user-field">
                <input type="text" id="modalUpdateArea" name="area" class="manageUserInput-field" required />
                <label for="modalUpdateArea" class="manageUserLabel">Area:</label>
            </div>


            <div class="manage_user-field">
                <select id="modalUserStats" name="user_stats" class="manageUserInput-field" required>
                    <option value="" disabled selected hidden></option> <!-- Placeholder Option -->
                    <option value="active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Disconnected">Disconnected</option>
                </select>
                <label for="modalUserStats" class="manageUserLabel">Status</label>
            </div>

            <div class="manage_user-button">
                <button type="submit" id="submitUserButton">Submit</button>
            </div>
        </form>
    </div>
</div>


<!-- Add Account Modal -->
<div id="addModal" class="add_user">
    <div class="manage_user-content">
        <span id="close" class="close-button" onclick="closeModal()"></span>
        <div class="manage_user-header">Add User</div>

        <form id="addUserForm">
            <div class="manage_user-field">
                <input type="text" id="modalAddName" name="name" class="manageUserInput-field" required />
                <label for="modalAddName" class="manageUserLabel">Name:</label>
            </div>

            <div class="manage_user-field">
                <input type="text" id="modalAddArea" name="username" class="manageUserInput-field" required />
                <label for="modalAddArea" class="manageUserLabel">Area:</label>
            </div>


            <div class="manage_user-field">
                <select id="modalUserStats" name="user_stats" class="manageUserInput-field" required>
                    <option value="" disabled selected hidden></option> <!-- Placeholder Option -->
                    <option value="active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Disconnected">Disconnected</option>
                </select>
                <label for="modalUserStats" class="manageUserLabel">Status</label>
            </div>

            <div class="manage_user-button">
                <button type="submit" id="addUserButton">Submit</button>
            </div>
        </form>
    </div>
</div>





    <script src="./javascript/manage_user.js" defer></script>
    <script src="./Javascript/utils.js"></script>
</body>
</html>
