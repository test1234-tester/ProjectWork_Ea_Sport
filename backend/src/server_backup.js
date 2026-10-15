import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 20) {
  console.warn('ATTENZIONE: imposta in .env un JWT_SECRET lungo e casuale (almeno 20 caratteri).');
}

app.use(cors({ origin: true }));
app.use(express.json());

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Autenticazione richiesta.' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Token non valido o scaduto.' });
  }
}

function adminRequired(req, res, next) {
  if (req.user?.ruolo !== 'admin') return res.status(403).json({ error: 'Accesso riservato agli amministratori.' });
  next();
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'PostgreSQL' });
}));

app.get('/api/tornei', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM tornei ORDER BY data_inizio NULLS LAST, id DESC');
  res.json(rows);
}));

app.get('/api/tornei/in-evidenza', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM tornei WHERE in_evidenza = TRUE AND stato = 'aperto' ORDER BY data_inizio NULLS LAST");
  res.json(rows);
}));

app.get('/api/tornei/:id', asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tornei WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Torneo non trovato.' });
  res.json(rows[0]);
}));

app.get('/api/faq', asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT id, domanda, risposta FROM faq WHERE attiva = TRUE ORDER BY ordine, id');
  res.json(rows);
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { nome, cognome, email, password } = req.body || {};
  if (!nome?.trim() || !cognome?.trim() || !email?.trim() || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Inserisci nome, cognome, email e una password di almeno 8 caratteri.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      'INSERT INTO utenti (nome, cognome, email, password_hash) VALUES ($1, $2, LOWER($3), $4) RETURNING id, nome, cognome, email, ruolo',
      [nome.trim(), cognome.trim(), email.trim(), passwordHash]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Esiste già un account con questa email.' });
    throw error;
  }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email e password sono obbligatorie.' });
  const { rows } = await pool.query('SELECT id, nome, cognome, email, password_hash, ruolo FROM utenti WHERE email = LOWER($1)', [email.trim()]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Email o password non corretti.' });
  }
  const user = rows[0];
  const token = jwt.sign({ id: user.id, email: user.email, ruolo: user.ruolo }, jwtSecret, { expiresIn: '8h' });
  res.json({ token, utente: { id: user.id, nome: user.nome, cognome: user.cognome, email: user.email, ruolo: user.ruolo } });
}));

app.post('/api/auth/logout', (_req, res) => res.json({ message: 'Logout completato lato client: elimina il token salvato.' }));

app.get('/api/utenti/me', authRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query('SELECT id, nome, cognome, email, ruolo, creato_il FROM utenti WHERE id = $1', [req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Utente non trovato.' });
  res.json(rows[0]);
}));

app.get('/api/utenti/me/iscrizioni', authRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.id AS iscrizione_id, i.stato AS stato_iscrizione, i.creata_il,
            t.id AS torneo_id, t.titolo, t.gioco, t.data_inizio, t.stato AS stato_torneo
     FROM iscrizioni i JOIN tornei t ON t.id = i.torneo_id
     WHERE i.utente_id = $1 ORDER BY i.creata_il DESC`, [req.user.id]
  );
  res.json(rows);
}));

app.post('/api/tornei/:id/iscrizioni', authRequired, asyncRoute(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tourneyResult = await client.query('SELECT * FROM tornei WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!tourneyResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Torneo non trovato.' });
    }
    const tournament = tourneyResult.rows[0];
    if (tournament.stato !== 'aperto') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Le iscrizioni a questo torneo non sono aperte.' });
    }
    const duplicate = await client.query('SELECT id FROM iscrizioni WHERE utente_id = $1 AND torneo_id = $2 AND stato <> $3', [req.user.id, req.params.id, 'annullata']);
    if (duplicate.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Sei già iscritto o in lista d’attesa per questo torneo.' });
    }
    const count = await client.query("SELECT COUNT(*)::int AS totale FROM iscrizioni WHERE torneo_id = $1 AND stato = 'iscritto'", [req.params.id]);
    const stato = count.rows[0].totale < tournament.posti_totali ? 'iscritto' : 'lista_attesa';
    const waitCount = await client.query("SELECT COUNT(*)::int AS totale FROM iscrizioni WHERE torneo_id = $1 AND stato = 'lista_attesa'", [req.params.id]);
    const posizione = stato === 'lista_attesa' ? waitCount.rows[0].totale + 1 : null;
    const { rows } = await client.query(
      `INSERT INTO iscrizioni (utente_id, torneo_id, stato, posizione_lista)
       VALUES ($1, $2, $3, $4) RETURNING *`, [req.user.id, req.params.id, stato, posizione]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.delete('/api/tornei/:id/iscrizioni/me', authRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE iscrizioni SET stato = 'annullata' WHERE utente_id = $1 AND torneo_id = $2 AND stato <> 'annullata' RETURNING id",
    [req.user.id, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Iscrizione attiva non trovata.' });
  res.json({ message: 'Iscrizione annullata.' });
}));

app.get('/api/admin/tornei', authRequired, adminRequired, asyncRoute(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM tornei ORDER BY id DESC');
  res.json(rows);
}));

app.post('/api/admin/tornei', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const { titolo, descrizione = '', gioco = '', data_inizio = null, data_fine_iscrizioni = null, luogo = '', posti_totali = 16, stato = 'bozza', in_evidenza = false } = req.body || {};
  if (!titolo?.trim()) return res.status(400).json({ error: 'Il titolo è obbligatorio.' });
  const { rows } = await pool.query(
    `INSERT INTO tornei (titolo, descrizione, gioco, data_inizio, data_fine_iscrizioni, luogo, posti_totali, stato, in_evidenza)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [titolo.trim(), descrizione, gioco, data_inizio, data_fine_iscrizioni, luogo, posti_totali, stato, Boolean(in_evidenza)]
  );
  res.status(201).json(rows[0]);
}));

