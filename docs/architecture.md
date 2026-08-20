# Architecture Notes

## Module Contract

Each calculator module exports one module object with:

- `id`
- `navLabel`
- `eyebrow`
- `title`
- `defaultState`
- `controls`
- `chartTabs`
- optional `validateState(state)`
- `calculate(state, appState)`

The app shell in `src/app.js` does not know module-specific formulas. It asks the active module for KPI, table, and chart output.

## UI Reuse

Reusable renderers live in `src/ui/`:

- `controls.js`: control rendering, blur-based number formatting, range/number/select/toggle handling
- `kpis.js`: KPI card renderer
- `table.js`: schedule table renderer
- `charts.js`: Chart.js setup and tab handling
- `chartDatasets.js`: reusable Chart.js dataset factories
- `theme.js`: shared color tokens and common class strings
- `src/styles/theme.css`: CSS custom properties and page-level styling
- `src/utils/amortization.js`: shared amortized payment formula for loan-style calculators

## Field Configuration

Calculator field defaults and editable bounds live in `src/config/calculatorFields.js`.

Use that file to change:

- default input values
- numeric `min`, `max`, and `step`
- select options
- advanced-field `inactiveValue` defaults

Module files still own labels, descriptions, prefixes, suffixes, and calculation formulas.

## Styling Direction

Avoid hard-coded colors inside modules and component renderers.

Use:

- CSS custom properties in `src/styles/theme.css` for page-level CSS
- `src/ui/theme.js` for JavaScript color tokens and reusable classes
- `src/ui/chartDatasets.js` for chart line/bar dataset styling

Calculator modules should describe what data to show, not how every chart element is styled.

## Finance Utilities

Shared finance formulas should live under `src/utils/` when at least two modules need them.

Current shared helper:

- `amortizedPayment(...)`: standard payment formula with optional future value, used by Loan and Mortgage.

## Backend API

The Express backend lives under `server/`.

- `server/index.ts`: process entrypoint and listener setup.
- `server/app.ts`: Express app factory, shared middleware, health route, API mount, production static serving, and error handling.
- `server/db.ts`: typed Postgres pool and connection health helper.
- `server/config/env.ts`: backend environment loading.
- `server/auth/`: password hashing, token cookies, refresh sessions, email verification, and auth middleware.
- `server/calculations/`: saved-calculation data access.
- `server/migrations/`: Postgres schema migrations.
- `server/routes/api.ts`: API router placeholder for backend routes.

Firebase client code is no longer used for login/register, but the package can stay until the old Firebase module is removed completely. New backend routes should be added under `server/routes/` and mounted from `server/app.ts`. Postgres access should stay behind small data-access modules instead of being imported directly by every route handler.

Authentication uses short-lived access cookies and rotating refresh cookies. Both are HttpOnly. Email verification tokens and refresh token secrets are stored only as hashes.
