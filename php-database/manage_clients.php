<?php
/**
 * =========================================================================
 * SÉJOURS DZ - ESPACE AGENT : GESTION DES CLIENTS & DES RÉSERVATIONS
 * =========================================================================
 * Ce fichier fournit une interface autonome magnifique pour Lister, Ajouter,
 * Modifier et Supprimer les fiches clients et les dossiers de réservations.
 *
 * Utilisation :
 *  - Placez ce fichier sur votre serveur d'hébergement PHP.
 *  - Accédez au tableau de bord via : http://localhost/php-database/manage_clients.php
 */

header('Content-Type: text/html; charset=utf-8');

// --- 1. CONFIGURATION DE LA BASE DE DONNÉES ---
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'sejoursdz_db');

// --- 2. CONNEXION PDO ---
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
        <h2 style='margin-bottom: 10px;'>Connexion impossible à la base de données</h2>
        <p style='max-width: 600px; line-height: 1.6; color: #742a2a; font-size: 14px;'>
            Assurez-vous d'avoir exécuté <code>db_populate.php</code> pour créer la base <strong>" . DB_NAME . "</strong> et les tables de l'agence.
        </p>
        <p style='font-size: 11px; font-family: monospace; background: #fff; padding: 8px 12px; border: 1px solid #feb2b2; border-radius: 6px; margin-top: 15px;'>" . $e->getMessage() . "</p>
    </div>
    ");
}

$alert_message = "";
$alert_type = ""; // "success" ou "error"

// --- 3. TRAITEMENT DE LA SUPPRESSION CLIENT ---
if (isset($_GET['delete_client_id'])) {
    $del_id = $_GET['delete_client_id'];
    try {
        $stmt_find = $pdo->prepare("SELECT `name` FROM `clients` WHERE `id` = ?");
        $stmt_find->execute([$del_id]);
        $client_name = $stmt_find->fetchColumn();

        if ($client_name) {
            $stmt = $pdo->prepare("DELETE FROM `clients` WHERE `id` = ?");
            $stmt->execute([$del_id]);
            $alert_type = "success";
            $alert_message = "La fiche client de <strong>\"" . htmlspecialchars($client_name) . "\"</strong> a été supprimée avec succès.";
        }
    } catch (Exception $e) {
        $alert_type = "error";
        $alert_message = "Erreur de suppression du client : " . $e->getMessage();
    }
}

// --- 4. TRAITEMENT DE LA SUPPRESSION RÉSERVATION ---
if (isset($_GET['delete_booking_id'])) {
    $del_id = $_GET['delete_booking_id'];
    try {
        $stmt_find = $pdo->prepare("SELECT `clientName`, `packageTitle` FROM `bookings` WHERE `id` = ?");
        $stmt_find->execute([$del_id]);
        $booking = $stmt_find->fetch();

        if ($booking) {
            $stmt = $pdo->prepare("DELETE FROM `bookings` WHERE `id` = ?");
            $stmt->execute([$del_id]);
            $alert_type = "success";
            $alert_message = "La réservation de <strong>\"" . htmlspecialchars($booking['clientName']) . "\"</strong> pour <strong>\"" . htmlspecialchars($booking['packageTitle']) . "\"</strong> a été annulée et supprimée.";
        }
    } catch (Exception $e) {
        $alert_type = "error";
        $alert_message = "Erreur de suppression de la réservation : " . $e->getMessage();
    }
}

