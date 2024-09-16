<?php
// Include the database connection file
include 'dbcon.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            // Update record by ID
            $id = $_POST['id'];
            $name = $_POST['name'];
            $area = $_POST['area'];
            $current = $_POST['current'];
            $previous = $_POST['previous'];
            $date = $_POST['date'];
            $initialAmount = $_POST['initialAmount'];
            $cuM = $_POST['cuM'];
            $amount = $_POST['amount'];

            // Format the date to YYYY-MMM
            $date = date('Y-M', strtotime($date));

            // Ensure $conn is available and connected
            if (!$conn) {
                throw new Exception('Database connection failed');
            }

            // Prepare the SQL UPDATE query
            $stmt = $conn->prepare("UPDATE customers SET Name=?, Area_Number=?, Present=?, Previous=?, Date_column=?, Initial=?, CU_M=?, Amount=? WHERE bill_id=?");
            $stmt->bind_param('sisssdsdi', $name, $area, $current, $previous, $date, $initialAmount, $cuM, $amount, $id);

            if ($stmt->execute()) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update record']);
            }

            $stmt->close(); // Close the statement
        } elseif (isset($_POST['id'])) {
            // Fetch record by ID
            $id = $_POST['id'];

            // Ensure $conn is available and connected
            if (!$conn) {
                throw new Exception('Database connection failed');
            }

            // Prepare and execute the SQL query
            $stmt = $conn->prepare("SELECT * FROM customers WHERE bill_id = ?");
            $stmt->bind_param("i", $id); // Bind the ID as an integer
            $stmt->execute();
            $result = $stmt->get_result();
            $record = $result->fetch_assoc();

            if ($record) {
                // Format the date to YYYY-MMM for consistency
                $record['Date_column'] = date('Y-M', strtotime($record['Date_column']));
                echo json_encode($record);
            } else {
                echo json_encode(['error' => 'Record not found']);
            }

            $stmt->close(); // Close the statement
        } else {
            echo json_encode(['error' => 'No ID provided']);
        }
    } else {
        echo json_encode(['error' => 'Invalid request method']);
    }
} catch (Exception $e) {
    // Catch any exceptions and return an error
    echo json_encode(['error' => $e->getMessage()]);
}

// Close the connection
$conn->close();
?>
