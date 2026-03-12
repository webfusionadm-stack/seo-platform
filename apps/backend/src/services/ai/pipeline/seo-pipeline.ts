import { prisma } from '../../../config/database.js';
import { logger } from '../../../utils/logger.js';
import { PIPELINE_STEP_LABELS, PIPELINE_TOTAL_STEPS } from '@seo-platform/shared';
import { executeSerpResearch } from './steps/serp-research.js';
import { executeIntentAnalysis } from './steps/intent-analysis.js';
import { executeMetadataGeneration } from './steps/metadata-generation.js';
import { executeH2Structure } from './steps/h2-structure.js';
import { executeArticleWriting } from './steps/article-writing.js';
import { executeFaqGeneration } from './steps/faq-generation.js';
import { executePostProcessing } from './steps/post-processing.js';
import { executeFeaturedImage, type FeaturedImageResult } from './steps/featured-image.js';
import type { PipelineContext } from './types.js';

function emit(ctx: PipelineContext, data: Record<string, unknown>): void {
  if (ctx.res) ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function runWithRetry(
  stepFn: (ctx: PipelineContext) => Promise<void>,
  ctx: PipelineContext,
  stepNumber: number,
  maxRetries = 2,
): Promise<void> {
  const backoffs = [1000, 2000];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await stepFn(ctx);
      return;
    } catch (err) {
      if (attempt < maxRetries) {
        logger.warn(`Step ${stepNumber} attempt ${attempt + 1} failed, retrying...`, (err as Error).message);
        await new Promise((r) => setTimeout(r, backoffs[attempt]));
      } else {
        throw err;
      }
    }
  }
}

async function runStep(
  stepNumber: number,
  stepFn: (ctx: PipelineContext) => Promise<void>,
  ctx: PipelineContext,
  saveField?: string,
): Promise<void> {
  const label = PIPELINE_STEP_LABELS[stepNumber] || `Étape ${stepNumber}`;
  emit(ctx, { type: 'step_start', step: stepNumber, label });

  await prisma.articleGeneration.update({
    where: { id: ctx.generationId },
    data: { currentStep: stepNumber },
  });

  await runWithRetry(stepFn, ctx, stepNumber);

  // Save step result to DB
  if (saveField) {
    const value = (ctx as unknown as Record<string, unknown>)[saveField];
    await prisma.articleGeneration.update({
      where: { id: ctx.generationId },
      data: { [saveField]: typeof value === 'string' ? value : JSON.stringify(value) },
    });
  }

  emit(ctx, { type: 'step_complete', step: stepNumber });
}

export async function runSeoPipeline(ctx: PipelineContext): Promise<void> {
  try {
    emit(ctx, { type: 'pipeline_start', articleId: ctx.articleId, totalSteps: PIPELINE_TOTAL_STEPS });

    // Step 1: SERP Research
    await runStep(1, executeSerpResearch, ctx, 'serpData');

    // Step 2: Intent Analysis
    await runStep(2, executeIntentAnalysis, ctx, 'intentAnalysis');

    // Steps 3+4+5 in parallel (metadata + H2 + featured image)
    const label3 = PIPELINE_STEP_LABELS[3] || 'Métadonnées';
    const label4 = PIPELINE_STEP_LABELS[4] || 'Structure H2';
    const label5 = PIPELINE_STEP_LABELS[5] || 'Image mise en avant';
    emit(ctx, { type: 'step_start', step: 3, label: label3 });
    emit(ctx, { type: 'step_start', step: 4, label: label4 });
    emit(ctx, { type: 'step_start', step: 5, label: label5 });

    await prisma.articleGeneration.update({
      where: { id: ctx.generationId },
      data: { currentStep: 3 },
    });

    let imageResult: FeaturedImageResult = { imageProposals: [], searchKeyword: ctx.keyword };

    await Promise.all([
      runWithRetry(executeMetadataGeneration, ctx, 3),
      runWithRetry(executeH2Structure, ctx, 4),
      executeFeaturedImage(ctx).then((r) => { imageResult = r; }),
    ]);

    // Save parallel step results
    await prisma.articleGeneration.update({
      where: { id: ctx.generationId },
      data: {
        metadata: ctx.metadata ? JSON.stringify(ctx.metadata) : undefined,
        h2Structure: ctx.h2Structure ? JSON.stringify(ctx.h2Structure) : undefined,
        currentStep: 5,
      },
    });

    // Emit image proposals for user selection
    if (imageResult.imageProposals.length > 0) {
      emit(ctx, {
        type: 'image_proposals',
        images: imageResult.imageProposals,
        searchKeyword: imageResult.searchKeyword,
      });
    }

    emit(ctx, { type: 'step_complete', step: 3 });
    emit(ctx, { type: 'step_complete', step: 4 });
    emit(ctx, { type: 'step_complete', step: 5 });

    // Step 6: Article Writing (streaming)
    await runStep(6, executeArticleWriting, ctx, 'articleMarkdown');

    // Step 7: FAQ Generation
    await runStep(7, executeFaqGeneration, ctx, 'faqHtml');

    // Step 8: Post-processing
    await runStep(8, executePostProcessing, ctx, 'finalHtml');

    // Count words from final HTML
    const wordCount = (ctx.finalHtml || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean).length;

    const title = ctx.metadata?.title || `Article SEO : ${ctx.keyword}`;
    const slug = ctx.metadata?.slug || ctx.keyword.toLowerCase().replace(/\s+/g, '-');
    const metaTitle = ctx.metadata?.metaTitle || title;
    const metaDescription = ctx.metadata?.metaDescription || '';

    // Update article with final content
    await prisma.article.update({
      where: { id: ctx.articleId },
      data: {
        title,
        slug,
        content: ctx.finalHtml || '',
        keyword: ctx.keyword,
        wordCount,
        metaTitle,
        metaDescription,
        status: 'REVIEW',
      },
    });

    // Mark generation as completed
    await prisma.articleGeneration.update({
      where: { id: ctx.generationId },
      data: { status: 'COMPLETED', finalHtml: ctx.finalHtml },
    });

    // Emit done
    emit(ctx, {
      type: 'done',
      articleId: ctx.articleId,
      title,
      slug,
      metaTitle,
      metaDescription,
      wordCount,
      content: ctx.finalHtml || '',
      ...(imageResult.imageProposals.length > 0 ? { imageProposals: imageResult.imageProposals, searchKeyword: imageResult.searchKeyword } : {}),
    });
  } catch (err) {
    logger.error('Pipeline error:', err);

    const currentStep = await prisma.articleGeneration.findUnique({
      where: { id: ctx.generationId },
      select: { currentStep: true },
    });

    await prisma.articleGeneration.update({
      where: { id: ctx.generationId },
      data: {
        status: 'FAILED',
        failedStep: currentStep?.currentStep || 0,
        errorMessage: (err as Error).message,
      },
    });

    await prisma.article.update({
      where: { id: ctx.articleId },
      data: { status: 'DRAFT' },
    });

    emit(ctx, { type: 'error', message: (err as Error).message });
  }
}
