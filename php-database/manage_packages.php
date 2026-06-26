<?php
/**
 * =========================================================================
 * SÉJOURS DZ - INTERFACE D'ADMINISTRATION PHP (CRUD COMPLET DES OFFRES DE VOYAGE)
 * =========================================================================
 * Ce fichier fournit une interface d'administration Web magnifique et autonome
 * permettant de Lister, d'Ajouter, de Modifier et de Supprimer les séjours de la base.
 *
 * Utilisation :
 *  - Placez ce fichier sur votre serveur d'hébergement PHP.
 *  - Exécutez l'initialisation de la base de données via : db_populate.php
 *  - Accédez au tableau de bord via : http://localhost/php-database/manage_packages.php
 */

header('Content-Type: text/html; charset=utf-8');

// --- 1. CONFIGURATION DE LA BASE DE DONNÉES ---
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'sejoursdz_db');

// --- 2. INITIALISATION DE LA CONNEXION PDO ---
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    die("
    <div style='font-family: sans-serif; padding: 40px; text-align: center; background: #fff5f5; color: #c53030; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;'>
        <h2 style='margin-bottom: 10px;'>Connexion impossible au serveur de base de données</h2>
        <p style='max-width: 600px; line-height: 1.6; color: #742a2a; font-size: 14px;'>
            Le script n'a pas pu se connecter à MySQL. Assurez-vous d'avoir exécuté <code>db_populate.php</code> pour créer la base <strong>" . DB_NAME . "</strong> et que vos identifiants à la ligne 15-18 de ce fichier sont corrects.
        </p>
        <p style='font-size: 11px; font-family: monospace; background: #fff; padding: 8px 12px; border: 1px solid #feb2b2; border-radius: 6px; margin-top: 15px;'>" . $e->getMessage() . "</p>
    </div>
    ");
}

$alert_message = "";
$alert_type = ""; // "success" ou "error"

// --- 3. TRAITEMENT DE LA SUPPRESSION ---
if (isset($_GET['delete_id'])) {
    $del_id = $_GET['delete_id'];
    try {
        $stmt_find = $pdo->prepare("SELECT `title` FROM `packages` WHERE `id` = ?");
        $stmt_find->execute([$del_id]);
        $pkg_title = $stmt_find->fetchColumn();

        if ($pkg_title) {
            $stmt = $pdo->prepare("DELETE FROM `packages` WHERE `id` = ?");
            $stmt->execute([$del_id]);
            $alert_type = "success";
            $alert_message = "Le séjour <strong>\"" . htmlspecialchars($pkg_title) . "\"</strong> a été supprimé avec succès.";
        } else {
            $alert_type = "error";
            $alert_message = "Offre de voyage introuvable ou déjà supprimée.";
        }
    } catch (Exception $e) {
        $alert_type = "error";
        $alert_message = "Erreur de suppression : " . $e->getMessage();
    }
}

// --- 4. TRAITEMENT DU FORMULAIRE (AJOUT / MODIFICATION) ---
$form_id = "";
$form_title = "";
$form_description = "";
$form_destination = "";
$form_durationDays = 5;
$form_price = "";
$form_promoPrice = "";
$form_image = "";
$form_spotsMax = 30;
$form_spotsAvailable = 30;
$form_startDate = "";
$form_endDate = "";
$form_category = "Sahara";
$form_status = "active";
$form_rating = 4.5;
$form_inclusions = "";
$form_exclusions = "";
$form_schedule = "";
$is_edit_mode = false;

