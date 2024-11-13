<?php
session_start();

if (!isset($_SESSION['loggedin']) || ($_SESSION['user_level'] != 1 && $_SESSION['user_level'] != 2)) {
    // Redirect non-admin and non-staff users back to the login page or an error page
    header('Location: index.php');
    exit;
}


// Set user name and handle potential errors
$userName = isset($_SESSION['name']) ? $_SESSION['name'] : 'Guest'; // Fallback to 'Guest' if name not set
?>

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
        <?php if (isset($_SESSION['user_level']) && $_SESSION['user_level'] == 1): ?>
            <!-- Only show "Manage Account" if user is an admin (user_level == 1) -->
            <a href="manage_acc.php" class="accs-button" id="accsButton">Manage Account</a>
            <a href="javascript:void(0)" class="exit-button" id="exitButton" onclick="confirmLogout()">
                <img src="./image/out.png" alt="Exit">
            </a>
        <?php endif; ?>


        <!-- Dropdown menu with a down arrow icon -->
        <div class="dropdown">
            <button class="dropbtn"><i class="fas fa-caret-down"></i></button>
            <div class="dropdown-content">

                <!-- Print Option -->
                <button class="sub-dropbtn">
                    <i class="fas fa-print" id="printOption" title="Print"></i>
                </button>

                <!-- Submenu for download options -->
                <div class="sub-dropdown">
                    <button class="sub-dropbtn">
                        <i class="fas fa-download" title="Download"></i>
                    </button>

                    <div class="sub-dropdown-content">
                        <a href="#" id="downloadCSVOption" title="Download as CSV">
                            <i class="fas fa-file-csv"></i>
                        </a>
                        <a href="#" id="downloadExcelOption" title="Download as Excel">
                            <i class="fas fa-file-excel"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <h2 class="userName">Good Day, <?php echo htmlspecialchars($userName); ?>!</h2> <!-- Personalized Greeting -->

    <div class="table-controls">
        <div class="add-button-container">
            <button id="addButton">Add</button>
        </div>

        <div class="set-button-container">
            <button id="setButton">Modify Invoice</button>
        </div>

        <div class="set-button-container">
            <button id="PrintAll">Print All</button>
        </div>

        <div class="search-container">
            <input type="text" id="searchInput" placeholder="Search...">
            <ul id="searchSuggestions" class="suggestions-list" style="display: none; background-color: white"></ul>
        </div>

        <button id="reloadButton" title="Reload Table"
                onclick="clearFilter();">
                <i class="fas fa-sync-alt"></i> <!-- Font Awesome reload icon -->
            </button>

    </div>


    <!-- Modal Structure -->
    <div id="printModal" class="printModal">
        <div class="printModal-content">
            <span class="close-button"></span>
            <div class="printModal-header">Print All</div>

            
            <!-- Date Field -->
            <div class="printModal-field">
                <select name="printDate" clss="printInput-field" id="printDate" required>
                    <option value="">Select Date</option>
                    <!-- Options will be added dynamically -->
                </select>
            </div>
            
            <!-- Area Dropdown -->
            <div class="printModal-field">
                            <select name="printArea" class="printArea" id="printArea">
                                <option value="">Select Area</option>
                                <option value="1">Kanluran</option>
                                <option value="2">Gitna</option>
                                <option value="3">Silangan</option>
                                <option value="4">Maramaine</option>
                                <option value="5">Patik</option>
                                <option value="6">Purok 6</option>
                            </select>
                        </div>
            
            <!-- Submit Button -->
            <div class="printModal-button">
                <button id="submitPrint">Print</button>
            </div>
        </div>
    </div>


    <!-- Invoice Modal Structure -->
    <div id="invDateModal" class="invModal">
        <div class="invModal-content">
            <span id="close"></span>
            <div class="invModal-header">Modify Invoice</div>

            <div class="invModal-field">
                </>
                <input type="date" id="invDateInput" name="invDateInput" class="invInput-field">
                <label for="invDateInput" class="invLabel">Cutoff Date</label>
            </div>

            <div class="invModal-field">
                <input type="firstPen" id="firstPen" name="firstPen" class="invInput-field" />
                <label for="firstPen" class="invLabel">First Penalty</label>
            </div>

            <div class="invModal-field">
                <input type="secondPen" id="secondPen" name="secondPen" class="invInput-field" />
                <label for="secondPen" class="invLabel">Second Penalty</label>
            </div>

            <div class="invModal-field">
                <input type="gcashInf" id="gcashInf" name="gcashInf" class="invInput-field" />
                <label for="gcashInf" class="invLabel">Gcash Information</label>
            </div>

            <div class="invModal-field">
                <input type="gcashFee" id="gcashFee" name="gcashFee" class="invInput-field" />
                <label for="gcashFee" class="invLabel">Gcash Fee</label>
            </div>

            <div class="invModal-button">
                <button id="updateButton">Update</button>
                <button id="resetModalButton">Reset Date</button>
            </div>
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
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
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
                <!-- Add radio buttons for input mode selection -->
                <div class="modal-section">
                    <label>
                        <input type="radio" name="inputMode" value="full" checked onclick="toggleInputMode('full')"
                            id="activeRadio" /> Active
                    </label>
                    <label>
                        <input type="radio" name="inputMode" value="minimal" onclick="toggleInputMode('minimal')"
                            id="inactiveRadio" /> Lock/Inactive
                    </label>
                </div>

                <div class="modal-section">

                    <div class="modal-field" style="position: relative;">
                        <input type="text" id="name" name="name" class="input-field"
                            oninput="autocompleteSuggestions()" />
                        <label for="name" class="label">Name</label>
                        <ul id="suggestions"
                            style="display: none; position: absolute; top: 100%; left: 0; border: 1px solid #2337ed; background-color: white; list-style: none; padding: 0; margin: 0; width: 89%; z-index: 1;">
                        </ul>
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
                        <input type="number" id="current" name="current" class="input-field" />
                        <label for="current" class="label">Current</label>
                    </div>

                    <div class="modal-field">
                        <input type="number" id="previous" name="previous" class="input-field" />
                        <label for="previous" class="label">Previous</label>
                    </div>

                </div>
                <div class="modal-section">
                    <div class="modal-field">
                        <input type="date" id="date" name="date" class="input-field" />
                    </div>

                    <div class="modal-field">
                        <input type="number" id="initialAmount" name="initialAmount" class="input-field" />
                        <label for="initialAmount" class="label">Initial Amount</label>
                    </div>

                    <div class="modal-field">
                        <input type="number" id="cuM" name="cuM" class="input-field" />
                        <label for="cuM" class="label">Cu.M</label>
                    </div>

                    <div class="modal-field">
                        <input type="number" id="amount" name="amount" class="input-field" />
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
                        <select name="area" class="area" id="updateArea">
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
                        <input type="text" id="updateDate" name="date" class="input-field" required />
                        <label for="date" class="label">Date</label>
                    </div>

                    <div class="modal-field">
                        <input type="number" id="updateInitialAmount" name="initialAmount" class="input-field"
                            required />
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
            <tbody id="tableBody"></tbody>
        </table>
    </div>

    <!-- Pagination Controls -->
    <div class="pagination" id="paginationControls">
        <button id="firstPageBtn" title="Fisrt Page" onclick="firstPage()"><<</button>
                <button id="prevPageBtn" title="Previous Page" onclick="prevPage()"><</button>
                        <span id="pageInfo"></span> <!-- This will display the page information -->
                        <button id="nextPageBtn" title="Next Page" onclick="nextPage()">></button>
                        <button id="lastPageBtn" title="Last Page" onclick="lastPage()">>></button>
    </div>




    <script src="./Javascript/invoiceDetail.js"></script>
    <script src="./Javascript/tableFunctions.js"></script>
    <script src="./Javascript/modalFunctions.js"></script>
    <script src="./Javascript/addData.js"></script>
    <script src="./Javascript/deleteData.js"></script>
    <script src="./Javascript/updateData.js"></script>
    <script src="./Javascript/utils.js"></script>
    <script src="./Javascript/invoicePrint.js"></script>
    <script src="./Javascript/billManagerfilter.js"></script>
    <script src="./Javascript/dlPrint.js"></script>
    <script src="./Javascript/admin.js"></script>
    <script src="./Javascript/printAll.js"></script>


</body>

</html>