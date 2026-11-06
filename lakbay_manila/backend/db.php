
<?php

$host = getenv("DB_HOST");
$username = getenv("DB_USER");
$password = getenv("DB_PASSWORD");
$database = getenv("DB_NAME");
$port = (int)(getenv("DB_PORT") ?: 4000);

// Initialize MySQLi
mysqli_report(MYSQLI_REPORT_OFF);
$conn = mysqli_init();

if (!$conn) {
    http_response_code(500);
    die("Database initialization failed.");
}

// Connection timeout
$conn->options(MYSQLI_OPT_CONNECT_TIMEOUT, 10);

// Enable certificate verification
$conn->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, true);

// Use the trusted CA certificates in the Render container
$conn->ssl_set(
    null,
    null,
    "/etc/ssl/certs/ca-certificates.crt",
    null,
    null
);

// Connect using TLS
$connected = $conn->real_connect(
    $host,
    $username,
    $password,
    $database,
    $port,
    null,
    MYSQLI_CLIENT_SSL
);

if (!$connected) {
    http_response_code(500);
    die("Database connection failed.");
}

// Set character encoding
$conn->set_charset("utf8mb4");

?>
