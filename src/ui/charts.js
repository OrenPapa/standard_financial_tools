import { Chart, registerables } from 'chart.js';
import { euros } from '../utils/format.js';
import { colors, classes } from './theme.js';

Chart.register(...registerables);

let primaryChart;

function chartOptions(chartData) {
  const formatLeftTick = chartData.leftTickFormatter || (value => euros.format(value));
  const formatRightTick = chartData.rightTickFormatter || (value => euros.format(value));
  const formatTooltip = chartData.tooltipFormatter || (value => euros.format(value));
  const hasScales = chartData.type !== 'doughnut' && chartData.type !== 'pie';

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: hasScales ? { mode: 'index', intersect: false } : { intersect: true },
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
          label: ctx => {
            const value = hasScales ? ctx.parsed.y : ctx.parsed;
            const label = hasScales ? ctx.dataset.label : ctx.label;
            return `${label}: ${formatTooltip(value)}`;
          }
        }
      }
    },
    scales: hasScales ? {
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
    } : {}
  };
}

function chartConfig(chartData) {
  return {
    type: chartData.type || 'bar',
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets
    },
    options: chartOptions(chartData)
  };
}

export function renderChartTabs({ module, activeChart, onTabChange }) {
  const tabs = document.getElementById('chartTabs');
  const chartTabs = Object.entries(module.chartTabs);
  tabs.innerHTML = chartTabs.map(([chartId, label]) => `
    <button id="${chartId}ChartTab" data-chart-id="${chartId}" class="${classes.chartTab}">${label}</button>
  `).join('');

  tabs.querySelectorAll('button[data-chart-id]').forEach(button => {
    button.addEventListener('click', () => onTabChange(button.dataset.chartId));
  });
  updateChartTabs({ module, activeChart });
}

export function updateChartTabs({ module, activeChart }) {
  Object.entries(module.chartTabs).forEach(([chartId, label], index) => {
    const button = document.getElementById(`${chartId}ChartTab`);
    if (!button) return;
    const isActive = activeChart === chartId;
    const activeClass = index === 0 ? classes.activePrimaryTab : classes.activeSecondaryTab;
    button.textContent = label;
    button.className = `${classes.chartTab} ${isActive ? activeClass : classes.inactiveTab}`;
  });

  if (primaryChart) primaryChart.resize();
}

export function renderCharts({ charts, activeChart }) {
  const chart = charts[activeChart] || charts.primary;
  const primaryConfig = chartConfig(chart);

  primaryChart = renderChart({
    instance: primaryChart,
    canvasId: 'primaryChart',
    config: primaryConfig
  });

  document.getElementById('chartTitle').textContent = chart.title;
  document.getElementById('chartSubtitle').textContent = chart.subtitle;
}

function renderChart({ instance, canvasId, config }) {
  if (!instance) {
    return new Chart(document.getElementById(canvasId), config);
  }

  if (instance.config.type !== config.type) {
    instance.destroy();
    return new Chart(document.getElementById(canvasId), config);
  }

  instance.data = config.data;
  instance.options = config.options;
  instance.update();
  return instance;
}
