<?php
include 'dbcon.php';

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$searchQuery = $_GET['query'] ?? '';
$searchQuery = $conn->real_escape_string($searchQuery); // Prevent SQL injection

$sql = "SELECT * FROM customers WHERE Name LIKE '%$searchQuery%'";
$result = $conn->query($sql);

$records = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }
}

$conn->close();
header('Content-Type: application/json');
echo json_encode($records);
?>
