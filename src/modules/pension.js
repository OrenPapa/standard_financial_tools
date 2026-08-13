import { euros, eurosPrecise, formatPlain } from '../utils/format.js';
import { realValueLabel } from '../utils/inflation.js';
import { barDataset, doughnutDataset, lineDataset } from '../ui/chartDatasets.js';

const defaultState = {
  startAge: 30,
  retirementAge: 65,
  initialMonthlyContrib: 120,
  annualContribIncrease: 10,
  accumulationReturn: 4.0,
  profitTaxRate: 15.0,
  annualInflationRate: 2.5,
  payoutYears: 25,
  retirementReturn: 4.0
};

const controls = [
  { id: 'startAge', label: 'Start age', min: 18, max: 70, step: 1, suffix: 'yrs', desc: 'Age when monthly pension saving begins.' },
  { id: 'retirementAge', label: 'Retirement age', min: 40, max: 80, step: 1, suffix: 'yrs', desc: 'Age when contributions stop and drawdown starts.' },
  { id: 'initialMonthlyContrib', label: 'Initial monthly contribution', min: 0, max: 2000, step: 10, prefix: 'EUR ', desc: 'Monthly amount invested during the first saving year.' },
  { id: 'annualContribIncrease', label: 'Annual contribution increase', min: 0, max: 500, step: 5, prefix: 'EUR ', desc: 'Fixed euro increase added to monthly contributions each year.' },
  { id: 'accumulationReturn', label: 'Accumulation annual return', min: 0, max: 12, step: 0.1, suffix: '%', desc: 'Expected annual investment return while saving.' },
  { id: 'profitTaxRate', label: 'Profit tax at retirement', min: 0, max: 40, step: 0.1, suffix: '%', desc: 'Tax applied only to investment profit at retirement.' },
  { id: 'annualInflationRate', label: 'Annual inflation rate', min: 0, max: 10, step: 0.1, suffix: '%', desc: 'Average yearly inflation used for purchasing power and indexed payouts.' },
  { id: 'payoutYears', label: 'Payout years', min: 1, max: 45, step: 1, suffix: 'yrs', desc: 'Number of years the retirement fund is paid out.' },
  { id: 'retirementReturn', label: 'Retirement annual return', min: 0, max: 12, step: 0.1, suffix: '%', desc: 'Expected annual investment return during retirement drawdown.' }
];

function accumulation(state) {
  const years = state.retirementAge - state.startAge;
  const months = years * 12;
  const monthlyRate = state.accumulationReturn / 12 / 100;
  let balance = 0;
  let totalContributed = 0;
  const annual = [];

  for (let month = 1; month <= months; month++) {
    const yearIndex = Math.floor((month - 1) / 12);
    const monthlyContrib = state.initialMonthlyContrib + yearIndex * state.annualContribIncrease;
    balance = balance * (1 + monthlyRate) + monthlyContrib;
    totalContributed += monthlyContrib;

    if (month % 12 === 0) {
      const profit = Math.max(0, balance - totalContributed);
      const tax = profit * state.profitTaxRate / 100;
      annual.push({
        age: state.startAge + yearIndex + 1,
        monthlyContrib,
        totalContributed,
        interestEarned: profit,
        balance,
        netBalance: balance - tax
      });
    }
  }

  const totalProfit = Math.max(0, balance - totalContributed);
  const taxAmount = totalProfit * state.profitTaxRate / 100;
  const netBalance = balance - taxAmount;
  const realNetBalance = netBalance / Math.pow(1 + state.annualInflationRate / 100, years);

  return { years, balance, totalContributed, totalProfit, taxAmount, netBalance, realNetBalance, annual };
}

function flatMonthlyPayout(balance, state) {
  const months = state.payoutYears * 12;
  const r = state.retirementReturn / 12 / 100;
  if (months <= 0) return 0;
  if (r === 0) return balance / months;
  return balance * r / (1 - Math.pow(1 + r, -months));
}

function indexedStartingPayout(balance, state) {
  const months = state.payoutYears * 12;
  const r = state.retirementReturn / 12 / 100;
  const g = state.annualInflationRate / 100;
  let discountSum = 0;

  for (let month = 1; month <= months; month++) {
    const yearIndex = Math.floor((month - 1) / 12);
    discountSum += Math.pow(1 + g, yearIndex) / Math.pow(1 + r, month);
  }

  return discountSum === 0 ? 0 : balance / discountSum;
}

