# 🇩🇿 Séjours DZ — Guide de Configuration des Notifications (WhatsApp & E-mail)

Ce guide explique le fonctionnement du système de notification de réservation pour **Séjours DZ / Évasion Voyages** et comment configurer des envois automatisés en production.

---

## 🚀 1. Fonctionnement Actuel (Hybride Client-Serveur)

Pour offrir une expérience fluide, réactive et sans surcoût financier d'infrastructure par défaut, l'application intègre un **double système de notification** :

### A. Notifications Intégrées au Navigateur (Une seule action)
Dès qu'un client ou un administrateur finalise une réservation, un bandeau vert dynamique apparaît à l'écran avec deux boutons d'action rapide :
1. **Bouton WhatsApp** : Nettoie automatiquement le numéro de téléphone saisi (ajoute l'indicatif national `+213` de l'Algérie si le numéro commence par `0` ou s'il fait 9 chiffres) et ouvre l'API officielle de WhatsApp avec un message hautement personnalisé pré-rempli (référence, séjour, nombre de passagers, prix total en Dinars Algériens, etc.).
2. **Bouton E-mail** : Génère un lien `mailto:` pré-rempli ouvrant le client de messagerie local (Outlook, Gmail, Mail sur Mac/Mobile) avec le sujet officiel de confirmation de l'agence et un corps de message formaté de manière professionnelle.

### B. Simulation Côté Serveur (Logs techniques de contrôle)
Lors de l'enregistrement en base de données, les serveurs exécutent des déclencheurs simulés :
* **Node.js (`server.ts`)** : La fonction `simulateNotifications(booking)` écrit les détails complets de la notification dans la console du conteneur.
* **PHP (`php-database/api.php`)** : Un log système (`error_log`) est généré pour tracer l'envoi.

---

## 📧 2. Automatisation de l'Envoi d'E-mails en Production

Pour que les e-mails s'envoient **100% automatiquement en arrière-plan** sans action humaine, vous devez connecter le serveur à un serveur de messagerie (SMTP ou API transactionnelle).

### Option A : Dans le serveur Node.js (`server.ts`)

Nous recommandons l'utilisation du package standard **Nodemailer**.

1. Installez le package dans le projet :
   ```bash
   npm install nodemailer
   npm install --save-dev @types/nodemailer
   ```

2. Ajoutez les variables d'environnement dans votre fichier `.env` ou dans le panneau de configuration :
   ```env
   SMTP_HOST="smtp.vos-serveurs-agence.com"
   SMTP_PORT=465
   SMTP_USER="reservation@evasion-voyages-dz.com"
   SMTP_PASS="votre_mot_de_passe_securise"
   ```

3. Modifiez la fonction de notification dans `server.ts` :
   ```typescript
   import nodemailer from "nodemailer";

   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT || "465"),
     secure: true, // true pour le port 465, false pour les autres ports
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   });

   async function sendProductionEmail(booking: any) {
     const mailOptions = {
       from: `"Séjours DZ - Évasion Voyages" <${process.env.SMTP_USER}>`,
       to: booking.clientEmail,
       subject: `Confirmation de votre demande de réservation ${booking.id} - Séjours DZ`,
       text: `Bonjour ${booking.clientName},\n\nVotre demande de réservation a bien été enregistrée sous la référence ${booking.id}...\n\nL'équipe Séjours DZ`,
       html: `
         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
           <h2 style="color: #047857;">🇩🇿 Réservation Confirmée !</h2>
           <p>Bonjour <strong>${booking.clientName}</strong>,</p>
           <p>Nous vous remercions pour votre intérêt pour nos voyages d'exception avec Séjours DZ.</p>
           <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; margin: 15px 0;">
             <p style="margin: 4px 0;"><strong>Référence :</strong> ${booking.id}</p>
             <p style="margin: 4px 0;"><strong>Séjour :</strong> ${booking.packageTitle}</p>
             <p style="margin: 4px 0;"><strong>Date de départ :</strong> ${booking.startDate}</p>
             <p style="margin: 4px 0;"><strong>Prix total :</strong> ${booking.totalAmount.toLocaleString("fr-FR")} DA</p>
           </div>
           <p>Un conseiller clientèle va prendre contact avec vous sous 24 heures pour finaliser votre dossier.</p>
           <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
           <p style="font-size: 11px; color: #64748b;">Évasion Voyages S.A.S. - Licence d'État N° 1245/2026</p>
         </div>
       `
     };

     try {
       await transporter.sendMail(mailOptions);
       console.log(`📧 E-mail envoyé avec succès à ${booking.clientEmail}`);
     } catch (error) {
       console.error("❌ Échec de l'envoi de l'e-mail :", error);
     }
   }
   ```

### Option B : Dans le backend PHP (`php-database/api.php`)

Pour le serveur PHP, utilisez la bibliothèque de référence **PHPMailer** pour garantir la délivrabilité des e-mails.

```php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'path/to/PHPMailer/src/Exception.php';
require 'path/to/PHPMailer/src/PHPMailer.php';
require 'path/to/PHPMailer/src/SMTP.php';

$mail = new PHPMailer(true);

