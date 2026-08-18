# Budget Tracker

The Budget module tracks recurring income and expenses against a starting balance.

## Inputs

- Starting balance: current account balance before forecasted cash flow.
- Forecast length and unit: number of months or years to project.
- Income rows: income type, optional custom name when type is Custom, net amount, frequency, and month for one-time income.
- Expense rows: expense type, optional custom name when type is Custom, amount, frequency, and month for one-time expenses.

Supported frequencies are daily, weekly, monthly, yearly, and one-time.

## Calculation

Each row is converted to an average monthly amount:

```text
monthly amount = amount * payments per year / 12
```

One-time rows do not become monthly averages. They are added only in their selected forecast month:

```text
income in month n = recurring monthly income + one-time income scheduled for month n
expenses in month n = recurring monthly expenses + one-time expenses scheduled for month n
monthly net = income in month n - expenses in month n
```

Where payments per year is:

- daily: 365
- weekly: 52
- monthly: 12
- yearly: 1

The forecast applies recurring monthly cash flow each month and adds any one-time rows in their scheduled month:

```text
ending balance for month n = previous balance + monthly net
```

## Outputs

- KPI cards for starting balance, recurring monthly income, recurring monthly expenses, monthly surplus or shortfall, one-time totals, and projected balance.
- Cash flow chart comparing income, expenses, and net cash flow by month. One-time rows are included in the month where they happen.
- Forecast chart showing projected balance by month.
- Expense breakdown doughnut chart. If a row has a custom name, that name is used in the breakdown label; otherwise the selected type is used.
- Budget forecast table with month, income, expenses, net cash flow, and ending balance.
