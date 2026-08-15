import assert from 'node:assert/strict';
import { doughnutDataset, doughnutPalette } from '../src/ui/chartDatasets.js';
import { runTest } from './helpers.js';

runTest('doughnut datasets use the 10-color chart palette by default', () => {
  const data = Array.from({ length: 12 }, (_, index) => index + 1);
  const dataset = doughnutDataset('Breakdown', data, []);

  assert.equal(doughnutPalette.length, 10);
  assert.deepEqual(dataset.backgroundColor.slice(0, 10), doughnutPalette);
  assert.equal(dataset.backgroundColor[10], doughnutPalette[0]);
  assert.equal(dataset.backgroundColor[11], doughnutPalette[1]);
});

runTest('doughnut datasets can still opt into semantic colors', () => {
  const dataset = doughnutDataset('Breakdown', [1, 2], ['principal', 'interest'], { useSemanticColors: true });

  assert.notDeepEqual(dataset.backgroundColor, doughnutPalette.slice(0, 2));
  assert.equal(Object.hasOwn(dataset, 'useSemanticColors'), false);
});
