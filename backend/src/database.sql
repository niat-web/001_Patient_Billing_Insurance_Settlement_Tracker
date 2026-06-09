
CREATE DATABASE IF NOT EXISTS patient_billing;
USE patient_billing;

-- Patients table with insurance details
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  date_of_birth DATE,
  insurer VARCHAR(255),
  policy_no VARCHAR(100),
  preauth_code VARCHAR(100),
  approved_sessions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table - records each physiotherapy session
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  session_date DATE NOT NULL,
  physiotherapist VARCHAR(255),
  session_type ENUM('Assessment', 'Treatment', 'Review') NOT NULL DEFAULT 'Treatment',
  duration_mins INT DEFAULT 60,
  fee DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Insurance claims table - submitted claims per session
CREATE TABLE IF NOT EXISTS insurance_claims (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  claim_no VARCHAR(100) NOT NULL,
  submitted_date DATE NOT NULL,
  claimed_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Settled') DEFAULT 'Pending',
  insurer VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Claim settlements table - records insurance payment
CREATE TABLE IF NOT EXISTS claim_settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  claim_id INT NOT NULL,
  settled_amount DECIMAL(10, 2) NOT NULL,
  settlement_date DATE NOT NULL,
  shortfall_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES insurance_claims(id) ON DELETE CASCADE
);

-- Co-pay balances table - balance_due = session_fee - insurance_settled_amount
CREATE TABLE IF NOT EXISTS copay_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  session_id INT NOT NULL,
  claim_id INT,
  session_fee DECIMAL(10, 2) NOT NULL,
  settled_amount DECIMAL(10, 2) DEFAULT 0,
  balance_due DECIMAL(10, 2) NOT NULL,
  status ENUM('Outstanding', 'Paid', 'Waived') DEFAULT 'Outstanding',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Sample data for testing
INSERT INTO patients (name, phone, email, insurer, policy_no, preauth_code, approved_sessions) VALUES
('Rajesh Kumar', '9876543210', 'rajesh@email.com', 'Star Health Insurance', 'SH2024001', 'AUTH001', 12),
('Priya Sharma', '9876543211', 'priya@email.com', 'HDFC ERGO Health', 'HE2024002', 'AUTH002', 8),
('Mohan Reddy', '9876543212', 'mohan@email.com', 'United India Insurance', 'UI2024003', 'AUTH003', 15),
('Sunita Patel', '9876543213', 'sunita@email.com', 'New India Assurance', 'NI2024004', 'AUTH004', 10),
('Arjun Singh', '9876543214', 'arjun@email.com', 'ICICI Lombard Health', 'IL2024005', 'AUTH005', 20);
