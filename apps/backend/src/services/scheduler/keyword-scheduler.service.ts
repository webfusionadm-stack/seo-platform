import { prisma } from '../../config/database.js';
import { slugify } from '../../utils/slugify.js';
import { logger } from '../../utils/logger.js';
import { runSeoPipeline } from '../ai/pipeline/seo-pipeline.js';
import { classifyKeywordCategory } from '../ai/category-classifier.js';
import { searchFreepikImages, downloadFreepikImage } from '../image/freepik.js';
import type { PipelineContext } from '../ai/pipeline/types.js';

interface BulkScheduleInput {
  keywords: string[];
  siteId: string;
  articlesPerDay: number;
  preferredHours: number[];
  wordCount: number;
  tone: string;
  language: string;
  category?: string;
}

export function computeScheduledDates(
  keywordCount: number,
  articlesPerDay: number,
  preferredHours: number[],
): Date[] {
  const hours = Array.from({ length: articlesPerDay }, (_, i) => preferredHours[i] ?? preferredHours[0] ?? 9);

  const dates: Date[] = [];
  const now = new Date();
  const startDay = new Date(now);
  startDay.setDate(startDay.getDate() + 1);
  startDay.setHours(0, 0, 0, 0);

  let dayOffset = 0;
  let slotInDay = 0;

  for (let i = 0; i < keywordCount; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hours[slotInDay], 0, 0, 0);
    dates.push(d);

    slotInDay++;
    if (slotInDay >= articlesPerDay) {
      slotInDay = 0;
      dayOffset++;
    }
  }

  return dates;
}

export async function createBulkSchedule(input: BulkScheduleInput) {
  const { keywords, siteId, articlesPerDay, preferredHours, wordCount, tone, language, category } = input;

  // Verify site exists
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error('Site non trouvé');

  const dates = computeScheduledDates(keywords.length, articlesPerDay, preferredHours);

  // Auto-classify categories for each keyword if not provided by user
  let categories: string[];
  if (category) {
    // User provided a single category for all keywords
    categories = keywords.map(() => category);
  } else {
    // Auto-classify each keyword via AI (in parallel, batched by 5)
    categories = [];
    for (let i = 0; i < keywords.length; i += 5) {
      const batch = keywords.slice(i, i + 5);
      const results = await Promise.all(
        batch.map((kw) => classifyKeywordCategory(kw.trim(), site.name, siteId))
      );
      categories.push(...results);
    }
  }

  const schedules = await prisma.$transaction(
    keywords.map((keyword, i) =>
      prisma.keywordSchedule.create({
        data: {
          keyword: keyword.trim(),
          category: categories[i] || null,
          siteId,
          language,
          wordCount,
          tone,
          scheduledAt: dates[i],
          articlesPerDay,
          status: 'PENDING',
        },
        include: { site: { select: { name: true } } },
      })
    )
  );

  return schedules;
}

async function generateForSchedule(scheduleId: string): Promise<void> {
  const schedule = await prisma.keywordSchedule.findUnique({
    where: { id: scheduleId },
    include: { site: { include: { persona: true } } },
  });

  if (!schedule) throw new Error('Planification non trouvée');

  logger.info(`Génération de l'article pour "${schedule.keyword}" (schedule ${schedule.id})`);

  // Mark as GENERATING
  await prisma.keywordSchedule.update({
    where: { id: schedule.id },
    data: { status: 'GENERATING' },
  });

  try {
    // Auto-classify category if not already set (e.g. old schedules created before this feature)
    let category = schedule.category;
    if (!category) {
      category = await classifyKeywordCategory(schedule.keyword, schedule.site.name, schedule.siteId);
      await prisma.keywordSchedule.update({
        where: { id: schedule.id },
        data: { category },
      });
    }

    const article = await prisma.article.create({
      data: {
        title: `Article SEO : ${schedule.keyword}`,
        slug: slugify(schedule.keyword),
        type: 'SEO_CONTENT',
        status: 'GENERATING',
        keyword: schedule.keyword,
        category,
        siteId: schedule.siteId,
      },
    });

    const generation = await prisma.articleGeneration.create({
      data: {
        articleId: article.id,
        keyword: schedule.keyword,
        secondaryKeywords: [],
        siteId: schedule.siteId,
        language: schedule.language,
        wordCount: schedule.wordCount,
        tone: schedule.tone,
        status: 'RUNNING',
        currentStep: 0,
      },
    });

    const ctx: PipelineContext = {
      keyword: schedule.keyword,
      secondaryKeywords: [],
      siteId: schedule.siteId,
      siteName: schedule.site.name,
      language: schedule.language,
      wordCount: schedule.wordCount,
      tone: schedule.tone,
      persona: schedule.site.persona ? {
        name: schedule.site.persona.name,
        tone: schedule.site.persona.tone,
        writingStyle: schedule.site.persona.writingStyle,
        vocabulary: schedule.site.persona.vocabulary,
        anecdoteType: schedule.site.persona.anecdoteType,
        formalityLevel: schedule.site.persona.formalityLevel,
        recurringExpressions: schedule.site.persona.recurringExpressions,
        additionalInstructions: schedule.site.persona.additionalInstructions,
      } : undefined,
      articleId: article.id,
      generationId: generation.id,
    };

    await runSeoPipeline(ctx);

    // Vérifier si la génération a été annulée pendant le pipeline
    if (cancelledSchedules.has(schedule.id)) {
      cancelledSchedules.delete(schedule.id);
      logger.info(`Génération annulée pour "${schedule.keyword}" — résultats ignorés`);
      return;
    }

    await prisma.keywordSchedule.update({
      where: { id: schedule.id },
      data: {
        status: 'DONE',
        articleId: article.id,
      },
    });

    logger.info(`Article "${schedule.keyword}" généré avec succès (article ${article.id})`);

    // Auto-sélection de l'image à la une
    try {
      const proposals = await searchFreepikImages(schedule.keyword, 1);
      if (proposals.length > 0) {
        const imgResult = await downloadFreepikImage(proposals[0].id, article.id);
        if (imgResult) {
          await prisma.article.update({
            where: { id: article.id },
            data: { featuredImageUrl: imgResult.url },
          });
          logger.info(`Image auto-sélectionnée pour "${schedule.keyword}": ${imgResult.url}`);
        }
      }
    } catch (imgErr) {
      logger.warn(`Auto-sélection image échouée pour "${schedule.keyword}" (non-bloquant):`, imgErr);
    }

    // Planifier la publication WordPress via le cron (laisse le temps de changer l'image)
    const site = await prisma.site.findUnique({ where: { id: schedule.siteId } });
    if (site?.wpConnected && site.wpUrl && site.wpUsername && site.wpAppPasswordEnc) {
      await prisma.article.update({
        where: { id: article.id },
        data: { status: 'SCHEDULED', scheduledPublishAt: schedule.scheduledAt },
      });
      logger.info(`Article "${schedule.keyword}" planifié pour publication le ${schedule.scheduledAt.toISOString()}`);
    }
  } catch (err) {
    logger.error(`Erreur génération "${schedule.keyword}":`, err);

    await prisma.keywordSchedule.update({
      where: { id: schedule.id },
      data: {
        status: 'FAILED',
        errorMessage: (err as Error).message,
      },
    });
  }
}

