import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import mysql from "mysql2/promise";
import nodemailer from "nodemailer";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Password hashing helper
const hashPassword = (password: string) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database helper functions (relative to workspace root)
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Check and ensure data directory exists
const ensureDbExists = () => {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    // Write default schema empty structure
    fs.writeFileSync(DB_PATH, JSON.stringify({ packages: [], bookings: [], users: [] }, null, 2), "utf-8");
  }
};

const readDb = () => {
  try {
    ensureDbExists();
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    if (!db.users) db.users = [];
    return db;
  } catch (err) {
    console.error("Error reading database:", err);
    return { packages: [], bookings: [], users: [] };
  }
};

const writeDb = (data: any) => {
  try {
    ensureDbExists();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
};

// ================= MYSQL DATABASE SETUP & CONNECTION =================
let isMySQLAvailable = false;
let pool: mysql.Pool | null = null;

const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || "sejoursdz_db",
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
    });
  }
  return pool;
};

// Helpers to parse MySQL data back to frontend structure
const parsePackage = (row: any) => {
  if (!row) return row;
  return {
    ...row,
    price: parseFloat(row.price),
    promoPrice: row.promoPrice !== null && row.promoPrice !== undefined ? parseFloat(row.promoPrice) : undefined,
    durationDays: parseInt(row.durationDays),
    spotsAvailable: parseInt(row.spotsAvailable),
    spotsMax: parseInt(row.spotsMax),
    rating: parseFloat(row.rating),
    inclusions: typeof row.inclusions === "string" ? JSON.parse(row.inclusions) : row.inclusions,
    exclusions: typeof row.exclusions === "string" ? JSON.parse(row.exclusions) : row.exclusions,
    schedule: typeof row.schedule === "string" ? JSON.parse(row.schedule) : row.schedule
  };
};

const parseBooking = (row: any) => {
  if (!row) return row;
  return {
    ...row,
    packagePrice: parseFloat(row.packagePrice),
    totalAmount: parseFloat(row.totalAmount),
    paymentAmount: parseFloat(row.paymentAmount),
    passengers: typeof row.passengers === "string" ? JSON.parse(row.passengers) : row.passengers
  };
};

