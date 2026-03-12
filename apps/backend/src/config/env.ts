import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Charge le .env à la racine du monorepo (config/ → src/ → backend/ → apps/ → root)
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '0'.repeat(64),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@seoplatform.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'changeme123',
  SERPER_API_KEY: process.env.SERPER_API_KEY || '',
  PEXELS_API_KEY: process.env.PEXELS_API_KEY || '',
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN || '',
  FREEPIK_API_KEY: process.env.FREEPIK_API_KEY || '',
};
