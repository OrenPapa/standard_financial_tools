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
