ALTER TABLE loans
  ADD COLUMN payment_status ENUM('UNPAID', 'PARTIAL', 'PAID') NOT NULL DEFAULT 'UNPAID' AFTER balance;

UPDATE loans
SET payment_status = CASE
  WHEN balance <= 0 THEN 'PAID'
  WHEN paid > 0 THEN 'PARTIAL'
  ELSE 'UNPAID'
END;
