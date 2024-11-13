<?php
header('Content-Type: application/json');

// Database connection
require 'dbcon.php';

if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// First query: Fetch invoice details
$sqlInvoice = "SELECT gcashNum, gcashFee, firstPenalty, secondPenalty FROM invoicetable WHERE detailId = ?";
$stmtInvoice = $conn->prepare($sqlInvoice);
$detailId = 1; // Since detailId is static in this case
$stmtInvoice->bind_param("i", $detailId);
$stmtInvoice->execute();
$resultInvoice = $stmtInvoice->get_result();

$invoiceData = [];
if ($resultInvoice->num_rows > 0) {
    $invoiceData = $resultInvoice->fetch_assoc(); // Fetch invoice details
} else {
    $invoiceData = ['error' => 'No invoice data found'];
}

// Fetch the date and area from GET or POST (depending on your method)
$date = isset($_GET['date']) ? $_GET['date'] : null;
$area = isset($_GET['area']) ? $_GET['area'] : null;

// Second query: Fetch customer details for the given date and area
$sqlCustomers = "SELECT c.bill_id, c.Name, p.places_name AS Area_Number, 
                        c.Present, c.Previous, c.Date_column, c.Initial, 
                        c.CU_M, c.Amount 
                 FROM customers c
                 JOIN places p ON c.Area_Number = p.Area_Number
                 WHERE 1 AND c.Amount IS NOT NULL AND c.Amount != 0";

$types = '';
$params = [];

// Add conditions dynamically based on the received parameters
if ($date) {
    $sqlCustomers .= " AND c.Date_column = ?";
    $types .= 's'; // string type
    $params[] = $date;
}

if ($area) {
    $sqlCustomers .= " AND c.Area_Number = ?";
    $types .= 'i'; // integer type
    $params[] = $area;
}

$stmtCustomers = $conn->prepare($sqlCustomers);
if ($types) {
    $stmtCustomers->bind_param($types, ...$params);
}
$stmtCustomers->execute();
$resultCustomers = $stmtCustomers->get_result();

$customerData = [];
if ($resultCustomers->num_rows > 0) {
    while ($row = $resultCustomers->fetch_assoc()) {
        $customerData[] = $row; // Add each customer to the array
    }
} else {
    $customerData = ['error' => 'No customer data found for the given parameters'];
}

// Third query: Fetch unique dates from Date_column for dropdown options
$sqlDates = "SELECT DISTINCT Date_column FROM customers ORDER BY STR_TO_DATE(Date_column, '%Y-%b') DESC";
$resultDates = $conn->query($sqlDates);

$dateData = [];
if ($resultDates->num_rows > 0) {
    while ($row = $resultDates->fetch_assoc()) {
        $dateData[] = $row['Date_column']; // Add each unique date to the array
    }
} else {
    $dateData = ['error' => 'No date data found'];
}

// Combine all results into one response
$response = [
    'invoice' => $invoiceData,
    'customers' => $customerData,
    'dates' => $dateData,
];

echo json_encode($response); // Return the combined result

// Close prepared statements and the database connection
$stmtInvoice->close();
$stmtCustomers->close();
$conn->close();
?>
