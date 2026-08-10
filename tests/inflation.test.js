import assert from 'node:assert/strict';
import { inflationModule } from '../src/modules/inflation.js';
import { assertClose, runTest } from './helpers.js';

runTest('inflation compounds equivalent value into the future', () => {
  const result = inflationModule.calculate({
    amount: 1000,
    startYear: 2026,
    targetYear: 2028,
    annualInflationRate: 10
  });
  const lastRow = result.table.rows.at(-1);

  assert.equal(result.table.rows.length, 3);
  assertClose(lastRow.value, 1210);
  assertClose(lastRow.buyingPower, 826.446, 0.001);
});

runTest('inflation supports past target years', () => {
  const result = inflationModule.calculate({
    amount: 1000,
    startYear: 2026,
    targetYear: 2024,
    annualInflationRate: 10
  });
  const lastRow = result.table.rows.at(-1);

  assert.equal(result.table.rows.length, 3);
  assert.equal(lastRow.year, 2024);
  assertClose(lastRow.value, 826.446, 0.001);
  assertClose(lastRow.buyingPower, 1210);
});
