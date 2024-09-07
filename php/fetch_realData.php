<?php
// Database Connection
require "dbCon.php";

// Set Content-Type header for JSON response
header('Content-Type: application/json');

// AdminBillDisplay class to handle displaying bills for admin
class AdminBillDisplay {
    private $conn;

    // Constructor to set the database connection
    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Method to fetch and format bill data for display with pagination
    public function displayBills($limit, $offset) {
        $data = array(); // Initialize as an empty array to store fetched data

        // SQL query to select bills with pagination
        $sqlQuery = "SELECT bill_id, Name, Area_Number, Present, Previous, Date_column, Initial, CU_M, Amount 
        FROM customers  
        ORDER BY bill_id DESC 
        LIMIT ? OFFSET ?";

        // Prepare and execute the SQL statement
        $stmt = $this->conn->prepare($sqlQuery);
        if (!$stmt) {
            // Handle query preparation error
            return json_encode(["error" => "Failed to prepare statement: " . $this->conn->error]);
        }
        $stmt->bind_param("ii", $limit, $offset);
        $stmt->execute();
        $result = $stmt->get_result();

        // Check for query execution errors
        if (!$result) {
            // Handle query execution error
            return json_encode(["error" => "Error executing the query: " . $this->conn->error]);
        }

        // Fetch and format each row of data
        while ($row = $result->fetch_assoc()) {
            // Format specific fields in each row using the formatRow method
            $row = $this->formatRow($row);

            // Store formatted row data in the $data array
            $data[] = array(
                'bill_id' => $row['bill_id'],
                'name' => $row['Name'],
                'Area_Number' => $row['Area_Number'],
                'present' => $row['Present'],
                'previous' => $row['Previous'],
                'date' => $row['Date_column'],
                'initial' => $row['Initial'],
                'cu_m' => $row['CU_M'],
                'amount' => $row['Amount'],
            );
        }

        return $data; // Return the fetched and formatted data
    }

    // Method to format specific fields in a row of data
    private function formatRow($row) {
        // Format the 'Amount' field with peso sign (₱) and commas for better readability
        $row['Amount'] = '₱' . number_format($row['Amount'], 2);

        // Add commas for better readability in 'CU_M' field
        $row['CU_M'] = number_format($row['CU_M'], 2);

        return $row; // Return the formatted row
    }
}

// Fetch data with pagination parameters
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

$billDisplay = new AdminBillDisplay($conn);
$data = $billDisplay->displayBills($limit, $offset);

// Output JSON encoded data
echo json_encode($data);
?>
