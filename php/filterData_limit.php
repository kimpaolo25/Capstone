<?php
// Enable all errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require "dbcon.php"; // Ensure this includes your DB connection setup

class FilterFetch {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function fetchFilteredData($year, $area, $months, $row_limit, $row_offset) {
        $data = [];

        // Check for a valid connection
        if ($this->conn->connect_error) {
            die(json_encode(["error" => "Connection failed: " . $this->conn->connect_error]));
        }

        // Base SQL query
        $sqlQuery = "SELECT c.bill_id, c.Name, p.places_name AS Area_Number, 
                            c.Present, c.Previous, c.Date_column, c.Initial, 
                            c.CU_M, c.Amount, 
                            STR_TO_DATE(CONCAT(c.Date_column, '-01'), '%Y-%b-%d') AS pseudo_date 
                     FROM customers c
                     JOIN places p ON c.Area_Number = p.Area_Number";
        
        $conditions = [];

        // Prepare conditions based on input parameters
        if ($year !== null && $year !== '') {
            $conditions[] = "YEAR(STR_TO_DATE(CONCAT(c.Date_column, '-01'), '%Y-%b-%d')) = ?";
        }
        if (!empty($area)) {
            $conditions[] = "p.places_name = ?";
        }
        if (!empty($months)) {
            $monthsArray = explode(',', $months);
            $placeholders = implode(',', array_fill(0, count($monthsArray), '?'));
            $conditions[] = "MONTH(STR_TO_DATE(CONCAT(c.Date_column, '-01'), '%Y-%b-%d')) IN ($placeholders)";
        }

        // Append conditions to the query
        if (count($conditions) > 0) {
            $sqlQuery .= " WHERE " . implode(' AND ', $conditions);
        }

        // Add ORDER BY to sort by pseudo_date in descending order, regardless of filters
        $sqlQuery .= " ORDER BY pseudo_date DESC";

        // Add LIMIT and OFFSET
        $sqlQuery .= " LIMIT ? OFFSET ?";
        
        // Prepare the statement
        $stmt = $this->conn->prepare($sqlQuery);
        if (!$stmt) {
            die(json_encode(["error" => "Failed to prepare statement: " . $this->conn->error]));
        }

        // Bind parameters
        $params = [];
        $types = '';

        if ($year !== null && $year !== '') {
            $params[] = (int)$year;
            $types .= 'i'; // Integer
        }
        if (!empty($area)) {
            $params[] = $area;
            $types .= 's'; // String
        }
        if (!empty($months)) {
            foreach ($monthsArray as $month) {
                $params[] = (int)$month; // Ensure month is treated as integer
                $types .= 'i'; // Integer
            }
        }

        // Add row limit and offset to params
        $params[] = (int)$row_limit;
        $params[] = (int)$row_offset;
        $types .= 'ii'; // Two integers

        // Debugging: Log the final SQL query and parameters
        error_log("Executing SQL Query: $sqlQuery");
        error_log("Parameters: " . json_encode($params));

        // Bind parameters dynamically
        $stmt->bind_param($types, ...$params);

        // Execute the statement
        if (!$stmt->execute()) {
            die(json_encode(["error" => "Error executing the statement: " . $stmt->error]));
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

// Fetch data based on the filtering parameters from the request
$year = $_GET['year'] ?? null; // Allow null
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
