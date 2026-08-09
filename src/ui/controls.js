import { classes } from './theme.js';

function controlDisplayValue(meta, value, state, moduleId) {
  const incomeIsActive = moduleId === 'investment' && Number(state.incomeYield) > 0 && state.incomeFrequency !== 'none';

  if (meta.type === 'checkbox') {
    return meta.id === 'reinvestIncome' && !incomeIsActive ? 'No income' : value ? 'Yes' : 'No';
  }

  if (meta.type === 'select') {
    return meta.options.find(([optionValue]) => optionValue === value)?.[1] || value;
  }

  return formatNumberForInput(meta, value);
}

function renderControl(meta, state, moduleId) {
  const value = state[meta.id];
  const incomeIsActive = moduleId === 'investment' && Number(state.incomeYield) > 0 && state.incomeFrequency !== 'none';
  const checkboxDisabled = meta.id === 'reinvestIncome' && !incomeIsActive;
  const displayValue = controlDisplayValue(meta, value, state, moduleId);

  const controlField = meta.type === 'select'
    ? `<select id="${meta.id}" data-id="${meta.id}" class="${classes.inputBase} px-2 py-2">${meta.options.map(([optionValue, label]) => `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${label}</option>`).join('')}</select>`
    : meta.type === 'checkbox'
      ? `<button id="${meta.id}" data-id="${meta.id}" type="button" aria-pressed="${value}" ${checkboxDisabled ? 'disabled' : ''} class="w-full rounded-md border border-white/10 px-3 py-2 text-sm font-medium transition ${checkboxDisabled ? 'cursor-not-allowed bg-slate-950/60 text-slate-500' : value ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-300'}">${checkboxDisabled ? 'No income to reinvest' : value ? 'Enabled' : 'Disabled'}</button>`
      : meta.control === 'number'
        ? `<input id="${meta.id}Number" data-id="${meta.id}" data-control-kind="number" type="text" inputmode="decimal" value="${formatNumberForInput(meta, value)}" class="${classes.inputBase} numeric-input px-3 py-2 text-right">`
      : `<div class="control-range-grid grid grid-cols-[1fr_88px] items-center gap-3">
          <input id="${meta.id}" data-id="${meta.id}" data-control-kind="range" type="range" min="${meta.min}" max="${meta.max}" step="${meta.step}" value="${value}" class="h-2 w-full cursor-pointer rounded-lg bg-slate-700">
          <input id="${meta.id}Number" data-id="${meta.id}" data-control-kind="number" type="text" inputmode="decimal" value="${formatNumberForInput(meta, value)}" class="${classes.inputBase} numeric-input px-2 py-1.5 text-right">
        </div>`;

  return `
    <label class="${classes.controlCard}" for="${meta.id}">
      <div class="mb-2 flex items-center justify-between gap-3">
        <span class="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-200">
          <span class="min-w-0">${meta.label}</span>
          <span class="${classes.iconTip}" tabindex="0">i<span class="${classes.tooltip}">${meta.desc}</span></span>
        </span>
        <span class="control-display whitespace-nowrap text-xs text-slate-400">${meta.prefix || ''}<span id="${meta.id}Display">${displayValue}</span>${meta.suffix ? ' ' + meta.suffix : ''}</span>
      </div>
      ${controlField}
    </label>
  `;
}

const numberDebounceTimers = new Map();
const NUMBER_INPUT_DEBOUNCE_MS = 500;

export function renderControls({ module, state, onChange }) {
  const controls = document.getElementById('controls');
  const basicControls = module.controls.filter(meta => !meta.advanced);
  const advancedControls = module.controls.filter(meta => meta.advanced);

  controls.innerHTML = `
    <div class="space-y-4">${basicControls.map(meta => renderControl(meta, state, module.id)).join('')}</div>
    ${advancedControls.length ? `
      <details class="rounded-lg border border-white/10 bg-slate-950/40">
        <summary class="flex cursor-pointer items-center justify-between px-3 py-3 text-sm font-semibold text-slate-200">
          <span>Advanced settings</span>
          <span class="text-xs font-normal text-slate-400">Optional</span>
        </summary>
        <div class="space-y-4 border-t border-white/10 p-3">${advancedControls.map(meta => renderControl(meta, state, module.id)).join('')}</div>
      </details>
    ` : ''}
  `;

  controls.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', event => {
      const id = event.target.dataset.id;
      const meta = module.controls.find(item => item.id === id);
      const isNumberInput = event.target.dataset.controlKind === 'number';
      if (isNumberInput) {
        document.getElementById(`${id}Display`).textContent = event.target.value;
        clearTimeout(numberDebounceTimers.get(id));
        numberDebounceTimers.set(id, setTimeout(() => {
          commitNumberInput(event.target, module, state, onChange, { normalizeDisplay: false });
        }, NUMBER_INPUT_DEBOUNCE_MS));
        return;
      }
      const nextValue = meta.type === 'select' ? event.target.value : Number(event.target.value);
      onChange(id, nextValue);
    });
  });

  controls.querySelectorAll('input[data-control-kind="number"]').forEach(input => {
    input.addEventListener('change', event => {
      commitNumberInput(event.target, module, state, onChange);
    });
    input.addEventListener('blur', event => {
      commitNumberInput(event.target, module, state, onChange);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        commitNumberInput(event.currentTarget, module, state, onChange);
        event.currentTarget.blur();
      }
    });
  });

  controls.querySelectorAll('button[data-id]').forEach(button => {
    button.addEventListener('click', event => {
      const id = event.currentTarget.dataset.id;
      onChange(id, !state[id]);
    });
  });
}

