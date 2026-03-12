import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(import.meta.dirname, '../../../.env') });

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

async function classify(keyword: string, siteName: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 50,
    system: `Tu es un classificateur de contenu SEO. Tu dois attribuer UNE seule catégorie WordPress pertinente à un mot-clé donné.
Réponds UNIQUEMENT avec le nom de la catégorie, sans explication, sans guillemets, sans ponctuation.
La catégorie doit être courte (1-3 mots), en français, et correspondre à une catégorie typique de blog/site web.`,
    messages: [{ role: 'user', content: `Site: ${siteName}\nMot-clé: ${keyword}\n\nCatégorie:` }],
  });
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
}

async function main() {
  const schedules = await prisma.keywordSchedule.findMany({
    where: { category: null },
    include: { site: { select: { name: true } } },
  });

  console.log(`${schedules.length} schedule(s) sans catégorie à traiter`);

  for (const s of schedules) {
    const cat = await classify(s.keyword, s.site.name);
    await prisma.keywordSchedule.update({ where: { id: s.id }, data: { category: cat } });
    console.log(`  "${s.keyword}" → ${cat}`);
  }

  // Also backfill articles without category
  const articles = await prisma.article.findMany({
    where: { category: null },
    include: { site: { select: { name: true } } },
  });

  console.log(`\n${articles.length} article(s) sans catégorie à traiter`);

  for (const a of articles) {
    if (!a.keyword) continue;
    const cat = await classify(a.keyword, a.site.name);
    await prisma.article.update({ where: { id: a.id }, data: { category: cat } });
    console.log(`  "${a.keyword}" → ${cat}`);
  }

  console.log('\nTerminé.');
  await prisma.$disconnect();
}

main().catch(console.error);
