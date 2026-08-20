# Mortgage Comparison Module

## Purpose

The mortgage comparison module compares two or more mortgage scenarios side by side.

It keeps the basic workflow simple: home price, down payment, mortgage rate, term, closing costs, and optional extra principal payments. Advanced settings add ownership costs, lender fees, discount points, exit penalties, and a shared holding period.

When advanced settings are disabled, advanced fields are neutralized before calculation and do not affect totals, charts, or visible table columns.

## Inputs

Each scenario supports:

- `name`: scenario label
- `homePrice`: purchase price of the home, must be greater than zero
- `downPayment`: upfront equity contribution, must be at least zero and lower than home price
- `annualInterestRate`: nominal annual mortgage interest rate, zero is valid
- `mortgageTermYears`: repayment term in years
- `closingCosts`: upfront purchase or transaction costs
- `extraMonthlyPayment`: optional extra principal paid each month

Advanced per-scenario inputs:

- `propertyTaxRate`: annual property tax as a percentage of home price
- `annualInsurance`: yearly homeowners insurance
- `pmiRate`: annual mortgage insurance rate
- `monthlyHOA`: monthly HOA, service, or maintenance charge
- `loanFees`: upfront lender or origination fees separate from closing costs
- `discountPointsRate`: upfront rate buy-down cost as a percentage of loan amount
- `prepaymentPenaltyRate`: percentage of remaining balance paid at the comparison period

Global advanced input:

- `compareOverYears`: shared holding period used to compare every scenario over the same amount of time

At least two scenarios are kept in the form. Users can add up to eight.

## Defaults

Advanced scenario defaults are initialization values only:

- property tax rate: `1.0%`
- annual insurance: `EUR 1,000`
- PMI rate: `0%`
- monthly HOA / service: `EUR 0`
- loan fees: `EUR 0`
- discount points: `0%`
- exit penalty: `0%`

Explicit zero values remain valid and must not be replaced with defaults.

## Amortization

Each scenario is simulated month by month.

```text
loanAmount = homePrice - downPayment
monthlyInterestRate = annualInterestRate / 100 / 12
termMonths = mortgageTermYears * 12
```

For normal interest-bearing mortgages:

```text
monthlyMortgagePayment =
  loanAmount * r * (1 + r)^n / ((1 + r)^n - 1)
```

For zero-interest mortgages:

```text
monthlyMortgagePayment = loanAmount / termMonths
```

For each month:

```text
interest = remainingBalance * monthlyInterestRate
scheduledPrincipal = monthlyMortgagePayment - interest
extraPrincipal = extraMonthlyPayment
principalPayment = scheduledPrincipal + extraPrincipal
```

Principal is clamped so it never exceeds the remaining balance. The final mortgage payment is only the amount needed to pay off the loan.

Ownership costs are separate from amortization:

```text
monthlyPropertyTax = homePrice * propertyTaxRate / 100 / 12
monthlyInsurance = annualInsurance / 12
monthlyPMI = loanAmount * pmiRate / 100 / 12
monthlyHousingOutflow =
  mortgagePayment
  + monthlyPropertyTax
  + monthlyInsurance
  + activePMI
  + monthlyHOA
```

PMI is active only while:

```text
remainingBalance > homePrice * 0.8
```

## Cash Metrics

Cash at closing is:

```text
cashAtClosing =
  downPayment
  + closingCosts
  + loanFees
  + discountPointsCost
```

Discount points cost is:

```text
discountPointsCost = loanAmount * discountPointsRate / 100
```

Cash outflow over the holding period is:

```text
cashOutflowAtHoldingPeriod =
  cashAtClosing
  + mortgage payments made
  + property tax paid
  + insurance paid
  + PMI paid
  + HOA paid
  + exit penalty
```

The exit penalty is only applied to holding-period cash outflow:

```text
exitPenaltyAtHoldingPeriod =
  remainingBalanceAtHoldingPeriod * prepaymentPenaltyRate / 100
```

Principal is kept separate from true financing and ownership costs. Result breakdowns distinguish equity-building cash, such as down payment and principal paid, from non-equity costs, such as interest, fees, taxes, insurance, PMI, HOA, and penalties.

## Results

Each scenario exposes:

- monthly mortgage payment
- initial monthly housing cost
- cash at closing
- cash outflow after the selected holding period
- remaining balance after the selected holding period
- principal paid after the selected holding period
- interest paid after the selected holding period
- lifetime interest
- lifetime mortgage payments
- mortgage payoff time

The main winner is the scenario with the lowest holding-period cash outflow. Result data also exposes deltas for cash outflow, cash at closing, monthly mortgage payment, initial monthly housing cost, remaining balance, and lifetime interest.
