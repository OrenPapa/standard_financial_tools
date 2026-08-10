export function renderKpis(items) {
  if (!Array.isArray(items) && items?.layout === 'rentVsBuy') {
    renderRentVsBuyKpis(items);
    return;
  }

  document.getElementById('kpiGrid').innerHTML = items.map((item, index) => `
    <article class="flex min-h-[172px] flex-col rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div class="kpi-label flex items-center justify-between gap-2">
        <p class="text-xs font-medium uppercase tracking-wider text-slate-400">${item.label}</p>
        <span class="info-tip relative inline-flex items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-slate-300" tabindex="0">i<span class="tip-text pointer-events-none absolute right-0 top-7 z-20 w-52 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-left text-xs font-normal normal-case tracking-normal text-slate-200 opacity-0 shadow-xl transition">${item.desc}</span></span>
      </div>
      <p class="kpi-value mt-auto pt-4 text-2xl font-semibold ${index === 1 ? 'text-emerald-300' : index === 2 ? 'text-indigo-200' : 'text-white'}">${item.value}</p>
      ${item.subvalue ? `<p class="kpi-subvalue mt-1 text-xs text-slate-400">${item.subvalue}</p>` : ''}
    </article>
  `).join('');
}

function renderRentVsBuyKpis(payload) {
  const resultTone = payload.summary.winner === 'buying'
    ? 'from-emerald-500/20 via-indigo-500/20 to-sky-500/20 border-emerald-400/30'
    : payload.summary.winner === 'renting'
      ? 'from-indigo-500/20 via-fuchsia-500/15 to-slate-900/20 border-indigo-400/30'
      : 'from-slate-500/20 via-indigo-500/15 to-slate-900/20 border-white/15';

  document.getElementById('kpiGrid').innerHTML = `
    <div class="rent-buy-results col-span-full grid gap-4">
      <article class="rent-buy-hero rounded-lg border ${resultTone} bg-gradient-to-br p-5 shadow-2xl shadow-slate-950/20">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div class="rent-buy-result-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-400/90 text-3xl font-semibold text-slate-950">${payload.summary.winner === 'renting' ? 'R' : payload.summary.winner === 'buying' ? 'B' : '='}</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wider text-emerald-300">Your result</p>
            <h2 class="mt-1 text-2xl font-semibold text-white sm:text-3xl">${payload.summary.value}</h2>
            <p class="mt-2 text-sm text-slate-300">${payload.summary.subvalue}</p>
          </div>
        </div>
        <details class="rent-buy-explain mt-4 rounded-md border border-white/10 bg-slate-950/35">
          <summary class="flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-slate-100">
            <span>Why this result?</span>
            <span class="text-slate-400">+</span>
          </summary>
          <p class="border-t border-white/10 px-3 py-3 text-sm leading-6 text-slate-300">${payload.summary.explanation}</p>
        </details>
      </article>

      <div class="rent-buy-groups grid gap-4 lg:grid-cols-2">
        ${payload.groups.map(group => `
          <article class="rent-buy-group rent-buy-group-${group.tone} rounded-lg border ${group.tone === 'buying' ? 'border-emerald-400/35 bg-emerald-500/[0.06]' : 'border-indigo-400/35 bg-indigo-500/[0.06]'} p-4">
            <p class="${group.tone === 'buying' ? 'text-emerald-300' : 'text-indigo-300'} text-xs font-semibold uppercase tracking-wider">${group.title}</p>
            <div class="mt-4 grid gap-4 sm:grid-cols-3">
              ${group.items.map(item => `
                <div class="min-w-0 border-white/10 sm:border-l sm:pl-4 first:border-l-0 first:pl-0">
                  <div class="flex items-center gap-2">
                    <p class="text-xs text-slate-400">${item.label}</p>
                    <span class="info-tip relative inline-flex items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-slate-300" tabindex="0">i<span class="tip-text pointer-events-none absolute right-0 top-7 z-20 w-52 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-left text-xs font-normal normal-case tracking-normal text-slate-200 opacity-0 shadow-xl transition">${item.desc}</span></span>
                  </div>
                  <p class="mt-2 text-xl font-semibold text-white">${item.value}</p>
                </div>
              `).join('')}
            </div>
          </article>
        `).join('')}
      </div>

      <p class="text-xs text-slate-400">${payload.note}</p>
    </div>
  `;
}
