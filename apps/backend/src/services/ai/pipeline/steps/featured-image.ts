import { searchFreepikImages } from '../../../image/freepik.js';
import { anthropic } from '../../../../config/claude.js';
import { logger } from '../../../../utils/logger.js';
import type { PipelineContext } from '../types.js';
import type { FreepikImageProposal } from '@seo-platform/shared';

async function generateSearchKeyword(ctx: PipelineContext): Promise<string> {
  const intentSummary = ctx.intentAnalysis?.raw
    ? ctx.intentAnalysis.raw.substring(0, 500)
    : '';

  const userPrompt = [
    `Mot-clé principal : ${ctx.keyword}`,
    ctx.secondaryKeywords.length > 0
      ? `Mots-clés secondaires : ${ctx.secondaryKeywords.slice(0, 5).join(', ')}`
      : '',
    intentSummary ? `Intention de recherche : ${intentSummary}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    system:
      'Tu es un expert en recherche d\'images. Réponds UNIQUEMENT avec 2-4 mots-clés en anglais pour trouver une photo pertinente sur une banque d\'images. ' +
      'Pas de guillemets, pas de ponctuation, juste les mots-clés séparés par des espaces.',
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  if (text) {
    logger.info(`Keyword de recherche image: "${text}"`);
    return text;
  }

  logger.warn('Fallback sur le keyword principal pour la recherche image');
  return ctx.keyword;
}

export interface FeaturedImageResult {
  imageProposals: FreepikImageProposal[];
  searchKeyword: string;
}

export async function executeFeaturedImage(ctx: PipelineContext): Promise<FeaturedImageResult> {
  try {
    const searchKeyword = await generateSearchKeyword(ctx);
    const imageProposals = await searchFreepikImages(searchKeyword, 6);

    if (imageProposals.length > 0) {
      logger.info(`${imageProposals.length} propositions d'images Freepik trouvées pour "${searchKeyword}"`);
    } else {
      logger.warn(`Aucune image Freepik trouvée pour "${searchKeyword}"`);
    }

    return { imageProposals, searchKeyword };
  } catch (err) {
    logger.warn('Erreur recherche Freepik (non-bloquant):', err);
    return { imageProposals: [], searchKeyword: ctx.keyword };
  }
}
