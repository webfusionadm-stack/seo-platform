import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { slugify } from '../utils/slugify.js';
import { publishArticleById } from '../services/wordpress/publish.service.js';
import { logger } from '../utils/logger.js';

export async function getArticles(req: Request, res: Response): Promise<void> {
  const siteId = req.query.siteId as string | undefined;
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  const page = parseInt((req.query.page as string) || '1', 10);
  const pageSize = parseInt((req.query.pageSize as string) || '20', 10);

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = siteId;
  if (status) where.status = status;
  if (type) where.type = type;

  const skip = (page - 1) * pageSize;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: { site: { select: { name: true } }, scheduledKeyword: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  res.json({
    data: articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      content: a.content,
      keyword: a.keyword,
      category: a.category,
      wordCount: a.wordCount,
      type: a.type,
      status: a.status,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      featuredImageUrl: a.featuredImageUrl,
      featuredImageAlt: a.featuredImageAlt,
      siteId: a.siteId,
      siteName: a.site.name,
      orderId: a.orderId,
      wpPostId: a.wpPostId,
      wpPostUrl: a.wpPostUrl,
      scheduledPublishAt: a.scheduledPublishAt?.toISOString() ?? null,
      publishError: a.publishError ?? null,
      publishRetryCount: a.publishRetryCount,
      lastPublishAt: a.lastPublishAt?.toISOString() ?? null,
      keywordScheduleId: a.scheduledKeyword?.id ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getArticle(req: Request<{ id: string }>, res: Response): Promise<void> {
  const article = await prisma.article.findUnique({
    where: { id: req.params.id },
    include: { site: { select: { name: true } }, scheduledKeyword: { select: { id: true, scheduledAt: true } } },
  });

  if (!article) {
    res.status(404).json({ error: 'Article non trouvé' });
    return;
  }

  res.json({
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    keyword: article.keyword,
    category: article.category,
    wordCount: article.wordCount,
    type: article.type,
    status: article.status,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    featuredImageUrl: article.featuredImageUrl,
    featuredImageAlt: article.featuredImageAlt,
    siteId: article.siteId,
    siteName: article.site.name,
    orderId: article.orderId,
    wpPostId: article.wpPostId,
    wpPostUrl: article.wpPostUrl,
    scheduledPublishAt: article.scheduledPublishAt?.toISOString() ?? article.scheduledKeyword?.scheduledAt?.toISOString() ?? null,
    publishError: article.publishError ?? null,
    publishRetryCount: article.publishRetryCount,
    lastPublishAt: article.lastPublishAt?.toISOString() ?? null,
    keywordScheduleId: article.scheduledKeyword?.id ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  });
}

export async function createArticle(req: Request, res: Response): Promise<void> {
  const { title, content, keyword, type, siteId, orderId, metaTitle, metaDescription } = req.body;

  const wordCount = content ? content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;

  const article = await prisma.article.create({
    data: {
      title,
      slug: slugify(title),
      content: content || '',
      keyword,
      wordCount,
      type,
      siteId,
      orderId,
      metaTitle,
      metaDescription,
    },
  });

  res.status(201).json(article);
}

export async function updateArticle(req: Request<{ id: string }>, res: Response): Promise<void> {
  const data: Record<string, unknown> = { ...req.body };

  if (data.title) {
    data.slug = slugify(data.title as string);
  }
  if (data.content) {
    data.wordCount = (data.content as string).replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  }
  if (data.scheduledPublishAt) {
    data.scheduledPublishAt = new Date(data.scheduledPublishAt as string);
  }

  const article = await prisma.article.update({
    where: { id: req.params.id },
    data,
    include: { site: true, scheduledKeyword: true },
  });

  // Auto-publish: if featuredImageUrl is set, article is in REVIEW, and site has WP credentials
  if (
    article.featuredImageUrl &&
    article.status === 'REVIEW' &&
    article.site.wpUrl &&
    article.site.wpUsername &&
    article.site.wpAppPasswordEnc
  ) {
    // If linked to a keyword schedule, set as SCHEDULED instead of publishing immediately
    if (article.scheduledKeyword) {
      const scheduledPublishAt = new Date(Date.now() + 30 * 60 * 1000); // 30min dans le futur
      const updated = await prisma.article.update({
        where: { id: article.id },
        data: { status: 'SCHEDULED', scheduledPublishAt },
      });
      const { site: _s, scheduledKeyword: _sk, ...rest } = article;
      res.json({ ...rest, status: updated.status, scheduledPublishAt: updated.scheduledPublishAt?.toISOString() ?? null });
      return;
    }

    try {
      const result = await publishArticleById(article.id);
      res.json({
        ...article,
        status: 'PUBLISHED',
        wpPostId: result.wpPostId,
        wpPostUrl: result.wpPostUrl,
        site: undefined,
        scheduledKeyword: undefined,
      });
      return;
    } catch (err) {
      logger.warn('Auto-publish échoué:', (err as Error).message);
    }
  }

  const { site: _site, scheduledKeyword: _sk, ...articleWithoutSite } = article;
  res.json(articleWithoutSite);
}

export async function deleteArticle(req: Request<{ id: string }>, res: Response): Promise<void> {
  await prisma.article.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

export async function deleteAllArticles(_req: Request, res: Response): Promise<void> {
  const { count } = await prisma.article.deleteMany({});
  res.json({ deleted: count });
}

export async function retryPublishArticle(req: Request<{ id: string }>, res: Response): Promise<void> {
  const article = await prisma.article.findUnique({ where: { id: req.params.id } });

  if (!article) {
    res.status(404).json({ error: 'Article non trouvé' });
    return;
  }

  if (article.status !== 'PUBLISH_FAILED') {
    res.status(400).json({ error: 'Seuls les articles en échec de publication peuvent être relancés' });
    return;
  }

  const updated = await prisma.article.update({
    where: { id: req.params.id },
    data: {
      status: 'SCHEDULED',
      publishRetryCount: 0,
      publishError: null,
      scheduledPublishAt: new Date(),
    },
  });

  res.json({
    id: updated.id,
    status: updated.status,
    scheduledPublishAt: updated.scheduledPublishAt?.toISOString() ?? null,
  });
}
