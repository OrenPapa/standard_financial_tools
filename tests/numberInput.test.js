import assert from 'node:assert/strict';
import { parseNumberInput } from '../src/ui/controls.js';
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
