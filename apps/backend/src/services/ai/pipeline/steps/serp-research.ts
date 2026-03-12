import { env } from '../../../../config/env.js';
import { logger } from '../../../../utils/logger.js';
import type { PipelineContext, SerpData, SerpResult } from '../types.js';

export async function executeSerpResearch(ctx: PipelineContext): Promise<void> {
  // 1. Query Serper API
  logger.info('SERPER_API_KEY loaded:', env.SERPER_API_KEY ? env.SERPER_API_KEY.slice(0, 10) + '...' : 'EMPTY');
  const serpResponse = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: ctx.keyword,
      gl: ctx.language === 'fr' ? 'fr' : 'us',
      hl: ctx.language,
      num: 10,
    }),
  });

  if (!serpResponse.ok) {
    throw new Error(`Serper API error: ${serpResponse.status}`);
  }

  const serpJson = await serpResponse.json() as { organic?: Array<{ title: string; link: string; snippet: string; position: number }> };
  const organic: SerpResult[] = (serpJson.organic || []).slice(0, 10).map((r) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
    position: r.position,
  }));

  // 2. Scrape top 5 via Jina
  const top5 = organic.slice(0, 5);
  const scrapePromises = top5.map(async (result) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const jinaRes = await fetch(`https://r.jina.ai/${result.link}`, {
        signal: controller.signal,
        headers: { Accept: 'text/plain' },
      });
      clearTimeout(timeout);

      if (!jinaRes.ok) return { url: result.link, title: result.title, content: '' };

      let text = await jinaRes.text();
      if (text.length > 3000) text = text.slice(0, 3000);
      return { url: result.link, title: result.title, content: text };
    } catch (err) {
      logger.warn(`Jina scrape failed for ${result.link}:`, (err as Error).message);
      return { url: result.link, title: result.title, content: '' };
    }
  });

  const scrapedContents = await Promise.all(scrapePromises);

  // 3. Compile into structured text
  const compiledText = scrapedContents
    .filter((s) => s.content.length > 0)
    .map((s, i) => `--- Résultat ${i + 1} ---\nTitre : ${s.title}\nURL : ${s.url}\nContenu :\n${s.content}`)
    .join('\n\n');

  ctx.serpData = { organic, scrapedContents, compiledText };
}
