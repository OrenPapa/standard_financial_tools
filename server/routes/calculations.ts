import { Router } from 'express';
import type { RequestHandler } from 'express';

import { requireAuth } from '../auth/middleware.js';
import {
  createSavedCalculation,
  deleteSavedCalculation,
  getSavedCalculation,
  listSavedCalculations,
  updateSavedCalculation
} from '../calculations/repository.js';
import { sendApiError } from '../utils/http.js';

const ALLOWED_TYPES = new Set([
  'pension',
  'investment',
  'inflation',
  'loan',
  'mortgage',
  'mortgage-comparison',
  'rent-vs-buy',
  'budget'
]);

export const calculationsRouter = Router();

calculationsRouter.use(requireAuth);

calculationsRouter.get('/', (async (req, res) => {
  if (!req.user) {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
    return;
  }

  const type = typeof req.query.type === 'string' ? req.query.type : undefined;

  if (type && !ALLOWED_TYPES.has(type)) {
    sendApiError(res, 400, 'Unsupported calculation type.', 'invalid_calculation_type');
    return;
  }

  res.json({
    calculations: await listSavedCalculations(req.user.id, type)
  });
}) satisfies RequestHandler);

calculationsRouter.get('/:id', (async (req, res) => {
  if (!req.user) {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
    return;
  }

  const calculation = await getSavedCalculation(req.user.id, String(req.params.id));

  if (!calculation) {
    sendApiError(res, 404, 'Saved calculation not found.', 'not_found');
    return;
  }

  res.json({ calculation });
}) satisfies RequestHandler);

calculationsRouter.post('/', (async (req, res) => {
  if (!req.user) {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
    return;
  }

  const type = String(req.body?.type || '').trim();
  const name = String(req.body?.name || '').trim();

  if (!ALLOWED_TYPES.has(type)) {
    sendApiError(res, 400, 'Unsupported calculation type.', 'invalid_calculation_type');
    return;
  }

  if (!name) {
    sendApiError(res, 400, 'Name is required.', 'name_required');
    return;
  }

  const calculation = await createSavedCalculation({
    userId: req.user.id,
    type,
    name,
    inputState: req.body?.inputState || {},
    resultSnapshot: req.body?.resultSnapshot || {}
  });

  res.status(201).json({ calculation });
}) satisfies RequestHandler);

calculationsRouter.put('/:id', (async (req, res) => {
  if (!req.user) {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
    return;
  }

  const name = String(req.body?.name || '').trim();

  if (!name) {
    sendApiError(res, 400, 'Name is required.', 'name_required');
    return;
  }

  const calculation = await updateSavedCalculation({
    userId: req.user.id,
    id: String(req.params.id),
    name,
    inputState: req.body?.inputState || {},
    resultSnapshot: req.body?.resultSnapshot || {}
  });

  if (!calculation) {
    sendApiError(res, 404, 'Saved calculation not found.', 'not_found');
    return;
  }

  res.json({ calculation });
}) satisfies RequestHandler);

calculationsRouter.delete('/:id', (async (req, res) => {
  if (!req.user) {
    sendApiError(res, 401, 'Authentication required.', 'auth_required');
    return;
  }

  const deleted = await deleteSavedCalculation(req.user.id, String(req.params.id));

  if (!deleted) {
    sendApiError(res, 404, 'Saved calculation not found.', 'not_found');
    return;
  }

  res.status(204).end();
}) satisfies RequestHandler);
