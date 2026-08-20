import assert from 'node:assert/strict';
import { calculationStateForAdvanced, hasAdvancedControls, visibleTableForAdvanced } from '../src/utils/advancedState.js';
import { mortgageModule } from '../src/modules/mortgage.js';
import { mortgageComparisonModule } from '../src/modules/mortgageComparison.js';
import { investmentModule } from '../src/modules/investment.js';
import { runTest } from './helpers.js';

runTest('detects modules with advanced controls', () => {
  assert.equal(hasAdvancedControls(mortgageModule), true);
  assert.equal(hasAdvancedControls(mortgageComparisonModule), true);
});

runTest('advanced numeric controls use inactive values when disabled', () => {
  const state = { ...mortgageModule.defaultState };
  const calculationState = calculationStateForAdvanced(mortgageModule, state, false);

  assert.equal(calculationState.propertyTaxRate, 0);
  assert.equal(calculationState.annualInsurance, 0);
  assert.equal(calculationState.extraMonthlyPayment, 0);
  assert.equal(calculationState.homePrice, state.homePrice);
});

runTest('advanced select and checkbox controls are neutralized when disabled', () => {
  const state = {
    ...investmentModule.defaultState,
    incomeYield: 5,
    incomeFrequency: 'monthly',
    reinvestIncome: true
  };
  const calculationState = calculationStateForAdvanced(investmentModule, state, false);

  assert.equal(calculationState.incomeYield, 0);
  assert.equal(calculationState.incomeFrequency, 'none');
  assert.equal(calculationState.reinvestIncome, false);
});

runTest('advanced values pass through when enabled', () => {
  const state = { ...mortgageModule.defaultState, propertyTaxRate: 1.2 };
  const calculationState = calculationStateForAdvanced(mortgageModule, state, true);

  assert.equal(calculationState, state);
  assert.equal(calculationState.propertyTaxRate, 1.2);
});

runTest('advanced scenario fields are neutralized when disabled', () => {
  const state = {
    ...mortgageComparisonModule.defaultState,
    compareOverYears: 7,
    scenarios: mortgageComparisonModule.defaultState.scenarios.map(scenario => ({
      ...scenario,
      propertyTaxRate: 1,
      annualInsurance: 1200,
      loanFees: 2500
    }))
  };
  const calculationState = calculationStateForAdvanced(mortgageComparisonModule, state, false);

  assert.equal(calculationState.compareOverYears, 0);
  assert.equal(calculationState.scenarios[0].propertyTaxRate, 0);
  assert.equal(calculationState.scenarios[0].annualInsurance, 0);
  assert.equal(calculationState.scenarios[0].loanFees, 0);
  assert.equal(calculationState.scenarios[0].homePrice, state.scenarios[0].homePrice);
});

runTest('advanced table columns are hidden when advanced settings are disabled', () => {
  const table = mortgageModule.calculate(mortgageModule.defaultState).table;
  const visibleTable = visibleTableForAdvanced(mortgageModule, table, false);

  assert.deepEqual(
    visibleTable.columns.map(column => column.key),
    ['month', 'startingBalance', 'principal', 'interest', 'endingBalance']
  );
});

runTest('advanced table columns are shown when advanced settings are enabled', () => {
  const table = mortgageModule.calculate(mortgageModule.defaultState).table;
  const visibleTable = visibleTableForAdvanced(mortgageModule, table, true);

  assert.deepEqual(visibleTable.columns.map(column => column.key), table.columns.map(column => column.key));
});
