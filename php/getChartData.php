<?php
header('Content-Type: application/json');

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
$reset = isset($input['reset']) ? $input['reset'] : false;
$year = isset($input['year']) ? intval($input['year']) : null;

// Define the response array
$response = [];

// Determine which query to run based on reset or year parameter
if ($reset) {
    // If reset, fetch all data (reset to default)
    $sqlIncomePerMonth = "
        SELECT 
            Date_column,
            IFNULL(SUM(Amount), 0) AS total_income 
        FROM 
            customers 
        GROUP BY 
            Date_column
        ORDER BY 
            SUBSTRING(Date_column, 1, 4) ASC,
            FIELD(SUBSTRING(Date_column, 6, 3), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec') ASC;
    ";

    $resultIncomePerMonth = $conn->query($sqlIncomePerMonth);
    $totalIncomeData = [];
    while ($row = $resultIncomePerMonth->fetch_assoc()) {
        $totalIncomeData[] = [
            'month_year' => $row["Date_column"],
            'total_income' => (float)$row["total_income"]
        ];
    }

    $sqlCubicMeterPerMonth = "
        SELECT 
            Date_column,
            IFNULL(SUM(CU_M), 0) AS total_cubic_meter 
        FROM 
            customers 
        GROUP BY 
            Date_column
        ORDER BY 
            SUBSTRING(Date_column, 1, 4) ASC,
            FIELD(SUBSTRING(Date_column, 6, 3), 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec') ASC;
    ";

    $resultCubicMeterPerMonth = $conn->query($sqlCubicMeterPerMonth);
    $totalCubicMeterData = [];
    while ($row = $resultCubicMeterPerMonth->fetch_assoc()) {
        $totalCubicMeterData[] = [
            'month_year' => $row["Date_column"],
            'total_cubic_meter' => (float)$row["total_cubic_meter"]
        ];
    }

    $response['totalIncomeData'] = $totalIncomeData;
    $response['totalCubicMeterData'] = $totalCubicMeterData;

} elseif ($year) {
    // If a year is selected, fetch data for that specific year
    $sqlIncome = "
        SELECT 
            MONTH(STR_TO_DATE(CONCAT(Date_column, '-01'), '%Y-%b-%d')) AS month,
            SUM(Amount) AS totalIncome
        FROM 
            customers
        WHERE 
            YEAR(STR_TO_DATE(CONCAT(Date_column, '-01'), '%Y-%b-%d')) = ?
        GROUP BY 
            month
        ORDER BY 
            month;
    ";

    $stmtIncome = $conn->prepare($sqlIncome);
    $stmtIncome->bind_param("i", $year);
    $stmtIncome->execute();
    $resultIncome = $stmtIncome->get_result();

    $incomeData = [];
    while ($row = $resultIncome->fetch_assoc()) {
        $incomeData[] = [
            "month" => $row['month'],
            "totalIncome" => floatval($row['totalIncome'])
        ];
    }

    $incomeLabels = [];
    $incomeValues = [];
    foreach ($incomeData as $data) {
        $monthNumber = $data['month'];
        $monthName = date('M', mktime(0, 0, 0, $monthNumber, 1));
        $incomeLabels[] = $monthName . ' ' . $year;
        $incomeValues[] = $data['totalIncome'];
    }

    $response["totalIncomePerYear"] = [
        "labels" => $incomeLabels,
        "values" => $incomeValues,
    ];

    $sqlConsumption = "
        SELECT 
            MONTH(STR_TO_DATE(CONCAT(Date_column, '-01'), '%Y-%b-%d')) AS month,
            SUM(CU_M) AS totalConsumption
        FROM 
            customers
        WHERE 
            YEAR(STR_TO_DATE(CONCAT(Date_column, '-01'), '%Y-%b-%d')) = ?
        GROUP BY 
            month
        ORDER BY 
            month;
    ";

    $stmtConsumption = $conn->prepare($sqlConsumption);
    $stmtConsumption->bind_param("i", $year);
    $stmtConsumption->execute();
    $resultConsumption = $stmtConsumption->get_result();

    $consumptionData = [];
    while ($row = $resultConsumption->fetch_assoc()) {
        $consumptionData[] = [
            "month" => $row['month'],
            "totalConsumption" => floatval($row['totalConsumption'])
        ];
    }

    $consumptionLabels = [];
    $consumptionValues = [];
    foreach ($consumptionData as $data) {
        $monthNumber = $data['month'];
        $monthName = date('M', mktime(0, 0, 0, $monthNumber, 1));
        $consumptionLabels[] = $monthName . ' ' . $year;
        $consumptionValues[] = $data['totalConsumption'];
    }

    $response["cubicMeterConsumptionPerYear"] = [
        "labels" => $consumptionLabels,
        "values" => $consumptionValues,
    ];
}

// Send JSON response
echo json_encode($response);

// Close the database connection
$conn->close();
?>
