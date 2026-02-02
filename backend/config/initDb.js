const pool = require("./database");
const bcrypt = require("bcrypt");

const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log("🏎️ Initialisation F1 MANAGER PRO (Migration sécurisée)...");

    // ============================================================
    // 1. USERS (Comptes)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Ajout des colonnes "Pro" sans casser l'existant
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);

    // ============================================================
    // 2. CONFIGURATION CHAMPIONNAT (Nouvelle Table)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS championship_settings (
        id SERIAL PRIMARY KEY,
        season_year INTEGER DEFAULT 2026,
        points_system JSONB DEFAULT '{"1":25, "2":18, "3":15, "4":12, "5":10, "6":8, "7":6, "8":4, "9":2, "10":1, "fastest_lap":1}',
        sprint_points_system JSONB DEFAULT '{"1":8, "2":7, "3":6, "4":5, "5":4, "6":3, "7":2, "8":1}',
        budget_cap BIGINT DEFAULT 135000000
      );
    `);
    // Insérer la config par défaut si la table est vide
    const settingsCheck = await client.query("SELECT * FROM championship_settings");
    if(settingsCheck.rows.length === 0) {
        await client.query("INSERT INTO championship_settings (season_year) VALUES (2026)");
        console.log("⚙️ Configuration championnat par défaut créée.");
    }

    // ============================================================
    // 3. TEAMS (Écuries)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#000000',
        logo_url TEXT,
        country VARCHAR(50),
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Migration vers la structure "Pro"
    await client.query(`
      ALTER TABLE teams 
      ADD COLUMN IF NOT EXISTS full_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS base VARCHAR(100),
      ADD COLUMN IF NOT EXISTS team_principal VARCHAR(100),
      ADD COLUMN IF NOT EXISTS power_unit VARCHAR(50),
      ADD COLUMN IF NOT EXISTS chassis VARCHAR(50),
      ADD COLUMN IF NOT EXISTS car_image_url TEXT,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS founded_year INTEGER,
      ADD COLUMN IF NOT EXISTS world_championships INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);

    // ============================================================
    // 4. STAFF (Nouvelle Table pour Mécanos/Ingénieurs)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50), -- 'Chief Mechanic', 'Race Engineer', 'Strategist'
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        photo_url TEXT,
        nationality VARCHAR(50),
        experience_level INTEGER DEFAULT 1
      );
    `);

    // ============================================================
    // 5. DRIVERS (Pilotes)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        number INTEGER,
        team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
        country VARCHAR(50),
        photo_url TEXT,
        points INTEGER DEFAULT 0,
        podiums INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    // Migration Drivers
    await client.query(`
      ALTER TABLE drivers 
      ADD COLUMN IF NOT EXISTS code VARCHAR(3), -- ex: VER
      ADD COLUMN IF NOT EXISTS flag_url TEXT,
      ADD COLUMN IF NOT EXISTS helmet_url TEXT,
      ADD COLUMN IF NOT EXISTS birth_date DATE,
      ADD COLUMN IF NOT EXISTS biography TEXT,
      ADD COLUMN IF NOT EXISTS championships INTEGER DEFAULT 0
    `);

    // ============================================================
    // 6. RACES (Calendrier)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS races (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        circuit_name VARCHAR(100),
        date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'upcoming',
        flag_url TEXT,
        laps INTEGER
      );
    `);
    // Migration Races
    await client.query(`
      ALTER TABLE races 
      ADD COLUMN IF NOT EXISTS location VARCHAR(100),
      ADD COLUMN IF NOT EXISTS country VARCHAR(50),
      ADD COLUMN IF NOT EXISTS layout_image_url TEXT,
      ADD COLUMN IF NOT EXISTS length_km DECIMAL(4,3),
      ADD COLUMN IF NOT EXISTS weather VARCHAR(50),
      ADD COLUMN IF NOT EXISTS is_sprint BOOLEAN DEFAULT FALSE
    `);

    // ============================================================
    // 7. RESULTS (Résultats)
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS race_results (
        id SERIAL PRIMARY KEY,
        race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
        driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
        position INTEGER,
        points_awarded INTEGER,
        fastest_lap BOOLEAN DEFAULT FALSE,
        status VARCHAR(10) DEFAULT 'finished',
        gap VARCHAR(50)
      );
    `);
    // Migration Results
    await client.query(`
      ALTER TABLE race_results 
      ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS grid_position INTEGER,
      ADD COLUMN IF NOT EXISTS tyre_compound VARCHAR(20)
    `);

    // ============================================================
    // 8. SESSION & ADMIN
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY, 
        sess JSON NOT NULL, 
        expire TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
    `);

    // Check Admin
    const adminCheck = await client.query("SELECT * FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
        const hash = await bcrypt.hash("admin123", 10);
        await client.query(`
            INSERT INTO users (username, password, first_name, last_name, role) 
            VALUES ('admin', $1, 'System', 'Administrator', 'admin')
        `, [hash]);
        console.log("👤 Compte Admin créé: admin / admin123");
    }

    console.log("✅ Base de données F1 PRO (Mise à jour réussie) !");

  } catch (e) {
    console.error("❌ ERREUR INIT DB:", e);
  } finally {
    client.release();
  }
};

module.exports = initDatabase;