if (isset($_POST['save_package'])) {
    $form_id = trim($_POST['id']);
    $form_title = trim($_POST['title']);
    $form_description = trim($_POST['description']);
    $form_destination = trim($_POST['destination']);
    $form_durationDays = (int)$_POST['durationDays'];
    $form_price = (float)$_POST['price'];
    $form_promoPrice = !empty($_POST['promoPrice']) ? (float)$_POST['promoPrice'] : null;
    $form_image = trim($_POST['image']);
    $form_spotsMax = (int)$_POST['spotsMax'];
    $form_spotsAvailable = isset($_POST['spotsAvailable']) ? (int)$_POST['spotsAvailable'] : $form_spotsMax;
    $form_startDate = $_POST['startDate'];
    $form_endDate = $_POST['endDate'];
    $form_category = $_POST['category'];
    $form_status = $_POST['status'] ?? 'active';
    $form_rating = (float)($_POST['rating'] ?? 4.5);
    
    // Traitement des listes d'inclusions/exclusions entrées séparées par des retours à la ligne
    $inclusions_arr = array_filter(array_map('trim', explode("\n", $_POST['inclusions'])));
    $exclusions_arr = array_filter(array_map('trim', explode("\n", $_POST['exclusions'])));
    
    // Traitement du programme (schedule) au format simplifié : ligne "Jour X: Titre | Description" ou JSON
    $schedule_raw = trim($_POST['schedule']);
    $schedule_arr = [];
    if (!empty($schedule_raw)) {
        // Tenter de décoder comme JSON au cas où
        $decoded = json_decode($schedule_raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $schedule_arr = $decoded;
        } else {
            // Parser le format texte par ligne
            $lines = explode("\n", $schedule_raw);
            $day_count = 1;
            foreach ($lines as $line) {
                if (empty(trim($line))) continue;
                $parts = explode("|", $line, 2);
                if (count($parts) === 2) {
                    $schedule_arr[] = [
                        "day" => $day_count,
                        "title" => trim($parts[0]),
                        "description" => trim($parts[1])
                    ];
                } else {
                    $schedule_arr[] = [
                        "day" => $day_count,
                        "title" => "Étape Jour " . $day_count,
                        "description" => trim($line)
                    ];
                }
                $day_count++;
            }
        }
    }

    $inclusions_json = json_encode(array_values($inclusions_arr), JSON_UNESCAPED_UNICODE);
    $exclusions_json = json_encode(array_values($exclusions_arr), JSON_UNESCAPED_UNICODE);
    $schedule_json = json_encode($schedule_arr, JSON_UNESCAPED_UNICODE);

    $action_mode = $_POST['action_mode']; // "add" ou "edit"

    try {
        if ($action_mode === "add") {
            // S'assurer de l'unicité de l'ID
            $stmt_check = $pdo->prepare("SELECT COUNT(*) FROM `packages` WHERE `id` = ?");
            $stmt_check->execute([$form_id]);
            if ($stmt_check->fetchColumn() > 0) {
                throw new Exception("L'identifiant unique (ID) '" . htmlspecialchars($form_id) . "' est déjà associé à un autre voyage.");
            }

            $stmt = $pdo->prepare("
                INSERT INTO `packages` 
                (`id`, `title`, `description`, `destination`, `durationDays`, `price`, `promoPrice`, `image`, `spotsAvailable`, `spotsMax`, `startDate`, `endDate`, `inclusions`, `exclusions`, `schedule`, `status`, `rating`, `category`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $form_id, $form_title, $form_description, $form_destination, $form_durationDays,
                $form_price, $form_promoPrice, $form_image, $form_spotsMax, $form_spotsMax,
                $form_startDate, $form_endDate, $inclusions_json, $exclusions_json, $schedule_json,
                $form_status, $form_rating, $form_category
            ]);

            $alert_type = "success";
            $alert_message = "L'offre d'escapade <strong>\"" . htmlspecialchars($form_title) . "\"</strong> a été ajoutée avec succès !";
            
            // Réinitialiser le formulaire
            $form_id = $form_title = $form_description = $form_destination = $form_image = $form_inclusions = $form_exclusions = $form_schedule = "";
            $form_price = $form_promoPrice = "";
        } else {
            // Mode modification
            $stmt_old = $pdo->prepare("SELECT `spotsAvailable`, `spotsMax` FROM `packages` WHERE `id` = ?");
            $stmt_old->execute([$form_id]);
            $old_spots = $stmt_old->fetch();
            
            if ($old_spots) {
                // Ajuster dynamiquement les places disponibles si les places max changent
                $spots_diff = $form_spotsMax - (int)$old_spots['spotsMax'];
                $form_spotsAvailable = max(0, (int)$old_spots['spotsAvailable'] + $spots_diff);
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
                $form_title, $form_description, $form_destination, $form_durationDays,
                $form_price, $form_promoPrice, $form_image, $form_spotsAvailable, $form_spotsMax,
                $form_startDate, $form_endDate, $inclusions_json, $exclusions_json, $schedule_json,
                $form_status, $form_rating, $form_category, $form_id
            ]);

            $alert_type = "success";
            $alert_message = "Les détails du séjour <strong>\"" . htmlspecialchars($form_title) . "\"</strong> ont été mis à jour.";
        }
    } catch (Exception $e) {
        $alert_type = "error";
        $alert_message = "Erreur d'enregistrement : " . $e->getMessage();
        $is_edit_mode = ($action_mode === "edit");
    }
}

