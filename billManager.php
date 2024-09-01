<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="./css/billManager.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="./Javascript/sweetalert.js"></script>
</head>
<body>
<header>
    <img src="./image/icon.png" alt="Logo" class="logo">
    <a href="admin.php" class="dashboard-button" id="dashButton">Dashboard</a>
    <a href="billManager.php" class="bills-button" id="billsButton">Bill Manager</a>

    <!-- Dropdown menu with a down arrow icon -->
    <div class="dropdown">
        <button class="dropbtn"><i class="fas fa-caret-down"></i></button>
        <div class="dropdown-content">
            <a href="#" id="printOption">Print</a>
            <!-- Submenu for download options -->
            <div class="sub-dropdown">
                <button class="sub-dropbtn">Download</button>
                <div class="sub-dropdown-content">
                    <a href="#" id="downloadCSVOption">CSV</a>
                    <a href="#" id="downloadExcelOption">Excel</a>
                </div>
            </div>
        </div>
    </div>
</header>


    <div class="table-controls">
        <div class="add-button-container">
            <button id="addButton">Add</button>
        </div>
        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Search...">
        </div>
    </div>

    <div class="filter-controls">
    <div class="filter-container">
        <label for="yearFilter">Year:</label>
        <select id="yearFilter">
            <option value="">Select Year</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <!-- Add more years as needed -->
        </select>
    </div>
    <div class="filter-container">
        <label for="areaFilter">Area:</label>
        <select id="areaFilter">
            <option value="">Select Area</option>
            <option value="1">Area 1</option>
            <option value="2">Area 2</option>
            <!-- Add more areas as needed -->
        </select>
    </div>
    <div class="filter-container">
        <label for="monthFilter">Month:</label>
        <select id="monthFilter">
            <option value="">Select Month</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <!-- Add more months as needed -->
        </select>
    </div>
    <!-- Reset Button -->
    <div class="reset-container">
        <button id="resetFilters" class="reset-button">&times;</button>
    </div>
</div>


    <!-- Modal HTML -->
    <div id="addBillModal" class="modal">
    <div class="modal-content">
        <span class="close"></span>
        <div class="login-header">Add Bill Report</div>
        <form id="addBillForm">
        <div class="modal-section">
    <div class="modal-field">
        <input type="text" id="name" name="name" class="input-field" required />
        <label for="name" class="label">Name</label>
    </div>

    <div class="modal-field">
        <input type="text" id="area" name="area" class="input-field" required />
        <label for="area" class="label">Area</label>
    </div>

    <div class="modal-field">
        <input type="number" id="current" name="current" class="input-field" required />
        <label for="current" class="label">Current</label>
    </div>

    <div class="modal-field">
        <input type="number" id="previous" name="previous" class="input-field" required />
        <label for="previous" class="label">Previous</label>
    </div>

</div>
<div class="modal-section">
    <div class="modal-field">
        <input type="date" id="date" name="date" class="input-field" required />
        
    </div>

    <div class="modal-field">
        <input type="number" id="initialAmount" name="initialAmount" class="input-field" required />
        <label for="initialAmount" class="label">Initial Amount</label>
    </div>

    <div class="modal-field">
        <input type="number" id="cuM" name="cuM" class="input-field" required />
        <label for="cuM" class="label">Cu.M</label>
    </div>
    
    <div class="modal-field">
        <input type="number" id="amount" name="amount" class="input-field" required />
        <label for="amount" class="label">Amount</label>
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
        </tbody>
    </table>
    <script src="./Javascript/billManager.js"></script>
    <script src="./Javascript/billManagerfilter.js"></script>
    <script src="./Javascript/dlPrint.js"></script>
</body>
</html>
