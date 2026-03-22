SET @has_payment_status := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'loans'
    AND column_name = 'payment_status'
);

SET @payment_status_sql := IF(
  @has_payment_status = 0,
  'ALTER TABLE loans ADD COLUMN payment_status ENUM(''UPCOMING'', ''UNPAID'', ''PARTIAL'', ''PAID'') NOT NULL DEFAULT ''UPCOMING'' AFTER balance',
  'ALTER TABLE loans MODIFY COLUMN payment_status ENUM(''UPCOMING'', ''UNPAID'', ''PARTIAL'', ''PAID'') NOT NULL DEFAULT ''UPCOMING'''
);

PREPARE stmt_payment_status FROM @payment_status_sql;
EXECUTE stmt_payment_status;
DEALLOCATE PREPARE stmt_payment_status;

SET @has_monthly_interest_due := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'loans'
    AND column_name = 'monthly_interest_due'
);

SET @monthly_interest_due_sql := IF(
  @has_monthly_interest_due = 0,
  'ALTER TABLE loans ADD COLUMN monthly_interest_due DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER start_date',
  'SELECT 1'
);

PREPARE stmt_monthly_interest_due FROM @monthly_interest_due_sql;
EXECUTE stmt_monthly_interest_due;
DEALLOCATE PREPARE stmt_monthly_interest_due;

SET @has_current_cycle_paid := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'loans'
    AND column_name = 'current_cycle_paid'
);

SET @current_cycle_paid_sql := IF(
  @has_current_cycle_paid = 0,
  'ALTER TABLE loans ADD COLUMN current_cycle_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER monthly_interest_due',
  'SELECT 1'
);

PREPARE stmt_current_cycle_paid FROM @current_cycle_paid_sql;
EXECUTE stmt_current_cycle_paid;
DEALLOCATE PREPARE stmt_current_cycle_paid;

SET @has_last_payment_date := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'loans'
    AND column_name = 'last_payment_date'
);

SET @last_payment_date_sql := IF(
  @has_last_payment_date = 0,
  'ALTER TABLE loans ADD COLUMN last_payment_date DATE NULL AFTER payment_status',
  'SELECT 1'
);

PREPARE stmt_last_payment_date FROM @last_payment_date_sql;
EXECUTE stmt_last_payment_date;
DEALLOCATE PREPARE stmt_last_payment_date;

SET @has_next_payment_date := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'loans'
    AND column_name = 'next_payment_date'
);

SET @next_payment_date_sql := IF(
  @has_next_payment_date = 0,
  'ALTER TABLE loans ADD COLUMN next_payment_date DATE NULL AFTER last_payment_date',
  'SELECT 1'
);

PREPARE stmt_next_payment_date FROM @next_payment_date_sql;
EXECUTE stmt_next_payment_date;
DEALLOCATE PREPARE stmt_next_payment_date;

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
  WHEN LEAST(l.paid, GREATEST(l.total - l.amount, 0)) >= GREATEST(l.total - l.amount, 0) THEN 'PAID'
  WHEN LEAST(l.paid, GREATEST(l.total - l.amount, 0)) > 0 THEN 'PARTIAL'
  ELSE 'UNPAID'
END;

ALTER TABLE loans
  MODIFY COLUMN next_payment_date DATE NOT NULL;
