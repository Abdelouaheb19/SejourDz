# 🏝️ Séjours DZ – Guide d'Installation de la Base de Données & Espace Agent

Ce dossier contient l'ensemble des scripts nécessaires pour porter la base de données de **Séjours DZ** sur votre propre serveur d'hébergement Web PHP/MySQL (local ou distant) et alimenter dynamiquement le site à partir de l'Espace Agent.

---

## 📋 Table des Matières
1. [Présentation des composants](#-présentation-des-composants)
2. [Prérequis système](#-prérequis-système)
3. [Procédure d'installation rapide (Recommandé)](#-procédure-dinstallation-rapide-recommandé)
4. [Procédure d'installation manuelle](#-procédure-dinstallation-manuelle)
5. [Détail des API & Routes disponibles](#-détail-des-api--routes-disponibles)
6. [Sécurité & Recommandations](#-sécurité--recommandations)

---

## 📦 Présentation des composants

Le dossier est structuré comme suit :
*   **`index.php`** : Le **Portail d'Administration Maître** (Dashboard central). Il offre une vue analytique consolidée de l'agence, affiche les rapports financiers en DZD, permet de sauvegarder/exporter au format JSON, et fournit un outil de diagnostic de santé des tables de la base de données.
*   **`database_setup.sql`** : Script de structure SQL contenant la déclaration des tables relationnelles (`packages` pour les offres de voyage, `clients` pour les fiches clients et `bookings` pour les réservations liées).
*   **`db_populate.php`** : Script d'alimentation automatique intelligent. Il se connecte à MySQL, crée la base de données, installe les trois tables et importe le catalogue d'origine, extrait les clients uniques par email, et crée les réservations reliées par clés étrangères depuis le fichier de stockage `db.json`.
*   **`api.php`** : Une API REST JSON complète gérant le CRUD (Create, Read, Update, Delete) pour les Offres, Réservations et Clients.
*   **`manage_packages.php`** : Une interface d'administration visuelle (Dashboard) autonome et élégante permettant aux agents de gérer l'inventaire des offres en temps réel.
*   **`manage_clients.php`** : Une interface d'administration visuelle autonome dédiée aux agents pour l'inscription/modification des fiches clients et le suivi des acomptes/réservations de voyages.

---

## 🛠️ Prérequis système

*   **Serveur Web** : Apache, Nginx ou IIS doté de **PHP 7.4 ou PHP 8.x**.
*   **Base de données** : **MySQL 5.7+** ou **MariaDB 10.x+**.
*   **Module PHP requis** : `PDO` avec le pilote `pdo_mysql` activé.
*   Un environnement local type **Laragon**, **WampServer**, **XAMPP** ou **MAMP** convient parfaitement.

---

## 🚀 Procédure d'installation rapide (Recommandé)

Le script d'intégration s'occupe de tout pour vous ! Voici comment procéder :

### Étape 1 : Déploiement des fichiers
Déplacez le dossier `/php-database` et le fichier de données `/data/db.json` sur l'arborescence de votre serveur Web (ex: `htdocs/` ou `www/`).

### Étape 2 : Configuration des accès
Ouvrez le fichier `db_populate.php` et définissez vos identifiants MySQL aux lignes 23 à 27 :
```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'votre_utilisateur'); // ex: root
define('DB_PASS', 'votre_mot_de_passe'); // ex: vide ou root
define('DB_NAME', 'sejoursdz_db');       // Nom de la base à générer
```
*(Faites de même dans les fichiers `api.php` et `manage_packages.php` pour harmoniser les accès).*

### Étape 3 : Exécution de l'initialisation automatique
Il vous suffit d'appeler le script `db_populate.php` de l'une des deux manières suivantes :
1.  **Depuis votre navigateur** : Accédez à l'URL :
    `http://localhost/php-database/db_populate.php`
2.  **Depuis votre terminal** (recommandé en production) :
    ```bash
    php db_populate.php
    ```

Le script va afficher un panneau d'étapes réussi au style impeccable indiquant que la base `sejoursdz_db` a été créée, les structures de tables installées et que vos voyages et réservations ont été importés.

---

## ✍️ Procédure d'installation manuelle

Si vous préférez installer la base manuellement sans passer par le script d'initialisation :

1.  Connectez-vous à votre outil de gestion de base de données (ex: **phpMyAdmin**).
2.  Créez une nouvelle base de données nommée `sejoursdz_db` avec l'interclassement `utf8mb4_unicode_ci`.
3.  Sélectionnez la base puis cliquez sur l'onglet **Importer**.
4.  Choisissez le fichier **`database_setup.sql`** et validez l'importation.
5.  Les tables vides `packages` et `bookings` sont prêtes à accueillir vos données.

---

## 🔌 Détail des API & Routes disponibles (`api.php`)

L'API accepte les requêtes provenant de tout outil externe (React, Vue, mobile, etc.) et gère le format CORS. Vous pouvez interroger les actions via un appel GET/POST :

### 1. Offres de séjours (Packages)
*   **Lister les offres** :
    `GET http://localhost/php-database/api.php?action=get_packages`
*   **Détails d'une offre** :
    `GET http://localhost/php-database/api.php?action=get_package&id=CODE-ID`
*   **Ajouter une offre** :
    `POST http://localhost/php-database/api.php?action=add_package`
    *(Données à envoyer au format JSON ou POST standard avec les clés de l'offre)*
*   **Modifier une offre** :
    `POST http://localhost/php-database/api.php?action=update_package`
*   **Supprimer une offre** :
    `POST http://localhost/php-database/api.php?action=delete_package` *(passer l'identifiant `id`)*

### 2. Inscriptions & Réservations (Bookings)
*   **Lister les réservations** :
    `GET http://localhost/php-database/api.php?action=get_bookings`
*   **Modifier le statut de paiement / détails** :
    `POST http://localhost/php-database/api.php?action=update_booking`
*   **Supprimer un dossier** :
    `POST http://localhost/php-database/api.php?action=delete_booking` *(passer l'identifiant `id`)*

### 3. Fiches Clients (Clients)
*   **Lister les clients** :
    `GET http://localhost/php-database/api.php?action=get_clients`
*   **Détails d'un client** :
    `GET http://localhost/php-database/api.php?action=get_client&id=CODE-ID`
*   **Ajouter un nouveau client** :
    `POST http://localhost/php-database/api.php?action=add_client`
*   **Modifier un client** :
    `POST http://localhost/php-database/api.php?action=update_client`
*   **Supprimer un client** :
    `POST http://localhost/php-database/api.php?action=delete_client` *(passer l'identifiant `id`)*

---

## 🛡️ Sécurité & Recommandations

1.  **Désactivation post-installation** : Après avoir initialisé et synchronisé vos données pour la première fois avec `db_populate.php`, il est fortement recommandé de **renommer ou supprimer** ce fichier sur votre serveur de production afin d'éviter toute ré-initialisation malveillante ou involontaire.
2.  **PDO & Anti-injection** : Tous les scripts intégrés utilisent des requêtes préparées via PDO, neutralisant nativement les tentatives d'injections SQL sur votre serveur d'hébergement.
3.  **Permissions des images** : Veillez à ce que les liens d'images d'arrière-plan ou d'illustrations que vous renseignez dans l'éditeur de voyages soient valides et stockés sur un réseau de distribution ou dossier d'images public à haute vitesse.

---

*Séjours DZ - Agence de Tourisme Officielle Agréée • Conception et Synchronisation Database © 2026*
