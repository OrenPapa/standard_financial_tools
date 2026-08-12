# Rent vs Buy Calculator Module

## Purpose

The Rent vs Buy module compares the financial outcome of renting a home versus buying one over a selected number of years.

The result is based only on the entered assumptions. It does not say that renting or buying is always better.

## Inputs

- `monthlyRent`: current monthly rent
- `annualRentIncreasePct`: expected yearly rent increase, as a percent
- `comparisonYears`: number of years to compare
- `propertyPrice`: home purchase price
- `downPayment`: upfront cash paid toward the home
- `mortgageInterestRatePct`: annual mortgage interest rate, as a percent
- `mortgageTermYears`: full mortgage term in years
- `annualPropertyAppreciationPct`: expected yearly home value growth or decline, as a percent
- `annualMaintenanceCostPct`: estimated yearly maintenance, as a percent of property price
- `buyingCosts`: fixed upfront buying costs
- `sellingCostsPct`: estimated selling costs, as a percent of future home value
- `saleProfitTaxPct`: optional tax on sale profit, as a percent
- `monthlyPropertyTax`: optional monthly property tax estimate
- `monthlyInsurance`: optional monthly home insurance estimate

## Mortgage Variables

```text
loanAmount = max(0, propertyPrice - downPayment)
monthlyRate = mortgageInterestRatePct / 12 / 100
numberOfPayments = mortgageTermYears * 12
```

If `downPayment` is greater than `propertyPrice`, it is capped at `propertyPrice`.

## Mortgage Payment Formula

If `monthlyRate = 0`:

```text
monthlyMortgagePayment = loanAmount / numberOfPayments
```

If `monthlyRate > 0`:

```text
growth = (1 + monthlyRate) ^ numberOfPayments
monthlyMortgagePayment = loanAmount * (monthlyRate * growth) / (growth - 1)
```

## Renting Formula

Rent increases once per year:

```text
monthlyRent_y = monthlyRent * (1 + annualRentIncreasePct / 100) ^ (y - 1)
annualRent_y = monthlyRent_y * 12
totalRentPaid = sum annualRent_y
```

Where `y` is the comparison year, starting at 1.

## Buying Simulation

The mortgage is simulated month by month during the comparison period.

For each month while the mortgage is still active:

```text
interest = remainingMortgageBalance * monthlyRate
principal = min(remainingMortgageBalance, monthlyMortgagePayment - interest)
remainingMortgageBalance = max(0, remainingMortgageBalance - principal)
```

Tracked totals:

```text
totalMortgagePaid = sum(principal + interest)
totalPrincipalPaid = sum(principal)
totalInterestPaid = sum(interest)
```

If the mortgage is fully paid before the comparison period ends, mortgage payments stop and the remaining balance stays at zero.

## Maintenance, Tax, And Insurance

Maintenance is estimated from the original property price:

```text
annualMaintenanceCost = propertyPrice * (annualMaintenanceCostPct / 100)
totalMaintenanceCost = annualMaintenanceCost * comparisonYears
```

Optional monthly costs:

```text
totalPropertyTax = monthlyPropertyTax * comparisonYears * 12
totalInsurance = monthlyInsurance * comparisonYears * 12
```

## Property Value And Selling Costs

At the end of the comparison period:

```text
futurePropertyValue = propertyPrice * (1 + annualPropertyAppreciationPct / 100) ^ comparisonYears
sellingCosts = futurePropertyValue * (sellingCostsPct / 100)
saleProfit = max(0, futurePropertyValue - propertyPrice)
saleProfitTax = saleProfit * (saleProfitTaxPct / 100)
```

## Equity And Net Outcome

```text
equity = futurePropertyValue - remainingMortgageBalance
netEquityAfterSelling = futurePropertyValue
                      - remainingMortgageBalance
                      - sellingCosts
                      - saleProfitTax
```

Total buy-side cash outflow:

```text
totalBuyCosts = downPayment
              + buyingCosts
              + totalMortgagePaid
              + totalMaintenanceCost
              + totalPropertyTax
              + totalInsurance
```

Net cost of buying:

```text
netCostOfBuying = totalBuyCosts - netEquityAfterSelling
```

Comparison:

```text
difference = totalRentPaid - netCostOfBuying
```

Meaning:

- If `difference > 0`, buying is ahead by `difference`.
- If `difference < 0`, renting is ahead by `abs(difference)`.
- If the difference is close to zero, the result is treated as very close.

## Annual Schedule Rows

Each yearly row stores:

- year
- annual rent
- cumulative rent paid
- mortgage paid to date
- interest paid to date
- principal paid to date
- remaining mortgage balance
- estimated property value
- estimated equity
- net equity after selling
- net cost of buying

## Key Assumptions

- Rent changes annually, not monthly.
- Maintenance is based on original property price and does not grow over time.
- Property tax and insurance are optional flat monthly estimates.
- Home value changes at one constant annual rate.
- Selling costs are based on estimated future home value.
- Sale profit tax, when used, applies only to the estimated gain above the original property price.
- The model does not include investment returns on unused cash, tax deductions, closing cost financing, rent deposits, renovations, moving costs, or lifestyle differences.
