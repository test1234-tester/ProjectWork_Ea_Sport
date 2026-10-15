import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { pool } from './db.js';

// Carica esplicitamente .env dal percorso assoluto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || '247dcc6933b63362524f799d224391a2783a7892560890a91ff727ad2168f6f6';

// Configurazione CORS flessibile per consentire tutte le connessioni dal frontend locale
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

// Middleware di autenticazione opzionale o obbligatoria
function extractUserFromToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

function authRequired(req, res, next) {
  const user = extractUserFromToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Autenticazione richiesta.' });
  }
  req.user = user;
  next();
}

function adminRequired(req, res, next) {
  const ruolo = (req.user?.ruolo || '').toLowerCase();
  const email = (req.user?.email || '').toLowerCase();
  if (ruolo !== 'admin' && !email.includes('admin')) {
    return res.status(403).json({
      error: 'Accesso riservato agli amministratori.'
    });
  }
  next();
}

const statiTorneo = [
  'Aperto',
  'In Corso',
  'Chiuso',
  'Concluso',
  'Cancellato'
];

function formattaData(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.substring(0, 10);
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  try {
    return String(val).substring(0, 10);
  } catch {
    return '';
  }
}

function torneoCompatibile(torneo) {
  return {
    ...torneo,
    id: Number(torneo.id),
    titolo: torneo.nome,
    posti_max: Number(torneo.posti_max || 32),
    posti_totali: Number(torneo.posti_max || 32),
    posti_occupati: Number(torneo.posti_occupati || 0),
    in_coda: Number(torneo.in_coda || 0),
    data_inizio: formattaData(torneo.data_inizio),
    data_fine: formattaData(torneo.data_fine),
    modalita: torneo.modalita || (torneo.gioco?.toLowerCase().includes('online') ? 'ONLINE' : 'IN SEDE'),
    immagine: torneo.immagine || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
    luogo: torneo.modalita === 'ONLINE' ? 'ONLINE' : 'IN SEDE Presso laboratori ITS',
    in_evidenza: Boolean(torneo.in_evidenza)
  };
}

// --------------------------------------------------
// HEALTHCHECK
// --------------------------------------------------
app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({
    status: 'ok',
    database: 'PostgreSQL'
  });
}));

// --------------------------------------------------
// AUTENTICAZIONE E REGISTRAZIONE
// --------------------------------------------------
app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { nome, cognome, email, password } = req.body || {};

  if (!nome?.trim() || !cognome?.trim() || !email?.trim() || typeof password !== 'string') {
    return res.status(400).json({
      error: 'Nome, cognome, email e password sono campi obbligatori.'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'La password deve contenere almeno 8 caratteri.'
    });
  }

  const emailPulita = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const ruolo = emailPulita.includes('admin') ? 'Admin' : 'User';

  try {
    const { rows } = await pool.query(
      `INSERT INTO utente
        (nome, cognome, email, password, ruolo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, cognome, email, ruolo`,
      [
        nome.trim(),
        cognome.trim(),
        emailPulita,
        passwordHash,
        ruolo
      ]
    );

    const user = rows[0];
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        ruolo: user.ruolo
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      messaggio: 'Registrazione completata con successo!',
      token,
      utente: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        ruolo: user.ruolo
      }
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Esiste già un account registrato con questa email.'
      });
    }
    console.error('Errore registrazione:', error);
    throw error;
  }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      error: 'Inserisci sia l\'email che la password.'
    });
  }

  const emailPulita = email.trim().toLowerCase();
  const { rows } = await pool.query(
    `SELECT id, nome, cognome, email, password, ruolo
     FROM utente
     WHERE LOWER(email) = $1`,
    [emailPulita]
  );

  if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
    return res.status(401).json({
      error: 'Email o password non corretti.'
    });
  }

  const user = rows[0];
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      ruolo: user.ruolo
    },
    jwtSecret,
    { expiresIn: '24h' }
  );

  res.json({
    messaggio: 'Login effettuato con successo',
    token,
    utente: {
      id: user.id,
      nome: user.nome,
      cognome: user.cognome,
      email: user.email,
      ruolo: user.ruolo
    }
  });
}));

app.post('/api/auth/logout', (_req, res) => {
  res.json({ messaggio: 'Logout effettuato' });
});

