# Loan Calculator Module

## Purpose

The loan module estimates regular loan payments, total interest, total cost, and an amortization schedule for a simple installment loan.

It starts with classic loan inputs and keeps more detailed assumptions in advanced settings.

## Inputs

- `loanAmount`: starting principal borrowed
- `annualInterestRate`: annual nominal interest rate, as a percent
- `loanTermYears`: planned loan length in years
- `paymentFrequency`: `monthly`, `quarterly`, `semiannual`, or `annual`
- `extraPayment`: additional payment added each period
- `upfrontFees`: one-time fees paid at the start
- `recurringFee`: fee paid each payment period
- `balloonPayment`: principal intentionally left for the final payment
- `annualInflationRate`: annual inflation rate used to show future payments in today's purchasing power

## Frequency Variables

Payment frequency is converted to payments per year:

```text
monthly = 12
quarterly = 4
semiannual = 2
annual = 1
```

Then:

```text
F = paymentsPerYear
P = round(loanTermYears * F)
r = annualInterestRate / 100 / F
PV = loanAmount
FV = balloonPayment
```

Where:

- `F` is the number of payments per year
- `P` is the planned number of payment periods
- `r` is the periodic interest rate
- `PV` is the starting principal
- `FV` is the target remaining balance at the final period before balloon payoff

## Scheduled Payment Formula

The module uses the shared `amortizedPayment` helper.

If `r = 0`:

```text
scheduledPayment = (PV - FV) / P
```

If `r > 0`:

```text
discount = (1 + r) ^ -P
scheduledPayment = (PV - FV * discount) * r / (1 - discount)
```

For a normal fully amortizing loan, `FV = 0`, so this becomes:

```text
scheduledPayment = PV * r / (1 - (1 + r) ^ -P)
```

## Period Amortization

For each payment period:

```text
interest = startingBalance * r
regularPayment = scheduledPayment + extraPayment
```

The final period is allowed to leave only the balloon target before the balloon is paid:

```text
targetEndingBalance = period == P ? 0 : FV
maxPrincipalThisPeriod = max(0, startingBalance + interest - targetEndingBalance)
principalPayment = min(maxPrincipalThisPeriod, regularPayment)
```

If the loan reaches the final planned period, the balloon payment is applied:

```text
balloonPaid = min(FV, max(0, startingBalance + interest - principalPayment))
endingBalance = max(0, startingBalance + interest - principalPayment - balloonPaid)
```

## Fees And Totals

Upfront fees are counted in total cost immediately:

```text
totalFees_0 = upfrontFees
totalPaid_0 = upfrontFees
```

Each period:

```text
periodTotalPaid = principalPayment + interest + balloonPaid + recurringFee
totalPrincipal = totalPrincipal + principalPayment + balloonPaid
totalInterest = totalInterest + interest
totalFees = totalFees + recurringFee
totalPaid = totalPaid + periodTotalPaid
```

Recurring fees increase total cost but do not reduce the loan balance.

## Payment Purchasing Power

The result card shows how the scheduled payment would feel in today's purchasing power around year 15, or at payoff if the loan is shorter:

```text
realPaymentYear = min(15, payoffYears)
realScheduledPayment = scheduledPayment / (1 + annualInflationRate / 100) ^ realPaymentYear
```

## Annual Schedule Rows

The schedule stores annual rows after each full year of payments, plus the payoff period if the loan ends mid-year:

- year
- ending balance
- principal paid
- interest paid
- fees paid
- total paid

## Key Assumptions

- Interest accrues once per payment period.
- Extra payment is applied as additional principal repayment.
- Upfront fees do not increase the loan balance.
- Recurring fees are paid separately and do not reduce principal.
- The balloon amount is held until the final planned period.
- The model does not include variable rates, missed payments, late fees, or irregular payment dates.
