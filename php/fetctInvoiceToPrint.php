<?php
header('Content-Type: application/json');

// Database connection
require 'dbcon.php';

if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// Your query to fetch the invoice details
$sql = "SELECT gcashNum, gcashFee, firstPenalty, secondPenalty FROM invoicetable WHERE detailId = 1";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode($row);
} else {
    echo json_encode(['error' => 'No data found']);
}

$conn->close();
?>
