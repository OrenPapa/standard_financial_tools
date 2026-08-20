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

function monthPickerLabel(values, options) {
  const selectedValues = new Set((Array.isArray(values) ? values : []).map(String));
  const selectedLabels = options
    .filter(([optionValue]) => selectedValues.has(String(optionValue)))
    .map(([, label]) => label);

  if (!selectedLabels.length) return 'Select months';
  if (selectedLabels.length <= 2) return selectedLabels.join(', ');
  return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;
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

function forecastPeriodValue(state) {
  return `${state.projectionUnit === 'years' ? 'years' : 'months'}:${Number(state.projectionLength) || 12}`;
}

function forecastPeriodField(state, module) {
  return `
    <label class="budget-control-card rounded-lg border border-white/10 bg-white/[0.04] p-3" for="budgetProjectionPeriod">
      <span class="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-200">
        <span>Forecast period</span>
        ${tooltip(module.fieldMeta.projectionLength.desc)}
      </span>
      ${selectMarkup({
        id: 'budgetProjectionPeriod',
        value: forecastPeriodValue(state),
        options: module.forecastPeriodOptions,
        dataset: 'data-budget-field="projectionPeriod"'
      })}
    </label>
  `;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function optionLabel(value, options) {
  return options.find(([optionValue]) => optionValue === value)?.[1] || value;
}

function rowLabel(row, options) {
  return row.name || optionLabel(row.type, options);
}

function rowScheduleLabel(row, module) {
  if (row.frequency !== 'oneTime') {
    return optionLabel(row.frequency, module.frequencyOptions);
  }

  return `Selected months: ${monthPickerLabel(row.oneTimeMonths || [], module.monthOptions)}`;
}

function budgetRow({ kind, row, index, module, canRemove }) {
  const typeOptions = kind === 'income' ? module.incomeTypeOptions : module.expenseTypeOptions;
  const toneClass = kind === 'income' ? 'budget-row-income' : 'budget-row-expense';

  return `
    <div class="budget-row budget-summary-row ${toneClass} rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div class="budget-summary-main min-w-0">
        <span class="budget-summary-icon budget-summary-icon-${kind}" aria-hidden="true"></span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-white">${escapeHtml(rowLabel(row, typeOptions))}</p>
          <p class="mt-1 truncate text-xs text-slate-400">${escapeHtml(rowScheduleLabel(row, module))}</p>
        </div>
      </div>
      <p class="budget-summary-amount">${formatCurrency(row.amount)}</p>
      <div class="budget-summary-actions">
        <button type="button" data-budget-edit-kind="${kind}" data-budget-edit-index="${index}" class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">Edit</button>
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
        <button type="button" data-budget-add-kind="${kind}" class="budget-add-button budget-add-button-${kind} rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">
          <span class="budget-add-plus" aria-hidden="true"></span>
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

export function renderBudgetBuilder({ module, state, onFieldChange, onAddRow, onUpdateRow, onRemoveRow, onReset, onCalculate }) {
  const container = document.getElementById('comparisonBuilder');
  const incomes = Array.isArray(state.incomes) ? state.incomes : [];
  const expenses = Array.isArray(state.expenses) ? state.expenses : [];

  container.classList.remove('hidden');
  container.innerHTML = `
    <details class="budget-builder" open>
      <summary class="mortgage-comparison-summary cursor-pointer">
        <div class="flex items-center justify-between gap-3">
          <h2 class="min-w-0 text-lg font-semibold text-white">Budget Projection</h2>
          <span class="mortgage-comparison-caret" aria-hidden="true"></span>
        </div>
        <p class="text-sm text-slate-400">Track recurring income and expenses, then forecast the future balance.</p>
      </summary>
      <div class="mt-4 grid gap-4">
        <section class="budget-group">
          <div class="mb-3">
            <h3 class="text-sm font-semibold text-white">Starting Balance</h3>
            <p class="mt-1 text-xs leading-5 text-slate-400">Set today&apos;s balance and how far ahead you want the forecast to run.</p>
          </div>
        <div class="budget-settings-grid">
          ${topField({
            id: 'budgetStartingBalance',
            label: 'Starting balance',
            value: state.startingBalance,
            meta: module.fieldMeta.startingBalance
          })}
          ${forecastPeriodField(state, module)}
        </div>
        </section>
        ${rowSection({
          title: 'Income',
          description: 'Add salary, investment income, bonuses, or any other money coming in. Use Selected months for income such as yearly or twice-yearly bonuses.',
          kind: 'income',
          rows: incomes,
          module,
          onAddLabel: 'Add income'
        })}
        ${rowSection({
          title: 'Expenses',
          description: 'Add recurring bills and spending, plus scheduled purchases or payments in selected months.',
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
    input.addEventListener('blur', event => commitBudgetInput(event.target, module, onFieldChange));
    input.addEventListener('change', event => commitBudgetInput(event.target, module, onFieldChange));
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      commitBudgetInput(event.currentTarget, module, onFieldChange);
      event.currentTarget.blur();
    });
  });

  container.querySelectorAll('select[data-budget-field]').forEach(select => {
    select.addEventListener('change', event => {
      if (event.target.dataset.budgetField === 'projectionPeriod') {
        const [unit, length] = event.target.value.split(':');
        onFieldChange('projectionUnit', unit);
        onFieldChange('projectionLength', Number(length));
        return;
      }

      onFieldChange(event.target.dataset.budgetField, event.target.value);
    });
  });

  container.querySelectorAll('button[data-budget-add-kind]').forEach(button => {
    button.addEventListener('click', () => {
      commitBudgetInputs(container, module, onFieldChange);
      const kind = button.dataset.budgetAddKind;
      openBudgetEntryModal({
        module,
        kind,
        onConfirm(row) {
          onAddRow(kind, row);
        }
      });
    });
  });

  container.querySelectorAll('button[data-budget-edit-kind]').forEach(button => {
    button.addEventListener('click', () => {
      commitBudgetInputs(container, module, onFieldChange);
      const kind = button.dataset.budgetEditKind;
      const index = Number(button.dataset.budgetEditIndex);
      const rows = kind === 'income' ? incomes : expenses;
      openBudgetEntryModal({
        module,
        kind,
        row: rows[index],
        index,
        onConfirm(row) {
          onUpdateRow(kind, index, row);
        }
      });
    });
  });

  container.querySelectorAll('button[data-budget-remove-kind]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      commitBudgetInputs(container, module, onFieldChange);
      onRemoveRow(button.dataset.budgetRemoveKind, Number(button.dataset.budgetRemoveIndex));
    });
  });

  document.getElementById('resetBudgetBtn')?.addEventListener('click', onReset);
  document.getElementById('calculateBudgetBtn')?.addEventListener('click', () => {
    commitBudgetInputs(container, module, onFieldChange);
    onCalculate();
  });
}

