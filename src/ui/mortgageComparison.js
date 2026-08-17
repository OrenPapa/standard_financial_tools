import { clampNumberToMeta, formatNumberForInput, parseNumberInput, sanitizeNumberInputText } from './controls.js';
import { classes } from './theme.js';

function inputMarkup(field, value, scenarioIndex) {
  if (field.type === 'text') {
    return `
      <input id="scenario${scenarioIndex}${field.id}" data-scenario-index="${scenarioIndex}" data-field-id="${field.id}" type="text" value="${escapeHtml(value)}" class="${classes.inputBase} px-3 py-2">
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
      <input id="scenario${scenarioIndex}${field.id}" data-scenario-index="${scenarioIndex}" data-field-id="${field.id}" data-control-kind="number" type="text" inputmode="decimal" value="${formatNumberForInput(field, value)}" class="${classes.inputBase} numeric-input ${paddingClasses}">
      ${suffix ? `<span class="input-affix input-affix-suffix">${suffix}</span>` : ''}
    </span>
  `;
}

function renderScenarioForm({ scenario, fields, index, canRemove }) {
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
          ${fields.map(field => `
            <label class="block min-w-0" for="scenario${index}${field.id}">
              <div class="mb-1.5 flex items-center justify-between gap-3">
                <span class="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-200">
                  <span class="min-w-0">${field.label}</span>
                  <span class="${classes.iconTip}" tabindex="0">i<span class="${classes.tooltip}">${field.desc}</span></span>
                </span>
              </div>
              ${inputMarkup(field, scenario[field.id], index)}
            </label>
          `).join('')}
        </div>
      </div>
    </details>
  `;
}

export function renderMortgageComparisonBuilder({ module, state, onChange, onAddScenario, onRemoveScenario, onReset, onCalculate }) {
  const container = document.getElementById('comparisonBuilder');
  const scenarios = Array.isArray(state.scenarios) ? state.scenarios : [];

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
        <div class="mb-4 flex flex-wrap justify-end gap-2">
          <button id="resetMortgageComparisonBtn" type="button" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">Reset</button>
          <button id="addMortgageScenarioBtn" type="button" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10" ${scenarios.length >= 8 ? 'disabled' : ''}>Add scenario</button>
        </div>
        <div class="mortgage-comparison-scroll">
          <div class="mortgage-comparison-rail">
          ${scenarios.map((scenario, index) => renderScenarioForm({
            scenario,
            fields: module.scenarioFields,
            index,
            canRemove: scenarios.length > 2
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

  desktopScenarioQuery.addEventListener?.('change', syncScenarioDetails);
  syncScenarioDetails();

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', event => {
      const field = module.scenarioFields.find(item => item.id === event.target.dataset.fieldId);
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

    input.addEventListener('blur', event => commitScenarioInput(event.target, module, onChange));
    input.addEventListener('change', event => commitScenarioInput(event.target, module, onChange));
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      commitScenarioInput(event.currentTarget, module, onChange);
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
    container.querySelectorAll('input').forEach(input => commitScenarioInput(input, module, onChange));
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
