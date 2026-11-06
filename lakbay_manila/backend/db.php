<?php

// DATABASE CONNECTION SETTINGS (RENDER ENVIRONMENT)
$host = getenv("DB_HOST");
$username = getenv("DB_USER");
$password = getenv("DB_PASSWORD");
$database = getenv("DB_NAME");
$port = (int)(getenv("DB_PORT") ?: 4000);

// INITIALIZE MYSQLI
mysqli_report(MYSQLI_REPORT_OFF);
$conn = mysqli_init();

if (!$conn) {
    http_response_code(500);
    exit("Database initialization failed.");
}

// CONNECTION OPTIONS
$conn->options(MYSQLI_OPT_CONNECT_TIMEOUT, 10);
$conn->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, true);

// TLS CERTIFICATE
$conn->ssl_set(
    null,
    null,
    "/etc/ssl/certs/ca-certificates.crt",
    null,
    null
);

// CONNECT TO TIDB CLOUD
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
    exit("Database connection failed.");
}

// SET CHARACTER ENCODING
$conn->set_charset("utf8mb4");
