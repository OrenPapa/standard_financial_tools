import { pensionModule } from './modules/pension.js?v=20260810-tooltips';
import { investmentModule } from './modules/investment.js?v=20260810-tooltips';
import { inflationModule } from './modules/inflation.js?v=20260810-tooltips';
import { loanModule } from './modules/loan.js?v=20260810-tooltips';
import { mortgageModule } from './modules/mortgage.js?v=20260810-tooltips';
import { rentVsBuyModule } from './modules/rentVsBuy.js?v=20260810-tooltips';
import { renderControls, renderExtraControls, syncControl, updatePayoutButtons } from './ui/controls.js?v=20260810-tooltips';
import { renderKpis } from './ui/kpis.js?v=20260810-tooltips';
import { renderSchedule } from './ui/table.js?v=20260810-tooltips';
import { renderCharts, renderChartTabs, updateChartTabs } from './ui/charts.js?v=20260810-tooltips';
import { classes } from './ui/theme.js?v=20260810-tooltips';
import { initializeTooltips } from './ui/tooltips.js?v=20260810-tooltips';

const modules = {
  [pensionModule.id]: pensionModule,
  [investmentModule.id]: investmentModule,
  [inflationModule.id]: inflationModule,
  [loanModule.id]: loanModule,
  [mortgageModule.id]: mortgageModule,
  [rentVsBuyModule.id]: rentVsBuyModule
};

const moduleState = Object.fromEntries(
  Object.values(modules).map(module => [module.id, { ...module.defaultState }])
);

const appState = {
  activeModuleId: initialModuleId(),
  activeChart: 'primary',
  payoutType: 'indexed'
};

function initialModuleId() {
  const hashId = window.location.hash.replace('#', '');
  return modules[hashId] ? hashId : pensionModule.id;
}

function activeModule() {
  return modules[appState.activeModuleId];
}

function activeState() {
  return moduleState[appState.activeModuleId];
}

function renderModuleTabs() {
  const tabs = document.getElementById('moduleTabs');
  tabs.innerHTML = Object.values(modules).map(module => `
    <button id="${module.id}ModuleBtn" class="${classes.moduleTab}">${module.navLabel}</button>
  `).join('');

  Object.values(modules).forEach(module => {
    document.getElementById(`${module.id}ModuleBtn`).addEventListener('click', () => switchModule(module.id));
  });

  updateModuleTabs();
}

function updateModuleTabs() {
  Object.values(modules).forEach(module => {
    const button = document.getElementById(`${module.id}ModuleBtn`);
    button.className = `${classes.moduleTab} ${appState.activeModuleId === module.id ? classes.activeModuleTab : classes.inactiveTab}`;
  });
}

function setControlValue(id, value) {
  const module = activeModule();
  const state = activeState();
  if (Object.is(state[id], value)) return;

  state[id] = value;
  syncControl({ module, state, id });

  if (module.id === 'investment' && (id === 'incomeYield' || id === 'incomeFrequency')) {
    syncControl({ module, state, id: 'reinvestIncome' });
  }

  calculateAndRender();
}

function renderControlPanel() {
  const module = activeModule();
  const state = activeState();
  renderExtraControls({
    module,
    payoutType: appState.payoutType,
    onPayoutTypeChange(nextType) {
      if (appState.payoutType === nextType) return;
      appState.payoutType = nextType;
      updatePayoutButtons(appState.payoutType);
      calculateAndRender();
    }
  });
  renderControls({ module, state, onChange: setControlValue });
}

function calculateAndRender() {
  const module = activeModule();
  const state = activeState();

  const changedIds = module.validateState?.(state) || [];
  changedIds.forEach(id => syncControl({ module, state, id }));

  const result = module.calculate(state, appState);

  document.getElementById('featureEyebrow').textContent = module.eyebrow;
  document.getElementById('featureTitle').textContent = module.title;
  updateModuleTabs();
  renderKpis(result.kpis);
  renderSchedule(result.table);
  renderCharts({ charts: result.charts, activeChart: appState.activeChart });
  updateChartTabs({ module, activeChart: appState.activeChart });
}

function switchModule(moduleId) {
  if (!modules[moduleId]) return;
  appState.activeModuleId = moduleId;
  appState.activeChart = 'primary';
  if (window.location.hash !== `#${moduleId}`) {
    window.history.pushState(null, '', `#${moduleId}`);
  }
  renderControlPanel();
  renderChartTabs({
    module: activeModule(),
    activeChart: appState.activeChart,
    onTabChange: switchChart
  });
  calculateAndRender();
}

function switchChart(chartId) {
  appState.activeChart = chartId;
  const result = activeModule().calculate(activeState(), appState);
  renderCharts({ charts: result.charts, activeChart: appState.activeChart });
  updateChartTabs({ module: activeModule(), activeChart: appState.activeChart });
}

document.getElementById('resetBtn').addEventListener('click', () => {
  const module = activeModule();
  moduleState[module.id] = { ...module.defaultState };
  appState.activeChart = 'primary';
  if (module.id === 'pension') appState.payoutType = 'indexed';
  renderControlPanel();
  calculateAndRender();
});

window.addEventListener('hashchange', () => {
  const moduleId = window.location.hash.replace('#', '');
  if (modules[moduleId] && moduleId !== appState.activeModuleId) {
    switchModule(moduleId);
  }
});

renderModuleTabs();
initializeTooltips();
renderControlPanel();
renderChartTabs({
  module: activeModule(),
  activeChart: appState.activeChart,
  onTabChange: switchChart
});
calculateAndRender();
