<?php
header('Content-Type: application/json');

// Database connection
require 'dbcon.php';

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get year from request
$year = isset($_POST['year']) ? $conn->real_escape_string($_POST['year']) : '';

// Query for total amount income per year
$sql = "SELECT IFNULL(SUM(Amount), 0) AS totalIncome FROM customers WHERE SUBSTRING(Date_column, 1, 4) = '$year'";
$result = $conn->query($sql);
$totalIncome = $result->fetch_assoc()['totalIncome'];

// Close connection
$conn->close();

// Return data as JSON
echo json_encode(['totalIncome' => (float) $totalIncome]);
?>
