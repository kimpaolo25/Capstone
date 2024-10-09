<?php
// Include the database connection file
require 'dbcon.php';

header('Content-Type: application/json');

// Start session to get the logged-in user's username
session_start();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Debugging: Log POST data
        error_log(print_r($_POST, true)); // This will log the POST data

        if (isset($_POST['action']) && $_POST['action'] === 'update') {
            // Retrieve POST data
            $name = $_POST['name'] ?? null;
            $username = $_POST['username'] ?? null;
            $currentPassword = $_POST['current_password'] ?? null;
            $newPassword = $_POST['new_password'] ?? null;
            $confirmPassword = $_POST['confirm_password'] ?? null;
            $userLevel = $_POST['user_level'] ?? null; // New user level field

            // Validate inputs
            if (is_null($name) || is_null($username) || is_null($currentPassword) || is_null($newPassword) || is_null($confirmPassword) || is_null($userLevel)) {
                echo json_encode(['success' => false, 'message' => 'All fields are required.']);
                exit;
            }

            // Clean up and map user level from string to integer
            $userLevel = strtolower(trim($userLevel)); // Convert to lowercase and trim spaces
            if ($userLevel === 'admin') {
                $userLevel = 1;
            } elseif ($userLevel === 'staff') {
                $userLevel = 2;
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid user level.']);
                exit;
            }

            // Ensure $conn is available and connected
            if (!$conn) {
                throw new Exception('Database connection failed');
            }

            // Prepare to check the current password for the user being updated
            $stmt = $conn->prepare("SELECT password_hash FROM users WHERE username = ?");
            $stmt->bind_param("s", $username); // Verify current password for $username
            $stmt->execute();
            $stmt->bind_result($hashedPassword);
            $stmt->fetch();
            $stmt->close();

            // Verify the current password
            if (!password_verify($currentPassword, $hashedPassword)) {
                echo json_encode(['success' => false, 'message' => 'Current password is incorrect.']);
                exit;
            }

            // Check if new password and confirm password match
            if ($newPassword !== $confirmPassword) {
                echo json_encode(['success' => false, 'message' => 'New passwords do not match.']);
                exit;
            }

            // Hash the new password
            $newHashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

            // Prepare the SQL UPDATE query to include user_level
            $stmt = $conn->prepare("UPDATE users SET name=?, username=?, password_hash=?, user_level=? WHERE username=?");
            $stmt->bind_param("sssis", $name, $username, $newHashedPassword, $userLevel, $username); // Update based on $username


            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'User information updated successfully.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to update user information: ' . $stmt->error]);
            }

            $stmt->close(); // Close the statement
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    }
} catch (Exception $e) {
    // Catch any exceptions and return an error
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// Close the connection
$conn->close();
?>