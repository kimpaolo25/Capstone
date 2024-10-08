<?php
// Database Connection
require 'dbCon.php';

$response = array('success' => false);

// Collect form data
$name = $_POST['name'];
$area = $_POST['area'];
$date = $_POST['date']; // This should be in the format 'YYYY-MM' (e.g., '2024-09')
$initialAmount = $_POST['initialAmount'];

// Collect form data with null defaults for optional fields
$current = isset($_POST['current']) && $_POST['current'] !== '' ? $_POST['current'] : 0;
$previous = isset($_POST['previous']) && $_POST['previous'] !== '' ? $_POST['previous'] : 0;
$cuM = isset($_POST['cuM']) && $_POST['cuM'] !== '' ? $_POST['cuM'] : 0;
$amount = isset($_POST['amount']) && $_POST['amount'] !== '' ? $_POST['amount'] : 0.00;

// Split the date string into year and month
list($year, $monthNumber) = explode('-', $date);

// Array mapping month numbers to month names
$months = array(
    '01' => 'Jan',
    '02' => 'Feb',
    '03' => 'Mar',
    '04' => 'Apr',
    '05' => 'May',
    '06' => 'Jun',
    '07' => 'Jul',
    '08' => 'Aug',
    '09' => 'Sep',
    '10' => 'Oct',
    '11' => 'Nov',
    '12' => 'Dec'
);

// Replace the month number with the month name
if (isset($months[$monthNumber])) {
    $formattedDate = $year . '-' . $months[$monthNumber]; // Format: YYYY-Month
} else {
    $response['message'] = 'Invalid month number in date.';
    file_put_contents('debug.log', print_r($response, true), FILE_APPEND);
    echo json_encode($response);
    exit;
}

// SQL query to insert new data
$sql = "INSERT INTO customers (Name, Area_Number, Present, Previous, Date_column, Initial, CU_M, Amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
if ($stmt) {
    // Bind parameters with the formatted date as a string
    $stmt->bind_param('ssddsddd', $name, $area, $current, $previous, $formattedDate, $initialAmount, $cuM, $amount);
    if ($stmt->execute()) {
        $response['success'] = true;
    } else {
        $response['message'] = 'Error executing the query: ' . $stmt->error;
    }
} else {
    $response['message'] = 'Failed to prepare statement: ' . $conn->error;
}

// Debug: Log error if not successful
if (!$response['success']) {
    file_put_contents('debug.log', print_r($response, true), FILE_APPEND);
}

echo json_encode($response);
?>
