/**
 * @typedef {Object} RentVsBuyInput
 * @property {number} monthlyRent
 * @property {number} annualRentIncreasePct
 * @property {number} comparisonYears
 * @property {number} propertyPrice
 * @property {number} downPayment
 * @property {number} mortgageInterestRatePct
 * @property {number} mortgageTermYears
 * @property {number} annualPropertyAppreciationPct
 * @property {number} annualMaintenanceCostPct
 * @property {number} buyingCosts
 * @property {number} sellingCostsPct
 * @property {number} saleProfitTaxPct
 * @property {number} [monthlyPropertyTax]
 * @property {number} [monthlyInsurance]
 */

/**
 * @typedef {Object} RentVsBuyResult
 * @property {number} loanAmount
 * @property {number} monthlyMortgagePayment
 * @property {number} totalRentPaid
 * @property {number} totalMortgagePaid
 * @property {number} totalPrincipalPaid
 * @property {number} totalInterestPaid
 * @property {number} totalMaintenanceCost
 * @property {number} totalPropertyTax
 * @property {number} totalInsurance
 * @property {number} totalBuyCosts
 * @property {number} remainingMortgageBalance
 * @property {number} futurePropertyValue
 * @property {number} sellingCosts
 * @property {number} saleProfitTax
 * @property {number} equity
 * @property {number} netEquityAfterSelling
 * @property {number} netCostOfBuying
 * @property {number} difference
 * @property {'buying'|'renting'|'even'} winner
 * @property {Array<Object>} annual
 */

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function rateNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mortgagePayment(loanAmount, annualRatePct, termYears) {
  const payments = Math.max(1, Math.round(positiveNumber(termYears, 1) * 12));
  const monthlyRate = rateNumber(annualRatePct) / 12 / 100;

  if (loanAmount <= 0) return 0;
  if (monthlyRate === 0) return loanAmount / payments;

  const growth = Math.pow(1 + monthlyRate, payments);
  return loanAmount * (monthlyRate * growth) / (growth - 1);
}

/**
 * Calculates a rent-versus-buy comparison using month-by-month mortgage simulation.
 * @param {RentVsBuyInput} input
 * @returns {RentVsBuyResult}
 */
