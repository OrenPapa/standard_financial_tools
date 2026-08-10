import assert from 'node:assert/strict';
import { calculateRentVsBuy } from '../src/utils/rentVsBuy.js';

const baseInput = {
  monthlyRent: 1000,
  annualRentIncreasePct: 0,
  comparisonYears: 1,
  propertyPrice: 120000,
  downPayment: 0,
  mortgageInterestRatePct: 0,
  mortgageTermYears: 10,
  annualPropertyAppreciationPct: 0,
  annualMaintenanceCostPct: 0,
  buyingCosts: 0,
  sellingCostsPct: 0,
  saleProfitTaxPct: 0,
  monthlyPropertyTax: 0,
  monthlyInsurance: 0
};

function runTest(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

runTest('calculates rent increases annually', () => {
  const result = calculateRentVsBuy({
    ...baseInput,
    annualRentIncreasePct: 10,
    comparisonYears: 2
  });

  assert.equal(result.totalRentPaid, 25200);
  assert.equal(result.annual[0].annualRent, 12000);
  assert.equal(result.annual[1].annualRent, 13200);
});

runTest('handles zero percent mortgage interest', () => {
  const result = calculateRentVsBuy(baseInput);

  assert.equal(result.monthlyMortgagePayment, 1000);
  assert.equal(result.totalMortgagePaid, 12000);
  assert.equal(result.totalPrincipalPaid, 12000);
  assert.equal(result.totalInterestPaid, 0);
  assert.equal(result.remainingMortgageBalance, 108000);
});

runTest('stops mortgage payments after payoff when comparison is longer than mortgage term', () => {
  const result = calculateRentVsBuy({
    ...baseInput,
    propertyPrice: 12000,
    mortgageTermYears: 1,
    comparisonYears: 2
  });

  assert.equal(result.monthlyMortgagePayment, 1000);
  assert.equal(result.totalMortgagePaid, 12000);
  assert.equal(result.remainingMortgageBalance, 0);
});

runTest('caps down payment at property price', () => {
  const result = calculateRentVsBuy({
    ...baseInput,
    propertyPrice: 100000,
    downPayment: 150000
  });

  assert.equal(result.loanAmount, 0);
  assert.equal(result.monthlyMortgagePayment, 0);
  assert.equal(result.remainingMortgageBalance, 0);
});

runTest('compares rent paid against net buying cost', () => {
  const result = calculateRentVsBuy({
    ...baseInput,
    monthlyRent: 2000,
    propertyPrice: 0
  });

  assert.equal(result.winner, 'buying');
  assert.equal(result.difference, result.totalRentPaid - result.netCostOfBuying);
});

runTest('applies tax only to sale profit', () => {
  const result = calculateRentVsBuy({
    ...baseInput,
    propertyPrice: 100000,
    downPayment: 100000,
    annualPropertyAppreciationPct: 50,
    saleProfitTaxPct: 15
  });

  assert.equal(result.futurePropertyValue, 150000);
  assert.equal(result.saleProfitTax, 7500);
  assert.equal(result.netEquityAfterSelling, 142500);
});
