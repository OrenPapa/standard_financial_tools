import assert from 'node:assert/strict';
import { downPaymentAmountFromPercent, downPaymentPercent, formatPercentForInput, parseNumberInput, sanitizeNumberInputText, validateNumericState } from '../src/ui/controls.js';
import { runTest } from './helpers.js';

runTest('number input accepts comma as decimal separator', () => {
  assert.equal(parseNumberInput('3,5'), 3.5);
  assert.equal(parseNumberInput('1.234,5'), 1234.5);
});

runTest('number input keeps comma thousands separators as thousands', () => {
  assert.equal(parseNumberInput('20,000'), 20000);
  assert.equal(parseNumberInput('1,234.5'), 1234.5);
});

runTest('blank number input commits as zero', () => {
  assert.equal(parseNumberInput(''), 0);
  assert.equal(parseNumberInput('   '), 0);
});

runTest('number input rejects text and dangerous-looking strings', () => {
  assert.equal(Number.isNaN(parseNumberInput('abc')), true);
  assert.equal(Number.isNaN(parseNumberInput('123abc')), true);
  assert.equal(Number.isNaN(parseNumberInput('<script>1</script>')), true);
  assert.equal(Number.isNaN(parseNumberInput('1e9')), true);
  assert.equal(Number.isNaN(parseNumberInput('Infinity')), true);
});

runTest('number input sanitizer removes non-numeric characters', () => {
  assert.equal(sanitizeNumberInputText('abc123<script>', { min: 0 }), '123');
  assert.equal(sanitizeNumberInputText('-3.5%', { min: -10 }), '-3.5');
  assert.equal(sanitizeNumberInputText('-3.5%', { min: 0 }), '3.5');
  assert.equal(sanitizeNumberInputText('1,234,567.89 EUR', { min: 0 }), '1,234,567.89');
});

runTest('numeric state validation clamps invalid and out-of-range values', () => {
  const module = {
    defaultState: { amount: 100, rate: 2.5 },
    controls: [
      { id: 'amount', min: 0, max: 1000, step: 1 },
      { id: 'rate', min: -10, max: 20, step: 0.1 }
    ]
  };
  const state = { amount: '<script>', rate: 99 };

  assert.deepEqual(validateNumericState(module, state), ['amount', 'rate']);
  assert.deepEqual(state, { amount: 100, rate: 20 });
});

runTest('down payment amount and percent convert cleanly', () => {
  assert.equal(downPaymentPercent(20000, 100000), 20);
  assert.equal(downPaymentAmountFromPercent(20, 100000), 20000);
  assert.equal(formatPercentForInput(downPaymentPercent(100000, 300000)), '33.33');
});
