import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import ImageKit from '@imagekit/nodejs';
import { readDatabase, replaceDatabase } from '../src/server/supabase-store';
import type { DatabaseSnapshot, MediaAsset } from '../src/types/entities';

function isReferencedMediaAsset(db: DatabaseSnapshot, asset: MediaAsset) {
  if (asset.kind === 'activity')
    return db.activities.some((item) => item.imageKey === asset.imageKey);
  if (asset.kind === 'club') return db.clubs.some((item) => item.imageKey === asset.imageKey);
  if (asset.kind === 'badge') return db.badges.some((item) => item.imageKey === asset.imageKey);
  return db.categories.some((item) => item.imageKey === asset.imageKey);
}

async function main() {
  if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
    console.log(
      'ImageKit keys are not set. Skipping ImageKit upload; seeded media URLs will use the configured endpoint or local placeholders.',
    );
    return;
  }

  const client = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });
  const folder = process.env.IMAGEKIT_FOLDER || '/studentflow';
  const db = await readDatabase();
  const source = path.join(
    process.cwd(),
    'public',
    'seed-images',
    'visuals',
    'skill-route-map.png',
  );
  const evidenceSource = path.join(
    process.cwd(),
    'public',
    'seed-images',
    'evidence',
    'studentflow-evidence-placeholder.svg',
  );
  let changed = false;

  for (const asset of db.mediaAssets) {
    if (!isReferencedMediaAsset(db, asset)) {
      console.log(
        `ImageKit asset is not connected to database entities, skipped: ${asset.fileName || asset.imageKey}`,
      );
      continue;
    }
    if (asset.fileId && asset.url?.startsWith('http')) {
      console.log(`ImageKit asset already linked: ${asset.fileName || asset.imageKey}`);
      continue;
    }
    const fileName = asset.fileName || `studentflow-${asset.kind}-${asset.imageKey}.png`;
    const response = await client.files.upload({
      file: fs.createReadStream(source),
      fileName,
      folder,
    });
    const uploaded = response as {
      fileId?: string;
      url?: string;
      thumbnailUrl?: string;
      width?: number;
      height?: number;
    };
    asset.fileId = uploaded.fileId;
    asset.url = uploaded.url ?? asset.url;
    asset.thumbnailUrl = uploaded.thumbnailUrl ?? uploaded.url ?? asset.thumbnailUrl;
    asset.width = uploaded.width ?? asset.width;
    asset.height = uploaded.height ?? asset.height;
    changed = true;
    console.log(`Uploaded ImageKit asset: ${fileName}`);
  }

  const seededReports = db.reports.filter(
    (report) =>
      report.id.startsWith('report-') &&
      report.applicationId.startsWith('application-') &&
      report.evidenceUrl,
  );
  const evidenceNeedsSync = seededReports.some(
    (report) =>
      report.evidenceUrl?.includes('studentflow.edu.ua/evidence') ||
      report.evidenceUrl?.startsWith('/seed-images/evidence/'),
  );
  if (evidenceNeedsSync) {
    const response = await client.files.upload({
      file: fs.createReadStream(evidenceSource),
      fileName: 'studentflow-evidence-placeholder.svg',
      folder: `${folder.replace(/\/$/, '')}/evidence`,
      useUniqueFileName: false,
      overwriteFile: true,
    });
    const uploaded = response as { url?: string };
    if (!uploaded.url)
      throw new Error('ImageKit did not return a URL for the evidence placeholder.');
    for (const report of seededReports) report.evidenceUrl = uploaded.url;
    changed = true;
    console.log(`Uploaded ImageKit evidence placeholder: ${uploaded.url}`);
  } else {
    console.log('Seed evidence URLs are already synchronized.');
  }

  if (changed) {
    await replaceDatabase(db);
    console.log('ImageKit media assets synchronized with Supabase.');
  } else {
    console.log('ImageKit media assets are already synchronized.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
