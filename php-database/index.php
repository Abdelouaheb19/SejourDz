<?php
/**
 * =========================================================================
 * SÉJOURS DZ - PORTAIL D'ADMINISTRATION CENTRAL DU BACKEND & DE LA BASE DE DONNÉES
 * =========================================================================
 * Ce fichier sert de panneau de contrôle maître (Dashboard) pour superviser,
 * analyser et administrer la base de données relationnelle (MySQL/MariaDB).
 */

header('Content-Type: text/html; charset=utf-8');

// --- 1. CONFIGURATION DE LA BASE DE DONNÉES ---
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'sejoursdz_db');

// --- 2. TENTATIVE DE CONNEXION ---
$db_connected = false;
$db_error = "";
$tables_status = [];
$stats = [
    'packages' => 0,
    'clients' => 0,
    'bookings' => 0,
    'total_revenue' => 0,
    'pending_bookings' => 0,
    'confirmed_bookings' => 0
];

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    $db_connected = true;
} catch (PDOException $e) {
    $db_error = $e->getMessage();
}

// --- 3. TRAITEMENT DES ACTIONS SUR LA BASE DE DONNÉES ---
$alert_message = "";
$alert_type = "success";

if ($db_connected && isset($_GET['action'])) {
    $action = $_GET['action'];
    
    // Action: Vider la base de données (Truncate)
    if ($action === 'clear_db') {
        try {
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
            $pdo->exec("TRUNCATE TABLE `bookings`;");
            $pdo->exec("TRUNCATE TABLE `clients`;");
            $pdo->exec("TRUNCATE TABLE `packages`;");
            $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
            $alert_message = "La base de données a été vidée avec succès. Toutes les tables sont prêtes pour un nouvel import.";
            $alert_type = "success";
        } catch (Exception $e) {
            $alert_message = "Erreur lors de la réinitialisation : " . $e->getMessage();
            $alert_type = "error";
        }
    }
    
    // Action: Exportation de la Base de données au format JSON
    if ($action === 'export_json') {
        try {
            $export = [
                'exported_at' => date('Y-m-d H:i:s'),
                'packages' => $pdo->query("SELECT * FROM `packages`")->fetchAll(),
                'clients' => $pdo->query("SELECT * FROM `clients`")->fetchAll(),
                'bookings' => $pdo->query("SELECT * FROM `bookings`")->fetchAll(),
            ];
            
            header('Content-disposition: attachment; filename=sejoursdz_backup_' . date('Ymd_His') . '.json');
            header('Content-type: application/json; charset=utf-8');
            echo json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        } catch (Exception $e) {
            $alert_message = "Erreur lors de l'exportation JSON : " . $e->getMessage();
            $alert_type = "error";
        }
    }
}

