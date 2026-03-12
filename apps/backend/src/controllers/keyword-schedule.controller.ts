import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { createBulkSchedule, triggerGeneration, triggerBulkGeneration, cancelGeneration } from '../services/scheduler/keyword-scheduler.service.js';

export async function createBulk(req: Request, res: Response): Promise<void> {
  try {
    const schedules = await createBulkSchedule(req.body);

    res.status(201).json({
      created: schedules.length,
      schedules: schedules.map((s) => ({
        id: s.id,
        keyword: s.keyword,
        category: s.category,
        siteId: s.siteId,
        siteName: s.site.name,
        language: s.language,
        wordCount: s.wordCount,
        tone: s.tone,
        scheduledAt: s.scheduledAt.toISOString(),
        articlesPerDay: s.articlesPerDay,
        status: s.status,
        articleId: s.articleId,
        errorMessage: s.errorMessage,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'Site non trouvé') {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
}

export async function listSchedules(req: Request, res: Response): Promise<void> {
  const page = parseInt((req.query.page as string) || '1', 10);
  const pageSize = parseInt((req.query.pageSize as string) || '20', 10);
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const skip = (page - 1) * pageSize;

  const [schedules, total] = await Promise.all([
    prisma.keywordSchedule.findMany({
      where,
      include: { site: { select: { name: true } } },
      orderBy: { scheduledAt: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.keywordSchedule.count({ where }),
  ]);

  res.json({
    data: schedules.map((s) => ({
      id: s.id,
      keyword: s.keyword,
      category: s.category,
      siteId: s.siteId,
      siteName: s.site.name,
      language: s.language,
      wordCount: s.wordCount,
      tone: s.tone,
      scheduledAt: s.scheduledAt.toISOString(),
      articlesPerDay: s.articlesPerDay,
      status: s.status,
      articleId: s.articleId,
      errorMessage: s.errorMessage,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function updateSchedule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const schedule = await prisma.keywordSchedule.findUnique({
    where: { id: req.params.id },
  });

  if (!schedule) {
    res.status(404).json({ error: 'Planification non trouvée' });
    return;
  }

  if (schedule.status !== 'PENDING') {
    res.status(409).json({ error: 'Seules les planifications en attente peuvent être modifiées' });
    return;
  }

  const { keyword, wordCount, tone, scheduledAt, category } = req.body;

  const updated = await prisma.keywordSchedule.update({
    where: { id: req.params.id },
    data: {
      ...(keyword !== undefined && { keyword: keyword.trim() }),
      ...(wordCount !== undefined && { wordCount }),
      ...(tone !== undefined && { tone }),
      ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
      ...(category !== undefined && { category: category || null }),
    },
    include: { site: { select: { name: true } } },
  });

  res.json({
    id: updated.id,
    keyword: updated.keyword,
    category: updated.category,
    siteId: updated.siteId,
    siteName: updated.site.name,
    language: updated.language,
    wordCount: updated.wordCount,
    tone: updated.tone,
    scheduledAt: updated.scheduledAt.toISOString(),
    articlesPerDay: updated.articlesPerDay,
    status: updated.status,
    articleId: updated.articleId,
    errorMessage: updated.errorMessage,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function generateNow(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    await triggerGeneration(req.params.id);
    res.json({ message: 'Génération lancée' });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'Planification non trouvée') {
      res.status(404).json({ error: message });
    } else if (message.includes('en attente') || message.includes('en cours')) {
      res.status(409).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
}

export async function generateAll(_req: Request, res: Response): Promise<void> {
  try {
    const count = await triggerBulkGeneration();
    res.json({ message: `Génération lancée pour ${count} planification(s)`, count });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes('en cours') || message.includes('en attente')) {
      res.status(409).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
}

export async function cancelScheduleGeneration(req: Request<{ id: string }>, res: Response): Promise<void> {
  try {
    await cancelGeneration(req.params.id);
    res.json({ message: 'Génération annulée' });
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'Planification non trouvée') {
      res.status(404).json({ error: message });
    } else if (message.includes('n\'est pas en cours')) {
      res.status(409).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
}

export async function deleteSchedule(req: Request<{ id: string }>, res: Response): Promise<void> {
  const schedule = await prisma.keywordSchedule.findUnique({
    where: { id: req.params.id },
  });

  if (!schedule) {
    res.status(404).json({ error: 'Planification non trouvée' });
    return;
  }

  if (schedule.status === 'GENERATING') {
    res.status(409).json({ error: 'Impossible de supprimer une planification en cours de génération' });
    return;
  }

  await prisma.keywordSchedule.delete({ where: { id: req.params.id } });
  res.status(204).end();
}
