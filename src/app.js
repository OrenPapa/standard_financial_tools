import { pensionModule } from './modules/pension.js?v=20260810-year-input-format';
import { investmentModule } from './modules/investment.js?v=20260811-advanced-toggle';
import { inflationModule } from './modules/inflation.js?v=20260810-year-input-format';
import { loanModule } from './modules/loan.js?v=20260811-advanced-toggle';
import { mortgageModule } from './modules/mortgage.js?v=20260811-advanced-toggle';
import { rentVsBuyModule } from './modules/rentVsBuy.js?v=20260811-advanced-toggle';
import { renderControls, renderExtraControls, syncControl, updatePayoutButtons } from './ui/controls.js?v=20260811-advanced-toggle';
import { renderKpis } from './ui/kpis.js?v=20260810-year-input-format';
import { renderSchedule } from './ui/table.js?v=20260810-year-input-format';
import { renderCharts, renderChartTabs, updateChartTabs } from './ui/charts.js?v=20260810-year-input-format';
import { classes } from './ui/theme.js?v=20260810-year-input-format';
import { initializeTooltips } from './ui/tooltips.js?v=20260810-year-input-format';
import { initializeThemePicker } from './ui/themePicker.js?v=20260810-year-input-format';
import { calculationStateForAdvanced, hasAdvancedControls, visibleTableForAdvanced } from './utils/advancedState.js?v=20260811-advanced-toggle';

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
  payoutType: 'indexed',
  advancedEnabledByModule: Object.fromEntries(
    Object.values(modules)
      .filter(hasAdvancedControls)
      .map(module => [module.id, false])
  )
};
let scheduleRenderFrame = 0;
let scheduleRenderVersion = 0;

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

function advancedIsEnabled(moduleId) {
  return Boolean(appState.advancedEnabledByModule[moduleId]);
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
  renderControls({
    module,
    state,
    onChange: setControlValue,
    advancedEnabled: advancedIsEnabled(module.id),
    onAdvancedToggle(nextEnabled) {
      appState.advancedEnabledByModule[module.id] = nextEnabled;
      renderControlPanel();
      calculateAndRender({ deferSchedule: true });
    }
  });
}

function calculateAndRender(options = {}) {
  const module = activeModule();
  const state = activeState();

  const changedIds = module.validateState?.(state) || [];
  changedIds.forEach(id => syncControl({ module, state, id }));

  const calculationState = calculationStateForAdvanced(module, state, advancedIsEnabled(module.id));
  const result = module.calculate(calculationState, appState);

  document.getElementById('featureEyebrow').textContent = module.eyebrow;
  document.getElementById('featureTitle').textContent = module.title;
  updateModuleTabs();
  renderKpis(result.kpis);
  renderResultSchedule({
    module,
    table: result.table,
    defer: Boolean(options.deferSchedule)
  });
  renderCharts({ charts: result.charts, activeChart: appState.activeChart });
  updateChartTabs({ module, activeChart: appState.activeChart });
}

function renderResultSchedule({ module, table, defer }) {
  const visibleTable = visibleTableForAdvanced(module, table, advancedIsEnabled(module.id));

  if (!defer) {
    cancelDeferredScheduleRender();
    renderSchedule(visibleTable);
    return;
  }

  cancelDeferredScheduleRender();
  const renderVersion = ++scheduleRenderVersion;
  const moduleId = module.id;
  scheduleRenderFrame = requestAnimationFrame(() => {
    scheduleRenderFrame = 0;
    if (renderVersion !== scheduleRenderVersion || appState.activeModuleId !== moduleId) return;
    renderSchedule(visibleTable);
  });
}

function cancelDeferredScheduleRender() {
  scheduleRenderVersion++;
  if (!scheduleRenderFrame) return;
  cancelAnimationFrame(scheduleRenderFrame);
  scheduleRenderFrame = 0;
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
  const module = activeModule();
  const result = module.calculate(calculationStateForAdvanced(module, activeState(), advancedIsEnabled(module.id)), appState);
  renderCharts({ charts: result.charts, activeChart: appState.activeChart });
  updateChartTabs({ module, activeChart: appState.activeChart });
}

document.getElementById('resetBtn').addEventListener('click', () => {
  const module = activeModule();
  moduleState[module.id] = { ...module.defaultState };
  appState.activeChart = 'primary';
  if (hasAdvancedControls(module)) appState.advancedEnabledByModule[module.id] = false;
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
initializeThemePicker({
  onThemeChange() {
    calculateAndRender();
  }
});
initializeTooltips();
renderControlPanel();
renderChartTabs({
  module: activeModule(),
  activeChart: appState.activeChart,
  onTabChange: switchChart
});
calculateAndRender();
hideInitialLoader();

function hideInitialLoader() {
  const loader = document.getElementById('appLoader');
  if (!loader) return;

  requestAnimationFrame(() => {
    loader.classList.add('is-hidden');
    window.setTimeout(() => loader.remove(), 220);
  });
}
