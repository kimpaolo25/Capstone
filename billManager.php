<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="./css/billManager.css">
    <script src="./Javascript/sweetalert.js"></script>
</head>
<body>
    <header>
        <img src="./image/icon.png" alt="Logo" class="logo">
        <a href="admin.php" class="dashboard-button" id="dashButton">Dashboard</a>
        <a href="billManager.php" class="bills-button" id="billsButton">Bill Manager</a>
    </header>

    <div class="table-controls">
        <div class="add-button-container">
            <button id="addButton">Add</button>
        </div>
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Search...">
        </div>
    </div>


    <!-- Modal HTML -->
    <div id="addBillModal" class="modal">
    <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Add Bill Report</h2>
        <form id="addBillForm">
            <div class="modal-section">
                <div class="modal-field">
                    <input type="text" id="name" name="name" placeholder= "Name:" required>
                </div>
                <div class="modal-field">
                    <input type="text" id="area" name="area" placeholder="Area:" required>
                </div>
                <div class="modal-field">
                    <input type="number" id="current" name="current" placeholder="Current:" required>
                </div>
                <div class="modal-field">
                    <input type="number" id="previous" name="previous" placeholder="Previous:" required>
                </div>
            </div>
            <div class="modal-section">
                <div class="modal-field"> 
                    <input type="date" id="date" name="date" placeholder="Date:" required>
                </div>
                <div class="modal-field">
                    <input type="number" id="initialAmount" name="initialAmount" placeholder="Initial Amount:" required>
                </div>
                <div class="modal-field">
                    <input type="number" id="cuM" name="cuM" placeholder="Cu.M:" required>
                </div>
                <div class="modal-field">
                    <input type="number" id="amount" name="amount" placeholder="Amount:" required>
                </div>
            </div>
            <div class="modal-buttons">
                <button type="submit" id="saveButton">Submit</button>
            </div>
        </form>
    </div>
</div>



    <table id="dataTable">
        <thead>
            <tr>
                <th>Name</th>
                <th>Area</th>
                <th>Current</th>
                <th>Previous</th>
                <th>Date</th>
                <th>Initial Amount</th>
                <th>Cu.M</th>
                <th>Amount</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
            <tr>

            </tr>
            <!-- Additional rows can be added here -->
        </tbody>
    </table>
    <script src="./Javascript/billManager.js"></script>
</body>
</html>
