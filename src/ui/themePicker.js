import { refreshThemeColors } from './theme.js';

const STORAGE_KEY = 'financial-tools-theme';
let closeListenerIsBound = false;
const themes = [
  { id: 'blue', label: 'Blue', colors: ['#4f46e5', '#10b981'] },
  { id: 'light', label: 'Light', colors: ['#ffffff', '#111827'] },
  { id: 'dark', label: 'Dark', colors: ['#71717a', '#18181b'] }
];

export function initializeThemePicker({ onThemeChange }) {
  const selectedTheme = readTheme();
  applyTheme(selectedTheme);
  renderThemePicker(selectedTheme, onThemeChange);
}

function renderThemePicker(selectedTheme, onThemeChange) {
  const container = document.getElementById('themePicker');
  if (!container) return;
  const activeTheme = themes.find(theme => theme.id === selectedTheme) || themes[0];

  container.innerHTML = `
    <button
      type="button"
      class="theme-trigger inline-flex items-center gap-2 rounded px-2.5 py-1.5 text-xs font-medium transition"
      aria-haspopup="listbox"
      aria-expanded="false"
      title="Theme"
    >
      <span class="theme-swatch h-4 w-4 rounded-full border border-black/10" style="--swatch-a: ${activeTheme.colors[0]}; --swatch-b: ${activeTheme.colors[1]}"></span>
      <span class="hidden sm:inline">${activeTheme.label}</span>
      <span class="theme-caret text-[10px]">v</span>
    </button>
    <div class="theme-menu hidden absolute right-0 top-[calc(100%+0.35rem)] z-40 min-w-32 rounded-md p-1 shadow-2xl" role="listbox">
      ${themes.map(theme => `
        <button
          type="button"
          class="theme-option flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium transition ${theme.id === selectedTheme ? 'is-active' : ''}"
          data-theme-option="${theme.id}"
          role="option"
          aria-selected="${theme.id === selectedTheme}"
        >
          <span class="theme-swatch h-4 w-4 rounded-full border border-black/10" style="--swatch-a: ${theme.colors[0]}; --swatch-b: ${theme.colors[1]}"></span>
          <span>${theme.label}</span>
        </button>
      `).join('')}
    </div>
  `;

  const trigger = container.querySelector('.theme-trigger');
  const menu = container.querySelector('.theme-menu');

  trigger.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', isOpen);
    trigger.setAttribute('aria-expanded', String(!isOpen));
  });

  container.querySelectorAll('[data-theme-option]').forEach(button => {
    button.addEventListener('click', () => {
      const nextTheme = button.dataset.themeOption;
      applyTheme(nextTheme);
      storeTheme(nextTheme);
      renderThemePicker(nextTheme, onThemeChange);
      onThemeChange?.(nextTheme);
    });
  });

  if (!closeListenerIsBound) {
    document.addEventListener('click', closeThemeMenu);
    closeListenerIsBound = true;
  }
}

function closeThemeMenu(event) {
  const container = document.getElementById('themePicker');
  if (!container || container.contains(event.target)) return;

  container.querySelector('.theme-menu')?.classList.add('hidden');
  container.querySelector('.theme-trigger')?.setAttribute('aria-expanded', 'false');
}

function applyTheme(themeId) {
  const theme = themes.some(item => item.id === themeId) ? themeId : 'blue';
  document.documentElement.dataset.theme = theme;
  refreshThemeColors();
}

function readTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'blue';
  } catch {
    return 'blue';
  }
}

function storeTheme(themeId) {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Ignore storage failures; the selected theme still applies for this session.
  }
}
