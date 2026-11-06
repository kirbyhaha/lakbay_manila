<?php

header("Content-Type: application/json; charset=UTF-8");

require_once "db.php";

// ALLOW LOCAL FRONTEND REQUESTS
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// HANDLE PREFLIGHT REQUEST
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// SEND JSON RESPONSE
function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// GET REQUEST ACTION
$method = $_SERVER["REQUEST_METHOD"];

// UPLOAD DIRECTORY
$uploadDirectory = __DIR__ . "/uploads/";

if (!is_dir($uploadDirectory)) {
    mkdir($uploadDirectory, 0755, true);
}

// CONVERT DATABASE RECORD TO JSON FORMAT
function formatPlace($row) {
    return [
        "id" => (int) $row["id"],
        "name" => $row["name"],
        "category" => $row["category"],
        "location" => $row["location"],
        "details" => $row["details"],
        "map" => $row["map_query"],
        "image" => $row["image_path"]
    ];
}

// GET ALL PLACES
if ($method === "GET") {

    $sql = "SELECT * FROM places ORDER BY created_at DESC";
    $result = $conn->query($sql);

    if (!$result) {
        respond(500, ["message" => "Unable to retrieve places."]);
    }

    $places = [];

    while ($row = $result->fetch_assoc()) {
        $places[] = formatPlace($row);
    }

    respond(200, $places);
}

// ADD OR UPDATE PLACE
if ($method === "POST") {

    $id = isset($_POST["id"]) ? (int) $_POST["id"] : 0;

    $name = trim($_POST["name"] ?? "");
    $category = trim($_POST["category"] ?? "");
    $location = trim($_POST["location"] ?? "");
    $details = trim($_POST["details"] ?? "");
    $map = trim($_POST["map"] ?? "");

    // VALIDATE REQUIRED FIELDS
    if (
        $name === "" ||
        $category === "" ||
        $location === "" ||
        $details === "" ||
        $map === ""
    ) {
        respond(400, ["message" => "Please complete all required fields."]);
    }

    // VALIDATE CATEGORY
    $allowedCategories = [
        "historical",
        "museum",
        "church",
        "park",
        "food"
    ];

    if (!in_array($category, $allowedCategories, true)) {
        respond(400, ["message" => "Invalid category."]);
    }

    // CHECK IF RECORD EXISTS WHEN UPDATING
    $existingImage = null;

    if ($id > 0) {

        $check = $conn->prepare(
            "SELECT image_path FROM places WHERE id = ?"
        );

        $check->bind_param("i", $id);
        $check->execute();

        $existing = $check->get_result()->fetch_assoc();
        $check->close();

        if (!$existing) {
            respond(404, ["message" => "Place not found."]);
        }

        $existingImage = $existing["image_path"];
    }

    // KEEP OLD IMAGE IF NO NEW IMAGE IS UPLOADED
    $imagePath = $existingImage;

    // PROCESS IMAGE UPLOAD
    if (isset($_FILES["image"]) && $_FILES["image"]["error"] !== UPLOAD_ERR_NO_FILE) {

        if ($_FILES["image"]["error"] !== UPLOAD_ERR_OK) {
            respond(400, ["message" => "Image upload failed."]);
        }

        // MAXIMUM IMAGE SIZE: 5 MB
        if ($_FILES["image"]["size"] > 5 * 1024 * 1024) {
            respond(400, ["message" => "Image must not exceed 5 MB."]);
        }

        // CHECK ACTUAL IMAGE TYPE
        $fileInfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $fileInfo->file($_FILES["image"]["tmp_name"]);

        $allowedTypes = [
            "image/jpeg" => "jpg",
            "image/png" => "png",
            "image/webp" => "webp"
        ];

        if (!isset($allowedTypes[$mimeType])) {
            respond(400, ["message" => "Only JPG, PNG, and WEBP images are allowed."]);
        }

        // CREATE UNIQUE FILE NAME
        $fileName = bin2hex(random_bytes(16)) . "." . $allowedTypes[$mimeType];

        $destination = $uploadDirectory . $fileName;

        if (!move_uploaded_file($_FILES["image"]["tmp_name"], $destination)) {
            respond(500, ["message" => "Unable to save uploaded image."]);
        }

        $imagePath = "backend/uploads/" . $fileName;
    }

    // INSERT NEW PLACE
    if ($id === 0) {

        $sql = "INSERT INTO places
                (name, category, location, details, map_query, image_path)
                VALUES (?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "ssssss",
            $name,
            $category,
            $location,
            $details,
            $map,
            $imagePath
        );

        if (!$stmt->execute()) {
            respond(500, ["message" => "Unable to add place."]);
        }

        $newId = $conn->insert_id;
        $stmt->close();

        respond(201, [
            "message" => "Place added successfully.",
            "id" => $newId
        ]);
    }

    // UPDATE EXISTING PLACE
    $sql = "UPDATE places
            SET name = ?,
                category = ?,
                location = ?,
                details = ?,
                map_query = ?,
                image_path = ?
            WHERE id = ?";

    $stmt = $conn->prepare($sql);

    $stmt->bind_param(
        "ssssssi",
        $name,
        $category,
        $location,
        $details,
        $map,
        $imagePath,
        $id
    );

    if (!$stmt->execute()) {
        respond(500, ["message" => "Unable to update place."]);
    }

    $stmt->close();

    // REMOVE OLD IMAGE AFTER SUCCESSFUL REPLACEMENT
    if (
        $imagePath !== $existingImage &&
        $existingImage &&
        strpos($existingImage, "backend/uploads/") === 0
    ) {
        $oldFile = dirname(__DIR__) . "/" . $existingImage;

        if (is_file($oldFile)) {
            unlink($oldFile);
        }
    }

    respond(200, ["message" => "Place updated successfully."]);
}

// DELETE PLACE
if ($method === "DELETE") {

    $input = json_decode(file_get_contents("php://input"), true);

    $id = isset($input["id"]) ? (int) $input["id"] : 0;

    if ($id <= 0) {
        respond(400, ["message" => "Invalid place ID."]);
    }

    // GET IMAGE PATH BEFORE DELETING
    $check = $conn->prepare(
        "SELECT image_path FROM places WHERE id = ?"
    );

    $check->bind_param("i", $id);
    $check->execute();

    $place = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$place) {
        respond(404, ["message" => "Place not found."]);
    }

    // DELETE DATABASE RECORD
    $stmt = $conn->prepare("DELETE FROM places WHERE id = ?");
    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        respond(500, ["message" => "Unable to delete place."]);
    }

    $stmt->close();

    // DELETE UPLOADED IMAGE
    $image = $place["image_path"];

    if (
        $image &&
        strpos($image, "backend/uploads/") === 0
    ) {
        $imageFile = dirname(__DIR__) . "/" . $image;

        if (is_file($imageFile)) {
            unlink($imageFile);
        }
    }

    respond(200, ["message" => "Place deleted successfully."]);
}

// INVALID REQUEST
respond(405, ["message" => "Method not allowed."]);

?>
