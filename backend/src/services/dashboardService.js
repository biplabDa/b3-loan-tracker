const { query } = require('../config/db');

async function getDashboardSummary() {
  const [customerStats] = await query('SELECT COUNT(*) AS total_customers FROM customers');
  const [loanStats] = await query(
    'SELECT COALESCE(SUM(amount), 0) AS total_loan_amount, COALESCE(SUM(balance), 0) AS total_balance FROM loans'
  );
  const [collectionStats] = await query(
    'SELECT COALESCE(SUM(amount), 0) AS total_collected FROM payments'
  );
  const [overdueStats] = await query(
    `SELECT COALESCE(SUM(balance), 0) AS total_overdue_amount
     FROM loans
     WHERE balance > 0
       AND CURRENT_DATE() > DATE_ADD(start_date, INTERVAL duration MONTH)`
  );
  const [profitStats] = await query(
    `SELECT COALESCE(SUM((paid / NULLIF(total, 0)) * (total - amount)), 0) AS total_profit
     FROM loans`
  );

  return {
    total_customers: Number(customerStats.total_customers),
    total_loan_amount: Number(loanStats.total_loan_amount),
    total_collected: Number(collectionStats.total_collected),
    total_profit: Number(profitStats.total_profit || 0),
    total_overdue_amount: Number(overdueStats.total_overdue_amount),
    total_outstanding_balance: Number(loanStats.total_balance)
  };
}

module.exports = {
  getDashboardSummary
};
