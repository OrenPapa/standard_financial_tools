import assert from 'node:assert/strict';
import { mortgageComparisonModule } from '../src/modules/mortgageComparison.js';
import { calculationStateForAdvanced, visibleTableForAdvanced } from '../src/utils/advancedState.js';
import { assertClose, clone, runTest } from './helpers.js';

function scenario(overrides = {}) {
  return {
    id: overrides.id ?? 'a',
    name: overrides.name ?? 'Scenario',
    homePrice: overrides.homePrice ?? 200000,
    downPayment: overrides.downPayment ?? 50000,
    annualInterestRate: overrides.annualInterestRate ?? 5,
    mortgageTermYears: overrides.mortgageTermYears ?? 30,
    closingCosts: overrides.closingCosts ?? 0,
    extraMonthlyPayment: overrides.extraMonthlyPayment ?? 0,
    propertyTaxRate: overrides.propertyTaxRate ?? 0,
    annualInsurance: overrides.annualInsurance ?? 0,
    pmiRate: overrides.pmiRate ?? 0,
    monthlyHOA: overrides.monthlyHOA ?? 0,
    loanFees: overrides.loanFees ?? 0,
    discountPointsRate: overrides.discountPointsRate ?? 0,
    prepaymentPenaltyRate: overrides.prepaymentPenaltyRate ?? 0
  };
}

function calculateSingle(overrides = {}, compareOverYears = 0) {
  return mortgageComparisonModule.calculate({
    compareOverYears,
    scenarios: [
      scenario({ id: 'a', name: 'A', ...overrides }),
      scenario({ id: 'b', name: 'B', homePrice: 220000, downPayment: 50000 })
    ]
  }).kpis.scenarios[0];
}

runTest('mortgage comparison starts with two scenarios and advanced defaults', () => {
  assert.equal(mortgageComparisonModule.defaultState.scenarios.length, 2);
  assert.equal(mortgageComparisonModule.defaultState.scenarios[0].name, 'Scenario 1');
  assert.equal(mortgageComparisonModule.defaultState.scenarios[0].propertyTaxRate, 1);
  assert.equal(mortgageComparisonModule.defaultState.scenarios[0].annualInsurance, 1000);
  assert.equal(mortgageComparisonModule.defaultState.scenarios[0].pmiRate, 0);
});

runTest('mortgage comparison calculates each scenario independently', () => {
  const result = mortgageComparisonModule.calculate({
    scenarios: [
      scenario({ id: 'a', name: 'Lower home', homePrice: 200000, downPayment: 50000, annualInterestRate: 0, mortgageTermYears: 30 }),
      scenario({ id: 'b', name: 'Higher home', homePrice: 250000, downPayment: 50000, annualInterestRate: 0, mortgageTermYears: 30 })
    ]
  });

  assert.equal(result.kpis.layout, 'mortgageComparison');
  assert.equal(result.kpis.scenarios.length, 2);
  assertClose(result.kpis.scenarios[0].monthlyMortgagePayment, 416.67);
  assertClose(result.kpis.scenarios[1].monthlyMortgagePayment, 555.56);
});

runTest('mortgage comparison exposes non-pie charts and simple comparison table', () => {
  const simpleState = calculationStateForAdvanced(mortgageComparisonModule, clone(mortgageComparisonModule.defaultState), false);
  const result = mortgageComparisonModule.calculate(simpleState);
  const visibleTable = visibleTableForAdvanced(mortgageComparisonModule, result.table, false);

  assert.deepEqual(Object.keys(result.charts), ['primary', 'balance', 'cost']);
  assert.equal(result.charts.primary.type, undefined);
  assert.equal(result.charts.cost.stacked, true);
  assert.equal(result.charts.balance.labels[0], 'Y0');
  assert.equal(visibleTable.rows.length, 2);
  assert.deepEqual(
    visibleTable.columns.map(column => column.key),
    ['name', 'homePrice', 'downPayment', 'loanAmount', 'rate', 'monthlyMortgagePayment', 'lifetimeInterest', 'payoffYears']
  );
});

runTest('zero interest uses straight-line principal payment', () => {
  const result = calculateSingle({
    homePrice: 120000,
    downPayment: 0,
    annualInterestRate: 0,
    mortgageTermYears: 10
  });

  assertClose(result.monthlyMortgagePayment, 1000);
  assertClose(result.lifetimeInterest, 0);
});

runTest('optional zero inputs remain valid and do not restore defaults', () => {
  const result = calculateSingle({
    closingCosts: 0,
    extraMonthlyPayment: 0,
    propertyTaxRate: 0,
    annualInsurance: 0,
    pmiRate: 0,
    monthlyHOA: 0,
    loanFees: 0,
    discountPointsRate: 0,
    prepaymentPenaltyRate: 0
  }, 7);

  assert.equal(result.closingCosts, 0);
  assert.equal(result.extraMonthlyPayment, 0);
  assert.equal(result.propertyTaxRate, 0);
  assert.equal(result.annualInsurance, 0);
  assert.equal(result.cashAtClosing, result.downPayment);
});

runTest('extra principal reduces payoff time and lifetime interest', () => {
  const withoutExtra = calculateSingle({ extraMonthlyPayment: 0 });
  const withExtra = calculateSingle({ extraMonthlyPayment: 250 });

  assert(withExtra.payoffMonths < withoutExtra.payoffMonths);
  assert(withExtra.lifetimeInterest < withoutExtra.lifetimeInterest);
});

