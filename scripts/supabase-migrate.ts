import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Не задано SUPABASE_DB_URL або DATABASE_URL у .env.');
}

const sql = postgres(databaseUrl, {
  max: 1,
  prepare: false,
  ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : 'require',
});

try {
  const dir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const migration = await readFile(path.join(dir, file), 'utf8');
    await sql.unsafe(migration);
    console.log(`Applied migration: ${file}`);
  }
} finally {
  await sql.end();
}