let bulkGenerationRunning = false;
const cancelledSchedules = new Set<string>();

export async function triggerBulkGeneration(): Promise<number> {
  // Check no generation is already in progress
  const generating = await prisma.keywordSchedule.findFirst({
    where: { status: 'GENERATING' },
  });
  if (generating || bulkGenerationRunning) {
    throw new Error('Une génération est déjà en cours, veuillez patienter');
  }

  const pendingSchedules = await prisma.keywordSchedule.findMany({
    where: { status: 'PENDING' },
    orderBy: { scheduledAt: 'asc' },
  });

  if (pendingSchedules.length === 0) {
    throw new Error('Aucune planification en attente');
  }

  const count = pendingSchedules.length;

  // Fire-and-forget: run sequentially in background
  (async () => {
    bulkGenerationRunning = true;
    try {
      for (const schedule of pendingSchedules) {
        try {
          await generateForSchedule(schedule.id);
        } catch (err) {
          logger.error(`Bulk generation: erreur pour "${schedule.keyword}":`, err);
          // Continue with next
        }
      }
    } finally {
      bulkGenerationRunning = false;
    }
  })();

  return count;
}

export function isBulkGenerationRunning(): boolean {
  return bulkGenerationRunning;
}

export async function cancelGeneration(scheduleId: string): Promise<void> {
  const schedule = await prisma.keywordSchedule.findUnique({
    where: { id: scheduleId },
    include: { article: true },
  });

  if (!schedule) throw new Error('Planification non trouvée');
  if (schedule.status !== 'GENERATING') throw new Error('La planification n\'est pas en cours de génération');

  // Marquer comme annulé pour que generateForSchedule ignore les résultats
  cancelledSchedules.add(scheduleId);

  // Forcer le statut en DB immédiatement
  await prisma.keywordSchedule.update({
    where: { id: scheduleId },
    data: { status: 'FAILED', errorMessage: 'Génération annulée' },
  });

  // Remettre l'article en DRAFT si existant
  if (schedule.articleId) {
    await prisma.article.update({
      where: { id: schedule.articleId },
      data: { status: 'DRAFT' },
    });
  }

  // Réinitialiser le flag pour débloquer les futures générations
  bulkGenerationRunning = false;

  logger.info(`Génération annulée pour "${schedule.keyword}" (schedule ${scheduleId})`);
}

export async function triggerGeneration(scheduleId: string): Promise<void> {
  const schedule = await prisma.keywordSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!schedule) throw new Error('Planification non trouvée');
  if (schedule.status !== 'PENDING') throw new Error('Seules les planifications en attente peuvent être lancées');

  // Check if there's already a generation in progress
  const generating = await prisma.keywordSchedule.findFirst({
    where: { status: 'GENERATING' },
  });
  if (generating) throw new Error('Une génération est déjà en cours, veuillez patienter');

  // Fire and forget — runs in background
  generateForSchedule(scheduleId);
}

export async function runDueSchedules(): Promise<void> {
  if (bulkGenerationRunning) return;

  const generating = await prisma.keywordSchedule.findFirst({
    where: { status: 'GENERATING' },
  });
  if (generating) return;

  const schedule = await prisma.keywordSchedule.findFirst({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  if (!schedule) return;

  generateForSchedule(schedule.id);
}
