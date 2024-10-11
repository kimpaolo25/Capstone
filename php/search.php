<?php
require 'dbcon.php';

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$searchQuery = $_GET['query'] ?? '';
$searchQuery = $conn->real_escape_string($searchQuery); // Prevent SQL injection

// Pagination parameters
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10; // Default to 10 records per page
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0; // Default to start from the first record

// Query to fetch records based on search query
$sql = "SELECT * FROM customers WHERE Name LIKE '%$searchQuery%' ORDER BY bill_id DESC LIMIT $limit OFFSET $offset"; // Use LIMIT and OFFSET
$result = $conn->query($sql);

$records = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }
}

// Get the total number of records for the search query to enable proper pagination
$totalQuery = "SELECT COUNT(*) as total FROM customers WHERE Name LIKE '%$searchQuery%'";
$totalResult = $conn->query($totalQuery);
$totalCount = $totalResult->fetch_assoc()['total'];

// Close the connection
$conn->close();

// Set the response header to application/json
header('Content-Type: application/json');
// Return the JSON encoded records and total count for pagination
echo json_encode([
    'records' => $records,
    'totalCount' => $totalCount, // Return total count for pagination
]);
?>
