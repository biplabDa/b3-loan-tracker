const { StatusCodes } = require('http-status-codes');
const { query } = require('../config/db');
const { calculateLoanDetails, roundTo2 } = require('../utils/loanCalculator');
const {
  requiredDate,
  requiredNonNegativeNumber,
  requiredPositiveNumber
} = require('../utils/validation');

function getPaymentStatus(paid, balance) {
  if (Number(balance) <= 0) {
    return 'PAID';
  }

  if (Number(paid) > 0) {
    return 'PARTIAL';
  }

  return 'UNPAID';
}

async function createLoan(payload) {
  const customerId = requiredPositiveNumber(payload.customer_id, 'Customer ID');
  const amount = requiredPositiveNumber(payload.amount, 'Loan amount');
  const interestRate = requiredNonNegativeNumber(payload.interest_rate, 'Interest rate');
  const duration = requiredPositiveNumber(payload.duration, 'Duration');
  const startDate = requiredDate(payload.start_date, 'Start date');

  const customerRows = await query('SELECT id FROM customers WHERE id = ?', [customerId]);
  if (!customerRows.length) {
    const error = new Error('Customer not found.');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const calc = calculateLoanDetails(amount, interestRate, duration);
  const paymentStatus = getPaymentStatus(0, calc.totalPayable);

  const result = await query(
    `INSERT INTO loans (customer_id, amount, interest_rate, duration, total, emi, paid, balance, payment_status, start_date)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      customerId,
      calc.principal,
      calc.interestRateMonthly,
      calc.durationMonths,
      calc.totalPayable,
      calc.emi,
      calc.totalPayable,
      paymentStatus,
      startDate
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
    payment_status: paymentStatus,
    start_date: startDate
  };
}

async function updateLoan(loanId, payload) {
  const validLoanId = requiredPositiveNumber(loanId, 'Loan ID');

  const loanRows = await query(
    `SELECT id, customer_id, amount, interest_rate, duration, total, emi, paid, start_date
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

  const customerId =
    payload.customer_id === undefined
      ? Number(existingLoan.customer_id)
      : requiredPositiveNumber(payload.customer_id, 'Customer ID');
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

  if (customerId !== Number(existingLoan.customer_id)) {
    const customerRows = await query('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (!customerRows.length) {
      const error = new Error('Customer not found.');
      error.statusCode = StatusCodes.NOT_FOUND;
      throw error;
    }
  }

  const calc = calculateLoanDetails(amount, interestRate, duration);
  const paid = roundTo2(Number(existingLoan.paid));

  if (paid > calc.totalPayable) {
    const error = new Error('Updated loan total cannot be less than already paid amount.');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  const balance = roundTo2(calc.totalPayable - paid);
  const paymentStatus = getPaymentStatus(paid, balance);

  await query(
    `UPDATE loans
     SET customer_id = ?, amount = ?, interest_rate = ?, duration = ?, total = ?, emi = ?, paid = ?, balance = ?, payment_status = ?, start_date = ?
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
      paymentStatus,
      startDate,
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
    payment_status: paymentStatus,
    start_date: startDate
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
      l.payment_status,
       l.start_date,
       l.created_at,
       DATE_ADD(l.start_date, INTERVAL l.duration MONTH) AS due_date,
       CASE
         WHEN l.balance > 0 AND CURRENT_DATE() > DATE_ADD(l.start_date, INTERVAL l.duration MONTH)
         THEN DATEDIFF(CURRENT_DATE(), DATE_ADD(l.start_date, INTERVAL l.duration MONTH))
         ELSE 0
       END AS overdue_days,
       CASE
         WHEN l.balance > 0 AND CURRENT_DATE() > DATE_ADD(l.start_date, INTERVAL l.duration MONTH)
         THEN 1
         ELSE 0
       END AS is_overdue
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
      l.payment_status,
       l.start_date,
       DATE_ADD(l.start_date, INTERVAL l.duration MONTH) AS due_date,
       DATEDIFF(CURRENT_DATE(), DATE_ADD(l.start_date, INTERVAL l.duration MONTH)) AS overdue_days
     FROM loans l
     INNER JOIN customers c ON c.id = l.customer_id
     WHERE l.balance > 0
       AND CURRENT_DATE() > DATE_ADD(l.start_date, INTERVAL l.duration MONTH)
     ORDER BY overdue_days DESC`
  );
}

module.exports = {
  createLoan,
  updateLoan,
  getLoans,
  getOverdueLoans
};
