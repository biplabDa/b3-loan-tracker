CREATE DATABASE IF NOT EXISTS b3_loan_tracker;
USE b3_loan_tracker;

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customers_name (name),
  INDEX idx_customers_phone (phone)
);

CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(6, 2) NOT NULL,
  duration INT NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  emi DECIMAL(12, 2) NOT NULL,
  paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
  balance DECIMAL(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loans_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE RESTRICT,
  INDEX idx_loans_customer_id (customer_id),
  INDEX idx_loans_start_date (start_date)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_loan
    FOREIGN KEY (loan_id)
    REFERENCES loans(id)
    ON DELETE CASCADE,
  INDEX idx_payments_loan_id (loan_id),
  INDEX idx_payments_payment_date (payment_date)
);
