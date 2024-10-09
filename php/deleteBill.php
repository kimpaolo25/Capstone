<?php
require 'dbcon.php';

// Check if `id` is set in the POST request
if (isset($_POST['id'])) {
    $id = $_POST['id'];

    // Prepare the SQL query to delete the entry
    $sql = "DELETE FROM customers WHERE bill_id = ?";
    $stmt = $conn->prepare($sql);
    
    // Bind the parameter to the SQL query
    if ($stmt->bind_param("i", $id)) {
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                // Return success if a row was deleted
                echo json_encode(['success' => true]);
            } else {
                // No rows were deleted (possibly invalid Bill_ID)
                echo json_encode(['success' => false, 'message' => 'No record found with the provided Bill ID.']);
            }
        } else {
            // Return error if query execution failed
            echo json_encode(['success' => false, 'message' => 'Failed to execute delete query.']);
        }
        $stmt->close();
    } else {
        // Return error if the statement could not be prepared
        echo json_encode(['success' => false, 'message' => 'Failed to prepare the SQL statement.']);
    }
} else {
    // Return error if `id` was not set in the request
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
}

$conn->close();
?>
