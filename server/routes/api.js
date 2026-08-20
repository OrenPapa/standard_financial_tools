import { Router } from 'express';

export const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'pfm-api',
    database: 'not-configured'
  });
});

apiRouter.get('/version', (req, res) => {
  res.json({
    name: 'pfm-api',
    version: process.env.npm_package_version || '0.0.0'
  });
});
