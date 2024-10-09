<?php
// fetch_invoice.php
require 'dbcon.php';

$detailId = $_POST['detailId']; // Assuming you pass the detailId via POST

$query = "SELECT firstPenalty, secondPenalty, gcashNum, gcashFee FROM invoicetable WHERE detailId = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('i', $detailId);
$stmt->execute();
$result = $stmt->get_result();
$data = $result->fetch_assoc();

if($data) {
    echo json_encode($data); // Return the data as JSON
} else {
    echo json_encode(['error' => 'No data found']);
}
?>