function drawdown(balance, state, payoutType) {
  const months = state.payoutYears * 12;
  const r = state.retirementReturn / 12 / 100;
  const g = state.annualInflationRate / 100;
  const startingPayout = payoutType === 'flat' ? flatMonthlyPayout(balance, state) : indexedStartingPayout(balance, state);
  const annual = [];
  let fund = balance;

  for (let month = 1; month <= months; month++) {
    const yearIndex = Math.floor((month - 1) / 12);
    const monthlyPayout = payoutType === 'flat' ? startingPayout : startingPayout * Math.pow(1 + g, yearIndex);
    fund = Math.max(0, fund * (1 + r) - monthlyPayout);

    if (month % 12 === 0) {
      annual.push({
        year: yearIndex + 1,
        age: state.retirementAge + yearIndex + 1,
        balance: fund,
        monthlyPayout
      });
    }
  }

  const endingPayout = payoutType === 'flat'
    ? startingPayout
    : startingPayout * Math.pow(1 + g, Math.max(0, state.payoutYears - 1));

  return { startingPayout, endingPayout, annual };
}

export const pensionModule = {
  id: 'pension',
  navLabel: 'Pension',
  eyebrow: 'Financial Tools',
  title: 'Pension Accumulation & Drawdown',
  defaultState,
  controls,
  chartTabs: {
    primary: 'Simple',
    growth: 'Growth',
    drawdown: 'Drawdown'
  },
  validateState(state) {
    if (state.retirementAge <= state.startAge) {
      state.retirementAge = state.startAge + 1;
      return ['retirementAge'];
    }
    return [];
  },
  calculate(state, appState) {
    const acc = accumulation(state);
    const dd = drawdown(acc.netBalance, state, appState.payoutType);

    return {
      kpis: [
        { label: 'Gross Balance', value: euros.format(acc.balance), desc: 'Fund value before tax at retirement.' },
        { label: 'Net Balance', value: euros.format(acc.netBalance), desc: 'Retirement balance after profit tax.' },
        { label: "Today's Purchasing Power", value: euros.format(acc.realNetBalance), desc: 'Net balance discounted by inflation.' },
        { label: 'Year 1 Monthly Payout', value: eurosPrecise.format(dd.startingPayout), subvalue: realValueLabel(dd.startingPayout, state.annualInflationRate, acc.years, eurosPrecise), desc: 'Monthly withdrawal in the first retirement year. The secondary value shows today\'s purchasing power.' },
        { label: `Ending Monthly Payout, Year ${state.payoutYears}`, value: eurosPrecise.format(dd.endingPayout), subvalue: realValueLabel(dd.endingPayout, state.annualInflationRate, acc.years + state.payoutYears - 1, eurosPrecise), desc: 'Monthly withdrawal in the final payout year. The secondary value shows today\'s purchasing power.' }
      ],
      table: {
        title: 'Annual Accumulation Schedule',
        rows: acc.annual,
        columns: [
          { key: 'age', label: 'Age', format: formatPlain },
          { key: 'monthlyContrib', label: 'Monthly Contribution', format: eurosPrecise.format },
          { key: 'totalContributed', label: 'Total Contributed', format: euros.format },
          { key: 'interestEarned', label: 'Interest Earned', format: euros.format },
          { key: 'balance', label: 'Year-End Fund Balance', format: euros.format }
        ]
      },
      charts: {
        primary: {
          type: 'doughnut',
          title: 'Retirement Balance Snapshot',
          subtitle: 'Contributions, investment growth, and estimated tax at retirement',
          labels: ['Contributions', 'Investment Growth', 'Tax'],
          datasets: [
            doughnutDataset('Retirement balance', [
              acc.totalContributed,
              acc.totalProfit,
              acc.taxAmount
            ], ['contribution', 'growth', 'feeSlice'])
          ]
        },
        growth: {
          title: 'Annual Portfolio Growth',
          subtitle: 'Principal, interest, and net balance after tax',
          leftAxis: 'Fund value',
          rightAxis: '',
          labels: acc.annual.map(row => row.age),
          datasets: [
            barDataset('Total Principal', acc.annual.map(row => row.totalContributed), 'principalBarStrong', { borderColorKey: 'principal' }),
            barDataset('Cumulative Interest', acc.annual.map(row => row.interestEarned), 'interestBarSoft', { borderColorKey: 'interest' }),
            lineDataset('Net Balance After Tax', acc.annual.map(row => row.netBalance), 'balance')
          ]
        },
        drawdown: {
          title: 'Retirement Drawdown',
          subtitle: 'Remaining fund balance and monthly payout by year',
          leftAxis: 'Fund balance',
          rightAxis: 'Monthly payout',
          labels: dd.annual.map(row => `Y${row.year}`),
          datasets: [
            lineDataset('Remaining Balance', dd.annual.map(row => row.balance), 'principal', { fill: false }),
            lineDataset('Monthly Payout', dd.annual.map(row => row.monthlyPayout), 'interest', { yAxisID: 'y1' })
          ]
        }
      }
    };
  }
};