runTest('final payment does not make the balance negative', () => {
  const result = calculateSingle({
    homePrice: 120000,
    downPayment: 0,
    annualInterestRate: 12,
    mortgageTermYears: 1,
    extraMonthlyPayment: 10000
  });

  assert.equal(result.monthly.at(-1).remainingBalance, 0);
  assert(result.monthly.every(row => row.remainingBalance >= 0));
});

runTest('PMI ends once balance reaches 80 percent LTV', () => {
  const result = calculateSingle({
    homePrice: 200000,
    downPayment: 10000,
    annualInterestRate: 0,
    mortgageTermYears: 10,
    pmiRate: 1
  });
  const pmiRows = result.monthly.filter(row => row.pmi > 0);

  assert(pmiRows.length > 0);
  assert(result.monthly[pmiRows.length]?.remainingBalance <= 160000);
  assert.equal(result.monthly[pmiRows.length]?.pmi, 0);
});

runTest('discount points add upfront cost without changing the interest rate', () => {
  const result = calculateSingle({
    homePrice: 200000,
    downPayment: 20000,
    annualInterestRate: 5,
    discountPointsRate: 1
  });

  assertClose(result.discountPointsCost, 1800);
  assert.equal(result.annualInterestRate, 5);
  assertClose(result.cashAtClosing, 21800);
});

runTest('exit penalty applies only to holding-period cash outflow', () => {
  const result = calculateSingle({
    homePrice: 200000,
    downPayment: 50000,
    annualInterestRate: 0,
    mortgageTermYears: 30,
    prepaymentPenaltyRate: 1
  }, 7);

  assertClose(result.remainingBalanceAtHoldingPeriod, 115000);
  assertClose(result.exitPenaltyAtHoldingPeriod, 1150);
  assert(result.cashOutflowAtHoldingPeriod > result.monthly[83].cumulativeCashOutflow);
  assert(!Number.isNaN(result.lifetimeMortgagePayments));
});

runTest('holding-period totals include mortgage payments and ownership costs', () => {
  const result = calculateSingle({
    homePrice: 120000,
    downPayment: 12000,
    annualInterestRate: 0,
    mortgageTermYears: 10,
    closingCosts: 1000,
    propertyTaxRate: 1.2,
    annualInsurance: 1200,
    monthlyHOA: 100,
    pmiRate: 1,
    loanFees: 3000,
    discountPointsRate: 2,
    prepaymentPenaltyRate: 3
  }, 5);

  assertClose(result.discountPointsCost, 2160);
  assertClose(result.cashAtClosing, 18160);
  assertClose(result.principalPaidAtHoldingPeriod, 54000);
  assert(result.propertyTaxPaidAtHoldingPeriod > 0);
  assert(result.insurancePaidAtHoldingPeriod > 0);
  assert(result.pmiPaidAtHoldingPeriod > 0);
  assert(result.hoaPaidAtHoldingPeriod > 0);
  assert(result.exitPenaltyAtHoldingPeriod > 0);
  assert(result.cashOutflowAtHoldingPeriod > result.cashAtClosing + result.mortgagePaymentsAtHoldingPeriod);
});

runTest('comparison winner uses holding-period cash outflow', () => {
  const result = mortgageComparisonModule.calculate({
    compareOverYears: 7,
    scenarios: [
      scenario({ id: 'a', name: 'Low upfront', closingCosts: 0, annualInterestRate: 6 }),
      scenario({ id: 'b', name: 'Low rate', closingCosts: 50000, annualInterestRate: 3 })
    ]
  });

  assert.equal(result.kpis.primaryWinner.name, 'Low upfront');
  assert(result.kpis.deltas.cashOutflowDifference > 0);
});

runTest('validation keeps at least two scenarios and clamps compare period to shortest term', () => {
  const state = {
    compareOverYears: 25,
    scenarios: [
      scenario({ id: 'a', mortgageTermYears: 30 }),
      scenario({ id: 'b', mortgageTermYears: 20 })
    ]
  };
  const changed = mortgageComparisonModule.validateState(state);

  assert.deepEqual(changed, ['compareOverYears', 'scenarios']);
  assert.equal(state.scenarios.length, 2);
  assert.equal(state.compareOverYears, 20);
  assert.equal(state._validation.global.compareOverYears, 'Comparison period cannot exceed the shortest mortgage term.');
});

runTest('validation reports invalid down payment and PMI warning', () => {
  const state = {
    compareOverYears: 7,
    scenarios: [
      scenario({ id: 'a', homePrice: 0, downPayment: 0 }),
      scenario({ id: 'b', homePrice: 100000, downPayment: 25000, pmiRate: 1 })
    ]
  };

  mortgageComparisonModule.validateState(state);

  assert.equal(state.scenarios[0]._validation.fields.homePrice, 'Home price must be greater than zero.');
  assert.equal(state.scenarios[1]._validation.warnings.pmiRate, 'PMI may not be required because the down payment is at least 20%.');
});

runTest('validation reports down payment equal to home price', () => {
  const state = {
    compareOverYears: 7,
    scenarios: [
      scenario({ id: 'a', homePrice: 100000, downPayment: 100000 }),
      scenario({ id: 'b' })
    ]
  };

  mortgageComparisonModule.validateState(state);

  assert.equal(state.scenarios[0]._validation.fields.downPayment, 'Down payment must be lower than the home price.');
});
