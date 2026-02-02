const pool = require("./database");
const bcrypt = require("bcrypt");

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log("🏎️ Initialisation du F1 Championship Manager...");

    // 1. USERS (Gardé pour les admins/stewards)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'admin', -- 'admin', 'steward', 'team_principal'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. TEAMS (Écuries)
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#000000', -- Code couleur Hex pour le leaderboard
        logo_url TEXT,
        country VARCHAR(50),
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. DRIVERS (Pilotes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        number INTEGER, -- Numéro de course
        team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        country VARCHAR(50),
        photo_url TEXT,
        points INTEGER DEFAULT 0,
        podiums INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    // 4. RACES (Calendrier / Grand Prix)
    await client.query(`
      CREATE TABLE IF NOT EXISTS races (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL, -- ex: GP de Monaco
        circuit_name VARCHAR(100),
        date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'
        flag_url TEXT, -- Drapeau du pays
        laps INTEGER
      );
    `);

    // 5. RESULTS (Résultats course par course)
    await client.query(`
      CREATE TABLE IF NOT EXISTS race_results (
        id SERIAL PRIMARY KEY,
        race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
        driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
        position INTEGER, -- 1, 2, 3... (0 si DNF)
        points_awarded INTEGER,
        fastest_lap BOOLEAN DEFAULT FALSE,
        status VARCHAR(10) DEFAULT 'finished', -- 'finished', 'dnf', 'dns'
        gap VARCHAR(50) -- ex: +12.4s
      );
    `);

    // Session (Nécessaire pour l'auth du code original)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY, 
        sess JSON NOT NULL, 
        expire TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
    `);

    // --- CRÉATION COMPTE ADMIN PAR DÉFAUT ---
    const adminCheck = await client.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
        const hash = await bcrypt.hash("admin123", 10);
        await client.query(`
            INSERT INTO users (username, password, first_name, last_name, role) 
            VALUES ('admin', $1, 'System', 'Administrator', 'admin')
        `, [hash]);
        console.log("👤 Compte Admin créé: admin / admin123");
    }

    console.log("✅ Base de données F1 prête !");

  } catch (e) {
    console.error("❌ ERREUR INIT DB:", e);
  } finally {
    client.release();
  }
};

module.exports = initDatabase;
