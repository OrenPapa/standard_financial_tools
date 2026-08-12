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

function renderControl(meta, state, moduleId, options = {}) {
  const value = state[meta.id];
  const disabled = Boolean(options.disabled);
  const incomeIsActive = moduleId === 'investment' && Number(state.incomeYield) > 0 && state.incomeFrequency !== 'none';
  const checkboxDisabled = disabled || (meta.id === 'reinvestIncome' && !incomeIsActive);
  const displayValue = controlDisplayValue(meta, value, state, moduleId);
  const affixedNumberInput = inputMarkup(meta, value, meta.control === 'number' ? 'px-3 py-2 text-right' : 'px-2 py-1.5 text-right', disabled);

  const controlField = meta.type === 'select'
    ? `<select id="${meta.id}" data-id="${meta.id}" ${disabled ? 'disabled' : ''} class="${classes.inputBase} px-2 py-2 disabled:cursor-not-allowed disabled:opacity-60">${meta.options.map(([optionValue, label]) => `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${label}</option>`).join('')}</select>`
    : meta.type === 'checkbox'
      ? `<button id="${meta.id}" data-id="${meta.id}" type="button" aria-pressed="${value}" ${checkboxDisabled ? 'disabled' : ''} class="w-full rounded-md border border-white/10 px-3 py-2 text-sm font-medium transition ${checkboxDisabled ? 'cursor-not-allowed bg-slate-950/60 text-slate-500' : value ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-300'}">${checkboxDisabled ? 'No income to reinvest' : value ? 'Enabled' : 'Disabled'}</button>`
      : meta.control === 'number'
        ? affixedNumberInput
      : `<div class="control-range-grid grid grid-cols-[1fr_88px] items-center gap-3">
          <input id="${meta.id}" data-id="${meta.id}" data-control-kind="range" type="range" min="${meta.min}" max="${meta.max}" step="${meta.step}" value="${value}" ${disabled ? 'disabled' : ''} class="h-2 w-full cursor-pointer rounded-lg bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
          ${affixedNumberInput}
        </div>`;

  return `
    <label class="${classes.controlCard} ${disabled ? 'opacity-60' : ''}" for="${meta.id}">
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

function inputMarkup(meta, value, inputPaddingClasses, disabled = false) {
  const prefix = (meta.prefix || '').trim() === 'EUR' ? '€' : (meta.prefix || '').trim();
  const suffix = (meta.suffix || '').trim();
  const hasPrefix = Boolean(prefix);
  const hasSuffix = Boolean(suffix);
  const paddingClasses = [
    inputPaddingClasses,
    hasPrefix ? 'pl-8' : '',
    hasSuffix ? suffix.length > 3 ? 'pr-12' : 'pr-9' : ''
  ].filter(Boolean).join(' ');

  return `
    <span class="input-affix-shell relative block">
      ${hasPrefix ? `<span class="input-affix input-affix-prefix">${prefix}</span>` : ''}
      <input id="${meta.id}Number" data-id="${meta.id}" data-control-kind="number" type="text" inputmode="decimal" value="${formatNumberForInput(meta, value)}" ${disabled ? 'disabled' : ''} class="${classes.inputBase} numeric-input ${paddingClasses} disabled:cursor-not-allowed disabled:opacity-60">
      ${hasSuffix ? `<span class="input-affix input-affix-suffix">${suffix}</span>` : ''}
    </span>
  `;
}

const numberDebounceTimers = new Map();
const NUMBER_INPUT_DEBOUNCE_MS = 500;
const NUMERIC_INPUT_PATTERN = /^-?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;

export function renderControls({ module, state, onChange, advancedEnabled = false, onAdvancedToggle }) {
  const controls = document.getElementById('controls');
  const basicControls = module.controls.filter(meta => !meta.advanced);
  const advancedControls = module.controls.filter(meta => meta.advanced);

  controls.innerHTML = `
    <div class="space-y-4">${basicControls.map(meta => renderControl(meta, state, module.id)).join('')}</div>
    ${advancedControls.length ? `
      <section class="advanced-settings rounded-lg border border-white/10 bg-slate-950/40" aria-label="Advanced settings">
        <div class="flex items-center justify-between gap-3 px-3 py-3">
          <span class="min-w-0 text-sm font-semibold text-slate-200">Advanced settings <span class="text-xs font-normal text-slate-400">(optional)</span></span>
          <button id="${module.id}AdvancedToggle" data-advanced-toggle type="button" role="switch" aria-checked="${advancedEnabled}" aria-expanded="${advancedEnabled}" aria-controls="${module.id}AdvancedFields" aria-label="Toggle advanced settings" class="inline-flex shrink-0 items-center p-0">
            <span class="relative h-5 w-9 rounded-full transition ${advancedEnabled ? 'bg-emerald-500' : 'bg-slate-700'}">
              <span class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${advancedEnabled ? 'left-[1.125rem]' : 'left-0.5'}"></span>
            </span>
          </button>
        </div>
        ${advancedEnabled ? `<div id="${module.id}AdvancedFields" class="space-y-4 border-t border-white/10 p-3">${advancedControls.map(meta => renderControl(meta, state, module.id)).join('')}</div>` : ''}
      </section>
    ` : ''}
  `;

  controls.querySelectorAll('button[data-advanced-toggle]').forEach(button => {
    button.addEventListener('click', () => {
      onAdvancedToggle?.(!advancedEnabled);
    });
  });

  controls.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', event => {
      const id = event.target.dataset.id;
      const meta = module.controls.find(item => item.id === id);
      const isNumberInput = event.target.dataset.controlKind === 'number';
      if (isNumberInput) {
        const sanitizedValue = sanitizeNumberInputText(event.target.value, meta);
        if (event.target.value !== sanitizedValue) {
          const cursor = event.target.selectionStart ?? sanitizedValue.length;
          const removedBeforeCursor = event.target.value.slice(0, cursor).length - sanitizedValue.slice(0, cursor).length;
          event.target.value = sanitizedValue;
          const nextCursor = Math.max(0, cursor - Math.max(0, removedBeforeCursor));
          event.target.setSelectionRange?.(nextCursor, nextCursor);
        }
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
  onChange(id, clampNumberToMeta(meta, nextValue));
}

export function parseNumberInput(value) {
  if (typeof value !== 'string') return Number(value);
  const compact = value.replace(/\s/g, '').trim();
  if (compact === '') return 0;
  if (compact === '-' || compact === '.' || compact === ',') return NaN;
  if (!isSafeNumberInput(compact)) return NaN;
  const normalized = normalizeNumericSeparators(compact);
  return Number(normalized);
}

export function sanitizeNumberInputText(value, meta = {}) {
  const text = String(value ?? '');
  const allowsNegative = Number(meta.min) < 0;
  let sanitized = '';
  let hasSign = false;

  for (const char of text) {
    if (/\d/.test(char)) {
      sanitized += char;
      continue;
    }

    if (char === '.' || char === ',') {
      sanitized += char;
      continue;
    }

    if (char === '-' && allowsNegative && !hasSign && sanitized.length === 0) {
      sanitized += char;
      hasSign = true;
    }
  }

  return sanitized;
}

export function validateNumericState(module, state) {
  const changed = [];

  module.controls
    .filter(isNumericControl)
    .forEach(meta => {
      const fallback = Number(module.defaultState?.[meta.id] ?? meta.min ?? 0);
      const parsedValue = typeof state[meta.id] === 'string' ? parseNumberInput(state[meta.id]) : Number(state[meta.id]);
      const safeValue = Number.isFinite(parsedValue) ? parsedValue : fallback;
      const nextValue = clampNumberToMeta(meta, safeValue);

      if (!Object.is(state[meta.id], nextValue)) {
        state[meta.id] = nextValue;
        changed.push(meta.id);
      }
    });

  return changed;
}

export function clampNumberToMeta(meta, value) {
  if (!meta) return value;
  const number = Number(value);
  if (!Number.isFinite(number)) return Number(meta.min ?? 0);
  const min = Number.isFinite(Number(meta.min)) ? Number(meta.min) : -Infinity;
  const max = Number.isFinite(Number(meta.max)) ? Number(meta.max) : Infinity;
  return Math.min(max, Math.max(min, number));
}

function isNumericControl(meta) {
  return meta.type !== 'select' && meta.type !== 'checkbox';
}

function isSafeNumberInput(value) {
  const unsigned = value.startsWith('-') ? value.slice(1) : value;
  const separatorCount = (unsigned.match(/[.,]/g) || []).length;

  if (!NUMERIC_INPUT_PATTERN.test(value)) {
    const groupedPattern = /^-?\d{1,3}([.,]\d{3})+([.,]\d+)?$/;
    if (!groupedPattern.test(value)) return false;
  }

  if (separatorCount > 1) {
    const lastSeparatorIndex = Math.max(unsigned.lastIndexOf('.'), unsigned.lastIndexOf(','));
    const thousandsPart = unsigned.slice(0, lastSeparatorIndex);
    const decimalPart = unsigned.slice(lastSeparatorIndex + 1);
    return /^[.,]?\d/.test(unsigned)
      && /^\d{1,3}([.,]\d{3})+$/.test(thousandsPart)
      && /^\d+$/.test(decimalPart);
  }

  return true;
}

function normalizeNumericSeparators(value) {
  const commaCount = (value.match(/,/g) || []).length;
  const dotCount = (value.match(/\./g) || []).length;

  if (commaCount && dotCount) {
    const decimalSeparator = value.lastIndexOf(',') > value.lastIndexOf('.') ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    return value.split(thousandsSeparator).join('').replace(decimalSeparator, '.');
  }

  if (commaCount) {
    return normalizeSingleSeparator(value, ',');
  }

  if (dotCount > 1) {
    return normalizeSingleSeparator(value, '.');
  }

  return value;
}

function normalizeSingleSeparator(value, separator) {
  const parts = value.split(separator);
  const sign = parts[0].startsWith('-') ? '-' : '';
  const firstGroup = sign ? parts[0].slice(1) : parts[0];
  const restGroups = parts.slice(1);
  const looksLikeThousands = restGroups.length > 0
    && restGroups.every(group => /^\d{3}$/.test(group))
    && /^\d+$/.test(firstGroup);

  if (looksLikeThousands) {
    return sign + firstGroup + restGroups.join('');
  }

  return value.replace(separator, '.');
}

function fractionDigitsForStep(step) {
  const stepString = String(step ?? 1);
  if (!stepString.includes('.')) return 0;
  return stepString.split('.')[1].length;
}

function formatNumberForInput(meta, value) {
  if (!Number.isFinite(Number(value))) return value ?? '';
  if (isYearInput(meta)) return String(Math.round(Number(value)));

  const digits = fractionDigitsForStep(meta.step);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  }).format(Number(value));
}

function isYearInput(meta) {
  return meta.id.toLowerCase().includes('year') && !meta.prefix;
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
  flatButton.className = `rounded px-2 py-1.5 text-xs font-medium transition ${isFlat ? classes.activePrimaryTab : classes.inactiveTab}`;
  indexedButton.className = `rounded px-2 py-1.5 text-xs font-medium transition ${!isFlat ? classes.activeSecondaryTab : classes.inactiveTab}`;
}
