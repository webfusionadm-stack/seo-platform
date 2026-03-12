import { Response } from 'express';

export interface SerpResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

export interface SerpData {
  organic: SerpResult[];
  scrapedContents: { url: string; title: string; content: string }[];
  compiledText: string;
}

export interface IntentAnalysis {
  raw: string;
}

export interface MetadataResult {
  title: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
}

export interface H2Structure {
  headings: string[];
}

export interface PersonaData {
  name: string;
  tone: string;
  writingStyle: string;
  vocabulary: string;
  anecdoteType: string;
  formalityLevel: string;
  recurringExpressions: string;
  additionalInstructions: string;
}

export interface PipelineContext {
  // Input
  keyword: string;
  secondaryKeywords: string[];
  siteId: string;
  siteName: string;
  language: string;
  wordCount: number;
  tone: string;

  // Persona
  persona?: PersonaData;

  // DB refs
  articleId: string;
  generationId: string;

  // SSE response (optional for background generation)
  res?: Response;

  // Step outputs
  serpData?: SerpData;
  intentAnalysis?: IntentAnalysis;
  metadata?: MetadataResult;
  h2Structure?: H2Structure;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  articleMarkdown?: string;
  faqHtml?: string;
  finalHtml?: string;
}
