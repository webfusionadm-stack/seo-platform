import { anthropic } from '../../../../config/claude.js';
import { getH2StructureSystemPrompt, getH2StructureUserPrompt } from '../../prompts/pipeline/h2-structure.js';
import type { PipelineContext } from '../types.js';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

export async function executeH2Structure(ctx: PipelineContext): Promise<void> {
  const intentRaw = ctx.intentAnalysis?.raw || '';

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1024,
    system: getH2StructureSystemPrompt(ctx.persona),
    messages: [{
      role: 'user',
      content: getH2StructureUserPrompt(ctx.keyword, intentRaw, ctx.secondaryKeywords),
    }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const matches = [...text.matchAll(/\[H2\](.*?)\[H2\]/gs)];
  const headings = matches.map((m) => m[1].trim()).filter(Boolean);

  if (headings.length === 0) {
    throw new Error('Aucun H2 extrait de la réponse Claude');
  }

  ctx.h2Structure = { headings };
}
