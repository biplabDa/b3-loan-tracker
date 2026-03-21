const { StatusCodes } = require('http-status-codes');
const { query } = require('../config/db');
const { requiredPositiveNumber } = require('../utils/validation');

async function monthlyCollectionReport() {
  return query(
    `SELECT
       DATE_FORMAT(payment_date, '%Y-%m') AS month,
       COUNT(*) AS total_transactions,
       COALESCE(SUM(amount), 0) AS total_collection
     FROM payments
     GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
     ORDER BY month DESC`
  );
}

async function customerLoanReport(customerId) {
  const validCustomerId = requiredPositiveNumber(customerId, 'Customer ID');

  const customers = await query('SELECT id, name, phone, address FROM customers WHERE id = ?', [
    validCustomerId
  ]);

  if (!customers.length) {
    const error = new Error('Customer not found.');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  const loans = await query(
    `SELECT id, amount, interest_rate, duration, total, emi, paid, balance, start_date, created_at
     FROM loans
     WHERE customer_id = ?
     ORDER BY created_at DESC`,
    [validCustomerId]
  );

  const paymentSummary = await query(
    `SELECT COALESCE(SUM(p.amount), 0) AS total_paid
     FROM payments p
     INNER JOIN loans l ON l.id = p.loan_id
     WHERE l.customer_id = ?`,
    [validCustomerId]
  );

  return {
    customer: customers[0],
    loans,
    total_paid: Number(paymentSummary[0].total_paid || 0)
  };
}

module.exports = {
  monthlyCollectionReport,
  customerLoanReport
};