export function calculateRentVsBuy(input) {
  const comparisonYears = Math.max(1, Math.round(positiveNumber(input.comparisonYears, 1)));
  const mortgageTermYears = Math.max(1, Math.round(positiveNumber(input.mortgageTermYears, 1)));
  const mortgageMonths = mortgageTermYears * 12;
  const monthlyRent = positiveNumber(input.monthlyRent);
  const annualRentIncreasePct = positiveNumber(input.annualRentIncreasePct);
  const propertyPrice = positiveNumber(input.propertyPrice);
  const downPayment = Math.min(positiveNumber(input.downPayment), propertyPrice);
  const loanAmount = Math.max(0, propertyPrice - downPayment);
  const mortgageInterestRatePct = positiveNumber(input.mortgageInterestRatePct);
  const annualPropertyAppreciationPct = rateNumber(input.annualPropertyAppreciationPct);
  const annualMaintenanceCostPct = positiveNumber(input.annualMaintenanceCostPct);
  const buyingCosts = positiveNumber(input.buyingCosts);
  const sellingCostsPct = positiveNumber(input.sellingCostsPct);
  const saleProfitTaxPct = positiveNumber(input.saleProfitTaxPct);
  const monthlyPropertyTax = positiveNumber(input.monthlyPropertyTax);
  const monthlyInsurance = positiveNumber(input.monthlyInsurance);
  const monthlyRate = mortgageInterestRatePct / 12 / 100;
  const monthlyMortgagePayment = mortgagePayment(loanAmount, mortgageInterestRatePct, mortgageTermYears);
  const annualMaintenanceCost = propertyPrice * annualMaintenanceCostPct / 100;

  let totalRentPaid = 0;
  let remainingMortgageBalance = loanAmount;
  let totalMortgagePaid = 0;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalMaintenanceCost = 0;
  let totalPropertyTax = 0;
  let totalInsurance = 0;
  const annual = [];

  for (let year = 1; year <= comparisonYears; year++) {
    const yearlyMonthlyRent = monthlyRent * Math.pow(1 + annualRentIncreasePct / 100, year - 1);
    const annualRent = yearlyMonthlyRent * 12;
    totalRentPaid += annualRent;
    totalMaintenanceCost += annualMaintenanceCost;

    for (let monthInYear = 1; monthInYear <= 12; monthInYear++) {
      const absoluteMonth = (year - 1) * 12 + monthInYear;
      const mortgageIsActive = absoluteMonth <= mortgageMonths && remainingMortgageBalance > 0.005;

      if (mortgageIsActive) {
        const interest = remainingMortgageBalance * monthlyRate;
        const principal = Math.min(remainingMortgageBalance, Math.max(0, monthlyMortgagePayment - interest));
        const payment = principal + interest;

        remainingMortgageBalance = Math.max(0, remainingMortgageBalance - principal);
        totalMortgagePaid += payment;
        totalPrincipalPaid += principal;
        totalInterestPaid += interest;
      }

      totalPropertyTax += monthlyPropertyTax;
      totalInsurance += monthlyInsurance;
    }

    const propertyValue = propertyPrice * Math.pow(1 + annualPropertyAppreciationPct / 100, year);
    const yearSellingCosts = propertyValue * sellingCostsPct / 100;
    const yearSaleProfitTax = Math.max(0, propertyValue - propertyPrice) * saleProfitTaxPct / 100;
    const equity = Math.max(0, propertyValue - remainingMortgageBalance);
    const netEquityAfterSelling = propertyValue - remainingMortgageBalance - yearSellingCosts - yearSaleProfitTax;
    const totalBuyCosts = downPayment + buyingCosts + totalMortgagePaid + totalMaintenanceCost + totalPropertyTax + totalInsurance;
    const netCostOfBuying = totalBuyCosts - netEquityAfterSelling;

    annual.push({
      year,
      annualRent,
      cumulativeRent: totalRentPaid,
      mortgagePaidToDate: totalMortgagePaid,
      interestPaidToDate: totalInterestPaid,
      principalPaidToDate: totalPrincipalPaid,
      remainingMortgageBalance,
      propertyValue,
      equity,
      saleProfitTax: yearSaleProfitTax,
      netEquityAfterSelling,
      netCostOfBuying
    });
  }

  const futurePropertyValue = propertyPrice * Math.pow(1 + annualPropertyAppreciationPct / 100, comparisonYears);
  const sellingCosts = futurePropertyValue * sellingCostsPct / 100;
  const saleProfitTax = Math.max(0, futurePropertyValue - propertyPrice) * saleProfitTaxPct / 100;
  const equity = Math.max(0, futurePropertyValue - remainingMortgageBalance);
  const netEquityAfterSelling = futurePropertyValue - remainingMortgageBalance - sellingCosts - saleProfitTax;
  const totalBuyCosts = downPayment + buyingCosts + totalMortgagePaid + totalMaintenanceCost + totalPropertyTax + totalInsurance;
  const netCostOfBuying = totalBuyCosts - netEquityAfterSelling;
  const difference = totalRentPaid - netCostOfBuying;
  const winner = Math.abs(difference) < 0.005 ? 'even' : difference > 0 ? 'buying' : 'renting';

  return {
    loanAmount,
    monthlyMortgagePayment,
    totalRentPaid,
    totalMortgagePaid,
    totalPrincipalPaid,
    totalInterestPaid,
    totalMaintenanceCost,
    totalPropertyTax,
    totalInsurance,
    totalBuyCosts,
    remainingMortgageBalance,
    futurePropertyValue,
    sellingCosts,
    saleProfitTax,
    equity,
    netEquityAfterSelling,
    netCostOfBuying,
    difference,
    winner,
    annual
  };
}
