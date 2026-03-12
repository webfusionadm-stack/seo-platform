// ===== Enums =====

export const ArticleType = {
  SEO_CONTENT: 'SEO_CONTENT',
  SPONSORED: 'SPONSORED',
} as const;
export type ArticleType = (typeof ArticleType)[keyof typeof ArticleType];

export const ArticleStatus = {
  DRAFT: 'DRAFT',
  GENERATING: 'GENERATING',
  REVIEW: 'REVIEW',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  WAITING_REDACTION: 'WAITING_REDACTION',
  IMAGE_PENDING: 'IMAGE_PENDING',
  SUSPENDED: 'SUSPENDED',
  PUBLISH_FAILED: 'PUBLISH_FAILED',
} as const;
export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

export const OrderStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  PUBLISHED: 'PUBLISHED',
  COMPLETED: 'COMPLETED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const RevenueType = {
  SPONSORED_ARTICLE: 'SPONSORED_ARTICLE',
  LINK_SALE: 'LINK_SALE',
  OTHER: 'OTHER',
} as const;
export type RevenueType = (typeof RevenueType)[keyof typeof RevenueType];

export const SiteStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
} as const;
export type SiteStatus = (typeof SiteStatus)[keyof typeof SiteStatus];

// ===== Persona =====

export interface PersonaDTO {
  id: string;
  name: string;
  age: number;
  tone: string;
  theme: string;
  writingStyle: string;
  vocabulary: string;
  anecdoteType: string;
  formalityLevel: string;
  recurringExpressions: string;
  additionalInstructions: string;
  userId: string;
  siteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonaRequest {
  name: string;
  theme?: string;
  age?: number;
}

export interface UpdatePersonaRequest {
  name?: string;
  theme?: string;
  tone?: string;
  age?: number;
  writingStyle?: string;
  vocabulary?: string;
  anecdoteType?: string;
  formalityLevel?: string;
  recurringExpressions?: string;
  additionalInstructions?: string;
}

// ===== Persona Analysis =====

export interface AnalyzePersonaSampleRequest {
  sampleText: string;
}

export interface AnalyzePersonaSampleResponse {
  tone: string;
  formalityLevel: string;
  theme: string;
  style: string;
}

// ===== DTOs =====

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: { id: string; email: string };
}

