import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, err.stack);

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation échouée', details: err.errors });
    return;
  }

  res.status(500).json({ error: 'Erreur serveur interne' });
}
