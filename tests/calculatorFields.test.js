import assert from 'node:assert/strict';
import { calculatorFieldSettings } from '../src/config/calculatorFields.js';
import { investmentModule } from '../src/modules/investment.js';
import { mortgageModule } from '../src/modules/mortgage.js';
import { pensionModule } from '../src/modules/pension.js';
import { runTest } from './helpers.js';

function controlById(module, id) {
  return module.controls.find(control => control.id === id);
}

runTest('calculator field settings drive module defaults and numeric bounds', () => {
  const pensionStartAge = calculatorFieldSettings.pension.fields.startAge;
  const pensionStartAgeControl = controlById(pensionModule, 'startAge');

  assert.equal(pensionModule.defaultState.startAge, pensionStartAge.defaultValue);
  assert.equal(pensionStartAgeControl.min, pensionStartAge.min);
  assert.equal(pensionStartAgeControl.max, pensionStartAge.max);
  assert.equal(pensionStartAgeControl.step, pensionStartAge.step);
});

runTest('calculator field settings drive select and checkbox defaults', () => {
  const contributionInterval = calculatorFieldSettings.investment.fields.contributionInterval;
  const reinvestIncome = calculatorFieldSettings.investment.fields.reinvestIncome;

  assert.equal(investmentModule.defaultState.contributionInterval, contributionInterval.defaultValue);
  assert.deepEqual(controlById(investmentModule, 'contributionInterval').options, contributionInterval.options);
  assert.equal(investmentModule.defaultState.reinvestIncome, reinvestIncome.defaultValue);
});

runTest('calculator field settings drive advanced inactive values', () => {
  const propertyTaxRate = calculatorFieldSettings.mortgage.fields.propertyTaxRate;
  const annualInsurance = calculatorFieldSettings.mortgage.fields.annualInsurance;

  assert.equal(mortgageModule.defaultState.propertyTaxRate, propertyTaxRate.defaultValue);
  assert.equal(controlById(mortgageModule, 'propertyTaxRate').inactiveValue, propertyTaxRate.inactiveValue);
  assert.equal(mortgageModule.defaultState.annualInsurance, annualInsurance.defaultValue);
  assert.equal(controlById(mortgageModule, 'annualInsurance').inactiveValue, annualInsurance.inactiveValue);
});
