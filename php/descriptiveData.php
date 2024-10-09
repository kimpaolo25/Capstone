<?php
header('Content-Type: application/json');

require 'dbcon.php';

// Check connection
if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// Get the year parameter from the request
$year = isset($_GET['year']) ? $conn->real_escape_string($_GET['year']) : '';

// Default values
$response = [];

// Existing queries (unchanged)
$currentYear = date('Y');
$currentMonth = date('M');

// Query for number of bills this month
$sqlBillsThisMonth = "
    SELECT COUNT(*) AS count 
    FROM customers 
    WHERE SUBSTRING(Date_column, 1, 4) = '$currentYear' 
      AND SUBSTRING(Date_column, 6, 3) = '$currentMonth'";
$resultBillsThisMonth = $conn->query($sqlBillsThisMonth);
$billsThisMonth = $resultBillsThisMonth->fetch_assoc()['count'];

// Query for number of bills this year
$sqlBillsThisYear = "
    SELECT COUNT(*) AS count 
    FROM customers 
    WHERE SUBSTRING(Date_column, 1, 4) = '$currentYear'";
$resultBillsThisYear = $conn->query($sqlBillsThisYear);
$billsThisYear = $resultBillsThisYear->fetch_assoc()['count'];

// Query for overall income in the current year
$sqlOverallIncome = "SELECT IFNULL(SUM(Amount), 0) AS total 
                     FROM customers 
                     WHERE Date_column LIKE CONCAT('$currentYear', '-%')";
$resultOverallIncome = $conn->query($sqlOverallIncome);
$overallIncome = $resultOverallIncome->fetch_assoc()['total'];

// Query for inactive records this month (Amount = 0.00)
$sqlInactive = "
    SELECT COUNT(*) AS inactive_count 
    FROM customers 
    WHERE SUBSTRING(Date_column, 1, 4) = '$currentYear' 
      AND SUBSTRING(Date_column, 6, 3) = '$currentMonth' 
      AND Amount = 0.00";
$resultInactive = $conn->query($sqlInactive);
$inactiveCount = $resultInactive->fetch_assoc()['inactive_count'];

// Calculate active count
$activeCount = $billsThisMonth - $inactiveCount;

// Prepare data for pie chart
$chartData = [
    'Active' => $activeCount,
    'Inactive' => $inactiveCount
];

// Query for total income per year (for all years)
$sqlTotalIncomePerYear = "
    SELECT 
        SUBSTRING(Date_column, 1, 4) AS year, 
        IFNULL(SUM(Amount), 0) AS total 
    FROM customers 
    GROUP BY year 
    ORDER BY year";
$resultTotalIncomePerYear = $conn->query($sqlTotalIncomePerYear);

$totalIncomePerYear = [];
while ($row = $resultTotalIncomePerYear->fetch_assoc()) {
    $totalIncomePerYear[] = $row;
}

// Query for total income per area with area names
$sqlTotalIncomePerArea = "
    SELECT p.places_name, IFNULL(SUM(c.Amount), 0) AS total_income 
    FROM customers c
    JOIN places p ON c.Area_Number = p.Area_Number
    GROUP BY p.places_name
    ORDER BY p.places_name";
$resultTotalIncomePerArea = $conn->query($sqlTotalIncomePerArea);

$totalIncomePerArea = [];
while ($row = $resultTotalIncomePerArea->fetch_assoc()) {
    $totalIncomePerArea[] = [
        'places_name' => $row['places_name'],
        'total_income' => (float)$row['total_income']
    ];
}

