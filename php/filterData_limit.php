<?php
// Enable all errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

class FilterFetch {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function fetchFilteredData($year, $area, $months, $row_limit, $row_offset) {
        $data = array();

        // Check for a valid connection
        if ($this->conn->connect_error) {
            die(json_encode(["error" => "Connection failed: " . $this->conn->connect_error]));
        }

        // Prepare the stored procedure call with 5 parameters
        $stmt = $this->conn->prepare("CALL FilterWithLimit(?, ?, ?, ?, ?)");
        if (!$stmt) {
            die(json_encode(["error" => "Failed to prepare statement: " . $this->conn->error]));
        }

        // Default the input values if not provided
        $yearParam = !empty($year) ? (int)$year : null;
        $areaParam = !empty($area) ? $area : null;
        $monthsParam = !empty($months) ? $months : null;
        $rowLimitParam = !empty($row_limit) ? (int)$row_limit : 1000; // Default limit to 1000
        $rowOffsetParam = !empty($row_offset) ? (int)$row_offset : 0; // Default offset to 0

        // Bind parameters to the stored procedure (assuming correct types)
        $stmt->bind_param("issii", $yearParam, $areaParam, $monthsParam, $rowLimitParam, $rowOffsetParam);
        if (!$stmt->execute()) {
            die(json_encode(["error" => "Error executing the stored procedure: " . $stmt->error]));
        }

        // Fetch results
        $result = $stmt->get_result();
        if (!$result) {
            die(json_encode(["error" => "Error fetching result set: " . $this->conn->error]));
        }

        // Collect data
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        $result->free();
        return $data;
    }
}

// Create database connection (assuming $conn is your existing connection)
$conn = new mysqli("localhost", "root", "", "prwai_data");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Fetch data based on the filtering parameters from the request
$year = $_GET['year'] ?? '';
$area = $_GET['area'] ?? '';
$months = $_GET['months'] ?? '';
$row_limit = $_GET['limit'] ?? 10; // Example default limit of 10 rows
$row_offset = $_GET['offset'] ?? 0; // Example default offset of 0

// Instantiate the FilterFetch class and fetch data
$dataFetcher = new FilterFetch($conn);
$data = $dataFetcher->fetchFilteredData($year, $area, $months, $row_limit, $row_offset);

// Output the data as JSON for JavaScript consumption
header('Content-Type: application/json');
echo json_encode($data);
?>
