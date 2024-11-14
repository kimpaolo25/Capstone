<?php
include 'dbcon.php';

$action = $_GET['action'] ?? '';

if ($action === 'getDates') {
    // Retrieve dates in YYYY-MMM format and order by year and month in correct order
    $sql = "SELECT DISTINCT Date_column AS display_date, CONCAT(Date_column, '-01') AS full_date
            FROM customers
            ORDER BY 
                CAST(SUBSTRING(Date_column, 1, 4) AS UNSIGNED) ASC,  -- Sort by year
                FIELD(SUBSTRING(Date_column, 6), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec') ASC";  // Sort by month
    $result = $conn->query($sql);
    
    $dates = [];
    while ($row = $result->fetch_assoc()) {
        $dates[] = ['display' => $row['display_date'], 'full' => $row['full_date']];
    }
    echo json_encode($dates);
}

// Fetching total amount for the selected date
if ($action === 'getTotalAmount' && isset($_GET['date'])) {
    $selectedDate = $_GET['date'];
    
    // Prepare the SQL query to fetch total amount
    $sql = "SELECT SUM(Amount) AS totalAmount FROM customers WHERE CONCAT(Date_column, '-01') = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        echo json_encode(['error' => 'Failed to prepare SQL query for totalAmount']);
        exit;
    }

    $stmt->bind_param("s", $selectedDate);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    echo json_encode(['totalAmount' => $data['totalAmount'] ?? 0]);
}

// Fetching active/inactive meter status
if ($action === 'getMeterStatus' && isset($_GET['date'])) {
    $selectedDate = $_GET['date'];
    
    // Prepare the SQL query to fetch meter status
    $sql = "SELECT
                SUM(CASE WHEN Present <> 0 OR Previous <> 0 OR CU_M <> 0 OR Amount <> 0 THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN Present = 0 AND Previous = 0 AND CU_M = 0 AND Amount = 0 THEN 1 ELSE 0 END) AS inactive
            FROM customers
            WHERE CONCAT(Date_column, '-01') = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        echo json_encode(['error' => 'Failed to prepare SQL query for meterStatus']);
        exit;
    }

    $stmt->bind_param("s", $selectedDate);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    echo json_encode(['active' => $data['active'] ?? 0, 'inactive' => $data['inactive'] ?? 0]);
}

// Fetching total number of bills for the selected date, including those with zero values
if ($action === 'getBillsCount' && isset($_GET['date'])) {
    $selectedDate = $_GET['date'];
    
    // Prepare the SQL query to count the number of bills, including those with zero values
    $sql = "SELECT COUNT(*) AS billsCount 
            FROM customers 
            WHERE CONCAT(Date_column, '-01') = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        echo json_encode(['error' => 'Failed to prepare SQL query for billsCount']);
        exit;
    }

    $stmt->bind_param("s", $selectedDate);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    echo json_encode(['billsCount' => $data['billsCount'] ?? 0]);
}

// Fetching total income per area for the selected date
if ($action === 'getIncomePerArea' && isset($_GET['date'])) {
    $selectedDate = $_GET['date'];
    
    // Prepare the SQL query to get the total income per area
    $sql = "SELECT p.places_name, SUM(c.Amount) AS totalIncome
            FROM customers c
            JOIN places p ON c.Area_Number = p.Area_number  -- Assuming Area_Number is a foreign key linking to places table
            WHERE CONCAT(c.Date_column, '-01') = ?
            GROUP BY p.places_name";
    
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        echo json_encode(['error' => 'Failed to prepare SQL query for incomePerArea']);
        exit;
    }

    $stmt->bind_param("s", $selectedDate);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $incomePerArea = [];
    while ($row = $result->fetch_assoc()) {
        $incomePerArea[] = [
            'area' => $row['places_name'],
            'income' => $row['totalIncome'] ?? 0
        ];
    }

    echo json_encode($incomePerArea);
}

// Fetching total income per area for all years (no date filter)
if ($action === 'getIncomePerAreaAllYears') {
    // Prepare the SQL query to get the total income per area across all years
    $sql = "SELECT p.places_name, SUM(c.Amount) AS totalIncome
            FROM customers c
            JOIN places p ON c.Area_Number = p.Area_number  -- Assuming Area_Number is a foreign key linking to places table
            GROUP BY p.places_name";
    
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        echo json_encode(['error' => 'Failed to prepare SQL query for incomePerAreaAllYears']);
        exit;
    }

    $stmt->execute();
    $result = $stmt->get_result();
    
    $incomePerArea = [];
    while ($row = $result->fetch_assoc()) {
        $incomePerArea[] = [
            'area' => $row['places_name'],
            'income' => $row['totalIncome'] ?? 0
        ];
    }

    echo json_encode($incomePerArea);
}

// Fetching active/inactive meter status for the current month
if ($action === 'getCurrentMonthData') {
    // Get the current date in YYYY-MMM format
    $currentMonth = date('Y-M', strtotime('first day of this month'));  // Example: 2024-Jan

    // Query to get the total number of bills for the current month
    $sql = "SELECT COUNT(*) AS billsCount FROM customers WHERE Date_column = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        echo json_encode(['error' => 'Failed to prepare SQL query for billsCount']);
        exit;
    }

    $stmt->bind_param("s", $currentMonth);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    
    $billsCount = $data['billsCount'] ?? 0;

    // Query to get the expected income for the current month
    $sqlIncome = "SELECT SUM(Amount) AS expectedIncome FROM customers WHERE Date_column = ?";
    $stmtIncome = $conn->prepare($sqlIncome);

    if ($stmtIncome === false) {
        echo json_encode(['error' => 'Failed to prepare SQL query for expectedIncome']);
        exit;
    }

    $stmtIncome->bind_param("s", $currentMonth);
    $stmtIncome->execute();
    $resultIncome = $stmtIncome->get_result();
    $dataIncome = $resultIncome->fetch_assoc();
    
    $expectedIncome = $dataIncome['expectedIncome'] ?? 0;

    // Query to get the count of active and inactive meters for the current month
    $sqlMeterStatus = "SELECT
                            SUM(CASE WHEN Present <> 0 OR Previous <> 0 OR CU_M <> 0 OR Amount <> 0 THEN 1 ELSE 0 END) AS active,
                            SUM(CASE WHEN Present = 0 AND Previous = 0 AND CU_M = 0 AND Amount = 0 THEN 1 ELSE 0 END) AS inactive
                       FROM customers
                       WHERE Date_column = ?";
    $stmtMeterStatus = $conn->prepare($sqlMeterStatus);

    if ($stmtMeterStatus === false) {
        echo json_encode(['error' => 'Failed to prepare SQL query for meterStatus']);
        exit;
    }

    $stmtMeterStatus->bind_param("s", $currentMonth);
    $stmtMeterStatus->execute();
    $resultMeterStatus = $stmtMeterStatus->get_result();
    $dataMeterStatus = $resultMeterStatus->fetch_assoc();

    $activeMeters = $dataMeterStatus['active'] ?? 0;
    $inactiveMeters = $dataMeterStatus['inactive'] ?? 0;

    // Return the results as a JSON response
    echo json_encode([
        'billsCount' => $billsCount,
        'expectedIncome' => $expectedIncome,
        'activeMeters' => $activeMeters,
        'inactiveMeters' => $inactiveMeters
    ]);
}


?>
