import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';
import { getSupabaseWakeStatus, shouldAttemptSupabaseWake } from '../src/server/supabase-wake';

const pollMs = 10_000;
const maxWaitMs = Number(process.env.SUPABASE_SETUP_WAIT_MS ?? 300_000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shortError(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function waitForProjectRestore() {
  const deadline = Date.now() + maxWaitMs;
  let status = await getSupabaseWakeStatus({ restoreIfPaused: true });

  if (status.state === 'unconfigured') return;
  if (status.state === 'error') {
    console.warn(`Supabase wake check failed: ${status.message}`);
    return;
  }

  while (status.state !== 'ready') {
    console.log(`${status.message} Статус: ${status.projectStatus ?? status.state}. Повторна перевірка за 10 секунд.`);
    if (Date.now() + pollMs > deadline) {
      throw new Error('Supabase не стала доступною вчасно. Відновіть проєкт у Dashboard або збільшіть SUPABASE_SETUP_WAIT_MS.');
    }

    await sleep(pollMs);
    status = await getSupabaseWakeStatus({ restoreIfPaused: true });
    if (status.state === 'error') {
      console.warn(`Supabase wake check failed: ${status.message}`);
      return;
    }
  }
}

async function applyMigrations(databaseUrl: string) {
  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1') ? false : 'require',
    onnotice: () => undefined,
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
}

async function main() {
  const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Не задано SUPABASE_DB_URL або DATABASE_URL у .env.');
  }

  await waitForProjectRestore();

  const deadline = Date.now() + maxWaitMs;
  while (true) {
    try {
      await applyMigrations(databaseUrl);
      return;
    } catch (error) {
      if (!shouldAttemptSupabaseWake(error) || Date.now() + pollMs > deadline) throw error;
      console.log(`Supabase ще не приймає DB-з’єднання: ${shortError(error)}. Повтор за 10 секунд.`);
      await getSupabaseWakeStatus({ restoreIfPaused: true }).catch(() => undefined);
      await sleep(pollMs);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
