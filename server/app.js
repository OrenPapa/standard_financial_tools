import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { apiRouter } from './routes/api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

export function createApp(options = {}) {
  const app = express();
  const staticDir = options.staticDir || resolve(projectRoot, 'dist');

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => {
    res.json({
      ok: true,
      service: 'pfm-api',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api', apiRouter);

  if (process.env.NODE_ENV === 'production' && existsSync(staticDir)) {
    app.use(express.static(staticDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) {
        next();
        return;
      }

      res.sendFile(resolve(staticDir, 'index.html'));
    });
  }

  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found'
    });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
      error: 'Internal server error'
    });
  });

  return app;
}
