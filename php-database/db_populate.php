<?php
/**
 * =========================================================================
 * SÉJOURS DZ - SCRIPT D'INITIALISATION ET DE REMPLISSAGE DE LA BASE DE DONNÉES
 * =========================================================================
 * Ce script permet de :
 *  1. Se connecter à votre serveur MySQL/MariaDB (PDO)
 *  2. Créer automatiquement la base de données et les tables nécessaires (packages, clients, bookings)
 *  3. Lire le fichier local de données "db.json"
 *  4. Extraire et normaliser les données pour peupler :
 *     - Les Offres de voyage (packages)
 *     - Les Clients (clients) - Créés dynamiquement à partir des emails uniques des réservations
 *     - Les Réservations (bookings) - Liées aux clients par clé étrangère
 *  5. Fournir un tableau de bord récapitulatif élégant avec les statistiques de l'import.
 *
 * Mode d'emploi :
 *  - Modifiez les constantes de connexion ci-dessous si nécessaire.
 *  - Placez ce dossier sur votre serveur Web PHP.
 *  - Exécutez ce fichier via votre navigateur (ex: http://localhost/php-database/db_populate.php)
 *    ou via le terminal (ex: php db_populate.php)
 */

header('Content-Type: text/html; charset=utf-8');

// --- 1. CONFIGURATION DE LA BASE DE DONNÉES ---
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'sejoursdz_db'); // Le script va tenter de la créer s'il a les droits adéquats

// Variables de statut pour le rapport de sortie
$steps_log = [];
$db_connected = false;
$packages_count = 0;
$clients_count = 0;
$bookings_count = 0;
$execution_error = "";

