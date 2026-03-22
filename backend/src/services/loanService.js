const { StatusCodes } = require('http-status-codes');
const { query } = require('../config/db');
const { calculateLoanDetails, roundTo2 } = require('../utils/loanCalculator');
const {
  addMonthsToDate,
  calculateMonthlyInterestDue,
  calculatePaymentStatus,
  formatDateOnly
} = require('../utils/paymentSchedule');
const {
  requiredString,
  requiredDate,
  requiredNonNegativeNumber,
  requiredPositiveNumber
} = require('../utils/validation');

const PAYMENT_STATUS_SQL = `CASE
         WHEN l.balance <= 0 THEN 'PAID'
         WHEN l.current_cycle_paid > 0 AND l.current_cycle_paid < l.monthly_interest_due AND CURRENT_DATE() <= l.next_payment_date THEN 'PARTIAL'
         WHEN l.current_cycle_paid > 0 AND l.current_cycle_paid < l.monthly_interest_due AND CURRENT_DATE() > l.next_payment_date THEN 'UNPAID'
         WHEN l.last_payment_date IS NOT NULL AND CURRENT_DATE() <= l.next_payment_date THEN 'PAID'
         WHEN CURRENT_DATE() > l.next_payment_date THEN 'UNPAID'
         ELSE 'UPCOMING'
       END`;

async function resolveCustomerId(payload, fallbackCustomerId) {
  if (payload.customer_id !== undefined) {
    const customerId = requiredPositiveNumber(payload.customer_id, 'Customer ID');
    const customerRows = await query('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (!customerRows.length) {
      const error = new Error('Customer not found.');
      error.statusCode = StatusCodes.NOT_FOUND;
      throw error;
    }

    return customerId;
  }

  if (payload.customer_name !== undefined) {
    const customerName = requiredString(payload.customer_name, 'Customer name');
    const customerRows = await query(
      `SELECT id
       FROM customers
       WHERE LOWER(name) = LOWER(?)
       ORDER BY created_at DESC
       LIMIT 2`,
      [customerName]
    );

    if (!customerRows.length) {
      const error = new Error('Customer not found for provided name.');
      error.statusCode = StatusCodes.NOT_FOUND;
      throw error;
    }

    if (customerRows.length > 1) {
      const error = new Error('Multiple customers found with the same name. Please choose using customer ID.');
      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }

    return Number(customerRows[0].id);
  }

  if (fallbackCustomerId !== undefined) {
    return Number(fallbackCustomerId);
  }

  const error = new Error('Customer ID or customer name is required.');
  error.statusCode = StatusCodes.BAD_REQUEST;
  throw error;
}

async function createLoan(payload) {
  const customerId = await resolveCustomerId(payload);
  const amount = requiredPositiveNumber(payload.amount, 'Loan amount');
  const interestRate = requiredNonNegativeNumber(payload.interest_rate, 'Interest rate');
  const duration = requiredPositiveNumber(payload.duration, 'Duration');
  const startDate = requiredDate(payload.start_date, 'Start date');
  const formattedStartDate = formatDateOnly(startDate);

  const calc = calculateLoanDetails(amount, interestRate, duration);
  const monthlyInterestDue = calculateMonthlyInterestDue(calc.principal, calc.interestRateMonthly);
  const nextPaymentDate = addMonthsToDate(formattedStartDate, 1);
  const paymentStatus = calculatePaymentStatus({
    balance: calc.totalPayable,
    cyclePaid: 0,
    monthlyInterestDue,
    nextPaymentDate,
    lastPaymentDate: null,
    referenceDate: startDate
  });

  const result = await query(
    `INSERT INTO loans (
       customer_id,
       amount,
       interest_rate,
       duration,
       total,
       emi,
       paid,
       balance,
       start_date,
       monthly_interest_due,
       current_cycle_paid,
       payment_status,
       last_payment_date,
       next_payment_date
     )
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?, NULL, ?)`,
    [
      customerId,
      calc.principal,
      calc.interestRateMonthly,
      calc.durationMonths,
      calc.totalPayable,
      calc.emi,
      calc.totalPayable,
      formattedStartDate,
      monthlyInterestDue,
      paymentStatus,
      nextPaymentDate
    ]
  );

  return {
    id: result.insertId,
    customer_id: customerId,
    amount: calc.principal,
    interest_rate: calc.interestRateMonthly,
    duration: calc.durationMonths,
    total: calc.totalPayable,
    emi: calc.emi,
    paid: 0,
    balance: calc.totalPayable,
    monthly_interest_due: monthlyInterestDue,
    current_cycle_paid: 0,
    payment_status: paymentStatus,
    last_payment_date: null,
    next_payment_date: nextPaymentDate,
    start_date: formattedStartDate
  };
}

