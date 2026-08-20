import { Router } from 'express';
import type { RequestHandler } from 'express';

import { getDatabaseStatus, isDatabaseConfigured } from '../db.js';
import { authRouter } from './auth.js';
import { calculationsRouter } from './calculations.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/calculations', calculationsRouter);

apiRouter.get('/health', ((_req, res) => {
  res.json({
    ok: true,
    service: 'pfm-api',
    database: isDatabaseConfigured() ? 'configured' : 'not-configured'
  });
}) satisfies RequestHandler);

apiRouter.get('/version', ((_req, res) => {
  res.json({
    name: 'pfm-api',
    version: process.env.npm_package_version || '0.0.0'
  });
}) satisfies RequestHandler);

apiRouter.get('/db/health', (async (_req, res) => {
  try {
    const database = await getDatabaseStatus();

    res.json({
      ok: true,
      database: database.database,
      user: database.user
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    res.status(503).json({
      ok: false,
      error: 'Database unavailable'
    });
  }
}) satisfies RequestHandler);