try {
    // Configuration SMTP
    $mail->isSMTP();
    $mail->Host       = 'smtp.vos-serveurs-agence.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'reservation@evasion-voyages-dz.com';
    $mail->Password   = 'votre_mot_de_passe_securise';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;

    // Destinataires
    $mail->setFrom('reservation@evasion-voyages-dz.com', 'Sejours DZ');
    $mail->addAddress($request_data['clientEmail'], $request_data['clientName']);

    // Contenu
    $mail->isHTML(true);
    $mail->Subject = "Confirmation de reservation " . $bookingId;
    $mail->Body    = "<h1>Confirmation</h1><p>Bonjour " . htmlspecialchars($request_data['clientName']) . ", votre reservation est bien enregistree.</p>";

    $mail->send();
} catch (Exception $e) {
    error_log("PHPMailer Error: " . $mail->ErrorInfo);
}
```

---

## 💬 3. Automatisation de l'Envoi WhatsApp en Production

Pour envoyer des messages WhatsApp automatiquement en tâche de fond (sans ouvrir l'application WhatsApp de l'utilisateur), vous devez utiliser une API de passerelle.

### Option A : API Professionnelle Cloud WhatsApp de Meta (Recommandé)
C'est la solution officielle la plus stable et approuvée par Meta. Elle nécessite un compte Meta Business Manager.

1. **Variables d'environnement requises** :
   ```env
   WHATSAPP_PHONE_NUMBER_ID="votre_phone_number_id"
   WHATSAPP_ACCESS_TOKEN="votre_token_d_acces_permanent"
   WHATSAPP_TEMPLATE_NAME="confirmation_reservation_dz" # Les modèles doivent être pré-approuvés
   ```

2. **Code d'intégration Node.js (`server.ts`)** :
   ```typescript
   async function sendWhatsAppTemplate(booking: any) {
     const phone = cleanPhoneNumber(booking.clientPhone); // ex: 213555123456
     const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

     const payload = {
       messaging_product: "whatsapp",
       to: phone,
       type: "template",
       template: {
         name: process.env.WHATSAPP_TEMPLATE_NAME,
         language: { code: "fr" },
         components: [
           {
             type: "body",
             parameters: [
               { type: "text", text: booking.clientName },
               { type: "text", text: booking.id },
               { type: "text", text: booking.packageTitle },
               { type: "text", text: `${booking.totalAmount} DA` }
             ]
           }
         ]
       }
     };

     try {
       const res = await fetch(url, {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
           "Content-Type": "application/json"
         },
         body: JSON.stringify(payload)
       });
       const data = await res.json();
       console.log("💬 Réponse API WhatsApp Meta :", data);
     } catch (err) {
       console.error("❌ Échec d'envoi WhatsApp Meta :", err);
     }
   }
   ```

### Option B : Passerelle API Virtuelle (Twilio ou Passerelles Locales / Baileys / Unofficial APIs)
Si vous souhaitez envoyer des messages texte libres et personnalisés sans faire approuver des modèles par Facebook :

1. **Via Twilio (API payante facile d'utilisation)** :
   Installez le package `twilio`, configurez votre `TWILIO_ACCOUNT_SID` et `TWILIO_AUTH_TOKEN`, puis envoyez un message via la Sandbox ou votre numéro professionnel :
   ```typescript
   import twilio from "twilio";
   const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

   client.messages.create({
     from: "whatsapp:+14155238886", // Numéro sandbox Twilio
     to: `whatsapp:${phone}`,
     body: `Bonjour ${booking.clientName}, votre réservation ${booking.id} est enregistrée.`
   });
   ```

2. **Via un script hébergé localement (ex: `whatsapp-web.js` / Baileys)** :
   Il est possible d'exécuter un micro-service Node.js autonome connecté à votre propre numéro WhatsApp physique via un QR Code. Ce micro-service expose une API REST simple que votre serveur Node.js ou PHP appelle en effectuant une requête POST :
   ```typescript
   // Appel d'un serveur tiers de gateway WhatsApp interne
   await fetch("http://votre-passerelle-interne.local/send-message", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       to: phone,
       message: `Votre message personnalisé...`
     })
   });
   ```

---

## 🔒 4. Nettoyage Universel des Numéros pour l'Algérie

Afin de vous assurer que les numéros de téléphone sont transmis au format international valide (`213XXXXXXXXX`), la fonction de nettoyage intégrée élimine les espaces et formate le préfixe :

```typescript
function cleanPhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/\D/g, ""); // Enlever tous les caractères non numériques
  
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    // ex: 0555123456 -> 213555123456
    cleaned = "213" + cleaned.substring(1);
  } else if (!cleaned.startsWith("213") && cleaned.length === 9) {
    // ex: 555123456 -> 213555123456
    cleaned = "213" + cleaned;
  }
  return cleaned;
}
```

---

## 🛠️ 5. Résumé des Actions Recommandées
1. **Étape 1** : Laissez l'application en mode interactif par défaut (le bandeau vert dynamique avec les boutons d'envoi en un clic par l'administrateur/le client). C'est le mode le plus robuste qui ne dépend pas de services tiers payants.
2. **Étape 2** : Pour l'automatisation intégrale, procurez-vous des identifiants SMTP de votre hébergeur (ex: Hostinger, OVH, etc.) et configurez Nodemailer/PHPMailer.
3. **Étape 3** : Pour automatiser WhatsApp à 100%, optez pour la WhatsApp Cloud API de Meta en créant un compte développeur sur Facebook Developers.
"# SejourDz" 
