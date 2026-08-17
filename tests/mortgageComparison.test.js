import assert from 'node:assert/strict';
import { mortgageComparisonModule } from '../src/modules/mortgageComparison.js';
import { assertClose, clone, runTest } from './helpers.js';

runTest('mortgage comparison starts with two scenarios', () => {
  assert.equal(mortgageComparisonModule.defaultState.scenarios.length, 2);
  assert.equal(mortgageComparisonModule.defaultState.scenarios[0].name, 'Scenario 1');
  assert.equal(mortgageComparisonModule.defaultState.scenarios[1].name, 'Scenario 2');
});

runTest('mortgage comparison calculates each scenario independently', () => {
  const result = mortgageComparisonModule.calculate({
    scenarios: [
      {
        id: 'a',
        name: 'Lower home',
        homePrice: 200000,
        downPayment: 50000,
        annualInterestRate: 0,
        mortgageTermYears: 30,
        closingCosts: 0,
        extraMonthlyPayment: 0
      },
      {
        id: 'b',
        name: 'Higher home',
        homePrice: 250000,
        downPayment: 50000,
        annualInterestRate: 0,
        mortgageTermYears: 30,
        closingCosts: 0,
        extraMonthlyPayment: 0
      }
    ]
  });

  assert.equal(result.kpis.layout, 'mortgageComparison');
  assert.equal(result.kpis.scenarios.length, 2);
  assertClose(result.kpis.scenarios[0].monthlyPayment, 416.67);
  assertClose(result.kpis.scenarios[1].monthlyPayment, 555.56);
  assert.equal(result.kpis.bestTotalCost, 200000);
});

runTest('mortgage comparison exposes non-pie charts and comparison table', () => {
  const result = mortgageComparisonModule.calculate(clone(mortgageComparisonModule.defaultState));

  assert.deepEqual(Object.keys(result.charts), ['primary', 'balance', 'cost']);
  assert.equal(result.charts.primary.type, undefined);
  assert.equal(result.table.rows.length, 2);
  assert.deepEqual(
    result.table.columns.map(column => column.key),
    ['name', 'homePrice', 'downPayment', 'loanAmount', 'rate', 'monthlyPayment', 'totalInterest', 'totalCost', 'payoffYears']
  );
});

runTest('mortgage comparison validation keeps at least two scenarios', () => {
  const state = { scenarios: [] };
  const changed = mortgageComparisonModule.validateState(state);

  assert.deepEqual(changed, ['scenarios']);
  assert.equal(state.scenarios.length, 2);
});