// --- 4. CHARGEMENT DES STATISTIQUES & ANALYSES ---
if ($db_connected) {
    try {
        // Nombre d'offres (packages)
        $stats['packages'] = $pdo->query("SELECT COUNT(*) FROM `packages`")->fetchColumn();
        
        // Nombre de clients fiches
        $stats['clients'] = $pdo->query("SELECT COUNT(*) FROM `clients`")->fetchColumn();
        
        // Nombre de réservations
        $stats['bookings'] = $pdo->query("SELECT COUNT(*) FROM `bookings`")->fetchColumn();
        
        // Réservations en attente vs Confirmées
        $stats['pending_bookings'] = $pdo->query("SELECT COUNT(*) FROM `bookings` WHERE `status` = 'En attente'")->fetchColumn();
        $stats['confirmed_bookings'] = $pdo->query("SELECT COUNT(*) FROM `bookings` WHERE `status` = 'Confirmé'")->fetchColumn();
        
        // Total des encaissements (paymentAmount)
        $stats['total_revenue'] = $pdo->query("SELECT SUM(`paymentAmount`) FROM `bookings`")->fetchColumn() ?: 0;
        
        // Diagnostic des tables de la base
        $tables = ['packages', 'clients', 'bookings'];
        foreach ($tables as $tbl) {
            $stmt = $pdo->prepare("SHOW TABLE STATUS LIKE ?");
            $stmt->execute([$tbl]);
            $status = $stmt->fetch();
            if ($status) {
                $tables_status[] = [
                    'name' => $tbl,
                    'rows' => $status['Rows'],
                    'data_size' => round($status['Data_length'] / 1024, 2) . ' KB',
                    'index_size' => round($status['Index_length'] / 1024, 2) . ' KB',
                    'collation' => $status['Collation']
                ];
            }
        }
        
        // Récupérer les 5 dernières réservations pour affichage
        $recent_bookings = $pdo->query("
            SELECT b.*, p.title as packageTitleName 
            FROM `bookings` b 
            LEFT JOIN `packages` p ON b.packageId = p.id 
            ORDER BY b.dateBooked DESC 
            LIMIT 5
        ")->fetchAll();
        
    } catch (Exception $e) {
        $db_error = "Erreur de lecture des statistiques : " . $e->getMessage();
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SÉJOURS DZ - Portail Administration Base de Données</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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

    <!-- Navbar d'administration -->
    <nav class="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center gap-3">
                    <span class="text-lg font-black tracking-wider text-green-400">SÉJOURS DZ</span>
                    <span class="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">Console Maître Admin</span>
                </div>
                <div class="flex items-center gap-2">
                    <a href="manage_packages.php" class="text-xs font-semibold hover:text-green-400 px-3 py-2 rounded-lg transition-colors">
                        ✈️ Offres
                    </a>
                    <a href="manage_clients.php" class="text-xs font-semibold hover:text-green-400 px-3 py-2 rounded-lg transition-colors">
                        👤 Voyageurs & Réservations
                    </a>
                    <a href="db_populate.php" class="text-xs font-bold text-white bg-green-700 hover:bg-green-800 px-3 py-2 rounded-lg transition-colors">
                        🔄 Synchro DB
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Container -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 w-full">
        
        <!-- Header Hero Panel -->
        <div class="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden border border-slate-800">
            <div class="absolute right-0 top-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative z-10 space-y-3">
                <span class="inline-block px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 font-extrabold text-[10px] tracking-widest uppercase rounded-full">
                    Tableau de Bord Global d'Administration
                </span>
                <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight">Supervision de l'Agence Séjours DZ</h1>
                <p class="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                    Portail autonome centralisé connecté en temps réel pour piloter l'écosystème de données relationnelles de l'agence. Suivez les performances de vente, gérez les clients et vérifiez la santé du serveur MySQL d'un seul coup d'œil.
                </p>
            </div>
        </div>

        <!-- Alert Message -->
        <?php if ($alert_message): ?>
            <div class="p-4 rounded-2xl border <?php echo $alert_type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'; ?> text-xs font-bold flex items-center justify-between">
                <span><?php echo $alert_message; ?></span>
                <button onclick="this.parentElement.style.display='none'" class="text-sm font-black hover:opacity-50">&times;</button>
            </div>
        <?php endif; ?>

        <!-- Database Connection Check -->
        <?php if (!$db_connected): ?>
            <div class="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-sm">
                <div class="mx-auto w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-black text-xl">
                    ✕
                </div>
                <h2 class="font-serif text-xl font-bold text-red-900">Base de données inaccessible</h2>
                <p class="text-xs text-red-700 leading-relaxed">
                    Le serveur n'a pas pu se connecter au serveur MySQL (hôte: <code><?php echo DB_HOST; ?></code>). Assurez-vous que votre serveur MySQL est démarré et que vous avez correctement initialisé la base en exécutant d'abord le script d'auto-remplissage.
                </p>
                <div class="pt-4 flex gap-3 justify-center">
                    <a href="db_populate.php" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all">
                        🔄 Lancer db_populate.php
                    </a>
                </div>
                <div class="bg-white p-3 rounded-xl border border-red-100 text-[10px] font-mono text-red-500 text-left overflow-x-auto">
                    <?php echo $db_error; ?>
                </div>
            </div>
        <?php else: ?>

            <!-- Real-time metrics widgets grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <!-- Card: Offers -->
                <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offres au Catalogue</span>
                        <span class="text-xs text-slate-500">Voyages</span>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-slate-900"><?php echo $stats['packages']; ?></span>
                        <span class="text-xs text-green-600 font-bold">Actives</span>
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <a href="manage_packages.php" class="text-[11px] font-bold text-green-700 hover:underline">
                            Gérer le catalogue d'offres →
                        </a>
                    </div>
                </div>

                <!-- Card: Clients -->
                <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fiches Voyageurs</span>
                        <span class="text-xs text-slate-500">Clients</span>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-slate-900"><?php echo $stats['clients']; ?></span>
                        <span class="text-xs text-slate-500 font-bold">Enregistrés</span>
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <a href="manage_clients.php" class="text-[11px] font-bold text-green-700 hover:underline">
                            Consulter le fichier clients →
                        </a>
                    </div>
                </div>

                <!-- Card: Bookings -->
                <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Réservations Globales</span>
                        <span class="text-xs text-slate-500">Dossiers</span>
                    </div>
                    <div class="mt-4 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-slate-900"><?php echo $stats['bookings']; ?></span>
                        <span class="text-xs text-yellow-600 font-bold"><?php echo $stats['pending_bookings']; ?> en attente</span>
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <a href="manage_clients.php" class="text-[11px] font-bold text-green-700 hover:underline">
                            Valider les dossiers en attente →
                        </a>
                    </div>
                </div>

                <!-- Card: Total Collected -->
                <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-green-700 uppercase tracking-widest">Règlements encaissés</span>
                        <span class="text-xs text-green-700 font-bold">Chiffre Affaires</span>
                    </div>
                    <div class="mt-4 flex flex-col">
                        <span class="text-xl sm:text-2xl font-black text-green-700 leading-none">
                            <?php echo number_format($stats['total_revenue'], 2, ',', ' '); ?>
                        </span>
                        <span class="text-[10px] text-slate-400 mt-1 font-semibold uppercase">DZD (Règlements reçus)</span>
                    </div>
                    <div class="mt-4 pt-4 border-t border-slate-100">
                        <span class="text-[11px] font-bold text-slate-500">
                            Acomptes de réservation inclus
                        </span>
                    </div>
                </div>

            </div>

            <!-- Main grid split: Diagnostics & Actions / Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                <!-- Left Column: DB Tools & Diagnostics (col-span-5) -->
                <div class="lg:col-span-5 space-y-6">
                    
                    <!-- Table diagnostics block -->
                    <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span>🔍 Diagnostic des Tables Relationnelles</span>
                        </h2>
                        
                        <div class="space-y-3">
                            <?php foreach ($tables_status as $tbl): ?>
                                <div class="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <div class="space-y-0.5">
                                        <h3 class="text-xs font-extrabold text-slate-900 uppercase">
                                            Table `<?php echo htmlspecialchars($tbl['name']); ?>`
                                        </h3>
                                        <p class="text-[10px] text-slate-400 font-semibold uppercase">
                                            <?php echo htmlspecialchars($tbl['collation']); ?>
                                        </p>
                                    </div>
                                    <div class="text-right space-y-0.5">
                                        <span class="text-xs font-black text-slate-800 block">
                                            <?php echo $tbl['rows']; ?> lignes
                                        </span>
                                        <span class="text-[10px] text-slate-500 block">
                                            Données: <?php echo $tbl['data_size']; ?>
                                        </span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- DB Maintenance & Operations Tools Panel -->
                    <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <h2 class="text-lg font-bold text-slate-900">🛡️ Outils de Maintenance & Administration</h2>
                        
                        <div class="space-y-2">
                            <!-- Populator / Seeder Link -->
                            <a href="db_populate.php" class="flex items-center justify-between p-3.5 bg-green-50/50 hover:bg-green-50 text-green-900 rounded-xl border border-green-100 transition-all">
                                <div class="space-y-0.5">
                                    <span class="text-xs font-bold block">Réinitialiser et Peupler la Base</span>
                                    <span class="text-[10px] text-green-700 block leading-tight">Efface les modifications et recharge l'intégralité du fichier db.json.</span>
                                </div>
                                <span class="text-sm font-black">&rarr;</span>
                            </a>

                            <!-- JSON Export Button -->
                            <a href="?action=export_json" class="flex items-center justify-between p-3.5 bg-blue-50/50 hover:bg-blue-50 text-blue-900 rounded-xl border border-blue-100 transition-all">
                                <div class="space-y-0.5">
                                    <span class="text-xs font-bold block">Exporter la base en JSON</span>
                                    <span class="text-[10px] text-blue-700 block leading-tight">Télécharge l'intégralité des tables au format de sauvegarde standard.</span>
                                </div>
                                <span class="text-sm font-black">&darr;</span>
                            </a>

                            <!-- Truncate / Clear DB Trigger -->
                            <a 
                                href="?action=clear_db" 
                                onclick="return confirm('DANGER : Cette action va effacer définitivement l\'intégralité des offres, des clients et des réservations de voyage enregistrés. Êtes-vous absolument sûr de vouloir continuer ?')" 
                                class="flex items-center justify-between p-3.5 bg-red-50/50 hover:bg-red-50 text-red-900 rounded-xl border border-red-100 transition-all"
                            >
                                <div class="space-y-0.5">
                                    <span class="text-xs font-bold block text-red-700">Purger toutes les tables</span>
                                    <span class="text-[10px] text-red-600 block leading-tight">Vide complètement packages, clients et bookings sans casser la structure.</span>
                                </div>
                                <span class="text-sm font-black text-red-500">&times;</span>
                            </a>
                        </div>
                    </div>

                </div>

                <!-- Right Column: Recent Activity & Logs (col-span-7) -->
                <div class="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-bold text-slate-900">📊 5 Dernières Réservations Reçues</h2>
                        <a href="manage_clients.php" class="text-xs font-bold text-[#0071eb] hover:underline">Voir tout</a>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="bg-slate-50 text-slate-400 border-b border-slate-100 font-bold uppercase text-[9px]">
                                    <th class="p-3">Dossier</th>
                                    <th class="p-3">Voyageur</th>
                                    <th class="p-3">Séjour choisi</th>
                                    <th class="p-3">Règlement</th>
                                    <th class="p-3">Statut</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <?php if (empty($recent_bookings)): ?>
                                    <tr>
                                        <td colspan="5" class="p-8 text-center text-slate-400 font-medium">Aucune réservation de voyage récente enregistrée.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($recent_bookings as $rb): ?>
                                        <tr class="hover:bg-slate-50/50">
                                            <td class="p-3 space-y-0.5">
                                                <span class="text-[10px] font-bold text-slate-400 block">#<?php echo htmlspecialchars($rb['id']); ?></span>
                                                <span class="text-[10px] text-slate-400 block"><?php echo date('d/m/Y', strtotime($rb['dateBooked'])); ?></span>
                                            </td>
                                            <td class="p-3 space-y-0.5 font-bold text-slate-900">
                                                <?php echo htmlspecialchars($rb['clientName']); ?>
                                            </td>
                                            <td class="p-3 max-w-xs truncate font-semibold text-slate-600">
                                                <?php echo htmlspecialchars($rb['packageTitleName'] ?? $rb['packageTitle']); ?>
                                            </td>
                                            <td class="p-3 font-bold text-slate-700">
                                                <?php echo number_format($rb['totalAmount'], 2, ',', ' '); ?> DA
                                            </td>
                                            <td class="p-3">
                                                <span class="px-2 py-0.5 rounded-md text-[9px] font-bold <?php echo $rb['status'] === 'Confirmé' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'; ?>">
                                                    <?php echo htmlspecialchars($rb['status']); ?>
                                                </span>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

        <?php endif; ?>

    </main>

    <!-- Sticky and elegant footer -->
    <footer class="w-full text-center py-6 text-[10px] font-bold text-slate-400 border-t border-slate-200 bg-white mt-12">
        Séjours DZ - Agence Officielle Agréée • Portail d'Administration de la Base de Données © 2026
    </footer>

</body>
</html>