// Profilo Utente
app.get(['/api/utenti/me', '/api/v1/users/me'], authRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, nome, cognome, email, ruolo
     FROM utente
     WHERE id = $1`,
    [req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Utente non trovato.' });
  }

  res.json({ utente: rows[0], ...rows[0] });
}));

// --------------------------------------------------
// TORNEI PUBBLICI
// --------------------------------------------------
app.get(['/api/tornei', '/api/v1/tournaments'], asyncRoute(async (req, res) => {
  const stato = req.query.stato;

  let sql = `
    SELECT t.*,
      COALESCE((SELECT COUNT(*)::int FROM iscrizione i WHERE i.torneo_id = t.id AND i.stato = 'Confermata'), 0) AS posti_occupati,
      COALESCE((SELECT COUNT(*)::int FROM iscrizione i WHERE i.torneo_id = t.id AND i.stato = 'In_Attesa'), 0) AS in_coda
    FROM torneo t
  `;
  const params = [];

  if (stato) {
    sql += ' WHERE t.stato = $1';
    params.push(stato);
  }

  sql += ' ORDER BY t.data_inizio ASC, t.id DESC';

  const { rows } = await pool.query(sql, params);
  res.json(rows.map(torneoCompatibile));
}));

app.get(['/api/tornei/in-evidenza', '/api/v1/tournaments/featured'], asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT t.*,
      COALESCE((SELECT COUNT(*)::int FROM iscrizione i WHERE i.torneo_id = t.id AND i.stato = 'Confermata'), 0) AS posti_occupati,
      COALESCE((SELECT COUNT(*)::int FROM iscrizione i WHERE i.torneo_id = t.id AND i.stato = 'In_Attesa'), 0) AS in_coda
    FROM torneo t
    WHERE t.stato = 'Aperto'
    ORDER BY t.data_inizio ASC
    LIMIT 3
  `);
  res.json(rows.map(torneoCompatibile));
}));

app.get(['/api/tornei/categorie', '/api/v1/tournaments/categories'], asyncRoute(async (_req, res) => {
  const { rows } = await pool.query("SELECT DISTINCT gioco AS nome FROM torneo WHERE gioco IS NOT NULL AND gioco != '' ORDER BY gioco");
  res.json(rows.map((r, i) => ({ id: i + 1, nome: r.nome })));
}));

