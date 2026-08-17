# Project Documentation

This project is a standalone financial tools app with separate main and login pages.

## Current Structure

- `index.html`: Main app page shell and root containers.
- `login.html`: Authentication page shell.
- `src/app.js`: App orchestration, module switching, reset handling, and render flow.
- `src/login.js`: Authentication page entrypoint.
- `src/modules/`: Calculator modules and their financial logic.
- `src/ui/`: Reusable UI renderers for controls, KPI cards, charts, and tables.
- `src/utils/`: Shared helpers such as currency formatting.
- `src/styles/app.css`: Tailwind and app CSS entrypoint.
- `vite.config.js`: Multi-page build config.
- `docs/`: Project notes, module documentation, formulas, and future feature planning.
- `docs/architecture.md`: Module contract, UI reuse, and styling conventions.
- `docs/technical-stack.md`: Current technical stack and future upgrade path.

## Module Formula References

Each calculator has a dedicated document with its inputs, formulas, variables, schedule fields, and assumptions:

- `docs/pension-calculator.md`: accumulation, tax, inflation adjustment, and retirement drawdown formulas.
- `docs/investment-calculator.md`: recurring contribution, income, tax, and reinvestment formulas.
- `docs/inflation-calculator.md`: equivalent value and buying-power formulas for past and future dates.
- `docs/loan-calculator.md`: amortized payment, extra payment, fees, balloon, and payoff formulas.
- `docs/mortgage-calculator.md`: mortgage payment, ownership cost, PMI, equity, and total cost formulas.
- `docs/mortgage-comparison.md`: multi-scenario mortgage comparison cards, charts, and table.
- `docs/rent-vs-buy-calculator.md`: rent growth, mortgage, home value, equity, and net comparison formulas.

## Feature Module Direction

The app is organized around a module registry in `src/app.js`.

The current modules are:

- `pension`: Pension accumulation and retirement drawdown calculator.
- `investment`: General investment growth, contribution, income, tax, and reinvestment calculator.
- `inflation`: Inflation and deflation comparison calculator for past or future target years.
- `loan`: Loan payment, cost, and amortization calculator.
- `mortgage`: Mortgage payment, amortization, and ownership cost calculator.
- `mortgage-comparison`: Side-by-side mortgage scenario comparison.
- `rent-vs-buy`: Rent versus buying cost and equity comparison calculator.

Future calculators can be added as additional modules with their own:

- module id
- navigation label
- title and eyebrow
- default state
- controls metadata
- calculation/rendering logic

## Running Locally

Because the app uses package-managed browser dependencies, run it through Vite.

From the project root:

```bash
pnpm install
pnpm dev
```

Then open:

```text
http://127.0.0.1:5173
```

For a production build:

```bash
pnpm build
```
