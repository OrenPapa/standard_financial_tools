import { clampNumberToMeta, formatNumberForInput, parseNumberInput, sanitizeNumberInputText } from './controls.js';
import { classes } from './theme.js';

function prefixFor(meta) {
  return (meta.prefix || '').trim() === 'EUR' ? '&euro;' : (meta.prefix || '').trim();
}

function tooltip(text) {
  return `<span class="${classes.iconTip}" tabindex="0">i<span class="${classes.tooltip}">${text}</span></span>`;
}

function fieldLabel(label, tip) {
  return `
    <span class="budget-field-label">
      <span>${label}</span>
      ${tip ? tooltip(tip) : ''}
    </span>
  `;
}

function numericInput({ id, value, meta, dataset = '', disabled = false }) {
  const prefix = prefixFor(meta);
  const suffix = (meta.suffix || '').trim();
  const paddingClasses = [
    'px-3 py-2 text-right',
    prefix ? 'pl-8' : '',
    suffix ? 'pr-9' : ''
  ].filter(Boolean).join(' ');

  return `
    <span class="input-affix-shell relative block">
      ${prefix ? `<span class="input-affix input-affix-prefix">${prefix}</span>` : ''}
      <input id="${id}" ${dataset} data-budget-number type="text" inputmode="decimal" value="${formatNumberForInput(meta, value)}" ${disabled ? 'disabled' : ''} class="${classes.inputBase} numeric-input ${paddingClasses} disabled:cursor-not-allowed disabled:opacity-60">
      ${suffix ? `<span class="input-affix input-affix-suffix">${suffix}</span>` : ''}
    </span>
  `;
}

function selectMarkup({ id, value, options, dataset = '' }) {
  return `
    <select id="${id}" ${dataset} class="${classes.inputBase} px-2 py-2">
      ${options.map(([optionValue, label]) => `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${label}</option>`).join('')}
    </select>
  `;
}

function textInput({ id, value, dataset = '', placeholder = '' }) {
  return `
    <input id="${id}" ${dataset} type="text" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" class="${classes.inputBase} px-3 py-2">
  `;
}

function topField({ id, label, value, meta }) {
  return `
    <label class="budget-control-card rounded-lg border border-white/10 bg-white/[0.04] p-3" for="${id}">
      <span class="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-200">
        <span>${label}</span>
        ${tooltip(meta.desc)}
      </span>
      ${numericInput({
        id,
        value,
        meta,
        dataset: `data-budget-field="${id}"`
      })}
    </label>
  `;
}

function projectionUnitField(value) {
  return `
    <label class="budget-control-card rounded-lg border border-white/10 bg-white/[0.04] p-3" for="budgetProjectionUnit">
      <span class="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-200">
        <span>Forecast unit</span>
        ${tooltip('Choose whether the forecast length is counted in months or years.')}
      </span>
      ${selectMarkup({
        id: 'budgetProjectionUnit',
        value,
        options: [['months', 'Months'], ['years', 'Years']],
        dataset: 'data-budget-field="projectionUnit"'
      })}
    </label>
  `;
}

function budgetRow({ kind, row, index, module, canRemove }) {
  const typeOptions = kind === 'income' ? module.incomeTypeOptions : module.expenseTypeOptions;
  const typeLabel = kind === 'income' ? 'Income type' : 'Expense type';
  const oneTimeMonthDisabled = row.frequency !== 'oneTime';
  const customNameHidden = row.type !== 'custom';
  const monthLabel = kind === 'income' ? 'Income month' : 'Expense month';

  return `
    <div class="budget-row rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div class="budget-row-grid">
        <label class="budget-row-field" for="${kind}${index}Type">
          ${fieldLabel(typeLabel, kind === 'income' ? 'Select the source of this money coming in.' : 'Select the category for this money going out.')}
          ${selectMarkup({
            id: `${kind}${index}Type`,
            value: row.type,
            options: typeOptions,
            dataset: `data-budget-row-kind="${kind}" data-budget-row-index="${index}" data-budget-row-field="type"`
          })}
        </label>
        <label class="budget-row-field budget-custom-name ${customNameHidden ? 'hidden' : ''}" for="${kind}${index}Name">
          ${fieldLabel('Custom name', kind === 'income' ? 'Name this custom income, such as Year-end bonus.' : 'Name this custom expense, such as New Phone.')}
          ${textInput({
            id: `${kind}${index}Name`,
            value: row.name || '',
            placeholder: kind === 'income' ? 'e.g. Year-end bonus' : 'e.g. New Phone',
            dataset: `data-budget-row-kind="${kind}" data-budget-row-index="${index}" data-budget-row-field="name"`
          })}
        </label>
        <label class="budget-row-field" for="${kind}${index}Amount">
          ${fieldLabel('Amount', 'Use the amount for the selected frequency. For one-time rows, use the full one-off amount.')}
          ${numericInput({
            id: `${kind}${index}Amount`,
            value: row.amount,
            meta: module.fieldMeta.rowAmount,
            dataset: `data-budget-row-kind="${kind}" data-budget-row-index="${index}" data-budget-row-field="amount"`
          })}
        </label>
        <label class="budget-row-field" for="${kind}${index}Frequency">
          ${fieldLabel('Frequency', 'Choose how often this row happens. One-time rows happen once in the selected month.')}
          ${selectMarkup({
            id: `${kind}${index}Frequency`,
            value: row.frequency,
            options: module.frequencyOptions,
            dataset: `data-budget-row-kind="${kind}" data-budget-row-index="${index}" data-budget-row-field="frequency"`
          })}
        </label>
        <label class="budget-row-field budget-one-time-month ${oneTimeMonthDisabled ? 'hidden' : ''}" for="${kind}${index}OneTimeMonth">
          ${fieldLabel(monthLabel, 'For one-time rows, choose the forecast month when the income or expense happens.')}
          ${numericInput({
            id: `${kind}${index}OneTimeMonth`,
            value: row.oneTimeMonth ?? 1,
            meta: module.fieldMeta.oneTimeMonth,
            disabled: oneTimeMonthDisabled,
            dataset: `data-budget-row-kind="${kind}" data-budget-row-index="${index}" data-budget-row-field="oneTimeMonth"`
          })}
        </label>
        <button type="button" aria-label="Remove ${kind} row" title="Remove row" data-budget-remove-kind="${kind}" data-budget-remove-index="${index}" ${canRemove ? '' : 'disabled'} class="budget-row-remove flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-sm font-semibold leading-none text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50">X</button>
      </div>
    </div>
  `;
}

