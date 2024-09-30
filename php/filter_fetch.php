<?php
// Database Connection
require "dbCon.php";

// Set Content-Type header based on requested format
$format = $_GET['format'] ?? '';

if ($format === 'csv') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="data.csv"');
} elseif ($format === 'excel') {
    header('Content-Type: application/vnd.ms-excel');
    header('Content-Disposition: attachment; filename="data.xls"'); // Using .xls for compatibility
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
        $data = array();
        $stmt = $this->conn->prepare("CALL GetCustomerBillingInfo(?, ?, ?)");
        if (!$stmt) {
            return json_encode(["error" => "Failed to prepare statement: " . $this->conn->error]);
        }

        $yearParam = !empty($year) ? (int)$year : null;
        $areaParam = !empty($area) ? $area : null;
        $monthsParam = !empty($months) ? $months : null;

        // Adjust bind_param based on the types of your procedure parameters
        $stmt->bind_param("iss", $yearParam, $areaParam, $monthsParam);
        if (!$stmt->execute()) {
            return json_encode(["error" => "Error executing the stored procedure: " . $stmt->error]);
        }

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
$months = $_GET['months'] ?? ''; // Change 'month' to 'months'

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
