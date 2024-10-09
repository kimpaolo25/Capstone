<?php
require 'dbcon.php';

$query = "SELECT id, name, username FROM users";
$result = mysqli_query($conn, $query);

$users = array();
while($row = mysqli_fetch_assoc($result)) {
    $users[] = $row;
}

echo json_encode($users);
?>
