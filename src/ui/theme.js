export const colors = {
  page: cssVar('--ui-page', '#0f172a'),
  panel: cssVar('--chart-panel', '#020617'),
  text: cssVar('--chart-text', '#f8fafc'),
  textMuted: cssVar('--chart-text-muted', '#94a3b8'),
  textSoft: cssVar('--chart-text-soft', '#cbd5e1'),
  borderSubtle: cssVar('--chart-border', 'rgba(255,255,255,0.12)'),
  grid: cssVar('--chart-grid', 'rgba(148,163,184,0.12)'),
  indigo: cssVar('--chart-indigo', '#818cf8'),
  emerald: cssVar('--chart-emerald', '#34d399'),
  pink: cssVar('--chart-pink', '#f472b6'),
  indigoBar: cssVar('--chart-indigo-bar', 'rgba(99, 102, 241, 0.58)'),
  indigoBarStrong: cssVar('--chart-indigo-bar-strong', 'rgba(99, 102, 241, 0.62)'),
  emeraldBar: cssVar('--chart-emerald-bar', 'rgba(52, 211, 153, 0.62)'),
  emeraldBarSoft: cssVar('--chart-emerald-bar-soft', 'rgba(16, 185, 129, 0.58)'),
  pinkBar: cssVar('--chart-pink-bar', 'rgba(244, 114, 182, 0.55)')
};

export const classes = {
  moduleTab: 'whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-medium transition',
  chartTab: 'rounded-md px-3 py-2 text-sm font-medium transition',
  activeModuleTab: 'active-module-tab',
  inactiveTab: 'text-slate-300 hover:bg-white/10',
  activePrimaryTab: 'active-primary-tab shadow',
  activeSecondaryTab: 'active-secondary-tab shadow',
  controlCard: 'control-card block rounded-lg border border-white/10 bg-white/[0.04] p-3',
  inputBase: 'w-full rounded-md border border-white/10 bg-slate-950 text-sm text-white outline-none focus:border-indigo-400',
  iconTip: 'info-tip relative inline-flex items-center justify-center rounded-full border border-white/15 text-[10px] font-semibold text-slate-300',
  tooltip: 'tip-text pointer-events-none absolute left-0 top-6 z-20 w-56 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-left text-xs font-normal text-slate-200 opacity-0 shadow-xl transition'
};

export function refreshThemeColors() {
  Object.assign(colors, {
    page: cssVar('--ui-page', colors.page),
    panel: cssVar('--chart-panel', colors.panel),
    text: cssVar('--chart-text', colors.text),
    textMuted: cssVar('--chart-text-muted', colors.textMuted),
    textSoft: cssVar('--chart-text-soft', colors.textSoft),
    borderSubtle: cssVar('--chart-border', colors.borderSubtle),
    grid: cssVar('--chart-grid', colors.grid),
    indigo: cssVar('--chart-indigo', colors.indigo),
    emerald: cssVar('--chart-emerald', colors.emerald),
    pink: cssVar('--chart-pink', colors.pink),
    indigoBar: cssVar('--chart-indigo-bar', colors.indigoBar),
    indigoBarStrong: cssVar('--chart-indigo-bar-strong', colors.indigoBarStrong),
    emeraldBar: cssVar('--chart-emerald-bar', colors.emeraldBar),
    emeraldBarSoft: cssVar('--chart-emerald-bar-soft', colors.emeraldBarSoft),
    pinkBar: cssVar('--chart-pink-bar', colors.pinkBar)
  });
}

function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