// Query for total income per month in chronological order
$sqlIncomePerMonth = "
    SELECT Date_column, IFNULL(SUM(Amount), 0) AS total 
    FROM customers 
    GROUP BY Date_column
    ORDER BY 
        SUBSTRING(Date_column, 1, 4) ASC,
        FIELD(SUBSTRING(Date_column, 6, 3), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec') ASC";
$resultIncomePerMonth = $conn->query($sqlIncomePerMonth);

$incomePerMonth = [];
while ($row = $resultIncomePerMonth->fetch_assoc()) {
    $incomePerMonth[] = $row;
}

// Query for cubic meter consumption per month in chronological order
$sqlCubicMeterPerMonth = "
    SELECT Date_column, IFNULL(SUM(CU_M), 0) AS total 
    FROM customers 
    GROUP BY Date_column
    ORDER BY 
        SUBSTRING(Date_column, 1, 4) ASC,
        FIELD(SUBSTRING(Date_column, 6, 3), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec') ASC";
$resultCubicMeterPerMonth = $conn->query($sqlCubicMeterPerMonth);

$cubicMeterPerMonth = [];
while ($row = $resultCubicMeterPerMonth->fetch_assoc()) {
    $cubicMeterPerMonth[] = $row;
}

// Additional code for filtering by year (if year parameter is provided)
// Validate year parameter
if ($year) {
    if (!preg_match('/^\d{4}$/', $year)) {
        die(json_encode(['error' => 'Invalid year parameter.']));
    }

    // Query for income per month for the specific year
    $incomeQuery = "
        SELECT MONTH(STR_TO_DATE(Date_column, '%Y-%b')) AS month,
               Amount 
        FROM customers 
        WHERE YEAR(STR_TO_DATE(Date_column, '%Y-%b')) = '$year'
        ORDER BY month";

    error_log("Income Query: " . $incomeQuery); // Log the query
    $incomeResult = $conn->query($incomeQuery);
    $incomeData = ['labels' => [], 'values' => []];

    if ($incomeResult) {
        if ($incomeResult->num_rows > 0) {
            while ($row = $incomeResult->fetch_assoc()) {
                $incomeData['labels'][] = date('F', mktime(0, 0, 0, $row['month'], 10)); // Converts month number to name
                $incomeData['values'][] = (float)$row['totalIncome'];
            }
        } else {
            error_log("No income data found for year: $year");
        }
    } else {
        error_log("Error in income query: " . $conn->error);
    }

    // Log income data
    error_log("Income Data: " . print_r($incomeData, true));

    $response['totalIncomePerYear'] = $incomeData;

     // Query for Cubic Meter Consumption per Year
     $consumptionQuery = "
     SELECT MONTH(STR_TO_DATE(Date_column, '%Y-%b')) AS month,
            CU_M 
     FROM customers 
     WHERE YEAR(STR_TO_DATE(Date_column, '%Y-%b')) = '$year' 
     ORDER BY month";

    error_log("Consumption Query: " . $consumptionQuery); // Log the query
    $consumptionResult = $conn->query($consumptionQuery);
    $consumptionData = ['labels' => [], 'values' => []];

    if ($consumptionResult) {
        if ($consumptionResult->num_rows > 0) {
            while ($row = $consumptionResult->fetch_assoc()) {
                $consumptionData['labels'][] = date('F', mktime(0, 0, 0, $row['month'], 10)); // Converts month number to name
                $consumptionData['values'][] = (float)$row['totalConsumption'];
            }
        } else {
            error_log("No consumption data found for year: $year");
        }
    } else {
        error_log("Error in consumption query: " . $conn->error);
    }

    // Log consumption data
    error_log("Consumption Data: " . print_r($consumptionData, true));

    $response['cubicMeterConsumptionPerYear'] = $consumptionData;
}

// Close connection
$conn->close();

// Add existing data to the response
$response = array_merge($response, [
    'billsThisMonth' => $billsThisMonth,
    'billsThisYear' => $billsThisYear,
    'overallIncome' => (float)$overallIncome,
    'totalIncomePerYear' => $totalIncomePerYear,
    'totalIncomePerArea' => $totalIncomePerArea,
    'incomePerMonth' => $incomePerMonth,
    'cubicMeterPerMonth' => $cubicMeterPerMonth,
    'activeCount' => $activeCount,
    'inactiveCount' => $inactiveCount,
]);

// Return the final response as JSON
echo json_encode($response);
?>
