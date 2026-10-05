export function calculateLoan(principal, annualRate, years) {
  const months = years * 12;
  const rate = annualRate / 1200;
  const discount = rate === 0 ? 0 : -Math.expm1(-months * Math.log1p(rate));
  const payment = rate === 0
    ? principal / months
    : principal * rate / discount;

  const schedule = [];
  let balance = principal;
  for (let year = 1; year <= years; year++) {
    const remaining = months - year * 12;
    // Discount the remaining payments to avoid compounding floating-point drift.
    const nextBalance = rate === 0
      ? principal * remaining / months
      : principal * -Math.expm1(-remaining * Math.log1p(rate)) / discount;
    const principalPaid = balance - nextBalance;
    schedule.push({ year, principal: principalPaid, interest: payment * 12 - principalPaid, balance: nextBalance });
    balance = nextBalance;
  }
  const totalRepayment = payment * months;
  return { payment, totalInterest: totalRepayment - principal, totalRepayment, months, schedule };
}
