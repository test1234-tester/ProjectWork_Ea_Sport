import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool, types } = pg;

// FIX TIMEZONE: I campi DATE di PostgreSQL vengono restituiti come stringhe "YYYY-MM-DD"
// senza conversione in oggetti Date JavaScript (che causerebbero -1 giorno per UTC+2)
types.setTypeParser(types.builtins.DATE, (val) => val); // restituisce stringa grezza

export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'progettoexprivia',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
});

pool.on('error', (error) => {
  console.error('Errore inatteso del pool PostgreSQL:', error.message);
});
