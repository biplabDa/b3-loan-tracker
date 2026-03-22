const { StatusCodes } = require('http-status-codes');
const { pool, query } = require('../config/db');
const { roundTo2 } = require('../utils/loanCalculator');
const { requiredDate, requiredPositiveNumber } = require('../utils/validation');

async function addPayment(payload) {
  const loanId = requiredPositiveNumber(payload.loan_id, 'Loan ID');
  const amount = requiredPositiveNumber(payload.amount, 'Amount');
  const paymentDate = requiredDate(payload.payment_date, 'Payment date');

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [loanRows] = await connection.execute(
      'SELECT id, paid, balance FROM loans WHERE id = ? FOR UPDATE',
      [loanId]
    );

    if (!loanRows.length) {
      const error = new Error('Loan not found.');
      error.statusCode = StatusCodes.NOT_FOUND;
      throw error;
    }

    const loan = loanRows[0];

    if (amount > Number(loan.balance)) {
      const error = new Error('Payment amount cannot exceed remaining balance.');
      error.statusCode = StatusCodes.BAD_REQUEST;
      throw error;
    }

    const [paymentResult] = await connection.execute(
      'INSERT INTO payments (loan_id, amount, payment_date) VALUES (?, ?, ?)',
      [loanId, amount, paymentDate]
    );

    const paid = roundTo2(Number(loan.paid) + amount);
    const balance = roundTo2(Number(loan.balance) - amount);
    const paymentStatus = balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID';

    await connection.execute('UPDATE loans SET paid = ?, balance = ?, payment_status = ? WHERE id = ?', [
      paid,
      balance,
      paymentStatus,
      loanId
    ]);

    await connection.commit();

    return {
      id: paymentResult.insertId,
      loan_id: loanId,
      amount,
      payment_date: paymentDate,
      paid,
      balance,
      payment_status: paymentStatus
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getPaymentsByLoan(loanId) {
  const validLoanId = requiredPositiveNumber(loanId, 'Loan ID');

  const loanRows = await query('SELECT id FROM loans WHERE id = ?', [validLoanId]);
  if (!loanRows.length) {
    const error = new Error('Loan not found.');
    error.statusCode = StatusCodes.NOT_FOUND;
    throw error;
  }

  return query(
    `SELECT id, loan_id, amount, payment_date
     FROM payments
     WHERE loan_id = ?
     ORDER BY payment_date DESC, id DESC`,
    [validLoanId]
  );
}

module.exports = {
  addPayment,
  getPaymentsByLoan
};
