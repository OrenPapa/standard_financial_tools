import { calculatorFieldSettings } from '../config/calculatorFields.js';
import { euros, formatPlain } from '../utils/format.js';
import { barDataset, doughnutDataset, lineDataset } from '../ui/chartDatasets.js';

const budgetSettings = calculatorFieldSettings.budget?.fields ?? {};

export const frequencyOptions = [
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
  ['yearly', 'Yearly'],
  ['oneTime', 'Selected months']
];

export const monthOptions = [
  [1, 'January'],
  [2, 'February'],
  [3, 'March'],
  [4, 'April'],
  [5, 'May'],
  [6, 'June'],
  [7, 'July'],
  [8, 'August'],
  [9, 'September'],
  [10, 'October'],
  [11, 'November'],
  [12, 'December']
];

export const forecastPeriodOptions = [
  ['months:1', '1 month'],
  ['months:3', '3 months'],
  ['months:6', '6 months'],
  ['months:12', '12 months'],
  ['years:3', '3 years'],
  ['years:5', '5 years'],
  ['years:10', '10 years'],
  ['years:15', '15 years'],
  ['years:20', '20 years'],
  ['years:25', '25 years'],
  ['years:30', '30 years'],
  ['years:35', '35 years'],
  ['years:40', '40 years']
];

export const incomeTypeOptions = [
  ['salary', 'Salary'],
  ['investment', 'Investment'],
  ['business', 'Business'],
  ['benefits', 'Benefits'],
  ['custom', 'Custom']
];

export const expenseTypeOptions = [
  ['housing', 'Housing'],
  ['food', 'Food'],
  ['utilities', 'Utilities'],
  ['transport', 'Transport'],
  ['debt', 'Debt'],
  ['insurance', 'Insurance'],
  ['entertainment', 'Entertainment'],
  ['savings', 'Savings'],
  ['custom', 'Custom']
];

const baseFieldMeta = {
  startingBalance: {
    id: 'startingBalance',
    label: 'Starting balance',
    min: -1000000,
    max: 10000000,
    step: 100,
    prefix: 'EUR ',
    desc: 'Current balance before future income and expenses are added.'
  },
  projectionLength: {
    id: 'projectionLength',
    label: 'Forecast length',
    min: 1,
    max: 50,
    step: 1,
    desc: 'How far ahead to project the budget.'
  },
  rowAmount: {
    id: 'rowAmount',
    label: 'Amount',
    min: 0,
    max: 10000000,
    step: 10,
    prefix: 'EUR ',
    desc: 'Amount for this income or expense row.'
  },
  oneTimeMonth: {
    id: 'oneTimeMonth',
    label: 'Months',
    min: 1,
    max: 12,
    step: 1,
    desc: 'Calendar months when a selected-month income or expense happens.'
  }
};

export const budgetFieldMeta = Object.fromEntries(
  Object.entries(baseFieldMeta).map(([key, meta]) => [
    key,
    {
      ...meta,
      ...budgetSettings[key]
    }
  ])
);

const defaultStartingBalance = Number(budgetSettings.startingBalance?.defaultValue ?? 2500);
const defaultProjectionLength = Number(budgetSettings.projectionLength?.defaultValue ?? 12);

const defaultState = {
  startingBalance: defaultStartingBalance,
  projectionLength: defaultProjectionLength,
  projectionUnit: 'months',
  incomes: [
    { id: 'income-1', type: 'salary', name: 'Net salary', amount: 2500, frequency: 'monthly', oneTimeMonth: 1, oneTimeMonths: [1] },
    { id: 'income-2', type: 'investment', name: 'Investment income', amount: 0, frequency: 'monthly', oneTimeMonth: 1, oneTimeMonths: [1] }
  ],
  expenses: [
    { id: 'expense-1', type: 'housing', name: 'Rent or mortgage', amount: 900, frequency: 'monthly', oneTimeMonth: 1, oneTimeMonths: [1] },
    { id: 'expense-2', type: 'food', name: 'Groceries', amount: 100, frequency: 'weekly', oneTimeMonth: 1, oneTimeMonths: [1] },
    { id: 'expense-3', type: 'utilities', name: 'Utilities', amount: 180, frequency: 'monthly', oneTimeMonth: 1, oneTimeMonths: [1] }
  ]
};

