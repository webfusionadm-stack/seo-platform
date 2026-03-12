import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export async function getOrders(req: Request, res: Response): Promise<void> {
  const siteId = req.query.siteId as string | undefined;
  const status = req.query.status as string | undefined;
  const page = parseInt((req.query.page as string) || '1', 10);
  const pageSize = parseInt((req.query.pageSize as string) || '20', 10);

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = siteId;
  if (status) where.status = status;

  const skip = (page - 1) * pageSize;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        site: { select: { name: true } },
        article: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    data: orders.map((o) => ({
      id: o.id,
      clientName: o.clientName,
      clientEmail: o.clientEmail,
      clientUrl: o.clientUrl,
      anchorText: o.anchorText,
      brief: o.brief,
      price: o.price,
      currency: o.currency,
      status: o.status,
      siteId: o.siteId,
      siteName: o.site.name,
      articleId: o.article?.id || null,
      revenueId: null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function getOrder(req: Request<{ id: string }>, res: Response): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      site: { select: { name: true } },
      article: { select: { id: true } },
    },
  });

  if (!order) {
    res.status(404).json({ error: 'Commande non trouvée' });
    return;
  }

  res.json({
    id: order.id,
    clientName: order.clientName,
    clientEmail: order.clientEmail,
    clientUrl: order.clientUrl,
    anchorText: order.anchorText,
    brief: order.brief,
    price: order.price,
    currency: order.currency,
    status: order.status,
    siteId: order.siteId,
    siteName: order.site.name,
    articleId: order.article?.id || null,
    revenueId: null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const order = await prisma.order.create({ data: req.body });
  res.status(201).json(order);
}

export async function updateOrder(req: Request<{ id: string }>, res: Response): Promise<void> {
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: req.body,
  });

  // Auto-create revenue when order is completed
  if (req.body.status === 'COMPLETED') {
    const existing = await prisma.revenue.findFirst({ where: { orderId: order.id } });
    if (!existing) {
      await prisma.revenue.create({
        data: {
          amount: order.price,
          currency: order.currency,
          type: 'SPONSORED_ARTICLE',
          description: `Commande ${order.clientName} - ${order.anchorText}`,
          siteId: order.siteId,
          orderId: order.id,
        },
      });
    }
  }

  res.json(order);
}

export async function deleteOrder(req: Request<{ id: string }>, res: Response): Promise<void> {
  await prisma.order.delete({ where: { id: req.params.id } });
  res.status(204).end();
}