export function hideBudgetBuilder() {
  const container = document.getElementById('comparisonBuilder');
  if (!container) return;
  container.classList.add('hidden');
  container.innerHTML = '';
}

function emptyBudgetRow(kind, module) {
  return {
    type: kind === 'income' ? module.incomeTypeOptions[0]?.[0] : module.expenseTypeOptions[0]?.[0],
    name: '',
    amount: 0,
    frequency: 'monthly',
    oneTimeMonth: 1,
    oneTimeMonths: [1]
  };
}

function openBudgetEntryModal({ module, kind, row = null, index = null, onConfirm }) {
  const draft = { ...emptyBudgetRow(kind, module), ...(row || {}) };
  const typeOptions = kind === 'income' ? module.incomeTypeOptions : module.expenseTypeOptions;
  const selectedMonths = new Set((Array.isArray(draft.oneTimeMonths) ? draft.oneTimeMonths : [draft.oneTimeMonth ?? 1]).map(String));
  const title = `${index === null ? 'Add' : 'Edit'} ${kind}`;
  const modal = document.createElement('div');

  modal.className = 'budget-modal-backdrop';
  modal.innerHTML = `
    <div class="budget-modal" role="dialog" aria-modal="true" aria-labelledby="budgetModalTitle">
      <form data-budget-entry-form>
        <div class="budget-modal-header">
          <h3 id="budgetModalTitle">${title}</h3>
          <button type="button" data-budget-modal-close aria-label="Close ${title}" class="budget-modal-icon-button">X</button>
        </div>
        <div class="budget-modal-body">
          <label class="budget-row-field" for="budgetModalType">
            ${fieldLabel(kind === 'income' ? 'Income type' : 'Expense type', kind === 'income' ? 'Select the source of this money coming in.' : 'Select the category for this money going out.')}
            ${selectMarkup({
              id: 'budgetModalType',
              value: draft.type,
              options: typeOptions,
              dataset: 'data-budget-modal-field="type"'
            })}
          </label>
          <label class="budget-row-field budget-modal-custom-name ${draft.type !== 'custom' ? 'hidden' : ''}" for="budgetModalName">
            ${fieldLabel('Custom name', kind === 'income' ? 'Name this custom income, such as Year-end bonus.' : 'Name this custom expense, such as New Phone.')}
            ${textInput({
              id: 'budgetModalName',
              value: draft.name || '',
              placeholder: kind === 'income' ? 'e.g. Year-end bonus' : 'e.g. New Phone',
              dataset: 'data-budget-modal-field="name"'
            })}
          </label>
          <label class="budget-row-field" for="budgetModalAmount">
            ${fieldLabel('Amount', 'Use the amount for the selected frequency. For selected-month rows, use the amount paid in each selected month.')}
            ${numericInput({
              id: 'budgetModalAmount',
              value: draft.amount,
              meta: module.fieldMeta.rowAmount,
              dataset: 'data-budget-modal-field="amount"'
            })}
          </label>
          <label class="budget-row-field" for="budgetModalFrequency">
            ${fieldLabel('Frequency', 'Choose how often this row happens. Selected-month rows happen in each selected calendar month.')}
            ${selectMarkup({
              id: 'budgetModalFrequency',
              value: draft.frequency,
              options: module.frequencyOptions,
              dataset: 'data-budget-modal-field="frequency"'
            })}
          </label>
          <div class="budget-modal-months ${draft.frequency !== 'oneTime' ? 'hidden' : ''}">
            ${fieldLabel(kind === 'income' ? 'Income months' : 'Expense months', 'Choose every calendar month when this income or expense happens.')}
            <div class="budget-modal-month-grid">
              ${module.monthOptions.map(([month, label]) => `
                <label class="budget-month-option" for="budgetModalMonth${month}">
                  <input id="budgetModalMonth${month}" type="checkbox" value="${month}" ${selectedMonths.has(String(month)) ? 'checked' : ''} data-budget-modal-month>
                  <span>${label}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="budget-modal-actions">
          <button type="button" data-budget-modal-close class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10">Cancel</button>
          <button type="submit" class="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-900">Confirm</button>
        </div>
      </form>
    </div>
  `;

  document.body.append(modal);

  const typeSelect = modal.querySelector('[data-budget-modal-field="type"]');
  const nameInput = modal.querySelector('[data-budget-modal-field="name"]');
  const amountInput = modal.querySelector('[data-budget-modal-field="amount"]');
  const frequencySelect = modal.querySelector('[data-budget-modal-field="frequency"]');
  const customName = modal.querySelector('.budget-modal-custom-name');
  const months = modal.querySelector('.budget-modal-months');

  const close = () => {
    document.removeEventListener('keydown', onKeydown);
    modal.remove();
  };

  const onKeydown = event => {
    if (event.key === 'Escape') close();
  };

  document.addEventListener('keydown', onKeydown);
  modal.querySelectorAll('[data-budget-modal-close]').forEach(button => {
    button.addEventListener('click', close);
  });
  modal.addEventListener('mousedown', event => {
    if (event.target === modal) close();
  });

  amountInput?.addEventListener('input', event => {
    const sanitizedValue = sanitizeNumberInputText(event.target.value, module.fieldMeta.rowAmount);
    if (event.target.value !== sanitizedValue) {
      const cursor = event.target.selectionStart ?? sanitizedValue.length;
      event.target.value = sanitizedValue;
      event.target.setSelectionRange?.(Math.min(cursor, sanitizedValue.length), Math.min(cursor, sanitizedValue.length));
    }
  });

  typeSelect?.addEventListener('change', event => {
    customName?.classList.toggle('hidden', event.target.value !== 'custom');
    if (event.target.value === 'custom') nameInput?.focus();
  });

  frequencySelect?.addEventListener('change', event => {
    months?.classList.toggle('hidden', event.target.value !== 'oneTime');
  });

  modal.querySelector('[data-budget-entry-form]')?.addEventListener('submit', event => {
    event.preventDefault();
    const parsedAmount = parseNumberInput(amountInput?.value);
    const amount = Number.isFinite(parsedAmount)
      ? clampNumberToMeta(module.fieldMeta.rowAmount, parsedAmount)
      : 0;
    const oneTimeMonths = Array.from(modal.querySelectorAll('[data-budget-modal-month]:checked'))
      .map(input => Number(input.value));

    amountInput.value = formatNumberForInput(module.fieldMeta.rowAmount, amount);
    onConfirm({
      type: typeSelect.value,
      name: typeSelect.value === 'custom' ? nameInput.value.trim() : '',
      amount,
      frequency: frequencySelect.value,
      oneTimeMonth: oneTimeMonths[0] ?? 1,
      oneTimeMonths
    });
    close();
  });

  requestAnimationFrame(() => {
    typeSelect?.focus();
  });
}

function metaForInput(input, module) {
  if (input.dataset.budgetField === 'budgetStartingBalance') return module.fieldMeta.startingBalance;
  return module.fieldMeta.rowAmount;
}

function commitBudgetInput(input, module, onFieldChange) {
  const meta = metaForInput(input, module);
  const parsedValue = parseNumberInput(input.value);
  if (!Number.isFinite(parsedValue)) return;
  const value = clampNumberToMeta(meta, parsedValue);

  input.value = formatNumberForInput(meta, value);

  if (input.dataset.budgetField === 'budgetStartingBalance') {
    onFieldChange('startingBalance', value);
    return;
  }
}

function commitBudgetInputs(container, module, onFieldChange) {
  container.querySelectorAll('input[data-budget-number]').forEach(input => {
    commitBudgetInput(input, module, onFieldChange);
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
