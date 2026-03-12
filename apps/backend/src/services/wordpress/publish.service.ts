import { readFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '../../config/database.js';
import { decrypt } from '../../utils/encryption.js';
import { logger } from '../../utils/logger.js';
import { normalizeWpUrl } from '../../controllers/sites.controller.js';

export interface PublishResult {
  wpPostId: number;
  wpPostUrl: string;
}

export async function publishArticleById(articleId: string, categoryName?: string, scheduledAt?: Date): Promise<PublishResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { site: true },
  });

  if (!article) throw new Error('Article non trouvé');

  const { site } = article;
  if (!site.wpUrl || !site.wpUsername || !site.wpAppPasswordEnc) {
    throw new Error('Credentials WordPress manquants pour ce site');
  }

  const password = decrypt(site.wpAppPasswordEnc);
  const auth = 'Basic ' + Buffer.from(`${site.wpUsername}:${password}`).toString('base64');
  const baseUrl = normalizeWpUrl(site.wpUrl);

  // Upload featured image to WordPress if available
  let featuredMediaId: number | undefined;
  if (article.featuredImageUrl) {
    try {
      const uploadsDir = join(import.meta.dirname, '../../../../uploads');
      const filename = article.featuredImageUrl.replace('/uploads/', '').split('?')[0];
      const imageBuffer = await readFile(join(uploadsDir, filename));
      const slug = article.slug || 'article';

      const mediaRes = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Disposition': `attachment; filename="${slug}.jpg"`,
          'Content-Type': 'image/jpeg',
        },
        body: imageBuffer,
      });

      if (mediaRes.ok) {
        const media = (await mediaRes.json()) as { id: number };
        featuredMediaId = media.id;

        if (article.featuredImageAlt) {
          await fetch(`${baseUrl}/wp-json/wp/v2/media/${media.id}`, {
            method: 'POST',
            headers: {
              Authorization: auth,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ alt_text: article.featuredImageAlt }),
          });
        }

        logger.info(`Image WordPress uploadée: media ID ${media.id}`);
      } else {
        logger.warn(`Erreur upload media WordPress: ${mediaRes.status}`);
      }
    } catch (mediaErr) {
      logger.warn('Upload image WordPress échoué, publication sans image:', mediaErr);
    }
  }

  // Resolve WordPress category ID if category name is provided
  const resolvedCategory = categoryName || article.category;
  let categoryIds: number[] | undefined;
  if (resolvedCategory) {
    try {
      // Search for existing category
      const catSearchRes = await fetch(
        `${baseUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(resolvedCategory)}`,
        { headers: { Authorization: auth } },
      );
      if (catSearchRes.ok) {
        const cats = (await catSearchRes.json()) as { id: number; name: string }[];
        const match = cats.find((c) => c.name.toLowerCase() === resolvedCategory.toLowerCase());
        if (match) {
          categoryIds = [match.id];
        } else {
          // Create new category
          const catCreateRes = await fetch(`${baseUrl}/wp-json/wp/v2/categories`, {
            method: 'POST',
            headers: { Authorization: auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: resolvedCategory }),
          });
          if (catCreateRes.ok) {
            const newCat = (await catCreateRes.json()) as { id: number };
            categoryIds = [newCat.id];
          }
        }
      }
    } catch (catErr) {
      logger.warn('Résolution catégorie WordPress échouée:', catErr);
    }
  }

  const isFuture = scheduledAt && scheduledAt > new Date();
  const wpStatus = isFuture ? 'future' : 'publish';

  const wpRes = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: article.title,
      content: article.content,
      slug: article.slug,
      status: wpStatus,
      ...(isFuture ? { date: scheduledAt.toISOString() } : {}),
      ...(featuredMediaId ? { featured_media: featuredMediaId } : {}),
      ...(categoryIds ? { categories: categoryIds } : {}),
      meta: {
        _yoast_wpseo_title: article.metaTitle || article.title,
        _yoast_wpseo_metadesc: article.metaDescription || '',
        rank_math_title: article.metaTitle || article.title,
        rank_math_description: article.metaDescription || '',
        rank_math_focus_keyword: article.keyword || '',
      },
    }),
  });

  if (!wpRes.ok) {
    const errBody = await wpRes.text();
    logger.error('WordPress publish error:', errBody);
    throw new Error(`Erreur WordPress: ${wpRes.status}`);
  }

  const wpContentType = wpRes.headers.get('content-type') || '';
  if (!wpContentType.includes('application/json')) {
    throw new Error("Le serveur WordPress a renvoyé du HTML au lieu de JSON.");
  }

  const wpPost = (await wpRes.json()) as { id: number; link: string };

  // Push SEO meta
  const metaTitleVal = article.metaTitle || article.title;
  const metaDescVal = article.metaDescription || '';
  const focusKw = article.keyword || '';

  const seoMeta: Record<string, string> = {
    '_yoast_wpseo_title': metaTitleVal,
    '_yoast_wpseo_metadesc': metaDescVal,
    '_yoast_wpseo_focuskw': focusKw,
    'rank_math_title': metaTitleVal,
    'rank_math_description': metaDescVal,
    'rank_math_focus_keyword': focusKw,
  };

  for (const [key, value] of Object.entries(seoMeta)) {
    try {
      await fetch(`${baseUrl}/wp-json/wp/v2/posts/${wpPost.id}`, {
        method: 'PUT',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: { [key]: value } }),
      });
    } catch {
      // Ignore individual meta failures
    }
  }

  // RankMath REST API fallback
  try {
    await fetch(`${baseUrl}/wp-json/rankmath/v1/updateMeta`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        objectID: wpPost.id,
        objectType: 'post',
        meta: {
          rank_math_title: metaTitleVal,
          rank_math_description: metaDescVal,
          rank_math_focus_keyword: focusKw,
        },
      }),
    });
  } catch {
    // RankMath endpoint may not exist
  }

  logger.info(`SEO meta pushed for WP post ${wpPost.id}`);

  // Update article status
  await prisma.article.update({
    where: { id: article.id },
    data: {
      status: isFuture ? 'SCHEDULED' : 'PUBLISHED',
      ...(isFuture ? { scheduledPublishAt: scheduledAt } : {}),
      wpPostId: wpPost.id,
      wpPostUrl: wpPost.link,
    },
  });

  // Update order status if linked
  if (article.orderId) {
    await prisma.order.update({
      where: { id: article.orderId },
      data: { status: 'PUBLISHED' },
    });
  }

  return { wpPostId: wpPost.id, wpPostUrl: wpPost.link };
}
