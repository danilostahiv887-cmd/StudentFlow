import ImageKit from '@imagekit/nodejs';

let client: ImageKit | undefined;

export function imagekitClient() {
  if (!process.env.IMAGEKIT_PRIVATE_KEY) return undefined;
  client ??= new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });
  return client;
}

export async function deleteImageKitFile(fileId?: string) {
  const client = imagekitClient();
  if (!client || !fileId) return;
  await client.files.delete(fileId);
}