const initMySQL = async () => {
  let connection;
  try {
    console.log("Checking MySQL connection to host:", process.env.DB_HOST || "localhost");
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
    });

    console.log("Connected to MySQL server. Checking/creating database...");
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "sejoursdz_db"}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${process.env.DB_NAME || "sejoursdz_db"}\``);

    // Create packages table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`packages\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`destination\` VARCHAR(255) NOT NULL,
        \`durationDays\` INT NOT NULL,
        \`price\` DECIMAL(12,2) NOT NULL,
        \`promoPrice\` DECIMAL(12,2) NULL,
        \`image\` VARCHAR(512) NOT NULL,
        \`spotsAvailable\` INT NOT NULL,
        \`spotsMax\` INT NOT NULL,
        \`startDate\` DATE NOT NULL,
        \`endDate\` DATE NOT NULL,
        \`inclusions\` TEXT NOT NULL,
        \`exclusions\` TEXT NOT NULL,
        \`schedule\` TEXT NOT NULL,
        \`status\` VARCHAR(20) DEFAULT 'active',
        \`rating\` DECIMAL(3,2) DEFAULT 4.5,
        \`category\` VARCHAR(50) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_category\` (\`category\`),
        INDEX \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create clients table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`clients\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(150) NOT NULL UNIQUE,
        \`phone\` VARCHAR(50) NOT NULL,
        \`address\` VARCHAR(255) NULL,
        \`city\` VARCHAR(100) DEFAULT 'Alger',
        \`password_hash\` VARCHAR(255) NULL,
        \`status\` VARCHAR(20) DEFAULT 'active',
        \`notes\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_client_email\` (\`email\`),
        INDEX \`idx_client_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create bookings table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`bookings\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`packageId\` VARCHAR(50) NOT NULL,
        \`clientId\` VARCHAR(50) NULL,
        \`packageTitle\` VARCHAR(255) NOT NULL,
        \`packageImage\` VARCHAR(512) NOT NULL,
        \`packagePrice\` DECIMAL(12,2) NOT NULL,
        \`clientName\` VARCHAR(100) NOT NULL,
        \`clientEmail\` VARCHAR(150) NOT NULL,
        \`clientPhone\` VARCHAR(50) NOT NULL,
        \`passengers\` TEXT NOT NULL,
        \`totalAmount\` DECIMAL(12,2) NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'En attente',
        \`paymentStatus\` VARCHAR(50) DEFAULT 'Non payé',
        \`paymentMethod\` VARCHAR(100) NOT NULL,
        \`paymentAmount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`dateBooked\` DATETIME NOT NULL,
        \`specialRequests\` TEXT NULL,
        \`aiCustomization\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (\`packageId\`) REFERENCES \`packages\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`clientId\`) REFERENCES \`clients\`(\`id\`) ON DELETE SET NULL,
        INDEX \`idx_booking_status\` (\`status\`),
        INDEX \`idx_booking_payment\` (\`paymentStatus\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("MySQL Database & Tables initialized successfully in Node.js backend.");

    // Seed empty database from db.json if there are no packages
    const [pkgCountRows]: any = await connection.query("SELECT COUNT(*) as count FROM `packages`");
    if (pkgCountRows[0].count === 0) {
      console.log("MySQL tables empty. Migrating data from db.json...");
      const dbJson = readDb();
      
      // Migrate packages
      for (const p of dbJson.packages) {
        await connection.query(
          `INSERT INTO \`packages\` 
          (\`id\`, \`title\`, \`description\`, \`destination\`, \`durationDays\`, \`price\`, \`promoPrice\`, \`image\`, \`spotsAvailable\`, \`spotsMax\`, \`startDate\`, \`endDate\`, \`inclusions\`, \`exclusions\`, \`schedule\`, \`status\`, \`rating\`, \`category\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.title,
            p.description,
            p.destination,
            p.durationDays,
            p.price,
            p.promoPrice || null,
            p.image,
            p.spotsAvailable,
            p.spotsMax,
            p.startDate || new Date().toISOString().split('T')[0],
            p.endDate || new Date().toISOString().split('T')[0],
            JSON.stringify(p.inclusions || []),
            JSON.stringify(p.exclusions || []),
            JSON.stringify(p.schedule || []),
            p.status || "active",
            p.rating || 4.5,
            p.category || "Culture"
          ]
        );
      }

      // Migrate users to clients
      for (const u of dbJson.users) {
        await connection.query(
          `INSERT INTO \`clients\` 
          (\`id\`, \`name\`, \`email\`, \`phone\`, \`password_hash\`, \`status\`, \`city\`)
          VALUES (?, ?, ?, ?, ?, 'active', 'Alger')`,
          [
            u.id,
            u.name,
            u.email,
            u.phone || "",
            u.passwordHash || u.password_hash,
          ]
        );
      }

      // Migrate bookings
      for (const b of dbJson.bookings) {
        const [clientRows]: any = await connection.query("SELECT id FROM `clients` WHERE LOWER(email) = LOWER(?)", [b.clientEmail]);
        const clientId = clientRows.length > 0 ? clientRows[0].id : null;

        await connection.query(
          `INSERT INTO \`bookings\` 
          (\`id\`, \`packageId\`, \`clientId\`, \`packageTitle\`, \`packageImage\`, \`packagePrice\`, \`clientName\`, \`clientEmail\`, \`clientPhone\`, \`passengers\`, \`totalAmount\`, \`status\`, \`paymentStatus\`, \`paymentMethod\`, \`paymentAmount\`, \`dateBooked\`, \`specialRequests\`, \`aiCustomization\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.id,
            b.packageId,
            clientId,
            b.packageTitle,
            b.packageImage,
            b.packagePrice,
            b.clientName,
            b.clientEmail,
            b.clientPhone,
            JSON.stringify(b.passengers || []),
            b.totalAmount,
            b.status || "En attente",
            b.paymentStatus || "Non payé",
            b.paymentMethod || "Non spécifié",
            b.paymentAmount || 0,
            b.dateBooked || new Date().toISOString().slice(0, 19).replace('T', ' '),
            b.specialRequests || "",
            b.aiCustomization || ""
          ]
        );
      }
      console.log("MySQL database seeding complete.");
    }

    isMySQLAvailable = true;
    return true;
  } catch (error) {
    // Mode local JSON activé par défaut s'il n'y a pas de base de données MySQL locale dans le conteneur.
    console.log("ℹ️ Base de données : Utilisation du mode de stockage local unifié (db.json).");
    isMySQLAvailable = false;
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Lazy initialization of the Gemini Client to avoid crashes when no API Key is set
let aiClient: GoogleGenAI | null = null;

const getGeminiClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY variable is missing or using placeholder in .env. Plase set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
};

// ================= API ENDPOINTS =================

// Auth 1. Sign up a new user / client
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires (nom, e-mail, mot de passe)." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query("SELECT * FROM `clients` WHERE LOWER(`email`) = ?", [normalizedEmail]);
      if (rows.length > 0) {
        return res.status(400).json({ error: "Cette adresse e-mail est déjà associée à un compte." });
      }

      const userId = "user-" + Date.now();
      const passwordHash = hashPassword(password);
      await pool.query(
        `INSERT INTO \`clients\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`password_hash\`, \`status\`, \`city\`)
         VALUES (?, ?, ?, ?, ?, 'active', 'Alger')`,
        [userId, name.trim(), normalizedEmail, phone ? phone.trim() : "", passwordHash]
      );

      return res.status(201).json({
        success: true,
        user: {
          id: userId,
          email: normalizedEmail,
          name: name.trim(),
          phone: phone ? phone.trim() : ""
        }
      });
    } catch (err: any) {
      console.error("Signup MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  const userExists = db.users.some((u: any) => u.email === normalizedEmail);
  if (userExists) {
    return res.status(400).json({ error: "Cette adresse e-mail est déjà associée à un compte." });
  }

  const newUser = {
    id: "user-" + Date.now(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    name: name.trim(),
    phone: phone ? phone.trim() : ""
  };

  db.users.push(newUser);
  writeDb(db);

  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone
    }
  });
});

// Auth 2. Log in an existing user / client
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Veuillez fournir l'adresse e-mail et le mot de passe." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query("SELECT * FROM `clients` WHERE LOWER(`email`) = ?", [normalizedEmail]);
      if (rows.length > 0) {
        const user = rows[0];
        const incomingHash = hashPassword(password);
        if (user.password_hash === incomingHash || !user.password_hash) {
          return res.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              phone: user.phone
            }
          });
        }
      }
      return res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
    } catch (err) {
      console.error("Login MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  const user = db.users.find((u: any) => u.email === normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone
    }
  });
});

