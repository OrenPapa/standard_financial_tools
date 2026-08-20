# Budget Projection

The Budget Projection module tracks recurring income and expenses against a starting balance.

## Inputs

- Starting balance: current account balance before forecasted cash flow.
- Forecast length and unit: number of months or years to project.
- Income rows: income type, optional custom name when type is Custom, net amount, frequency, and selected calendar months for scheduled income.
- Expense rows: expense type, optional custom name when type is Custom, amount, frequency, and selected calendar months for scheduled expenses.

Supported frequencies are daily, weekly, monthly, yearly, and selected months.

## Calculation

Each row is converted to an average monthly amount:

```text
monthly amount = amount * payments per year / 12
```

Selected-month rows do not become monthly averages. They are added in each chosen calendar month across the forecast:

```text
income in month n = recurring monthly income + selected-month income scheduled for month n
expenses in month n = recurring monthly expenses + selected-month expenses scheduled for month n
monthly net = income in month n - expenses in month n
```

Where payments per year is:

- daily: 365
- weekly: 52
- monthly: 12
- yearly: 1

The forecast applies recurring monthly cash flow each month and adds any selected-month rows in their scheduled calendar months:

```text
ending balance for month n = previous balance + monthly net
```

## Outputs

- KPI cards for ending balance, total made, total spent, recurring monthly income, recurring monthly expenses, and monthly surplus or shortfall.
- Cash flow chart comparing income, expenses, and net cash flow by month. Selected-month rows are included in each month where they happen.
- Forecast chart showing projected balance by month.
- Expense breakdown doughnut chart. If a row has a custom name, that name is used in the breakdown label; otherwise the selected type is used.
- Budget projection table with month, income, expenses, net cash flow, and ending balance.
