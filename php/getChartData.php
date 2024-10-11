<?php
// Database connection setup
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "prwai_data";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Get parameters from POST request
$input = json_decode(file_get_contents("php://input"), true);
$year = isset($input['year']) ? intval($input['year']) : date('Y'); // Default to the current year if not provided

// Example SQL query for total income per year grouped by month
$sqlIncome = "SELECT MONTH(STR_TO_DATE(CONCAT(date_column, '-01'), '%Y-%b-%d')) AS month, SUM(Amount) AS totalIncome
              FROM customers
              WHERE YEAR(STR_TO_DATE(CONCAT(date_column, '-01'), '%Y-%b-%d')) = ?
              GROUP BY month
              ORDER BY month";

// Prepare and execute the statement for income
$stmtIncome = $conn->prepare($sqlIncome);
$stmtIncome->bind_param("i", $year);
$stmtIncome->execute();
$resultIncome = $stmtIncome->get_result();

// Fetch income data and create labels and values
$incomeData = [];
while ($row = $resultIncome->fetch_assoc()) {
    $incomeData[] = [
        "month" => $row['month'],
        "totalIncome" => floatval($row['totalIncome'])
    ];
}

// Create month labels for the income data
$incomeLabels = [];
$incomeValues = [];
foreach ($incomeData as $data) {
    // Get the month number and create a label with shortened month name and year
    $monthNumber = $data['month'];
    $monthName = date('M', mktime(0, 0, 0, $monthNumber, 1)); // Get shortened month name
    $incomeLabels[] = $monthName . ' ' . $year; // Format: "Month Year"
    $incomeValues[] = $data['totalIncome'];
}

// Prepare the response data for income
$response["totalIncomePerYear"] = [
    "labels" => $incomeLabels,
    "values" => $incomeValues,
];

// SQL query for cubic meter consumption per year grouped by month
$sqlConsumption = "SELECT MONTH(STR_TO_DATE(CONCAT(date_column, '-01'), '%Y-%b-%d')) AS month, SUM(CU_M) AS totalConsumption
                   FROM customers
                   WHERE YEAR(STR_TO_DATE(CONCAT(date_column, '-01'), '%Y-%b-%d')) = ?
                   GROUP BY month
                   ORDER BY month";

// Prepare and execute the statement for consumption
$stmtConsumption = $conn->prepare($sqlConsumption);
$stmtConsumption->bind_param("i", $year);
$stmtConsumption->execute();
$resultConsumption = $stmtConsumption->get_result();

// Fetch consumption data and create labels and values
$consumptionData = [];
while ($row = $resultConsumption->fetch_assoc()) {
    $consumptionData[] = [
        "month" => $row['month'],
        "totalConsumption" => floatval($row['totalConsumption'])
    ];
}

// Create month labels for the consumption data
$consumptionLabels = [];
$consumptionValues = [];
foreach ($consumptionData as $data) {
    // Get the month number and create a label with shortened month name and year
    $monthNumber = $data['month'];
    $monthName = date('M', mktime(0, 0, 0, $monthNumber, 1)); // Get shortened month name
    $consumptionLabels[] = $monthName . ' ' . $year; // Format: "Month Year"
    $consumptionValues[] = $data['totalConsumption'];
}

// Prepare the response data for consumption
$response["cubicMeterConsumptionPerYear"] = [
    "labels" => $consumptionLabels,
    "values" => $consumptionValues,
];

// Send JSON response
header('Content-Type: application/json');
echo json_encode($response);

// Close the database connection
$conn->close();
?>
