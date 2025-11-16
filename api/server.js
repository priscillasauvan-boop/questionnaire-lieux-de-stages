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
        q1_accueil VARCHAR(10),
        q2_adaptation_tuteur VARCHAR(10),
        q3_tuteur_attitré VARCHAR(10),
        q4_changement_tuteur VARCHAR(10),
        q5_missions_claires VARCHAR(10),
        q6_communication VARCHAR(10),
        q7_suivi_retours VARCHAR(10),
        q8_reconnaissance VARCHAR(10),
        q9_autre_aspect VARCHAR(10),
        suggestion TEXT NOT NULL,
        point_positif TEXT NOT NULL,
        date_soumission TIMESTAMP DEFAULT NOW(),
        publie_dans_synthese BOOLEAN DEFAULT FALSE
      )
    `);

    const columnsToAdd = [
      'q1_accueil', 'q2_adaptation_tuteur', 'q3_tuteur_attitré', 'q4_changement_tuteur',
      'q5_missions_claires', 'q6_communication', 'q7_suivi_retours', 'q8_reconnaissance', 'q9_autre_aspect'
    ];

    for (const column of columnsToAdd) {
      try {
        await client.query(`
          ALTER TABLE questionnaire_reponses 
          ADD COLUMN IF NOT EXISTS ${column} VARCHAR(10)
        `);
      } catch (err) {
        console.log(`Colonne ${column} existe déjà ou erreur:`, err.message);
      }
    }

    try {
      await client.query(`
        ALTER TABLE questionnaire_reponses 
        DROP COLUMN IF EXISTS aspect_moins_clair
      `);
    } catch (err) {
      console.log('Colonne aspect_moins_clair déjà supprimée:', err.message);
    }

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_modalite 
      ON questionnaire_reponses(modalite)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_date_soumission 
      ON questionnaire_reponses(date_soumission)
    `);

    console.log('✅ Table questionnaire_reponses créée et migrée');
  } catch (error) {
    console.error('❌ Erreur création table:', error);
  } finally {
    client.release();
  }
}

app.post('/api/submit', async (req, res) => {
  try {
    const { 
      ville, etablissement, modalite, 
      q1_accueil, q2_adaptation_tuteur, q3_tuteur_attitré, q4_changement_tuteur,
      q5_missions_claires, q6_communication, q7_suivi_retours, q8_reconnaissance, q9_autre_aspect,
      suggestion, point_positif 
    } = req.body;

    if (!ville || !etablissement || !modalite || !suggestion || !point_positif ||
        !q1_accueil || !q2_adaptation_tuteur || !q3_tuteur_attitré || !q4_changement_tuteur ||
        !q5_missions_claires || !q6_communication || !q7_suivi_retours || !q8_reconnaissance || !q9_autre_aspect) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO questionnaire_reponses 
        (ville, etablissement, modalite, 
         q1_accueil, q2_adaptation_tuteur, q3_tuteur_attitré, q4_changement_tuteur,
         q5_missions_claires, q6_communication, q7_suivi_retours, q8_reconnaissance, q9_autre_aspect,
         suggestion, point_positif)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [ville, etablissement, modalite, 
          q1_accueil, q2_adaptation_tuteur, q3_tuteur_attitré, q4_changement_tuteur,
          q5_missions_claires, q6_communication, q7_suivi_retours, q8_reconnaissance, q9_autre_aspect,
          suggestion, point_positif]);

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

app.get('/api/synthese/:modalite', async (req, res) => {
  try {
    const { modalite } = req.params;
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT ville, etablissement, 
               q1_accueil, q2_adaptation_tuteur, q3_tuteur_attitré, q4_changement_tuteur,
               q5_missions_claires, q6_communication, q7_suivi_retours, q8_reconnaissance, q9_autre_aspect,
               suggestion, point_positif, date_soumission
        FROM questionnaire_reponses
        WHERE modalite = $1 AND publie_dans_synthese = FALSE
        ORDER BY date_soumission DESC
      `, [modalite]);

      res.json({
        modalite,
        total_reponses: result.rows.length,
        reponses: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erreur récupération synthèse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          modalite,
          COUNT(*) as total,
          COUNT(CASE WHEN publie_dans_synthese = FALSE THEN 1 END) as non_publies
        FROM questionnaire_reponses
        GROUP BY modalite
        ORDER BY total DESC
      `);

      res.json({ modalites: result.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/marquer-publie/:modalite', async (req, res) => {
  try {
    const { modalite } = req.params;
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE questionnaire_reponses
        SET publie_dans_synthese = TRUE
        WHERE modalite = $1 AND publie_dans_synthese = FALSE
        RETURNING id
      `, [modalite]);

      res.json({ 
        success: true, 
        message: `${result.rowCount} réponses marquées comme publiées` 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Erreur marquage publié:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

initDatabase().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Serveur API questionnaire démarré sur le port ${port}`);
  });
});

export default app;
