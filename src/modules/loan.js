import { euros, eurosPrecise, formatPlain } from '../utils/format.js';
import { amortizedPayment } from '../utils/amortization.js';
import { realValueLabel } from '../utils/inflation.js';
import { barDataset, lineDataset } from '../ui/chartDatasets.js';

const defaultState = {
  loanAmount: 100000,
  annualInterestRate: 5.5,
  loanTermYears: 20,
  paymentFrequency: 'monthly',
  extraPayment: 0,
  upfrontFees: 0,
  recurringFee: 0,
  balloonPayment: 0,
  annualInflationRate: 2.5
};

const controls = [
  { id: 'loanAmount', label: 'Loan amount', min: 0, max: 1000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Amount borrowed before fees, interest, or repayments.' },
  { id: 'annualInterestRate', label: 'Annual interest rate', min: 0, max: 25, step: 0.1, suffix: '%', desc: 'Nominal annual interest rate charged on the remaining balance.' },
  { id: 'loanTermYears', label: 'Loan term', min: 1, max: 40, step: 1, suffix: 'yrs', desc: 'Planned repayment period.' },
  { id: 'paymentFrequency', label: 'Payment frequency', type: 'select', options: [['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Semi-annually'], ['annual', 'Annually']], desc: 'How often regular loan payments are made.' },
  { id: 'extraPayment', label: 'Extra payment', min: 0, max: 10000, step: 50, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Additional amount paid on top of the required payment each period.' },
  { id: 'upfrontFees', label: 'Upfront fees', min: 0, max: 50000, step: 100, prefix: 'EUR ', control: 'number', advanced: true, desc: 'One-time fees paid at the start. They count toward total cost, not loan balance.' },
  { id: 'recurringFee', label: 'Recurring fee', min: 0, max: 1000, step: 10, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Fee paid each payment period, such as an account or service fee.' },
  { id: 'balloonPayment', label: 'Balloon payment', min: 0, max: 500000, step: 1000, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Remaining balance intentionally paid at the end of the term.' },
  { id: 'annualInflationRate', label: 'Annual inflation rate', min: 0, max: 10, step: 0.1, suffix: '%', advanced: true, desc: 'Average inflation used to show future payments in today\'s purchasing power.' }
];

const paymentsPerYear = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1
};

function amortize(state) {
  const frequency = paymentsPerYear[state.paymentFrequency] || 12;
  const plannedPeriods = Math.max(1, Math.round(state.loanTermYears * frequency));
  const periodicRate = state.annualInterestRate / 100 / frequency;
  const scheduledPayment = amortizedPayment({
    principal: state.loanAmount,
    periodicRate,
    periods: plannedPeriods,
    futureValue: state.balloonPayment
  });
  const totalRegularPayment = scheduledPayment + state.extraPayment;
  let balance = state.loanAmount;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalFees = state.upfrontFees;
  let totalPaid = state.upfrontFees;
  let payoffPeriod = plannedPeriods;
  const periodRows = [];
  const annual = [];

  for (let period = 1; period <= plannedPeriods && balance > 0.005; period++) {
    const startingBalance = balance;
    const interest = startingBalance * periodicRate;
    const targetEndingBalance = period === plannedPeriods ? 0 : state.balloonPayment;
    const maxPrincipalThisPeriod = Math.max(0, startingBalance + interest - targetEndingBalance);
    const principalPayment = Math.min(maxPrincipalThisPeriod, totalRegularPayment);
    const isFinalScheduledPeriod = period === plannedPeriods;
    const balloonPaid = isFinalScheduledPeriod ? Math.min(state.balloonPayment, Math.max(0, startingBalance + interest - principalPayment)) : 0;
    const endingBalance = Math.max(0, startingBalance + interest - principalPayment - balloonPaid);
    const fee = state.recurringFee;
    const periodTotalPaid = principalPayment + interest + balloonPaid + fee;

    balance = endingBalance;
    totalPrincipal += principalPayment + balloonPaid;
    totalInterest += interest;
    totalFees += fee;
    totalPaid += periodTotalPaid;
    payoffPeriod = period;

    const row = {
      period,
      year: Math.ceil(period / frequency),
      startingBalance,
      payment: principalPayment + interest,
      extraPayment: Math.min(state.extraPayment, principalPayment),
      interest,
      principal: principalPayment + balloonPaid,
      fees: fee,
      balloonPaid,
      endingBalance,
      totalPaid,
      totalInterest
    };

    periodRows.push(row);

    if (period % frequency === 0 || endingBalance <= 0.005) {
      annual.push({
        year: Math.ceil(period / frequency),
        endingBalance,
        totalPrincipal,
        totalInterest,
        totalFees,
        totalPaid
      });
    }
  }

  return {
    frequency,
    plannedPeriods,
    scheduledPayment,
    totalRegularPayment,
    totalPrincipal,
    totalInterest,
    totalFees,
    totalPaid,
    payoffPeriod,
    payoffYears: payoffPeriod / frequency,
    periodRows,
    annual
  };
}

export const loanModule = {
  id: 'loan',
  navLabel: 'Loan',
  eyebrow: 'Financial Tools',
  title: 'Loan Payment & Amortization',
  defaultState,
  controls,
  chartTabs: {
    primary: 'Balance',
    secondary: 'Cost'
  },
  calculate(state) {
    const result = amortize(state);
    const paymentLabel = state.paymentFrequency === 'monthly'
      ? 'Monthly Payment'
      : `${state.paymentFrequency.charAt(0).toUpperCase()}${state.paymentFrequency.slice(1)} Payment`;
    const realPaymentYear = Math.min(15, Math.max(1, result.payoffYears));
    const realPaymentSubvalue = `Year ${realPaymentYear.toFixed(realPaymentYear % 1 ? 1 : 0)}: ${realValueLabel(result.scheduledPayment, state.annualInflationRate, realPaymentYear, eurosPrecise).replace('Today: ', '')} today`;

    return {
      kpis: [
        { label: paymentLabel, value: eurosPrecise.format(result.scheduledPayment), subvalue: realPaymentSubvalue, desc: 'Required scheduled payment before extra payment and fees. The secondary value shows its future purchasing-power feel.' },
        { label: 'Payment With Extra', value: eurosPrecise.format(result.totalRegularPayment), desc: 'Scheduled payment plus optional extra principal payment.' },
        { label: 'Total Interest', value: euros.format(result.totalInterest), desc: 'Total interest paid over the loan.' },
        { label: 'Total Cost', value: euros.format(result.totalPaid), desc: 'Principal, interest, fees, and any balloon payment.' },
        { label: 'Payoff Time', value: `${result.payoffYears.toFixed(1)} yrs`, desc: 'Estimated time until the loan balance reaches zero.' }
      ],
      table: {
        title: 'Amortization Schedule',
        rows: result.periodRows,
        columns: [
          { key: 'period', label: 'Period', format: formatPlain },
          { key: 'startingBalance', label: 'Starting Balance', format: euros.format },
          { key: 'payment', label: 'Payment', format: euros.format },
          { key: 'interest', label: 'Interest', format: euros.format },
          { key: 'principal', label: 'Principal', format: euros.format },
          { key: 'fees', label: 'Fees', format: euros.format },
          { key: 'endingBalance', label: 'Ending Balance', format: euros.format }
        ]
      },
      charts: {
        primary: {
          title: 'Balance, Principal & Interest',
          subtitle: 'Remaining balance compared with cumulative principal and interest',
          leftAxis: 'Amount',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            lineDataset('Remaining Balance', result.annual.map(row => row.endingBalance), 'balance'),
            lineDataset('Principal Paid', result.annual.map(row => row.totalPrincipal), 'principal'),
            lineDataset('Interest Paid', result.annual.map(row => row.totalInterest), 'interest')
          ]
        },
        secondary: {
          title: 'Loan Cost Breakdown',
          subtitle: 'Cumulative principal, interest, and fees',
          leftAxis: 'Amount paid',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            barDataset('Principal Paid', result.annual.map(row => row.totalPrincipal), 'principalBar', { borderColorKey: 'principal' }),
            barDataset('Interest Paid', result.annual.map(row => row.totalInterest), 'interestBar', { borderColorKey: 'interest' }),
            barDataset('Fees Paid', result.annual.map(row => row.totalFees), 'costBar', { borderColorKey: 'cost' })
          ]
        }
      }
    };
  }
};
