import { euros, formatPlain } from '../utils/format.js';
import { realValueLabel } from '../utils/inflation.js';
import { barDataset, doughnutDataset, lineDataset } from '../ui/chartDatasets.js';

const defaultState = {
  initialInvestment: 5000,
  recurringContribution: 200,
  contributionInterval: 'monthly',
  investmentYears: 10,
  annualReturn: 5.0,
  annualInflationRate: 2.5,
  incomeYield: 0,
  incomeFrequency: 'none',
  taxRate: 15.0,
  reinvestIncome: true
};

const controls = [
  { id: 'initialInvestment', label: 'Initial investment', min: 0, max: 250000, step: 500, prefix: 'EUR ', control: 'number', desc: 'Amount invested at the start.' },
  { id: 'recurringContribution', label: 'Recurring contribution', min: 0, max: 10000, step: 50, prefix: 'EUR ', control: 'number', desc: 'Amount added at each contribution interval.' },
  { id: 'contributionInterval', label: 'Contribution interval', type: 'select', options: [['weekly', 'Weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Semi-annually'], ['annual', 'Annually']], desc: 'How often the recurring contribution is added.' },
  { id: 'investmentYears', label: 'Investment length', min: 1, max: 50, step: 1, suffix: 'yrs', desc: 'How long the investment runs.' },
  { id: 'annualReturn', label: 'Annual growth rate', min: 0, max: 20, step: 0.1, suffix: '%', desc: 'Expected annual price or fund growth. Do not include separate dividends or coupons here if using income yield.' },
  { id: 'annualInflationRate', label: 'Annual inflation rate', min: 0, max: 10, step: 0.1, suffix: '%', advanced: true, desc: 'Average inflation used to show ending values in today\'s purchasing power.' },
  { id: 'incomeYield', label: 'Income / dividend yield', min: 0, max: 15, step: 0.1, suffix: '%', advanced: true, desc: 'Annual coupon or dividend yield paid separately from growth.' },
  { id: 'incomeFrequency', label: 'Income paid', type: 'select', advanced: true, options: [['none', 'No separate income'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Twice a year'], ['annual', 'Once a year']], desc: 'How often coupons or dividends are paid.' },
  { id: 'taxRate', label: 'Tax on income', min: 0, max: 40, step: 0.1, suffix: '%', advanced: true, desc: 'Tax withheld from each coupon or dividend payment.' },
  { id: 'reinvestIncome', label: 'Reinvest net income', type: 'checkbox', advanced: true, desc: 'When enabled, after-tax income is added back to the portfolio. This only matters when separate income is paid.' }
];

function projectInvestment(state) {
  const contributionFrequency = { weekly: 52, monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };
  const incomeFrequency = { none: 0, monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };
  const years = state.investmentYears;
  const totalSteps = years * 52;
  const growthRate = Math.pow(1 + state.annualReturn / 100, 1 / 52) - 1;
  const contributionTimes = contributionFrequency[state.contributionInterval] || 12;
  const incomeTimes = incomeFrequency[state.incomeFrequency] || 0;
  const contributionStep = 52 / contributionTimes;
  const incomeStep = incomeTimes ? 52 / incomeTimes : 0;
  let nextContributionAt = contributionStep;
  let nextIncomeAt = incomeStep;
  let balance = state.initialInvestment;
  let totalContributed = state.initialInvestment;
  let grossIncome = 0;
  let taxPaid = 0;
  let cashIncome = 0;
  const annual = [];

  for (let step = 1; step <= totalSteps; step++) {
    balance *= 1 + growthRate;

    if (step + 0.0001 >= nextContributionAt) {
      balance += state.recurringContribution;
      totalContributed += state.recurringContribution;
      nextContributionAt += contributionStep;
    }

    if (incomeTimes && step + 0.0001 >= nextIncomeAt) {
      const income = balance * (state.incomeYield / 100) / incomeTimes;
      const tax = income * state.taxRate / 100;
      const netIncome = income - tax;
      grossIncome += income;
      taxPaid += tax;
      if (state.reinvestIncome) {
        balance += netIncome;
      } else {
        cashIncome += netIncome;
      }
      nextIncomeAt += incomeStep;
    }

    if (step % 52 === 0) {
      const marketGrowth = Math.max(0, balance - totalContributed - (state.reinvestIncome ? grossIncome - taxPaid : 0));
      annual.push({
        year: step / 52,
        balance,
        totalContributed,
        marketGrowth,
        grossIncome,
        taxPaid,
        cashIncome,
        netWorth: balance + cashIncome
      });
    }
  }

  return {
    years,
    balance,
    totalContributed,
    grossIncome,
    taxPaid,
    cashIncome,
    netWorth: balance + cashIncome,
    investmentGain: Math.max(0, balance + cashIncome - totalContributed),
    annual
  };
}

export const investmentModule = {
  id: 'investment',
  navLabel: 'Investment',
  eyebrow: 'Financial Tools',
  title: 'Investment Growth & Income',
  defaultState,
  controls,
  advancedTableColumnKeys: ['grossIncome', 'taxPaid'],
  chartTabs: {
    primary: 'Simple',
    growth: 'Growth',
    income: 'Income'
  },
  calculate(state) {
    const result = projectInvestment(state);
    const lastAnnualRow = result.annual.at(-1) || { marketGrowth: 0 };

    return {
      kpis: [
        { label: 'Ending Portfolio', value: euros.format(result.balance), subvalue: realValueLabel(result.balance, state.annualInflationRate, result.years, euros), desc: 'Investment value still held at the end. The secondary value shows today\'s purchasing power.' },
        { label: 'Total Net Worth', value: euros.format(result.netWorth), subvalue: realValueLabel(result.netWorth, state.annualInflationRate, result.years, euros), desc: 'Portfolio value plus any income paid out as cash. The secondary value shows today\'s purchasing power.' },
        { label: 'Total Contributed', value: euros.format(result.totalContributed), desc: 'Initial investment plus all recurring contributions.' },
        { label: 'Income After Tax', value: euros.format(result.grossIncome - result.taxPaid), desc: 'Coupons or dividends after withholding tax.' },
        { label: 'Tax Paid', value: euros.format(result.taxPaid), desc: 'Tax withheld from income payments as they occur.' }
      ],
      table: {
        title: 'Annual Investment Schedule',
        rows: result.annual,
        columns: [
          { key: 'year', label: 'Year', format: formatPlain },
          { key: 'totalContributed', label: 'Total Contributed', format: euros.format },
          { key: 'grossIncome', label: 'Gross Income', format: euros.format },
          { key: 'taxPaid', label: 'Tax Paid', format: euros.format },
          { key: 'netWorth', label: 'Total Net Worth', format: euros.format }
        ]
      },
      charts: {
        primary: {
          type: 'doughnut',
          title: 'Investment Outcome Snapshot',
          subtitle: 'Contributions, market growth, net income, and tax',
          labels: ['Contributions', 'Market Growth', 'Net Income', 'Tax'],
          datasets: [
            doughnutDataset('Investment outcome', [
              result.totalContributed,
              lastAnnualRow.marketGrowth,
              Math.max(0, result.grossIncome - result.taxPaid),
              result.taxPaid
            ], ['contribution', 'growth', 'incomeSlice', 'feeSlice'])
          ]
        },
        growth: {
          title: 'Investment Growth',
          subtitle: 'Contributions compared with total net worth',
          leftAxis: 'Value',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            barDataset('Total Contributed', result.annual.map(row => row.totalContributed), 'principalBar', { borderColorKey: 'principal' }),
            lineDataset('Total Net Worth', result.annual.map(row => row.netWorth), 'balance')
          ]
        },
        income: {
          title: 'Income & Reinvestment',
          subtitle: 'Portfolio balance and cumulative net income',
          leftAxis: 'Value',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            lineDataset('Portfolio Balance', result.annual.map(row => row.balance), 'principal'),
            barDataset('Cumulative Net Income', result.annual.map(row => row.grossIncome - row.taxPaid), 'interestBar', { borderColorKey: 'interest' })
          ]
        }
      }
    };
  }
};
