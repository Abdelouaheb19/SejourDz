<?php
/**
 * =========================================================================
 * SÉJOURS DZ - API REST PHP POUR L'ESPACE AGENT (CRUD DES LOGEMENTS ET EXPÉRIENCES)
 * =========================================================================
 * Cette API permet aux agents de gérer de bout en bout l'inventaire des séjours 
 * (séjours, prix, images, inclusions, exclusions, programme journalier) et les 
 * dossiers d'inscription (réservations) depuis un tableau de bord.
 *
 * Utilisation :
 *  Toutes les requêtes retournent du JSON. Envoyez une requête :
 *   - GET  /api.php?action=get_packages
 *   - GET  /api.php?action=get_package&id=TURKEY-01
 *   - POST /api.php?action=add_package      (Données JSON en corps de requête ou POST standard)
 *   - POST /api.php?action=update_package   (Données JSON en corps de requête ou POST standard)
 *   - POST /api.php?action=delete_package   (Passer l'id du package en POST)
 *   - GET  /api.php?action=get_bookings
 *   - POST /api.php?action=update_booking   (Modifier statut, montant de l'acompte, etc.)
 *   - POST /api.php?action=delete_booking   (Passer l'id en POST)
 */

// --- AUTORISER L'ACCÈS CORS DEPUIS VOTRE DASHBOARD / APPLICATION ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Gestion des requêtes de prévalidation OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- CONFIGURATION DE LA RELATION DE BASE ---
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'sejoursdz_db');

// --- INITIALISATION DE LA CONNEXION PDO ---
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    sendResponse(500, false, "Erreur critique de connexion serveur : " . $e->getMessage());
}

// Récupération de l'action requise
$action = isset($_GET['action']) ? $_GET['action'] : '';

if (empty($action)) {
    sendResponse(400, false, "Action non spécifiée. Veuillez appeler l'API avec le paramètre ?action=votre_action");
}

// Lecture des données JSON entrantes brutes (pratique pour les frameworks modernes JS ou l'envoi de requêtes brutes)
$raw_input = file_get_contents('php://input');
$json_data = json_decode($raw_input, true) ?: [];

// Fusionner les données reçues en JSON avec le tableau global $_POST pour simplifier l'accès
$request_data = array_merge($_POST, $json_data);

