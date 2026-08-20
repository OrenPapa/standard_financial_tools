import { clampNumberToMeta, formatNumberForInput, parseNumberInput, sanitizeNumberInputText } from './controls.js';
import { classes } from './theme.js';

const advancedSettingsTooltip = 'By enabling advanced settings, include property tax, insurance, PMI, HOA or service charges, loan fees, discount points, and exit penalty data in the mortgage scenarios.';

function inputMarkup(field, value, options = {}) {
  const scenarioIndex = options.scenarioIndex;
  const isGlobal = options.global === true;
  const fieldAttrs = isGlobal
    ? `data-global-field-id="${field.id}"`
    : `data-scenario-index="${scenarioIndex}" data-field-id="${field.id}"`;
  const inputId = isGlobal ? `mortgageComparison${field.id}` : `scenario${scenarioIndex}${field.id}`;

  if (field.type === 'text') {
    return `
      <input id="${inputId}" ${fieldAttrs} type="text" value="${escapeHtml(value)}" class="${classes.inputBase} px-3 py-2">
    `;
  }

  const prefix = (field.prefix || '').trim() === 'EUR' ? '&euro;' : (field.prefix || '').trim();
  const suffix = (field.suffix || '').trim();
  const paddingClasses = [
    'px-3 py-2 text-right',
    prefix ? 'pl-8' : '',
    suffix ? 'pr-9' : ''
  ].filter(Boolean).join(' ');

  return `
    <span class="input-affix-shell relative block">
      ${prefix ? `<span class="input-affix input-affix-prefix">${prefix}</span>` : ''}
      <input id="${inputId}" ${fieldAttrs} data-control-kind="number" type="text" inputmode="decimal" value="${formatNumberForInput(field, value)}" class="${classes.inputBase} numeric-input ${paddingClasses}">
      ${suffix ? `<span class="input-affix input-affix-suffix">${suffix}</span>` : ''}
    </span>
  `;
}

function renderField(field, value, inputOptions = {}) {
  const inputId = `scenario${inputOptions.scenarioIndex}${field.id}`;
  const message = inputOptions.validation?.fields?.[field.id];
  const warning = inputOptions.validation?.warnings?.[field.id];

  return `
    <label class="block min-w-0" for="${inputId}">
      <div class="mb-1.5 flex items-center justify-between gap-3">
        <span class="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-200">
          <span class="min-w-0">${field.label}</span>
          <span class="${classes.iconTip}" tabindex="0">i<span class="${classes.tooltip}">${field.desc}</span></span>
        </span>
      </div>
      ${inputMarkup(field, value, inputOptions)}
      ${message ? `<p class="mt-1 text-xs leading-5 text-rose-300">${escapeHtml(message)}</p>` : ''}
      ${warning ? `<p class="mt-1 text-xs leading-5 text-amber-200">${escapeHtml(warning)}</p>` : ''}
    </label>
  `;
}

function renderTopAdvancedField(field, value, validation = {}) {
  const message = validation.global?.[field.id];

  return `
    <label class="flex min-w-[12rem] flex-wrap items-center gap-2" for="mortgageComparison${field.id}">
      <span class="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-200">
        <span>${field.label}</span>
        <span class="${classes.iconTip}" tabindex="0">i<span class="${classes.tooltip}">${field.desc}</span></span>
      </span>
      <span class="w-28">${inputMarkup(field, value, { global: true })}</span>
      ${message ? `<p class="basis-full text-xs leading-5 text-rose-300">${escapeHtml(message)}</p>` : ''}
    </label>
  `;
}

