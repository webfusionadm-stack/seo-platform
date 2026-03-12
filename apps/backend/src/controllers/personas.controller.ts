import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { anthropic } from '../config/claude.js';
import { CLAUDE_MODEL } from '@seo-platform/shared';
import { getPersonaGenerationPrompt } from '../services/ai/prompts/persona-generation.js';
import { getPersonaAnalysisPrompt } from '../services/ai/prompts/persona-analysis.js';

interface GeneratedPersonaFields {
  tone: string;
  writingStyle: string;
  vocabulary: string;
  anecdoteType: string;
  formalityLevel: string;
  recurringExpressions: string;
  additionalInstructions: string;
}

const DEFAULT_STYLE = 'Son style est naturel et fluide, adapté au web. Il utilise un ton conversationnel et accessible, comme s\'il parlait à un ami. Il vouvoie le lecteur tout en restant chaleureux. Il structure ses idées avec des paragraphes courts et alterne phrases punchy et explications. Son vocabulaire est courant et moderne, jamais jargonneux. Il utilise des expressions comme \'en fait\', \'du coup\', \'clairement\' pour rythmer son texte.';

async function generatePersonaFields(name: string, theme: string, age: number): Promise<GeneratedPersonaFields> {
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: getPersonaGenerationPrompt(name, theme, age),
      }],
    });

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const parsed = JSON.parse(raw);

    return {
      tone: parsed.tone || 'conversationnel',
      writingStyle: parsed.style || DEFAULT_STYLE,
      formalityLevel: parsed.formalityLevel || 'semi-formel',
      vocabulary: '',
      anecdoteType: '',
      recurringExpressions: '',
      additionalInstructions: '',
    };
  } catch (err) {
    console.error('Persona AI generation failed, using defaults:', err);
    return {
      tone: 'conversationnel',
      writingStyle: DEFAULT_STYLE,
      formalityLevel: 'semi-formel',
      vocabulary: '',
      anecdoteType: '',
      recurringExpressions: '',
      additionalInstructions: '',
    };
  }
}

function toPersonaDTO(p: any) {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    tone: p.tone,
    theme: p.theme,
    writingStyle: p.writingStyle,
    vocabulary: p.vocabulary,
    anecdoteType: p.anecdoteType,
    formalityLevel: p.formalityLevel,
    recurringExpressions: p.recurringExpressions,
    additionalInstructions: p.additionalInstructions,
    userId: p.userId,
    siteCount: p._count?.sites ?? 0,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

const includeCount = { _count: { select: { sites: true } } };

export async function getPersonas(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.userId;
  const personas = await prisma.persona.findMany({
    where: { userId },
    include: includeCount,
    orderBy: { createdAt: 'desc' },
  });

  res.json(personas.map(toPersonaDTO));
}

export async function getPersona(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = (req as any).user.userId;
  const persona = await prisma.persona.findFirst({
    where: { id: req.params.id, userId },
    include: includeCount,
  });

  if (!persona) {
    res.status(404).json({ error: 'Persona non trouvé' });
    return;
  }

  res.json(toPersonaDTO(persona));
}

export async function createPersona(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user.userId;
  const { name, theme = 'généraliste', age = 30 } = req.body;

  const generated = await generatePersonaFields(name, theme, age);

  const persona = await prisma.persona.create({
    data: {
      name,
      theme,
      age,
      ...generated,
      userId,
    },
    include: includeCount,
  });

  res.status(201).json(toPersonaDTO(persona));
}

export async function updatePersona(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = (req as any).user.userId;

  const existing = await prisma.persona.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) {
    res.status(404).json({ error: 'Persona non trouvé' });
    return;
  }

  const persona = await prisma.persona.update({
    where: { id: req.params.id },
    data: req.body,
    include: includeCount,
  });

  res.json(toPersonaDTO(persona));
}

export async function regeneratePersona(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = (req as any).user.userId;

  const existing = await prisma.persona.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) {
    res.status(404).json({ error: 'Persona non trouvé' });
    return;
  }

  const generated = await generatePersonaFields(existing.name, existing.theme, existing.age);

  const persona = await prisma.persona.update({
    where: { id: req.params.id },
    data: generated,
    include: includeCount,
  });

  res.json(toPersonaDTO(persona));
}

export async function deletePersona(req: Request<{ id: string }>, res: Response): Promise<void> {
  const userId = (req as any).user.userId;

  const existing = await prisma.persona.findFirst({ where: { id: req.params.id, userId } });
  if (!existing) {
    res.status(404).json({ error: 'Persona non trouvé' });
    return;
  }

  await prisma.persona.delete({ where: { id: req.params.id } });
  res.status(204).end();
}

export async function analyzePersonaSample(req: Request, res: Response): Promise<void> {
  const { sampleText } = req.body;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: getPersonaAnalysisPrompt(sampleText),
      }],
    });

    const raw = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const parsed = JSON.parse(raw);

    res.json({
      tone: parsed.tone || 'conversationnel',
      formalityLevel: parsed.formalityLevel || 'semi-formel',
      theme: parsed.theme || 'généraliste',
      style: parsed.style || '',
    });
  } catch (err) {
    console.error('Persona sample analysis failed:', err);
    res.status(500).json({ error: 'Échec de l\'analyse de l\'article exemple' });
  }
}
