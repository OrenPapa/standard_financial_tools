import assert from 'node:assert/strict';
import { calculationStateForAdvanced, hasAdvancedControls, visibleTableForAdvanced } from '../src/utils/advancedState.js';
import { mortgageModule } from '../src/modules/mortgage.js';
import { investmentModule } from '../src/modules/investment.js';
import { runTest } from './helpers.js';

runTest('detects modules with advanced controls', () => {
  assert.equal(hasAdvancedControls(mortgageModule), true);
});

runTest('advanced numeric controls use inactive values when disabled', () => {
  const state = { ...mortgageModule.defaultState };
  const calculationState = calculationStateForAdvanced(mortgageModule, state, false);

  assert.equal(calculationState.propertyTaxRate, mortgageModule.defaultState.propertyTaxRate);
  assert.equal(calculationState.annualInsurance, mortgageModule.defaultState.annualInsurance);
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
