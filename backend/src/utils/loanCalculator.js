function roundTo2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function calculateLoanDetails(principal, interestRateMonthly, durationMonths) {
  const p = Number(principal);
  const r = Number(interestRateMonthly);
  const t = Number(durationMonths);

  if (p <= 0 || r < 0 || t <= 0) {
    throw new Error('Invalid loan values.');
  }

  const interest = (p * r * t) / 100;
  const total = p + interest;
  const emi = total / t;

  return {
    principal: roundTo2(p),
    interestRateMonthly: roundTo2(r),
    durationMonths: Math.trunc(t),
    totalInterest: roundTo2(interest),
    totalPayable: roundTo2(total),
    emi: roundTo2(emi)
  };
}

module.exports = {
  calculateLoanDetails,
  roundTo2
};
