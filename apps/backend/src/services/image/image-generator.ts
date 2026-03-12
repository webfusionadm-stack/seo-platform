import Replicate from 'replicate';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { searchAndDownloadImage } from './pexels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, '../../../../uploads');

export async function generateAndDownloadImage(
  prompt: string,
  articleId: string,
  altText: string,
): Promise<{ url: string; alt: string } | null> {
  // Fallback sur Pexels si pas de token Replicate
  if (!env.REPLICATE_API_TOKEN) {
    logger.warn('REPLICATE_API_TOKEN non configuré, fallback sur Pexels');
    return searchAndDownloadImage(prompt, articleId, altText);
  }

  try {
    const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

    logger.info(`Flux image prompt: "${prompt}"`);

    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input: {
        prompt,
        aspect_ratio: '16:9',
      },
    });

    // Flux retourne un tableau d'URLs ou un ReadableStream
    let imageUrl: string;
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else {
      logger.warn('Sortie Replicate inattendue:', output);
      return searchAndDownloadImage(prompt, articleId, altText);
    }

    logger.info(`Image Flux générée, téléchargement: ${imageUrl}`);

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      logger.warn(`Erreur téléchargement image Flux: ${imageRes.status}`);
      return searchAndDownloadImage(prompt, articleId, altText);
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // Resize 1200x630 (format 16:9 classique pour featured images)
    const resizedBuffer = await sharp(imageBuffer)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    await mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${articleId}.jpg`;
    const outputPath = join(UPLOADS_DIR, filename);
    await writeFile(outputPath, resizedBuffer);

    logger.info(`Image Flux sauvegardée: ${filename}`);

    return {
      url: `/uploads/${filename}`,
      alt: altText,
    };
  } catch (err) {
    logger.error('Erreur service Replicate Flux:', err);
    // Fallback sur Pexels en cas d'erreur
    logger.info('Fallback sur Pexels après erreur Flux');
    return searchAndDownloadImage(prompt, articleId, altText);
  }
}