app.get(['/api/tornei/:id', '/api/v1/tournaments/:id'], asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*,
       COALESCE((SELECT COUNT(*)::int FROM iscrizione i WHERE i.torneo_id = t.id AND i.stato = 'Confermata'), 0) AS posti_occupati,
       COALESCE((SELECT COUNT(*)::int FROM iscrizione i WHERE i.torneo_id = t.id AND i.stato = 'In_Attesa'), 0) AS in_coda
     FROM torneo t WHERE t.id = $1`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Torneo non trovato.' });
  }

  res.json(torneoCompatibile(rows[0]));
}));

// --------------------------------------------------
// ISCRIZIONI
// --------------------------------------------------

// Recupero iscrizioni per utente (chiamato da AuthService.caricaIscrizioni)
app.get(
  ['/api/utenti/:id/iscrizioni', '/api/v1/users/:id/tournaments'],
  asyncRoute(async (req, res) => {
    const userId = req.params.id === 'me' ? extractUserFromToken(req)?.id : req.params.id;
    if (!userId) {
      return res.status(400).json({ error: 'ID utente non specificato.' });
    }

    const { rows } = await pool.query(
      `SELECT
         i.id,
         i.id AS iscrizione_id,
         i.torneo_id,
         i.utente_id,
         i.stato,
         i.stato AS stato_iscrizione,
         i.data_iscrizione,
         t.nome,
         t.nome AS titolo,
         t.gioco,
         COALESCE(t.modalita, 'IN SEDE') AS modalita,
         t.data_inizio,
         t.data_fine,
         COALESCE(t.immagine, 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80') AS immagine,
         t.descrizione,
         t.stato AS stato_torneo,
         t.posti_max,
         (
           SELECT COUNT(*)::int
           FROM iscrizione i2
           WHERE i2.torneo_id = i.torneo_id
             AND i2.stato = 'In_Attesa'
             AND i2.data_iscrizione <= i.data_iscrizione
         ) AS posizione_coda
       FROM iscrizione i
       JOIN torneo t ON t.id = i.torneo_id
       WHERE i.utente_id = $1
       ORDER BY i.data_iscrizione DESC`,
      [userId]
    );

    res.json(rows.map(r => ({
      ...r,
      data_inizio: formattaData(r.data_inizio),
      data_fine: formattaData(r.data_fine),
      posizione_coda: r.stato === 'In_Attesa' ? (Number(r.posizione_coda) || 1) : undefined
    })));
  })
);

// Iscrizione a un torneo (chiamato da AuthService.iscriviAlTorneo)
app.post(
  ['/api/iscrizioni', '/api/v1/enrollments'],
  asyncRoute(async (req, res) => {
    const userFromToken = extractUserFromToken(req);
    const utenteId = req.body?.utente_id || userFromToken?.id;
    const torneoId = req.body?.torneo_id;

    if (!utenteId || !torneoId) {
      return res.status(400).json({ error: 'ID utente e ID torneo sono obbligatori.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const torneoRes = await client.query('SELECT * FROM torneo WHERE id = $1 FOR UPDATE', [torneoId]);
      if (!torneoRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Torneo non trovato.' });
      }

      const torneo = torneoRes.rows[0];
      if (torneo.stato !== 'Aperto') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Le iscrizioni a questo torneo non sono aperte.' });
      }

      // Verifica se già iscritto
      const duplicato = await client.query(
        'SELECT id, stato FROM iscrizione WHERE utente_id = $1 AND torneo_id = $2',
        [utenteId, torneoId]
      );

      if (duplicato.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Sei già iscritto a questo torneo.' });
      }

      // Conteggio confermati
      const countRes = await client.query(
        "SELECT COUNT(*)::int AS tot FROM iscrizione WHERE torneo_id = $1 AND stato = 'Confermata'",
        [torneoId]
      );
      const iscrittiConfermati = countRes.rows[0].tot;

      let statoFinale = 'Confermata';
      let posizioneCoda = undefined;

      if (iscrittiConfermati >= torneo.posti_max || req.body?.stato === 'In_Attesa') {
        statoFinale = 'In_Attesa';
        const waitlistCount = await client.query(
          "SELECT COUNT(*)::int AS wait_tot FROM iscrizione WHERE torneo_id = $1 AND stato = 'In_Attesa'",
          [torneoId]
        );
        posizioneCoda = waitlistCount.rows[0].wait_tot + 1;
      }

      const insertRes = await client.query(
        `INSERT INTO iscrizione (utente_id, torneo_id, stato)
         VALUES ($1, $2, $3)
         RETURNING id, utente_id, torneo_id, stato, data_iscrizione`,
        [utenteId, torneoId, statoFinale]
      );

      await client.query('COMMIT');

      const nuovaIscrizione = insertRes.rows[0];
      res.status(201).json({
        ...nuovaIscrizione,
        posizione_coda: posizioneCoda
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// Iscrizione via endpoint torneo (alias retrocompatibile)
app.post(
  ['/api/tornei/:id/iscrizioni', '/api/v1/tournaments/:id/enroll'],
  asyncRoute(async (req, res) => {
    req.body.torneo_id = req.params.id;
    const userFromToken = extractUserFromToken(req);
    if (!req.body.utente_id && userFromToken) {
      req.body.utente_id = userFromToken.id;
    }
    // Riutilizza logica POST /api/iscrizioni
    const utenteId = req.body?.utente_id;
    const torneoId = req.params.id;

    if (!utenteId) {
      return res.status(401).json({ error: 'Autenticazione richiesta.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const torneoRes = await client.query('SELECT * FROM torneo WHERE id = $1 FOR UPDATE', [torneoId]);
      if (!torneoRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Torneo non trovato.' });
      }

      const duplicato = await client.query(
        'SELECT id FROM iscrizione WHERE utente_id = $1 AND torneo_id = $2',
        [utenteId, torneoId]
      );
      if (duplicato.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Sei già iscritto a questo torneo.' });
      }

      const countRes = await client.query(
        "SELECT COUNT(*)::int AS tot FROM iscrizione WHERE torneo_id = $1 AND stato = 'Confermata'",
        [torneoId]
      );
      const stato = countRes.rows[0].tot < torneoRes.rows[0].posti_max ? 'Confermata' : 'In_Attesa';

      const insertRes = await client.query(
        `INSERT INTO iscrizione (utente_id, torneo_id, stato)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [utenteId, torneoId, stato]
      );
      await client.query('COMMIT');
      res.status(201).json(insertRes.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// Annulla iscrizione (chiamato da AuthService.annullaIscrizione con query params ?utenteId=...&torneoId=...)
app.delete(
  ['/api/iscrizioni', '/api/v1/enrollments'],
  asyncRoute(async (req, res) => {
    const userFromToken = extractUserFromToken(req);
    const utenteId = req.query.utenteId || req.query.utente_id || req.body?.utente_id || userFromToken?.id;
    const torneoId = req.query.torneoId || req.query.torneo_id || req.body?.torneo_id;

    if (!utenteId || !torneoId) {
      return res.status(400).json({ error: 'utenteId e torneoId sono necessari per cancellare l\'iscrizione.' });
    }

    const { rows } = await pool.query(
      'DELETE FROM iscrizione WHERE utente_id = $1 AND torneo_id = $2 RETURNING id, stato',
      [utenteId, torneoId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Iscrizione non trovata.' });
    }

    // NOTA: NON promuoviamo automaticamente. L'admin gestisce manualmente la lista d'attesa.
    res.json({ message: 'Iscrizione annullata con successo.' });
  })
);

// Annulla iscrizione via /api/tornei/:id/iscrizioni/me
app.delete(
  ['/api/tornei/:id/iscrizioni/me', '/api/v1/tournaments/:id/enroll'],
  authRequired,
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      'DELETE FROM iscrizione WHERE utente_id = $1 AND torneo_id = $2 RETURNING id, stato',
      [req.user.id, req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Iscrizione non trovata.' });
    }

    // NOTA: NON promuoviamo automaticamente. L'admin gestisce manualmente la lista d'attesa.
    res.json({ message: 'Iscrizione annullata con successo.' });
  })
);

// --------------------------------------------------
// RISULTATI E PUNTEGGI (CHIAMATO DA AuthService e Dashboard)
// --------------------------------------------------

// Lettura risultati complessivi (usato da AuthService.caricaRisultati e visualizzato in UserArea)
app.get(
  ['/api/risultati', '/api/v1/results'],
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT
        r.id,
        r.torneo_id,
        t.nome AS nome_torneo,
        TO_CHAR(COALESCE(t.data_inizio, CURRENT_DATE), 'DD/MM/YYYY') AS data_svolgimento,
        CONCAT(u.nome, ' ', u.cognome) AS nome_studente,
        r.punti::text AS punti,
        r.posizione,
        COALESCE(r.vittorie, 0) AS vittorie,
        COALESCE(r.sconfitte, 0) AS sconfitte,
        r.utente_id
      FROM risultato r
      JOIN torneo t ON t.id = r.torneo_id
      JOIN utente u ON u.id = r.utente_id
      ORDER BY r.id DESC
    `);
    res.json(rows);
  })
);

// Aggiunta/Modifica manuale risultato (usato da AuthService.aggiungiRisultato)
app.post(
  ['/api/risultati', '/api/v1/results'],
  asyncRoute(async (req, res) => {
    const { torneo_id, utente_id, punti = 0, posizione = 1, vittorie = 0, sconfitte = 0 } = req.body || {};

    if (!torneo_id || !utente_id) {
      return res.status(400).json({ error: 'torneo_id e utente_id sono obbligatori.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO risultato (torneo_id, utente_id, punti, posizione, vittorie, sconfitte)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (utente_id, torneo_id)
       DO UPDATE SET punti = EXCLUDED.punti, posizione = EXCLUDED.posizione, vittorie = EXCLUDED.vittorie, sconfitte = EXCLUDED.sconfitte
       RETURNING *`,
      [torneoId(torneo_id), Number(utente_id), Number(punti), Number(posizione), Number(vittorie), Number(sconfitte)]
    );

    // Recupera con JOIN per il formato completo
    const complete = await pool.query(`
      SELECT
        r.id,
        r.torneo_id,
        t.nome AS nome_torneo,
        TO_CHAR(COALESCE(t.data_inizio, CURRENT_DATE), 'DD/MM/YYYY') AS data_svolgimento,
        CONCAT(u.nome, ' ', u.cognome) AS nome_studente,
        r.punti::text AS punti,
        r.posizione,
        r.vittorie,
        r.sconfitte,
        r.utente_id
      FROM risultato r
      JOIN torneo t ON t.id = r.torneo_id
      JOIN utente u ON u.id = r.utente_id
      WHERE r.id = $1
    `, [rows[0].id]);

    res.status(201).json(complete.rows[0] || rows[0]);
  })
);

