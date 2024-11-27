<?php
// Include the database connection file
include 'dbcon.php';

// Set JSON response header
header('Content-Type: application/json');

// Fetch logs function
function fetchLogs($conn) {
    $query = "SELECT Name, Action, recordAffected, timestamp FROM logs ORDER BY timestamp DESC";
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Database Query Failed: " . $conn->error);
    }

    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    return $logs;
}

// Fetch and return logs
try {
    $logs = fetchLogs($conn);
    echo json_encode($logs);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

// Close the database connection
$conn->close();
?>