async function updateLoan(loanId, payload) {
  const validLoanId = requiredPositiveNumber(loanId, 'Loan ID');

  const loanRows = await query(
    `SELECT id, customer_id, amount, interest_rate, duration, total, emi, paid, balance, start_date,
            monthly_interest_due, current_cycle_paid, last_payment_date, next_payment_date
     FROM loans
     WHERE id = ?`,
    [validLoanId]
  );

  if (!loanRows.length) {
    const error = new Error('Loan not found.');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const existingLoan = loanRows[0];

  const customerId = await resolveCustomerId(payload, Number(existingLoan.customer_id));
  const amount =
    payload.amount === undefined ? Number(existingLoan.amount) : requiredPositiveNumber(payload.amount, 'Loan amount');
  const interestRate =
    payload.interest_rate === undefined
      ? Number(existingLoan.interest_rate)
      : requiredNonNegativeNumber(payload.interest_rate, 'Interest rate');
  const duration =
    payload.duration === undefined ? Number(existingLoan.duration) : requiredPositiveNumber(payload.duration, 'Duration');
  const startDate =
    payload.start_date === undefined
      ? new Date(existingLoan.start_date)
      : requiredDate(payload.start_date, 'Start date');
  const formattedStartDate = formatDateOnly(startDate);

  const calc = calculateLoanDetails(amount, interestRate, duration);
  const paid = roundTo2(Number(existingLoan.paid));

  if (paid > calc.totalPayable) {
    const error = new Error('Updated loan total cannot be less than already paid amount.');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const balance = roundTo2(calc.totalPayable - paid);
  const monthlyInterestDue = calculateMonthlyInterestDue(calc.principal, calc.interestRateMonthly);
  let currentCyclePaid = roundTo2(Number(existingLoan.current_cycle_paid) || 0);
  let nextPaymentDate = existingLoan.next_payment_date
    ? formatDateOnly(existingLoan.next_payment_date)
    : addMonthsToDate(formattedStartDate, 1);

  if (!existingLoan.last_payment_date) {
    nextPaymentDate = addMonthsToDate(formattedStartDate, 1);
  }

  while (balance > 0 && monthlyInterestDue > 0 && currentCyclePaid >= monthlyInterestDue) {
    currentCyclePaid = roundTo2(currentCyclePaid - monthlyInterestDue);
    nextPaymentDate = addMonthsToDate(nextPaymentDate, 1);
  }

  const paymentStatus = calculatePaymentStatus({
    balance,
    cyclePaid: currentCyclePaid,
    monthlyInterestDue,
    nextPaymentDate,
    lastPaymentDate: existingLoan.last_payment_date,
    referenceDate: new Date()
  });

  await query(
    `UPDATE loans
     SET customer_id = ?, amount = ?, interest_rate = ?, duration = ?, total = ?, emi = ?, paid = ?, balance = ?, start_date = ?, monthly_interest_due = ?, current_cycle_paid = ?, payment_status = ?, next_payment_date = ?
     WHERE id = ?`,
    [
      customerId,
      calc.principal,
      calc.interestRateMonthly,
      calc.durationMonths,
      calc.totalPayable,
      calc.emi,
      paid,
      balance,
      formattedStartDate,
      monthlyInterestDue,
      currentCyclePaid,
      paymentStatus,
      nextPaymentDate,
      validLoanId
    ]
  );

  return {
    id: validLoanId,
    customer_id: customerId,
    amount: calc.principal,
    interest_rate: calc.interestRateMonthly,
    duration: calc.durationMonths,
    total: calc.totalPayable,
    emi: calc.emi,
    paid,
    balance,
    monthly_interest_due: monthlyInterestDue,
    current_cycle_paid: currentCyclePaid,
    payment_status: paymentStatus,
    last_payment_date: existingLoan.last_payment_date ? formatDateOnly(existingLoan.last_payment_date) : null,
    next_payment_date: nextPaymentDate,
    start_date: formattedStartDate
  };
}

async function getLoans(search = '') {
  const term = `%${search.trim()}%`;

  const rows = await query(
    `SELECT
       l.id,
       l.customer_id,
       c.name AS customer_name,
       c.phone AS customer_phone,
       l.amount,
       l.interest_rate,
       l.duration,
       l.total,
       l.emi,
       l.paid,
       l.balance,
       l.monthly_interest_due,
       l.current_cycle_paid,
       l.start_date,
       l.last_payment_date,
       l.next_payment_date,
       l.created_at,
       DATE_ADD(l.start_date, INTERVAL l.duration MONTH) AS due_date,
       CASE
         WHEN l.balance > 0 AND CURRENT_DATE() > l.next_payment_date
         THEN DATEDIFF(CURRENT_DATE(), l.next_payment_date)
         ELSE 0
       END AS overdue_days,
       CASE
         WHEN l.balance > 0 AND CURRENT_DATE() > l.next_payment_date
         THEN 1
         ELSE 0
       END AS is_overdue,
       ${PAYMENT_STATUS_SQL} AS payment_status
     FROM loans l
     INNER JOIN customers c ON c.id = l.customer_id
     WHERE (? = '%%' OR c.name LIKE ? OR c.phone LIKE ?)
     ORDER BY l.created_at DESC`,
    [term, term, term]
  );

  return rows;
}

async function getOverdueLoans() {
  return query(
    `SELECT
       l.id,
       l.customer_id,
       c.name AS customer_name,
       c.phone AS customer_phone,
       l.amount,
       l.total,
       l.paid,
       l.balance,
       l.monthly_interest_due,
       l.current_cycle_paid,
       l.start_date,
       l.last_payment_date,
       l.next_payment_date,
       DATE_ADD(l.start_date, INTERVAL l.duration MONTH) AS due_date,
       DATEDIFF(CURRENT_DATE(), l.next_payment_date) AS overdue_days,
       ${PAYMENT_STATUS_SQL} AS payment_status
     FROM loans l
     INNER JOIN customers c ON c.id = l.customer_id
     WHERE l.balance > 0
       AND CURRENT_DATE() > l.next_payment_date
     ORDER BY overdue_days DESC`
  );
}

module.exports = {
  createLoan,
  updateLoan,
  getLoans,
  getOverdueLoans
};
