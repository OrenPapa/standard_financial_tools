# Investment Calculator Module

## Purpose

The investment module estimates general investment growth from an initial amount, recurring contributions, annual market growth, optional income payments, tax, and reinvestment.

It is designed to start simple. The default visible controls cover a normal investment growth calculation, including tax on gains. Income and reinvestment settings live under advanced settings.

## Inputs

- `initialInvestment`: amount invested at the start
- `recurringContribution`: amount added on each selected contribution interval
- `contributionInterval`: `weekly`, `monthly`, `quarterly`, `semiannual`, or `annual`
- `investmentYears`: number of years to simulate
- `annualReturn`: annual market growth rate, as a percent
- `annualInflationRate`: annual inflation rate used for today's purchasing-power output, as a percent
- `incomeYield`: annual dividend, coupon, or income yield, as a percent
- `incomeFrequency`: `none`, `monthly`, `quarterly`, `semiannual`, or `annual`
- `taxRate`: tax rate applied to income payments and estimated market gains, as a percent
- `reinvestIncome`: whether net income is added back to the investment balance

## Frequency Variables

The implementation simulates in weekly steps:

```text
stepsPerYear = 52
totalSteps = investmentYears * 52
```

Contribution and income frequencies are converted to payments per year:

```text
weekly = 52
monthly = 12
quarterly = 4
semiannual = 2
annual = 1
none = 0
```

Then:

```text
contributionStep = 52 / contributionPaymentsPerYear
incomeStep = 52 / incomePaymentsPerYear
```

## Market Growth Formula

The annual return is converted into an effective weekly growth rate:

```text
r_annual = annualReturn / 100
r_weekly = (1 + r_annual) ^ (1 / 52) - 1
```

At each weekly step:

```text
balance_s = balance_(s-1) * (1 + r_weekly)
```

Initial values:

```text
balance_0 = initialInvestment
totalContributed_0 = initialInvestment
```

## Recurring Contributions

When the current weekly step reaches the next scheduled contribution point:

```text
balance = balance + recurringContribution
totalContributed = totalContributed + recurringContribution
nextContributionAt = nextContributionAt + contributionStep
```

The contribution interval is approximated on a 52-week calendar. For example, monthly contributions happen every `52 / 12` simulation steps.

## Income, Tax, And Reinvestment

If income is enabled, each income payment is calculated from the current balance and taxed immediately:

```text
incomePayment = balance * (incomeYield / 100) / incomePaymentsPerYear
tax = incomePayment * (taxRate / 100)
netIncome = incomePayment - tax
```

Totals are tracked as:

```text
grossIncome = grossIncome + incomePayment
incomeTaxPaid = incomeTaxPaid + tax
```

If `reinvestIncome = true`:

```text
balance = balance + netIncome
```

If `reinvestIncome = false`:

```text
cashIncome = cashIncome + netIncome
```

This means reinvested income increases future compounding, while non-reinvested income is treated as cash received outside the portfolio.

Market growth from `annualReturn` is treated as an estimated taxable gain at the end of the projection. Annual schedule rows show the same estimate as if the investment were liquidated at that year end:

```text
marketGrowth = max(0, portfolioValueBeforeFinalTax - totalContributed - reinvestedNetIncome)
estimatedGainTax = marketGrowth * (taxRate / 100)
totalTaxPaid = incomeTaxPaid + estimatedGainTax
```

## Final Values

At the end of the projection:

```text
portfolioValueBeforeFinalTax = balance
finalPortfolioValue = balance - estimatedGainTax
finalNetValue = finalPortfolioValue + cashIncome
grossGain = marketGrowth + grossIncome
netGain = finalNetValue - totalContributed
realFinalNetValue = finalNetValue / (1 + annualInflationRate / 100) ^ investmentYears
```

Where:

- `portfolioValueBeforeFinalTax` is the invested balance before estimated final tax on market growth
- `finalPortfolioValue` is the portfolio value after estimated final tax
- `cashIncome` is net income paid out instead of reinvested
- `finalNetValue` combines after-tax portfolio value plus paid-out cash income
- `grossGain` is market growth plus gross income before tax
- `netGain` is growth and income left after tax
- `realFinalNetValue` shows final net value in today's purchasing power

## Annual Schedule Rows

Every 52 simulation steps, the annual schedule stores:

- year number
- total contributed
- gross gains
- tax paid
- net gain
- final net value

## Key Assumptions

- `annualReturn` represents market price growth and is separate from `incomeYield`.
- Income is calculated from the current balance at each income payment date.
- Income tax is deducted immediately from income payments.
- Market-growth tax is estimated at the end of the projection, or at each annual schedule row as a year-end liquidation estimate.
- Reinvested net income is added to the investment balance after tax.
- Non-reinvested net income remains outside the portfolio but still counts toward net worth.
- Weekly simulation is an approximation of real contribution and income dates.
