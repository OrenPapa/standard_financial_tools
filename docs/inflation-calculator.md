# Inflation Calculator Module

## Purpose

The inflation module compares the equivalent value and buying power of money between two years using a user-provided average annual inflation or deflation rate.

It supports both directions:

- future comparison, such as 2026 to 2050
- past comparison, such as 2026 to 1960

## Inputs

- `amount`: nominal starting amount
- `startYear`: year where the starting amount is defined
- `targetYear`: year to compare against
- `annualInflationRate`: annual inflation or deflation rate, as a percent

Use a positive rate for inflation and a negative rate for deflation.

## Variables

```text
yearDiff = targetYear - startYear
r = annualInflationRate / 100
factor = (1 + r) ^ yearDiff
```

Where:

- `yearDiff` is positive for future dates and negative for past dates
- `r` is the annual inflation rate in decimal form
- `factor` is the compounded price-level multiplier between the two years

## Equivalent Value Formula

Equivalent value answers:

```text
How much nominal money in the target year is needed to match the starting amount?
```

The formula is:

```text
equivalentAmount = amount * factor
```

For a future target year with positive inflation, this grows above the starting amount. For a past target year, `yearDiff` is negative, so the formula discounts backward.

## Buying Power Formula

Buying power answers:

```text
How much purchasing power does the same nominal amount feel like in the target year?
```

The formula is the inverse of the inflation factor:

```text
buyingPowerAmount = amount / factor
```

Examples:

- If `amount = 1000`, `startYear = 2026`, and `targetYear = 2050`, buying power estimates what the same `1000` would feel like after future inflation.
- If `amount = 1000`, `startYear = 2026`, and `targetYear = 1960`, buying power estimates what `1000` would feel like in 1960 terms using the selected average rate.

## Change Metrics

The module also calculates:

```text
absoluteChange = equivalentAmount - amount
cumulativeChangeRate = factor - 1
```

Where:

- `absoluteChange` is the nominal difference between target equivalent value and starting amount
- `cumulativeChangeRate` is the total compounded inflation or deflation rate over the selected period

## Annual Schedule Rows

The annual schedule walks from `startYear` to `targetYear` in one-year steps.

For each displayed year:

```text
yearsFromStart = currentYear - startYear
yearlyFactor = (1 + r) ^ yearsFromStart
yearlyEquivalentValue = amount * yearlyFactor
yearlyBuyingPower = amount / yearlyFactor
yearlyCumulativeChange = yearlyFactor - 1
```

If the target year is earlier than the starting year, the loop steps backward one year at a time.

## Key Assumptions

- The module currently uses one constant average annual rate entered by the user.
- It does not use historical CPI data or future inflation projections yet.
- Past-year calculations are estimates based on the selected rate, not official historical inflation values.
- The chart focuses on purchasing power over time to make the "how it feels" result clearer.
