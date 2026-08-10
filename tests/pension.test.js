import assert from 'node:assert/strict';
import { pensionModule } from '../src/modules/pension.js';
import { assertClose, clone, runTest } from './helpers.js';

runTest('pension validates retirement age after start age', () => {
  const state = { ...clone(pensionModule.defaultState), startAge: 65, retirementAge: 65 };
  const changed = pensionModule.validateState(state);

  assert.deepEqual(changed, ['retirementAge']);
  assert.equal(state.retirementAge, 66);
});

runTest('pension accumulates yearly contributions and schedule rows', () => {
  const state = {
    ...clone(pensionModule.defaultState),
    startAge: 30,
    retirementAge: 32,
    initialMonthlyContrib: 100,
    annualContribIncrease: 50,
    accumulationReturn: 0,
    profitTaxRate: 15,
    annualInflationRate: 0,
    payoutYears: 10,
    retirementReturn: 0
  };
  const result = pensionModule.calculate(state, { payoutType: 'flat' });

  assert.equal(result.table.rows.length, 2);
  assert.equal(result.table.rows[0].monthlyContrib, 100);
  assert.equal(result.table.rows[1].monthlyContrib, 150);
  assert.equal(result.table.rows[1].totalContributed, 3000);
  assert.equal(result.table.rows[1].balance, 3000);
  assert.equal(result.charts.primary.datasets[2].data.at(-1), 3000);
});

runTest('pension flat drawdown pays balance evenly when retirement return is zero', () => {
  const state = {
    ...clone(pensionModule.defaultState),
    startAge: 30,
    retirementAge: 31,
    initialMonthlyContrib: 100,
    annualContribIncrease: 0,
    accumulationReturn: 0,
    profitTaxRate: 0,
    annualInflationRate: 0,
    payoutYears: 1,
    retirementReturn: 0
  };
  const result = pensionModule.calculate(state, { payoutType: 'flat' });

  assert.equal(result.charts.primary.datasets[2].data.at(-1), 1200);
  assertClose(result.charts.secondary.datasets[1].data[0], 100);
  assertClose(result.charts.secondary.datasets[0].data.at(-1), 0);
});
