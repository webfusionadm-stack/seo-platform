import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { FreepikImageProposal } from '@seo-platform/shared';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

const FREEPIK_BASE = 'https://api.freepik.com/v1';

function getHeaders() {
  return {
    'x-freepik-api-key': env.FREEPIK_API_KEY,
    'Accept': 'application/json',
  };
}

export async function searchFreepikImages(keyword: string, limit = 6, page = 1): Promise<FreepikImageProposal[]> {
  if (!env.FREEPIK_API_KEY) {
    logger.warn('FREEPIK_API_KEY non configurée, impossible de chercher des images');
    return [];
  }

  const url = new URL(`${FREEPIK_BASE}/resources`);
  url.searchParams.set('term', keyword);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('filters[content_type][photo]', '1');
  url.searchParams.set('filters[license][freemium]', '1');
  url.searchParams.set('filters[orientation][landscape]', '1');
  url.searchParams.set('order', 'relevance');
  url.searchParams.set('page', String(page));

  const res = await fetch(url.toString(), { headers: getHeaders() });

  if (!res.ok) {
    const text = await res.text();
    logger.error(`Freepik search error ${res.status}: ${text}`);
    throw new Error(`Freepik API error: ${res.status}`);
  }

  const json = await res.json() as {
    data: Array<{
      id: number;
      title: string;
      image: { source: { url: string } };
    }>;
  };

  return (json.data || []).slice(0, limit).map((item) => ({
    id: item.id,
    title: item.title || '',
    previewUrl: item.image?.source?.url || '',
  }));
}

export async function downloadFreepikImage(
  resourceId: number,
  articleId: string,
): Promise<{ url: string } | null> {
  if (!env.FREEPIK_API_KEY) {
    logger.warn('FREEPIK_API_KEY non configurée');
    return null;
  }

  // Try the official download endpoint first
  let imageUrl: string | null = null;

  try {
    const downloadUrl = `${FREEPIK_BASE}/resources/${resourceId}/download`;
    const res = await fetch(downloadUrl, { headers: getHeaders() });

    if (res.ok) {
      const json = await res.json() as { data: { url: string } };
      imageUrl = json.data?.url || null;
    } else {
      const text = await res.text();
      logger.warn(`Freepik download API returned ${res.status}: ${text}`);
    }
  } catch (err) {
    logger.warn('Freepik download endpoint failed, falling back to preview:', (err as Error).message);
  }

  // Fallback: fetch the resource detail to get the best available URL
  if (!imageUrl) {
    try {
      const detailUrl = `${FREEPIK_BASE}/resources/${resourceId}`;
      const detailRes = await fetch(detailUrl, { headers: getHeaders() });

      if (detailRes.ok) {
        const detail = await detailRes.json() as {
          data: { image: { source: { url: string } } };
        };
        imageUrl = detail.data?.image?.source?.url || null;
      }
    } catch (err) {
      logger.warn('Freepik detail endpoint failed:', (err as Error).message);
    }
  }

  if (!imageUrl) {
    logger.error(`Impossible d'obtenir l'URL pour la ressource Freepik ${resourceId}`);
    return null;
  }

  // Fetch the actual image
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    throw new Error(`Failed to fetch Freepik image: ${imageRes.status}`);
  }

  const buffer = Buffer.from(await imageRes.arrayBuffer());

  // Resize to 1200x630 and save as JPEG
  const uploadsDir = process.env.NODE_ENV === 'production'
    ? '/tmp/uploads'
    : path.join(import.meta.dirname, '../../../../uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const outputPath = path.join(uploadsDir, `${articleId}.jpg`);

  try {
    const { default: sharp } = await import('sharp');
    await sharp(buffer)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  } catch {
    logger.warn('sharp non disponible, image sauvegardée sans redimensionnement');
    writeFileSync(outputPath, buffer);
  }

  const cacheBuster = Date.now();
  logger.info(`Freepik image saved: /uploads/${articleId}.jpg`);

  return { url: `/uploads/${articleId}.jpg?v=${cacheBuster}` };
}
