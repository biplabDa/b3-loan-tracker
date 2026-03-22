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
  balance,
  cyclePaid,
  monthlyInterestDue,
  nextPaymentDate,
  lastPaymentDate,
  referenceDate = new Date()
}) {
  if (Number(balance) <= 0) {
    return 'PAID';
  }

  const paidThisCycle = roundTo2(Number(cyclePaid) || 0);
  const dueAmount = roundTo2(Number(monthlyInterestDue) || 0);
  const dueDate = parseDateOnly(nextPaymentDate);
  const currentDate = parseDateOnly(referenceDate);

  if (dueAmount > 0 && paidThisCycle >= dueAmount) {
    return 'PAID';
  }

  if (paidThisCycle > 0) {
    return currentDate > dueDate ? 'UNPAID' : 'PARTIAL';
  }

  if (lastPaymentDate && currentDate <= dueDate) {
    return 'PAID';
  }

  return currentDate > dueDate ? 'UNPAID' : 'UPCOMING';
}

module.exports = {
  parseDateOnly,
  formatDateOnly,
  addMonthsToDate,
  calculateMonthlyInterestDue,
  calculatePaymentStatus
};