try {
    // --- 2. CONNEXION INITIALE À MYSQL (SANS PRÉ-SÉLECTIONNER LA BD POUR POUVOIR LA CRÉER) ---
    $dsn_init = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn_init, DB_USER, DB_PASS, $options);
    $steps_log[] = ["title" => "Connexion au serveur MySQL", "status" => "success", "desc" => "Connecté avec succès à " . DB_HOST];
    
    // --- 3. CRÉATION AUTOMATIQUE DE LA BASE DE DONNÉES ---
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $steps_log[] = ["title" => "Création de la base de données", "status" => "success", "desc" => "La base de données '" . DB_NAME . "' est prête."];

    // Connexion à la base de données spécifique désormais
    $pdo->exec("USE `" . DB_NAME . "`");
    $db_connected = true;

    // --- 4. CRÉATION DES TABLES ---
    
    // Table packages (Offres de voyage)
    $create_packages_sql = "
    CREATE TABLE IF NOT EXISTS `packages` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT NOT NULL,
        `destination` VARCHAR(255) NOT NULL,
        `durationDays` INT NOT NULL,
        `price` DECIMAL(12,2) NOT NULL,
        `promoPrice` DECIMAL(12,2) NULL,
        `image` VARCHAR(512) NOT NULL,
        `spotsAvailable` INT NOT NULL,
        `spotsMax` INT NOT NULL,
        `startDate` DATE NOT NULL,
        `endDate` DATE NOT NULL,
        `inclusions` TEXT NOT NULL,
        `exclusions` TEXT NOT NULL,
        `schedule` TEXT NOT NULL,
        `status` VARCHAR(20) DEFAULT 'active',
        `rating` DECIMAL(3,2) DEFAULT 4.5,
        `category` VARCHAR(50) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_category` (`category`),
        INDEX `idx_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($create_packages_sql);
    $steps_log[] = ["title" => "Structure 'packages'", "status" => "success", "desc" => "La table des offres de voyage a été créée ou validée."];

    // Table clients
    $create_clients_sql = "
    CREATE TABLE IF NOT EXISTS `clients` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(150) NOT NULL UNIQUE,
        `phone` VARCHAR(50) NOT NULL,
        `address` VARCHAR(255) NULL,
        `city` VARCHAR(100) DEFAULT 'Alger',
        `password_hash` VARCHAR(255) NULL,
        `status` VARCHAR(20) DEFAULT 'active',
        `notes` TEXT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_client_email` (`email`),
        INDEX `idx_client_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($create_clients_sql);
    $steps_log[] = ["title" => "Structure 'clients'", "status" => "success", "desc" => "La table des clients de l'agence a été créée ou validée."];

    // Table bookings (Réservations)
    $create_bookings_sql = "
    CREATE TABLE IF NOT EXISTS `bookings` (
        `id` VARCHAR(50) NOT NULL PRIMARY KEY,
        `packageId` VARCHAR(50) NOT NULL,
        `clientId` VARCHAR(50) NULL,
        `packageTitle` VARCHAR(255) NOT NULL,
        `packageImage` VARCHAR(512) NOT NULL,
        `packagePrice` DECIMAL(12,2) NOT NULL,
        `clientName` VARCHAR(100) NOT NULL,
        `clientEmail` VARCHAR(150) NOT NULL,
        `clientPhone` VARCHAR(50) NOT NULL,
        `passengers` TEXT NOT NULL,
        `totalAmount` DECIMAL(12,2) NOT NULL,
        `status` VARCHAR(50) DEFAULT 'En attente',
        `paymentStatus` VARCHAR(50) DEFAULT 'Non payé',
        `paymentMethod` VARCHAR(100) NOT NULL,
        `paymentAmount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        `dateBooked` DATETIME NOT NULL,
        `specialRequests` TEXT NULL,
        `aiCustomization` TEXT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`packageId`) REFERENCES `packages`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
        INDEX `idx_booking_status` (`status`),
        INDEX `idx_booking_payment` (`paymentStatus`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    $pdo->exec($create_bookings_sql);
    $steps_log[] = ["title" => "Structure 'bookings'", "status" => "success", "desc" => "La table des réservations liée aux clients a été créée ou validée."];

    // --- 5. LECTURE DES DONNÉES DEPUIS LE FICHIER JSON ---
    $json_paths = [
        __DIR__ . '/../src/data/db.json',
        __DIR__ . '/../data/db.json',
        __DIR__ . '/data/db.json',
        __DIR__ . '/db.json',
        dirname(__DIR__) . '/data/db.json'
    ];
    
    $json_content = false;
    $found_path = "";
    foreach ($json_paths as $path) {
        if (file_exists($path)) {
            $json_content = file_get_contents($path);
            $found_path = $path;
            break;
        }
    }

    if ($json_content === false) {
        throw new Exception("Impossible de localiser le fichier de données 'db.json' aux emplacements standards.");
    }

    $data = json_decode($json_content, true);
    if ($data === null) {
        throw new Exception("Erreur de décodage JSON. Le fichier 'db.json' est mal formaté.");
    }

    $steps_log[] = ["title" => "Fichier de données JSON trouvé", "status" => "success", "desc" => "Fichier localisé sur : " . basename($found_path)];

    // --- 6. IMPORTATION DE DONNÉES EN TRANSACTION ---
    $pdo->beginTransaction();

    // A. Insertion/Remplacement des packages (Offres de voyage)
    if (isset($data['packages']) && is_array($data['packages'])) {
        $stmt_pkg = $pdo->prepare("
            INSERT INTO `packages` 
            (`id`, `title`, `description`, `destination`, `durationDays`, `price`, `promoPrice`, `image`, `spotsAvailable`, `spotsMax`, `startDate`, `endDate`, `inclusions`, `exclusions`, `schedule`, `status`, `rating`, `category`) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            `title` = VALUES(`title`), `description` = VALUES(`description`), `destination` = VALUES(`destination`), 
            `durationDays` = VALUES(`durationDays`), `price` = VALUES(`price`), `promoPrice` = VALUES(`promoPrice`), 
            `image` = VALUES(`image`), `spotsAvailable` = VALUES(`spotsAvailable`), `spotsMax` = VALUES(`spotsMax`), 
            `startDate` = VALUES(`startDate`), `endDate` = VALUES(`endDate`), `inclusions` = VALUES(`inclusions`), 
            `exclusions` = VALUES(`exclusions`), `schedule` = VALUES(`schedule`), `status` = VALUES(`status`), 
            `rating` = VALUES(`rating`), `category` = VALUES(`category`)
        ");

        foreach ($data['packages'] as $pkg) {
            $stmt_pkg->execute([
                $pkg['id'],
                $pkg['title'],
                $pkg['description'],
                $pkg['destination'],
                $pkg['durationDays'],
                $pkg['price'],
                isset($pkg['promoPrice']) ? $pkg['promoPrice'] : null,
                $pkg['image'],
                $pkg['spotsAvailable'],
                $pkg['spotsMax'],
                $pkg['startDate'],
                $pkg['endDate'],
                json_encode($pkg['inclusions'], JSON_UNESCAPED_UNICODE),
                json_encode($pkg['exclusions'], JSON_UNESCAPED_UNICODE),
                json_encode($pkg['schedule'], JSON_UNESCAPED_UNICODE),
                isset($pkg['status']) ? $pkg['status'] : 'active',
                isset($pkg['rating']) ? $pkg['rating'] : 4.5,
                $pkg['category']
            ]);
            $packages_count++;
        }
    }

    // B. Extraction et Insertion des Clients uniques à partir des Réservations
    $clients_map = []; // Pour garder l'ID généré pour chaque email client
    $demo_clients = [
        [
            "id" => "CLI-DEMO-01",
            "name" => "Karim Benali",
            "email" => "karim.benali@gmail.com",
            "phone" => "+213 (0) 555 12 34 56",
            "address" => "08, Boulevard Didouche Mourad",
            "city" => "Alger",
            "notes" => "Client VIP intéressé par les circuits Sahara."
        ],
        [
            "id" => "CLI-DEMO-02",
            "name" => "Amel Mansouri",
            "email" => "amel.mansouri@outlook.com",
            "phone" => "+213 (0) 661 88 99 00",
            "address" => "12, Rue Larbi Ben M'hidi",
            "city" => "Oran",
            "notes" => "Préfère les séjours balnéaires."
        ]
    ];

    // Insérer les clients démo prédéfinis d'abord
    $stmt_cli = $pdo->prepare("
        INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `address`, `city`, `password_hash`, `status`, `notes`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        `name` = VALUES(`name`), `phone` = VALUES(`phone`), `address` = VALUES(`address`), `city` = VALUES(`city`), `notes` = VALUES(`notes`)
    ");

    foreach ($demo_clients as $dc) {
        $stmt_cli->execute([
            $dc['id'],
            $dc['name'],
            $dc['email'],
            $dc['phone'],
            $dc['address'],
            $dc['city'],
            password_hash('sejoursdz123', PASSWORD_BCRYPT), // mot de passe par défaut
            'active',
            $dc['notes']
        ]);
        $clients_map[$dc['email']] = $dc['id'];
        $clients_count++;
    }

    // Parcourir les réservations dans le JSON pour extraire de nouveaux clients uniques
    if (isset($data['bookings']) && is_array($data['bookings'])) {
        $client_index = 3; // On commence après les clients démo
        foreach ($data['bookings'] as $book) {
            $email = trim(strtolower($book['clientEmail']));
            if (!isset($clients_map[$email])) {
                $clientId = sprintf("CLI-%05d", $client_index++);
                $clientName = $book['clientName'];
                $clientPhone = $book['clientPhone'] ?? '+213 (0) 550 00 00 00';
                
                // Insérer le client extrait dans la table clients
                $stmt_cli->execute([
                    $clientId,
                    $clientName,
                    $email,
                    $clientPhone,
                    "Adresse client extraite",
                    "Alger",
                    password_hash('sejoursdz123', PASSWORD_BCRYPT),
                    'active',
                    "Créé automatiquement depuis l'historique de réservation."
                ]);
                
                $clients_map[$email] = $clientId;
                $clients_count++;
            }
        }
    }

    // C. Insertion/Remplacement des Réservations liées aux Clients
    if (isset($data['bookings']) && is_array($data['bookings'])) {
        $stmt_book = $pdo->prepare("
            INSERT INTO `bookings` 
            (`id`, `packageId`, `clientId`, `packageTitle`, `packageImage`, `packagePrice`, `clientName`, `clientEmail`, `clientPhone`, `passengers`, `totalAmount`, `status`, `paymentStatus`, `paymentMethod`, `paymentAmount`, `dateBooked`, `specialRequests`, `aiCustomization`) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            `packageId` = VALUES(`packageId`), `clientId` = VALUES(`clientId`), `packageTitle` = VALUES(`packageTitle`), `packageImage` = VALUES(`packageImage`), 
            `packagePrice` = VALUES(`packagePrice`), `clientName` = VALUES(`clientName`), `clientEmail` = VALUES(`clientEmail`), 
            `clientPhone` = VALUES(`clientPhone`), `passengers` = VALUES(`passengers`), `totalAmount` = VALUES(`totalAmount`), 
            `status` = VALUES(`status`), `paymentStatus` = VALUES(`paymentStatus`), `paymentMethod` = VALUES(`paymentMethod`), 
            `paymentAmount` = VALUES(`paymentAmount`), `dateBooked` = VALUES(`dateBooked`), `specialRequests` = VALUES(`specialRequests`), 
            `aiCustomization` = VALUES(`aiCustomization`)
        ");

        foreach ($data['bookings'] as $book) {
            $email = trim(strtolower($book['clientEmail']));
            $clientId = isset($clients_map[$email]) ? $clients_map[$email] : null;
            $formatted_date = date('Y-m-d H:i:s', strtotime($book['dateBooked']));
            
            $stmt_book->execute([
                $book['id'],
                $book['packageId'],
                $clientId,
                $book['packageTitle'],
                $book['packageImage'] ?? '',
                $book['packagePrice'] ?? $book['totalAmount'],
                $book['clientName'],
                $book['clientEmail'],
                $book['clientPhone'],
                json_encode($book['passengers'], JSON_UNESCAPED_UNICODE),
                $book['totalAmount'],
                isset($book['status']) ? $book['status'] : 'En attente',
                isset($book['paymentStatus']) ? $book['paymentStatus'] : 'Non payé',
                $book['paymentMethod'] ?? 'Non spécifié',
                $book['paymentAmount'] ?? 0.00,
                $formatted_date,
                $book['specialRequests'] ?? null,
                $book['aiCustomization'] ?? null
            ]);
            $bookings_count++;
        }
    }

    $pdo->commit();
    $steps_log[] = [
        "title" => "Remplissage réussi de la base de données", 
        "status" => "success", 
        "desc" => "Base relationnelle finalisée. Importation de " . $packages_count . " offres (packages), " . $clients_count . " clients uniques, et " . $bookings_count . " réservations."
    ];

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $execution_error = $e->getMessage();
    $steps_log[] = ["title" => "Erreur critique d'exécution", "status" => "error", "desc" => $e->getMessage()];
}

// Format d'affichage pour la ligne de commande (CLI)
if (php_sapi_name() === 'cli') {
    echo "=== SÉJOURS DZ - AUTO-REMPLISSEUR DATABASE (PHP) ===\n";
    foreach ($steps_log as $log) {
        $indicator = $log['status'] === 'success' ? '[ OK ]' : '[ ERR]';
        echo $indicator . " " . $log['title'] . " : " . $log['desc'] . "\n";
    }
    if ($execution_error) {
        echo "ÉCHEC : " . $execution_error . "\n";
        exit(1);
    }
    echo "SUCCÈS : Données importées avec succès !\n";
    exit(0);
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Séjours DZ - Auto-Remplisseur MySQL (Clients, Offres, Réservations)</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f8fafc;
        }
        h1, h2, .brand-font {
            font-family: 'Playfair Display', serif;
        }
    </style>
</head>
<body class="min-h-screen text-slate-800 flex flex-col justify-between">
    
    <div class="container mx-auto px-4 py-12 max-w-3xl flex-1 flex flex-col justify-center">
        <!-- Header -->
        <div class="text-center mb-8">
            <span class="inline-block px-3 py-1 bg-green-100 text-[#2e7d32] font-bold text-xs uppercase tracking-widest rounded-full mb-3 shadow-sm">
                INITIALISATION & RELATIONS CLIENTS
            </span>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Séjours DZ Database Populate
            </h1>
            <p class="text-slate-500 text-xs mt-2 max-w-xl mx-auto">
                Script d'alimentation de base de données relationnelle MySQL pour l'agence. Organise proprement les offres, fiches clients et réservations.
            </p>
        </div>

        <!-- System Summary -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
            
            <div class="flex items-center justify-between pb-4 border-b border-slate-100">
                <span class="text-sm font-semibold text-slate-600">Statut du Service :</span>
                <?php if ($execution_error): ?>
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold leading-none animate-pulse">
                        ● ÉCHEC D'IMPORTATION
                    </span>
                <?php else: ?>
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold leading-none">
                        ● POPULATION COMPLÈTE & OK
                    </span>
                <?php endif; ?>
            </div>

            <!-- Steps -->
            <div class="space-y-3">
                <h3 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-1">Historique des étapes de l'import :</h3>
                <div class="space-y-2">
                    <?php foreach ($steps_log as $log): ?>
                        <div class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                            <?php if ($log['status'] === "success"): ?>
                                <div class="p-1 bg-green-100 text-green-700 font-extrabold rounded-lg text-xs shrink-0 select-none">
                                    ✓
                                </div>
                            <?php else: ?>
                                <div class="p-1 bg-red-100 text-red-700 font-extrabold rounded-lg text-xs shrink-0 select-none">
                                    ✕
                                </div>
                            <?php endif; ?>
                            
                            <div class="space-y-0.5">
                                <h4 class="text-xs font-bold text-slate-900 leading-tight"><?php echo htmlspecialchars($log['title']); ?></h4>
                                <p class="text-[11px] text-slate-500 font-medium leading-relaxed"><?php echo htmlspecialchars($log['desc']); ?></p>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Stats -->
            <?php if (!$execution_error): ?>
                <div class="grid grid-cols-3 gap-3 pt-2">
                    <div class="bg-gradient-to-br from-green-50 to-transparent border border-green-100 rounded-2xl p-4 text-center">
                        <span class="block text-[9px] font-bold text-green-700 uppercase tracking-wider mb-1">Offres (Voyages)</span>
                        <span class="text-2xl font-black text-slate-800 leading-none"><?php echo $packages_count; ?></span>
                    </div>
                    <div class="bg-gradient-to-br from-[#ff5a00]/5 to-transparent border border-[#ff5a00]/10 rounded-2xl p-4 text-center">
                        <span class="block text-[9px] font-bold text-[#ff5a00] uppercase tracking-wider mb-1">Clients Uniques</span>
                        <span class="text-2xl font-black text-slate-800 leading-none"><?php echo $clients_count; ?></span>
                    </div>
                    <div class="bg-gradient-to-br from-blue-50 to-transparent border border-blue-100 rounded-2xl p-4 text-center">
                        <span class="block text-[9px] font-bold text-[#0071eb] uppercase tracking-wider mb-1">Réservations</span>
                        <span class="text-2xl font-black text-slate-800 leading-none"><?php echo $bookings_count; ?></span>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Error report -->
            <?php if ($execution_error): ?>
                <div class="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
                    <span class="text-xs font-bold text-red-700">Erreur relevée :</span>
                    <p class="text-[11px] font-mono text-red-600 bg-white p-3 rounded-lg border border-red-100 max-h-40 overflow-y-auto">
                        <?php echo htmlspecialchars($execution_error); ?>
                    </p>
                </div>
            <?php endif; ?>

        </div>

        <!-- Config help -->
        <div class="mt-6 bg-slate-100 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2">
            <h4 class="font-bold text-slate-800">
                ⚙️ Raccordement MySQL (db_populate.php)
            </h4>
            <p>
                Pour connecter ce script d'alimentation automatique à votre propre base, modifiez les identifiants en haut du fichier <code>db_populate.php</code> :
            </p>
            <pre class="bg-slate-800 text-slate-200 text-[10px] p-3 rounded-lg font-mono overflow-x-auto">
define('DB_HOST', '<?php echo DB_HOST; ?>');
define('DB_USER', '<?php echo DB_USER; ?>');
define('DB_PASS', '<?php echo str_repeat('*', strlen(DB_PASS)); ?>');
define('DB_NAME', '<?php echo DB_NAME; ?>');</pre>
        </div>

    </div>

    <footer class="w-full text-center py-6 text-[10px] font-bold text-slate-400 border-t border-slate-200 bg-white mt-12">
        Séjours DZ - Agence Officielle Agréée • Conception et Synchronisation Database © 2026
    </footer>

</body>
</html>
