<?php
header('Content-Type: application/json');

// Database connection
require 'dbcon.php';

if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// First query: Fetch invoice details
$sqlInvoice = "SELECT gcashNum, gcashFee, firstPenalty, secondPenalty FROM invoicetable WHERE detailId = 1";
$resultInvoice = $conn->query($sqlInvoice);

$invoiceData = [];
if ($resultInvoice->num_rows > 0) {
    $invoiceData = $resultInvoice->fetch_assoc(); // Fetch invoice details
} else {
    $invoiceData = ['error' => 'No invoice data found'];
}

// Second query: Fetch all customer details for the current date with non-zero, non-null Amount
$sqlCustomers = "SELECT c.bill_id, c.Name, p.places_name AS Area_Number, 
                        c.Present, c.Previous, c.Date_column, c.Initial, 
                        c.CU_M, c.Amount 
                 FROM customers c
                 JOIN places p ON c.Area_Number = p.Area_Number
                 WHERE c.Date_column = DATE_FORMAT(CURDATE(), '%Y-%b')
                 AND c.Amount IS NOT NULL AND c.Amount != 0";
$resultCustomers = $conn->query($sqlCustomers);

$customerData = [];
if ($resultCustomers->num_rows > 0) {
    while ($row = $resultCustomers->fetch_assoc()) {
        $customerData[] = $row; // Add each customer to the array
    }
} else {
    $customerData = ['error' => 'No customer data found for today'];
}

// Combine both results into one response
$response = [
    'invoice' => $invoiceData,
    'customers' => $customerData,
];

echo json_encode($response); // Return the combined result

$conn->close();
?>