function torneoId(val) {
  return Number(val);
}

// Risultati di un singolo torneo
app.get(
  ['/api/tornei/:id/risultati', '/api/v1/tournaments/:id/results'],
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT
         r.id,
         r.posizione,
         r.punti,
         r.punti AS punteggio,
         r.vittorie,
         r.sconfitte,
         u.id AS utente_id,
         u.nome,
         u.cognome,
         CONCAT(u.nome, ' ', u.cognome) AS nome_studente
       FROM risultato r
       JOIN utente u ON u.id = r.utente_id
       WHERE r.torneo_id = $1
       ORDER BY r.posizione ASC, r.punti DESC`,
      [req.params.id]
    );
    res.json(rows);
  })
);

// --------------------------------------------------
// DASHBOARD AMMINISTRATORE (ADMIN)
// --------------------------------------------------

// 1. Lista tornei per admin
app.get(
  ['/api/admin/tornei', '/api/v1/tournaments/admin'],
  authRequired,
  adminRequired,
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT t.*,
         COALESCE((SELECT COUNT(*)::int FROM iscrizione i WHERE i.torneo_id = t.id AND i.stato = 'Confermata'), 0) AS posti_occupati,
         COALESCE((SELECT COUNT(*)::int FROM iscrizione i WHERE i.torneo_id = t.id AND i.stato = 'In_Attesa'), 0) AS in_coda
       FROM torneo t
       ORDER BY t.id DESC`
    );
    res.json(rows.map(torneoCompatibile));
  })
);