function rowSection({ title, description, kind, rows, module, onAddLabel }) {
  return `
    <section class="budget-group">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold text-white">${title}</h3>
          <p class="mt-1 text-xs leading-5 text-slate-400">${description}</p>
        </div>
        <button type="button" data-budget-add-kind="${kind}" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
          <span class="budget-add-full">${onAddLabel}</span>
          <span class="budget-add-short">Add</span>
        </button>
      </div>
      <div class="grid gap-2.5">
        ${rows.map((row, index) => budgetRow({
          kind,
          row,
          index,
          module,
          canRemove: rows.length > 1
        })).join('')}
      </div>
    </section>
  `;
}

export function renderBudgetBuilder({ module, state, onFieldChange, onRowChange, onAddRow, onRemoveRow, onReset, onCalculate }) {
  const container = document.getElementById('comparisonBuilder');
  const incomes = Array.isArray(state.incomes) ? state.incomes : [];
  const expenses = Array.isArray(state.expenses) ? state.expenses : [];

  container.classList.remove('hidden');
  container.innerHTML = `
    <details class="budget-builder" open>
      <summary class="mortgage-comparison-summary cursor-pointer">
        <div class="flex items-center justify-between gap-3">
          <h2 class="min-w-0 text-lg font-semibold text-white">Budget</h2>
          <span class="mortgage-comparison-caret" aria-hidden="true"></span>
        </div>
        <p class="text-sm text-slate-400">Track recurring income and expenses, then forecast the future balance.</p>
      </summary>
      <div class="mt-4 grid gap-4">
        <section class="budget-group">
          <div class="mb-3">
            <h3 class="text-sm font-semibold text-white">Starting Budget</h3>
            <p class="mt-1 text-xs leading-5 text-slate-400">Set today&apos;s balance and how far ahead you want the forecast to run.</p>
          </div>
        <div class="budget-settings-grid">
          ${topField({
            id: 'budgetStartingBalance',
            label: 'Starting balance',
            value: state.startingBalance,
            meta: module.fieldMeta.startingBalance
          })}
          ${topField({
            id: 'budgetProjectionLength',
            label: 'Forecast length',
            value: state.projectionLength,
            meta: module.fieldMeta.projectionLength
          })}
          ${projectionUnitField(state.projectionUnit)}
        </div>
        </section>
        ${rowSection({
          title: 'Income',
          description: 'Add salary, investment income, bonuses, or any other money coming in. Use One-time for income such as a yearly bonus.',
          kind: 'income',
          rows: incomes,
          module,
          onAddLabel: 'Add income'
        })}
        ${rowSection({
          title: 'Expenses',
          description: 'Add recurring bills and spending, plus one-off purchases such as a phone, repair, or trip.',
          kind: 'expense',
          rows: expenses,
          module,
          onAddLabel: 'Add expense'
        })}
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button id="resetBudgetBtn" type="button" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">Reset</button>
          <button id="calculateBudgetBtn" type="button" class="rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-900">Calculate</button>
        </div>
      </div>
    </details>
  `;

  container.querySelectorAll('input[data-budget-number]').forEach(input => {
    input.addEventListener('input', event => {
      const meta = metaForInput(event.target, module);
      const sanitizedValue = sanitizeNumberInputText(event.target.value, meta);
      if (event.target.value !== sanitizedValue) {
        const cursor = event.target.selectionStart ?? sanitizedValue.length;
        event.target.value = sanitizedValue;
        event.target.setSelectionRange?.(Math.min(cursor, sanitizedValue.length), Math.min(cursor, sanitizedValue.length));
      }
    });
    input.addEventListener('blur', event => commitBudgetInput(event.target, module, onFieldChange, onRowChange));
    input.addEventListener('change', event => commitBudgetInput(event.target, module, onFieldChange, onRowChange));
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      commitBudgetInput(event.currentTarget, module, onFieldChange, onRowChange);
      event.currentTarget.blur();
    });
  });

  container.querySelectorAll('select[data-budget-field]').forEach(select => {
    select.addEventListener('change', event => onFieldChange(event.target.dataset.budgetField, event.target.value));
  });

  container.querySelectorAll('select[data-budget-row-field]').forEach(select => {
    select.addEventListener('change', event => {
      onRowChange(
        event.target.dataset.budgetRowKind,
        Number(event.target.dataset.budgetRowIndex),
        event.target.dataset.budgetRowField,
        event.target.value
      );

      if (event.target.dataset.budgetRowField === 'frequency') {
        syncOneTimeMonthInput(container, event.target, event.target.value === 'oneTime');
      }

      if (event.target.dataset.budgetRowField === 'type') {
        syncCustomNameInput(container, event.target, event.target.value === 'custom');
      }
    });
  });

  container.querySelectorAll('input[type="text"][data-budget-row-field="name"]').forEach(input => {
    input.addEventListener('input', event => {
      onRowChange(
        event.target.dataset.budgetRowKind,
        Number(event.target.dataset.budgetRowIndex),
        event.target.dataset.budgetRowField,
        event.target.value
      );
    });
  });

  container.querySelectorAll('button[data-budget-add-kind]').forEach(button => {
    button.addEventListener('click', () => {
      commitBudgetInputs(container, module, onFieldChange, onRowChange);
      onAddRow(button.dataset.budgetAddKind);
    });
  });

  container.querySelectorAll('button[data-budget-remove-kind]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      commitBudgetInputs(container, module, onFieldChange, onRowChange);
      onRemoveRow(button.dataset.budgetRemoveKind, Number(button.dataset.budgetRemoveIndex));
    });
  });

  document.getElementById('resetBudgetBtn')?.addEventListener('click', onReset);
  document.getElementById('calculateBudgetBtn')?.addEventListener('click', () => {
    commitBudgetInputs(container, module, onFieldChange, onRowChange);
    onCalculate();
  });
}

