<?php
session_start();
require_once 'dbcon.php'; // Include your database connection

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Fetch data from the login form
    $username = $_POST['username']; // Use the username as is
    $password = $_POST['password'];

    // Debugging: Print the username for checking
    error_log("Username entered: " . $username); // Log the entered username

    // Prepare the SQL query to get the user details
    $sql = "SELECT id, name, username, password_hash, user_level FROM users WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $username); // Bind the username as a string
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        // Fetch user data
        $user = $result->fetch_assoc();

        // Verify the entered password with the hashed password in the database
        if (password_verify($password, $user['password_hash'])) {
            // Start the session and set session variables
            $_SESSION['loggedin'] = true;
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['name'] = $user['name']; // Store the name for the personalized greeting
            $_SESSION['user_level'] = $user['user_level'];

            // Check the user level and redirect accordingly
            if ($_SESSION['user_level'] == 1) {
                // Admin (user_level 1) has full access to the site
                echo json_encode(['success' => true, 'redirect' => '../Capstone/admin.php']);
            } elseif ($_SESSION['user_level'] == 2) {
                // Staff (user_level 2) has access to the billManager.php page
                echo json_encode(['success' => true, 'redirect' => '../Capstone/billManager.php']);
            }
            exit;
        } else {
            // If password is incorrect
            echo json_encode(['success' => false, 'message' => 'Invalid login credentials']);
            exit;
        }
    } else {
        // If the user is not found in the database
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
} else {
    // Redirect to the login page if the request method is not POST
    header('Location: ../index.php');
    exit;
}
