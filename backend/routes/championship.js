const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// --- PUBLIC : CLASSEMENT PILOTES ---
router.get("/standings/drivers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, t.name as team_name, t.color as team_color 
      FROM drivers d
      LEFT JOIN teams t ON d.team_id = t.id
      ORDER BY d.points DESC, d.wins DESC, d.podiums DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// --- PUBLIC : CLASSEMENT CONSTRUCTEURS ---
router.get("/standings/constructors", async (req, res) => {
  try {
    // On recalcule à la volée ou on prend le champ points stocké
    const result = await pool.query(`
      SELECT t.*, 
      (SELECT SUM(points) FROM drivers WHERE team_id = t.id) as calculated_points
      FROM teams t
      ORDER BY calculated_points DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// --- PUBLIC : CALENDRIER ---
router.get("/calendar", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM races ORDER BY date ASC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// --- ADMIN : SAISIR RÉSULTAT COURSE (Race Control) ---
// Cette route est cruciale : elle met à jour les points des pilotes et écuries
router.post("/races/:id/result", async (req, res) => {
  const client = await pool.connect();
  try {
    // req.body = [{ driver_id: 1, position: 1, fastest_lap: false }, ...]
    const { results } = req.body; 
    const raceId = req.params.id;

    // Barème F1 standard (Exemple)
    const pointsSystem = { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 };

    await client.query('BEGIN');

    // Nettoyer anciens résultats si correction
    await client.query("DELETE FROM race_results WHERE race_id = $1", [raceId]);

    for (const r of results) {
      let points = pointsSystem[r.position] || 0;
      if (r.fastest_lap && r.position <= 10) points += 1; // Point bonus meilleur tour

      // Sauvegarde Résultat
      await client.query(`
        INSERT INTO race_results (race_id, driver_id, position, points_awarded, fastest_lap, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [raceId, r.driver_id, r.position, points, r.fastest_lap, r.status || 'finished']);

      // Mise à jour Pilote (Stats globales)
      await client.query(`
        UPDATE drivers SET 
        points = points + $1,
        wins = wins + (CASE WHEN $2 = 1 THEN 1 ELSE 0 END),
        podiums = podiums + (CASE WHEN $2 <= 3 THEN 1 ELSE 0 END)
        WHERE id = $3
      `, [points, r.position, r.driver_id]);
    }

    // Marquer la course comme terminée
    await client.query("UPDATE races SET status = 'completed' WHERE id = $1", [raceId]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la validation de la course" });
  } finally {
    client.release();
  }
});

module.exports = router;
