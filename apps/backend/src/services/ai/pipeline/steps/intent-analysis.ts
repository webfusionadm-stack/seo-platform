import { anthropic } from '../../../../config/claude.js';
import { CLAUDE_MODEL } from '@seo-platform/shared';
import { getIntentAnalysisSystemPrompt, getIntentAnalysisUserPrompt } from '../../prompts/pipeline/intent-analysis.js';
import type { PipelineContext } from '../types.js';

export async function executeIntentAnalysis(ctx: PipelineContext): Promise<void> {
  const serpCompiled = ctx.serpData?.compiledText || '';

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: getIntentAnalysisSystemPrompt(),
    messages: [{
      role: 'user',
      content: getIntentAnalysisUserPrompt(ctx.keyword, serpCompiled),
    }],
  });

  const raw = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  ctx.intentAnalysis = { raw };
}
