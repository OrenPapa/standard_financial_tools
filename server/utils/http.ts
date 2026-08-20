import type { Response } from 'express';

export interface ApiErrorBody {
  error: string;
  code?: string;
}

export function sendApiError(res: Response, status: number, error: string, code?: string) {
  const body: ApiErrorBody = { error };

  if (code) {
    body.code = code;
  }

  res.status(status).json(body);
}
