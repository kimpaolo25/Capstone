<?php
$servername = getenv('DB_HOST');   // e.g., 'your-database-host'
$username = getenv('DB_USER');     // e.g., 'your-database-user'
$password = getenv('DB_PASS'); // e.g., 'your-database-password'
$dbname = getenv('DB_NAME');       // e.g., 'your-database-name'

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
