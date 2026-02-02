const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// Middleware de vérification (sécurité)
const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: "Non autorisé" });
};

router.use(ensureAuth);

// --- GESTION ÉCURIES (CRUD) ---

// Créer une écurie
router.post("/teams", async (req, res) => {
  try {
    const { name, full_name, base, team_principal, power_unit, color, logo_url, car_image_url } = req.body;
    // On associe l'équipe à l'utilisateur qui la crée (owner_id)
    const result = await pool.query(`
      INSERT INTO teams (name, full_name, base, team_principal, power_unit, color, logo_url, car_image_url, owner_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [name, full_name, base, team_principal, power_unit, color, logo_url, car_image_url, req.user.id]);
    res.json(result.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({error: e.message}); }
});

// Ajouter un membre du staff
router.post("/teams/:teamId/staff", async (req, res) => {
  try {
    const { first_name, last_name, role, nationality, photo_url } = req.body;
    const result = await pool.query(`
      INSERT INTO staff (first_name, last_name, role, nationality, photo_url, team_id)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [first_name, last_name, role, nationality, photo_url, req.params.teamId]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({error: e.message}); }
});

// --- GESTION CONFIGURATION (Barèmes) ---

// Modifier le barème de points
router.put("/settings/points", async (req, res) => {
  // Seul l'admin système peut changer les règles globales
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Réservé aux admins" });
  
  try {
    const { points_system, sprint_points_system } = req.body;
    // points_system doit être un JSON ex: {"1": 25, "2": 18...}
    await pool.query(`
      UPDATE championship_settings 
      SET points_system = $1, sprint_points_system = $2
      WHERE id = (SELECT id FROM championship_settings LIMIT 1)
    `, [points_system, sprint_points_system]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({error: e.message}); }
});

// --- RACE DIRECTOR (Gestion des Résultats) ---

router.post("/races/:raceId/publish-results", async (req, res) => {
  const client = await pool.connect();
  try {
    const { results } = req.body; // Array of { driver_id, position, fastest_lap, dnf... }
    const raceId = req.params.raceId;

    // 1. Récupérer le barème actuel
    const settingsRes = await client.query("SELECT points_system FROM championship_settings LIMIT 1");
    const pointsSystem = settingsRes.rows[0].points_system;

    await client.query('BEGIN');
    
    // Reset anciens résultats
    await client.query("DELETE FROM race_results WHERE race_id = $1", [raceId]);

    for (const r of results) {
      // Calcul automatique des points selon la position
      let points = 0;
      if (r.status === 'finished') {
        points = pointsSystem[r.position.toString()] || 0;
      }
      if (r.fastest_lap && r.position <= 10) {
        points += (pointsSystem['fastest_lap'] || 1);
      }

      // Récupérer l'ID team du pilote pour les points constructeurs
      const driverRes = await client.query("SELECT team_id FROM drivers WHERE id = $1", [r.driver_id]);
      const teamId = driverRes.rows[0]?.team_id;

      // Sauvegarde
      await client.query(`
        INSERT INTO race_results (race_id, driver_id, team_id, position, points_awarded, fastest_lap, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [raceId, r.driver_id, teamId, r.position, points, r.fastest_lap, r.status || 'finished']);

      // Mise à jour stats Pilote (cumul)
      await client.query(`
        UPDATE drivers SET points = points + $1 WHERE id = $2
      `, [points, r.driver_id]);
      
      // Mise à jour stats Team (cumul)
      if (teamId) {
        await client.query(`UPDATE teams SET points = points + $1 WHERE id = $2`, [points, teamId]);
      }
    }

    await client.query("UPDATE races SET status = 'completed' WHERE id = $1", [raceId]);
    await client.query('COMMIT');
    res.json({ success: true });

  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
