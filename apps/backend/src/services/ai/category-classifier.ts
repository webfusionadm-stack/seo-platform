import { anthropic } from '../../config/claude.js';
import { CLAUDE_MODEL } from '@seo-platform/shared';
import { prisma } from '../../config/database.js';
import { decrypt } from '../../utils/encryption.js';
import { normalizeWpUrl } from '../../controllers/sites.controller.js';
import { logger } from '../../utils/logger.js';

interface WpCategory {
  id: number;
  name: string;
}

async function fetchWordPressCategories(siteId: string): Promise<string[]> {
  try {
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site?.wpUrl || !site.wpUsername || !site.wpAppPasswordEnc) return [];

    const password = decrypt(site.wpAppPasswordEnc);
    const auth = 'Basic ' + Buffer.from(`${site.wpUsername}:${password}`).toString('base64');
    const baseUrl = normalizeWpUrl(site.wpUrl);

    // Fetch all categories (paginated, max 100)
    const res = await fetch(`${baseUrl}/wp-json/wp/v2/categories?per_page=100`, {
      headers: { Authorization: auth },
    });

    if (!res.ok) return [];

    const cats = (await res.json()) as WpCategory[];
    // Filter out "Uncategorized" / "Non classé"
    return cats
      .map((c) => c.name)
      .filter((name) => !['uncategorized', 'non classé'].includes(name.toLowerCase()));
  } catch (err) {
    logger.warn('Impossible de récupérer les catégories WordPress:', (err as Error).message);
    return [];
  }
}

// Cache: siteId -> { categories, fetchedAt }
const wpCategoryCache = new Map<string, { categories: string[]; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getWpCategories(siteId: string): Promise<string[]> {
  const cached = wpCategoryCache.get(siteId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.categories;
  }
  const categories = await fetchWordPressCategories(siteId);
  wpCategoryCache.set(siteId, { categories, fetchedAt: Date.now() });
  return categories;
}

export async function classifyKeywordCategory(keyword: string, siteName: string, siteId?: string): Promise<string> {
  try {
    // Fetch existing WordPress categories for the site
    const wpCategories = siteId ? await getWpCategories(siteId) : [];

    let systemPrompt: string;
    if (wpCategories.length > 0) {
      systemPrompt = `Tu es un classificateur de contenu SEO. Tu dois attribuer UNE seule catégorie à un mot-clé donné.
Tu dois OBLIGATOIREMENT choisir parmi les catégories existantes du site WordPress suivantes :
${wpCategories.map((c) => `- ${c}`).join('\n')}

Réponds UNIQUEMENT avec le nom exact de la catégorie choisie, sans explication, sans guillemets, sans ponctuation.
Choisis la catégorie la plus pertinente pour le mot-clé donné.`;
    } else {
      systemPrompt = `Tu es un classificateur de contenu SEO. Tu dois attribuer UNE seule catégorie WordPress pertinente à un mot-clé donné.
Réponds UNIQUEMENT avec le nom de la catégorie, sans explication, sans guillemets, sans ponctuation.
La catégorie doit être courte (1-3 mots), en français, et correspondre à une catégorie typique de blog/site web.`;
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 50,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Site: ${siteName}\nMot-clé: ${keyword}\n\nCatégorie:`,
      }],
    });

    const category = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    logger.info(`Catégorie auto-attribuée pour "${keyword}": ${category}${wpCategories.length > 0 ? ' (depuis WP)' : ' (générée)'}`);
    return category;
  } catch (err) {
    logger.warn(`Échec classification catégorie pour "${keyword}":`, (err as Error).message);
    return 'Non classé';
  }
}
