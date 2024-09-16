<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="./css/billManager.css">
    <link rel="stylesheet" href="./css/updateModal.css">
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
        </select>
    </div>
    <div class="filter-container">
        <label for="areaFilter">Area:</label>
        <select id="areaFilter">
            <option value="">Select Area</option>
            <option value="Kanluran">Kanluran</option>
            <option value="Gitna">Gitna</option>
            <option value="Silangan">Silangan</option>
            <option value="Marmaine">Marmaine</option>
            <option value="Patik">Patik</option>
            <option value="Purok 6">Purok 6</option>
        </select>
    </div>
    <div class="filter-container">
        <label for="monthFilter">Month:</label>
        <select id="monthFilter">
            <option value="">Select Month</option>
            <option value="January">January</option>
            <option value="February">February</option>
            <option value="March">March</option>
            <option value="April">April</option>
            <option value="May">May</option>
            <option value="June">June</option>
            <option value="July">July</option>
            <option value="August">August</option>
            <option value="September">September</option>
            <option value="October">October</option>
            <option value="November">November</option>
            <option value="December">December</option>
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
        <div class="modal-header">Add Bill Report</div>
        <form id="addBillForm">
        <div class="modal-section">
    <div class="modal-field">
        <input type="text" id="name" name="name" class="input-field" required />
        <label for="name" class="label">Name</label>
        <ul id="suggestions" style="display: none; position: absolute; border: 1px solid #ccc; background-color: white; list-style: none; padding: 0; margin: 0; width: 200px; z-index: 1000;"></ul>
    </div>

    <div class="modal-field">
                    <select name="area" class="area" id="area">
                        <option value="">Select Area</option>
                        <option value="1">Kanluran</option>
                        <option value="2">Gitna</option>
                        <option value="3">Silangan</option>
                        <option value="4">Maramaine</option>
                        <option value="5">Patik</option>
                        <option value="6">Purok 6</option>
                    </select>
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



<!--Update Modal HTML -->
<div id="updateBillModal" class="updateModal">
    <div class="update_modal-content">
        <span class="close"></span>
        <div class="updatemodal-header">Update Bill Report</div>
        <form id="updateBillForm">
        <div class="modal-section">
    <div class="modal-field">
        <input type="text" id="updateName" name="name" class="input-field" required />
        <label for="name" class="label">Name</label>
    </div>

    <div class="modal-field">
        <input type="text" id="updateArea" name="area" class="input-field" required />
        <label for="area" class="label">Area</label>
    </div>

    <div class="modal-field">
        <input type="number" id="updateCurrent" name="current" class="input-field" required />
        <label for="current" class="label">Current</label>
    </div>

    <div class="modal-field">
        <input type="number" id="updatePrevious" name="previous" class="input-field" required />
        <label for="previous" class="label">Previous</label>
    </div>

</div>
<div class="modal-section">
    <div class="modal-field">
        <input type="date" id="updateDate" name="date" class="input-field" required />
        
    </div>

    <div class="modal-field">
        <input type="number" id="updateInitialAmount" name="initialAmount" class="input-field" required />
        <label for="initialAmount" class="label">Initial Amount</label>
    </div>

    <div class="modal-field">
        <input type="number" id="updateCuM" name="cuM" class="input-field" required />
        <label for="cuM" class="label">Cu.M</label>
    </div>
    
    <div class="modal-field">
        <input type="number" id="updateAmount" name="amount" class="input-field" required />
        <label for="amount" class="label">Amount</label>
    </div>
</div>

            <div class="modal-buttons">
                <button type="submit" id="saveButton">Submit</button>
            </div>
        </form>
    </div>
</div>


<div class="table-container">
<table id="dataTable">
        <thead>
            <tr>
                <th class="bill-id">Bill ID</th> <!-- Hidden column -->
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
</div>
    <script src="./Javascript/tableFunctions.js"></script>
    <script src="./Javascript/modalFunctions.js"></script>
    <script src="./Javascript/addData.js"></script>
    <script src="./Javascript/deleteData.js"></script>
    <script src="./Javascript/updateData.js"></script>
    <script src="./Javascript/utils.js"></script>
    <script src="./Javascript/invoicePrint.js"></script>
    <script src="./Javascript/billManagerfilter.js"></script>
    <script src="./Javascript/dlPrint.js"></script>

</body>
</html>