// --- 5. TRAITEMENT DE LA MISE À JOUR DE RÉSERVATION (STATUTS) ---
if (isset($_POST['update_booking_status'])) {
    $booking_id = $_POST['booking_id'];
    $status = $_POST['status'];
    $paymentStatus = $_POST['paymentStatus'];
    $paymentAmount = (float)$_POST['paymentAmount'];

    try {
        $stmt = $pdo->prepare("
            UPDATE `bookings` 
            SET `status` = ?, `paymentStatus` = ?, `paymentAmount` = ?
            WHERE `id` = ?
        ");
        $stmt->execute([$status, $paymentStatus, $paymentAmount, $booking_id]);
        $alert_type = "success";
        $alert_message = "Le dossier de réservation <strong>#" . htmlspecialchars($booking_id) . "</strong> a été mis à jour.";
    } catch (Exception $e) {
        $alert_type = "error";
        $alert_message = "Erreur lors de la modification : " . $e->getMessage();
    }
}

// --- 6. TRAITEMENT DU FORMULAIRE CLIENT (AJOUT / EDITION) ---
$form_id = "";
$form_name = "";
$form_email = "";
$form_phone = "";
$form_address = "";
$form_city = "Alger";
$form_status = "active";
$form_notes = "";
$is_edit_mode = false;

if (isset($_POST['save_client'])) {
    $form_id = trim($_POST['id']);
    $form_name = trim($_POST['name']);
    $form_email = trim($_POST['email']);
    $form_phone = trim($_POST['phone']);
    $form_address = trim($_POST['address']);
    $form_city = trim($_POST['city']);
    $form_status = trim($_POST['status']);
    $form_notes = trim($_POST['notes']);
    $action_mode = $_POST['action_mode'];

    try {
        if ($action_mode === 'edit') {
            $stmt = $pdo->prepare("
                UPDATE `clients` 
                SET `name` = ?, `email` = ?, `phone` = ?, `address` = ?, `city` = ?, `status` = ?, `notes` = ?
                WHERE `id` = ?
            ");
            $stmt->execute([$form_name, $form_email, $form_phone, $form_address, $form_city, $form_status, $form_notes, $form_id]);
            $alert_type = "success";
            $alert_message = "La fiche du client <strong>\"" . htmlspecialchars($form_name) . "\"</strong> a été modifiée avec succès.";
        } else {
            // S'assurer que l'ID est unique
            $stmt_chk = $pdo->prepare("SELECT COUNT(*) FROM `clients` WHERE `id` = ? OR `email` = ?");
            $stmt_chk->execute([$form_id, $form_email]);
            if ($stmt_chk->fetchColumn() > 0) {
                throw new Exception("L'ID client ou l'adresse e-mail est déjà utilisé.");
            }

            $stmt = $pdo->prepare("
                INSERT INTO `clients` (`id`, `name`, `email`, `phone`, `address`, `city`, `password_hash`, `status`, `notes`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $form_id, $form_name, $form_email, $form_phone, $form_address, $form_city,
                password_hash('sejoursdz123', PASSWORD_BCRYPT), $form_status, $form_notes
            ]);
            $alert_type = "success";
            $alert_message = "Le client <strong>\"" . htmlspecialchars($form_name) . "\"</strong> a été enregistré avec succès.";
        }
        
        // Reset form variables
        $form_id = ""; $form_name = ""; $form_email = ""; $form_phone = ""; $form_address = ""; $form_city = "Alger"; $form_status = "active"; $form_notes = "";
    } catch (Exception $e) {
        $alert_type = "error";
        $alert_message = "Erreur d'enregistrement du client : " . $e->getMessage();
        $is_edit_mode = ($action_mode === 'edit');
    }
}

// Charger un client pour modification
if (isset($_GET['edit_client_id'])) {
    $edit_id = $_GET['edit_client_id'];
    $stmt = $pdo->prepare("SELECT * FROM `clients` WHERE `id` = ?");
    $stmt->execute([$edit_id]);
    $client_to_edit = $stmt->fetch();

    if ($client_to_edit) {
        $form_id = $client_to_edit['id'];
        $form_name = $client_to_edit['name'];
        $form_email = $client_to_edit['email'];
        $form_phone = $client_to_edit['phone'];
        $form_address = $client_to_edit['address'];
        $form_city = $client_to_edit['city'];
        $form_status = $client_to_edit['status'];
        $form_notes = $client_to_edit['notes'];
        $is_edit_mode = true;
    }
}

// --- 7. CHARGER LES DONNÉES À AFFICHER ---
$clients = $pdo->query("SELECT * FROM `clients` ORDER BY `created_at` DESC")->fetchAll();
$bookings = $pdo->query("SELECT b.*, p.title as packageTitleName FROM `bookings` b LEFT JOIN `packages` p ON b.packageId = p.id ORDER BY b.dateBooked DESC")->fetchAll();

// Statistiques rapides
$total_clients = count($clients);
$total_bookings = count($bookings);
$pending_bookings = 0;
$total_payments = 0;

foreach ($bookings as $b) {
    if ($b['status'] === 'En attente') $pending_bookings++;
    $total_payments += (float)$b['paymentAmount'];
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Espace Agent - Gestion Clients & Réservations | Séjours DZ</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #f8fafc;
        }
        h1, h2, h3, .font-serif {
            font-family: 'Playfair Display', serif;
        }
    </style>
</head>
<body class="min-h-screen text-slate-800 bg-slate-50/50 flex flex-col justify-between">

    <!-- Top Navigation Bar -->
    <nav class="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center gap-3">
                    <span class="text-xl font-black text-slate-900 tracking-tight">SÉJOURS DZ <span class="text-green-700 text-xs font-bold uppercase ml-1">Espace Agent</span></span>
                </div>
                <div class="flex items-center gap-4">
                    <a href="manage_packages.php" class="text-xs font-bold text-slate-600 hover:text-green-700 bg-slate-100 hover:bg-slate-200/60 px-4 py-2 rounded-lg transition-all">
                        ✈️ Gérer les Offres
                    </a>
                    <a href="db_populate.php" class="text-xs font-bold text-white bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg transition-all">
                        🔄 Synchro Database
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Container -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        
        <!-- Header Banner -->
        <div class="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
            <div class="absolute right-0 top-0 w-80 h-80 bg-green-700/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative z-10 space-y-2">
                <span class="px-3 py-1 bg-green-700/20 border border-green-700/30 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-green-400">
                    FICHIERS CLIENTS & DOSSIERS DE VOYAGE
                </span>
                <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight">Console de Gestion Clientèle</h1>
                <p class="text-xs sm:text-sm text-slate-300 max-w-xl">
                    Suivez vos voyageurs, modifiez leurs dossiers de réservation et suivez les règlements financiers en direct.
                </p>
            </div>
        </div>

        <!-- Alert messages -->
        <?php if ($alert_message): ?>
            <div class="p-4 rounded-2xl border <?php echo $alert_type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'; ?> text-xs font-bold flex items-center justify-between">
                <span><?php echo $alert_message; ?></span>
                <button onclick="this.parentElement.style.display='none'" class="text-sm font-black hover:opacity-50">&times;</button>
            </div>
        <?php endif; ?>

        <!-- Rapid Statistics -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clients</span>
                <span class="text-3xl font-black text-slate-900 mt-2"><?php echo $total_clients; ?></span>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Réservations</span>
                <span class="text-3xl font-black text-slate-900 mt-2"><?php echo $total_bookings; ?></span>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">Dossiers en Attente</span>
                <span class="text-3xl font-black text-slate-900 mt-2"><?php echo $pending_bookings; ?></span>
            </div>
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <span class="text-[10px] font-bold text-green-700 uppercase tracking-widest">Acomptes & Paiements</span>
                <span class="text-2xl font-black text-green-700 mt-2"><?php echo number_format($total_payments, 2, ',', ' '); ?> DZD</span>
            </div>
        </div>

        <!-- Section: Client Form & Client Table Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left Side: Client List (col-span-8) -->
            <div class="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-bold text-slate-900">Registre des Clients</h2>
                    <span class="text-[11px] font-bold text-slate-400"><?php echo count($clients); ?> fiches voyageurs</span>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-50 text-slate-400 border-b border-slate-100 font-bold uppercase text-[9px] tracking-wider">
                                <th class="p-3">ID / Voyageur</th>
                                <th class="p-3">Coordonnées</th>
                                <th class="p-3">Ville</th>
                                <th class="p-3">Statut</th>
                                <th class="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <?php if (empty($clients)): ?>
                                <tr>
                                    <td colspan="5" class="p-8 text-center text-slate-400 font-medium">Aucun client enregistré dans la base de données.</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($clients as $c): ?>
                                    <tr class="hover:bg-slate-50/50 transition-colors">
                                        <td class="p-3 space-y-0.5">
                                            <span class="text-[10px] font-bold text-slate-400 block"><?php echo htmlspecialchars($c['id']); ?></span>
                                            <span class="font-bold text-slate-900 block"><?php echo htmlspecialchars($c['name']); ?></span>
                                        </td>
                                        <td class="p-3 space-y-0.5">
                                            <span class="block font-medium text-slate-600"><?php echo htmlspecialchars($c['email']); ?></span>
                                            <span class="block text-slate-400 text-[11px]" dir="ltr"><?php echo htmlspecialchars($c['phone']); ?></span>
                                        </td>
                                        <td class="p-3 font-semibold text-slate-600">
                                            <?php echo htmlspecialchars($c['city']); ?>
                                        </td>
                                        <td class="p-3">
                                            <span class="px-2.5 py-1 rounded-full text-[9px] font-bold leading-none <?php echo $c['status'] === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'; ?>">
                                                <?php echo $c['status'] === 'active' ? 'Actif' : 'Suspendu'; ?>
                                            </span>
                                        </td>
                                        <td class="p-3 text-right space-x-1">
                                            <a href="?edit_client_id=<?php echo urlencode($c['id']); ?>" class="p-1.5 px-3 bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-600 font-bold rounded-lg transition-all inline-block">
                                                Éditer
                                            </a>
                                            <a href="?delete_client_id=<?php echo urlencode($c['id']); ?>" onclick="return confirm('Supprimer ce client supprimera également son lien avec les réservations passées. Continuer ?')" class="p-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-all inline-block">
                                                &times;
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right Side: Add / Edit Client Form (col-span-4) -->
            <div class="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 class="text-lg font-bold text-slate-900">
                    <?php echo $is_edit_mode ? "Modifier la Fiche Client" : "Inscrire un Client"; ?>
                </h2>

                <form method="POST" class="space-y-4">
                    <input type="hidden" name="action_mode" value="<?php echo $is_edit_mode ? 'edit' : 'add'; ?>">
                    
                    <!-- ID Client (non modifiable si edit) -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Identifiant Client Unique</label>
                        <input 
                            type="text" 
                            name="id" 
                            required 
                            placeholder="Ex: CLI-8820" 
                            value="<?php echo htmlspecialchars($form_id); ?>"
                            <?php echo $is_edit_mode ? 'readonly class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500"' : 'class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700/20"'; ?>
                        >
                    </div>

                    <!-- Nom Complet -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nom du Voyageur</label>
                        <input 
                            type="text" 
                            name="name" 
                            required 
                            placeholder="Ex: Mohamed Lemjad" 
                            value="<?php echo htmlspecialchars($form_name); ?>"
                            class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700/20"
                        >
                    </div>

                    <!-- Email & Téléphone -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
                            <input 
                                type="email" 
                                name="email" 
                                required 
                                placeholder="Ex: m.lemjad@gmail.com" 
                                value="<?php echo htmlspecialchars($form_email); ?>"
                                class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700/20"
                            >
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Téléphone</label>
                            <input 
                                type="tel" 
                                name="phone" 
                                required 
                                placeholder="Ex: +213 550 12 34 56" 
                                value="<?php echo htmlspecialchars($form_phone); ?>"
                                class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700/20"
                            >
                        </div>
                    </div>

                    <!-- Adresse & Ville -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Adresse</label>
                            <input 
                                type="text" 
                                name="address" 
                                placeholder="Ex: Rue Hassiba Ben Bouali" 
                                value="<?php echo htmlspecialchars($form_address); ?>"
                                class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700/20"
                            >
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ville</label>
                            <input 
                                type="text" 
                                name="city" 
                                value="<?php echo htmlspecialchars($form_city); ?>"
                                class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700/20"
                            >
                        </div>
                    </div>

                    <!-- Statut -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Statut du Client</label>
                        <select name="status" class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700/20">
                            <option value="active" <?php echo $form_status === 'active' ? 'selected' : ''; ?>>Actif (Autorisé à réserver)</option>
                            <option value="suspended" <?php echo $form_status === 'suspended' ? 'selected' : ''; ?>>Suspendu / Litige</option>
                        </select>
                    </div>

                    <!-- Notes internes -->
                    <div>
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes Internes de l'Agent</label>
                        <textarea 
                            name="notes" 
                            rows="2" 
                            placeholder="Particularités du voyageur, demandes d'accompagnement..."
                            class="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-700/20 resize-none"
                        ><?php echo htmlspecialchars($form_notes); ?></textarea>
                    </div>

                    <div class="pt-2 flex gap-2">
                        <button 
                            type="submit" 
                            name="save_client" 
                            class="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3 text-xs rounded-xl transition-all cursor-pointer shadow-sm text-center"
                        >
                            <?php echo $is_edit_mode ? "Enregistrer les modifications" : "Inscrire le client"; ?>
                        </button>
                        <?php if ($is_edit_mode): ?>
                            <a href="manage_clients.php" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 text-xs rounded-xl transition-all text-center">
                                Annuler
                            </a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>
        </div>

        <!-- Section: Bookings Table -->
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 class="text-lg font-bold text-slate-900">Suivi des Dossiers de Réservations</h2>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="bg-slate-50 text-slate-400 border-b border-slate-100 font-bold uppercase text-[9px] tracking-wider">
                            <th class="p-3">Dossier / Date</th>
                            <th class="p-3">Client principal</th>
                            <th class="p-3">Séjour / Package</th>
                            <th class="p-3">Facturation (DZD)</th>
                            <th class="p-3">Acompte / Statut Paiement</th>
                            <th class="p-3">Statut Dossier</th>
                            <th class="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <?php if (empty($bookings)): ?>
                            <tr>
                                <td colspan="7" class="p-8 text-center text-slate-400 font-medium">Aucune réservation trouvée.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($bookings as $b): ?>
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="p-3 space-y-0.5">
                                        <span class="text-[10px] font-bold text-slate-400 block">#<?php echo htmlspecialchars($b['id']); ?></span>
                                        <span class="block text-slate-500 font-medium text-[11px]"><?php echo date('d/m/Y H:i', strtotime($b['dateBooked'])); ?></span>
                                    </td>
                                    <td class="p-3 space-y-0.5">
                                        <span class="font-bold text-slate-900 block"><?php echo htmlspecialchars($b['clientName']); ?></span>
                                        <span class="text-slate-400 text-[10px] block"><?php echo htmlspecialchars($b['clientEmail']); ?></span>
                                    </td>
                                    <td class="p-3 max-w-xs truncate">
                                        <span class="font-semibold text-slate-700 block text-[11px] truncate"><?php echo htmlspecialchars($b['packageTitleName'] ?? $b['packageTitle']); ?></span>
                                        <span class="text-[10px] text-slate-400 block">Réf: <?php echo htmlspecialchars($b['packageId']); ?></span>
                                    </td>
                                    <td class="p-3 font-bold text-slate-800">
                                        <?php echo number_format($b['totalAmount'], 2, ',', ' '); ?> DZD
                                    </td>
                                    
                                    <!-- Formulaire rapide pour acompte et statuts de paiement -->
                                    <td class="p-3">
                                        <form method="POST" class="flex flex-col gap-1 items-start">
                                            <input type="hidden" name="booking_id" value="<?php echo $b['id']; ?>">
                                            <input type="hidden" name="status" value="<?php echo $b['status']; ?>">
                                            
                                            <div class="flex items-center gap-1.5">
                                                <input 
                                                    type="number" 
                                                    name="paymentAmount" 
                                                    step="0.01" 
                                                    value="<?php echo (float)$b['paymentAmount']; ?>" 
                                                    class="w-20 text-[11px] p-1 border border-slate-200 rounded-md focus:outline-none"
                                                >
                                                <select name="paymentStatus" class="text-[10px] p-1 border border-slate-200 rounded-md focus:outline-none">
                                                    <option value="Non payé" <?php echo $b['paymentStatus'] === 'Non payé' ? 'selected' : ''; ?>>Non payé</option>
                                                    <option value="Acompte payé" <?php echo $b['paymentStatus'] === 'Acompte payé' ? 'selected' : ''; ?>>Acompte payé</option>
                                                    <option value="Payé" <?php echo $b['paymentStatus'] === 'Payé' ? 'selected' : ''; ?>>Payé</option>
                                                </select>
                                                <button type="submit" name="update_booking_status" class="bg-green-100 hover:bg-green-200 text-green-800 p-1 px-2 rounded-md font-bold text-[10px] transition-all">
                                                    Ok
                                                </button>
                                            </div>
                                        </form>
                                    </td>

                                    <!-- Statut global du dossier -->
                                    <td class="p-3">
                                        <form method="POST" class="flex items-center gap-1.5">
                                            <input type="hidden" name="booking_id" value="<?php echo $b['id']; ?>">
                                            <input type="hidden" name="paymentStatus" value="<?php echo $b['paymentStatus']; ?>">
                                            <input type="hidden" name="paymentAmount" value="<?php echo $b['paymentAmount']; ?>">
                                            
                                            <select name="status" onchange="this.form.submit()" class="text-[11px] font-semibold p-1 border border-slate-200 rounded-md bg-slate-50 focus:outline-none">
                                                <option value="En attente" <?php echo $b['status'] === 'En attente' ? 'selected' : ''; ?>>En attente</option>
                                                <option value="Confirmé" <?php echo $b['status'] === 'Confirmé' ? 'selected' : ''; ?>>Confirmé</option>
                                                <option value="Annulé" <?php echo $b['status'] === 'Annulé' ? 'selected' : ''; ?>>Annulé</option>
                                            </select>
                                        </form>
                                    </td>

                                    <!-- Action de suppression -->
                                    <td class="p-3 text-right">
                                        <a href="?delete_booking_id=<?php echo urlencode($b['id']); ?>" onclick="return confirm('Confirmer la suppression irréversible de cette réservation ?')" class="p-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-all text-xs inline-block">
                                            Supprimer
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </main>

    <!-- Sticky footer -->
    <footer class="w-full text-center py-6 text-[10px] font-bold text-slate-400 border-t border-slate-200 bg-white mt-12">
        Séjours DZ - Agence Officielle Agréée • Console Agent de Réservations © 2026
    </footer>

</body>
</html>
