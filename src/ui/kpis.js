export function renderKpis(items) {
  document.getElementById('kpiGrid').innerHTML = items.map((item, index) => `
    <article class="flex min-h-[172px] flex-col rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div class="kpi-label flex items-center justify-between gap-2">
        <p class="text-xs font-medium uppercase tracking-wider text-slate-400">${item.label}</p>
        <span class="info-tip relative inline-flex items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-slate-300" tabindex="0">i<span class="tip-text pointer-events-none absolute right-0 top-7 z-20 w-52 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-left text-xs font-normal normal-case tracking-normal text-slate-200 opacity-0 shadow-xl transition">${item.desc}</span></span>
      </div>
      <p class="kpi-value mt-auto pt-4 text-2xl font-semibold ${index === 1 ? 'text-emerald-300' : index === 2 ? 'text-indigo-200' : 'text-white'}">${item.value}</p>
    </article>
  `).join('');
}
