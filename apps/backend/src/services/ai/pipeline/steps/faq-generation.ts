import { randomBytes } from 'crypto';
import { anthropic } from '../../../../config/claude.js';
import { getFaqSystemPrompt, getFaqUserPrompt } from '../../prompts/pipeline/faq.js';
import type { PipelineContext } from '../types.js';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

/**
 * Transforms raw FAQ HTML into valid Gutenberg Rank Math FAQ block format.
 * Adds the required JSON attributes in the opening comment so WordPress
 * actually renders the FAQ content.
 */
function transformFaqToGutenbergFormat(html: string): string {
  const itemRegex = /<div class="rank-math-faq-item">\s*<h3 class="rank-math-question">([\s\S]*?)<\/h3>\s*<div class="rank-math-answer">([\s\S]*?)<\/div>\s*<\/div>/g;

  const questions: { id: string; title: string; content: string; visible: boolean }[] = [];
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(html)) !== null) {
    const title = match[1].trim();
    let content = match[2].trim();

    // Wrap answer in <p> if not already wrapped
    if (!content.startsWith('<p>')) {
      content = `<p>${content}</p>`;
    }

    const id = `faq-question-${Date.now()}-${randomBytes(3).toString('hex')}`;
    questions.push({ id, title, content, visible: true });
  }

  // Fallback: if no questions parsed, return original HTML
  if (questions.length === 0) {
    return html;
  }

  const jsonAttr = JSON.stringify({ questions });

  const innerItems = questions
    .map(
      (q) =>
        `<div class="rank-math-faq-item">\n<h3 class="rank-math-question">${q.title}</h3>\n<div class="rank-math-answer">${q.content}</div>\n</div>`,
    )
    .join('\n');

  return `<!-- wp:rank-math/faq-block ${jsonAttr} -->\n<div class="wp-block-rank-math-faq-block">\n${innerItems}\n</div>\n<!-- /wp:rank-math/faq-block -->`;
}

export async function executeFaqGeneration(ctx: PipelineContext): Promise<void> {
  const articleMarkdown = ctx.articleMarkdown || '';

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 2048,
    system: getFaqSystemPrompt(ctx.persona),
    messages: [{
      role: 'user',
      content: getFaqUserPrompt(ctx.keyword, articleMarkdown),
    }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Extract the FAQ block - either the wp:rank-math block or the entire response
  const faqMatch = text.match(/<!-- wp:rank-math\/faq-block[\s\S]*?-->[\s\S]*?<!-- \/wp:rank-math\/faq-block -->/);
  const rawFaqHtml = faqMatch ? faqMatch[0] : text;

  // Transform to valid Gutenberg format with JSON attributes in the comment
  ctx.faqHtml = transformFaqToGutenbergFormat(rawFaqHtml);
}
