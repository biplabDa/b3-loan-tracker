const { query } = require('../config/db');

async function getDashboardSummary() {
  const [customerStats] = await query('SELECT COUNT(*) AS total_customers FROM customers');
  const [loanStats] = await query(
    `SELECT
       COALESCE(SUM(amount), 0) AS total_loan_amount,
       COALESCE(SUM(balance), 0) AS total_balance
     FROM loans`
  );
  const [collectionStats] = await query(
    'SELECT COALESCE(SUM(amount), 0) AS total_collected FROM payments'
  );
  const [overdueStats] = await query(
    `SELECT COALESCE(
        SUM(
          CASE
            WHEN CURRENT_DATE() > next_payment_date
                 AND LEAST(paid, GREATEST(total - amount, 0)) < GREATEST(total - amount, 0)
            THEN GREATEST(monthly_interest_due - current_cycle_paid, 0)
            ELSE 0
          END
        ),
        0
      ) AS total_overdue_amount
     FROM loans
     WHERE balance > 0`
  );
  const [profitStats] = await query(
    `SELECT COALESCE(SUM(LEAST(paid, GREATEST(total - amount, 0))), 0) AS total_profit
     FROM loans`
  );
  console.log("hhhhhh", [profitStats]);

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