function commitNumberInput(input, module, state, onChange, options = {}) {
  if (!input || !input.dataset) return;
  const id = input.dataset.id;
  const meta = module.controls.find(item => item.id === id);
  const normalizeDisplay = options.normalizeDisplay !== false;
  clearTimeout(numberDebounceTimers.get(id));
  numberDebounceTimers.delete(id);
  const currentValue = state[id];
  const nextValue = parseNumberInput(input.value);

  if (!Number.isFinite(nextValue)) {
    if (normalizeDisplay && meta) {
      input.value = formatNumberForInput(meta, currentValue);
      document.getElementById(`${id}Display`).textContent = formatNumberForInput(meta, currentValue);
    }
    return;
  }

  if (Object.is(nextValue, currentValue)) {
    if (normalizeDisplay && meta) {
      input.value = formatNumberForInput(meta, currentValue);
      document.getElementById(`${id}Display`).textContent = formatNumberForInput(meta, currentValue);
    }
    return;
  }

  input.dataset.forceSync = 'true';
  onChange(id, nextValue);
}

function parseNumberInput(value) {
  if (typeof value !== 'string') return Number(value);
  const normalized = value.replace(/,/g, '').replace(/\s/g, '').trim();
  if (normalized === '' || normalized === '-' || normalized === '.') return NaN;
  return Number(normalized);
}

function fractionDigitsForStep(step) {
  const stepString = String(step ?? 1);
  if (!stepString.includes('.')) return 0;
  return stepString.split('.')[1].length;
}

function formatNumberForInput(meta, value) {
  if (!Number.isFinite(Number(value))) return value ?? '';
  const digits = fractionDigitsForStep(meta.step);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  }).format(Number(value));
}

export function syncControl({ module, state, id }) {
  const meta = module.controls.find(item => item.id === id);
  if (!meta) return;

  if (meta.type === 'select') {
    document.getElementById(id).value = state[id];
    document.getElementById(`${id}Display`).textContent = controlDisplayValue(meta, state[id], state, module.id);
    return;
  }

  if (meta.type === 'checkbox') {
    const button = document.getElementById(id);
    const enabled = Boolean(state[id]);
    const disabled = id === 'reinvestIncome' && module.id === 'investment' && (Number(state.incomeYield) <= 0 || state.incomeFrequency === 'none');
    button.setAttribute('aria-pressed', enabled);
    button.disabled = disabled;
    button.textContent = disabled ? 'No income to reinvest' : enabled ? 'Enabled' : 'Disabled';
    button.className = `w-full rounded-md border border-white/10 px-3 py-2 text-sm font-medium transition ${disabled ? 'cursor-not-allowed bg-slate-950/60 text-slate-500' : enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-300'}`;
    document.getElementById(`${id}Display`).textContent = controlDisplayValue(meta, state[id], state, module.id);
    return;
  }

  const min = Number(meta.min);
  const max = Number(meta.max);
  state[id] = Math.min(max, Math.max(min, state[id]));
  const slider = document.getElementById(id);
  if (slider) slider.value = state[id];
  const numberInput = document.getElementById(`${id}Number`);
  const preserveFocusedText = document.activeElement === numberInput && numberInput.dataset.forceSync !== 'true';
  if (!preserveFocusedText) {
    numberInput.value = formatNumberForInput(meta, state[id]);
  }
  delete numberInput.dataset.forceSync;
  document.getElementById(`${id}Display`).textContent = formatNumberForInput(meta, state[id]);
}

export function renderExtraControls({ module, payoutType, onPayoutTypeChange }) {
  const container = document.getElementById('moduleExtraControls');
  if (module.id !== 'pension') {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="mb-4 rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div class="mb-2 flex items-center justify-between gap-3">
        <span class="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-200">
          Payout type
          <span class="${classes.iconTip}" tabindex="0">i<span class="${classes.tooltip}">Choose fixed monthly payouts or payouts that rise with inflation each year.</span></span>
        </span>
      </div>
      <div class="grid grid-cols-2 rounded-md border border-white/10 bg-slate-950/70 p-1">
        <button id="flatBtn" class="rounded px-2 py-1.5 text-xs font-medium transition">Flat nominal</button>
        <button id="indexedBtn" class="rounded px-2 py-1.5 text-xs font-medium transition">Inflation-indexed</button>
      </div>
    </div>
  `;

  updatePayoutButtons(payoutType);
  document.getElementById('flatBtn').addEventListener('click', () => onPayoutTypeChange('flat'));
  document.getElementById('indexedBtn').addEventListener('click', () => onPayoutTypeChange('indexed'));
}

export function updatePayoutButtons(payoutType) {
  const flatButton = document.getElementById('flatBtn');
  const indexedButton = document.getElementById('indexedBtn');
  if (!flatButton || !indexedButton) return;

  const isFlat = payoutType === 'flat';
  flatButton.className = `rounded px-2 py-1.5 text-xs font-medium transition ${isFlat ? 'bg-indigo-500 text-white shadow' : 'text-slate-300 hover:bg-white/10'}`;
  indexedButton.className = `rounded px-2 py-1.5 text-xs font-medium transition ${!isFlat ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:bg-white/10'}`;
}
