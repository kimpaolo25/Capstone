<?php
// Database Connection
require 'dbCon.php';

$response = array('success' => false);

// Collect form data
$name = $_POST['name'];
$area = $_POST['area'];
$current = $_POST['current'];
$previous = $_POST['previous'];
$date = $_POST['date']; // This should be in YYYY-Month format
$initialAmount = $_POST['initialAmount'];
$cuM = $_POST['cuM'];
$amount = $_POST['amount'];

// SQL query to insert new data
$sql = "INSERT INTO customers (Name, Area_Number, Present, Previous, Date_column, Initial, CU_M, Amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
if ($stmt) {
    $stmt->bind_param('ssddsddd', $name, $area, $current, $previous, $date, $initialAmount, $cuM, $amount);
    if ($stmt->execute()) {
        $response['success'] = true;
    } else {
        $response['message'] = 'Error executing the query: ' . $stmt->error;
    }
} else {
    $response['message'] = 'Failed to prepare statement: ' . $conn->error;
}

// Debug: Log error if not successful
if (!$response['success']) {
    file_put_contents('debug.log', print_r($response, true), FILE_APPEND);
}

echo json_encode($response);
?>
