import { colors } from './theme.js';

const chartColorMap = {
  text: colors.text,
  principal: colors.indigo,
  principalBar: colors.indigoBar,
  principalBarStrong: colors.indigoBarStrong,
  interest: colors.emerald,
  interestBar: colors.emeraldBar,
  interestBarSoft: colors.emeraldBarSoft,
  cost: colors.pink,
  costBar: colors.pinkBar,
  balance: colors.text,
  equity: colors.emerald,
  income: colors.emerald
};

function resolveColor(colorKey, fallback = colors.text) {
  return chartColorMap[colorKey] || colorKey || fallback;
}

export function lineDataset(label, data, colorKey, overrides = {}) {
  const color = resolveColor(colorKey);
  return {
    type: 'line',
    label,
    data,
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    pointRadius: 1,
    tension: 0.25,
    yAxisID: 'y',
    ...overrides
  };
}

export function barDataset(label, data, colorKey, overrides = {}) {
  const color = resolveColor(colorKey);
  return {
    type: 'bar',
    label,
    data,
    backgroundColor: color,
    borderColor: resolveColor(overrides.borderColorKey, color),
    borderWidth: 1,
    yAxisID: 'y',
    ...overrides
  };
}
