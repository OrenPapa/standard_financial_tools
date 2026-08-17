# Mortgage Comparison Module

## Purpose

The mortgage comparison module compares two or more mortgage scenarios side by side.

It is designed for simple scenario comparison: different home prices, down payments, mortgage rates, terms, closing costs, and optional extra monthly payments.

## Inputs Per Scenario

- `name`: scenario label
- `homePrice`: purchase price of the home
- `downPayment`: cash paid upfront toward the home
- `annualInterestRate`: nominal annual mortgage interest rate
- `mortgageTermYears`: repayment term in years
- `closingCosts`: one-time upfront costs
- `extraMonthlyPayment`: optional extra principal payment each month

At least two scenarios are kept in the form. Users can add up to eight.

## Calculation

Each scenario uses standard monthly amortization:

```text
loanAmount = max(0, homePrice - downPayment)
monthlyRate = annualInterestRate / 12 / 100
scheduledPayment = amortizedPayment(loanAmount, monthlyRate, mortgageTermYears * 12)
paymentWithExtra = scheduledPayment + extraMonthlyPayment
```

For each month:

```text
interest = balance * monthlyRate
loanPayment = min(balance + interest, paymentWithExtra)
principal = loanPayment - interest
balance = balance - principal
```

## Results

Each scenario card shows:

- home price
- down payment
- loan amount
- rate
- monthly payment
- total interest
- total cost
- payoff time

The module does not use a pie chart. It provides:

- monthly payment comparison
- remaining balance over time
- total cost over time
- scenario comparison table