app.put('/api/admin/tornei/:id', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const { titolo, descrizione = '', gioco = '', data_inizio = null, data_fine_iscrizioni = null, luogo = '', posti_totali = 16, stato = 'bozza', in_evidenza = false } = req.body || {};
  if (!titolo?.trim()) return res.status(400).json({ error: 'Il titolo è obbligatorio.' });
  const { rows } = await pool.query(
    `UPDATE tornei SET titolo=$1, descrizione=$2, gioco=$3, data_inizio=$4, data_fine_iscrizioni=$5,
      luogo=$6, posti_totali=$7, stato=$8, in_evidenza=$9 WHERE id=$10 RETURNING *`,
    [titolo.trim(), descrizione, gioco, data_inizio, data_fine_iscrizioni, luogo, posti_totali, stato, Boolean(in_evidenza), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Torneo non trovato.' });
  res.json(rows[0]);
}));

app.delete('/api/admin/tornei/:id', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query('DELETE FROM tornei WHERE id = $1 RETURNING id', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Torneo non trovato.' });
  res.status(204).end();
}));

app.get('/api/admin/tornei/:id/iscrizioni', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.stato, i.posizione_lista, i.creata_il, u.id AS utente_id, u.nome, u.cognome, u.email
     FROM iscrizioni i JOIN utenti u ON u.id = i.utente_id WHERE i.torneo_id = $1
     ORDER BY CASE i.stato WHEN 'iscritto' THEN 1 WHEN 'lista_attesa' THEN 2 ELSE 3 END, i.posizione_lista NULLS FIRST, i.creata_il`, [req.params.id]
  );
  res.json(rows);
}));

app.patch('/api/admin/iscrizioni/:id', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const { stato } = req.body || {};
  if (!['iscritto', 'lista_attesa', 'annullata'].includes(stato)) return res.status(400).json({ error: 'Stato non valido.' });
  const { rows } = await pool.query('UPDATE iscrizioni SET stato=$1 WHERE id=$2 RETURNING *', [stato, req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Iscrizione non trovata.' });
  res.json(rows[0]);
}));

app.get('/api/tornei/:id/risultati', asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.id, r.posizione, r.punteggio, r.note, u.id AS utente_id, u.nome, u.cognome
     FROM risultati r JOIN utenti u ON u.id = r.utente_id WHERE r.torneo_id = $1 ORDER BY r.posizione`, [req.params.id]
  );
  res.json(rows);
}));

app.put('/api/admin/tornei/:id/risultati', authRequired, adminRequired, asyncRoute(async (req, res) => {
  const risultati = req.body?.risultati;
  if (!Array.isArray(risultati)) return res.status(400).json({ error: 'Il campo risultati deve essere un array.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM risultati WHERE torneo_id = $1', [req.params.id]);
    for (const r of risultati) {
      if (!r.utente_id || !Number.isInteger(Number(r.posizione)) || Number(r.posizione) < 1) throw new Error('Ogni risultato deve avere utente_id e posizione valida.');
      await client.query(
        'INSERT INTO risultati (torneo_id, utente_id, posizione, punteggio, note) VALUES ($1,$2,$3,$4,$5)',
        [req.params.id, r.utente_id, Number(r.posizione), Number(r.punteggio || 0), r.note || '']
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Risultati salvati.', totale: risultati.length });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.message.startsWith('Ogni risultato')) return res.status(400).json({ error: error.message });
    throw error;
  } finally {
    client.release();
  }
}));

app.use((req, res) => res.status(404).json({ error: `Endpoint non trovato: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === '23503') return res.status(400).json({ error: 'Riferimento a un record inesistente.' });
  if (error.code === '23505') return res.status(409).json({ error: 'Il dato è già presente o viola un vincolo di unicità.' });
  res.status(500).json({ error: 'Errore interno del server.' });
});

app.listen(port, () => console.log(`Backend ITS Torneo attivo su http://localhost:${port}`));
