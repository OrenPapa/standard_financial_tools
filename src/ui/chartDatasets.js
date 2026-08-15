import { colors } from './theme.js';

export const doughnutPalette = [
  '#2563eb',
  '#f97316',
  '#16a34a',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#ca8a04',
  '#db2777',
  '#0d9488',
  '#4f46e5'
];

function resolveColor(colorKey, fallback = colors.text) {
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
    tax: colors.emerald,
    insurance: colors.amber,
    otherCost: colors.rose,
    contribution: colors.indigo,
    growth: colors.cyan,
    incomeSlice: colors.amber,
    feeSlice: colors.rose,
    balance: colors.text,
    equity: colors.emerald,
    income: colors.emerald
  };

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

export function doughnutDataset(label, data, colorKeys, overrides = {}) {
  const useSemanticColors = overrides.useSemanticColors === true;
  const { useSemanticColors: _useSemanticColors, ...datasetOverrides } = overrides;

  return {
    type: 'doughnut',
    label,
    data,
    backgroundColor: data.map((_, index) => {
      if (useSemanticColors && colorKeys?.[index]) {
        return resolveColor(colorKeys[index]);
      }

      return doughnutPalette[index % doughnutPalette.length];
    }),
    borderColor: colors.panel,
    borderWidth: 2,
    hoverOffset: 6,
    ...datasetOverrides
  };
}
