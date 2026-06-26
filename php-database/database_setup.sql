-- ==========================================
-- SÉJOURS DZ : STRUCTURE DE LA BASE DE DONNÉES COMPLÈTE
-- Fichier de configuration SQL pour MySQL / MariaDB
-- ==========================================

-- Création de la base de données
-- CREATE DATABASE IF NOT EXISTS `sejoursdz_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `sejoursdz_db`;

-- ------------------------------------------
-- 1. Table des Offres de voyage (Packages)
-- ------------------------------------------
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
    `inclusions` TEXT NOT NULL, -- Stocké en format JSON texte
    `exclusions` TEXT NOT NULL, -- Stocké en format JSON texte
    `schedule` TEXT NOT NULL,   -- Programme au jour le jour en JSON texte
    `status` VARCHAR(20) DEFAULT 'active',
    `rating` DECIMAL(3,2) DEFAULT 4.5,
    `category` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_category` (`category`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 2. Table des Clients (Utilisateurs / Abonnés)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `phone` VARCHAR(50) NOT NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) DEFAULT 'Alger',
    `password_hash` VARCHAR(255) NULL, -- Pour une future authentification client
    `status` VARCHAR(20) DEFAULT 'active', -- active, suspended, leads
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_client_email` (`email`),
    INDEX `idx_client_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 3. Table des Réservations (Bookings)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` VARCHAR(50) NOT NULL PRIMARY KEY,
    `packageId` VARCHAR(50) NOT NULL,
    `clientId` VARCHAR(50) NULL, -- Clé étrangère vers le client principal
    `packageTitle` VARCHAR(255) NOT NULL,
    `packageImage` VARCHAR(512) NOT NULL,
    `packagePrice` DECIMAL(12,2) NOT NULL,
    `clientName` VARCHAR(100) NOT NULL, -- Redondance pour compatibilité et historique
    `clientEmail` VARCHAR(150) NOT NULL,
    `clientPhone` VARCHAR(50) NOT NULL,
    `passengers` TEXT NOT NULL, -- Liste des passagers en JSON texte
    `totalAmount` DECIMAL(12,2) NOT NULL,
    `status` VARCHAR(50) DEFAULT 'En attente', -- Ex: "En attente", "Confirmé", "Annulé"
    `paymentStatus` VARCHAR(50) DEFAULT 'Non payé', -- Ex: "Payé", "Acompte payé", "Non payé"
    `paymentMethod` VARCHAR(100) NOT NULL,
    `paymentAmount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `dateBooked` DATETIME NOT NULL,
    `specialRequests` TEXT NULL,
    `aiCustomization` TEXT NULL, -- Suggestions spéciales / notes personnalisées
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`packageId`) REFERENCES `packages`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
    INDEX `idx_booking_status` (`status`),
    INDEX `idx_booking_payment` (`paymentStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
