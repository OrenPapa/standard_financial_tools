import { euros, formatPlain } from '../utils/format.js';
import { lineDataset } from '../ui/chartDatasets.js';
import { applyCalculatorFieldSettings } from '../config/calculatorFields.js';

const baseDefaultState = {
  amount: 100,
  startYear: 2026,
  targetYear: 2050,
  annualInflationRate: 2.5
};

const baseControls = [
  { id: 'amount', label: 'Amount', min: 0, max: 1000000, step: 100, prefix: 'EUR ', control: 'number', desc: 'The money amount in the starting year.' },
  { id: 'startYear', label: 'Starting year', min: 1900, max: 2100, step: 1, desc: 'The year your amount belongs to.' },
  { id: 'targetYear', label: 'Target year', min: 1900, max: 2100, step: 1, desc: 'The year you want to compare against. It can be before or after the starting year.' },
  { id: 'annualInflationRate', label: 'Annual inflation / deflation', min: -10, max: 20, step: 0.1, suffix: '%', desc: 'Average annual price change. Use a negative value for deflation.' }
];

const { defaultState, controls } = applyCalculatorFieldSettings('inflation', baseDefaultState, baseControls);

function projectInflation(state) {
  const yearDiff = state.targetYear - state.startYear;
  const rate = state.annualInflationRate / 100;
  const factor = Math.pow(1 + rate, yearDiff);
  const equivalentAmount = state.amount * factor;
  const buyingPowerAmount = factor === 0 ? 0 : state.amount / factor;
  const absoluteChange = equivalentAmount - state.amount;
  const cumulativeChangeRate = factor - 1;
  const direction = yearDiff >= 0 ? 'future' : 'past';
  const rows = [];
  const step = yearDiff >= 0 ? 1 : -1;

  for (let year = state.startYear; step > 0 ? year <= state.targetYear : year >= state.targetYear; year += step) {
    const yearsFromStart = year - state.startYear;
    const yearlyFactor = Math.pow(1 + rate, yearsFromStart);
    const value = state.amount * yearlyFactor;
    const buyingPower = yearlyFactor === 0 ? 0 : state.amount / yearlyFactor;
    rows.push({
      year,
      yearsFromStart,
      value,
      buyingPower,
      factor: yearlyFactor,
      cumulativeChange: yearlyFactor - 1
    });
  }

  return {
    yearDiff,
    years: Math.abs(yearDiff),
    rate,
    factor,
    equivalentAmount,
    buyingPowerAmount,
    absoluteChange,
    cumulativeChangeRate,
    direction,
    rows
  };
}

function percentage(value) {
  return `${(value * 100).toFixed(1)}%`;
}

export const inflationModule = {
  id: 'inflation',
  navLabel: 'Inflation',
  eyebrow: 'Financial Tools',
  title: 'Inflation & Deflation Calculator',
  defaultState,
  controls,
  chartTabs: {
    primary: 'Value',
    secondary: 'Buying Power'
  },
  calculate(state) {
    const result = projectInflation(state);
    const periodLabel = result.direction === 'future' ? 'Future Equivalent' : 'Past Equivalent';
    const buyingPowerLabel = result.direction === 'future' ? 'Future Buying Power' : 'Past Buying Power';
    const changeLabel = result.absoluteChange >= 0 ? 'Nominal Increase' : 'Nominal Decrease';
    const purchasingPowerText = result.direction === 'future'
      ? `${euros.format(state.amount)} kept as cash feels like ${euros.format(result.buyingPowerAmount)} in ${state.targetYear}.`
      : `${euros.format(state.amount)} in ${state.targetYear} feels like ${euros.format(result.buyingPowerAmount)} in ${state.startYear}.`;

    return {
      kpis: [
        { label: 'Starting Amount', value: euros.format(state.amount), desc: `Amount expressed in ${state.startYear} money.` },
        { label: periodLabel, value: euros.format(result.equivalentAmount), desc: `Equivalent amount in ${state.targetYear} using the selected average rate.` },
        { label: buyingPowerLabel, value: euros.format(result.buyingPowerAmount), desc: result.direction === 'future' ? 'What the same cash amount would feel like after inflation.' : 'What that target-year amount would feel like in starting-year purchasing power.' },
        { label: 'Cumulative Change', value: percentage(result.cumulativeChangeRate), desc: 'Total compounded inflation or deflation over the selected period.' },
        { label: changeLabel, value: euros.format(Math.abs(result.absoluteChange)), desc: 'Difference between the starting amount and target-year equivalent.' }
      ],
      table: {
        title: 'Annual Inflation / Deflation Schedule',
        rows: result.rows,
        columns: [
          { key: 'year', label: 'Year', format: formatPlain },
          { key: 'yearsFromStart', label: 'Years From Start', format: value => Math.abs(value) },
          { key: 'value', label: 'Equivalent Value', format: euros.format },
          { key: 'buyingPower', label: 'Buying Power', format: euros.format },
          { key: 'factor', label: 'Price Factor', format: value => percentage(value) },
        ]
      },
      charts: {
        primary: {
          title: 'Equivalent Value Over Time',
          subtitle: `${euros.format(state.amount)} in ${state.startYear} compared through ${state.targetYear}`,
          leftAxis: 'Equivalent value',
          rightAxis: '',
          labels: result.rows.map(row => row.year),
          datasets: [
            lineDataset('Equivalent Value', result.rows.map(row => row.value), 'balance')
          ]
        },
        secondary: {
          title: 'How It Feels',
          subtitle: purchasingPowerText,
          leftAxis: 'Buying power',
          rightAxis: '',
          labels: result.rows.map(row => row.year),
          datasets: [
            lineDataset('Buying Power', result.rows.map(row => row.buyingPower), 'income')
          ]
        }
      }
    };
  }
};
