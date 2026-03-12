import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export async function getRevenues(req: Request, res: Response): Promise<void> {
  const { siteId, type, page = '1', pageSize = '20' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (siteId) where.siteId = siteId;
  if (type) where.type = type;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const [revenues, total] = await Promise.all([
    prisma.revenue.findMany({
      where,
      include: { site: { select: { name: true } } },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
    prisma.revenue.count({ where }),
  ]);

  res.json({
    data: revenues.map((r) => ({
      id: r.id,
      amount: r.amount,
      currency: r.currency,
      type: r.type,
      description: r.description,
      date: r.date.toISOString(),
      siteId: r.siteId,
      siteName: r.site.name,
      orderId: r.orderId,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page: parseInt(page),
    pageSize: take,
    totalPages: Math.ceil(total / take),
  });
}

export async function createRevenue(req: Request, res: Response): Promise<void> {
  const data = { ...req.body };
  if (data.date) data.date = new Date(data.date);

  const revenue = await prisma.revenue.create({ data });
  res.status(201).json(revenue);
}

export async function getRevenueStats(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allRevenues, monthlyRevenues] = await Promise.all([
    prisma.revenue.findMany({ include: { site: { select: { name: true } } } }),
    prisma.revenue.findMany({ where: { date: { gte: startOfMonth } } }),
  ]);

  const total = allRevenues.reduce((sum, r) => sum + r.amount, 0);
  const monthly = monthlyRevenues.reduce((sum, r) => sum + r.amount, 0);

  // By type
  const byType = Object.entries(
    allRevenues.reduce(
      (acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + r.amount;
        return acc;
      },
      {} as Record<string, number>
    )
  ).map(([type, total]) => ({ type, total }));

  // By month (last 12 months)
  const byMonth: { month: string; amount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const amount = allRevenues
      .filter((r) => {
        const rd = new Date(r.date);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      })
      .reduce((sum, r) => sum + r.amount, 0);
    byMonth.push({ month: monthKey, amount });
  }

  // By site
  const bySiteMap: Record<string, { siteName: string; total: number }> = {};
  for (const r of allRevenues) {
    if (!bySiteMap[r.siteId]) {
      bySiteMap[r.siteId] = { siteName: r.site.name, total: 0 };
    }
    bySiteMap[r.siteId].total += r.amount;
  }
  const bySite = Object.entries(bySiteMap).map(([siteId, data]) => ({
    siteId,
    ...data,
  }));

  res.json({ total, monthly, byType, byMonth, bySite });
}