// --- ROUTAGE DES ACTIONS ---
switch ($action) {
    
    // ==========================================
    // ACTIONS SUR LES PACKAGES (OFFRES DE VOYAGE)
    // ==========================================

    case 'get_packages':
        try {
            $stmt = $pdo->query("SELECT * FROM `packages` ORDER BY `created_at` DESC");
            $packages = $stmt->fetchAll();
            
            // Décoder les champs stockés en JSON texte pour renvoyer des structures propres au format JSON
            foreach ($packages as &$pkg) {
                $pkg['durationDays'] = (int)$pkg['durationDays'];
                $pkg['price'] = (float)$pkg['price'];
                $pkg['promoPrice'] = isset($pkg['promoPrice']) ? (float)$pkg['promoPrice'] : null;
                $pkg['spotsAvailable'] = (int)$pkg['spotsAvailable'];
                $pkg['spotsMax'] = (int)$pkg['spotsMax'];
                $pkg['rating'] = (float)$pkg['rating'];
                $pkg['inclusions'] = json_decode($pkg['inclusions'], true) ?: [];
                $pkg['exclusions'] = json_decode($pkg['exclusions'], true) ?: [];
                $pkg['schedule'] = json_decode($pkg['schedule'], true) ?: [];
            }
            
            sendResponse(200, true, "Liste des offres récupérée avec succès.", $packages);
        } catch (Exception $e) {
            sendResponse(500, false, "Impossible de récupérer les packages: " . $e->getMessage());
        }
        break;

    case 'get_package':
        $id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($id)) {
            sendResponse(400, false, "L'id du séjour est requis.");
        }
        
        try {
            $stmt = $pdo->prepare("SELECT * FROM `packages` WHERE `id` = ?");
            $stmt->execute([$id]);
            $pkg = $stmt->fetch();
            
            if (!$pkg) {
                sendResponse(404, false, "Aucun séjour trouvé avec l'id : " . $id);
            }
            
            // Décoder les champs stockés en JSON
            $pkg['durationDays'] = (int)$pkg['durationDays'];
            $pkg['price'] = (float)$pkg['price'];
            $pkg['promoPrice'] = isset($pkg['promoPrice']) ? (float)$pkg['promoPrice'] : null;
            $pkg['spotsAvailable'] = (int)$pkg['spotsAvailable'];
            $pkg['spotsMax'] = (int)$pkg['spotsMax'];
            $pkg['rating'] = (float)$pkg['rating'];
            $pkg['inclusions'] = json_decode($pkg['inclusions'], true) ?: [];
            $pkg['exclusions'] = json_decode($pkg['exclusions'], true) ?: [];
            $pkg['schedule'] = json_decode($pkg['schedule'], true) ?: [];
            
            sendResponse(200, true, "Détails du séjour chargés.", $pkg);
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur lors du chargement des détails : " . $e->getMessage());
        }
        break;

    case 'add_package':
        // Validation des données requises
        requireFields($request_data, ['id', 'title', 'description', 'destination', 'durationDays', 'price', 'image', 'spotsMax', 'startDate', 'endDate', 'category']);
        
        try {
            // Forcer spotsAvailable à la valeur initiale de spotsMax
            $spotsAvailable = isset($request_data['spotsAvailable']) ? (int)$request_data['spotsAvailable'] : (int)$request_data['spotsMax'];

            $stmt = $pdo->prepare("
                INSERT INTO `packages` 
                (`id`, `title`, `description`, `destination`, `durationDays`, `price`, `promoPrice`, `image`, `spotsAvailable`, `spotsMax`, `startDate`, `endDate`, `inclusions`, `exclusions`, `schedule`, `status`, `rating`, `category`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $request_data['id'],
                $request_data['title'],
                $request_data['description'],
                $request_data['destination'],
                (int)$request_data['durationDays'],
                (float)$request_data['price'],
                !empty($request_data['promoPrice']) ? (float)$request_data['promoPrice'] : null,
                $request_data['image'],
                $spotsAvailable,
                (int)$request_data['spotsMax'],
                $request_data['startDate'],
                $request_data['endDate'],
                formatJsonField($request_data['inclusions'] ?? []),
                formatJsonField($request_data['exclusions'] ?? []),
                formatJsonField($request_data['schedule'] ?? []),
                $request_data['status'] ?? 'active',
                (float)($request_data['rating'] ?? 4.5),
                $request_data['category']
            ]);
            
            sendResponse(201, true, "Nouveau séjour enregistré avec succès !", ["id" => $request_data['id']]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                sendResponse(409, false, "Un séjour ou pack avec l'ID '" . $request_data['id'] . "' existe déjà. Utilisez un identifiant unique.");
            }
            sendResponse(500, false, "Erreur d'insertion du package: " . $e->getMessage());
        }
        break;

    case 'update_package':
        requireFields($request_data, ['id', 'title', 'description', 'destination', 'durationDays', 'price', 'image', 'spotsMax', 'startDate', 'endDate', 'category']);
        
        try {
            // S'assurer de la présence du package original
            $stmt_check = $pdo->prepare("SELECT `spotsAvailable`, `spotsMax` FROM `packages` WHERE `id` = ?");
            $stmt_check->execute([$request_data['id']]);
            $existing = $stmt_check->fetch();
            
            if (!$existing) {
                sendResponse(404, false, "Impossible de modifier : séjour introuvable.");
            }

            // Calcul du nouveau stock de places disponibles au cas où le stock maximal ait changé
            $spotsMaxNew = (int)$request_data['spotsMax'];
            $spotsMaxDiff = $spotsMaxNew - (int)$existing['spotsMax'];
            $spotsAvailableNew = max(0, (int)$existing['spotsAvailable'] + $spotsMaxDiff);
            
            if (isset($request_data['spotsAvailable'])) {
                $spotsAvailableNew = (int)$request_data['spotsAvailable'];
            }

            $stmt = $pdo->prepare("
                UPDATE `packages` 
                SET `title` = ?, `description` = ?, `destination` = ?, `durationDays` = ?, 
                    `price` = ?, `promoPrice` = ?, `image` = ?, `spotsAvailable` = ?, 
                    `spotsMax` = ?, `startDate` = ?, `endDate` = ?, `inclusions` = ?, 
                    `exclusions` = ?, `schedule` = ?, `status` = ?, `rating` = ?, `category` = ?
                WHERE `id` = ?
            ");
            
            $stmt->execute([
                $request_data['title'],
                $request_data['description'],
                $request_data['destination'],
                (int)$request_data['durationDays'],
                (float)$request_data['price'],
                !empty($request_data['promoPrice']) ? (float)$request_data['promoPrice'] : null,
                $request_data['image'],
                $spotsAvailableNew,
                $spotsMaxNew,
                $request_data['startDate'],
                $request_data['endDate'],
                formatJsonField($request_data['inclusions'] ?? []),
                formatJsonField($request_data['exclusions'] ?? []),
                formatJsonField($request_data['schedule'] ?? []),
                $request_data['status'] ?? 'active',
                (float)($request_data['rating'] ?? 4.5),
                $request_data['category'],
                $request_data['id']
            ]);
            
            sendResponse(200, true, "Le séjour '" . $request_data['title'] . "' a été modifié avec succès !");
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur de mise à jour du séjour : " . $e->getMessage());
        }
        break;

    case 'delete_package':
        $id = isset($request_data['id']) ? $request_data['id'] : '';
        if (empty($id)) {
            sendResponse(400, false, "L'id du séjour à supprimer est requis.");
        }
        
        try {
            $stmt_find = $pdo->prepare("SELECT `title` FROM `packages` WHERE `id` = ?");
            $stmt_find->execute([$id]);
            $found = $stmt_find->fetch();
            
            if (!$found) {
                sendResponse(404, false, "Séjour introuvable.");
            }

            $stmt = $pdo->prepare("DELETE FROM `packages` WHERE `id` = ?");
            $stmt->execute([$id]);
            
            sendResponse(200, true, "Le séjour '" . $found['title'] . "' a été retiré de la base de données avec succès.");
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur lors du retrait du package: " . $e->getMessage());
        }
        break;


    // ==========================================
    // ACTIONS SUR LES RESERVATIONS (BOOKINGS)
    // ==========================================

    case 'get_bookings':
        try {
            $stmt = $pdo->query("SELECT * FROM `bookings` ORDER BY `dateBooked` DESC");
            $bookings = $stmt->fetchAll();
            
            // Formater les éléments stockés en JSON à l'envoi
            foreach ($bookings as &$book) {
                $book['packagePrice'] = (float)$book['packagePrice'];
                $book['totalAmount'] = (float)$book['totalAmount'];
                $book['paymentAmount'] = (float)$book['paymentAmount'];
                $book['passengers'] = json_decode($book['passengers'], true) ?: [];
            }
            
            sendResponse(200, true, "Liste des réservations chargée pour l'agent.", $bookings);
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur de récupération des fiches : " . $e->getMessage());
        }
        break;

    case 'update_booking':
        requireFields($request_data, ['id']);
        
        try {
            // S'assurer de l'existence de la fiche
            $stmt_check = $pdo->prepare("SELECT * FROM `bookings` WHERE `id` = ?");
            $stmt_check->execute([$request_data['id']]);
            $existing = $stmt_check->fetch();
            
            if (!$existing) {
                sendResponse(404, false, "Réservation introuvable pour mise à jour.");
            }

            // Préparation dynamique des champs à modifier (uniquement ceux passés dans l'appel)
            $update_fields = [];
            $params = [];

            // Liste des modifications éligibles par l'agent
            $allowed_updates = [
                'status' => PDO::PARAM_STR,
                'paymentStatus' => PDO::PARAM_STR,
                'paymentMethod' => PDO::PARAM_STR,
                'paymentAmount' => PDO::PARAM_STR, // Traité en float/decimal
                'specialRequests' => PDO::PARAM_STR,
                'aiCustomization' => PDO::PARAM_STR
            ];

            foreach ($allowed_updates as $field => $type) {
                if (isset($request_data[$field])) {
                    $update_fields[] = "`$field` = ?";
                    $params[] = $request_data[$field];
                }
            }

            if (empty($update_fields)) {
                sendResponse(400, false, "Aucune donnée de mise à jour valide n'a été transmise.");
            }

            // CléID en dernier paramètre pour la clause WHERE
            $params[] = $request_data['id'];
            
            $sql = "UPDATE `bookings` SET " . implode(", ", $update_fields) . " WHERE `id` = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            sendResponse(200, true, "La fiche de réservation a été ajustée avec succès par l'agent.");
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur lors de la mise à jour de la réservation : " . $e->getMessage());
        }
        break;

    case 'delete_booking':
        $id = isset($request_data['id']) ? $request_data['id'] : '';
        if (empty($id)) {
            sendResponse(400, false, "L'id de la réservation à éliminer est requis.");
        }
        
        try {
            $stmt_find = $pdo->prepare("SELECT `clientName`, `packageTitle` FROM `bookings` WHERE `id` = ?");
            $stmt_find->execute([$id]);
            $found = $stmt_find->fetch();
            
            if (!$found) {
                sendResponse(404, false, "Fiche de réservation introuvable.");
            }

            $stmt = $pdo->prepare("DELETE FROM `bookings` WHERE `id` = ?");
            $stmt->execute([$id]);
            
            sendResponse(200, true, "La réservation de '" . $found['clientName'] . "' pour le voyage '" . $found['packageTitle'] . "' a été définitivement supprimée.");
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur lors de l'effacement de la réservation: " . $e->getMessage());
        }
        break;

    case 'add_booking':
        requireFields($request_data, ['packageId', 'clientName', 'clientEmail', 'clientPhone', 'passengers', 'totalAmount']);
        try {
            $bookingId = isset($request_data['id']) && !empty($request_data['id']) ? $request_data['id'] : ('book-' . substr(time(), -6));
            
            // Check if client exists, else create
            $stmt_cli = $pdo->prepare("SELECT `id` FROM `clients` WHERE LOWER(`email`) = LOWER(?)");
            $stmt_cli->execute([$request_data['clientEmail']]);
            $client = $stmt_cli->fetch();
            $clientId = $client ? $client['id'] : null;

            if (!$clientId) {
                $clientId = 'user-' . time();
                $stmt_add_cli = $pdo->prepare("
                    INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `status`, `city`)
                    VALUES (?, ?, ?, ?, 'leads', 'Alger')
                ");
                $stmt_add_cli->execute([$clientId, $request_data['clientName'], $request_data['clientEmail'], $request_data['clientPhone']]);
            }

            // Get package details to update available spots and copy title/image/price
            $stmt_pkg = $pdo->prepare("SELECT * FROM `packages` WHERE `id` = ?");
            $stmt_pkg->execute([$request_data['packageId']]);
            $pkg = $stmt_pkg->fetch();
            if (!$pkg) {
                sendResponse(404, false, "Package introuvable.");
            }

            $passengersDecoded = is_string($request_data['passengers']) ? json_decode($request_data['passengers'], true) : $request_data['passengers'];
            $travelerCount = count($passengersDecoded ?: []);
            if ($travelerCount === 0) {
                $travelerCount = 1;
            }

            if ($pkg['spotsAvailable'] < $travelerCount) {
                sendResponse(400, false, "Désolé, il ne reste que " . $pkg['spotsAvailable'] . " places.");
            }

            $stmt = $pdo->prepare("
                INSERT INTO `bookings` 
                (`id`, `packageId`, `clientId`, `packageTitle`, `packageImage`, `packagePrice`, `clientName`, `clientEmail`, `clientPhone`, `passengers`, `totalAmount`, `status`, `paymentStatus`, `paymentMethod`, `paymentAmount`, `dateBooked`, `specialRequests`, `aiCustomization`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $bookingId,
                $request_data['packageId'],
                $clientId,
                $pkg['title'],
                $pkg['image'],
                (float)($pkg['promoPrice'] ?? $pkg['price']),
                $request_data['clientName'],
                $request_data['clientEmail'],
                $request_data['clientPhone'],
                formatJsonField($request_data['passengers']),
                (float)$request_data['totalAmount'],
                $request_data['status'] ?? 'En attente',
                $request_data['paymentStatus'] ?? 'Non payé',
                $request_data['paymentMethod'] ?? 'Non spécifié',
                (float)($request_data['paymentAmount'] ?? 0.00),
                date('Y-m-d H:i:s'),
                $request_data['specialRequests'] ?? '',
                $request_data['aiCustomization'] ?? ''
            ]);

            // Decrement spotsAvailable
            $stmt_dec = $pdo->prepare("UPDATE `packages` SET `spotsAvailable` = `spotsAvailable` - ? WHERE `id` = ?");
            $stmt_dec->execute([$travelerCount, $request_data['packageId']]);

            // Simulate sending WhatsApp and email to client
            error_log("[NOTIFICATION AGENT - PHP] Envoi d'un email de confirmation simulé à " . $request_data['clientEmail']);
            error_log("[NOTIFICATION AGENT - PHP] Envoi d'un message WhatsApp simulé à " . $request_data['clientPhone']);

            sendResponse(201, true, "Réservation créée avec succès !", ["id" => $bookingId]);
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur lors de la création de la réservation : " . $e->getMessage());
        }
        break;


    // ==========================================
    // ACTIONS SUR LES CLIENTS (CLIENTS)
    // ==========================================

    case 'get_clients':
        try {
            $stmt = $pdo->query("SELECT * FROM `clients` ORDER BY `created_at` DESC");
            $clients = $stmt->fetchAll();
            sendResponse(200, true, "Liste des clients récupérée avec succès.", $clients);
        } catch (Exception $e) {
            sendResponse(500, false, "Impossible de récupérer les clients: " . $e->getMessage());
        }
        break;

    case 'get_client':
        $id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($id)) {
            sendResponse(400, false, "L'id du client est requis.");
        }
        try {
            $stmt = $pdo->prepare("SELECT * FROM `clients` WHERE `id` = ?");
            $stmt->execute([$id]);
            $client = $stmt->fetch();
            if (!$client) {
                sendResponse(404, false, "Client introuvable.");
            }
            sendResponse(200, true, "Détails du client chargés.", $client);
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur de chargement du client: " . $e->getMessage());
        }
        break;

    case 'add_client':
        requireFields($request_data, ['id', 'name', 'email', 'phone']);
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `address`, `city`, `password_hash`, `status`, `notes`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $request_data['id'],
                $request_data['name'],
                $request_data['email'],
                $request_data['phone'],
                $request_data['address'] ?? null,
                $request_data['city'] ?? 'Alger',
                password_hash($request_data['password'] ?? 'sejoursdz123', PASSWORD_BCRYPT),
                $request_data['status'] ?? 'active',
                $request_data['notes'] ?? null
            ]);
            sendResponse(201, true, "Nouveau client enregistré avec succès !", ["id" => $request_data['id']]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                sendResponse(409, false, "L'adresse email '" . $request_data['email'] . "' ou l'identifiant '" . $request_data['id'] . "' est déjà utilisé.");
            }
            sendResponse(500, false, "Erreur d'insertion du client: " . $e->getMessage());
        }
        break;

    case 'login_client':
        requireFields($request_data, ['email', 'password']);
        try {
            $stmt = $pdo->prepare("SELECT * FROM `clients` WHERE LOWER(`email`) = LOWER(?)");
            $stmt->execute([$request_data['email']]);
            $client = $stmt->fetch();
            if (!$client) {
                sendResponse(401, false, "Adresse email ou mot de passe incorrect.");
            }
            if (password_verify($request_data['password'], $client['password_hash']) || $client['password_hash'] === md5($request_data['password']) || !$client['password_hash']) {
                // Return client details without password hash
                unset($client['password_hash']);
                sendResponse(200, true, "Connexion réussie !", $client);
            } else {
                sendResponse(401, false, "Adresse email ou mot de passe incorrect.");
            }
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur d'authentification: " . $e->getMessage());
        }
        break;

    case 'update_client':
        requireFields($request_data, ['id', 'name', 'email', 'phone']);
        try {
            $stmt = $pdo->prepare("
                UPDATE `clients` 
                SET `name` = ?, `email` = ?, `phone` = ?, `address` = ?, `city` = ?, `status` = ?, `notes` = ?
                WHERE `id` = ?
            ");
            $stmt->execute([
                $request_data['name'],
                $request_data['email'],
                $request_data['phone'],
                $request_data['address'] ?? null,
                $request_data['city'] ?? 'Alger',
                $request_data['status'] ?? 'active',
                $request_data['notes'] ?? null,
                $request_data['id']
            ]);
            sendResponse(200, true, "Profil du client mis à jour avec succès !");
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur lors de la mise à jour du client: " . $e->getMessage());
        }
        break;

    case 'delete_client':
        $id = isset($request_data['id']) ? $request_data['id'] : '';
        if (empty($id)) {
            sendResponse(400, false, "L'id du client à supprimer est requis.");
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM `clients` WHERE `id` = ?");
            $stmt->execute([$id]);
            sendResponse(200, true, "Fiche client supprimée définitivement.");
        } catch (Exception $e) {
            sendResponse(500, false, "Erreur lors de la suppression du client: " . $e->getMessage());
        }
        break;

    default:
        sendResponse(404, false, "L'action '" . $action . "' demandée est inconnue dans le registre de cette API.");
        break;
}

// --- FONCTIONS ET UTILITAIRES CLIENT / SERVEUR ---

/**
 * Envoie une réponse JSON standardisée avec le code HTTP d'état adéquat.
 */
function sendResponse($http_code, $success, $message, $data = null) {
    http_response_code($http_code);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data"    => $data,
        "timestamp" => date('c')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Valide la présence d'un ensemble de champs essentiels dans le jeu de paramètres transmis.
 */
function requireFields($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
            $missing[] = $field;
        }
    }
    if (!empty($missing)) {
        sendResponse(400, false, "Champs requis manquants ou vides: " . implode(", ", $missing));
    }
}

/**
 * S'assure que le contenu complexe (inclusions, exclusions, programme journalier) est au format JSON chaîne propre.
 */
function formatJsonField($field_value) {
    if (is_array($field_value)) {
        return json_encode($field_value, JSON_UNESCAPED_UNICODE);
    }
    if (is_string($field_value)) {
        // Valider si le contenu est déjà du JSON textuel
        json_decode($field_value);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $field_value;
        }
        // Sinon, le traiter en chaîne simple encapsulée
        return json_encode([$field_value], JSON_UNESCAPED_UNICODE);
    }
    return json_encode([], JSON_UNESCAPED_UNICODE);
}
?>