function renderScenarioForm({ scenario, basicFields, advancedFields, index, canRemove, advancedEnabled }) {
  const removeTooltip = 'You cannot remove this scenario because there have to be at least 2 scenarios.';

  return `
    <details class="mortgage-comparison-form shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-3" data-scenario-details open>
      <summary class="mortgage-comparison-summary flex cursor-pointer items-center justify-between gap-3">
        <h3 class="min-w-0 text-sm font-semibold text-white">${escapeHtml(scenario.name || `Scenario ${index + 1}`)}</h3>
        <span class="flex shrink-0 items-center gap-2">
          <span class="mortgage-comparison-remove-wrap group relative inline-flex" data-remove-scenario-wrap title="${canRemove ? '' : removeTooltip}">
            <button type="button" data-remove-scenario="${index}" ${canRemove ? '' : 'disabled'} aria-label="Remove ${escapeHtml(scenario.name || `Scenario ${index + 1}`)}" class="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">Remove</button>
            ${canRemove ? '' : `<span class="pointer-events-none absolute right-0 top-[calc(100%+0.375rem)] z-30 hidden w-56 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-left text-xs font-normal leading-snug text-slate-200 shadow-xl group-hover:block mortgage-comparison-remove-tip">${removeTooltip}</span>`}
          </span>
          <span class="mortgage-comparison-caret" aria-hidden="true"></span>
        </span>
      </summary>
      <div class="mt-3">
        <div class="grid gap-2.5">
          ${basicFields.map(field => renderField(field, scenario[field.id], { scenarioIndex: index, validation: scenario._validation })).join('')}
        </div>
        ${advancedEnabled ? `
          <details class="mt-4 border-t border-white/10 pt-3" data-scenario-advanced-details open>
            <summary class="mortgage-comparison-summary flex cursor-pointer items-center justify-between gap-3">
              <span class="flex items-center gap-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Advanced settings</span>
              </span>
              <span class="mortgage-comparison-caret" aria-hidden="true"></span>
            </summary>
            <div class="mt-3 grid gap-2.5">
              ${advancedFields.map(field => renderField(field, scenario[field.id], { scenarioIndex: index, validation: scenario._validation })).join('')}
            </div>
          </details>
        ` : ''}
      </div>
    </details>
  `;
}

export function renderMortgageComparisonBuilder({ module, state, advancedEnabled, onAdvancedToggle, onChange, onGlobalChange, onAddScenario, onRemoveScenario, onReset, onCalculate }) {
  const container = document.getElementById('comparisonBuilder');
  const scenarios = Array.isArray(state.scenarios) ? state.scenarios : [];
  const basicScenarioFields = module.scenarioFields.filter(field => !field.advanced);
  const advancedScenarioFields = module.scenarioFields.filter(field => field.advanced);
  const topAdvancedFields = module.advancedControls || [];

  container.classList.remove('hidden');
  container.innerHTML = `
    <details class="mortgage-comparison-section" open>
      <summary class="mortgage-comparison-summary cursor-pointer">
        <div class="flex items-center justify-between gap-3">
          <h2 class="min-w-0 text-lg font-semibold text-white">Scenarios</h2>
          <span class="mortgage-comparison-caret" aria-hidden="true"></span>
        </div>
        <div class="min-w-0">
          <p class="text-sm text-slate-400">Compare two or more mortgage packages side by side.</p>
        </div>
      </summary>
      <div class="mt-4">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          ${advancedScenarioFields.length ? `
            <div class="advanced-settings flex min-h-10 flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2" aria-label="Advanced mortgage comparison settings">
              <span class="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-200">
                <span>Advanced settings <span class="text-xs font-normal text-slate-400">(optional)</span></span>
                <span class="${classes.iconTip}" tabindex="0">i<span class="${classes.tooltip}">${advancedSettingsTooltip}</span></span>
              </span>
              <button id="mortgageComparisonAdvancedToggle" data-advanced-toggle type="button" role="switch" aria-checked="${advancedEnabled}" aria-expanded="${advancedEnabled}" aria-label="Toggle advanced settings" class="inline-flex shrink-0 items-center p-0">
                <span class="relative h-5 w-9 rounded-full transition ${advancedEnabled ? 'bg-emerald-500' : 'bg-slate-700'}">
                  <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${advancedEnabled ? 'left-[1.125rem]' : 'left-0.5'}"></span>
                </span>
              </button>
              ${advancedEnabled ? topAdvancedFields.map(field => renderTopAdvancedField(field, state[field.id], state._validation)).join('') : ''}
            </div>
          ` : ''}
          <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
            <button id="resetMortgageComparisonBtn" type="button" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">Reset</button>
            <button id="addMortgageScenarioBtn" type="button" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10" ${scenarios.length >= 8 ? 'disabled' : ''}>Add scenario</button>
          </div>
        </div>
        <div class="mortgage-comparison-scroll">
          <div class="mortgage-comparison-rail">
          ${scenarios.map((scenario, index) => renderScenarioForm({
            scenario,
            basicFields: basicScenarioFields,
            advancedFields: advancedScenarioFields,
            index,
            canRemove: scenarios.length > 2,
            advancedEnabled
          })).join('')}
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button id="calculateMortgageComparisonBtn" type="button" class="mortgage-comparison-calculate flex min-w-36 items-center justify-center rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-900">
            Calculate
          </button>
        </div>
      </div>
    </details>
  `;

  const desktopScenarioQuery = window.matchMedia('(min-width: 901px)');
  const syncScenarioDetails = () => {
    container.querySelectorAll('details[data-scenario-details]').forEach(details => {
      if (desktopScenarioQuery.matches) details.open = true;
    });
  };

  container.querySelectorAll('details[data-scenario-details] > summary').forEach(summary => {
    summary.addEventListener('click', event => {
      if (!desktopScenarioQuery.matches) return;
      event.preventDefault();
      summary.parentElement.open = true;
    });
  });

  container.querySelectorAll('details[data-scenario-advanced-details] > summary').forEach(summary => {
    summary.addEventListener('click', event => {
      event.preventDefault();
      const nextOpen = !summary.parentElement.open;
      container.querySelectorAll('details[data-scenario-advanced-details]').forEach(details => {
        details.open = nextOpen;
      });
    });

    summary.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      const nextOpen = !summary.parentElement.open;
      container.querySelectorAll('details[data-scenario-advanced-details]').forEach(details => {
        details.open = nextOpen;
      });
    });
  });

  desktopScenarioQuery.addEventListener?.('change', syncScenarioDetails);
  syncScenarioDetails();

  container.querySelectorAll('button[data-advanced-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      commitPendingInputs(container, module, onChange, onGlobalChange);
      onAdvancedToggle?.(!advancedEnabled);
    });
  });

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', event => {
      const fieldId = event.target.dataset.fieldId || event.target.dataset.globalFieldId;
      const field = [...module.scenarioFields, ...(module.advancedControls || [])].find(item => item.id === fieldId);
      if (!field || field.type === 'text') {
        onChange(Number(event.target.dataset.scenarioIndex), event.target.dataset.fieldId, event.target.value);
        return;
      }

      const sanitizedValue = sanitizeNumberInputText(event.target.value, field);
      if (event.target.value !== sanitizedValue) {
        const cursor = event.target.selectionStart ?? sanitizedValue.length;
        event.target.value = sanitizedValue;
        event.target.setSelectionRange?.(Math.min(cursor, sanitizedValue.length), Math.min(cursor, sanitizedValue.length));
      }
    });

    input.addEventListener('blur', event => commitInput(event.target, module, onChange, onGlobalChange));
    input.addEventListener('change', event => commitInput(event.target, module, onChange, onGlobalChange));
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      commitInput(event.currentTarget, module, onChange, onGlobalChange);
      event.currentTarget.blur();
    });
  });

  container.querySelectorAll('[data-remove-scenario-wrap]').forEach(wrapper => {
    wrapper.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const button = wrapper.querySelector('button[data-remove-scenario]');
      if (!button || button.disabled) return;
      onRemoveScenario(Number(button.dataset.removeScenario));
    });
  });

  document.getElementById('addMortgageScenarioBtn')?.addEventListener('click', onAddScenario);
  document.getElementById('resetMortgageComparisonBtn')?.addEventListener('click', onReset);
  document.getElementById('calculateMortgageComparisonBtn')?.addEventListener('click', () => {
    commitPendingInputs(container, module, onChange, onGlobalChange);
    onCalculate();
  });
}

