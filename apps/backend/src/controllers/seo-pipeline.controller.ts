import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { slugify } from '../utils/slugify.js';
import { logger } from '../utils/logger.js';
import { runSeoPipeline } from '../services/ai/pipeline/seo-pipeline.js';
import type { PipelineContext } from '../services/ai/pipeline/types.js';

export async function generateSeoPipeline(req: Request, res: Response): Promise<void> {
  const {
    keyword,
    secondaryKeywords = [],
    siteId,
    language = 'fr',
    wordCount = 1200,
    tone = 'professionnel',
  } = req.body;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { persona: true },
  });
  if (!site) {
    res.status(404).json({ error: 'Site non trouvé' });
    return;
  }

  // Create article in GENERATING status
  const article = await prisma.article.create({
    data: {
      title: `Article SEO : ${keyword}`,
      slug: slugify(keyword),
      type: 'SEO_CONTENT',
      status: 'GENERATING',
      keyword,
      siteId,
    },
  });

  // Create generation tracking record
  const generation = await prisma.articleGeneration.create({
    data: {
      articleId: article.id,
      keyword,
      secondaryKeywords,
      siteId,
      language,
      wordCount,
      tone,
      status: 'RUNNING',
      currentStep: 0,
    },
  });

  // Open SSE stream
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const ctx: PipelineContext = {
    keyword,
    secondaryKeywords,
    siteId,
    siteName: site.name,
    language,
    wordCount,
    tone,
    persona: site.persona ? {
      name: site.persona.name,
      tone: site.persona.tone,
      writingStyle: site.persona.writingStyle,
      vocabulary: site.persona.vocabulary,
      anecdoteType: site.persona.anecdoteType,
      formalityLevel: site.persona.formalityLevel,
      recurringExpressions: site.persona.recurringExpressions,
      additionalInstructions: site.persona.additionalInstructions,
    } : undefined,
    articleId: article.id,
    generationId: generation.id,
    res,
  };

  await runSeoPipeline(ctx);

  res.end();
}
