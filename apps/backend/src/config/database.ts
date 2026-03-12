import { PrismaClient } from '@prisma/client';

// Neon ajoute channel_binding=require qui n'est pas supporté par Prisma
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || '';
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('channel_binding');
    return parsed.toString();
  } catch {
    return url;
  }
}

export const prisma = new PrismaClient({
  datasources: { db: { url: getDatabaseUrl() } },
});