// --- 5. RENSEIGNER LES CHAMPS DANS LE FORMULAIRE SI MODE ÉDITION ACTIF  ---
if (isset($_GET['edit_id']) && !isset($_POST['save_package'])) {
    $edit_id = $_GET['edit_id'];
    try {
        $stmt_edit = $pdo->prepare("SELECT * FROM `packages` WHERE `id` = ?");
        $stmt_edit->execute([$edit_id]);
        $edit_pkg = $stmt_edit->fetch();

        if ($edit_pkg) {
            $is_edit_mode = true;
            $form_id = $edit_pkg['id'];
            $form_title = $edit_pkg['title'];
            $form_description = $edit_pkg['description'];
            $form_destination = $edit_pkg['destination'];
            $form_durationDays = (int)$edit_pkg['durationDays'];
            $form_price = (float)$edit_pkg['price'];
            $form_promoPrice = $edit_pkg['promoPrice'] !== null ? (float)$edit_pkg['promoPrice'] : "";
            $form_image = $edit_pkg['image'];
            $form_spotsMax = (int)$edit_pkg['spotsMax'];
            $form_spotsAvailable = (int)$edit_pkg['spotsAvailable'];
            $form_startDate = $edit_pkg['startDate'];
            $form_endDate = $edit_pkg['endDate'];
            $form_category = $edit_pkg['category'];
            $form_status = $edit_pkg['status'];
            $form_rating = (float)$edit_pkg['rating'];

            // Formater inclusions de JSON à texte (un item par ligne)
            $incl_arr = json_decode($edit_pkg['inclusions'], true) ?: [];
            $form_inclusions = implode("\n", $incl_arr);

            // Formater exclusions de JSON à texte
            $excl_arr = json_decode($edit_pkg['exclusions'], true) ?: [];
            $form_exclusions = implode("\n", $excl_arr);

            // Formater le programme journalier de JSON à format d'écriture simplifié
            $sched_arr = json_decode($edit_pkg['schedule'], true) ?: [];
            $sched_lines = [];
            foreach ($sched_arr as $day) {
                $sched_lines[] = ($day['title'] ?? '') . " | " . ($day['description'] ?? '');
            }
            $form_schedule = implode("\n", $sched_lines);
        }
    } catch (Exception $e) {
        $alert_type = "error";
        $alert_message = "Erreur de chargement de l'édition : " . $e->getMessage();
    }
}

