import { euros, formatPlain } from '../utils/format.js';
import { realValueLabel } from '../utils/inflation.js';
import { barDataset, doughnutDataset, lineDataset } from '../ui/chartDatasets.js';
import { applyCalculatorFieldSettings } from '../config/calculatorFields.js';

const baseDefaultState = {
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

const baseControls = [
  { id: 'initialInvestment', label: 'Initial investment', min: 0, max: 250000, step: 500, prefix: 'EUR ', control: 'number', desc: 'Amount invested at the start.' },
  { id: 'recurringContribution', label: 'Recurring contribution', min: 0, max: 10000, step: 50, prefix: 'EUR ', control: 'number', desc: 'Amount added at each contribution interval.' },
  { id: 'contributionInterval', label: 'Contribution interval', type: 'select', options: [['weekly', 'Weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Semi-annually'], ['annual', 'Annually']], desc: 'How often the recurring contribution is added.' },
  { id: 'investmentYears', label: 'Investment length', min: 1, max: 50, step: 1, suffix: 'yrs', desc: 'How long the investment runs.' },
  { id: 'annualReturn', label: 'Annual growth rate', min: 0, max: 20, step: 0.1, suffix: '%', desc: 'Expected annual price or fund growth. Do not include separate dividends or coupons here if using income yield.' },
  { id: 'annualInflationRate', label: 'Annual inflation rate', min: 0, max: 10, step: 0.1, suffix: '%', desc: 'Average inflation used to show ending values in today\'s purchasing power.' },
  { id: 'incomeYield', label: 'Income / dividend yield', min: 0, max: 15, step: 0.1, suffix: '%', advanced: true, desc: 'Annual coupon or dividend yield paid separately from growth.' },
  { id: 'incomeFrequency', label: 'Income paid', type: 'select', advanced: true, options: [['none', 'No separate income'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Twice a year'], ['annual', 'Once a year']], desc: 'How often coupons or dividends are paid.' },
  { id: 'taxRate', label: 'Tax on gains', min: 0, max: 40, step: 0.1, suffix: '%', desc: 'Tax applied to income payments as they occur and estimated market gains at the end.' },
  { id: 'reinvestIncome', label: 'Reinvest net income', type: 'checkbox', advanced: true, desc: 'When enabled, after-tax income is added back to the portfolio. This only matters when separate income is paid.' }
];

const { defaultState, controls } = applyCalculatorFieldSettings('investment', baseDefaultState, baseControls);

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
  let incomeTaxPaid = 0;
  let cashIncome = 0;
  let reinvestedNetIncome = 0;
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
      incomeTaxPaid += tax;
      if (state.reinvestIncome) {
        balance += netIncome;
        reinvestedNetIncome += netIncome;
      } else {
        cashIncome += netIncome;
      }
      nextIncomeAt += incomeStep;
    }

    if (step % 52 === 0) {
      const snapshot = investmentSnapshot({
        balance,
        totalContributed,
        grossIncome,
        incomeTaxPaid,
        cashIncome,
        reinvestedNetIncome,
        taxRate: state.taxRate
      });

      annual.push({
        year: step / 52,
        balance: snapshot.finalPortfolioValue,
        portfolioValueBeforeFinalTax: balance,
        totalContributed,
        marketGrowth: snapshot.marketGrowth,
        grossGain: snapshot.grossGain,
        grossIncome,
        incomeTaxPaid,
        estimatedGainTax: snapshot.estimatedGainTax,
        taxPaid: snapshot.totalTaxPaid,
        cashIncome,
        netGain: snapshot.netGain,
        netWorth: snapshot.finalNetValue
      });
    }
  }

  const finalSnapshot = investmentSnapshot({
    balance,
    totalContributed,
    grossIncome,
    incomeTaxPaid,
    cashIncome,
    reinvestedNetIncome,
    taxRate: state.taxRate
  });

  return {
    years,
    balance: finalSnapshot.finalPortfolioValue,
    portfolioValueBeforeFinalTax: balance,
    totalContributed,
    grossIncome,
    incomeTaxPaid,
    estimatedGainTax: finalSnapshot.estimatedGainTax,
    taxPaid: finalSnapshot.totalTaxPaid,
    cashIncome,
    grossGain: finalSnapshot.grossGain,
    netGain: finalSnapshot.netGain,
    netWorth: finalSnapshot.finalNetValue,
    investmentGain: finalSnapshot.netGain,
    annual
  };
}

function investmentSnapshot({ balance, totalContributed, grossIncome, incomeTaxPaid, cashIncome, reinvestedNetIncome, taxRate }) {
  const marketGrowth = Math.max(0, balance - totalContributed - reinvestedNetIncome);
  const estimatedGainTax = marketGrowth * taxRate / 100;
  const finalPortfolioValue = Math.max(0, balance - estimatedGainTax);
  const finalNetValue = finalPortfolioValue + cashIncome;
  const grossGain = marketGrowth + grossIncome;
  const totalTaxPaid = incomeTaxPaid + estimatedGainTax;
  const netGain = finalNetValue - totalContributed;

  return {
    marketGrowth,
    estimatedGainTax,
    finalPortfolioValue,
    finalNetValue,
    grossGain,
    totalTaxPaid,
    netGain
  };
}

export const investmentModule = {
  id: 'investment',
  navLabel: 'Investment',
  eyebrow: 'Financial Tools',
  title: 'Investment Growth & Income',
  defaultState,
  controls,
  advancedTableColumnKeys: [],
  chartTabs: {
    primary: 'Simple',
    growth: 'Growth',
    income: 'Tax'
  },
  calculate(state) {
    const result = projectInvestment(state);

    return {
      kpis: [
        { label: 'Final Net Value', value: euros.format(result.netWorth), subvalue: realValueLabel(result.netWorth, state.annualInflationRate, result.years, euros), desc: 'Portfolio value plus paid-out income after estimated tax. The secondary value shows today\'s purchasing power.' },
        { label: 'Total Contributed', value: euros.format(result.totalContributed), desc: 'Initial investment plus all recurring contributions.' },
        { label: 'Gross Gains', value: euros.format(result.grossGain), desc: 'Market growth plus gross income before tax.' },
        { label: 'Tax Paid', value: euros.format(result.taxPaid), desc: 'Income tax paid during the projection plus estimated tax on market gains.' },
        { label: 'Net Gain', value: euros.format(result.netGain), desc: 'Growth and income left after tax, before returning contributed capital.' }
      ],
      table: {
        title: 'Annual Investment Schedule',
        rows: result.annual,
        columns: [
          { key: 'year', label: 'Year', format: formatPlain },
          { key: 'totalContributed', label: 'Total Contributed', format: euros.format },
          { key: 'grossGain', label: 'Gross Gains', format: euros.format },
          { key: 'taxPaid', label: 'Tax Paid', format: euros.format },
          { key: 'netWorth', label: 'Final Net Value', format: euros.format }
        ]
      },
      charts: {
        primary: {
          type: 'doughnut',
          title: 'Investment Outcome Allocation',
          subtitle: 'Contributions, net gains retained, and tax paid',
          labels: ['Contributions', 'Net Gain', 'Tax Paid'],
          datasets: [
            doughnutDataset('Investment outcome', [
              result.totalContributed,
              Math.max(0, result.netGain),
              result.taxPaid
            ], ['contribution', 'growth', 'feeSlice'])
          ]
        },
        growth: {
          title: 'Investment Value After Tax',
          subtitle: 'Contributions compared with final net value over time',
          leftAxis: 'Value',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            barDataset('Total Contributed', result.annual.map(row => row.totalContributed), 'principalBar', { borderColorKey: 'principal' }),
            lineDataset('Final Net Value', result.annual.map(row => row.netWorth), 'balance')
          ]
        },
        income: {
          title: 'Gains & Tax',
          subtitle: 'Gross gains compared with cumulative tax',
          leftAxis: 'Value',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            lineDataset('Gross Gains', result.annual.map(row => row.grossGain), 'principal'),
            barDataset('Tax Paid', result.annual.map(row => row.taxPaid), 'interestBar', { borderColorKey: 'interest' })
          ]
        }
      }
    };
  }
};
