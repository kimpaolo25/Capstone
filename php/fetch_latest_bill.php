<?php
require 'dbcon.php';

// Run the query to get the latest bill's amount
$query = "SELECT Initial FROM customers ORDER BY Date_column DESC LIMIT 1";
$result = mysqli_query($conn, $query);

// Check for query errors
if (!$result) {
    echo json_encode(['error' => mysqli_error($conn)]);
    exit;
}

// Fetch the result and return the amount if found
if ($result && mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    echo json_encode($row); // Send the latest amount as JSON
} else {
    echo json_encode(['initialAmount' => 0]); // Default value if no record exists
}
?>
