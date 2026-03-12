import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export function normalizeWpUrl(url: string): string {
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  u = u.replace(/\/+$/, '');
  u = u.replace(/\/wp-admin\/?$/i, '');
  u = u.replace(/\/wp-json\/?$/i, '');
  u = u.replace(/\/+$/, '');
  return u;
}

export async function getSites(_req: Request, res: Response): Promise<void> {
  const sites = await prisma.site.findMany({
    include: { _count: { select: { articles: true } }, persona: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    sites.map((s) => ({
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
      personaId: s.personaId,
      personaName: s.persona?.name ?? null,
      articleCount: s._count.articles,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }))
  );
}

export async function getSite(req: Request<{ id: string }>, res: Response): Promise<void> {
  const site = await prisma.site.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { articles: true } }, persona: { select: { name: true } } },
  });

  if (!site) {
    res.status(404).json({ error: 'Site non trouvé' });
    return;
  }

  res.json({
    id: site.id,
    name: site.name,
    url: site.url,
    domain: site.domain,
    da: site.da,
    dr: site.dr,
    theme: site.theme,
    status: site.status,
    wpUrl: site.wpUrl,
    wpUsername: site.wpUsername,
    hasWpCredentials: !!site.wpAppPasswordEnc,
    wpConnected: site.wpConnected,
    personaId: site.personaId,
    personaName: site.persona?.name ?? null,
    articleCount: site._count.articles,
    createdAt: site.createdAt.toISOString(),
    updatedAt: site.updatedAt.toISOString(),
  });
}

export async function createSite(req: Request, res: Response): Promise<void> {
  const { wpAppPassword, personaId, ...data } = req.body;

  if (data.wpUrl) data.wpUrl = normalizeWpUrl(data.wpUrl);

  const site = await prisma.site.create({
    data: {
      ...data,
      wpAppPasswordEnc: wpAppPassword ? encrypt(wpAppPassword) : null,
      personaId: personaId || null,
    },
  });

  res.status(201).json(site);
}

export async function updateSite(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { wpAppPassword, personaId, ...data } = req.body;

  if (data.wpUrl) data.wpUrl = normalizeWpUrl(data.wpUrl);

  const updateData: Record<string, unknown> = { ...data };
  if (wpAppPassword !== undefined) {
    updateData.wpAppPasswordEnc = wpAppPassword ? encrypt(wpAppPassword) : null;
  }
  if (personaId !== undefined) {
    updateData.personaId = personaId || null;
  }

  const site = await prisma.site.update({
    where: { id: req.params.id },
    data: updateData,
  });

  res.json(site);
}

export async function deleteSite(req: Request<{ id: string }>, res: Response): Promise<void> {
  await prisma.site.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

export async function testConnection(req: Request<{ id: string }>, res: Response): Promise<void> {
  const site = await prisma.site.findUnique({ where: { id: req.params.id } });
  if (!site || !site.wpUrl || !site.wpUsername || !site.wpAppPasswordEnc) {
    res.status(400).json({ error: 'Credentials WordPress manquants' });
    return;
  }

  try {
    const password = decrypt(site.wpAppPasswordEnc);
    const baseUrl = normalizeWpUrl(site.wpUrl);
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${site.wpUsername}:${password}`).toString('base64'),
      },
    });

    if (!response.ok) {
      await prisma.site.update({ where: { id: site.id }, data: { wpConnected: false } });
      res.json({ connected: false, error: `HTTP ${response.status}` });
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      await prisma.site.update({ where: { id: site.id }, data: { wpConnected: false } });
      res.json({ connected: false, error: "Le serveur WordPress a renvoyé du HTML au lieu de JSON. Vérifiez l'URL et que l'API REST WP est activée." });
      return;
    }

    await prisma.site.update({ where: { id: site.id }, data: { wpConnected: true } });
    const userData = (await response.json()) as { name: string };
    res.json({ connected: true, wpUser: userData.name });
  } catch (err: unknown) {
    await prisma.site.update({ where: { id: site.id }, data: { wpConnected: false } });
    res.json({ connected: false, error: (err as Error).message });
  }
}
