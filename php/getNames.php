<?php
require 'dbcon.php';

// Check if `query` is set in the GET request
if (isset($_GET['query'])) {
    $query = $_GET['query'];
    $likeQuery = "%$query%";

    // Prepare the SQL query to fetch unique names
    $sql = "SELECT DISTINCT TRIM(Name) as Name FROM customers WHERE TRIM(Name) LIKE ?"; // Use DISTINCT to avoid duplicates
    $stmt = $conn->prepare($sql);

    // Bind the parameter to the SQL query
    if ($stmt->bind_param("s", $likeQuery)) {
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            $names = [];

            while ($row = $result->fetch_assoc()) {
                $names[] = $row['Name']; // Store each name in an array
            }

            // Return names as JSON response
            echo json_encode(['success' => true, 'names' => $names]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to execute query.']);
        }
        $stmt->close();
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to prepare the SQL statement.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
}

$conn->close();
?>
