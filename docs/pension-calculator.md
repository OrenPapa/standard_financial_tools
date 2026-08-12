# Pension Calculator Module

## Purpose

The pension module estimates pension accumulation during working years and retirement drawdown after tax and inflation assumptions.

## Inputs

- `startAge`: age when saving begins
- `retirementAge`: age when saving stops and retirement drawdown begins
- `initialMonthlyContrib`: monthly contribution in the first saving year
- `annualContribIncrease`: fixed euro increase added to the monthly contribution each year
- `accumulationReturn`: annual nominal return during accumulation, as a percent
- `profitTaxRate`: tax rate applied to investment profit at retirement, as a percent
- `annualInflationRate`: annual inflation rate, as a percent
- `payoutYears`: number of retirement drawdown years
- `retirementReturn`: annual nominal return during drawdown, as a percent
- `payoutType`: `flat` or `indexed`

## Accumulation Variables

```text
Y = retirementAge - startAge
N = Y * 12
r_acc = accumulationReturn / 100
r_m = r_acc / 12
k = floor((month - 1) / 12)
C_k = initialMonthlyContrib + k * annualContribIncrease
```

Where:

- `Y` is accumulation years
- `N` is total accumulation months
- `r_acc` is annual accumulation return in decimal form
- `r_m` is monthly accumulation return
- `k` is the zero-based saving year index
- `C_k` is the monthly contribution for saving year `k`

## Accumulation Formula

The implementation compounds monthly and adds the contribution at the end of each month:

```text
balance_m = balance_(m-1) * (1 + r_m) + C_k
totalContributed_m = totalContributed_(m-1) + C_k
```

Initial values:

```text
balance_0 = 0
totalContributed_0 = 0
```

## Profit Tax

At retirement:

```text
grossBalance = balance_N
totalProfit = max(0, grossBalance - totalContributed_N)
taxAmount = totalProfit * (profitTaxRate / 100)
netBalanceAtRetirement = grossBalance - taxAmount
```

Tax is applied only to positive investment profit. If profit is negative, tax is zero.

## Real Purchasing Power

The net retirement balance is discounted back into starting-year purchasing power:

```text
inflationRate = annualInflationRate / 100
realNetBalance = netBalanceAtRetirement / (1 + inflationRate) ^ Y
```

## Flat Nominal Drawdown

Variables:

```text
M = payoutYears * 12
r_ret = retirementReturn / 100
r_pm = r_ret / 12
PV = netBalanceAtRetirement
```

If `r_pm = 0`:

```text
monthlyPayout = PV / M
```

Otherwise the standard annuity formula is used:

```text
monthlyPayout = PV * r_pm / (1 - (1 + r_pm) ^ -M)
```

During simulation:

```text
balance_m = max(0, balance_(m-1) * (1 + r_pm) - monthlyPayout)
```

## Inflation-Indexed Drawdown

The module solves for the first-year monthly payout `P_1`.

Variables:

```text
g = annualInflationRate / 100
idx_m = floor((m - 1) / 12)
payment_m = P_1 * (1 + g) ^ idx_m
```

Present value equation:

```text
PV = sum from m=1 to M of payment_m / (1 + r_pm) ^ m
```

Because each `payment_m` is proportional to `P_1`, the implementation solves:

```text
discountSum = sum from m=1 to M of ((1 + g) ^ idx_m) / ((1 + r_pm) ^ m)
P_1 = PV / discountSum
```

Ending monthly payout:

```text
endingPayout = P_1 * (1 + g) ^ (payoutYears - 1)
```

## Payout Purchasing Power

The payout result cards also show each nominal payout in today's purchasing power.

For the first retirement-year payout:

```text
realStartingPayout = startingPayout / (1 + inflationRate) ^ Y
```

For the final retirement-year payout:

```text
realEndingPayout = endingPayout / (1 + inflationRate) ^ (Y + payoutYears - 1)
```

## Schedule Rows

The annual accumulation table stores:

- age
- monthly contribution for that year
- cumulative contributed amount
- cumulative interest/profit
- year-end fund balance

## Key Assumptions

- Contributions are made monthly at month end.
- Returns are converted from annual nominal rates to simple monthly rates by dividing by 12.
- Inflation indexing steps up annually, not monthly.
- Profit tax is applied once at retirement, not annually.
- The drawdown simulation caps final balances at zero for display.
