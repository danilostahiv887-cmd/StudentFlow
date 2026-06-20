import { randomUUID } from 'node:crypto';
import { actor, failure, success } from '@/server/api';
import { DomainError } from '@/server/services';
import { imagekitClient } from '@/server/imagekit';

const maxBytes = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await actor();
    const client = imagekitClient();
    if (!client) throw new DomainError('ImageKit не налаштовано.');

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = String(formData.get('folder') || process.env.IMAGEKIT_FOLDER || '/studentflow');

    if (!(file instanceof File)) throw new DomainError('Оберіть файл зображення.');
    if (!file.type.startsWith('image/')) throw new DomainError('Можна завантажувати лише зображення.');
    if (file.size > maxBytes) throw new DomainError('Зображення має бути до 5 МБ.');

    const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png';
    const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zа-яіїєґ0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'image';
    const fileName = `${safeName}-${randomUUID().slice(0, 8)}.${extension}`;
    const encoded = Buffer.from(await file.arrayBuffer()).toString('base64');
    const response = await client.files.upload({
      file: `data:${file.type};base64,${encoded}`,
      fileName,
      folder,
    });

    const uploaded = response as { fileId?: string; url?: string; thumbnailUrl?: string; width?: number; height?: number; name?: string };
    return success({
      fileId: uploaded.fileId,
      url: uploaded.url,
      thumbnailUrl: uploaded.thumbnailUrl ?? uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      fileName: uploaded.name ?? fileName,
    });
  } catch (error) {
    return failure(error);
  }
}
