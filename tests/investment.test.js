import assert from 'node:assert/strict';
import { investmentModule } from '../src/modules/investment.js';
import { calculationStateForAdvanced } from '../src/utils/advancedState.js';
import { assertClose, clone, runTest } from './helpers.js';

runTest('investment with zero return and no income equals contributed capital', () => {
  const state = {
    ...clone(investmentModule.defaultState),
    initialInvestment: 5000,
    recurringContribution: 200,
    contributionInterval: 'monthly',
    investmentYears: 2,
    annualReturn: 0,
    incomeYield: 0,
    incomeFrequency: 'none'
  };
  const result = investmentModule.calculate(state);
  const lastRow = result.table.rows.at(-1);

  assert.equal(result.table.rows.length, 2);
  assert.equal(lastRow.totalContributed, 9800);
  assert.equal(lastRow.grossGain, 0);
  assert.equal(lastRow.taxPaid, 0);
  assert.equal(lastRow.netWorth, 9800);
});

runTest('investment applies tax to market gains at the end', () => {
  const state = {
    ...clone(investmentModule.defaultState),
    initialInvestment: 10000,
    recurringContribution: 0,
    investmentYears: 1,
    annualReturn: 10,
    incomeYield: 0,
    incomeFrequency: 'none',
    taxRate: 25,
    reinvestIncome: true,
    annualInflationRate: 0
  };
  const result = investmentModule.calculate(state);
  const lastRow = result.table.rows.at(-1);

  assertClose(lastRow.grossGain, 1000);
  assertClose(lastRow.taxPaid, 250);
  assertClose(lastRow.netGain, 750);
  assertClose(lastRow.netWorth, 10750);
  assert.deepEqual(
    result.charts.primary.datasets[0].data.map(value => Math.round(value)),
    [10000, 750, 250]
  );
});

runTest('investment keeps inflation active when advanced settings are disabled', () => {
  const state = calculationStateForAdvanced(investmentModule, {
    ...clone(investmentModule.defaultState),
    initialInvestment: 10000,
    recurringContribution: 0,
    investmentYears: 10,
    annualReturn: 0,
    incomeYield: 5,
    incomeFrequency: 'annual',
    annualInflationRate: 2.5
  }, false);
  const result = investmentModule.calculate(state);
  const finalNetValue = result.kpis.find(kpi => kpi.label === 'Final Net Value');
  const nominal = Number(finalNetValue.value.replace('€', '').replace(/,/g, ''));
  const today = Number(finalNetValue.subvalue.replace('Today: €', '').replace(/,/g, ''));

  assert.equal(state.annualInflationRate, 2.5);
  assert.equal(state.incomeYield, 0);
  assert.ok(today < nominal);
});

runTest('investment tracks paid-out income when reinvestment is disabled', () => {
  const state = {
    ...clone(investmentModule.defaultState),
    initialInvestment: 10000,
    recurringContribution: 0,
    investmentYears: 1,
    annualReturn: 0,
    incomeYield: 12,
    incomeFrequency: 'annual',
    taxRate: 25,
    reinvestIncome: false
  };
  const result = investmentModule.calculate(state);
  const lastRow = result.table.rows.at(-1);

  assertClose(lastRow.grossIncome, 1200);
  assertClose(lastRow.grossGain, 1200);
  assertClose(lastRow.taxPaid, 300);
  assertClose(lastRow.netGain, 900);
  assertClose(lastRow.netWorth, 10900);
});

runTest('investment reinvests after-tax income into portfolio when enabled', () => {
  const state = {
    ...clone(investmentModule.defaultState),
    initialInvestment: 10000,
    recurringContribution: 0,
    investmentYears: 1,
    annualReturn: 0,
    incomeYield: 12,
    incomeFrequency: 'annual',
    taxRate: 25,
    reinvestIncome: true
  };
  const result = investmentModule.calculate(state);
  const lastRow = result.table.rows.at(-1);

  assertClose(lastRow.grossIncome, 1200);
  assertClose(lastRow.grossGain, 1200);
  assertClose(lastRow.taxPaid, 300);
  assertClose(lastRow.netGain, 900);
  assertClose(lastRow.netWorth, 10900);
  assertClose(result.charts.growth.datasets[1].data.at(-1), 10900);
});