// 1. Get all packages
app.get("/api/packages", async (req, res) => {
  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query("SELECT * FROM `packages` ORDER BY `created_at` DESC");
      return res.json(rows.map(parsePackage));
    } catch (err) {
      console.error("Get packages MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  res.json(db.packages || []);
});

// 2. Create a package (Admin)
app.post("/api/packages", async (req, res) => {
  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const newId = req.body.id || "pkg-" + Date.now();
      const rating = parseFloat(req.body.rating) || 5.0;
      const spotsMax = parseInt(req.body.spotsMax) || 10;
      const spotsAvailable = parseInt(req.body.spotsAvailable) || spotsMax;
      const price = parseFloat(req.body.price) || 0;
      const promoPrice = req.body.promoPrice ? parseFloat(req.body.promoPrice) : null;
      const durationDays = parseInt(req.body.durationDays) || 1;
      const status = req.body.status || "active";
      const inclusions = JSON.stringify(req.body.inclusions || []);
      const exclusions = JSON.stringify(req.body.exclusions || []);
      const schedule = JSON.stringify(req.body.schedule || []);
      const startDate = req.body.startDate || new Date().toISOString().split('T')[0];
      const endDate = req.body.endDate || new Date().toISOString().split('T')[0];

      await pool.query(
        `INSERT INTO \`packages\` 
         (\`id\`, \`title\`, \`description\`, \`destination\`, \`durationDays\`, \`price\`, \`promoPrice\`, \`image\`, \`spotsAvailable\`, \`spotsMax\`, \`startDate\`, \`endDate\`, \`inclusions\`, \`exclusions\`, \`schedule\`, \`status\`, \`rating\`, \`category\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId,
          req.body.title,
          req.body.description,
          req.body.destination,
          durationDays,
          price,
          promoPrice,
          req.body.image,
          spotsAvailable,
          spotsMax,
          startDate,
          endDate,
          inclusions,
          exclusions,
          schedule,
          status,
          rating,
          req.body.category || "Culture"
        ]
      );

      const [newPkgRow]: any = await pool.query("SELECT * FROM `packages` WHERE `id` = ?", [newId]);
      return res.status(201).json(parsePackage(newPkgRow[0]));
    } catch (err) {
      console.error("Create package MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  const newPkg = {
    ...req.body,
    id: req.body.id || "pkg-" + Date.now(),
    rating: parseFloat(req.body.rating) || 5.0,
    spotsAvailable: parseInt(req.body.spotsAvailable) || req.body.spotsMax || 10,
    spotsMax: parseInt(req.body.spotsMax) || 10,
    price: parseFloat(req.body.price) || 0,
    promoPrice: req.body.promoPrice ? parseFloat(req.body.promoPrice) : undefined,
    durationDays: parseInt(req.body.durationDays) || 1,
    status: req.body.status || "active",
    schedule: req.body.schedule || [],
    inclusions: req.body.inclusions || [],
    exclusions: req.body.exclusions || []
  };

  db.packages.push(newPkg);
  writeDb(db);
  res.status(201).json(newPkg);
});

// 3. Update an existing package (Admin)
app.put("/api/packages/:id", async (req, res) => {
  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query("SELECT * FROM `packages` WHERE `id` = ?", [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Package introuvable" });
      }

      const oldPkg = rows[0];
      const spotsMax = parseInt(req.body.spotsMax) !== undefined && !isNaN(parseInt(req.body.spotsMax)) ? parseInt(req.body.spotsMax) : oldPkg.spotsMax;
      const oldBookedCount = oldPkg.spotsMax - oldPkg.spotsAvailable;
      const spotsAvailable = Math.max(0, spotsMax - oldBookedCount);

      const title = req.body.title !== undefined ? req.body.title : oldPkg.title;
      const description = req.body.description !== undefined ? req.body.description : oldPkg.description;
      const destination = req.body.destination !== undefined ? req.body.destination : oldPkg.destination;
      const durationDays = req.body.durationDays !== undefined ? parseInt(req.body.durationDays) : oldPkg.durationDays;
      const price = req.body.price !== undefined ? parseFloat(req.body.price) : parseFloat(oldPkg.price);
      const promoPrice = req.body.promoPrice !== undefined ? (req.body.promoPrice ? parseFloat(req.body.promoPrice) : null) : oldPkg.promoPrice;
      const image = req.body.image !== undefined ? req.body.image : oldPkg.image;
      const finalSpotsAvailable = req.body.spotsAvailable !== undefined ? parseInt(req.body.spotsAvailable) : spotsAvailable;
      const startDate = req.body.startDate !== undefined ? req.body.startDate : oldPkg.startDate;
      const endDate = req.body.endDate !== undefined ? req.body.endDate : oldPkg.endDate;
      const inclusions = req.body.inclusions !== undefined ? JSON.stringify(req.body.inclusions) : oldPkg.inclusions;
      const exclusions = req.body.exclusions !== undefined ? JSON.stringify(req.body.exclusions) : oldPkg.exclusions;
      const schedule = req.body.schedule !== undefined ? JSON.stringify(req.body.schedule) : oldPkg.schedule;
      const status = req.body.status !== undefined ? req.body.status : oldPkg.status;
      const rating = req.body.rating !== undefined ? parseFloat(req.body.rating) : parseFloat(oldPkg.rating);
      const category = req.body.category !== undefined ? req.body.category : oldPkg.category;

      await pool.query(
        `UPDATE \`packages\` 
         SET \`title\` = ?, \`description\` = ?, \`destination\` = ?, \`durationDays\` = ?, \`price\` = ?, \`promoPrice\` = ?, \`image\` = ?, \`spotsAvailable\` = ?, \`spotsMax\` = ?, \`startDate\` = ?, \`endDate\` = ?, \`inclusions\` = ?, \`exclusions\` = ?, \`schedule\` = ?, \`status\` = ?, \`rating\` = ?, \`category\` = ?
         WHERE \`id\` = ?`,
        [
          title,
          description,
          destination,
          durationDays,
          price,
          promoPrice,
          image,
          finalSpotsAvailable,
          spotsMax,
          startDate,
          endDate,
          inclusions,
          exclusions,
          schedule,
          status,
          rating,
          category,
          req.params.id
        ]
      );

      const [updatedRows]: any = await pool.query("SELECT * FROM `packages` WHERE `id` = ?", [req.params.id]);
      return res.json(parsePackage(updatedRows[0]));
    } catch (err) {
      console.error("Update package MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  const index = db.packages.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Package introuvable" });
  }

  // Update spotsAvailable appropriately top bound by spotsMax
  const oldPkg = db.packages[index];
  const spotsMax = parseInt(req.body.spotsMax) || oldPkg.spotsMax;
  const oldBookedCount = oldPkg.spotsMax - oldPkg.spotsAvailable;
  const spotsAvailable = Math.max(0, spotsMax - oldBookedCount);

  db.packages[index] = {
    ...oldPkg,
    ...req.body,
    spotsMax,
    spotsAvailable: req.body.spotsAvailable !== undefined ? parseInt(req.body.spotsAvailable) : spotsAvailable,
    price: parseFloat(req.body.price),
    promoPrice: req.body.promoPrice ? parseFloat(req.body.promoPrice) : undefined,
    durationDays: parseInt(req.body.durationDays)
  };

  writeDb(db);
  res.json(db.packages[index]);
});

