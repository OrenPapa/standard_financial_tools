export function amortizedPayment({ principal, periodicRate, periods, futureValue = 0 }) {
  const targetFutureValue = Math.min(Math.max(futureValue, 0), principal);
  if (periods <= 0) return 0;
  if (periodicRate === 0) return (principal - targetFutureValue) / periods;

  const discount = Math.pow(1 + periodicRate, -periods);
  return (principal - targetFutureValue * discount) * periodicRate / (1 - discount);
}
