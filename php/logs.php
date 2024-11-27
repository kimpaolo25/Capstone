<?php
// Include the database connection file
include 'dbcon.php'; // Make sure the path is correct

// Start the session to access session variables
session_start();

// Get the username from the session, with a fallback to 'Guest'
$userName = isset($_SESSION['name']) ? $_SESSION['name'] : 'Guest';

function insertLog($conn, $name, $action, $recordAffected) {
    $timestamp = date('Y-m-d H:i:s'); // Current timestamp
    $stmt = $conn->prepare("INSERT INTO logs (Name, Action, recordAffected, timestamp) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $action, $recordAffected, $timestamp);
    
    if ($stmt->execute()) {
        return true;
    } else {
        return false;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Use the session username instead of POST
    $name = $userName;
    $action = $_POST['action'];
    $recordAffected = $_POST['recordAffected'];

    // Insert the log
    if (insertLog($conn, $name, $action, $recordAffected)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to insert log.']);
    }
}

// Close the database connection
$conn->close();
?>