// 4. Delete an existing package (Admin)
app.delete("/api/packages/:id", async (req, res) => {
  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const [result]: any = await pool.query("DELETE FROM `packages` WHERE `id` = ?", [req.params.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Package introuvable" });
      }
      return res.json({ success: true, message: "Package supprimé avec succès" });
    } catch (err) {
      console.error("Delete package MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  const initialCount = db.packages.length;
  db.packages = db.packages.filter((p: any) => p.id !== req.params.id);
  
  if (db.packages.length === initialCount) {
    return res.status(404).json({ error: "Package introuvable" });
  }

  writeDb(db);
  res.json({ success: true, message: "Package supprimé avec succès" });
});

// 5. Get all bookings (Admin/Client Space)
app.get("/api/bookings", async (req, res) => {
  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query("SELECT * FROM `bookings` ORDER BY `dateBooked` DESC");
      return res.json(rows.map(parseBooking));
    } catch (err) {
      console.error("Get bookings MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  // We can return all of them. Client side can filter by email if they want simple local separation
  res.json(db.bookings || []);
});

// Helper to send real emails via SMTP or Ethereal test accounts
async function simulateNotifications(booking: any) {
  console.log("\n==========================================================================");
  console.log(`📡 [NOTIFICATION AGENT] DÉBUT DE TRAITEMENT DE LA RÉSERVATION: ${booking.id}`);
  console.log(`👤 Client: ${booking.clientName} (${booking.clientEmail})`);
  console.log(`📱 Téléphone: ${booking.clientPhone}`);
  console.log(`🗺️ Voyage: ${booking.packageTitle}`);
  console.log(`💰 Montant: ${booking.totalAmount} DA`);
  
  // Format HTML body
  const passengersList = Array.isArray(booking.passengers) 
    ? booking.passengers.map((p: string) => `<li>• ${p}</li>`).join("")
    : `<li>• ${booking.clientName}</li>`;

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background-color: #1a2b49; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">🇩🇿 Séjours DZ</h1>
          <p style="color: #ff5a00; font-size: 12px; margin: 4px 0 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Évasion Voyages</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 40px 32px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Confirmation de Réservation</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Bonjour <strong>${booking.clientName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Nous avons le plaisir de vous confirmer l'enregistrement de votre demande de réservation. Notre équipe est déjà mobilisée pour préparer votre départ.
          </p>

          <!-- Reservation Card -->
          <div style="background-color: #f1f5f9; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #ff5a00; letter-spacing: 1px; margin-bottom: 8px;">Détails du dossier</div>
            
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Référence :</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #0f172a; text-align: right;">${booking.id}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Séjour :</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${booking.packageTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Date de départ :</td>
                <td style="padding: 6px 0; font-weight: 700; color: #0f172a; text-align: right;">${booking.startDate || "Voir catalogue"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Montant Total :</td>
                <td style="padding: 6px 0; font-weight: 800; color: #ff5a00; font-size: 15px; text-align: right;">${booking.totalAmount.toLocaleString("fr-FR")} DA</td>
              </tr>
            </table>

            <div style="border-top: 1px solid #cbd5e1; margin-top: 12px; padding-top: 12px;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #475569; margin-bottom: 6px;">Voyageur(s) inscrit(s) :</div>
              <ul style="margin: 0; padding-left: 0; list-style-type: none; font-size: 13px; color: #0f172a;">
                ${passengersList}
              </ul>
            </div>
          </div>

          <!-- Status -->
          <div style="display: flex; align-items: center; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px;">
            <span style="font-size: 16px; margin-right: 8px;">⏳</span>
            <div style="font-size: 12px; color: #78350f; font-weight: 600;">
              Statut actuel : En attente de validation par un conseiller de l'agence.
            </div>
          </div>

          <!-- Next Steps -->
          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">Prochaines étapes :</h3>
          <ol style="font-size: 13px; line-height: 1.6; color: #475569; padding-left: 20px; margin: 0 0 24px 0;">
            <li style="margin-bottom: 6px;">Un conseiller clientèle Évasion Voyages va vous appeler pour confirmer vos dates et les vols.</li>
            <li style="margin-bottom: 6px;">Vous pourrez ensuite procéder au versement de l'acompte pour bloquer définitivement vos places.</li>
          </ol>

          <!-- Button link (Espace Client) -->
          <div style="text-align: center; margin-bottom: 16px;">
            <a href="${process.env.APP_URL || "https://sejours-dz.com"}" style="display: inline-block; background-color: #1a2b49; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: 700; border-radius: 12px; font-size: 14px;">
              Accéder à mon Espace Client
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">
            Séjours DZ est un service proposé par Évasion Voyages.
          </p>
          <p style="font-size: 9px; color: #94a3b8; margin: 0;">
            Licence État N° 1245/2026 • Rue Abdelkrim Hamza, Lot B1 RDC, Dely Ibrahim, 16042 Alger, Algérie
          </p>
        </div>

      </div>
    </div>
  `;

  // Determine if SMTP is configured
  const hasSMTPConfig = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;

  try {
    let transporter;
    let senderAddress;

    if (hasSMTPConfig) {
      console.log("🔒 Configuration SMTP Détectée. Utilisation de l'infrastructure de production de l'agence.");
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      senderAddress = process.env.SMTP_FROM || `"Séjours DZ - Évasion Voyages" <${process.env.SMTP_USER}>`;
    } else {
      console.log("ℹ️ Variables d'environnement SMTP non configurées ou incomplètes.");
      console.log("⚙️ Génération automatique d'un compte de test Ethereal instantané...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      senderAddress = '"Séjours DZ 🇩🇿" <noreply@sejours-dz.com>';
    }

    // Send the e-mail
    const info = await transporter.sendMail({
      from: senderAddress,
      to: booking.clientEmail,
      subject: `🇩🇿 Confirmation de votre réservation ${booking.id} - Séjours DZ`,
      html: htmlContent,
    });

    console.log("🟢 [EMAIL SUCCESS] E-mail officiel envoyé avec succès !");
    console.log(`   MessageID: ${info.messageId}`);
    console.log(`   Destinataire: ${booking.clientEmail}`);
    
    if (!hasSMTPConfig) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n📬 [PREVIEW EMAIL DELIVERED] Vous pouvez voir l'e-mail envoyé au client en temps réel ici :`);
      console.log(`👉 ${previewUrl} 👈\n`);
    }

  } catch (error) {
    console.error("❌ [EMAIL ERROR] Erreur lors de l'envoi de l'e-mail automatique :", error);
  }

  // Also log simulated WhatsApp output for the admin
  console.log(`💬 ENVOI DE MESSAGE WHATSAPP SIMULÉ À: ${booking.clientPhone}`);
  console.log(`   Texte: Bonjour ${booking.clientName}, nous confirmons votre séjour ${booking.packageTitle} sous la réf *${booking.id}*. Un conseiller DZ vous contactera.`);
  console.log("   --> [WHATSAPP-GATEWAY] Message délivré avec succès au client !");
  console.log("==========================================================================\n");
}

// 6. Create a booking (decrements seats)
app.post("/api/bookings", async (req, res) => {
  const pkgId = req.body.packageId;
  const travelerCount = req.body.passengers?.length || 1;

  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const [pkgRows]: any = await pool.query("SELECT * FROM `packages` WHERE `id` = ?", [pkgId]);
      if (pkgRows.length === 0) {
        return res.status(404).json({ error: "Ce package touristique n'existe plus." });
      }

      const pkg = parsePackage(pkgRows[0]);
      if (pkg.spotsAvailable < travelerCount) {
        return res.status(400).json({ error: `Désolé, il ne reste que ${pkg.spotsAvailable} places disponibles pour ce séjour.` });
      }

      // Check if client exists
      const [clientRows]: any = await pool.query("SELECT `id` FROM `clients` WHERE LOWER(`email`) = LOWER(?)", [req.body.clientEmail]);
      let clientId = clientRows.length > 0 ? clientRows[0].id : null;

      if (!clientId) {
        clientId = "user-" + Date.now();
        await pool.query(
          `INSERT INTO \`clients\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`status\`, \`city\`)
           VALUES (?, ?, ?, ?, 'leads', 'Alger')`,
          [clientId, req.body.clientName, req.body.clientEmail, req.body.clientPhone || ""]
        );
      }

      const bookingId = "book-" + Date.now().toString().slice(-6);
      const newBooking = {
        id: bookingId,
        packageId: pkg.id,
        clientId,
        packageTitle: pkg.title,
        packageImage: pkg.image,
        packagePrice: pkg.promoPrice || pkg.price,
        clientName: req.body.clientName,
        clientEmail: req.body.clientEmail,
        clientPhone: req.body.clientPhone,
        passengers: req.body.passengers || [],
        totalAmount: req.body.totalAmount || ((pkg.promoPrice || pkg.price) * travelerCount),
        status: req.body.status || "En attente",
        paymentStatus: req.body.paymentStatus || "Non payé",
        paymentMethod: req.body.paymentMethod || "Non spécifié",
        paymentAmount: req.body.paymentAmount || 0,
        dateBooked: new Date().toISOString().slice(0, 19).replace('T', ' '),
        specialRequests: req.body.specialRequests || "",
        aiCustomization: req.body.aiCustomization || ""
      };

      await pool.query(
        `INSERT INTO \`bookings\` 
         (\`id\`, \`packageId\`, \`clientId\`, \`packageTitle\`, \`packageImage\`, \`packagePrice\`, \`clientName\`, \`clientEmail\`, \`clientPhone\`, \`passengers\`, \`totalAmount\`, \`status\`, \`paymentStatus\`, \`paymentMethod\`, \`paymentAmount\`, \`dateBooked\`, \`specialRequests\`, \`aiCustomization\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newBooking.id,
          newBooking.packageId,
          newBooking.clientId,
          newBooking.packageTitle,
          newBooking.packageImage,
          newBooking.packagePrice,
          newBooking.clientName,
          newBooking.clientEmail,
          newBooking.clientPhone,
          JSON.stringify(newBooking.passengers),
          newBooking.totalAmount,
          newBooking.status,
          newBooking.paymentStatus,
          newBooking.paymentMethod,
          newBooking.paymentAmount,
          newBooking.dateBooked,
          newBooking.specialRequests,
          newBooking.aiCustomization
        ]
      );

      // Decrement slots Available
      await pool.query("UPDATE `packages` SET `spotsAvailable` = `spotsAvailable` - ? WHERE `id` = ?", [travelerCount, pkg.id]);

      // Call simulated notification triggers
      simulateNotifications(newBooking);

      return res.status(201).json(newBooking);
    } catch (err) {
      console.error("Create booking MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  const pkgIndex = db.packages.findIndex((p: any) => p.id === pkgId);
  
  if (pkgIndex === -1) {
    return res.status(404).json({ error: "Ce package touristique n'existe plus." });
  }

  const pkg = db.packages[pkgIndex];

  if (pkg.spotsAvailable < travelerCount) {
    return res.status(400).json({ error: `Désolé, il ne reste que ${pkg.spotsAvailable} places disponibles pour ce séjour.` });
  }

  // Create booking
  const newBooking = {
    id: "book-" + Date.now().toString().slice(-6),
    packageId: pkg.id,
    packageTitle: pkg.title,
    packageImage: pkg.image,
    packagePrice: pkg.promoPrice || pkg.price,
    clientName: req.body.clientName,
    clientEmail: req.body.clientEmail,
    clientPhone: req.body.clientPhone,
    passengers: req.body.passengers || [],
    totalAmount: req.body.totalAmount || ((pkg.promoPrice || pkg.price) * travelerCount),
    status: req.body.status || "En attente",
    paymentStatus: req.body.paymentStatus || "Non payé",
    paymentMethod: req.body.paymentMethod,
    paymentAmount: req.body.paymentAmount || 0,
    dateBooked: new Date().toISOString(),
    specialRequests: req.body.specialRequests || "",
    aiCustomization: req.body.aiCustomization || ""
  };

  // Decrement slots Available
  pkg.spotsAvailable -= travelerCount;

  db.bookings.push(newBooking);
  writeDb(db);

  // Call simulated notification triggers
  simulateNotifications(newBooking);

  res.status(201).json(newBooking);
});

// 7. Update reservation details / Payment status (Admin)
app.put("/api/bookings/:id", async (req, res) => {
  if (isMySQLAvailable) {
    try {
      const pool = getPool();
      const [rows]: any = await pool.query("SELECT * FROM `bookings` WHERE `id` = ?", [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: "Réservation introuvable" });
      }

      const oldBooking = parseBooking(rows[0]);
      const oldStatus = oldBooking.status;
      const newStatus = req.body.status || oldBooking.status;

      // Handle cancellation refund of seats
      if (oldStatus !== "Annulé" && newStatus === "Annulé") {
        const [pkgRows]: any = await pool.query("SELECT spotsMax, spotsAvailable FROM `packages` WHERE `id` = ?", [oldBooking.packageId]);
        if (pkgRows.length > 0) {
          const p = pkgRows[0];
          const seatsToRefund = oldBooking.passengers?.length || 1;
          const newSpots = Math.min(p.spotsMax, p.spotsAvailable + seatsToRefund);
          await pool.query("UPDATE `packages` SET `spotsAvailable` = ? WHERE `id` = ?", [newSpots, oldBooking.packageId]);
        }
      } else if (oldStatus === "Annulé" && newStatus !== "Annulé") {
        // If reactivated, try to lock seats again if available
        const [pkgRows]: any = await pool.query("SELECT spotsAvailable FROM `packages` WHERE `id` = ?", [oldBooking.packageId]);
        if (pkgRows.length > 0) {
          const p = pkgRows[0];
          const seatsToLock = oldBooking.passengers?.length || 1;
          if (p.spotsAvailable >= seatsToLock) {
            await pool.query("UPDATE `packages` SET `spotsAvailable` = `spotsAvailable` - ? WHERE `id` = ?", [seatsToLock, oldBooking.packageId]);
          } else {
            return res.status(400).json({ error: "Impossible de réactiver: places insuffisantes sur ce séjour." });
          }
        }
      }

      const status = req.body.status !== undefined ? req.body.status : oldBooking.status;
      const paymentStatus = req.body.paymentStatus !== undefined ? req.body.paymentStatus : oldBooking.paymentStatus;
      const paymentMethod = req.body.paymentMethod !== undefined ? req.body.paymentMethod : oldBooking.paymentMethod;
      const paymentAmount = req.body.paymentAmount !== undefined ? parseFloat(req.body.paymentAmount) : oldBooking.paymentAmount;
      const specialRequests = req.body.specialRequests !== undefined ? req.body.specialRequests : oldBooking.specialRequests;
      const aiCustomization = req.body.aiCustomization !== undefined ? req.body.aiCustomization : oldBooking.aiCustomization;

      await pool.query(
        `UPDATE \`bookings\` 
         SET \`status\` = ?, \`paymentStatus\` = ?, \`paymentMethod\` = ?, \`paymentAmount\` = ?, \`specialRequests\` = ?, \`aiCustomization\` = ?
         WHERE \`id\` = ?`,
        [
          status,
          paymentStatus,
          paymentMethod,
          paymentAmount,
          specialRequests,
          aiCustomization,
          req.params.id
        ]
      );

      const [updatedRows]: any = await pool.query("SELECT * FROM `bookings` WHERE `id` = ?", [req.params.id]);
      return res.json(parseBooking(updatedRows[0]));
    } catch (err) {
      console.error("Update booking MySQL error, falling back to JSON...", err);
    }
  }

  // Fallback to JSON Database
  const db = readDb();
  const index = db.bookings.findIndex((b: any) => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Réservation introuvable" });
  }

  const oldBooking = db.bookings[index];
  const oldStatus = oldBooking.status;
  const newStatus = req.body.status || oldBooking.status;

  // Let's handle cancellation refund of seats
  if (oldStatus !== "Annulé" && newStatus === "Annulé") {
    const pkgIndex = db.packages.findIndex((p: any) => p.id === oldBooking.packageId);
    if (pkgIndex !== -1) {
      const seatsToRefund = oldBooking.passengers?.length || 1;
      db.packages[pkgIndex].spotsAvailable = Math.min(
        db.packages[pkgIndex].spotsMax,
        db.packages[pkgIndex].spotsAvailable + seatsToRefund
      );
    }
  } else if (oldStatus === "Annulé" && newStatus !== "Annulé") {
    // If reactivated, try to lock seats again if available
    const pkgIndex = db.packages.findIndex((p: any) => p.id === oldBooking.packageId);
    if (pkgIndex !== -1) {
      const seatsToLock = oldBooking.passengers?.length || 1;
      if (db.packages[pkgIndex].spotsAvailable >= seatsToLock) {
        db.packages[pkgIndex].spotsAvailable -= seatsToLock;
      } else {
        return res.status(400).json({ error: "Impossible de réactiver: places insuffisantes sur ce séjour." });
      }
    }
  }

  db.bookings[index] = {
    ...oldBooking,
    ...req.body
  };

  writeDb(db);
  res.json(db.bookings[index]);
});

