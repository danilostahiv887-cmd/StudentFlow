import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { readDatabase } from '../src/server/supabase-store';
import type { DatabaseSnapshot, MediaAsset } from '../src/types/entities';

function runNpmScript(name: string) {
  const result = spawnSync('npm', ['run', name], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function rowCount(database: DatabaseSnapshot) {
  return Object.values(database).reduce((total, rows) => total + rows.length, 0);
}

function isReferencedMediaAsset(database: DatabaseSnapshot, asset: MediaAsset) {
  if (asset.kind === 'activity')
    return database.activities.some((item) => item.imageKey === asset.imageKey);
  if (asset.kind === 'club') return database.clubs.some((item) => item.imageKey === asset.imageKey);
  if (asset.kind === 'badge')
    return database.badges.some((item) => item.imageKey === asset.imageKey);
  return database.categories.some((item) => item.imageKey === asset.imageKey);
}

function needsImageKitSync(database: DatabaseSnapshot) {
  const hasUnlinkedReferencedMedia = database.mediaAssets.some((asset) => {
    if (!isReferencedMediaAsset(database, asset)) return false;
    return !asset.fileId || !asset.url?.startsWith('http');
  });

  const hasLegacySeedEvidence = database.reports.some((report) => {
    if (!report.id.startsWith('report-') || !report.applicationId.startsWith('application-'))
      return false;
    return Boolean(
      report.evidenceUrl?.includes('studentflow.edu.ua/evidence') ||
      report.evidenceUrl?.startsWith('/seed-images/evidence/'),
    );
  });

  return hasUnlinkedReferencedMedia || hasLegacySeedEvidence;
}

async function main() {
  const beforeSeed = await readDatabase();

  if (rowCount(beforeSeed) === 0) {
    console.log('Supabase is empty. Running initial seed.');
    runNpmScript('db:seed');
  } else {
    console.log(
      `Supabase already contains data (${rowCount(beforeSeed)} rows). Initial seed skipped.`,
    );
  }

  const database = await readDatabase();

  if (needsImageKitSync(database)) {
    console.log('ImageKit sync is required for linked database media.');
    runNpmScript('imagekit:seed');
  } else {
    console.log('ImageKit sync skipped: linked database media already has remote URLs.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
