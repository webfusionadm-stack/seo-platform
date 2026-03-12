import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  url: z.string().url('URL invalide'),
  domain: z.string().min(1, 'Domaine requis'),
  da: z.number().min(0).max(100).optional(),
  dr: z.number().min(0).max(100).optional(),
  theme: z.string().max(50).optional(),
  wpUrl: z.string().url('URL WordPress invalide').optional().or(z.literal('')),
  wpUsername: z.string().optional().or(z.literal('')),
  wpAppPassword: z.string().optional().or(z.literal('')),
  personaId: z.string().uuid().optional().or(z.literal('')),
});

export const updateSiteSchema = createSiteSchema.partial();

export const createPersonaSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  theme: z.string().max(200).default('généraliste'),
  age: z.number().int().min(16).max(99).default(30),
});

export const updatePersonaSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100).optional(),
  theme: z.string().max(200).optional(),
  tone: z.string().max(50).optional(),
  age: z.number().int().min(16).max(99).optional(),
  writingStyle: z.string().max(2000).optional(),
  vocabulary: z.string().max(2000).optional(),
  anecdoteType: z.string().max(2000).optional(),
  formalityLevel: z.string().max(50).optional(),
  recurringExpressions: z.string().max(2000).optional(),
  additionalInstructions: z.string().max(5000).optional(),
});

export const analyzePersonaSampleSchema = z.object({
  sampleText: z.string().min(200, 'L\'article doit contenir au moins 200 caractères').max(50000, 'L\'article ne doit pas dépasser 50000 caractères'),
});

export const createArticleSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  content: z.string().optional(),
  keyword: z.string().optional(),
  type: z.enum(['SEO_CONTENT', 'SPONSORED']),
  siteId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  keyword: z.string().optional(),
  category: z.string().max(100).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  status: z.enum(['DRAFT', 'GENERATING', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'WAITING_REDACTION', 'IMAGE_PENDING', 'SUSPENDED', 'PUBLISH_FAILED']).optional(),
  scheduledPublishAt: z.string().datetime().optional(),
});

export const generateSeoSchema = z.object({
  keyword: z.string().min(1, 'Mot-clé requis'),
  siteId: z.string().uuid(),
  language: z.string().default('fr'),
  wordCount: z.number().min(300).max(5000).default(1500),
});

export const generateSponsoredSchema = z.object({
  keyword: z.string().min(1, 'Mot-clé requis'),
  siteId: z.string().uuid(),
  anchorText: z.string().min(1, "Texte d'ancre requis"),
  targetUrl: z.string().url('URL cible invalide'),
  brief: z.string().optional(),
  language: z.string().default('fr'),
  wordCount: z.number().min(300).max(5000).default(1500),
  orderId: z.string().uuid().optional(),
});

export const generateSeoPipelineSchema = z.object({
  keyword: z.string().min(1, 'Mot-clé requis'),
  secondaryKeywords: z.array(z.string()).max(10).default([]),
  siteId: z.string().uuid(),
  language: z.string().default('fr'),
  wordCount: z.number().min(900).max(1800).default(1200),
  tone: z.enum(['professionnel', 'conversationnel', 'academique', 'enthousiaste', 'neutre']).default('professionnel'),
});

export const createOrderSchema = z.object({
  clientName: z.string().min(1, 'Nom client requis'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientUrl: z.string().url('URL client invalide'),
  anchorText: z.string().min(1, "Texte d'ancre requis"),
  brief: z.string().optional(),
  price: z.number().positive('Prix doit être positif'),
  currency: z.string().default('EUR'),
  siteId: z.string().uuid(),
});

export const updateOrderSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  clientUrl: z.string().url().optional(),
  anchorText: z.string().min(1).optional(),
  brief: z.string().optional(),
  price: z.number().positive().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PUBLISHED', 'COMPLETED']).optional(),
});

export const createRevenueSchema = z.object({
  amount: z.number().positive('Montant doit être positif'),
  currency: z.string().default('EUR'),
  type: z.enum(['SPONSORED_ARTICLE', 'LINK_SALE', 'OTHER']),
  description: z.string().optional(),
  date: z.string().optional(),
  siteId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
});

export const createBulkScheduleSchema = z.object({
  keywords: z.array(z.string().min(1, 'Mot-clé requis')).min(1, 'Au moins 1 mot-clé').max(30, 'Maximum 30 mots-clés'),
  siteId: z.string().uuid(),
  articlesPerDay: z.number().int().min(1).max(2).default(1),
  preferredHours: z.array(z.number().int().min(0).max(23)).min(1).max(2).default([9]),
  wordCount: z.number().min(900).max(1800).default(1200),
  tone: z.enum(['professionnel', 'conversationnel', 'academique', 'enthousiaste', 'neutre']).default('professionnel'),
  language: z.string().default('fr'),
  category: z.string().max(100).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
