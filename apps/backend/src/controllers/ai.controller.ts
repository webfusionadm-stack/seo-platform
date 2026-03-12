import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { anthropic } from '../config/claude.js';
import { slugify } from '../utils/slugify.js';
import { getSeoPrompt } from '../services/ai/prompts/seo-content.js';
import { getSponsoredPrompt } from '../services/ai/prompts/sponsored.js';
import { getSystemPrompt } from '../services/ai/prompts/system.js';
import { CLAUDE_MODEL, CLAUDE_MAX_TOKENS } from '@seo-platform/shared';
import { logger } from '../utils/logger.js';

export async function generateSeo(req: Request, res: Response): Promise<void> {
  const { keyword, siteId, language = 'fr', wordCount = 1500 } = req.body;

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    res.status(404).json({ error: 'Site non trouvé' });
    return;
  }

  const article = await prisma.article.create({
    data: {
      title: `Article SEO : ${keyword}`,
      slug: slugify(keyword),
      type: 'SEO_CONTENT',
      status: 'GENERATING',
      keyword,
      siteId,
    },
  });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let fullContent = '';

  try {
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: getSystemPrompt(language),
      messages: [{ role: 'user', content: getSeoPrompt(keyword, wordCount, language, site.name) }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullContent += text;
        res.write(`data: ${JSON.stringify({ type: 'text_delta', content: text })}\n\n`);
      }
    }

    const title = extractTitle(fullContent) || `Article SEO : ${keyword}`;
    const wc = fullContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

    await prisma.article.update({
      where: { id: article.id },
      data: {
        title,
        slug: slugify(title),
        content: fullContent,
        wordCount: wc,
        status: 'REVIEW',
        metaTitle: extractMeta(fullContent, 'title'),
        metaDescription: extractMeta(fullContent, 'description'),
      },
    });

    res.write(`data: ${JSON.stringify({ type: 'done', articleId: article.id, title, wordCount: wc })}\n\n`);
  } catch (err) {
    logger.error('AI generation error:', err);
    await prisma.article.update({ where: { id: article.id }, data: { status: 'DRAFT' } });
    res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`);
  }

  res.end();
}

export async function generateSponsored(req: Request, res: Response): Promise<void> {
  const { keyword, siteId, anchorText, targetUrl, brief, language = 'fr', wordCount = 1500, orderId } = req.body;

  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) {
    res.status(404).json({ error: 'Site non trouvé' });
    return;
  }

  const article = await prisma.article.create({
    data: {
      title: `Article sponsorisé : ${keyword}`,
      slug: slugify(keyword + '-sponsored'),
      type: 'SPONSORED',
      status: 'GENERATING',
      keyword,
      siteId,
      orderId: orderId || null,
    },
  });

  if (orderId) {
    await prisma.order.update({ where: { id: orderId }, data: { status: 'IN_PROGRESS' } });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let fullContent = '';

  try {
    const stream = anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: getSystemPrompt(language),
      messages: [
        { role: 'user', content: getSponsoredPrompt(keyword, anchorText, targetUrl, brief, wordCount, language, site.name) },
      ],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullContent += text;
        res.write(`data: ${JSON.stringify({ type: 'text_delta', content: text })}\n\n`);
      }
    }

    const title = extractTitle(fullContent) || `Article sponsorisé : ${keyword}`;
    const wc = fullContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;

    await prisma.article.update({
      where: { id: article.id },
      data: {
        title,
        slug: slugify(title),
        content: fullContent,
        wordCount: wc,
        status: 'REVIEW',
        metaTitle: extractMeta(fullContent, 'title'),
        metaDescription: extractMeta(fullContent, 'description'),
      },
    });

    res.write(`data: ${JSON.stringify({ type: 'done', articleId: article.id, title, wordCount: wc })}\n\n`);
  } catch (err) {
    logger.error('AI generation error:', err);
    await prisma.article.update({ where: { id: article.id }, data: { status: 'DRAFT' } });
    res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`);
  }

  res.end();
}

function extractTitle(html: string): string | null {
  const match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return match ? match[1].replace(/<[^>]*>/g, '').trim() : null;
}

function extractMeta(html: string, type: 'title' | 'description'): string | null {
  if (type === 'title') {
    const match = html.match(/<!--\s*meta-title:\s*(.*?)\s*-->/i);
    return match ? match[1].trim().slice(0, 70) : null;
  }
  const match = html.match(/<!--\s*meta-description:\s*(.*?)\s*-->/i);
  return match ? match[1].trim().slice(0, 160) : null;
}
