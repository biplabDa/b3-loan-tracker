ALTER TABLE loans
  MODIFY COLUMN payment_status ENUM('UPCOMING', 'UNPAID', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'UPCOMING',
  ADD COLUMN IF NOT EXISTS monthly_interest_due DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER start_date,
  ADD COLUMN IF NOT EXISTS current_cycle_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER monthly_interest_due,
  ADD COLUMN IF NOT EXISTS last_payment_date DATE NULL AFTER payment_status,
  ADD COLUMN IF NOT EXISTS next_payment_date DATE NULL AFTER last_payment_date;

UPDATE loans l
SET l.monthly_interest_due = ROUND((l.amount * l.interest_rate) / 100, 2),
    l.current_cycle_paid = 0,
    l.last_payment_date = (
      SELECT MAX(p.payment_date)
      FROM payments p
      WHERE p.loan_id = l.id
    ),
    l.next_payment_date = COALESCE(
      DATE_ADD(
        (
          SELECT MAX(p.payment_date)
          FROM payments p
          WHERE p.loan_id = l.id
        ),
        INTERVAL 1 MONTH
      ),
      DATE_ADD(l.start_date, INTERVAL 1 MONTH)
    );

UPDATE loans l
SET l.payment_status = CASE
  WHEN l.balance <= 0 THEN 'PAID'
  WHEN l.current_cycle_paid > 0 AND l.current_cycle_paid < l.monthly_interest_due AND CURRENT_DATE() <= l.next_payment_date THEN 'PARTIAL'
  WHEN l.current_cycle_paid > 0 AND l.current_cycle_paid < l.monthly_interest_due AND CURRENT_DATE() > l.next_payment_date THEN 'UNPAID'
  WHEN l.last_payment_date IS NOT NULL AND CURRENT_DATE() <= l.next_payment_date THEN 'PAID'
  WHEN CURRENT_DATE() > l.next_payment_date THEN 'UNPAID'
  ELSE 'UPCOMING'
END;

ALTER TABLE loans
  MODIFY COLUMN next_payment_date DATE NOT NULL;
