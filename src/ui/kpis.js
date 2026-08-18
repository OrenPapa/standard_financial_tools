export function renderKpis(items) {
  const target = document.getElementById('kpiGrid');

  if (!Array.isArray(items) && items?.layout === 'rentVsBuy') {
    target.classList.remove('kpi-grid-compact');
    renderRentVsBuyKpis(items);
    return;
  }

  if (!Array.isArray(items) && items?.layout === 'mortgageComparison') {
    target.classList.remove('kpi-grid-compact');
    renderMortgageComparisonKpis(items);
    return;
  }

  target.classList.toggle('kpi-grid-compact', items.length >= 6);
  target.innerHTML = items.map((item, index) => `
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

function renderMortgageComparisonKpis(payload) {
  const scenarios = payload.scenarios || [];
  const target = document.getElementById('kpiGrid');

  target.innerHTML = `
    <details class="mortgage-comparison-results-section col-span-full rounded-lg border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/20" open>
      <summary class="mortgage-comparison-summary cursor-pointer">
        <div class="flex items-center justify-between gap-3">
          <h2 class="min-w-0 text-lg font-semibold text-white">Results</h2>
          <span class="mortgage-comparison-caret" aria-hidden="true"></span>
        </div>
      </summary>
      <div class="mortgage-comparison-scroll mt-4">
        <div class="mortgage-comparison-results">
        ${scenarios.map(scenario => {
          const isLowestCost = Math.abs(scenario.totalCost - payload.bestTotalCost) < 0.005;
          const isLowestPayment = Math.abs(scenario.paymentWithExtra - payload.lowestMonthlyPayment) < 0.005;
          const tags = [
            isLowestCost ? '<span class="inline-flex min-h-6 items-center justify-center whitespace-nowrap rounded-md bg-emerald-400 px-2 py-1 text-center text-xs font-bold leading-none text-slate-950">Lowest total</span>' : '',
            isLowestPayment ? '<span class="inline-flex min-h-6 items-center justify-center whitespace-nowrap rounded-md border border-white/10 px-2 py-1 text-center text-xs font-bold leading-none text-slate-200">Lowest monthly</span>' : ''
          ].filter(Boolean).join('');

          return `
            <details class="mortgage-comparison-card shrink-0 rounded-lg border ${isLowestCost ? 'border-emerald-400/35 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.06]'} p-4" data-result-details open>
              <summary class="mortgage-comparison-summary mortgage-comparison-card-summary flex cursor-pointer items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Scenario</p>
                  <h3 class="mt-1 truncate text-lg font-semibold text-white">${escapeHtml(scenario.name)}</h3>
                  ${tags ? `<div class="mt-2 flex flex-wrap gap-1.5">${tags}</div>` : ''}
                </div>
                <span class="mortgage-comparison-caret" aria-hidden="true"></span>
              </summary>
              <div class="mortgage-comparison-card-body mt-4 grid gap-3 sm:grid-cols-2">
                ${comparisonMetric('Home price', euros(scenario.homePrice))}
                ${comparisonMetric('Down payment', euros(scenario.downPayment))}
                ${comparisonMetric('Loan amount', euros(scenario.loanAmount))}
                ${comparisonMetric('Rate', `${Number(scenario.annualInterestRate).toFixed(2)}%`)}
                ${comparisonMetric('Monthly payment', eurosPreciseValue(scenario.paymentWithExtra))}
                ${comparisonMetric('Total interest', euros(scenario.totalInterest))}
                ${comparisonMetric('Total cost', euros(scenario.totalCost))}
                ${comparisonMetric('Payoff time', `${Number(scenario.payoffYears).toFixed(1)} yrs`)}
              </div>
            </details>
          `;
        }).join('')}
        </div>
      </div>
    </details>
  `;

  const desktopResultQuery = window.matchMedia('(min-width: 901px)');
  const syncResultDetails = () => {
    target.querySelectorAll('details[data-result-details]').forEach(details => {
      if (desktopResultQuery.matches) details.open = true;
    });
  };

  target.querySelectorAll('details[data-result-details] > summary').forEach(summary => {
    summary.addEventListener('click', event => {
      if (!desktopResultQuery.matches) return;
      event.preventDefault();
      summary.parentElement.open = true;
    });

    summary.addEventListener('keydown', event => {
      if (!desktopResultQuery.matches || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      summary.parentElement.open = true;
    });
  });

  desktopResultQuery.addEventListener?.('change', syncResultDetails);
  syncResultDetails();
}

function comparisonMetric(label, value) {
  return `
    <div class="min-w-0 border-t border-white/10 pt-3 first:border-t-0 first:pt-0 sm:[&:nth-child(2)]:border-t-0 sm:[&:nth-child(2)]:pt-0">
      <p class="text-xs text-slate-400">${label}</p>
      <p class="mt-1 [overflow-wrap:anywhere] text-base font-semibold text-white">${value}</p>
    </div>
  `;
}

function euros(value) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

function eurosPreciseValue(value) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
