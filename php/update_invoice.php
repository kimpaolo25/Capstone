<?php
// update_invoice.php
require 'dbcon.php';

// Check if POST data is available
if (isset($_POST['detailId'], $_POST['firstPenalty'], $_POST['secondPenalty'], $_POST['gcashInf'], $_POST['gcashFee'])) {
    $detailId = $_POST['detailId'];
    $firstPenalty = $_POST['firstPenalty'];
    $secondPenalty = $_POST['secondPenalty'];
    $gcashInf = $_POST['gcashInf'];
    $gcashFee = $_POST['gcashFee'];

    // Update query to update the invoice details
    $query = "UPDATE invoicetable 
              SET firstPenalty = ?, secondPenalty = ?, gcashNum = ?, gcashFee = ? 
              WHERE detailId = ?";

    // Prepare and bind parameters
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ssssi', $firstPenalty, $secondPenalty, $gcashInf, $gcashFee, $detailId);

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }

    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Missing parameters']);
}

$conn->close();
?>
