import { Chart, registerables } from 'chart.js';
import { euros } from '../utils/format.js';
import { colors, classes } from './theme.js';

Chart.register(...registerables);

let primaryChart;
let secondaryChart;

function chartOptions(chartData) {
  const formatLeftTick = chartData.leftTickFormatter || (value => euros.format(value));
  const formatRightTick = chartData.rightTickFormatter || (value => euros.format(value));
  const formatTooltip = chartData.tooltipFormatter || (value => euros.format(value));

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: colors.textSoft, boxWidth: 12, boxHeight: 12 } },
      tooltip: {
        backgroundColor: colors.panel,
        borderColor: colors.borderSubtle,
        borderWidth: 1,
        titleColor: colors.text,
        bodyColor: colors.textSoft,
        footerColor: colors.textMuted,
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${formatTooltip(ctx.parsed.y)}`
        }
      }
    },
    scales: {
      x: { ticks: { color: colors.textMuted }, grid: { color: colors.grid } },
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: chartData.leftAxis, color: colors.textMuted },
        ticks: { color: colors.textMuted, callback: formatLeftTick },
        grid: { color: colors.grid }
      },
      y1: {
        type: 'linear',
        position: 'right',
        display: Boolean(chartData.rightAxis),
        title: { display: Boolean(chartData.rightAxis), text: chartData.rightAxis, color: colors.textMuted },
        ticks: { color: colors.textMuted, callback: formatRightTick },
        grid: { drawOnChartArea: false }
      }
    }
  };
}

function chartConfig(chartData) {
  return {
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets
    },
    options: chartOptions(chartData)
  };
}

export function renderChartTabs({ module, activeChart, onTabChange }) {
  const tabs = document.getElementById('chartTabs');
  tabs.innerHTML = `
    <button id="primaryChartTab" class="${classes.chartTab}">${module.chartTabs.primary}</button>
    <button id="secondaryChartTab" class="${classes.chartTab}">${module.chartTabs.secondary}</button>
  `;

  document.getElementById('primaryChartTab').addEventListener('click', () => onTabChange('primary'));
  document.getElementById('secondaryChartTab').addEventListener('click', () => onTabChange('secondary'));
  updateChartTabs({ module, activeChart });
}

export function updateChartTabs({ module, activeChart }) {
  const showingPrimary = activeChart === 'primary';
  document.getElementById('primaryChartPanel').classList.toggle('hidden', !showingPrimary);
  document.getElementById('secondaryChartPanel').classList.toggle('hidden', showingPrimary);

  const primaryTab = document.getElementById('primaryChartTab');
  const secondaryTab = document.getElementById('secondaryChartTab');
  if (primaryTab && secondaryTab) {
    primaryTab.textContent = module.chartTabs.primary;
    secondaryTab.textContent = module.chartTabs.secondary;
    primaryTab.className = `${classes.chartTab} ${showingPrimary ? classes.activePrimaryTab : classes.inactiveTab}`;
    secondaryTab.className = `${classes.chartTab} ${!showingPrimary ? classes.activeSecondaryTab : classes.inactiveTab}`;
  }

  if (showingPrimary && primaryChart) primaryChart.resize();
  if (!showingPrimary && secondaryChart) secondaryChart.resize();
}

export function renderCharts({ charts, activeChart }) {
  const primaryConfig = chartConfig(charts.primary);
  const secondaryConfig = chartConfig(charts.secondary);

  if (!primaryChart) {
    primaryChart = new Chart(document.getElementById('primaryChart'), primaryConfig);
  } else {
    primaryChart.data = primaryConfig.data;
    primaryChart.options = primaryConfig.options;
    primaryChart.update();
  }

  if (!secondaryChart) {
    secondaryChart = new Chart(document.getElementById('secondaryChart'), secondaryConfig);
  } else {
    secondaryChart.data = secondaryConfig.data;
    secondaryChart.options = secondaryConfig.options;
    secondaryChart.update();
  }

  const chart = activeChart === 'primary' ? charts.primary : charts.secondary;
  document.getElementById('chartTitle').textContent = chart.title;
  document.getElementById('chartSubtitle').textContent = chart.subtitle;
}
