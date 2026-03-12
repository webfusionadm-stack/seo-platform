import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, '../../../../uploads');

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
  };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

export async function searchAndDownloadImage(
  query: string,
  articleId: string,
  altText: string,
): Promise<{ url: string; alt: string } | null> {
  if (!env.PEXELS_API_KEY) {
    logger.warn('PEXELS_API_KEY non configurée, image mise en avant ignorée');
    return null;
  }

  try {
    // 1. Search Pexels
    const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`;
    logger.info(`Pexels search query: "${query}"`);
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: env.PEXELS_API_KEY },
    });

    if (!searchRes.ok) {
      logger.warn(`Pexels API error: ${searchRes.status}`);
      return null;
    }

    const data = (await searchRes.json()) as PexelsResponse;
    if (!data.photos || data.photos.length === 0) {
      logger.warn(`Aucune image Pexels trouvée pour "${query}"`);
      return null;
    }

    // 2. Pick a random photo among the top 3 results
    const topPhotos = data.photos.slice(0, Math.min(3, data.photos.length));
    const photo = topPhotos[Math.floor(Math.random() * topPhotos.length)];
    const imageUrl = photo.src.large2x || photo.src.original;
    const imageRes = await fetch(imageUrl);

    if (!imageRes.ok) {
      logger.warn(`Erreur téléchargement image Pexels: ${imageRes.status}`);
      return null;
    }

    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // 3. Resize with sharp si disponible (non disponible en environnement serverless)
    let finalBuffer: Buffer = imageBuffer;
    try {
      const { default: sharp } = await import('sharp');
      finalBuffer = await sharp(imageBuffer)
        .resize(1200, 500, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      logger.warn('sharp non disponible, image sauvegardée sans redimensionnement');
    }

    // 4. Save to uploads directory
    const uploadsDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : UPLOADS_DIR;
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${articleId}.jpg`;
    const outputPath = join(uploadsDir, filename);
    await writeFile(outputPath, finalBuffer);

    logger.info(`Image mise en avant sauvegardée: ${filename}`);

    return {
      url: `/uploads/${filename}`,
      alt: altText,
    };
  } catch (err) {
    logger.error('Erreur service Pexels:', err);
    return null;
  }
}
