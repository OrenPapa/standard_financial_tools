export const calculatorFieldSettings = {
  pension: {
    label: 'Pension',
    fields: {
      startAge: { defaultValue: 30, min: 18, max: 70, step: 1 },
      retirementAge: { defaultValue: 65, min: 40, max: 80, step: 1 },
      initialMonthlyContrib: { defaultValue: 120, min: 0, max: 2000, step: 10 },
      annualContribIncrease: { defaultValue: 10, min: 0, max: 500, step: 5 },
      accumulationReturn: { defaultValue: 4.0, min: 0, max: 12, step: 0.1 },
      profitTaxRate: { defaultValue: 15.0, min: 0, max: 40, step: 0.1 },
      annualInflationRate: { defaultValue: 2.5, min: 0, max: 10, step: 0.1 },
      payoutYears: { defaultValue: 25, min: 1, max: 45, step: 1 },
      retirementReturn: { defaultValue: 4.0, min: 0, max: 12, step: 0.1 }
    }
  },
  investment: {
    label: 'Investment',
    fields: {
      initialInvestment: { defaultValue: 5000, min: 0, max: 250000, step: 500 },
      recurringContribution: { defaultValue: 200, min: 0, max: 10000, step: 50 },
      contributionInterval: {
        defaultValue: 'monthly',
        options: [['weekly', 'Weekly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Semi-annually'], ['annual', 'Annually']]
      },
      investmentYears: { defaultValue: 10, min: 1, max: 50, step: 1 },
      annualReturn: { defaultValue: 5.0, min: 0, max: 20, step: 0.1 },
      annualInflationRate: { defaultValue: 2.5, min: 0, max: 10, step: 0.1 },
      incomeYield: { defaultValue: 0, min: 0, max: 15, step: 0.1 },
      incomeFrequency: {
        defaultValue: 'none',
        options: [['none', 'No separate income'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Twice a year'], ['annual', 'Once a year']]
      },
      taxRate: { defaultValue: 15.0, min: 0, max: 40, step: 0.1 },
      reinvestIncome: { defaultValue: true }
    }
  },
  inflation: {
    label: 'Inflation',
    fields: {
      amount: { defaultValue: 100, min: 0, max: 1000000, step: 100 },
      startYear: { defaultValue: 2026, min: 1900, max: 2100, step: 1 },
      targetYear: { defaultValue: 2050, min: 1900, max: 2100, step: 1 },
      annualInflationRate: { defaultValue: 2.5, min: -10, max: 20, step: 0.1 }
    }
  },
  loan: {
    label: 'Loan',
    fields: {
      loanAmount: { defaultValue: 100000, min: 0, max: 1000000, step: 1000 },
      annualInterestRate: { defaultValue: 5.5, min: 0, max: 25, step: 0.1 },
      loanTermYears: { defaultValue: 20, min: 1, max: 40, step: 1 },
      paymentFrequency: {
        defaultValue: 'monthly',
        options: [['monthly', 'Monthly'], ['quarterly', 'Quarterly'], ['semiannual', 'Semi-annually'], ['annual', 'Annually']]
      },
      extraPayment: { defaultValue: 0, min: 0, max: 10000, step: 50 },
      upfrontFees: { defaultValue: 0, min: 0, max: 50000, step: 100 },
      recurringFee: { defaultValue: 0, min: 0, max: 1000, step: 10 },
      balloonPayment: { defaultValue: 0, min: 0, max: 500000, step: 1000 },
      annualInflationRate: { defaultValue: 2.5, min: 0, max: 10, step: 0.1 }
    }
  },
  mortgage: {
    label: 'Mortgage',
    fields: {
      homePrice: { defaultValue: 300000, min: 0, max: 2000000, step: 1000 },
      downPayment: { defaultValue: 60000, min: 0, max: 1000000, step: 1000 },
      annualInterestRate: { defaultValue: 5.5, min: 0, max: 20, step: 0.1 },
      mortgageTermYears: { defaultValue: 30, min: 1, max: 40, step: 1 },
      extraMonthlyPayment: { defaultValue: 0, min: 0, max: 10000, step: 50 },
      propertyTaxRate: { defaultValue: 1.0, min: 0, max: 5, step: 0.1 },
      annualInsurance: { defaultValue: 1200, min: 0, max: 20000, step: 100 },
      monthlyHOA: { defaultValue: 0, min: 0, max: 3000, step: 25 },
      pmiRate: { defaultValue: 0.5, min: 0, max: 3, step: 0.1 },
      closingCosts: { defaultValue: 6000, min: 0, max: 100000, step: 500 },
      annualInflationRate: { defaultValue: 2.5, min: 0, max: 10, step: 0.1 }
    }
  },
  rentVsBuy: {
    label: 'Rent vs Buy',
    fields: {
      monthlyRent: { defaultValue: 1200, min: 0, max: 10000, step: 50 },
      annualRentIncreasePct: { defaultValue: 3, min: 0, max: 15, step: 0.1 },
      comparisonYears: { defaultValue: 10, min: 1, max: 50, step: 1 },
      propertyPrice: { defaultValue: 300000, min: 0, max: 2000000, step: 1000 },
      downPayment: { defaultValue: 60000, min: 0, max: 1000000, step: 1000 },
      mortgageInterestRatePct: { defaultValue: 5, min: 0, max: 20, step: 0.1 },
      mortgageTermYears: { defaultValue: 30, min: 1, max: 40, step: 1 },
      annualPropertyAppreciationPct: { defaultValue: 3, min: -10, max: 15, step: 0.1 },
      annualMaintenanceCostPct: { defaultValue: 1, min: 0, max: 10, step: 0.1 },
      buyingCosts: { defaultValue: 9000, min: 0, max: 100000, step: 500 },
      sellingCostsPct: { defaultValue: 3, min: 0, max: 12, step: 0.1 },
      saleProfitTaxPct: { defaultValue: 0, min: 0, max: 40, step: 0.1 },
      monthlyPropertyTax: { defaultValue: 0, min: 0, max: 5000, step: 25 },
      monthlyInsurance: { defaultValue: 0, min: 0, max: 3000, step: 25 }
    }
  },
  budget: {
    label: 'Budget',
    fields: {
      startingBalance: { defaultValue: 2500, min: -1000000, max: 10000000, step: 100 },
      projectionLength: { defaultValue: 12, min: 1, max: 50, step: 1 },
      rowAmount: { defaultValue: 0, min: 0, max: 10000000, step: 10 },
      oneTimeMonth: { defaultValue: 1, min: 1, max: 600, step: 1 }
    }
  }
};

export function applyCalculatorFieldSettings(moduleId, baseDefaultState, baseControls) {
  const fields = calculatorFieldSettings[moduleId]?.fields ?? {};
  const defaultState = { ...baseDefaultState };

  Object.entries(fields).forEach(([id, settings]) => {
    if (Object.hasOwn(settings, 'defaultValue')) {
      defaultState[id] = settings.defaultValue;
    }
  });

  const controls = baseControls.map(control => {
    const settings = fields[control.id];
    if (!settings) return { ...control };

    const nextControl = { ...control };
    ['min', 'max', 'step', 'options', 'inactiveValue'].forEach(key => {
      if (Object.hasOwn(settings, key)) {
        nextControl[key] = settings[key];
      }
    });

    if (Object.hasOwn(control, 'inactiveValue') && !Object.hasOwn(settings, 'inactiveValue') && Object.hasOwn(settings, 'defaultValue')) {
      nextControl.inactiveValue = settings.defaultValue;
    }

    return nextControl;
  });

  return { defaultState, controls };
}
