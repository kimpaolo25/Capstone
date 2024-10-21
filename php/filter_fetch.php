<?php
// Enable all errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Database Connection
require "dbcon.php"; // Ensure this file contains your DB connection setup

// Set Content-Type header based on requested format
$format = $_GET['format'] ?? '';

if ($format === 'csv') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="data.csv"');
} elseif ($format === 'excel') {
    header('Content-Type: application/vnd.ms-excel');
    header('Content-Disposition: attachment; filename="data.xls"');
    header('Cache-Control: max-age=0');
    header('Pragma: public');
} else {
    header('Content-Type: application/json');
}

// FilterFetch class to handle filtering data
class FilterFetch {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function fetchFilteredData($year, $area, $months) {
        $data = [];
        $sqlQuery = "SELECT c.bill_id, c.Name, p.places_name AS Area_Number, 
                            c.Present, c.Previous, c.Date_column, c.Initial, 
                            c.CU_M, c.Amount 
                     FROM customers c
                     JOIN places p ON c.Area_Number = p.Area_Number";
        
        $conditions = [];
        
        // Prepare conditions based on input parameters
        if ($year !== null && $year !== '') {
            $conditions[] = "YEAR(STR_TO_DATE(c.Date_column, '%Y-%b')) = ?";
        }
        if (!empty($area)) {
            $conditions[] = "p.places_name = ?";
        }
        if (!empty($months)) {
            $monthsArray = explode(',', $months);
            $placeholders = implode(',', array_fill(0, count($monthsArray), '?'));
            $conditions[] = "MONTH(STR_TO_DATE(c.Date_column, '%Y-%b')) IN ($placeholders)";
        }

        // Append conditions to the query
        if (count($conditions) > 0) {
            $sqlQuery .= " WHERE " . implode(' AND ', $conditions);
        }

        // Prepare the statement
        $stmt = $this->conn->prepare($sqlQuery);
        if (!$stmt) {
            return json_encode(["error" => "Failed to prepare statement: " . $this->conn->error]);
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

        // Bind parameters dynamically
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        // Execute the statement
        if (!$stmt->execute()) {
            return json_encode(["error" => "Error executing the statement: " . $stmt->error]);
        }

        // Fetch results
        $result = $stmt->get_result();
        if (!$result) {
            return json_encode(["error" => "Error fetching result set: " . $this->conn->error]);
        }

        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        $result->free();
        return $data;
    }
}

// Fetch data with filtering parameters
$year = $_GET['year'] ?? '';
$area = $_GET['area'] ?? '';
$months = $_GET['months'] ?? '';

// If no filters are applied, return all data
if (empty($year) && empty($area) && empty($months)) {
    $year = null; // Set to null to bypass year filtering
    $area = null; // Set to null to bypass area filtering
    $months = null; // Set to null to bypass months filtering
}

$dataFetcher = new FilterFetch($conn);
$data = $dataFetcher->fetchFilteredData($year, $area, $months);

// Output based on the requested format
if ($format === 'csv') {
    // Output CSV
    $output = fopen('php://output', 'w');
    if (!empty($data)) {
        fputcsv($output, array_keys($data[0])); // Write header
        foreach ($data as $row) {
            fputcsv($output, $row); // Write data
        }
    } else {
        // If no data, write a header and an empty row
        fputcsv($output, ["No data found"]);
    }
    fclose($output);
} elseif ($format === 'excel') {
    // Output Excel as HTML table for better compatibility
    echo "<html xmlns:x=\"urn:schemas-microsoft-com:office:excel\">";
    echo "<head><meta charset=\"utf-8\"></head>";
    echo "<body>";
    echo "<table border='1'>";

    // Write header if there is data
    if (!empty($data)) {
        echo "<tr>\n";
        foreach (array_keys($data[0]) as $header) {
            echo "<th>$header</th>\n";  // Use <th> for header cells
        }
        echo "</tr>\n";

        // Write data
        foreach ($data as $row) {
            echo "<tr>\n";
            foreach ($row as $cell) {
                // Sanitize cell data to avoid issues with special characters
                $sanitizedCell = htmlspecialchars($cell, ENT_QUOTES);
                echo "<td>$sanitizedCell</td>\n";  // Use <td> for data cells
            }
            echo "</tr>\n";
        }
    } else {
        // Handle case where there is no data
        echo "<tr><td colspan=\"" . count($data[0]) . "\">No data found</td></tr>\n";
    }

    echo "</table>";
    echo "</body>";
    echo "</html>";
} else {
    // Output JSON by default
    echo json_encode($data);
}

// Close the connection
$conn->close();
?>
