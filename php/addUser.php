<?php
// Include the database connection file
include 'dbcon.php';

header('Content-Type: application/json');

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Retrieve form data
    $name = $_POST['name'] ?? null; // Using null coalescing operator to avoid undefined index notices
    $username = $_POST['username'] ?? null;
    $password = $_POST['password'] ?? null;

    // Validate input
    if (is_null($name) || is_null($username) || is_null($password)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit;
    }

    // Ensure $conn is available and connected
    if (!$conn) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }

    // Check if the username already exists
    $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->bind_result($count);
    $stmt->fetch();
    $stmt->close();

    if ($count > 0) {
        echo json_encode(['success' => false, 'message' => 'Username already exists.']);
        exit;
    }

    // Hash the password for security
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Prepare SQL query to insert the new user
    $stmt = $conn->prepare("INSERT INTO users (name, username, password_hash) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $username, $hashedPassword);

    // Execute the query
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error adding user: ' . $stmt->error]);
    }

    $stmt->close(); // Close the statement
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}

// Close the connection
$conn->close();
?>