export interface SiteDTO {
  id: string;
  name: string;
  url: string;
  domain: string;
  da: number | null;
  dr: number | null;
  theme: string | null;
  status: SiteStatus;
  wpUrl: string | null;
  wpUsername: string | null;
  hasWpCredentials: boolean;
  wpConnected: boolean;
  personaId: string | null;
  personaName: string | null;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteRequest {
  name: string;
  url: string;
  domain: string;
  da?: number;
  dr?: number;
  theme?: string;
  wpUrl?: string;
  wpUsername?: string;
  wpAppPassword?: string;
  personaId?: string;
}

export interface UpdateSiteRequest extends Partial<CreateSiteRequest> {}

export interface ArticleDTO {
  id: string;
  title: string;
  slug: string;
  content: string;
  keyword: string | null;
  category: string | null;
  wordCount: number;
  type: ArticleType;
  status: ArticleStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  siteId: string;
  siteName?: string;
  orderId: string | null;
  wpPostId: number | null;
  wpPostUrl: string | null;
  scheduledPublishAt: string | null;
  publishError: string | null;
  publishRetryCount: number;
  lastPublishAt: string | null;
  keywordScheduleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleRequest {
  title: string;
  content?: string;
  keyword?: string;
  type: ArticleType;
  siteId: string;
  orderId?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  keyword?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: ArticleStatus;
}

export interface GenerateSeoRequest {
  keyword: string;
  siteId: string;
  language?: string;
  wordCount?: number;
}

export interface GenerateSponsoredRequest {
  keyword: string;
  siteId: string;
  anchorText: string;
  targetUrl: string;
  brief?: string;
  language?: string;
  wordCount?: number;
  orderId?: string;
}

export interface OrderDTO {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientUrl: string;
  anchorText: string;
  brief: string | null;
  price: number;
  currency: string;
  status: OrderStatus;
  siteId: string;
  siteName?: string;
  articleId: string | null;
  revenueId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  clientName: string;
  clientEmail?: string;
  clientUrl: string;
  anchorText: string;
  brief?: string;
  price: number;
  currency?: string;
  siteId: string;
}

export interface UpdateOrderRequest {
  clientName?: string;
  clientEmail?: string;
  clientUrl?: string;
  anchorText?: string;
  brief?: string;
  price?: number;
  status?: OrderStatus;
}

export interface RevenueDTO {
  id: string;
  amount: number;
  currency: string;
  type: RevenueType;
  description: string | null;
  date: string;
  siteId: string;
  siteName?: string;
  orderId: string | null;
  createdAt: string;
}

export interface CreateRevenueRequest {
  amount: number;
  currency?: string;
  type: RevenueType;
  description?: string;
  date?: string;
  siteId: string;
  orderId?: string;
}

export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  totalArticles: number;
  publishedArticles: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueByMonth: { month: string; amount: number }[];
  recentArticles: ArticleDTO[];
  topSites: (SiteDTO & { revenue: number })[];
}

export interface RevenueStats {
  total: number;
  monthly: number;
  byType: { type: RevenueType; total: number }[];
  byMonth: { month: string; amount: number }[];
  bySite: { siteId: string; siteName: string; total: number }[];
}

// ===== Freepik Image Selection =====

export interface FreepikImageProposal {
  id: number;
  title: string;
  previewUrl: string;
}

export interface SelectImageRequest {
  articleId: string;
  freepikResourceId: number;
}

// ===== SSE Events =====

export interface SSETextDelta {
  type: 'text_delta';
  content: string;
}

export interface SSEDone {
  type: 'done';
  articleId: string;
  title: string;
  wordCount: number;
}

export interface SSEError {
  type: 'error';
  message: string;
}

// Pipeline SSE Events
export interface SSEPipelineStart { type: 'pipeline_start'; articleId: string; totalSteps: number; }
export interface SSEStepStart { type: 'step_start'; step: number; label: string; }
export interface SSEStepProgress { type: 'step_progress'; step: number; detail: string; }
export interface SSEStepComplete { type: 'step_complete'; step: number; summary?: Record<string, unknown>; }
export interface SSEPipelineDone {
  type: 'done'; articleId: string; title: string; slug: string;
  metaTitle: string; metaDescription: string; wordCount: number; content: string;
  featuredImageUrl?: string;
}

export interface SSEImageProposals {
  type: 'image_proposals';
  images: FreepikImageProposal[];
  searchKeyword: string;
}

export type PipelineSSEEvent = SSEPipelineStart | SSEStepStart | SSEStepProgress | SSEStepComplete | SSETextDelta | SSEPipelineDone | SSEImageProposals | SSEError;

export type SSEEvent = SSETextDelta | SSEDone | SSEError | SSEPipelineStart | SSEStepStart | SSEStepProgress | SSEStepComplete | SSEPipelineDone | SSEImageProposals;

export interface GenerateSeoPipelineRequest {
  keyword: string;
  secondaryKeywords?: string[];
  siteId: string;
  language?: string;
  wordCount?: number;
  tone?: string;
}

// ===== Keyword Schedule =====

export const KeywordScheduleStatus = {
  PENDING: 'PENDING',
  GENERATING: 'GENERATING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const;
export type KeywordScheduleStatus = (typeof KeywordScheduleStatus)[keyof typeof KeywordScheduleStatus];

export interface KeywordScheduleDTO {
  id: string;
  keyword: string;
  category: string | null;
  siteId: string;
  siteName?: string;
  language: string;
  wordCount: number;
  tone: string;
  scheduledAt: string;
  articlesPerDay: number;
  status: KeywordScheduleStatus;
  articleId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBulkScheduleRequest {
  keywords: string[];
  siteId: string;
  articlesPerDay: number;
  preferredHours: number[];
  wordCount?: number;
  tone?: string;
  language?: string;
  category?: string;
}

export interface BulkScheduleResponse {
  created: number;
  schedules: KeywordScheduleDTO[];
}

// ===== Pagination =====

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
