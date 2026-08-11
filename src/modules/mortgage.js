import { euros, eurosPrecise, formatPlain } from '../utils/format.js';
import { amortizedPayment } from '../utils/amortization.js';
import { realValueAt } from '../utils/inflation.js';
import { barDataset, lineDataset } from '../ui/chartDatasets.js';

const defaultState = {
  homePrice: 300000,
  downPayment: 60000,
  annualInterestRate: 5.5,
  mortgageTermYears: 30,
  extraMonthlyPayment: 0,
  propertyTaxRate: 1.0,
  annualInsurance: 1200,
  monthlyHOA: 0,
  pmiRate: 0.5,
  closingCosts: 6000,
  annualInflationRate: 2.5
};

const controls = [
  { id: 'homePrice', label: 'Home price', min: 0, max: 2000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Purchase price of the property.' },
  { id: 'downPayment', label: 'Down payment', min: 0, max: 1000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Cash paid upfront, reducing the mortgage principal.' },
  { id: 'annualInterestRate', label: 'Mortgage rate', min: 0, max: 20, step: 0.1, suffix: '%', desc: 'Nominal annual mortgage interest rate.' },
  { id: 'mortgageTermYears', label: 'Mortgage term', min: 1, max: 40, step: 1, suffix: 'yrs', desc: 'Planned mortgage repayment period.' },
  { id: 'extraMonthlyPayment', label: 'Extra monthly payment', min: 0, max: 10000, step: 50, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Additional amount paid toward principal each month.' },
  { id: 'propertyTaxRate', label: 'Property tax rate', min: 0, max: 5, step: 0.1, suffix: '%', advanced: true, desc: 'Annual property tax as a percentage of the home price.' },
  { id: 'annualInsurance', label: 'Annual insurance', min: 0, max: 20000, step: 100, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Estimated yearly homeowners insurance.' },
  { id: 'monthlyHOA', label: 'Monthly HOA / maintenance', min: 0, max: 3000, step: 25, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Monthly association dues or maintenance reserve.' },
  { id: 'pmiRate', label: 'PMI rate', min: 0, max: 3, step: 0.1, suffix: '%', advanced: true, desc: 'Annual private mortgage insurance rate, applied while equity is below 20%.' },
  { id: 'closingCosts', label: 'Closing costs', min: 0, max: 100000, step: 500, prefix: 'EUR ', control: 'number', advanced: true, desc: 'One-time purchase costs counted in total cost, not loan balance.' },
  { id: 'annualInflationRate', label: 'Annual inflation rate', min: 0, max: 10, step: 0.1, suffix: '%', advanced: true, desc: 'Average inflation used to show future monthly costs in today\'s purchasing power.' }
];

function amortizeMortgage(state) {
  const loanAmount = Math.max(0, state.homePrice - state.downPayment);
  const months = Math.max(1, Math.round(state.mortgageTermYears * 12));
  const monthlyRate = state.annualInterestRate / 100 / 12;
  const scheduledPayment = amortizedPayment({
    principal: loanAmount,
    periodicRate: monthlyRate,
    periods: months
  });
  const propertyTaxMonthly = state.homePrice * state.propertyTaxRate / 100 / 12;
  const insuranceMonthly = state.annualInsurance / 12;
  const baseMonthlyOwnership = propertyTaxMonthly + insuranceMonthly + state.monthlyHOA;
  let balance = loanAmount;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalTaxes = 0;
  let totalInsurance = 0;
  let totalHoa = 0;
  let totalPmi = 0;
  let payoffMonth = months;
  const rows = [];
  const annual = [];

  for (let month = 1; month <= months && balance > 0.005; month++) {
    const startingBalance = balance;
    const interest = startingBalance * monthlyRate;
    const equityRatio = state.homePrice > 0 ? (state.homePrice - startingBalance) / state.homePrice : 1;
    const pmiMonthly = equityRatio < 0.2 ? loanAmount * state.pmiRate / 100 / 12 : 0;
    const principalPayment = Math.min(startingBalance + interest, scheduledPayment + state.extraMonthlyPayment);
    const endingBalance = Math.max(0, startingBalance + interest - principalPayment);
    const ownershipCosts = baseMonthlyOwnership + pmiMonthly;

    balance = endingBalance;
    totalPrincipal += principalPayment;
    totalInterest += interest;
    totalTaxes += propertyTaxMonthly;
    totalInsurance += insuranceMonthly;
    totalHoa += state.monthlyHOA;
    totalPmi += pmiMonthly;
    payoffMonth = month;

    rows.push({
      month,
      year: Math.ceil(month / 12),
      startingBalance,
      principal: principalPayment,
      interest,
      taxes: propertyTaxMonthly,
      insurance: insuranceMonthly,
      pmi: pmiMonthly,
      hoa: state.monthlyHOA,
      totalMonthly: principalPayment + interest + ownershipCosts,
      endingBalance
    });

    if (month % 12 === 0 || endingBalance <= 0.005) {
      annual.push({
        year: Math.ceil(month / 12),
        endingBalance,
        equity: Math.max(0, state.homePrice - endingBalance),
        totalPrincipal,
        totalInterest,
        totalTaxes,
        totalInsurance,
        totalHoa,
        totalPmi,
        totalOwnershipCosts: totalTaxes + totalInsurance + totalHoa + totalPmi,
        totalPaid: state.downPayment + state.closingCosts + totalPrincipal + totalInterest + totalTaxes + totalInsurance + totalHoa + totalPmi
      });
    }
  }

  const currentPmiMonthly = loanAmount > state.homePrice * 0.8 ? loanAmount * state.pmiRate / 100 / 12 : 0;

  return {
    loanAmount,
    scheduledPayment,
    propertyTaxMonthly,
    insuranceMonthly,
    pmiMonthly: currentPmiMonthly,
    baseMonthlyOwnership,
    totalMonthlyPayment: scheduledPayment + baseMonthlyOwnership + currentPmiMonthly,
    totalInterest,
    totalOwnershipCosts: totalTaxes + totalInsurance + totalHoa + totalPmi,
    totalCost: state.downPayment + state.closingCosts + totalPrincipal + totalInterest + totalTaxes + totalInsurance + totalHoa + totalPmi,
    payoffYears: payoffMonth / 12,
    rows,
    annual
  };
}

export const mortgageModule = {
  id: 'mortgage',
  navLabel: 'Mortgage',
  eyebrow: 'Financial Tools',
  title: 'Mortgage Payment',
  defaultState,
  controls,
  advancedTableColumnKeys: ['taxes', 'pmi'],
  chartTabs: {
    primary: 'Balance',
    secondary: 'Cost'
  },
  validateState(state) {
    if (state.downPayment > state.homePrice) {
      state.downPayment = state.homePrice;
      return ['downPayment'];
    }
    return [];
  },
  calculate(state) {
    const result = amortizeMortgage(state);
    const realPaymentYear = Math.min(15, Math.max(1, result.payoffYears));
    const realMonthlyCostSubvalue = state.annualInflationRate > 0
      ? `Year ${realPaymentYear.toFixed(realPaymentYear % 1 ? 1 : 0)}: ${eurosPrecise.format(realValueAt(result.totalMonthlyPayment, state.annualInflationRate, realPaymentYear))}`
      : '';

    return {
      kpis: [
        { label: 'Loan Amount', value: euros.format(result.loanAmount), desc: 'Home price minus down payment.' },
        { label: 'Principal & Interest', value: eurosPrecise.format(result.scheduledPayment), desc: 'Scheduled monthly mortgage payment before taxes, insurance, PMI, HOA, and extras.' },
        { label: 'Estimated Monthly Cost', value: eurosPrecise.format(result.totalMonthlyPayment), subvalue: realMonthlyCostSubvalue, desc: 'Principal, interest, estimated taxes, insurance, PMI, and HOA. The secondary value shows its future purchasing-power feel.' },
        { label: 'Total Interest', value: euros.format(result.totalInterest), desc: 'Total interest paid over the mortgage.' },
        { label: 'Payoff Time', value: `${result.payoffYears.toFixed(1)} yrs`, desc: 'Estimated time until the mortgage balance reaches zero.' }
      ],
      table: {
        title: 'Mortgage Amortization Schedule',
        rows: result.rows,
        columns: [
          { key: 'month', label: 'Month', format: formatPlain },
          { key: 'startingBalance', label: 'Starting Balance', format: euros.format },
          { key: 'principal', label: 'Principal', format: euros.format },
          { key: 'interest', label: 'Interest', format: euros.format },
          { key: 'taxes', label: 'Taxes', format: euros.format },
          { key: 'pmi', label: 'PMI', format: euros.format },
          { key: 'endingBalance', label: 'Ending Balance', format: euros.format }
        ]
      },
      charts: {
        primary: {
          title: 'Mortgage Balance & Equity',
          subtitle: 'Remaining loan balance compared with estimated equity',
          leftAxis: 'Amount',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            lineDataset('Remaining Balance', result.annual.map(row => row.endingBalance), 'balance'),
            lineDataset('Equity', result.annual.map(row => row.equity), 'equity')
          ]
        },
        secondary: {
          title: 'Mortgage Cost Breakdown',
          subtitle: 'Cumulative principal, interest, and ownership costs',
          leftAxis: 'Amount paid',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            barDataset('Principal Paid', result.annual.map(row => row.totalPrincipal), 'principalBar', { borderColorKey: 'principal' }),
            barDataset('Interest Paid', result.annual.map(row => row.totalInterest), 'interestBar', { borderColorKey: 'interest' }),
            barDataset('Taxes / Insurance / PMI / HOA', result.annual.map(row => row.totalOwnershipCosts), 'costBar', { borderColorKey: 'cost' })
          ]
        }
      }
    };
  }
};
