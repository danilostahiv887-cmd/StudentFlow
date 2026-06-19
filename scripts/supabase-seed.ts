import 'dotenv/config';
import { hash } from 'bcryptjs';
import { buildSeed, seedPasswords } from './seed-data';
import { readDatabase, replaceDatabase } from '../src/server/supabase-store';

const force = process.argv.includes('--force');
const existing = await readDatabase();

if (!force && existing.profiles.length > 0) {
  console.log('Supabase already contains profiles. Seed skipped. Use npm run db:seed:force to reset and refill.');
  process.exit(0);
}

const snapshot = await buildSeed((password) => hash(password, 10));
await replaceDatabase(snapshot);

console.log(force ? 'Supabase seed reset completed.' : 'Supabase seed completed.');
console.log('Seed accounts:');
console.log(`admin: danylo.stakhiv@studentflow.edu.ua / ${seedPasswords.admin}`);
console.log(`teacher: olena.levchenko@studentflow.edu.ua / ${seedPasswords.teacher}`);
console.log(`student: ivan.bondar@studentflow.edu.ua / ${seedPasswords.student}`);
