import { pool } from './src/db.js';
import fs from 'node:fs';

async function generateSeed() {
  const users = (await pool.query('SELECT nome, cognome, email, password, ruolo FROM utente ORDER BY id')).rows;
  const tornei = (await pool.query('SELECT nome, descrizione, gioco, posti_max, stato, data_inizio, data_fine, modalita, immagine FROM torneo ORDER BY id')).rows;
  const iscrizioni = (await pool.query('SELECT utente_id, torneo_id, stato, data_iscrizione FROM iscrizione ORDER BY id')).rows;
  const risultati = (await pool.query('SELECT utente_id, torneo_id, punti, posizione, vittorie, sconfitte FROM risultato ORDER BY id')).rows;
  const faqs = (await pool.query('SELECT domanda, risposta FROM faq ORDER BY id')).rows;

  let sql = `-- ============================================================
-- SCRIPT DI POPOLAMENTO INIZIALE (SEED DATA)
-- Piattaforma ITS Tornei E-Sports & Gaming
-- ============================================================

-- Pulizia tabelle esistenti
TRUNCATE TABLE risultato, iscrizione, faq, torneo, utente RESTART IDENTITY CASCADE;

-- 1. UTENTI
INSERT INTO utente (nome, cognome, email, password, ruolo) VALUES
`;

  const userValues = users.map(u => 
    `  (${escapeSql(u.nome)}, ${escapeSql(u.cognome)}, ${escapeSql(u.email)}, ${escapeSql(u.password)}, ${escapeSql(u.ruolo)})`
  ).join(',\n');
  sql += userValues + ';\n\n';

  sql += `-- 2. TORNEI\nINSERT INTO torneo (nome, descrizione, gioco, posti_max, stato, data_inizio, data_fine, modalita, immagine) VALUES\n`;
  const torneoValues = tornei.map(t =>
    `  (${escapeSql(t.nome)}, ${escapeSql(t.descrizione)}, ${escapeSql(t.gioco)}, ${t.posti_max || 16}, ${escapeSql(t.stato)}, '${formatDate(t.data_inizio)}', '${formatDate(t.data_fine)}', ${escapeSql(t.modalita || 'IN SEDE')}, ${escapeSql(t.immagine)})`
  ).join(',\n');
  sql += torneoValues + ';\n\n';

  if (iscrizioni.length > 0) {
    sql += `-- 3. ISCRIZIONI\nINSERT INTO iscrizione (utente_id, torneo_id, stato, data_iscrizione) VALUES\n`;
    const iscrizioniValues = iscrizioni.map(i =>
      `  (${i.utente_id}, ${i.torneo_id}, ${escapeSql(i.stato)}, '${new Date(i.data_iscrizione).toISOString()}')`
    ).join(',\n');
    sql += iscrizioniValues + ';\n\n';
  }

  if (risultati.length > 0) {
    sql += `-- 4. RISULTATI\nINSERT INTO risultato (utente_id, torneo_id, punti, posizione, vittorie, sconfitte) VALUES\n`;
    const risValues = risultati.map(r =>
      `  (${r.utente_id}, ${r.torneo_id}, ${r.punti || 0}, ${r.posizione || 1}, ${r.vittorie || 0}, ${r.sconfitte || 0})`
    ).join(',\n');
    sql += risValues + ';\n\n';
  }

  if (faqs.length > 0) {
    sql += `-- 5. FAQ\nINSERT INTO faq (domanda, risposta) VALUES\n`;
    const faqValues = faqs.map(f =>
      `  (${escapeSql(f.domanda)}, ${escapeSql(f.risposta)})`
    ).join(',\n');
    sql += faqValues + ';\n';
  }

  fs.writeFileSync('./db/seed.sql', sql, 'utf-8');
  console.log('File db/seed.sql generato con successo! Righe scritte: ' + sql.split('\n').length);
  process.exit(0);
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function formatDate(val) {
  if (!val) return '2026-10-20';
  if (typeof val === 'string') return val.substring(0, 10);
  const d = new Date(val);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

generateSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
