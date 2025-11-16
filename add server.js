import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS questionnaire_reponses (
        id SERIAL PRIMARY KEY,
        ville VARCHAR(255) NOT NULL,
        etablissement VARCHAR(255) NOT NULL,
        modalite VARCHAR(100) NOT NULL,
        aspect_moins_clair VARCHAR(255) NOT NULL,
        suggestion TEXT NOT NULL,
        point_positif TEXT NOT NULL,
        date_soumission TIMESTAMP DEFAULT NOW(),
        publie_dans_synthese BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('✅ Table questionnaire_reponses créée');
  } catch (error) {
    console.error('❌ Erreur création table:', error);
  } finally {
    client.release();
  }
}

app.post('/api/submit', async (req, res) => {
  try {
    const { ville, etablissement, modalite, aspect_moins_clair, suggestion, point_positif } = req.body;

    if (!ville || !etablissement || !modalite || !aspect_moins_clair || !suggestion || !point_positif) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO questionnaire_reponses 
        (ville, etablissement, modalite, aspect_moins_clair, suggestion, point_positif)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [ville, etablissement, modalite, aspect_moins_clair, suggestion, point_positif]);

      console.log(`✅ Nouvelle réponse enregistrée: ${modalite} - ${ville}`);
      res.json({ success: true, message: 'Réponse enregistrée avec succès' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erreur enregistrement réponse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

initDatabase().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Serveur API questionnaire démarré sur le port ${port}`);
  });
});

export default app;
