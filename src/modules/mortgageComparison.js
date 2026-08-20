import { amortizedPayment } from '../utils/amortization.js';
import { euros, eurosPrecise, formatPlain } from '../utils/format.js';
import { barDataset, lineDataset, doughnutPalette } from '../ui/chartDatasets.js';

const scenarioFields = [
  { id: 'name', label: 'Scenario name', type: 'text', desc: 'Short label used in result cards, charts, and table.' },
  { id: 'homePrice', label: 'Home price', min: 0, max: 2000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Purchase price of the home. Must be greater than zero.' },
  { id: 'downPayment', label: 'Down payment', min: 0, max: 1000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Cash paid upfront toward the home. Must be lower than the home price.' },
  { id: 'annualInterestRate', label: 'Interest rate', min: 0, max: 20, step: 0.1, suffix: '%', desc: 'Nominal annual mortgage interest rate. Zero-interest mortgages are allowed.' },
  { id: 'mortgageTermYears', label: 'Mortgage term', min: 1, max: 40, step: 1, suffix: 'yrs', desc: 'Planned repayment period.' },
  { id: 'closingCosts', label: 'Closing costs', min: 0, max: 100000, step: 500, prefix: 'EUR ', control: 'number', desc: 'One-time purchase or mortgage costs paid upfront. They do not reduce the loan balance.' },
  { id: 'extraMonthlyPayment', label: 'Extra monthly payment', min: 0, max: 10000, step: 50, prefix: 'EUR ', control: 'number', desc: 'Additional monthly amount paid directly toward principal.' },
  { id: 'propertyTaxRate', label: 'Property tax rate', min: 0, max: 5, step: 0.1, suffix: '%', advanced: true, desc: 'Annual property tax as a percentage of the home price.' },
  { id: 'annualInsurance', label: 'Annual insurance', min: 0, max: 20000, step: 100, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Estimated yearly homeowners insurance.' },
  { id: 'pmiRate', label: 'PMI rate', min: 0, max: 3, step: 0.1, suffix: '%', advanced: true, desc: 'Annual mortgage insurance rate. PMI stops once the balance is at or below 80% of the original home price.' },
  { id: 'monthlyHOA', label: 'Monthly HOA / service', min: 0, max: 3000, step: 25, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Monthly association, building service, or maintenance charge.' },
  { id: 'loanFees', label: 'Loan fees', min: 0, max: 100000, step: 500, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Origination or bank package fees paid upfront, separate from closing costs.' },
  { id: 'discountPointsRate', label: 'Discount points', min: 0, max: 10, step: 0.1, suffix: '%', advanced: true, desc: 'Upfront rate buy-down cost as a percentage of the loan amount. This does not change the entered interest rate.' },
  { id: 'prepaymentPenaltyRate', label: 'Exit penalty', min: 0, max: 10, step: 0.1, suffix: '%', advanced: true, desc: 'Penalty as a percentage of remaining mortgage balance at the comparison period.' }
];

const advancedControls = [
  { id: 'compareOverYears', label: 'Compare over', min: 1, max: 40, step: 1, suffix: 'yrs', advanced: true, inactiveValue: 0, desc: 'Shared holding period used to compare every scenario over the same amount of time.' }
];

const defaultScenarioValues = {
  propertyTaxRate: 1,
  annualInsurance: 1000,
  pmiRate: 0,
  monthlyHOA: 0,
  loanFees: 0,
  discountPointsRate: 0,
  prepaymentPenaltyRate: 0
};

const defaultState = {
  compareOverYears: 7,
  scenarios: [
    {
      id: 'scenario-1',
      name: 'Scenario 1',
      homePrice: 200000,
      downPayment: 50000,
      annualInterestRate: 5,
      mortgageTermYears: 30,
      closingCosts: 0,
      extraMonthlyPayment: 0,
      ...defaultScenarioValues
    },
    {
      id: 'scenario-2',
      name: 'Scenario 2',
      homePrice: 250000,
      downPayment: 50000,
      annualInterestRate: 5.5,
      mortgageTermYears: 30,
      closingCosts: 0,
      extraMonthlyPayment: 0,
      ...defaultScenarioValues
    }
  ]
};

const componentColors = {
  scheduledPrincipal: '#2563eb',
  extraPrincipal: '#7c3aed',
  interest: '#f97316',
  downPayment: '#0891b2',
  closingCosts: '#db2777',
  loanFees: '#eab308',
  pointsCost: '#a855f7',
  ownershipCosts: '#14b8a6',
  pmi: '#f43f5e',
  principalPaid: '#16a34a',
  exitPenalty: '#64748b'
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

function numberWithFallback(value, fallback = 0) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? number : fallback;
}

function nonNegativeNumber(value, fallback = 0) {
  return Math.max(0, numberWithFallback(value, fallback));
}

function sanitizeScenario(scenario, index) {
  const base = createMortgageComparisonScenario(index);
  const next = { ...base, ...scenario };
  next.name = String(next.name ?? `Scenario ${index + 1}`).trim() || `Scenario ${index + 1}`;
  next.homePrice = nonNegativeNumber(next.homePrice, base.homePrice);
  next.downPayment = nonNegativeNumber(next.downPayment, base.downPayment);
  next.annualInterestRate = nonNegativeNumber(next.annualInterestRate, base.annualInterestRate);
  next.mortgageTermYears = Math.max(1, Math.round(nonNegativeNumber(next.mortgageTermYears, base.mortgageTermYears)));
  next.closingCosts = nonNegativeNumber(next.closingCosts, base.closingCosts);
  next.extraMonthlyPayment = nonNegativeNumber(next.extraMonthlyPayment, base.extraMonthlyPayment);
  next.propertyTaxRate = nonNegativeNumber(next.propertyTaxRate, base.propertyTaxRate);
  next.annualInsurance = nonNegativeNumber(next.annualInsurance, base.annualInsurance);
  next.pmiRate = nonNegativeNumber(next.pmiRate, base.pmiRate);
  next.monthlyHOA = nonNegativeNumber(next.monthlyHOA, base.monthlyHOA);
  next.loanFees = nonNegativeNumber(next.loanFees, base.loanFees);
  next.discountPointsRate = nonNegativeNumber(next.discountPointsRate, base.discountPointsRate);
  next.prepaymentPenaltyRate = nonNegativeNumber(next.prepaymentPenaltyRate, base.prepaymentPenaltyRate);
  return next;
}

function scenarioValidationMessages(scenario) {
  const fields = {};
  const warnings = {};

  if (scenario.homePrice <= 0) {
    fields.homePrice = 'Home price must be greater than zero.';
  }

  if (scenario.downPayment >= scenario.homePrice) {
    fields.downPayment = 'Down payment must be lower than the home price.';
  }

  if (scenario.pmiRate > 0 && scenario.homePrice > 0 && scenario.downPayment / scenario.homePrice >= 0.2) {
    warnings.pmiRate = 'PMI may not be required because the down payment is at least 20%.';
  }

  return { fields, warnings };
}

function sanitizeCompareOverYears(value, fallback = 0) {
  const meta = advancedControls.find(control => control.id === 'compareOverYears');
  if (Number(value) === 0) return 0;
  const nextValue = nonNegativeNumber(value, fallback);
  if (nextValue === 0) return 0;
  return Math.min(meta.max, Math.max(meta.min, Math.round(nextValue)));
}

function safeScenarioForCalculation(scenario) {
  const homePrice = scenario.homePrice > 0 ? scenario.homePrice : 1;
  const maxDownPayment = Math.max(0, homePrice - 0.01);
  return {
    ...scenario,
    homePrice,
    downPayment: Math.min(scenario.downPayment, maxDownPayment)
  };
}

function calculateScenario(scenario, index, options = {}) {
  const input = safeScenarioForCalculation(sanitizeScenario(scenario, index));
  const loanAmount = input.homePrice - input.downPayment;
  const termMonths = Math.max(1, Math.round(input.mortgageTermYears * 12));
  const monthlyInterestRate = input.annualInterestRate / 100 / 12;
  const compareOverYears = nonNegativeNumber(options.compareOverYears);
  const holdingPeriodMonths = compareOverYears > 0
    ? Math.min(termMonths, Math.max(1, Math.round(compareOverYears * 12)))
    : 0;
  const monthlyMortgagePayment = amortizedPayment({
    principal: loanAmount,
    periodicRate: monthlyInterestRate,
    periods: termMonths
  });
  const annualPropertyTax = input.homePrice * input.propertyTaxRate / 100;
  const monthlyPropertyTax = annualPropertyTax / 12;
  const monthlyInsurance = input.annualInsurance / 12;
  const initialMonthlyPmi = loanAmount * input.pmiRate / 100 / 12;
  const pmiStopBalance = input.homePrice * 0.8;
  const discountPointsCost = loanAmount * input.discountPointsRate / 100;
  const cashAtClosing = input.downPayment + input.closingCosts + input.loanFees + discountPointsCost;
  const monthly = [];
  const annual = [];
  let balance = loanAmount;
  let payoffMonths = termMonths;
  let payoffRecorded = false;
  let cumulativeCashOutflow = cashAtClosing;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalMortgagePayments = 0;
  let totalPropertyTaxPaid = 0;
  let totalInsurancePaid = 0;
  let totalPmiPaid = 0;
  let totalHoaPaid = 0;
  let firstMonth = null;

  for (let month = 1; month <= termMonths; month++) {
    const mortgageActive = balance > 0.005;
    const interest = mortgageActive ? balance * monthlyInterestRate : 0;
    const scheduledPrincipal = mortgageActive
      ? Math.min(balance, Math.max(0, monthlyMortgagePayment - interest))
      : 0;
    const extraPrincipal = mortgageActive
      ? Math.min(Math.max(0, balance - scheduledPrincipal), input.extraMonthlyPayment)
      : 0;
    const principalPayment = scheduledPrincipal + extraPrincipal;
    const mortgagePayment = interest + principalPayment;
    const pmi = mortgageActive && balance > pmiStopBalance ? initialMonthlyPmi : 0;
    const monthlyHousingOutflow = mortgagePayment + monthlyPropertyTax + monthlyInsurance + pmi + input.monthlyHOA;

    balance = Math.max(0, balance - principalPayment);
    totalPrincipalPaid += principalPayment;
    totalInterestPaid += interest;
    totalMortgagePayments += mortgagePayment;
    totalPropertyTaxPaid += monthlyPropertyTax;
    totalInsurancePaid += monthlyInsurance;
    totalPmiPaid += pmi;
    totalHoaPaid += input.monthlyHOA;
    cumulativeCashOutflow += monthlyHousingOutflow;

    if (!payoffRecorded && balance <= 0.005) {
      payoffMonths = month;
      payoffRecorded = true;
    }

    const row = {
      month,
      year: Math.ceil(month / 12),
      interest,
      scheduledPrincipal,
      extraPrincipal,
      principalPayment,
      mortgagePayment,
      propertyTax: monthlyPropertyTax,
      insurance: monthlyInsurance,
      pmi,
      hoa: input.monthlyHOA,
      monthlyHousingOutflow,
      remainingBalance: balance,
      totalPrincipalPaid,
      totalInterestPaid,
      totalMortgagePayments,
      propertyTaxPaid: totalPropertyTaxPaid,
      insurancePaid: totalInsurancePaid,
      pmiPaid: totalPmiPaid,
      hoaPaid: totalHoaPaid,
      cumulativeCashOutflow
    };

    if (!firstMonth) firstMonth = row;
    monthly.push(row);

    if (month % 12 === 0 || month === termMonths) {
      annual.push({
        year: Math.ceil(month / 12),
        remainingBalance: balance,
        totalPrincipal: totalPrincipalPaid,
        totalInterest: totalInterestPaid,
        totalPaid: cumulativeCashOutflow
      });
    }
  }

  const holdingSnapshot = holdingPeriodMonths > 0 ? monthly[holdingPeriodMonths - 1] : null;
  const remainingBalanceAtHoldingPeriod = holdingSnapshot?.remainingBalance ?? 0;
  const exitPenaltyAtHoldingPeriod = holdingSnapshot
    ? remainingBalanceAtHoldingPeriod * input.prepaymentPenaltyRate / 100
    : 0;
  const initialMonthlyHousingCost = (firstMonth?.monthlyHousingOutflow ?? 0);

  return {
    ...input,
    index,
    loanAmount,
    termMonths,
    monthlyInterestRate,
    monthlyMortgagePayment,
    initialMonthlyHousingCost,
    monthlyHousingCostAtHoldingPeriod: holdingSnapshot?.monthlyHousingOutflow ?? 0,
    cashAtClosing,
    discountPointsCost,
    pointsCost: discountPointsCost,
    annualPropertyTax,
    monthlyPropertyTax,
    monthlyInsurance,
    initialMonthlyPmi: firstMonth?.pmi ?? 0,
    payoffMonths,
    payoffYears: payoffMonths / 12,
    lifetimeInterest: totalInterestPaid,
    lifetimeMortgagePayments: totalMortgagePayments,
    totalPrincipal: totalPrincipalPaid,
    totalInterest: totalInterestPaid,
    totalOwnershipCosts: totalPropertyTaxPaid + totalInsurancePaid + totalPmiPaid + totalHoaPaid,
    remainingBalanceAtHoldingPeriod,
    principalPaidAtHoldingPeriod: holdingSnapshot?.totalPrincipalPaid ?? 0,
    interestPaidAtHoldingPeriod: holdingSnapshot?.totalInterestPaid ?? 0,
    mortgagePaymentsAtHoldingPeriod: holdingSnapshot?.totalMortgagePayments ?? 0,
    propertyTaxPaidAtHoldingPeriod: holdingSnapshot?.propertyTaxPaid ?? 0,
    insurancePaidAtHoldingPeriod: holdingSnapshot?.insurancePaid ?? 0,
    pmiPaidAtHoldingPeriod: holdingSnapshot?.pmiPaid ?? 0,
    hoaPaidAtHoldingPeriod: holdingSnapshot?.hoaPaid ?? 0,
    exitPenaltyAtHoldingPeriod,
    cashOutflowAtHoldingPeriod: holdingSnapshot
      ? holdingSnapshot.cumulativeCashOutflow + exitPenaltyAtHoldingPeriod
      : 0,
    firstMonthScheduledPrincipal: firstMonth?.scheduledPrincipal ?? 0,
    firstMonthExtraPrincipal: firstMonth?.extraPrincipal ?? 0,
    firstMonthInterest: firstMonth?.interest ?? 0,
    firstMonthPrincipal: firstMonth?.principalPayment ?? 0,
    firstMonthPayment: firstMonth?.mortgagePayment ?? 0,
    firstMonthOwnershipCosts: firstMonth
      ? firstMonth.propertyTax + firstMonth.insurance + firstMonth.pmi + firstMonth.hoa
      : 0,
    monthlyPayment: monthlyMortgagePayment,
    paymentWithExtra: initialMonthlyHousingCost,
    totalCost: cashAtClosing + totalMortgagePayments + totalPropertyTaxPaid + totalInsurancePaid + totalPmiPaid + totalHoaPaid,
    monthly,
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
    monthlyMortgagePayment: scenario.monthlyMortgagePayment,
    initialMonthlyHousingCost: scenario.initialMonthlyHousingCost,
    cashAtClosing: scenario.cashAtClosing,
    cashOutflowAtHoldingPeriod: scenario.cashOutflowAtHoldingPeriod,
    remainingBalanceAtHoldingPeriod: scenario.remainingBalanceAtHoldingPeriod,
    principalPaidAtHoldingPeriod: scenario.principalPaidAtHoldingPeriod,
    interestPaidAtHoldingPeriod: scenario.interestPaidAtHoldingPeriod,
    lifetimeInterest: scenario.lifetimeInterest,
    payoffYears: scenario.payoffYears
  }));
}

function lowestBy(scenarios, key) {
  return scenarios.reduce((best, scenario) => (
    scenario[key] < best[key] ? scenario : best
  ), scenarios[0]);
}

function comparisonDifference(scenarios, key) {
  if (scenarios.length < 2) return 0;
  const sorted = [...scenarios].sort((a, b) => a[key] - b[key]);
  return sorted[1][key] - sorted[0][key];
}

function buildComparisonInsight({ scenarios, compareOverYears, primaryWinner, lowestCashAtClosing }) {
  if (!compareOverYears || !primaryWinner) return '';

  const cashOutflowDifference = comparisonDifference(scenarios, 'cashOutflowAtHoldingPeriod');
  const cashAtClosingDifference = Math.abs(primaryWinner.cashAtClosing - lowestCashAtClosing.cashAtClosing);
  const parts = [
    `${primaryWinner.name} has the lowest ${compareOverYears}-year cash outflow by ${euros.format(cashOutflowDifference)}.`
  ];

  if (lowestCashAtClosing.index !== primaryWinner.index && cashAtClosingDifference > 0.005) {
    parts.push(`${lowestCashAtClosing.name} requires ${euros.format(cashAtClosingDifference)} less cash upfront.`);
  }

  return parts.join(' ');
}

function findBreakEven(scenarios) {
  const maxMonth = Math.max(...scenarios.map(scenario => scenario.monthly.at(-1)?.month || 0), 0);
  if (!maxMonth) return null;

  let previousLeader = lowestCashOutflowScenarioAtMonth(scenarios, 0);
  for (let month = 1; month <= maxMonth; month++) {
    const leader = lowestCashOutflowScenarioAtMonth(scenarios, month);
    if (leader.index !== previousLeader.index) {
      return {
        month,
        from: previousLeader.name,
        to: leader.name,
        label: `${leader.name} becomes cheaper than ${previousLeader.name} around year ${(month / 12).toFixed(1)}.`
      };
    }
    previousLeader = leader;
  }

  return null;
}

function lowestCashOutflowScenarioAtMonth(scenarios, month) {
  return scenarios.reduce((best, scenario) => {
    const cost = cumulativeCashOutflowAtMonth(scenario, month);
    const bestCost = cumulativeCashOutflowAtMonth(best, month);
    return cost < bestCost ? scenario : best;
  }, scenarios[0]);
}

function cumulativeCashOutflowAtMonth(scenario, month) {
  if (month <= 0) return scenario.cashAtClosing;
  const row = scenario.monthly[Math.min(month, scenario.monthly.length) - 1] || scenario.monthly.at(-1);
  return row?.cumulativeCashOutflow ?? scenario.cashAtClosing;
}

function stackedTotalFooter(items) {
  const total = items.reduce((sum, item) => sum + Number(item.parsed?.y || 0), 0);
  return `Total: ${eurosPrecise.format(total)}`;
}

function buildCostDatasets(scenarios) {
  const datasets = [
    barDataset('Down Payment', scenarios.map(scenario => scenario.downPayment), componentColors.downPayment),
    barDataset('Principal Paid', scenarios.map(scenario => scenario.principalPaidAtHoldingPeriod), componentColors.principalPaid),
    barDataset('Interest Paid', scenarios.map(scenario => scenario.interestPaidAtHoldingPeriod), componentColors.interest),
    barDataset('Closing Costs', scenarios.map(scenario => scenario.closingCosts), componentColors.closingCosts)
  ];

  const optionalDatasets = [
    ['Loan Fees', 'loanFees', componentColors.loanFees],
    ['Discount Points', 'discountPointsCost', componentColors.pointsCost],
    ['Property Tax', 'propertyTaxPaidAtHoldingPeriod', componentColors.ownershipCosts],
    ['Insurance', 'insurancePaidAtHoldingPeriod', '#0ea5e9'],
    ['PMI', 'pmiPaidAtHoldingPeriod', componentColors.pmi],
    ['HOA / Service', 'hoaPaidAtHoldingPeriod', '#84cc16'],
    ['Exit Penalty', 'exitPenaltyAtHoldingPeriod', componentColors.exitPenalty]
  ];

  optionalDatasets.forEach(([label, key, color]) => {
    if (scenarios.some(scenario => scenario[key] > 0)) {
      datasets.push(barDataset(label, scenarios.map(scenario => scenario[key]), color));
    }
  });

  return datasets;
}

export const mortgageComparisonModule = {
  id: 'mortgage-comparison',
  navLabel: 'Mortgage Compare',
  eyebrow: 'Financial Tools',
  title: 'Mortgage Comparison',
  defaultState,
  controls: [],
  advancedControls,
  comparisonModule: true,
  scenarioFields,
  advancedTableColumnKeys: [
    'initialMonthlyHousingCost',
    'cashAtClosing',
    'cashOutflowAtHoldingPeriod',
    'remainingBalanceAtHoldingPeriod',
    'principalPaidAtHoldingPeriod',
    'interestPaidAtHoldingPeriod'
  ],
  chartTabs: {
    primary: 'Payment',
    balance: 'Balance',
    cost: 'Cash'
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

    const minMortgageTermYears = Math.min(...nextScenarios.map(scenario => scenario.mortgageTermYears));
    const requestedCompareOverYears = sanitizeCompareOverYears(state.compareOverYears, defaultState.compareOverYears);
    const validation = { global: {}, scenarios: [] };

    state.compareOverYears = requestedCompareOverYears;
    if (requestedCompareOverYears > minMortgageTermYears) {
      state.compareOverYears = minMortgageTermYears;
      validation.global.compareOverYears = 'Comparison period cannot exceed the shortest mortgage term.';
    }

    state.scenarios = nextScenarios.map((scenario, index) => {
      const messages = scenarioValidationMessages(scenario);
      validation.scenarios[index] = messages;
      return {
        ...scenario,
        _validation: messages
      };
    });
    state._validation = validation;
    return ['compareOverYears', 'scenarios'];
  },
  calculate(state) {
    const rawScenarios = (Array.isArray(state.scenarios) ? state.scenarios : defaultState.scenarios).slice(0, 8);
    const minMortgageTermYears = Math.min(...rawScenarios.map((scenario, index) => sanitizeScenario(scenario, index).mortgageTermYears));
    const compareOverYears = Math.min(sanitizeCompareOverYears(state.compareOverYears), minMortgageTermYears);
    const scenarios = rawScenarios.map((scenario, index) => calculateScenario(scenario, index, { compareOverYears }));
    const maxYears = Math.max(...scenarios.map(scenario => Math.ceil(scenario.payoffYears)), 1);
    const yearLabels = Array.from({ length: maxYears + 1 }, (_, index) => `Y${index}`);
    const primaryWinner = compareOverYears > 0 ? lowestBy(scenarios, 'cashOutflowAtHoldingPeriod') : lowestBy(scenarios, 'lifetimeInterest');
    const lowestCashAtClosing = lowestBy(scenarios, 'cashAtClosing');
    const lowestMonthlyMortgagePayment = lowestBy(scenarios, 'monthlyMortgagePayment');
    const lowestInitialMonthlyHousingCost = lowestBy(scenarios, 'initialMonthlyHousingCost');
    const hasAdvancedCosts = scenarios.some(scenario => (
      scenario.propertyTaxRate > 0
      || scenario.annualInsurance > 0
      || scenario.pmiRate > 0
      || scenario.monthlyHOA > 0
      || scenario.loanFees > 0
      || scenario.discountPointsCost > 0
      || scenario.exitPenaltyAtHoldingPeriod > 0
      || compareOverYears > 0
    ));

    return {
      kpis: {
        layout: 'mortgageComparison',
        scenarios,
        compareOverYears,
        primaryWinner,
        bestTotalCost: compareOverYears > 0 ? primaryWinner.cashOutflowAtHoldingPeriod : primaryWinner.lifetimeInterest,
        lowestMonthlyPayment: lowestMonthlyMortgagePayment.monthlyMortgagePayment,
        lowestMonthlyMortgagePayment: lowestMonthlyMortgagePayment.monthlyMortgagePayment,
        lowestInitialMonthlyHousingCost: lowestInitialMonthlyHousingCost.initialMonthlyHousingCost,
        holdingInsight: buildComparisonInsight({ scenarios, compareOverYears, primaryWinner, lowestCashAtClosing }),
        breakEven: findBreakEven(scenarios),
        hasAdvancedCosts,
        deltas: {
          cashOutflowDifference: comparisonDifference(scenarios, 'cashOutflowAtHoldingPeriod'),
          cashAtClosingDifference: comparisonDifference(scenarios, 'cashAtClosing'),
          monthlyMortgagePaymentDifference: comparisonDifference(scenarios, 'monthlyMortgagePayment'),
          initialMonthlyHousingCostDifference: comparisonDifference(scenarios, 'initialMonthlyHousingCost'),
          remainingBalanceDifference: comparisonDifference(scenarios, 'remainingBalanceAtHoldingPeriod'),
          lifetimeInterestDifference: comparisonDifference(scenarios, 'lifetimeInterest')
        }
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
          { key: 'monthlyMortgagePayment', label: 'Monthly Mortgage Payment', format: eurosPrecise.format },
          { key: 'initialMonthlyHousingCost', label: 'Initial Monthly Housing Cost', format: eurosPrecise.format },
          { key: 'cashAtClosing', label: 'Cash at Closing', format: euros.format },
          { key: 'cashOutflowAtHoldingPeriod', label: compareOverYears ? `${compareOverYears}Y Cash Outflow` : 'Holding Cash Outflow', format: euros.format },
          { key: 'remainingBalanceAtHoldingPeriod', label: compareOverYears ? `Balance After ${compareOverYears}Y` : 'Remaining Balance', format: euros.format },
          { key: 'principalPaidAtHoldingPeriod', label: compareOverYears ? `Principal Paid After ${compareOverYears}Y` : 'Principal Paid', format: euros.format },
          { key: 'interestPaidAtHoldingPeriod', label: compareOverYears ? `Interest Paid After ${compareOverYears}Y` : 'Interest Paid', format: euros.format },
          { key: 'lifetimeInterest', label: 'Lifetime Interest', format: euros.format },
          { key: 'payoffYears', label: 'Mortgage Payoff Time', format: value => `${Number(value).toFixed(1)} yrs` }
        ]
      },
      charts: {
        primary: {
          title: 'Initial Monthly Housing Cost',
          subtitle: 'Scheduled mortgage payment, extra principal, and ownership costs in month one',
          leftAxis: 'Monthly cash requirement',
          rightAxis: '',
          stacked: true,
          tooltipFooter: stackedTotalFooter,
          labels: scenarios.map(scenario => scenario.name),
          datasets: [
            barDataset('Scheduled Principal', scenarios.map(scenario => scenario.firstMonthScheduledPrincipal), componentColors.scheduledPrincipal),
            barDataset('Extra Principal', scenarios.map(scenario => scenario.firstMonthExtraPrincipal), componentColors.extraPrincipal),
            barDataset('Interest Paid', scenarios.map(scenario => scenario.firstMonthInterest), componentColors.interest),
            ...(scenarios.some(scenario => scenario.firstMonthOwnershipCosts > 0)
              ? [barDataset('Ownership Costs', scenarios.map(scenario => scenario.firstMonthOwnershipCosts), componentColors.ownershipCosts)]
              : [])
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
          title: compareOverYears ? `${compareOverYears}-Year Cash Outflow Breakdown` : 'Cash Outflow Breakdown',
          subtitle: 'Equity-building cash is separated from financing and ownership costs',
          leftAxis: 'Cash outflow',
          rightAxis: '',
          stacked: true,
          tooltipFooter: stackedTotalFooter,
          labels: scenarios.map(scenario => scenario.name),
          datasets: buildCostDatasets(scenarios)
        }
      }
    };
  }
};
