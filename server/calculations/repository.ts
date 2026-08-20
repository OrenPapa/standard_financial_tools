import { db } from '../db.js';

export interface SavedCalculationRecord {
  id: string;
  user_id: string;
  type: string;
  name: string;
  input_state: unknown;
  result_snapshot: unknown;
  created_at: string;
  updated_at: string;
}

export async function listSavedCalculations(userId: string, type?: string) {
  const params = type ? [userId, type] : [userId];
  const where = type ? 'where user_id = $1 and type = $2' : 'where user_id = $1';
  const result = await db.query<SavedCalculationRecord>(
    `
      select *
      from saved_calculations
      ${where}
      order by updated_at desc
    `,
    params
  );

  return result.rows;
}

export async function getSavedCalculation(userId: string, id: string) {
  const result = await db.query<SavedCalculationRecord>(
    'select * from saved_calculations where user_id = $1 and id = $2 limit 1',
    [userId, id]
  );

  return result.rows[0] || null;
}

export async function createSavedCalculation(input: {
  userId: string;
  type: string;
  name: string;
  inputState: unknown;
  resultSnapshot: unknown;
}) {
  const result = await db.query<SavedCalculationRecord>(
    `
      insert into saved_calculations (user_id, type, name, input_state, result_snapshot)
      values ($1, $2, $3, $4::jsonb, $5::jsonb)
      returning *
    `,
    [
      input.userId,
      input.type,
      input.name,
      JSON.stringify(input.inputState || {}),
      JSON.stringify(input.resultSnapshot || {})
    ]
  );

  return result.rows[0];
}

export async function updateSavedCalculation(input: {
  userId: string;
  id: string;
  name: string;
  inputState: unknown;
  resultSnapshot: unknown;
}) {
  const result = await db.query<SavedCalculationRecord>(
    `
      update saved_calculations
      set name = $3,
          input_state = $4::jsonb,
          result_snapshot = $5::jsonb,
          updated_at = now()
      where user_id = $1 and id = $2
      returning *
    `,
    [
      input.userId,
      input.id,
      input.name,
      JSON.stringify(input.inputState || {}),
      JSON.stringify(input.resultSnapshot || {})
    ]
  );

  return result.rows[0] || null;
}

export async function deleteSavedCalculation(userId: string, id: string) {
  const result = await db.query(
    'delete from saved_calculations where user_id = $1 and id = $2',
    [userId, id]
  );

  return Number(result.rowCount || 0) > 0;
}
