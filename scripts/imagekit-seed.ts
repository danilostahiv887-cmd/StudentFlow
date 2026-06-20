import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import ImageKit from '@imagekit/nodejs';
import { readDatabase, replaceDatabase } from '../src/server/supabase-store';

async function main() {
  if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
    console.log('ImageKit keys are not set. Skipping ImageKit upload; seeded media URLs will use the configured endpoint or local placeholders.');
    return;
  }

  const client = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });
  const folder = process.env.IMAGEKIT_FOLDER || '/studentflow';
  const db = await readDatabase();
  const source = path.join(process.cwd(), 'public', 'seed-images', 'visuals', 'skill-route-map.png');
  let changed = false;

  for (const asset of db.mediaAssets) {
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
    const uploaded = response as { fileId?: string; url?: string; thumbnailUrl?: string; width?: number; height?: number };
    asset.fileId = uploaded.fileId;
    asset.url = uploaded.url ?? asset.url;
    asset.thumbnailUrl = uploaded.thumbnailUrl ?? uploaded.url ?? asset.thumbnailUrl;
    asset.width = uploaded.width ?? asset.width;
    asset.height = uploaded.height ?? asset.height;
    changed = true;
    console.log(`Uploaded ImageKit asset: ${fileName}`);
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