const periodsPerYear = {
  daily: 365,
  weekly: 52,
  monthly: 12,
  yearly: 1
};

function settingDefault(key, fallback) {
  return budgetSettings[key]?.defaultValue ?? fallback;
}

export function createBudgetIncome(index) {
  return {
    id: `income-${Date.now()}-${index + 1}`,
    type: index === 0 ? 'salary' : 'custom',
    name: '',
    amount: Number(settingDefault('rowAmount', 0)),
    frequency: 'monthly',
    oneTimeMonth: 1,
    oneTimeMonths: [1]
  };
}

export function createBudgetExpense(index) {
  return {
    id: `expense-${Date.now()}-${index + 1}`,
    type: index === 0 ? 'food' : 'custom',
    name: '',
    amount: Number(settingDefault('rowAmount', 0)),
    frequency: 'monthly',
    oneTimeMonth: 1,
    oneTimeMonths: [1]
  };
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function clampNumber(meta, value, fallback = 0) {
  const number = Number(value);
  const safeValue = Number.isFinite(number) ? number : fallback;
  const min = Number.isFinite(Number(meta.min)) ? Number(meta.min) : -Infinity;
  const max = Number.isFinite(Number(meta.max)) ? Number(meta.max) : Infinity;
  return Math.min(max, Math.max(min, safeValue));
}

function validOption(value, options, fallback) {
  const normalizedValue = value === 'other' ? 'custom' : value;
  return options.some(([optionValue]) => optionValue === normalizedValue) ? normalizedValue : fallback;
}

function monthNumber(value) {
  const month = Math.round(clampNumber(budgetFieldMeta.oneTimeMonth, value, 1));
  return Math.min(12, Math.max(1, month));
}

function sanitizeMonthSelection(row = {}) {
  const rawMonths = Array.isArray(row.oneTimeMonths)
    ? row.oneTimeMonths
    : [row.oneTimeMonth ?? 1];
  const months = [...new Set(rawMonths.map(monthNumber))].sort((a, b) => a - b);
  return months;
}

function sanitizeIncome(row = {}, index = 0) {
  const oneTimeMonths = sanitizeMonthSelection(row);
  return {
    id: row.id || `income-${index + 1}`,
    type: validOption(row.type, incomeTypeOptions, 'custom'),
    name: sanitizeName(row.name),
    amount: clampNumber(budgetFieldMeta.rowAmount, row.amount, 0),
    frequency: validOption(row.frequency, frequencyOptions, 'monthly'),
    oneTimeMonth: oneTimeMonths[0],
    oneTimeMonths
  };
}

function sanitizeExpense(row = {}, index = 0) {
  const oneTimeMonths = sanitizeMonthSelection(row);
  return {
    id: row.id || `expense-${index + 1}`,
    type: validOption(row.type, expenseTypeOptions, 'custom'),
    name: sanitizeName(row.name),
    amount: clampNumber(budgetFieldMeta.rowAmount, row.amount, 0),
    frequency: validOption(row.frequency, frequencyOptions, 'monthly'),
    oneTimeMonth: oneTimeMonths[0],
    oneTimeMonths
  };
}

function sanitizeName(value) {
  return String(value ?? '').trim().slice(0, 80);
}

function sanitizeState(state) {
  const projectionUnit = state.projectionUnit === 'years' ? 'years' : 'months';
  let projectionLength = Math.round(clampNumber(
    budgetFieldMeta.projectionLength,
    state.projectionLength,
    defaultProjectionLength
  ));
  if (projectionUnit === 'years') projectionLength = Math.min(40, projectionLength);
  const incomes = Array.isArray(state.incomes) ? state.incomes.map(sanitizeIncome) : [];
  const expenses = Array.isArray(state.expenses) ? state.expenses.map(sanitizeExpense) : [];

  return {
    startingBalance: clampNumber(budgetFieldMeta.startingBalance, state.startingBalance, defaultStartingBalance),
    projectionLength,
    projectionUnit,
    incomes: incomes.length ? incomes : [createBudgetIncome(0)],
    expenses: expenses.length ? expenses : [createBudgetExpense(0)]
  };
}

function monthlyAmount(row) {
  if (row.frequency === 'oneTime') return 0;
  return positiveNumber(row.amount) * (periodsPerYear[row.frequency] || 12) / 12;
}

function totalMonthly(rows) {
  return rows.reduce((sum, row) => sum + monthlyAmount(row), 0);
}

function optionLabel(value, options) {
  return options.find(([optionValue]) => optionValue === value)?.[1] || value;
}

function rowLabel(row, options) {
  return row.name || optionLabel(row.type, options);
}

function projectionMonths(state) {
  return state.projectionUnit === 'years'
    ? state.projectionLength * 12
    : state.projectionLength;
}

function calendarMonthForForecastMonth(month) {
  return ((month - 1) % 12) + 1;
}

function rowHappensInForecastMonth(row, month) {
  if (row.frequency !== 'oneTime') return false;
  return row.oneTimeMonths.includes(calendarMonthForForecastMonth(month));
}

function oneTimeAmountForMonth(rows, month) {
  return rows
    .filter(row => rowHappensInForecastMonth(row, month))
    .reduce((sum, row) => sum + positiveNumber(row.amount), 0);
}

function selectedMonthTotal(row, months) {
  let total = 0;
  for (let month = 1; month <= months; month++) {
    if (rowHappensInForecastMonth(row, month)) total += positiveNumber(row.amount);
  }
  return total;
}

function groupedForecastExpenses(rows, months) {
  const groups = new Map();
  rows.forEach(row => {
    const label = rowLabel(row, expenseTypeOptions);
    const amount = row.frequency === 'oneTime'
      ? selectedMonthTotal(row, months)
      : monthlyAmount(row) * months;

    groups.set(label, (groups.get(label) || 0) + amount);
  });

  return Array.from(groups, ([label, amount]) => ({ label, amount })).filter(item => item.amount > 0.005);
}

function forecastRows(state, monthlyIncome, monthlyExpenses) {
  const months = projectionMonths(state);
  const rows = [];
  let balance = state.startingBalance;

  for (let month = 1; month <= months; month++) {
    const oneTimeIncome = oneTimeAmountForMonth(state.incomes, month);
    const oneTimeExpenses = oneTimeAmountForMonth(state.expenses, month);
    const income = monthlyIncome + oneTimeIncome;
    const expenses = monthlyExpenses + oneTimeExpenses;
    const netCashflow = income - expenses;
    balance += netCashflow;
    rows.push({
      month,
      year: Math.ceil(month / 12),
      recurringIncome: monthlyIncome,
      recurringExpenses: monthlyExpenses,
      oneTimeIncome,
      oneTimeExpenses,
      income,
      expenses,
      netCashflow,
      endingBalance: balance
    });
  }

  return rows;
}

function horizonLabel(state) {
  const unitLabel = state.projectionUnit === 'years'
    ? state.projectionLength === 1 ? 'year' : 'years'
    : state.projectionLength === 1 ? 'month' : 'months';
  return `${state.projectionLength} ${unitLabel}`;
}

function chartRowsForForecast(state, rows) {
  if (state.projectionUnit !== 'years') {
    return {
      interval: 'month',
      labels: rows.map(row => `M${row.month}`),
      rows
    };
  }

  const yearlyRows = [];
  for (let year = 1; year <= state.projectionLength; year++) {
    const yearRows = rows.filter(row => row.year === year);
    const lastRow = yearRows.at(-1);
    if (!lastRow) continue;

    yearlyRows.push({
      year,
      income: yearRows.reduce((sum, row) => sum + row.income, 0),
      expenses: yearRows.reduce((sum, row) => sum + row.expenses, 0),
      netCashflow: yearRows.reduce((sum, row) => sum + row.netCashflow, 0),
      endingBalance: lastRow.endingBalance
    });
  }

  return {
    interval: 'year',
    labels: yearlyRows.map(row => `Y${row.year}`),
    rows: yearlyRows
  };
}

export const budgetModule = {
  id: 'budget',
  navLabel: 'Budget',
  eyebrow: 'Financial Tools',
  title: 'Budget Tracker',
  defaultState,
  controls: [],
  budgetModule: true,
  fieldMeta: budgetFieldMeta,
  frequencyOptions,
  monthOptions,
  forecastPeriodOptions,
  incomeTypeOptions,
  expenseTypeOptions,
  chartTabs: {
    primary: 'Cash Flow',
    balance: 'Forecast',
    breakdown: 'Expenses'
  },
  validateState(state) {
    const next = sanitizeState(state);
    Object.assign(state, next);
    return ['budget'];
  },
  calculate(rawState) {
    const state = sanitizeState(rawState);
    const monthlyIncome = totalMonthly(state.incomes);
    const monthlyExpenses = totalMonthly(state.expenses);
    const monthlyNet = monthlyIncome - monthlyExpenses;
    const rows = forecastRows(state, monthlyIncome, monthlyExpenses);
    const finalBalance = rows.at(-1)?.endingBalance ?? state.startingBalance;
    const months = projectionMonths(state);
    const totalIncome = rows.reduce((sum, row) => sum + row.income, 0);
    const totalExpenses = rows.reduce((sum, row) => sum + row.expenses, 0);
    const expenseGroups = groupedForecastExpenses(state.expenses, months);
    const horizon = horizonLabel(state);
    const surplusTone = monthlyNet >= 0 ? 'positive' : 'negative';
    const projectedTone = finalBalance >= state.startingBalance ? 'positive' : 'negative';
    const chartForecast = chartRowsForForecast(state, rows);
    const chartNetTotal = chartForecast.rows.reduce((sum, row) => sum + row.netCashflow, 0);

    return {
      kpis: {
        layout: 'budget',
        surplus: {
          label: monthlyNet >= 0 ? 'Monthly Surplus' : 'Monthly Shortfall',
          value: euros.format(monthlyNet),
          tone: surplusTone,
          badge: monthlyNet >= 0 ? 'Positive cash flow' : 'Expenses exceed income',
          income: euros.format(monthlyIncome),
          expenses: euros.format(monthlyExpenses),
          desc: 'Average monthly income minus average monthly expenses.'
        },
        projected: {
          label: 'Projected Balance',
          value: euros.format(finalBalance),
          tone: projectedTone,
          subvalue: `after ${horizon}`,
          starting: `starting from ${euros.format(state.startingBalance)}`,
          badge: projectedTone === 'positive' ? 'On track' : 'Balance declines',
          desc: 'Estimated balance at the end of the selected forecast period after income and expenses.'
        },
        totals: {
          income: euros.format(totalIncome),
          expenses: euros.format(totalExpenses),
          horizon
        }
      },
      table: {
        title: 'Budget Forecast',
        rows,
        columns: [
          { key: 'month', label: 'Month', format: formatPlain },
          { key: 'income', label: 'Income', format: euros.format },
          { key: 'expenses', label: 'Expenses', format: euros.format },
          { key: 'oneTimeIncome', label: 'Selected-Month Income', format: euros.format },
          { key: 'oneTimeExpenses', label: 'Selected-Month Expenses', format: euros.format },
          { key: 'netCashflow', label: 'Net Cash Flow', format: euros.format },
          { key: 'endingBalance', label: 'Ending Balance', format: euros.format }
        ]
      },
      charts: {
        primary: {
          title: 'Budget Overview',
          subtitle: `Income, expenses, and net cash flow by forecast ${chartForecast.interval}`,
          leftAxis: 'Amount',
          rightAxis: '',
          labels: chartForecast.labels,
          datasets: [
            barDataset('Income', chartForecast.rows.map(row => row.income), 'income'),
            barDataset('Expenses', chartForecast.rows.map(row => row.expenses), 'costBar', { borderColorKey: 'cost' }),
            lineDataset('Net Cash Flow', chartForecast.rows.map(row => row.netCashflow), chartNetTotal >= 0 ? 'growth' : 'otherCost')
          ]
        },
        balance: {
          title: 'Projected Balance',
          subtitle: `Estimated balance over ${horizon}`,
          leftAxis: 'Balance',
          rightAxis: '',
          labels: chartForecast.labels,
          datasets: [
            lineDataset('Ending Balance', chartForecast.rows.map(row => row.endingBalance), 'balance')
          ]
        },
        breakdown: {
          type: 'doughnut',
          title: 'Forecast Expense Breakdown',
          subtitle: 'Recurring and selected-month expenses across the selected period',
          labels: expenseGroups.length ? expenseGroups.map(group => group.label) : ['No expenses'],
          datasets: [
            doughnutDataset('Expenses', expenseGroups.length ? expenseGroups.map(group => group.amount) : [0])
          ]
        }
      }
    };
  }
};