// 2. Lista studenti / utenti per admin (usato dal menu a tendina dell'admin per i punteggi)
app.get(
  ['/api/admin/utenti', '/api/admin/studenti'],
  authRequired,
  adminRequired,
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT id, nome, cognome, email, ruolo
       FROM utente
       ORDER BY cognome ASC, nome ASC`
    );

    res.json(
      rows.map((u) => ({
        ...u,
        nome_completo: `${u.nome} ${u.cognome}`
      }))
    );
  })
);

// 3. Creazione torneo da dashboard
app.post(
  ['/api/admin/tornei', '/api/v1/tournaments'],
  authRequired,
  adminRequired,
  asyncRoute(async (req, res) => {
    const {
      nome,
      titolo,
      descrizione = '',
      gioco,
      posti_max,
      posti_totali,
      stato = 'Aperto',
      data_inizio,
      data_fine,
      modalita = 'IN SEDE',
      immagine = ''
    } = req.body || {};

    const nomeTorneo = (nome || titolo || '').trim();
    const giocoTorneo = (gioco || '').trim();
    const posti = Number(posti_max ?? posti_totali ?? 32);

    if (!nomeTorneo || !giocoTorneo || !data_inizio || !data_fine) {
      return res.status(400).json({
        error: 'Nome, gioco, data di inizio e data di fine sono obbligatori.'
      });
    }

    if (posti < 1) {
      return res.status(400).json({
        error: 'Il numero di posti deve essere almeno 1.'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO torneo
         (nome, descrizione, gioco, posti_max, stato, data_inizio, data_fine, modalita, immagine)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        nomeTorneo,
        descrizione,
        giocoTorneo,
        posti,
        stato,
        data_inizio,
        data_fine,
        modalita || 'IN SEDE',
        immagine || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'
      ]
    );

    res.status(201).json(torneoCompatibile(rows[0]));
  })
);

// 4. Modifica torneo da dashboard (supporta parametri opzionali e preserva stato se non inviato)
app.put(
  ['/api/admin/tornei/:id', '/api/v1/tournaments/:id'],
  authRequired,
  adminRequired,
  asyncRoute(async (req, res) => {
    const torneoId = req.params.id;
    const {
      nome,
      titolo,
      descrizione,
      gioco,
      posti_max,
      posti_totali,
      stato,
      data_inizio,
      data_fine,
      modalita,
      immagine
    } = req.body || {};

    const existingRes = await pool.query('SELECT * FROM torneo WHERE id = $1', [torneoId]);
    if (!existingRes.rows.length) {
      return res.status(404).json({ error: 'Torneo non trovato.' });
    }
    const current = existingRes.rows[0];

    const nuovoNome = (nome || titolo || current.nome || '').trim();
    const nuovoGioco = (gioco || current.gioco || '').trim();
    const nuovaDescrizione = descrizione !== undefined ? descrizione : current.descrizione;
    const nuoviPosti = Number(posti_max ?? posti_totali ?? current.posti_max);
    const nuovoStato = stato && statiTorneo.includes(stato) ? stato : current.stato;
    const nuovaDataInizio = data_inizio || current.data_inizio;
    const nuovaDataFine = data_fine || current.data_fine;
    const nuovaModalita = modalita || current.modalita || 'IN SEDE';
    const nuovaImmagine = immagine !== undefined ? immagine : current.immagine;

    const { rows } = await pool.query(
      `UPDATE torneo
       SET nome = $1,
           descrizione = $2,
           gioco = $3,
           posti_max = $4,
           stato = $5,
           data_inizio = $6,
           data_fine = $7,
           modalita = $8,
           immagine = $9
       WHERE id = $10
       RETURNING *`,
      [
        nuovoNome,
        nuovaDescrizione,
        nuovoGioco,
        nuoviPosti,
        nuovoStato,
        nuovaDataInizio,
        nuovaDataFine,
        nuovaModalita,
        nuovaImmagine,
        torneoId
      ]
    );

    res.json(torneoCompatibile(rows[0]));
  })
);

// 5. Eliminazione torneo da dashboard (elimina a cascata iscrizioni e risultati per consentire la cancellazione pulita)
app.delete(
  ['/api/admin/tornei/:id', '/api/v1/tournaments/:id'],
  authRequired,
  adminRequired,
  asyncRoute(async (req, res) => {
    const torneoId = req.params.id;

    // Cancella a cascata per garantire successo
    await pool.query('DELETE FROM iscrizione WHERE torneo_id = $1', [torneoId]);
    await pool.query('DELETE FROM risultato WHERE torneo_id = $1', [torneoId]);

    const { rows } = await pool.query(
      'DELETE FROM torneo WHERE id = $1 RETURNING id',
      [torneoId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Torneo non trovato.' });
    }

    res.json({ message: 'Torneo eliminato definitivamente con successo.' });
  })
);

// 6. Inserimento e aggiornamento punteggi da dashboard
app.put(
  [
    '/api/admin/tornei/:id/risultati/:userId',
    '/api/v1/tournaments/:id/results/:userId',
    '/api/admin/tornei/:id/results/:userId'
  ],
  authRequired,
  adminRequired,
  asyncRoute(async (req, res) => {
    const { id: torneoId, userId } = req.params;
    const {
      punti = 0,
      posizione = 1,
      vittorie = 0,
      sconfitte = 0
    } = req.body || {};

    const { rows } = await pool.query(
      `INSERT INTO risultato (torneo_id, utente_id, punti, posizione, vittorie, sconfitte)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (utente_id, torneo_id)
       DO UPDATE SET
         punti = EXCLUDED.punti,
         posizione = EXCLUDED.posizione,
         vittorie = EXCLUDED.vittorie,
         sconfitte = EXCLUDED.sconfitte
       RETURNING *`,
      [Number(torneoId), Number(userId), Number(punti), Number(posizione), Number(vittorie), Number(sconfitte)]
    );

    res.json({
      messaggio: 'Risultato salvato con successo',
      risultato: rows[0]
    });
  })
);

// 7. Lista iscrizioni torneo per admin
app.get(
  ['/api/admin/tornei/:id/iscrizioni', '/api/v1/tournaments/:id/enrollments'],
  authRequired,
  adminRequired,
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT
         i.id,
         i.stato,
         i.data_iscrizione,
         u.id AS utente_id,
         u.nome,
         u.cognome,
         u.email
       FROM iscrizione i
       JOIN utente u ON u.id = i.utente_id
       WHERE i.torneo_id = $1
       ORDER BY
         CASE i.stato
           WHEN 'Confermata' THEN 1
           WHEN 'In_Attesa' THEN 2
           ELSE 3
         END,
         i.data_iscrizione ASC`,
      [req.params.id]
    );
    res.json(rows);
  })
);

