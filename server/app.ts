import express from 'express';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { apiRouter } from './routes/api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

interface CreateAppOptions {
  staticDir?: string;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const staticDir = options.staticDir || resolve(projectRoot, 'dist');

  app.disable('x-powered-by');
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', ((_req, res) => {
    res.json({
      ok: true,
      service: 'pfm-api',
      timestamp: new Date().toISOString()
    });
  }) satisfies RequestHandler);

  app.use('/api', apiRouter);

  if (process.env.NODE_ENV === 'production' && existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.use(((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) {
        next();
        return;
      }

      res.sendFile(resolve(staticDir, 'index.html'));
    }) satisfies RequestHandler);
  }

  app.use(((_req, res) => {
    res.status(404).json({
      error: 'Not found'
    });
  }) satisfies RequestHandler);

  app.use(((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({
      error: 'Internal server error'
    });
  }) satisfies ErrorRequestHandler);

  return app;
}
