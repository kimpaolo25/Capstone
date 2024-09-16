<?php
header('Content-Type: application/json');

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "prwai_data";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get current year and month
$currentYear = date('Y');
$currentMonth = date('M'); // Use 'M' to match the format in the database

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

// Query for overall income
$sqlOverallIncome = "SELECT IFNULL(SUM(Amount), 0) AS total FROM customers";
$resultOverallIncome = $conn->query($sqlOverallIncome);
$overallIncome = $resultOverallIncome->fetch_assoc()['total'];

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
while ($row = $resultTotalIncomePerYear->fetch_assoc()) 
    $totalIncomePerYear[] = $row;

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
        'total_income' => (float)$row['total_income'] // Explicitly cast to float
    ];
}

// Query for total income per month in chronological order
$sqlIncomePerMonth = "
    SELECT Date_column, IFNULL(SUM(Amount), 0) AS total 
    FROM customers 
    GROUP BY Date_column
    ORDER BY 
        SUBSTRING(Date_column, 1, 4) ASC, -- Sort by year first
        FIELD(SUBSTRING(Date_column, 6, 3), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec') ASC"; // Sort months in correct order
$resultIncomePerMonth = $conn->query($sqlIncomePerMonth);

$incomePerMonth = [];
while ($row = $resultIncomePerMonth->fetch_assoc()) 
    $incomePerMonth[] = $row;

// Query for cubic meter consumption per month in chronological order
$sqlCubicMeterPerMonth = "
    SELECT Date_column, IFNULL(SUM(CU_M), 0) AS total 
    FROM customers 
    GROUP BY Date_column
    ORDER BY 
        SUBSTRING(Date_column, 1, 4) ASC, -- Sort by year
        FIELD(SUBSTRING(Date_column, 6, 3), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec') ASC"; // Sort by month
$resultCubicMeterPerMonth = $conn->query($sqlCubicMeterPerMonth);

$cubicMeterPerMonth = [];
while ($row = $resultCubicMeterPerMonth->fetch_assoc()) {
    $cubicMeterPerMonth[] = $row;
}

// Close connection
$conn->close();

// Return data as JSON
echo json_encode([
    'billsThisMonth' => $billsThisMonth,
    'billsThisYear' => $billsThisYear,
    'overallIncome' => (float) $overallIncome,
    'totalIncomePerYear' => $totalIncomePerYear, // Include total income per year data
    'totalIncomePerArea' => $totalIncomePerArea, // Include total income per area
    'incomePerMonth' => $incomePerMonth,         // Include total income per month
    'cubicMeterPerMonth' => $cubicMeterPerMonth  // Cubic meter consumption per month
]);
?>
