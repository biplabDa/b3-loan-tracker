const { StatusCodes } = require('http-status-codes');
const { query } = require('../config/db');
const { calculateLoanDetails } = require('../utils/loanCalculator');
const {
  requiredDate,
  requiredNonNegativeNumber,
  requiredPositiveNumber
} = require('../utils/validation');

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

  const result = await query(
    `INSERT INTO loans (customer_id, amount, interest_rate, duration, total, emi, paid, balance, start_date)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      customerId,
      calc.principal,
      calc.interestRateMonthly,
      calc.durationMonths,
      calc.totalPayable,
      calc.emi,
      calc.totalPayable,
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
  getLoans,
  getOverdueLoans
};
