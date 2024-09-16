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

// Close connection
$conn->close();

// Return data as JSON
echo json_encode([
    'billsThisMonth' => $billsThisMonth,
    'billsThisYear' => $billsThisYear,
    'overallIncome' => (float) $overallIncome // Ensure this is a float
]);
?>
