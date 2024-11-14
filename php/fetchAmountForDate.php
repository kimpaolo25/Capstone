<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "prwai_data";

// Create a connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get the selected date from the request
$selectedDate = $_GET['date'] ?? '';

// Initialize total amount
$totalAmount = 0;

if ($selectedDate) {
    // SQL query to sum amounts for the selected date
    $sql = "SELECT SUM(Amount) AS totalAmount FROM customers WHERE Date_column = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $selectedDate);
    $stmt->execute();
    $stmt->bind_result($totalAmount);
    $stmt->fetch();
    $stmt->close();
}

echo json_encode(['totalAmount' => $totalAmount]);
$conn->close();
?>
