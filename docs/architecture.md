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
