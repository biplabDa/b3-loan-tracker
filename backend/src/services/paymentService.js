const { StatusCodes } = require('http-status-codes');
const { pool, query } = require('../config/db');
const { roundTo2 } = require('../utils/loanCalculator');
const {
  addMonthsToDate,
  calculatePaymentStatus,
  formatDateOnly
} = require('../utils/paymentSchedule');
const { requiredDate, requiredPositiveNumber } = require('../utils/validation');

async function addPayment(payload) {
  const loanId = requiredPositiveNumber(payload.loan_id, 'Loan ID');
  const amount = requiredPositiveNumber(payload.amount, 'Amount');
  const paymentDate = requiredDate(payload.payment_date, 'Payment date');

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [loanRows] = await connection.execute(
      `SELECT id, amount, total, paid, balance, monthly_interest_due, current_cycle_paid, last_payment_date, next_payment_date
       FROM loans
       WHERE id = ?
       FOR UPDATE`,
      [loanId]
    );

    if (!loanRows.length) {
      const error = new Error('Loan not found.');
      error.statusCode = StatusCodes.NOT_FOUND;
      throw error;
    }

    const loan = loanRows[0];
    const monthlyInterestDue = Number(loan.monthly_interest_due || 0);

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
    const totalInterest = roundTo2(Math.max(Number(loan.total) - Number(loan.amount), 0));
    let currentCyclePaid = roundTo2(Number(loan.current_cycle_paid || 0) + amount);
    let nextPaymentDate = formatDateOnly(loan.next_payment_date);

    while (balance > 0 && monthlyInterestDue > 0 && currentCyclePaid >= monthlyInterestDue) {
      currentCyclePaid = roundTo2(currentCyclePaid - monthlyInterestDue);
      nextPaymentDate = addMonthsToDate(nextPaymentDate, 1);
    }

    const paymentStatus = calculatePaymentStatus({
      balance,
      cyclePaid: currentCyclePaid,
      monthlyInterestDue,
      nextPaymentDate,
      lastPaymentDate: paymentDate,
      referenceDate: paymentDate
    });

    await connection.execute(
      `UPDATE loans
       SET paid = ?, balance = ?, current_cycle_paid = ?, payment_status = ?, last_payment_date = ?, next_payment_date = ?
       WHERE id = ?`,
      [paid, balance, currentCyclePaid, paymentStatus, paymentDate, nextPaymentDate, loanId]
    );

    await connection.commit();

    return {
      id: paymentResult.insertId,
      loan_id: loanId,
      amount,
      payment_date: paymentDate,
      paid,
      balance,
      total_interest: totalInterest,
      total_interest_paid: roundTo2(Math.min(paid, totalInterest)),
      current_cycle_paid: currentCyclePaid,
      monthly_interest_due: monthlyInterestDue,
      paid_month_count: monthlyInterestDue > 0 ? Math.floor(roundTo2(Math.min(paid, totalInterest)) / monthlyInterestDue) : 0,
      next_payment_date: nextPaymentDate,
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
