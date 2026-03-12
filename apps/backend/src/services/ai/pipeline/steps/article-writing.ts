import { anthropic } from '../../../../config/claude.js';
import { CLAUDE_MODEL, CLAUDE_MAX_TOKENS } from '@seo-platform/shared';
import { getArticleWritingSystemPrompt, getArticleWritingUserPrompt } from '../../prompts/pipeline/article-writing.js';
import type { PipelineContext } from '../types.js';

export async function executeArticleWriting(ctx: PipelineContext): Promise<void> {
  const intentRaw = ctx.intentAnalysis?.raw || '';
  const h2Headings = ctx.h2Structure?.headings || [];

  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: CLAUDE_MAX_TOKENS,
    system: getArticleWritingSystemPrompt(ctx.tone, ctx.persona),
    messages: [{
      role: 'user',
      content: getArticleWritingUserPrompt(
        ctx.keyword,
        ctx.secondaryKeywords,
        intentRaw,
        h2Headings,
        ctx.wordCount,
        ctx.language,
      ),
    }],
  });

  let fullMarkdown = '';

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const text = event.delta.text;
      fullMarkdown += text;
      if (ctx.res) ctx.res.write(`data: ${JSON.stringify({ type: 'text_delta', content: text })}\n\n`);
    }
  }

  // Strip markdown code fences if Claude wrapped the response
  ctx.articleMarkdown = fullMarkdown
    .replace(/^```(?:markdown|html|md)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '');
}