export function hideMortgageComparisonBuilder() {
  const container = document.getElementById('comparisonBuilder');
  if (!container) return;
  container.classList.add('hidden');
  container.innerHTML = '';
}

function commitScenarioInput(input, module, onChange) {
  const scenarioIndex = Number(input.dataset.scenarioIndex);
  const fieldId = input.dataset.fieldId;
  const field = module.scenarioFields.find(item => item.id === fieldId);
  if (!field) return;

  if (field.type === 'text') {
    onChange(scenarioIndex, fieldId, input.value);
    return;
  }

  const parsedValue = parseNumberInput(input.value);
  if (!Number.isFinite(parsedValue)) return;
  const value = clampNumberToMeta(field, parsedValue);
  input.value = formatNumberForInput(field, value);
  onChange(scenarioIndex, fieldId, value);
}

function commitGlobalInput(input, module, onGlobalChange) {
  const fieldId = input.dataset.globalFieldId;
  const field = module.advancedControls?.find(item => item.id === fieldId);
  if (!field) return;

  const parsedValue = parseNumberInput(input.value);
  if (!Number.isFinite(parsedValue)) return;
  const value = clampNumberToMeta(field, parsedValue);
  input.value = formatNumberForInput(field, value);
  onGlobalChange?.(fieldId, value);
}

function commitPendingInputs(container, module, onChange, onGlobalChange) {
  container.querySelectorAll('input').forEach(input => {
    commitInput(input, module, onChange, onGlobalChange);
  });
}

function commitInput(input, module, onChange, onGlobalChange) {
  if (input.dataset.globalFieldId) {
    commitGlobalInput(input, module, onGlobalChange);
    return;
  }

  commitScenarioInput(input, module, onChange);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