export function hideBudgetBuilder() {
  const container = document.getElementById('comparisonBuilder');
  if (!container) return;
  container.classList.add('hidden');
  container.innerHTML = '';
}

function metaForInput(input, module) {
  if (input.dataset.budgetField === 'budgetStartingBalance') return module.fieldMeta.startingBalance;
  if (input.dataset.budgetField === 'budgetProjectionLength') return module.fieldMeta.projectionLength;
  if (input.dataset.budgetRowField === 'oneTimeMonth') return module.fieldMeta.oneTimeMonth;
  return module.fieldMeta.rowAmount;
}

function commitBudgetInput(input, module, onFieldChange, onRowChange) {
  const meta = metaForInput(input, module);
  const parsedValue = parseNumberInput(input.value);
  if (!Number.isFinite(parsedValue)) return;
  const value = meta.id === 'projectionLength' || meta.id === 'oneTimeMonth'
    ? Math.round(clampNumberToMeta(meta, parsedValue))
    : clampNumberToMeta(meta, parsedValue);

  input.value = formatNumberForInput(meta, value);

  if (input.dataset.budgetField === 'budgetStartingBalance') {
    onFieldChange('startingBalance', value);
    return;
  }

  if (input.dataset.budgetField === 'budgetProjectionLength') {
    onFieldChange('projectionLength', value);
    return;
  }

  onRowChange(
    input.dataset.budgetRowKind,
    Number(input.dataset.budgetRowIndex),
    input.dataset.budgetRowField,
    value
  );
}

function commitBudgetInputs(container, module, onFieldChange, onRowChange) {
  container.querySelectorAll('input[data-budget-number]').forEach(input => {
    commitBudgetInput(input, module, onFieldChange, onRowChange);
  });
}

function syncOneTimeMonthInput(container, frequencySelect, enabled) {
  const monthInput = container.querySelector(
    `input[data-budget-row-kind="${frequencySelect.dataset.budgetRowKind}"][data-budget-row-index="${frequencySelect.dataset.budgetRowIndex}"][data-budget-row-field="oneTimeMonth"]`
  );
  if (!monthInput) return;
  monthInput.disabled = !enabled;
  monthInput.closest('label')?.classList.toggle('hidden', !enabled);
}

function syncCustomNameInput(container, typeSelect, enabled) {
  const nameInput = container.querySelector(
    `input[data-budget-row-kind="${typeSelect.dataset.budgetRowKind}"][data-budget-row-index="${typeSelect.dataset.budgetRowIndex}"][data-budget-row-field="name"]`
  );
  if (!nameInput) return;
  nameInput.closest('label')?.classList.toggle('hidden', !enabled);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