// --- 6. CHARGEMENT DE LA LISTE GLOBALE ---
$all_packages = [];
try {
    $stmt_list = $pdo->query("SELECT * FROM `packages` ORDER BY `created_at` DESC");
    $all_packages = $stmt_list->fetchAll();
} catch (Exception $e) {
    // Échec silencieux car déjà géré
}
?>
<!DOCTYPE html>
<html lang="fr text-left">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Séjours DZ - Gestion des Offres de Voyage (CRUD)</title>
    <!-- Tailwind CSS pour un rendu exceptionnel sans fichiers additionnels -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <!-- Fontes d'élégance -->
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet font-sans">
    
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f8fafc;
        }
        h1, h2, h3, .heading-serif {
            font-family: 'Playfair Display', serif;
        }
    </style>
</head>
<body class="min-h-screen text-slate-800 pb-16">

    <!-- Header bar -->
    <header class="bg-[#1e293b] text-white shadow-md sticky top-0 z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-[#ff5a00] flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-md">
                    SDZ
                </div>
                <div>
                    <h1 class="text-xl font-extrabold tracking-tight">SÉJOURS DZ</h1>
                    <p class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Tableau de bord - Agence Officielle</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <a href="index.php" class="text-xs font-bold text-slate-300 hover:text-white transition-colors">
                    Retour au site principal
                </a>
                <span class="h-4 w-px bg-slate-700"></span>
                <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Serveur Actif
                </span>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        <!-- Welcome banner -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="space-y-2 text-center md:text-left">
                <span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs uppercase tracking-widest rounded-full leading-none">
                    Espace d'administration B2C
                </span>
                <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    Gestion des Offres de Vacances
                </h2>
                <p class="text-slate-500 text-xs sm:text-sm max-w-xl">
                    Ajoutez de nouvelles destinations d'évasion, ajustez les prix ou gérez les places d'un clic. Toute modification est immédiatement synchronisée.
                </p>
            </div>
            
            <a href="#editor-section" class="px-5 py-3 bg-[#ff5a00] hover:bg-[#e04f00] text-xs font-bold text-white rounded-xl transition-all shadow-md shrink-0">
                + Créer un séjour touristique
            </a>
        </div>

        <!-- Alert messages display -->
        <?php if (!empty($alert_message)): ?>
            <div class="mb-8 p-4 rounded-2xl border <?php echo $alert_type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'; ?> flex items-start gap-3">
                <div class="p-1 rounded-lg <?php echo $alert_type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'; ?> font-bold text-xs select-none">
                    <?php echo $alert_type === 'success' ? '✓' : '✕'; ?>
                </div>
                <div class="text-xs md:text-sm">
                    <?php echo $alert_message; ?>
                </div>
            </div>
        <?php endif; ?>

        <!-- Two section layout: Edit & List -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- LEFT MODULE: List of travel packages (7/12 cols) -->
            <div class="lg:col-span-7 space-y-6">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-black text-slate-900 flex items-center gap-2">
                        <span>📦</span> Voyages Enregistrés (<?php echo count($all_packages); ?>)
                    </h3>
                    <span class="text-xs font-semibold text-slate-400">Trier par date de création</span>
                </div>

                <?php if (empty($all_packages)): ?>
                    <div class="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                        <span class="block text-4xl">🏝️</span>
                        <h4 class="font-bold text-slate-800">Aucun package actuellement disponible</h4>
                        <p class="text-xs text-slate-500 max-w-sm mx-auto">
                            Remplissez le formulaire d'édition à droite pour concevoir et publier votre première escapade.
                        </p>
                    </div>
                <?php else: ?>
                    <div class="grid grid-cols-1 gap-5">
                        <?php foreach ($all_packages as $pkg): 
                            $is_promo = ($pkg['promoPrice'] !== null && $pkg['promoPrice'] < $pkg['price']); 
                            $inclusions = json_decode($pkg['inclusions'], true) ?: [];
                        ?>
                            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                                
                                <!-- Cover Image Area -->
                                <div class="sm:w-44 h-40 sm:h-auto relative shrink-0">
                                    <img src="<?php echo htmlspecialchars($pkg['image']); ?>" alt="Cover" class="w-full h-full object-cover">
                                    <span class="absolute top-2 left-2 rounded-lg bg-white/95 backdrop-blur-xs text-[10px] font-bold text-slate-900 px-2.5 py-1 shadow-xs uppercase tracking-wide">
                                        <?php echo htmlspecialchars($pkg['category']); ?>
                                    </span>
                                    
                                    <?php if ($pkg['status'] === "inactive"): ?>
                                        <div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                                            <span class="px-2.5 py-1 bg-red-600 text-white rounded text-[10px] uppercase font-bold tracking-wider">
                                                Inactif
                                            </span>
                                        </div>
                                    <?php endif; ?>
                                </div>

                                <!-- Description Area -->
                                <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
                                    <div class="space-y-1.5">
                                        <div class="flex items-start justify-between gap-2">
                                            <h4 class="font-serif text-sm font-bold text-slate-900 leading-snug">
                                                <?php echo htmlspecialchars($pkg['title']); ?>
                                            </h4>
                                            <span class="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                                <?php echo htmlspecialchars($pkg['id']); ?>
                                            </span>
                                        </div>
                                        <p class="text-xs text-slate-500 font-semibold flex items-center gap-1">
                                            📍 <?php echo htmlspecialchars($pkg['destination']); ?> • 📅 <?php echo $pkg['durationDays']; ?> jours
                                        </p>
                                        <p class="text-[11px] text-slate-400 line-clamp-2">
                                            <?php echo htmlspecialchars($pkg['description']); ?>
                                        </p>
                                    </div>

                                    <!-- Price & Spot stats -->
                                    <div class="flex items-center justify-between gap-3 pt-3 border-t border-slate-50">
                                        <div class="space-y-0.5">
                                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Tarif</p>
                                            <div class="flex items-center gap-1.5">
                                                <?php if ($is_promo): ?>
                                                    <span class="text-xs text-slate-400 line-through">
                                                        <?php echo number_format($pkg['price'], 0, ',', ' '); ?> DA
                                                    </span>
                                                    <span class="text-base font-black text-[#ff5a00]">
                                                        <?php echo number_format($pkg['promoPrice'], 0, ',', ' '); ?> DA
                                                    </span>
                                                <?php else: ?>
                                                    <span class="text-base font-black text-slate-900">
                                                        <?php echo number_format($pkg['price'], 0, ',', ' '); ?> DA
                                                    </span>
                                                <?php endif; ?>
                                            </div>
                                        </div>

                                        <div class="text-right space-y-0.5 text-xs">
                                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Places dispos</p>
                                            <span class="font-bold text-slate-800">
                                                <?php echo $pkg['spotsAvailable']; ?> / <?php echo $pkg['spotsMax']; ?> places
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Quick Actions toolbar -->
                                    <div class="flex items-center justify-end gap-3 pt-2">
                                        <a href="manage_packages.php?edit_id=<?php echo urlencode($pkg['id']); ?>#editor-section" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors">
                                            ✏️ Modifier
                                        </a>
                                        <a href="manage_packages.php?delete_id=<?php echo urlencode($pkg['id']); ?>" 
                                           onclick="return confirm('Êtes-vous certain de vouloir supprimer l\'offre &quot;<?php echo addslashes($pkg['title']); ?>&quot; définitivement ? Cette action est irréversible.');" 
                                           class="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition-colors">
                                            🗑️ Supprimer
                                        </a>
                                    </div>

                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- RIGHT MODULE: Package form Editor (5/12 cols) -->
            <div id="editor-section" class="lg:col-span-5">
                <div class="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
                    <div>
                        <span class="text-[10px] font-extrabold text-[#ff5a00] uppercase tracking-wider">
                            Éditeur Évasion
                        </span>
                        <h3 class="text-xl font-black text-slate-900 tracking-tight mt-1">
                            <?php echo $is_edit_mode ? '📝 Modifier le Séjour' : '🚀 Nouveau Séjour'; ?>
                        </h3>
                        <p class="text-xs text-slate-500 mt-1">
                            <?php echo $is_edit_mode ? 'Ajustez les détails du package sélectionné.' : 'Enregistrez une nouvelle offre pour la rendre immédiatement achetable.'; ?>
                        </p>
                    </div>

                    <form method="POST" action="manage_packages.php" class="space-y-4">
                        <input type="hidden" name="action_mode" value="<?php echo $is_edit_mode ? 'edit' : 'add'; ?>">
                        
                        <!-- ID Unique -->
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Identifiant Unique (ID) *
                            </label>
                            <input 
                                type="text" 
                                name="id" 
                                value="<?php echo htmlspecialchars($form_id); ?>" 
                                placeholder="Ex: SAHARA-05 ou ORAN-EXP" 
                                required 
                                <?php echo $is_edit_mode ? 'readonly class="w-full text-xs font-semibold p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 select-none cursor-not-allowed"' : 'class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-950 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"'; ?>
                            >
                            <p class="text-[9px] text-slate-400 mt-1 select-none">
                                Un code alphanumérique unique pour différencier l'offre (Ex: ALGIERS-BEACH-2026).
                            </p>
                        </div>

                        <!-- Titre de l'évasion -->
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Titre de l'offre *
                            </label>
                            <input 
                                type="text" 
                                name="title" 
                                value="<?php echo htmlspecialchars($form_title); ?>" 
                                placeholder="Ex: Grand Raid dans le Tassili N'Ajjer" 
                                required 
                                class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                            >
                        </div>

                        <!-- Destination & Catégorie -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Catégorie *
                                </label>
                                <select 
                                    name="category" 
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                                    <option value="Sahara" <?php echo $form_category === "Sahara" ? "selected" : ""; ?>>🐫 Sahara</option>
                                    <option value="National" <?php echo $form_category === "National" ? "selected" : ""; ?>>🌊 National</option>
                                    <option value="International" <?php echo $form_category === "International" ? "selected" : ""; ?>>✈️ International</option>
                                    <option value="Omra" <?php echo $form_category === "Omra" ? "selected" : ""; ?>>🕋 Omra</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Destination *
                                </label>
                                <input 
                                    type="text" 
                                    name="destination" 
                                    value="<?php echo htmlspecialchars($form_destination); ?>" 
                                    placeholder="Ex: Djanet, Turquie..." 
                                    required 
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                            </div>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Description Générale *
                            </label>
                            <textarea 
                                name="description" 
                                rows="3" 
                                required 
                                placeholder="Décrivez l'expérience, les paysages, le niveau d'aventure..."
                                class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00] leading-relaxed"
                            ><?php echo htmlspecialchars($form_description); ?></textarea>
                        </div>

                        <!-- Dates: Début & Fin -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Date de Début *
                                </label>
                                <input 
                                    type="date" 
                                    name="startDate" 
                                    value="<?php echo htmlspecialchars($form_startDate); ?>" 
                                    required 
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Date de Fin *
                                </label>
                                <input 
                                    type="date" 
                                    name="endDate" 
                                    value="<?php echo htmlspecialchars($form_endDate); ?>" 
                                    required 
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                            </div>
                        </div>

                        <!-- Tarifs & Durée -->
                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-sans">
                                    Délai (Jours) *
                                </label>
                                <input 
                                    type="number" 
                                    name="durationDays" 
                                    value="<?php echo $form_durationDays; ?>" 
                                    required 
                                    min="1" 
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Tarif (DA) *
                                </label>
                                <input 
                                    type="number" 
                                    name="price" 
                                    value="<?php echo $form_price; ?>" 
                                    required 
                                    min="0" 
                                    placeholder="Ex: 89000"
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Promo (DA)
                                </label>
                                <input 
                                    type="number" 
                                    name="promoPrice" 
                                    value="<?php echo $form_promoPrice; ?>" 
                                    min="0" 
                                    placeholder="Optionnel"
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                            </div>
                        </div>

                        <!-- Image de couverture & Places disponibles -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Capacité Max (Places) *
                                </label>
                                <input 
                                    type="number" 
                                    name="spotsMax" 
                                    value="<?php echo $form_spotsMax; ?>" 
                                    required 
                                    min="1" 
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Statut *
                                </label>
                                <select 
                                    name="status" 
                                    class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                                >
                                    <option value="active" <?php echo $form_status === "active" ? "selected" : ""; ?>>Actif (Visible)</option>
                                    <option value="inactive" <?php echo $form_status === "inactive" ? "selected" : ""; ?>>Inactif (Archivé)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Image URL -->
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                URL de l'image de couverture *
                            </label>
                            <input 
                                type="url" 
                                name="image" 
                                value="<?php echo htmlspecialchars($form_image); ?>" 
                                required 
                                placeholder="Ex: https://images.unsplash.com/photo-..." 
                                class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00]"
                            >
                        </div>

                        <!-- Inclusions -->
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Inclusions (Un élément par ligne) *
                            </label>
                            <textarea 
                                name="inclusions" 
                                rows="3" 
                                required
                                placeholder="Billet d'avion inclus&#10;Hébergement en demi-pension&#10;Guide touristique accompagnateur" 
                                class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00] leading-relaxed"
                            ><?php echo htmlspecialchars($form_inclusions); ?></textarea>
                        </div>

                        <!-- Exclusions -->
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                Exclusions (Un élément par ligne) *
                            </label>
                            <textarea 
                                name="exclusions" 
                                rows="3" 
                                required
                                placeholder="Équipements de randonnée personnels&#10;Assurance voyage optionnelle&#10;Dépenses d'ordre privé" 
                                class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00] leading-relaxed"
                            ><?php echo htmlspecialchars($form_exclusions); ?></textarea>
                        </div>

                        <!-- Programme Journalier (Événements) -->
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-normal">
                                Programme au Jour le Jour * (Format: <code>Titre | Description</code>)
                            </label>
                            <textarea 
                                name="schedule" 
                                rows="4" 
                                required
                                placeholder="Arrivée & Installation | Vol vers Alger puis transfert vers l'hôtel.&#10;Découverte de la Casbah | Visite guidée des palais ottomans et déjeuner local.&#10;Retour & Départ | Temps libre pour le shopping puis transfert aéroport." 
                                class="w-full text-xs font-semibold p-3 bg-white rounded-xl border border-slate-200 text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-[#ff5a00] leading-relaxed"
                            ><?php echo htmlspecialchars($form_schedule); ?></textarea>
                            <p class="text-[9px] text-slate-400 mt-1">
                                Spécifiez une étape par ligne en utilisant le séparateur barre verticale <code>|</code> pour scinder le titre de la description de l'étape. Le chiffre des jours s'incrémente automatiquement.
                            </p>
                        </div>

                        <!-- Actions Buttons -->
                        <div class="flex items-center gap-3 pt-3">
                            <?php if ($is_edit_mode): ?>
                                <a href="manage_packages.php" class="w-1/3 text-center py-3 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl transition-colors">
                                    Annuler
                                </a>
                            <?php endif; ?>
                            <button 
                                type="submit" 
                                name="save_package" 
                                class="flex-1 py-3 bg-[#ff5a00] hover:bg-[#e04f00] text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer"
                            >
                                <?php echo $is_edit_mode ? 'Sauvegarder les modifications' : 'Créer et publier le forfait'; ?>
                            </button>
                        </div>

                    </form>
                </div>
            </div>

        </div>

    </div>

    <!-- Sticky footer -->
    <footer class="w-full text-center py-6 text-[10px] font-bold text-slate-400 border-t border-slate-200 bg-white mt-20">
        Séjours DZ - Agence Officielle Agréée • Conception et Synchronisation Database © 2026
    </footer>

</body>
</html>
