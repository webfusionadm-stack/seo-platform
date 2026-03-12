export const API_BASE_URL = '/api';

export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
export const CLAUDE_MAX_TOKENS = 8192;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ARTICLE_TYPES = ['SEO_CONTENT', 'SPONSORED'] as const;
export const ARTICLE_STATUSES = ['DRAFT', 'GENERATING', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'WAITING_REDACTION', 'IMAGE_PENDING', 'SUSPENDED'] as const;
export const ORDER_STATUSES = ['PENDING', 'IN_PROGRESS', 'PUBLISHED', 'COMPLETED'] as const;
export const REVENUE_TYPES = ['SPONSORED_ARTICLE', 'LINK_SALE', 'OTHER'] as const;
export const SITE_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING'] as const;

export const PIPELINE_STEP_LABELS: Record<number, string> = {
  1: 'Recherche SERP', 2: "Analyse d'intention", 3: 'Métadonnées',
  4: 'Structure H2', 5: 'Image mise en avant', 6: 'Rédaction', 7: 'FAQ', 8: 'Post-traitement',
};
export const PIPELINE_TOTAL_STEPS = 8;

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'gray',
  GENERATING: 'blue',
  REVIEW: 'yellow',
  SCHEDULED: 'cyan',
  PUBLISHED: 'green',
  WAITING_REDACTION: 'orange',
  IMAGE_PENDING: 'purple',
  SUSPENDED: 'red',
  PENDING: 'orange',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  ACTIVE: 'green',
  INACTIVE: 'red',
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  GENERATING: 'Génération...',
  REVIEW: 'À relire',
  SCHEDULED: 'Planifié',
  PUBLISHED: 'Publié',
  WAITING_REDACTION: 'En attente de rédaction',
  IMAGE_PENDING: 'Image en attente',
  SUSPENDED: 'Suspendu',
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  SEO_CONTENT: 'Contenu SEO',
  SPONSORED: 'Sponsorisé',
  SPONSORED_ARTICLE: 'Article sponsorisé',
  LINK_SALE: 'Vente de lien',
  OTHER: 'Autre',
};
