# Mortgage Calculator Module

## Purpose

The mortgage module estimates a home loan payment, total interest, amortization, equity, and common ownership costs.

It is separate from the general loan calculator because mortgages often include property tax, insurance, PMI, HOA or maintenance, closing costs, and home equity.

When advanced settings are disabled, the calculation uses only home price, down payment, mortgage rate, and mortgage term. The main result breakdown shows down payment, principal paid, and interest paid. Property tax, insurance, PMI, HOA, closing costs, extra payment, and inflation are only included when advanced settings are enabled.

## Inputs

- `homePrice`: purchase price of the home
- `downPayment`: cash paid upfront toward the home price
- `annualInterestRate`: annual mortgage interest rate, as a percent
- `mortgageTermYears`: mortgage length in years
- `extraMonthlyPayment`: additional monthly payment toward the mortgage
- `propertyTaxRate`: annual property tax rate, as a percent of home price
- `annualInsurance`: yearly home insurance cost
- `monthlyHOA`: monthly HOA or maintenance cost
- `pmiRate`: annual private mortgage insurance rate, as a percent of original loan amount
- `closingCosts`: one-time closing costs paid upfront
- `annualInflationRate`: annual inflation rate used to show future monthly costs in today's purchasing power

If `downPayment` is greater than `homePrice`, the module caps it at `homePrice`.

## Core Variables

```text
loanAmount = max(0, homePrice - downPayment)
months = round(mortgageTermYears * 12)
r = annualInterestRate / 100 / 12
```

Where:

- `loanAmount` is the borrowed principal
- `months` is the planned number of monthly payments
- `r` is the monthly interest rate

## Principal And Interest Payment

The module uses the shared `amortizedPayment` helper.

If `r = 0`:

```text
scheduledPayment = loanAmount / months
```

If `r > 0`:

```text
scheduledPayment = loanAmount * r / (1 - (1 + r) ^ -months)
```

This scheduled payment is principal plus interest only. Taxes, insurance, HOA, PMI, and extra payments are calculated separately.

## Monthly Ownership Costs

The fixed monthly ownership costs are:

```text
propertyTaxMonthly = homePrice * (propertyTaxRate / 100) / 12
insuranceMonthly = annualInsurance / 12
baseMonthlyOwnership = propertyTaxMonthly + insuranceMonthly + monthlyHOA
```

PMI is calculated from the original loan amount while equity is below 20%:

```text
equityRatio = (homePrice - startingBalance) / homePrice
pmiMonthly = equityRatio < 0.20 ? loanAmount * (pmiRate / 100) / 12 : 0
```

## Monthly Amortization

For each month:

```text
interest = startingBalance * r
principalAndExtra = scheduledPayment + extraMonthlyPayment
principalPayment = min(startingBalance + interest, principalAndExtra)
endingBalance = max(0, startingBalance + interest - principalPayment)
```

The total cash paid for the month is:

```text
monthlyOwnershipCosts = propertyTaxMonthly + insuranceMonthly + monthlyHOA + pmiMonthly
loanPayment = min(scheduledPayment + extraMonthlyPayment, startingBalance + interest)
principalPayment = loanPayment - interest
totalMonthlyPayment = loanPayment + monthlyOwnershipCosts
```

## Totals

The module tracks:

```text
totalPrincipal = sum(principalPayment)
totalInterest = sum(interest)
totalTaxes = sum(propertyTaxMonthly)
totalInsurance = sum(insuranceMonthly)
totalHoa = sum(monthlyHOA)
totalPmi = sum(pmiMonthly)
```

Total paid includes upfront cash and all monthly costs:

```text
totalPaid = downPayment
          + closingCosts
          + totalPrincipal
          + totalInterest
          + totalTaxes
          + totalInsurance
          + totalHoa
          + totalPmi
```

Equity is shown as:

```text
equity = max(0, homePrice - endingBalance)
```

The primary chart shows a lifetime cash allocation:

```text
downPayment
totalPrincipal
totalInterest
closingCosts, if enabled
totalOwnershipCosts, if enabled
```

## Monthly Cost Purchasing Power

The estimated monthly cost card shows how the current monthly housing cost would feel in today's purchasing power around year 15, or at payoff if the mortgage is shorter:

```text
realPaymentYear = min(15, payoffYears)
realMonthlyCost = totalMonthlyPayment / (1 + annualInflationRate / 100) ^ realPaymentYear
```

## Annual Schedule Rows

The schedule stores annual rows after each 12 months, plus the payoff month if the mortgage ends early:

- year
- ending balance
- upfront cash
- principal paid
- interest paid
- ownership costs
- equity
- total paid

## Key Assumptions

- Home value is held constant for equity calculations.
- Property tax is based on purchase price and does not change over time.
- Insurance, HOA, and maintenance are constant.
- PMI stops when equity reaches 20% based on current balance and original home price.
- Extra monthly payment is applied toward principal.
- The model does not include refinancing, rate resets, escrow changes, home appreciation, or tax deductions.
