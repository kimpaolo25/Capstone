<?php
// Database Connection
require "dbCon.php";

// Set Content-Type header for JSON response
header('Content-Type: application/json');

// FilterFetch class to handle filtering data
class FilterFetch {
    private $conn;

    // Constructor to set the database connection
    public function __construct($conn) {
        $this->conn = $conn;
    }

    // Method to fetch filtered data
    public function fetchFilteredData($year, $area, $months) {
        $data = array(); // Initialize as an empty array to store fetched data

        // Prepare the stored procedure call
        $stmt = $this->conn->prepare("CALL GetCustomerBillingInfo(?, ?, ?)");

        if (!$stmt) {
            return json_encode(["error" => "Failed to prepare statement: " . $this->conn->error]);
        }

        // Prepare the input parameters
        $yearParam = !empty($year) ? (int)$year : null; // Convert to integer if not empty
        $areaParam = !empty($area) ? $area : null; // Area remains string
        $monthsParam = !empty($months) ? $months : null; // Months remains string

        // Bind parameters
        $stmt->bind_param("iss", $yearParam, $areaParam, $monthsParam); // i = integer, s = string, s = string

        // Execute the stored procedure
        if (!$stmt->execute()) {
            return json_encode(["error" => "Error executing the stored procedure: " . $stmt->error]);
        }

        $result = $stmt->get_result();

        // Check for query execution errors
        if (!$result) {
            return json_encode(["error" => "Error fetching result set: " . $this->conn->error]);
        }

        // Fetch and store each row of data
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        // Free result set
        $result->free();

        return $data; // Return the fetched data
    }
}

// Fetch data with filtering parameters
$year = $_GET['year'] ?? ''; // Get the year from GET request
$area = $_GET['area'] ?? ''; // Get the area from GET request
$months = $_GET['months'] ?? ''; // Get the months from GET request

// Initialize the data fetcher and get the data
$dataFetcher = new FilterFetch($conn);
$data = $dataFetcher->fetchFilteredData($year, $area, $months);

// Output JSON encoded data
echo json_encode($data);

// Close the connection
$conn->close();
?>
