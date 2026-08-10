import { eurosPrecise, formatPlain } from '../utils/format.js';
import { calculateRentVsBuy } from '../utils/rentVsBuy.js';
import { barDataset, lineDataset } from '../ui/chartDatasets.js';

const defaultState = {
  monthlyRent: 1200,
  annualRentIncreasePct: 3,
  comparisonYears: 10,
  propertyPrice: 300000,
  downPayment: 60000,
  mortgageInterestRatePct: 5,
  mortgageTermYears: 30,
  annualPropertyAppreciationPct: 3,
  annualMaintenanceCostPct: 1,
  buyingCosts: 9000,
  sellingCostsPct: 3,
  saleProfitTaxPct: 0,
  monthlyPropertyTax: 0,
  monthlyInsurance: 0
};

const controls = [
  { id: 'monthlyRent', label: 'Monthly rent', min: 0, max: 10000, step: 50, prefix: 'EUR ', control: 'number', desc: 'Current monthly rent.' },
  { id: 'annualRentIncreasePct', label: 'Rent increase', min: 0, max: 15, step: 0.1, suffix: '%', desc: 'How much rent is expected to rise each year.' },
  { id: 'comparisonYears', label: 'Compare over', min: 1, max: 50, step: 1, suffix: 'yrs', desc: 'How many years you want to compare renting and buying.' },
  { id: 'propertyPrice', label: 'Home price', min: 0, max: 2000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Estimated purchase price of the home.' },
  { id: 'downPayment', label: 'Down payment', min: 0, max: 1000000, step: 1000, prefix: 'EUR ', control: 'number', desc: 'Cash paid upfront toward the home.' },
  { id: 'mortgageInterestRatePct', label: 'Mortgage rate', min: 0, max: 20, step: 0.1, suffix: '%', desc: 'Annual mortgage interest rate.' },
  { id: 'mortgageTermYears', label: 'Mortgage length', min: 1, max: 40, step: 1, suffix: 'yrs', desc: 'How long the mortgage lasts.' },
  { id: 'annualPropertyAppreciationPct', label: 'Home value growth', min: -10, max: 15, step: 0.1, suffix: '%', advanced: true, desc: 'How much the home value may rise or fall each year.' },
  { id: 'annualMaintenanceCostPct', label: 'Maintenance cost', min: 0, max: 10, step: 0.1, suffix: '%', advanced: true, desc: 'Estimated yearly maintenance as a percent of the home price.' },
  { id: 'buyingCosts', label: 'Buying costs', min: 0, max: 100000, step: 500, prefix: 'EUR ', control: 'number', advanced: true, desc: 'One-time purchase costs such as fees, inspections, or legal costs.' },
  { id: 'sellingCostsPct', label: 'Selling costs', min: 0, max: 12, step: 0.1, suffix: '%', advanced: true, desc: 'Estimated selling costs as a percent of the future home value.' },
  { id: 'saleProfitTaxPct', label: 'Tax on sale profit', min: 0, max: 40, step: 0.1, suffix: '%', advanced: true, desc: 'Optional tax on the gain when selling. Example: buy at 100k, sell at 150k, tax applies to 50k.' },
  { id: 'monthlyPropertyTax', label: 'Monthly property tax', min: 0, max: 5000, step: 25, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Optional monthly property tax estimate.' },
  { id: 'monthlyInsurance', label: 'Monthly insurance', min: 0, max: 3000, step: 25, prefix: 'EUR ', control: 'number', advanced: true, desc: 'Optional monthly home insurance estimate.' }
];

function resultLabel(result) {
  if (result.winner === 'even') return 'Very close';
  const amount = eurosPrecise.format(Math.abs(result.difference));
  return result.winner === 'buying' ? `Buying is ahead by ${amount}` : `Renting is ahead by ${amount}`;
}

function resultDescription(result) {
  if (result.winner === 'even') {
    return 'Based on these assumptions, renting and buying are almost equal.';
  }

  return result.winner === 'buying'
    ? 'Buying has the lower net cost after counting estimated home equity.'
    : 'Renting has the lower total cost over this period.';
}

function resultExplanation(result, state) {
  const rent = eurosPrecise.format(result.totalRentPaid);
  const buy = eurosPrecise.format(result.netCostOfBuying);
  const equity = eurosPrecise.format(result.netEquityAfterSelling);
  const saleTax = eurosPrecise.format(result.saleProfitTax);
  const difference = eurosPrecise.format(Math.abs(result.difference));

  const common = `Over ${state.comparisonYears} years, renting costs ${rent}. Buying has a net cost of ${buy} after subtracting estimated net equity of ${equity}. Sale profit tax is included as ${saleTax}.`;

  if (result.winner === 'even') {
    return `${common} The two options are very close with these inputs. This does not mean one is always better; it only reflects these assumptions.`;
  }

  return result.winner === 'buying'
    ? `${common} Buying is ahead by ${difference} because the estimated equity offsets enough of the buying costs.`
    : `${common} Renting is ahead by ${difference} because the buying costs are not fully offset by estimated equity in this time period.`;
}

export const rentVsBuyModule = {
  id: 'rent-vs-buy',
  navLabel: 'Rent vs Buy',
  eyebrow: 'Financial Tools',
  title: 'Rent vs Buy Calculator',
  defaultState,
  controls,
  chartTabs: {
    primary: 'Cost',
    secondary: 'Home Value'
  },
  validateState(state) {
    const changed = [];

    if (state.downPayment > state.propertyPrice) {
      state.downPayment = state.propertyPrice;
      changed.push('downPayment');
    }

    if (state.comparisonYears < 1) {
      state.comparisonYears = 1;
      changed.push('comparisonYears');
    }

    if (state.mortgageTermYears < 1) {
      state.mortgageTermYears = 1;
      changed.push('mortgageTermYears');
    }

    if (state.monthlyRent < 0) {
      state.monthlyRent = 0;
      changed.push('monthlyRent');
    }

    return changed;
  },
  calculate(state) {
    const result = calculateRentVsBuy(state);
    const finalAnnualRow = result.annual.at(-1);
    const finalMonthlyRent = finalAnnualRow ? finalAnnualRow.annualRent / 12 : 0;

    return {
      kpis: {
        layout: 'rentVsBuy',
        summary: {
          value: resultLabel(result),
          subvalue: `Based on your assumptions over ${state.comparisonYears} years.`,
          desc: resultDescription(result),
          explanation: resultExplanation(result, state),
          winner: result.winner
        },
        groups: [
          {
            title: 'Renting',
            tone: 'renting',
            items: [
              { label: 'Total rent paid', value: eurosPrecise.format(result.totalRentPaid), desc: 'Total rent paid during the comparison period.' },
              { label: 'Final monthly rent', value: eurosPrecise.format(finalMonthlyRent), desc: 'Estimated monthly rent in the final comparison year.' },
              { label: 'Rent increase', value: `${state.annualRentIncreasePct.toFixed(1)}%`, desc: 'Annual rent increase used in the comparison.' }
            ]
          },
          {
            title: 'Buying',
            tone: 'buying',
            items: [
              { label: 'Net cost of buying', value: eurosPrecise.format(result.netCostOfBuying), desc: 'Buying cash spent minus estimated net equity after selling.' },
              { label: 'Home value at end', value: eurosPrecise.format(result.futurePropertyValue), desc: 'Estimated home value after appreciation or decline.' },
              { label: 'Equity after selling', value: eurosPrecise.format(result.netEquityAfterSelling), desc: 'Estimated sale value after mortgage balance, selling costs, and sale profit tax.' }
            ]
          },
          {
            title: 'Mortgage',
            tone: 'buying',
            items: [
              { label: 'Mortgage paid', value: eurosPrecise.format(result.totalMortgagePaid), desc: 'Total mortgage payments made during the comparison period.' },
              { label: 'Interest paid', value: eurosPrecise.format(result.totalInterestPaid), desc: 'Interest portion of the mortgage payments.' },
              { label: 'Mortgage left', value: eurosPrecise.format(result.remainingMortgageBalance), desc: 'Estimated mortgage balance left at the end.' }
            ]
          },
          {
            title: 'Sale and costs',
            tone: 'renting',
            items: [
              { label: 'Buying cash spent', value: eurosPrecise.format(result.totalBuyCosts), desc: 'Down payment, buying costs, mortgage payments, maintenance, tax, and insurance.' },
              { label: 'Selling costs', value: eurosPrecise.format(result.sellingCosts), desc: 'Estimated cost of selling the home.' },
              { label: 'Tax on sale profit', value: eurosPrecise.format(result.saleProfitTax), desc: 'Optional tax on the gain between purchase price and future sale value.' }
            ]
          }
        ],
        note: 'This comparison is based on your assumptions and does not include every real-life cost.'
      },
      table: {
        title: 'Yearly Rent vs Buy Breakdown',
        rows: result.annual,
        columns: [
          { key: 'year', label: 'Year', format: formatPlain },
          { key: 'annualRent', label: 'Annual Rent', format: eurosPrecise.format },
          { key: 'cumulativeRent', label: 'Rent Paid', format: eurosPrecise.format },
          { key: 'mortgagePaidToDate', label: 'Mortgage Paid', format: eurosPrecise.format },
          { key: 'interestPaidToDate', label: 'Interest Paid', format: eurosPrecise.format },
          { key: 'principalPaidToDate', label: 'Principal Paid', format: eurosPrecise.format },
          { key: 'remainingMortgageBalance', label: 'Mortgage Left', format: eurosPrecise.format },
          { key: 'propertyValue', label: 'Home Value', format: eurosPrecise.format },
          { key: 'equity', label: 'Equity', format: eurosPrecise.format },
          { key: 'saleProfitTax', label: 'Sale Profit Tax', format: eurosPrecise.format }
        ]
      },
      charts: {
        primary: {
          title: 'Rent Cost vs Buying Net Cost',
          subtitle: 'Lower line is financially ahead based on these assumptions',
          leftAxis: 'Amount',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            lineDataset('Rent Paid', result.annual.map(row => row.cumulativeRent), 'cost'),
            lineDataset('Net Cost of Buying', result.annual.map(row => row.netCostOfBuying), 'balance')
          ]
        },
        secondary: {
          title: 'Home Value vs Mortgage Left',
          subtitle: 'Estimated home value compared with remaining loan balance',
          leftAxis: 'Amount',
          rightAxis: '',
          labels: result.annual.map(row => `Y${row.year}`),
          datasets: [
            lineDataset('Home Value', result.annual.map(row => row.propertyValue), 'equity'),
            barDataset('Mortgage Left', result.annual.map(row => row.remainingMortgageBalance), 'principalBar', { borderColorKey: 'principal' })
          ]
        }
      }
    };
  }
};
