<?php
session_start();

// Destroy all session data
session_unset();  // Unset all session variables
session_destroy(); // Destroy the session itself

// Redirect the user to the login page
header("Location: ../index.php");
exit;
?>
