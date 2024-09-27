<?php
session_start();
session_regenerate_id(true); // Regenerate session ID after login
include 'dbcon.php'; // Include the MySQLi database connection

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Prepare and execute the query
    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    // Check if user exists and password is valid
    if ($user && password_verify($password, $user['password_hash'])) {
        // Set session variables for logged-in user
        $_SESSION['loggedin'] = true;
        $_SESSION['username'] = $user['username'];
        $_SESSION['name'] = $user['name']; // Add this to store user's name
        $_SESSION['is_admin'] = true; // Admin flag

        // Return success response
        echo json_encode(['success' => true]);
    } else {
        // Return error response
        echo json_encode(['success' => false, 'message' => 'Invalid credentials.']);
    }

    $stmt->close(); // Close the statement
    $conn->close(); // Close the connection
}
?>
