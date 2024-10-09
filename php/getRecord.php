<?php
require 'dbcon.php';

// Check if `id` is set in the GET request
if (isset($_GET['id'])) {
    $id = $_GET['id'];

    // Prepare the SQL query to fetch the entry
    $sql = "SELECT * FROM customers WHERE bill_id = ?";
    $stmt = $conn->prepare($sql);
    
    // Bind the parameter to the SQL query
    if ($stmt->bind_param("i", $id)) {
        if ($stmt->execute()) {
            $result = $stmt->get_result();
            if ($result->num_rows > 0) {
                // Fetch the record as an associative array
                $record = $result->fetch_assoc();
                echo json_encode(['success' => true, 'record' => $record]);
            } else {
                // No records found with the provided ID
                echo json_encode(['success' => false, 'message' => 'No record found with the provided Bill ID.']);
            }
        } else {
            // Query execution failed
            echo json_encode(['success' => false, 'message' => 'Failed to execute query.']);
        }
        $stmt->close();
    } else {
        // Statement preparation failed
        echo json_encode(['success' => false, 'message' => 'Failed to prepare the SQL statement.']);
    }
} else {
    // ID parameter not set
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
}

$conn->close();
?>
