import assert from 'node:assert/strict';
import { budgetModule } from '../src/modules/budget.js';
import { assertClose, clone, runTest } from './helpers.js';

runTest('budget normalizes income and expenses to monthly amounts', () => {
  const result = budgetModule.calculate({
    startingBalance: 1000,
    projectionLength: 12,
    projectionUnit: 'months',
    incomes: [
      { type: 'salary', amount: 1200, frequency: 'monthly' },
      { type: 'investment', amount: 1200, frequency: 'yearly' }
    ],
    expenses: [
      { type: 'food', amount: 100, frequency: 'weekly' },
      { type: 'utilities', amount: 120, frequency: 'monthly' }
    ]
  });

  assert.equal(result.kpis[0].label, 'Ending Balance');
  assert.equal(result.kpis[1].label, 'Total Made');
  assert.equal(result.kpis[2].label, 'Total Spent');
  assert.equal(result.kpis[3].label, 'Monthly Income');
  assertClose(result.table.rows[0].income, 1300);
  assertClose(result.table.rows[0].expenses, 553.33);
  assertClose(result.table.rows[0].netCashflow, 746.67);
});

runTest('budget projects ending balance over selected horizon', () => {
  const result = budgetModule.calculate({
    startingBalance: 500,
    projectionLength: 2,
    projectionUnit: 'months',
    incomes: [{ type: 'salary', amount: 1000, frequency: 'monthly' }],
    expenses: [{ type: 'housing', amount: 700, frequency: 'monthly' }]
  });

  assert.equal(result.table.rows.length, 2);
  assert.equal(result.table.rows.at(-1).endingBalance, 1100);
  assert.equal(result.charts.balance.datasets[0].data.at(-1), 1100);
});

runTest('budget applies one-time rows only in their selected month', () => {
  const result = budgetModule.calculate({
    startingBalance: 0,
    projectionLength: 3,
    projectionUnit: 'months',
    incomes: [
      { type: 'salary', amount: 1000, frequency: 'monthly' },
      { type: 'business', amount: 500, frequency: 'oneTime', oneTimeMonth: 2 }
    ],
    expenses: [
      { type: 'food', amount: 200, frequency: 'monthly' },
      { type: 'custom', name: 'New Laptop', amount: 300, frequency: 'oneTime', oneTimeMonth: 3 }
    ]
  });

  assert.equal(result.table.rows[0].income, 1000);
  assert.equal(result.table.rows[1].income, 1500);
  assert.equal(result.table.rows[2].expenses, 500);
  assert.equal(result.table.rows.at(-1).endingBalance, 2600);
  assert.ok(result.charts.breakdown.labels.includes('New Laptop'));
  assert.equal(result.kpis[1].value, '€3,500');
  assert.equal(result.kpis[2].value, '€900');
  assert.equal(result.kpis[3].subvalue, 'One-time: €500');
  assert.deepEqual(result.charts.primary.labels, ['M1', 'M2', 'M3']);
  assert.deepEqual(result.charts.primary.datasets[0].data, [1000, 1500, 1000]);
  assert.deepEqual(result.charts.primary.datasets[1].data, [200, 200, 500]);
});

runTest('budget validation keeps one income and one expense row', () => {
  const state = {
    startingBalance: 'bad',
    projectionLength: 0,
    projectionUnit: 'bad',
    incomes: [],
    expenses: []
  };

  const changed = budgetModule.validateState(state);

  assert.deepEqual(changed, ['budget']);
  assert.equal(state.incomes.length, 1);
  assert.equal(state.expenses.length, 1);
  assert.equal(state.projectionUnit, 'months');
  assert.equal(state.projectionLength, 1);
});

runTest('budget migrates old other type to custom', () => {
  const state = {
    startingBalance: 0,
    projectionLength: 1,
    projectionUnit: 'months',
    incomes: [{ type: 'other', amount: 0, frequency: 'monthly' }],
    expenses: [{ type: 'other', name: 'New Phone', amount: 1000, frequency: 'oneTime', oneTimeMonth: 1 }]
  };

  budgetModule.validateState(state);

  assert.equal(state.incomes[0].type, 'custom');
  assert.equal(state.expenses[0].type, 'custom');
});

runTest('budget exposes cash flow, balance, and expense charts', () => {
  const result = budgetModule.calculate(clone(budgetModule.defaultState));

  assert.deepEqual(Object.keys(result.charts), ['primary', 'balance', 'breakdown']);
  assert.equal(result.table.title, 'Budget Forecast');
  assert.equal(result.charts.breakdown.type, 'doughnut');
});
