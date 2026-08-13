import assert from 'node:assert/strict';
import { loanModule } from '../src/modules/loan.js';
import { amortizedPayment } from '../src/utils/amortization.js';
import { assertClose, clone, runTest } from './helpers.js';

runTest('amortized payment handles zero interest and future value', () => {
  assert.equal(amortizedPayment({ principal: 12000, periodicRate: 0, periods: 12 }), 1000);
  assert.equal(amortizedPayment({ principal: 12000, periodicRate: 0, periods: 12, futureValue: 6000 }), 500);
});

runTest('loan with zero interest repays straight-line principal', () => {
  const state = {
    ...clone(loanModule.defaultState),
    loanAmount: 12000,
    annualInterestRate: 0,
    loanTermYears: 1,
    paymentFrequency: 'monthly',
    extraPayment: 0,
    upfrontFees: 0,
    recurringFee: 0,
    balloonPayment: 0
  };
  const result = loanModule.calculate(state);

  assert.equal(result.table.rows.length, 12);
  assert.equal(result.table.rows[0].principal, 1000);
  assert.equal(result.table.rows.at(-1).endingBalance, 0);
  assert.equal(result.charts.balance.datasets[0].data.at(-1), 0);
  assert.equal(result.charts.primary.type, 'doughnut');
});

runTest('loan includes recurring fees in total paid without reducing balance', () => {
  const state = {
    ...clone(loanModule.defaultState),
    loanAmount: 12000,
    annualInterestRate: 0,
    loanTermYears: 1,
    paymentFrequency: 'monthly',
    recurringFee: 10
  };
  const result = loanModule.calculate(state);

  assert.equal(result.table.rows.at(-1).endingBalance, 0);
  assertClose(result.charts.cost.datasets[2].data.at(-1), 120);
});
