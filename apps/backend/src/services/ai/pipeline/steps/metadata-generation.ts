import { anthropic } from '../../../../config/claude.js';
import { getMetadataSystemPrompt, getMetadataUserPrompt } from '../../prompts/pipeline/metadata.js';
import type { PipelineContext } from '../types.js';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

export async function executeMetadataGeneration(ctx: PipelineContext): Promise<void> {
  const intentRaw = ctx.intentAnalysis?.raw || '';

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    system: getMetadataSystemPrompt(),
    messages: [{
      role: 'user',
      content: getMetadataUserPrompt(ctx.keyword, intentRaw, ctx.secondaryKeywords),
    }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const titleMatch = text.match(/\[TITLE\](.*?)\[TITLE\]/s);
  const metaTitleMatch = text.match(/\[META_TITLE\](.*?)\[META_TITLE\]/s);
  const metaDescMatch = text.match(/\[META_DESC\](.*?)\[META_DESC\]/s);
  const slugMatch = text.match(/\[SLUG\](.*?)\[SLUG\]/s);

  // Replace outdated years with current year (2026)
  const fixYear = (s: string) => s.replace(/\b(2024|2025)\b/g, '2026');

  ctx.metadata = {
    title: fixYear(titleMatch?.[1]?.trim() || `Article : ${ctx.keyword}`),
    metaTitle: fixYear(metaTitleMatch?.[1]?.trim() || ctx.keyword),
    metaDescription: fixYear(metaDescMatch?.[1]?.trim() || ''),
    slug: slugMatch?.[1]?.trim().toLowerCase().replace(/\s+/g, '-').replace(/\b(2024|2025)\b/g, '2026') || ctx.keyword.toLowerCase().replace(/\s+/g, '-'),
  };
}