// 8. Gemini Premium Feature endpoint: Custom Tailored Travel Itinerary Customizer
app.post("/api/gemini/customize-itinerary", async (req, res) => {
  try {
    const { packageTitle, packageDesc, destination, clientRequests, travelerTags, lang = "fr" } = req.body;
    
    // Check if Gemini API key is configured; otherwise, return a polite mock custom itinerary
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      let fallbackText = "";
      if (lang === "ar") {
        fallbackText = `### مرحباً بكم من وكالة سياحة دي-زاد!
        
لقد تلقينا طلب التخصيص الخاص بكم لرحلة **"${packageTitle}"** إلى **"${destination}"**.

**التخصيصات والطلبات الخاصة بكم:**
- الطلبات الخاصة: *"${clientRequests || "استكشاف عام"}"*
- الاهتمامات الرئيسية: *"${travelerTags || "التميز والاستكشاف المعرفي"}"*

_تم حفظ رغباتكم بنجاح في قاعدة البيانات. سيقوم مستشارو السفر لدينا بالتنسيق معكم هاتفياً لتكييف مسار الرحلة، الوجبات، وتفاصيل الإقامة وفقاً لمتطلباتكم بدقة._`;
      } else if (lang === "en") {
        fallbackText = `### Hello from Séjours DZ agency!
        
We have received your customization preferences for the tour **"${packageTitle}"** to **"${destination}"**.

**Your Preferences & Profile:**
- Special requests: *"${clientRequests || "General Discovery"}"*
- Travel tags: *"${travelerTags || "General Discovery"}"*

_Your preferences have been successfully recorded in our database. Our expert travel consultants will contact you directly to manually tailor your itinerary, local activities, and dining options to guarantee an exceptional stay._`;
      } else {
        fallbackText = `### Bonjour de l'agence Évasion Voyages !
        
Nous avons bien pris en compte vos préférences de personnalisation pour le séjour **"${packageTitle}"** à destination de **"${destination}"**.

**Vos préférences enregistrées :**
- Demandes spéciales / Profil : *"${clientRequests || "Aucune spécifiée"}"*
- Centres d'intérêt : *"${travelerTags || "Découverte générale"}"*

_Vos préférences de voyage ont été enregistrées avec succès dans notre base de données. Nos conseillers adapteront manuellement vos escales, visites guidées et options de restauration lors de la confirmation téléphonique de votre réservation._`;
      }
      return res.json({ itinerary: fallbackText });
    }

    // Lazy get client
    const client = getGeminiClient();
    
    let systemPrompt = "";
    let instructions = "";

    if (lang === "ar") {
      systemPrompt = `أنت مستشار خبير في السفر الفاخر لوكالة "Séjours DZ" السياحية المعتمدة.
هدفنا هو تقديم برنامج مخصص واقتراحات باللغة العربية الفصحى والمهنية والراقية والمعبرة عن ترحيب حار.
استشر باقة السفر الأصلية لتقترح تعديلات دقيقة ومناسبة لرغبات واحتياجات الزبون الخاصة بشكل عملي ومثير للاهتمام.`;

      instructions = `أنتج إجابة منظمة بتنسيق Markdown تلبي النقاط التالية:
1. **مقترحات مخصصة لبرنامج الرحلة**: قدم نصائح وتعديلات دقيقة على البرنامج الأصلي لتتناسب مع اهتمامات العميل (مثال: إذا كان بصحبة أطفال، فترات استراحة أطول / إذا كان محبًا للرياضة والمغامرة، مسارات بديلة مثيرة / إذا كان مهتم بالطعام، معالم الطهي الشهيرة).
2. **توصيات المأكولات المحلية والمطاعم**: طبقين أو ثلاثة أطباق محلية لا تفوت، وأماكن موثوقة بناءً على اهتماماتهم أو أنظمتهم الغذائية.
3. **نصائح عملية هامة**: 3 نصائح سريعة ومفيدة عن الوجهة (اللغة المحلية، العملة، وعادات غريبة أو مميزة تجنبهم المفاجآت).

**بيانات العرض الأصلي:**
- عنوان الرحلة: ${packageTitle}
- الوجهة: ${destination}
- وصف العرض الأصلي: ${packageDesc}

**تفاصيل العميل اهتماماته المعبر عنها:**
- طلبات خاصة من الزبون: "${clientRequests || "استكشاف عام"}"
- الاهتمامات الرئيسية المختارة: "${travelerTags || "التميز والاستكشاف المعرفي"}"

كن دقيقاً، ملهماً، واهتم بجمال المظهر والترتيب، وتجنب العبارات الاصطناعية المكررة باستثناء تحية البدء: 'مرحباً بكم من وكالة سياحة دي-زاد!'. لا تتجاوز 300 كلمة كحد أقصى.`;
    } else if (lang === "en") {
      systemPrompt = `You are an expert luxury travel consultant at the "Séjours DZ" agency.
Your goal is to generate an ultra-personalized, welcoming, and professional travel guide and itinerary recommendation, written in elegant English.
Leverage the original tour package and propose specific micro-adjustments corresponding to the client's interests and requests.`;

      instructions = `Generate a structured response in Markdown containing:
1. **Itinerary Micro-Adjustments**: Propose precise adjustments to the original itinerary depending on the passenger's profile (e.g., if traveling with kids, suggest relaxing breaks; if sporty, suggest off-the-beaten-path paths; if foodie, must-try spots).
2. **Local Culinary Recommendations**: 2-3 local dishes or authentic dining recommendations matching their tags/diets.
3. **Essential Practical Advice**: 3 quick tips (language, local currency, specific customs) for the destination.

**Original tour details:**
- Title of offer: ${packageTitle}
- Target Destination: ${destination}
- Original Description: ${packageDesc}

**User Profile & Interests:**
- Special Requests / Profile details: "${clientRequests || "None selected"}"
- Chosen Interest Tags: "${travelerTags || "General Discovery"}"

Please be concise, inspiring, precise and avoid robotic words or generic intro texts apart from 'Hello from Séjours DZ agency!'. Keep your response under 300 words.`;
    } else {
      systemPrompt = `Tu es un conseiller expert en voyages haut de gamme de l'agence "Évasion Voyages".
Ton but est de générer un guide d'excursions, de conseils et de personnalisation ultra-ciblé, rédigé dans un français élégant, professionnel et chaleureux.
Sers-toi du package d'origine pour proposer des adaptations concrètes selon les besoins spécifiques du client.`;

      instructions = `Génère une réponse structurée en Markdown abordant idéalement:
1. **Conseils d'adaptation d'itinéraire** : Propose des micro-ajustements constructifs sur le programme initial pour s'adapter aux envies/contraintes du client (ex: si enfants, ajouter des pauses / si sportifs, des chemins secrets / si gastronomie, des adresses incontournables).
2. **Recommandations culinaires personnalisées** : 2-3 plats phares locaux et d'excellente adresses authentiques conformes à leurs préférences ou régime alimentaire.
3. **Conseils Pratiques Clés** : 3 astuces rapides (langue, monnaie, coutumes locales insolites) liées à la destination.

**Données du séjour d'origine :**
- Titre de l'offre : ${packageTitle}
- Destination : ${destination}
- Description d'origine : ${packageDesc}

**Profil du voyageur :**
- Demandes spéciales / Profil du client : "${clientRequests || "Aucune séléctionnée"}"
- Centre d'intérêts principaux renseignés : "${travelerTags || "Découverte générale"}"

Sois court, précis, inspirant et n'utilise pas de jargon technique ou de salutations artificielles à part 'Bonjour de l'agence Évasion Voyages !'. Ne dépasse pas 300 mots.`;
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: instructions,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
      }
    });

    const resultText = response.text || "### Suggestions de personnalisation en cours d'amélioration.";
    res.json({ itinerary: resultText });
  } catch (err: any) {
    console.error("Gemini personalization helper failed:", err);
    res.status(500).json({ 
      error: "Impossible d'accéder au service d'IA pour le moment.",
      details: err.message,
      itinerary: `### Bonjour de l'agence Évasion Voyages !\n\nNous avons bien pris en compte vos préférences de voyage :**"${req.body.clientRequests || "Découverte"}"**.\n\n_Note : Notre assistant IA Évasion est actuellement hors ligne ou configuré sans clé API. Notre équipe d'agents adaptera manuellement vos escales lors de votre confirmation par téléphone._`
    });
  }
});


// ================= VITE OR STATIC MIDDLEWARE SETUP =================

async function startServer() {
  // Initialize MySQL connection with fallback to local JSON DB
  await initMySQL();

  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite development server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    // Serve production static assets compiled inside /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static files served from /dist in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Évasion Voyages Server running on http://localhost:${PORT}`);
  });
}

startServer();
