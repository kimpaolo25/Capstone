<?php
include 'dbcon.php'; // Ensure your database connection file is included

if (isset($_GET['name'])) {
    $name = $_GET['name'];

    // Prepare the SQL statement to prevent SQL injection
    $stmt = $conn->prepare("SELECT Area_Number, Present, Previous, Date_column, Initial, CU_M, Amount FROM customers WHERE Name = ? ORDER BY bill_id DESC");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Fetch the latest record
        $record = $result->fetch_assoc();
        echo json_encode($record);
    } else {
        echo json_encode([]);
    }

    $stmt->close();
}

$conn->close();
?>
