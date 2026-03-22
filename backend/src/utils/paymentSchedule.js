const { roundTo2 } = require('./loanCalculator');

function parseDateOnly(value) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string') {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value.');
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateOnly(value) {
  const date = parseDateOnly(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonthsToDate(value, months = 1) {
  const date = parseDateOnly(value);
  const targetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDayOfTargetMonth = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth() + 1,
    0
  ).getDate();
  const day = Math.min(date.getDate(), lastDayOfTargetMonth);

  return formatDateOnly(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day));
}

function calculateMonthlyInterestDue(amount, interestRate) {
  return roundTo2((Number(amount) * Number(interestRate)) / 100);
}

function calculatePaymentStatus({
  totalInterest,
  totalInterestPaid
}) {
  const interestTotal = roundTo2(Math.max(Number(totalInterest) || 0, 0));
  const interestPaid = roundTo2(Math.max(Number(totalInterestPaid) || 0, 0));

  if (interestTotal <= 0) {
    return 'PAID';
  }

  if (interestPaid >= interestTotal) {
    return 'PAID';
  }

  if (interestPaid > 0) {
    return 'PARTIAL';
  }

  return 'UNPAID';
}

module.exports = {
  parseDateOnly,
  formatDateOnly,
  addMonthsToDate,
  calculateMonthlyInterestDue,
  calculatePaymentStatus
};
