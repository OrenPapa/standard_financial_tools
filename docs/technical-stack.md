# Technical Stack

## Current Runtime

The app is currently a Vite-built browser application.

- HTML shells: `index.html` and `login.html`
- Styling: Tailwind CSS via PostCSS plus local CSS variables in `src/styles/theme.css`
- Charts: Chart.js from npm
- Auth/analytics: Firebase from npm
- JavaScript: vanilla ES modules
- Local serving: Vite dev server
- Formula tests: Node assertion scripts

Run locally from the project root:

```bash
pnpm install
pnpm dev
```

Then open:

```text
http://127.0.0.1:5173
```

## Current Source Structure

- `src/app.js`: app orchestration and module switching
- `src/login.js`: login page entrypoint
- `src/modules/`: calculator modules
- `src/ui/`: shared renderers and UI helpers
- `src/utils/`: shared formatting and finance formulas
- `src/styles/app.css`: Tailwind and app CSS entrypoint
- `src/styles/theme.css`: CSS custom properties and page-level styles
- `vite.config.js`: multi-page Vite build config

## Styling System

Styling is intentionally moving toward central tokens.

Current styling sources:

- CSS variables in `src/styles/theme.css` for page-level colors, layout sizes, and browser CSS
- JavaScript theme tokens in `src/ui/theme.js` for Chart.js colors and reusable class strings
- Tailwind utility classes for layout and component composition

When changing colors, start with:

- `src/styles/theme.css`
- `src/ui/theme.js`

Avoid adding raw hex, RGB, or RGBA values inside calculator modules.

## Future Theme Support

The app now has a small color-only theme system.

Current themes:

- `blue`: the original blue/emerald dark theme
- `light`: a white/light theme
- `dark`: a neutral gray/dark theme

Theme responsibilities:

- `src/styles/theme.css`: CSS variable sets for page, panels, text, borders, inputs, tooltips, and chart color tokens
- `src/ui/theme.js`: JavaScript chart color mapping, refreshed from CSS variables
- `src/ui/themePicker.js`: user-facing theme picker and local storage persistence

If themes become more complex, add a Tailwind config file rather than scattering token overrides.

## Possible Future Stack Changes

The current app uses Vite primarily for dependency packaging, production asset hashing, and multi-page output.

## Tests

Core formula tests can be run without installing dependencies:

```bash
node tests/runAll.js
```

The `package.json` test script runs the same command:

```bash
npm test
```

Current coverage includes Pension, Investment, Inflation, Loan, Mortgage, and Rent vs Buy calculation behavior.

If the app grows, likely upgrades are:

- Vite for local dev, bundling, and cache-busting
- TypeScript for calculator contracts and safer module output
- Tailwind config file for stronger design tokens
- A test runner such as Vitest for formula regression tests
- Historical data adapters for inflation/CPI and market assumptions
