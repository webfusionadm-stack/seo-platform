import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalSites,
    activeSites,
    totalArticles,
    publishedArticles,
    pendingOrders,
    allRevenues,
    monthlyRevenues,
    recentArticles,
    sites,
  ] = await Promise.all([
    prisma.site.count(),
    prisma.site.count({ where: { status: 'ACTIVE' } }),
    prisma.article.count(),
    prisma.article.count({ where: { status: 'PUBLISHED' } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.revenue.findMany(),
    prisma.revenue.findMany({ where: { date: { gte: startOfMonth } } }),
    prisma.article.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { site: { select: { name: true } } },
    }),
    prisma.site.findMany({
      include: {
        revenues: true,
        _count: { select: { articles: true } },
      },
    }),
  ]);

  const totalRevenue = allRevenues.reduce((sum, r) => sum + r.amount, 0);
  const monthlyRevenue = monthlyRevenues.reduce((sum, r) => sum + r.amount, 0);

  // Revenue by month (last 12 months)
  const revenueByMonth: { month: string; amount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const amount = allRevenues
      .filter((r) => {
        const rd = new Date(r.date);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
      })
      .reduce((sum, r) => sum + r.amount, 0);
    revenueByMonth.push({ month: monthKey, amount });
  }

  // Top sites by revenue
  const topSites = sites
    .map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      domain: s.domain,
      da: s.da,
      dr: s.dr,
      theme: s.theme,
      status: s.status,
      wpUrl: s.wpUrl,
      wpUsername: s.wpUsername,
      hasWpCredentials: !!s.wpAppPasswordEnc,
      wpConnected: s.wpConnected,
      articleCount: s._count.articles,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      revenue: s.revenues.reduce((sum, r) => sum + r.amount, 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({
    totalSites,
    activeSites,
    totalArticles,
    publishedArticles,
    pendingOrders,
    totalRevenue,
    monthlyRevenue,
    revenueByMonth,
    recentArticles: recentArticles.map((a) => ({
      ...a,
      siteName: a.site.name,
      site: undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    topSites,
  });
}
