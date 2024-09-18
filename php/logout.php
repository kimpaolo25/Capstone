<?php
session_start();
session_unset(); // Unset all session variables
session_destroy(); // Destroy the session
session_regenerate_id(true); // Regenerate session ID after logout

// Clear session cookies
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"], 
        $params["secure"], $params["httponly"]
    );
}

// Redirect to the login page or any other page
header("Location: index.php");
exit();
?>
