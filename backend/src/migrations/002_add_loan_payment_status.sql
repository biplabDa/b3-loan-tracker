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

UPDATE loans
SET payment_status = CASE
  WHEN LEAST(paid, GREATEST(total - amount, 0)) >= GREATEST(total - amount, 0) THEN 'PAID'
  WHEN LEAST(paid, GREATEST(total - amount, 0)) > 0 THEN 'PARTIAL'
  ELSE 'UNPAID'
END;
