import { classes } from './theme.js';

export function renderSchedule({ title, rows, columns }) {
  document.getElementById('tableTitle').textContent = title;
  document.getElementById('scheduleHead').innerHTML = `
    <tr>${columns.map(column => `<th class="px-4 py-3">${column.label}</th>`).join('')}</tr>
  `;
  document.getElementById('scheduleBody').innerHTML = rows.map(row => `
    <tr class="hover:bg-white/[0.04]">
      ${columns.map((column, index) => `<td class="px-4 py-3 ${index === 0 ? 'font-medium text-slate-200' : index === columns.length - 1 ? 'font-medium text-white' : 'text-slate-300'}">${column.format(row[column.key])}</td>`).join('')}
    </tr>
  `).join('');
}

export function renderTableColumnControls({ columns, selectedColumnKeys, onChange }) {
  const container = document.getElementById('tableColumnControls');
  if (!container) return;

  container.innerHTML = `
    <details class="table-column-dropdown">
      <summary class="table-column-trigger">
        <span>Columns</span>
        <span>${selectedColumnKeys.length}/${columns.length}</span>
      </summary>
      <div class="table-column-menu">
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs font-semibold uppercase text-slate-400">Visible columns</span>
          <button id="showAllTableColumns" type="button" class="rounded-md border border-white/10 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-white/10">Show all</button>
        </div>
        <div class="table-column-grid">
          ${columns.map(column => `
            <label class="table-column-option ${classes.controlCard}">
              <input type="checkbox" value="${column.key}" ${selectedColumnKeys.includes(column.key) ? 'checked' : ''}>
              <span>${column.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
    </details>
  `;

  container.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', () => {
      const checkedKeys = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(item => item.value);
      onChange(checkedKeys.length ? checkedKeys : [input.value]);
    });
  });

  document.getElementById('showAllTableColumns')?.addEventListener('click', () => {
    onChange(columns.map(column => column.key));
  });
}
