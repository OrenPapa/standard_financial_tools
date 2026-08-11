import assert from 'node:assert/strict';
import { mortgageModule } from '../src/modules/mortgage.js';
import { clone, runTest } from './helpers.js';

runTest('mortgage validates down payment cannot exceed home price', () => {
  const state = { ...clone(mortgageModule.defaultState), homePrice: 100000, downPayment: 150000 };
  const changed = mortgageModule.validateState(state);

  assert.deepEqual(changed, ['downPayment']);
  assert.equal(state.downPayment, 100000);
});

runTest('mortgage with zero interest repays principal evenly', () => {
  const state = {
    ...clone(mortgageModule.defaultState),
    homePrice: 120000,
    downPayment: 0,
    annualInterestRate: 0,
    mortgageTermYears: 1,
    extraMonthlyPayment: 0,
    propertyTaxRate: 0,
    annualInsurance: 0,
    monthlyHOA: 0,
    pmiRate: 0,
    closingCosts: 0
  };
  const result = mortgageModule.calculate(state);

  assert.equal(result.table.rows.length, 12);
  assert.equal(result.table.rows[0].principal, 10000);
  assert.equal(result.table.rows.at(-1).endingBalance, 0);
  assert.equal(result.charts.primary.datasets[1].data.at(-1), 120000);
});

runTest('mortgage ownership costs are included in monthly schedule', () => {
  const state = {
    ...clone(mortgageModule.defaultState),
    homePrice: 120000,
    downPayment: 0,
    annualInterestRate: 0,
    mortgageTermYears: 1,
    propertyTaxRate: 1.2,
    annualInsurance: 1200,
    monthlyHOA: 50,
    pmiRate: 0
  };
  const result = mortgageModule.calculate(state);
  const firstRow = result.table.rows[0];

  assert.equal(firstRow.taxes, 120);
  assert.equal(firstRow.insurance, 100);
  assert.equal(firstRow.hoa, 50);
  assert.equal(firstRow.totalMonthly, 10270);
});

runTest('mortgage monthly cost subvalue shows year buying power when inflation is active', () => {
  const result = mortgageModule.calculate({
    ...clone(mortgageModule.defaultState),
    annualInflationRate: 3
  });
  const estimatedMonthlyCost = result.kpis.find(kpi => kpi.label === 'Estimated Monthly Cost');
  const nominalAmount = Number(estimatedMonthlyCost.value.replace('€', '').replace(/,/g, ''));
  const displayAmount = Number(estimatedMonthlyCost.subvalue.replace('Year 15: €', '').replace(/,/g, ''));

  assert.match(estimatedMonthlyCost.subvalue, /^Year 15: €[\d,.]+$/);
  assert.ok(displayAmount < nominalAmount);
});

runTest('mortgage monthly cost subvalue is hidden when inflation is inactive', () => {
  const result = mortgageModule.calculate({
    ...clone(mortgageModule.defaultState),
    annualInflationRate: 0
  });
  const estimatedMonthlyCost = result.kpis.find(kpi => kpi.label === 'Estimated Monthly Cost');

  assert.equal(estimatedMonthlyCost.subvalue, '');
});
