const express = require("express");
const router = express.Router();
const pool = require("../config/database"); // Nécessaire pour sauvegarder en BDD
const { isAuthenticated } = require("../middleware/auth");

// 1. RÉCUPÉRER L'HISTORIQUE DES VISITES (Pour l'onglet "Visites Passées")
router.get("/", isAuthenticated, async (req, res) => {
  try {
    // On récupère la visite + les infos du patient + les infos du médecin
    const result = await pool.query(`
      SELECT 
        mv.*,
        p.first_name as patient_first_name, p.last_name as patient_last_name, p.insurance_number,
        u.first_name as medic_first_name, u.last_name as medic_last_name
      FROM medical_visits mv
      LEFT JOIN patients p ON mv.patient_id = p.id
      LEFT JOIN users u ON mv.medic_id = u.id
      ORDER BY mv.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur historique visites:", err);
    res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
  }
});

// 2. ENREGISTRER UNE NOUVELLE VISITE + WEBHOOK LSPD
router.post("/", isAuthenticated, async (req, res) => {
  try {
    // Récupération des données complexes envoyées par le nouveau formulaire
    const { patient_id, psychology, physical, verdict, global_note } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: "Patient non identifié" });
    }

    // A. Enregistrement en Base de Données (Archives EMS)
    const result = await pool.query(
      `INSERT INTO medical_visits 
      (patient_id, medic_id, psychology, physical, verdict, global_note) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [patient_id, req.user.id, psychology, physical, verdict, global_note]
    );

    // B. Récupération des infos du patient pour le Webhook (Nom/Prénom)
    const patientRes = await pool.query("SELECT first_name, last_name FROM patients WHERE id = $1", [patient_id]);
    const patient = patientRes.rows[0];

    // C. Envoi du Webhook LSPD (Uniquement si configuré)
    const lspdWebhook = process.env.WEBHOOK_LSPD;
    
    if (lspdWebhook && patient) {
      // Définition de la couleur selon le verdict
      let color = 15158332; // Rouge (Inapte)
      if (verdict === "Apte") color = 3066993; // Vert
      if (verdict === "Apte sous réserve") color = 15844367; // Orange

      const embedData = {
        embeds: [{
          title: "👮 RÉSULTAT VISITE MÉDICALE (PPA)",
          description: "Le dossier médical complet a été archivé par les services EMS. Voici la décision transmise au LSPD.",
          color: color,
          fields: [
            { name: "Candidat", value: `**${patient.first_name} ${patient.last_name}**`, inline: true },
            { name: "Verdict", value: `**${verdict.toUpperCase()}**`, inline: true },
            { name: "Note Globale", value: `**${global_note}/20**`, inline: true },
            { name: "Médecin", value: `${req.user.first_name} ${req.user.last_name}`, inline: false }
          ],
          footer: { text: "MRSA Medical System • Transmission Officielle" },
          timestamp: new Date().toISOString()
        }]
      };

      // Envoi asynchrone (on ne bloque pas la réponse si discord est lent)
      fetch(lspdWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(embedData)
      }).catch(err => console.error("Erreur envoi Webhook LSPD:", err));
    }

    // On renvoie la visite créée au frontend
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("Erreur création visite:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement de la visite" });
  }
});

// Route de compatibilité (si l'ancien frontend appelle encore send-visit)
router.post("/send-visit", isAuthenticated, async (req, res) => {
    // Cette route est gardée temporairement pour éviter les erreurs 404
    // mais elle ne fait plus rien de critique puisque le nouveau système remplace l'ancien.
    res.json({ success: true });
});

module.exports = router;
