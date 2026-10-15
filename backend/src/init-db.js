import { readFile } from 'node:fs/promises';
import { pool } from './db.js';

try {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
  console.log('Tabelle create/verificate correttamente nel database PostgreSQL.');
} catch (error) {
  console.error('Impossibile inizializzare il database:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
