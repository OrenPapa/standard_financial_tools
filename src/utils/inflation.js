export function realValueAt(value, annualInflationRate, yearsFromNow) {
  const factor = Math.pow(1 + annualInflationRate / 100, Math.max(0, yearsFromNow));
  return factor === 0 ? 0 : value / factor;
}

export function realValueLabel(value, annualInflationRate, yearsFromNow, formatter) {
  const years = Math.max(0, yearsFromNow);
  return `Today: ${formatter.format(realValueAt(value, annualInflationRate, years))}`;
}
