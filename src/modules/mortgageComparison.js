import { amortizedPayment } from '../utils/amortization.js';
import { euros, eurosPrecise, formatPlain } from '../utils/format.js';
import { barDataset, lineDataset, doughnutPalette } from '../ui/chartDatasets.js';

const scenarioFields = [
  { id: 'name', label: 'Scenario name', type: 'text', desc: 'Short label used in result cards, charts, and table.' },
  { id: 'homePrice', label: 'Home price', min: 0, max: 2000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Purchase price of the home.' },
  { id: 'downPayment', label: 'Down payment', min: 0, max: 1000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Cash paid upfront toward the home.' },
  { id: 'annualInterestRate', label: 'Interest rate', min: 0, max: 20, step: 0.1, suffix: '%', desc: 'Nominal annual mortgage interest rate.' },
  { id: 'mortgageTermYears', label: 'Mortgage term', min: 1, max: 40, step: 1, suffix: 'yrs', desc: 'Planned repayment period.' },
  { id: 'closingCosts', label: 'Closing costs', min: 0, max: 100000, step: 500, prefix: 'EUR ', control: 'number', desc: 'One-time purchase or mortgage costs paid upfront.' },
  { id: 'extraMonthlyPayment', label: 'Extra monthly payment', min: 0, max: 10000, step: 50, prefix: 'EUR ', control: 'number', desc: 'Additional monthly amount paid toward principal.' }
];

const defaultState = {
  scenarios: [
    {
      id: 'scenario-1',
      name: 'Scenario 1',
      homePrice: 200000,
      downPayment: 50000,
      annualInterestRate: 5,
      mortgageTermYears: 30,
      closingCosts: 0,
      extraMonthlyPayment: 0
    },
    {
      id: 'scenario-2',
      name: 'Scenario 2',
      homePrice: 250000,
      downPayment: 50000,
      annualInterestRate: 5.5,
      mortgageTermYears: 30,
      closingCosts: 0,
      extraMonthlyPayment: 0
    }
  ]
};

const componentColors = {
  scheduledPrincipal: '#2563eb',
  extraPrincipal: '#7c3aed',
  interest: '#f97316',
  downPayment: '#0891b2',
  closingCosts: '#db2777',
  principalPaid: '#16a34a'
};

function cloneScenario(scenario) {
  return { ...scenario };
}

export function createMortgageComparisonScenario(index) {
  return {
    ...cloneScenario(defaultState.scenarios[index % defaultState.scenarios.length]),
    id: `scenario-${Date.now()}-${index + 1}`,
    name: `Scenario ${index + 1}`
  };
}

function sanitizeScenario(scenario, index) {
  const next = { ...createMortgageComparisonScenario(index), ...scenario };
  next.name = String(next.name || `Scenario ${index + 1}`).trim() || `Scenario ${index + 1}`;
  next.homePrice = positiveNumber(next.homePrice);
  next.downPayment = Math.min(positiveNumber(next.downPayment), next.homePrice);
  next.annualInterestRate = positiveNumber(next.annualInterestRate);
  next.mortgageTermYears = Math.max(1, Math.round(positiveNumber(next.mortgageTermYears, 1)));
  next.closingCosts = positiveNumber(next.closingCosts);
  next.extraMonthlyPayment = positiveNumber(next.extraMonthlyPayment);
  return next;
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function calculateScenario(scenario, index) {
  const input = sanitizeScenario(scenario, index);
  const loanAmount = Math.max(0, input.homePrice - input.downPayment);
  const months = Math.max(1, input.mortgageTermYears * 12);
  const monthlyRate = input.annualInterestRate / 100 / 12;
  const scheduledPayment = amortizedPayment({
    principal: loanAmount,
    periodicRate: monthlyRate,
    periods: months
  });
  const regularPayment = scheduledPayment + input.extraMonthlyPayment;
  const annual = [];
  let balance = loanAmount;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let payoffMonth = months;
  let yearlyPrincipal = 0;
  let yearlyInterest = 0;
  let firstMonthPrincipal = 0;
  let firstMonthScheduledPrincipal = 0;
  let firstMonthExtraPrincipal = 0;
  let firstMonthInterest = 0;
  let firstMonthPayment = 0;

  for (let month = 1; month <= months && balance > 0.005; month++) {
    const interest = balance * monthlyRate;
    const loanPayment = Math.min(balance + interest, regularPayment);
    const principal = Math.max(0, loanPayment - interest);
    const scheduledPrincipal = Math.min(principal, Math.max(0, scheduledPayment - interest));
    const extraPrincipal = Math.max(0, principal - scheduledPrincipal);
    if (month === 1) {
      firstMonthPrincipal = principal;
      firstMonthScheduledPrincipal = scheduledPrincipal;
      firstMonthExtraPrincipal = extraPrincipal;
      firstMonthInterest = interest;
      firstMonthPayment = loanPayment;
    }
    balance = Math.max(0, balance - principal);
    totalPrincipal += principal;
    totalInterest += interest;
    yearlyPrincipal += principal;
    yearlyInterest += interest;
    payoffMonth = month;

    if (month % 12 === 0 || balance <= 0.005) {
      annual.push({
        year: Math.ceil(month / 12),
        remainingBalance: balance,
        yearlyPrincipal,
        yearlyInterest,
        yearlyPaid: yearlyPrincipal + yearlyInterest,
        totalPrincipal,
        totalInterest,
        totalPaid: input.downPayment + input.closingCosts + totalPrincipal + totalInterest
      });
      yearlyPrincipal = 0;
      yearlyInterest = 0;
    }
  }

  const totalCost = input.downPayment + input.closingCosts + totalPrincipal + totalInterest;
  return {
    ...input,
    index,
    loanAmount,
    monthlyPayment: scheduledPayment,
    paymentWithExtra: regularPayment,
    firstMonthPrincipal,
    firstMonthScheduledPrincipal,
    firstMonthExtraPrincipal,
    firstMonthInterest,
    firstMonthPayment,
    totalPrincipal,
    totalInterest,
    totalCost,
    payoffYears: payoffMonth / 12,
    annual
  };
}

function annualValue(scenario, year, key) {
  const row = scenario.annual.find(item => item.year === year) || scenario.annual.at(-1);
  if (!row) return 0;
  if (year > row.year && key === 'remainingBalance') return 0;
  return row[key] ?? 0;
}

function comparisonRows(scenarios) {
  return scenarios.map(scenario => ({
    name: scenario.name,
    homePrice: scenario.homePrice,
    downPayment: scenario.downPayment,
    loanAmount: scenario.loanAmount,
    rate: scenario.annualInterestRate,
    monthlyPayment: scenario.paymentWithExtra,
    totalInterest: scenario.totalInterest,
    totalCost: scenario.totalCost,
    payoffYears: scenario.payoffYears
  }));
}

function stackedTotalFooter(items) {
  const total = items.reduce((sum, item) => sum + Number(item.parsed?.y || 0), 0);
  return `Total: ${eurosPrecise.format(total)}`;
}

export const mortgageComparisonModule = {
  id: 'mortgage-comparison',
  navLabel: 'Mortgage Compare',
  eyebrow: 'Financial Tools',
  title: 'Mortgage Comparison',
  defaultState,
  controls: [],
  comparisonModule: true,
  scenarioFields,
  chartTabs: {
    primary: 'Payment',
    balance: 'Balance',
    cost: 'Cost'
  },
  validateState(state) {
    if (!Array.isArray(state.scenarios)) {
      state.scenarios = defaultState.scenarios.map(cloneScenario);
      return ['scenarios'];
    }

    const nextScenarios = state.scenarios.slice(0, 8).map(sanitizeScenario);
    while (nextScenarios.length < 2) {
      nextScenarios.push(createMortgageComparisonScenario(nextScenarios.length));
    }

    state.scenarios = nextScenarios;
    return ['scenarios'];
  },
  calculate(state) {
    const scenarios = (Array.isArray(state.scenarios) ? state.scenarios : defaultState.scenarios)
      .slice(0, 8)
      .map(calculateScenario);
    const maxYears = Math.max(...scenarios.map(scenario => Math.ceil(scenario.payoffYears)), 1);
    const yearLabels = Array.from({ length: maxYears + 1 }, (_, index) => `Y${index}`);
    const bestTotalCost = Math.min(...scenarios.map(scenario => scenario.totalCost));
    const lowestMonthlyPayment = Math.min(...scenarios.map(scenario => scenario.paymentWithExtra));

    return {
      kpis: {
        layout: 'mortgageComparison',
        scenarios,
        bestTotalCost,
        lowestMonthlyPayment
      },
      table: {
        title: 'Mortgage Scenario Comparison',
        rows: comparisonRows(scenarios),
        columns: [
          { key: 'name', label: 'Scenario', format: formatPlain },
          { key: 'homePrice', label: 'Home Price', format: euros.format },
          { key: 'downPayment', label: 'Down Payment', format: euros.format },
          { key: 'loanAmount', label: 'Loan Amount', format: euros.format },
          { key: 'rate', label: 'Rate', format: value => `${Number(value).toFixed(2)}%` },
          { key: 'monthlyPayment', label: 'Monthly Payment', format: eurosPrecise.format },
          { key: 'totalInterest', label: 'Total Interest', format: euros.format },
          { key: 'totalCost', label: 'Total Cost', format: euros.format },
          { key: 'payoffYears', label: 'Payoff', format: value => `${Number(value).toFixed(1)} yrs` }
        ]
      },
      charts: {
        primary: {
          title: 'Monthly Payment Breakdown',
          subtitle: 'Scheduled principal, extra principal, and interest in the first payment month',
          leftAxis: 'Monthly payment',
          rightAxis: '',
          stacked: true,
          tooltipFooter: stackedTotalFooter,
          labels: scenarios.map(scenario => scenario.name),
          datasets: [
            barDataset('Scheduled Principal', scenarios.map(scenario => scenario.firstMonthScheduledPrincipal), componentColors.scheduledPrincipal),
            barDataset('Extra Principal', scenarios.map(scenario => scenario.firstMonthExtraPrincipal), componentColors.extraPrincipal),
            barDataset('Interest Paid', scenarios.map(scenario => scenario.firstMonthInterest), componentColors.interest)
          ]
        },
        balance: {
          title: 'Remaining Balance',
          subtitle: 'Mortgage balance by year for each scenario',
          leftAxis: 'Remaining balance',
          rightAxis: '',
          labels: yearLabels,
          datasets: scenarios.map((scenario, index) => lineDataset(
            scenario.name,
            yearLabels.map((_, yearIndex) => yearIndex === 0 ? scenario.loanAmount : annualValue(scenario, yearIndex, 'remainingBalance')),
            doughnutPalette[index % doughnutPalette.length]
          ))
        },
        cost: {
          title: 'Final Cost Components',
          subtitle: 'Down payment, closing costs, principal, and interest by scenario',
          leftAxis: 'Total cost',
          rightAxis: '',
          stacked: true,
          tooltipFooter: stackedTotalFooter,
          labels: scenarios.map(scenario => scenario.name),
          datasets: [
            barDataset('Down Payment', scenarios.map(scenario => scenario.downPayment), componentColors.downPayment),
            barDataset('Closing Costs', scenarios.map(scenario => scenario.closingCosts), componentColors.closingCosts),
            barDataset('Principal Paid', scenarios.map(scenario => scenario.totalPrincipal), componentColors.principalPaid),
            barDataset('Interest Paid', scenarios.map(scenario => scenario.totalInterest), componentColors.interest)
          ]
        }
      }
    };
  }
};