// 8. Lista studenti in lista d'attesa (coda) — con posizione e posti disponibili
app.get(
  '/api/admin/coda',
  authRequired,
  adminRequired,
  asyncRoute(async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT
        i.id AS iscrizione_id,
        i.stato,
        i.data_iscrizione,
        u.id   AS utente_id,
        u.nome,
        u.cognome,
        u.email,
        t.id   AS torneo_id,
        t.nome AS torneo_nome,
        t.posti_max,
        t.stato AS stato_torneo,
        COALESCE(
          (SELECT COUNT(*)::int FROM iscrizione i2
           WHERE i2.torneo_id = i.torneo_id AND i2.stato = 'Confermata'),
          0
        ) AS posti_occupati,
        (
          SELECT COUNT(*)::int FROM iscrizione i3
          WHERE i3.torneo_id = i.torneo_id
            AND i3.stato     = 'In_Attesa'
            AND i3.data_iscrizione <= i.data_iscrizione
        ) AS posizione_coda
      FROM iscrizione i
      JOIN utente u ON u.id = i.utente_id
      JOIN torneo  t ON t.id = i.torneo_id
      WHERE i.stato = 'In_Attesa'
      ORDER BY i.torneo_id ASC, i.data_iscrizione ASC
    `);

    res.json(rows.map(r => ({
      ...r,
      posti_disponibili: Math.max(0, Number(r.posti_max) - Number(r.posti_occupati))
    })));
  })
);

// 9. Approva uno studente dalla lista d'attesa (promuove a Confermata e incrementa posti_max di 1)
app.post(
  '/api/admin/iscrizioni/:id/approva',
  authRequired,
  adminRequired,
  asyncRoute(async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const iscrRes = await client.query(
        "SELECT * FROM iscrizione WHERE id = $1 AND stato = 'In_Attesa' FOR UPDATE",
        [req.params.id]
      );
      if (!iscrRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Iscrizione in attesa non trovata o già confermata.' });
      }
      const iscr = iscrRes.rows[0];

      // Aggiorna lo stato a Confermata
      const updatedIscr = await client.query(
        "UPDATE iscrizione SET stato = 'Confermata' WHERE id = $1 RETURNING *",
        [iscr.id]
      );

      // Incrementa automaticamente posti_max del torneo di 1 (es. da 5 a 6)
      await client.query(
        "UPDATE torneo SET posti_max = posti_max + 1 WHERE id = $1",
        [iscr.torneo_id]
      );

      await client.query('COMMIT');
      res.json({
        messaggio: 'Iscrizione approvata con successo e posti del torneo aggiornati.',
        iscrizione: updatedIscr.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// 10. Rifiuta / rimuovi uno studente dalla lista d'attesa
app.delete(
  '/api/admin/iscrizioni/:id',
  authRequired,
  adminRequired,
  asyncRoute(async (req, res) => {
    const { rows } = await pool.query(
      'DELETE FROM iscrizione WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Iscrizione non trovata.' });
    }
    res.json({ message: 'Iscrizione rimossa con successo.' });
  })
);


app.get('/api/faq', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT id, domanda, risposta FROM faq ORDER BY id');
  res.json(rows);
}));

// --------------------------------------------------
// GESTIONE ERRORI E ROTTE NON TROVATE
// --------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint non trovato: ${req.method} ${req.path}`
  });
});

app.use((error, _req, res, _next) => {
  console.error('Server error:', error);

  if (error.code === '23503') {
    return res.status(400).json({ error: 'Riferimento a un record inesistente nel database.' });
  }

  if (error.code === '23505') {
    return res.status(409).json({ error: 'Il dato è già presente o viola un vincolo di unicità.' });
  }

  res.status(500).json({
    error: error.message || 'Errore interno del server.'
  });
});

app.listen(port, () => {
  console.log(`Backend ITS Torneo attivo e connesso a PostgreSQL su http://localhost:${port}`);
});