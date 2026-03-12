import { marked } from 'marked';
import { anthropic } from '../../../../config/claude.js';
import { getCleanupSystemPrompt, getCleanupUserPrompt } from '../../prompts/pipeline/cleanup.js';
import type { PipelineContext } from '../types.js';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

function applyGutenbergFormatting(html: string): string {
  // 1. H2 FAQ → centré + emoji ❓
  html = html.replace(
    '<h2>Foire aux questions</h2>',
    '<h2 style="text-align:center">Foire aux questions ❓</h2>'
  );

  // 2. Tableaux → bloc Gutenberg avec hasFixedLayout: false
  html = html.replace(
    /<table>([\s\S]*?)<\/table>/g,
    '<!-- wp:table {"hasFixedLayout":false} -->\n<figure class="wp-block-table"><table>$1</table></figure>\n<!-- /wp:table -->'
  );

  return html;
}

export async function executePostProcessing(ctx: PipelineContext): Promise<void> {
  // 1. Convert markdown to HTML
  const articleHtml = await marked(ctx.articleMarkdown || '');

  // 2. Concatenate article HTML + FAQ HTML (with auto H2 heading)
  const faqSection = ctx.faqHtml ? `<h2>Foire aux questions</h2>\n${ctx.faqHtml}` : '';
  const combinedHtml = articleHtml + '\n\n' + faqSection;

  // 3. Claude cleanup pass
  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 8192,
    system: getCleanupSystemPrompt(),
    messages: [{
      role: 'user',
      content: getCleanupUserPrompt(combinedHtml),
    }],
  });

  const rawResponse = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Strip markdown code fences if Claude wrapped the response
  const stripped = rawResponse.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

  // Extract only HTML content, stripping any AI commentary before/after
  const htmlMatch = stripped.match(/<(?:h2|p|div|ul|ol|table|figure|blockquote|!--)[\s\S]*>$/);
  ctx.finalHtml = htmlMatch ? htmlMatch[0] : stripped;

  // 4. Remove any horizontal rules that slipped through
  ctx.finalHtml = ctx.finalHtml.replace(/<hr\s*\/?>/gi, '');

  // 5. Apply Gutenberg formatting (after cleanup to avoid Claude stripping it)
  ctx.finalHtml = applyGutenbergFormatting(ctx.finalHtml);
}
