<?php

// DATABASE CONNECTION SETTINGS
$host = "localhost";
$username = "root";
$password = "";
$database = "lakbay_manila";

// CONNECT TO MYSQL
$conn = new mysqli($host, $username, $password, $database);

// CHECK CONNECTION
if ($conn->connect_error) {
    http_response_code(500);
    die("Database connection failed.");
}

// SET CHARACTER ENCODING
$conn->set_charset("utf8mb4");

?>
