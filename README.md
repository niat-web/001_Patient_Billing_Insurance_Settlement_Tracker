# Patient Billing & Insurance Settlement Tracker

A full-stack web application designed for **Delight Physiotherapy** to automate the complete billing lifecycle. This system eliminates manual reconciliation processes by tracking physiotherapy sessions, submitting insurance claims, and automatically calculating outstanding patient co-pay balances.

## 🚀 Features

- **Patient Management:** Register patients along with their insurance details (insurer, policy number, pre-auth codes).
- **Session Tracking:** Log daily physiotherapy sessions, assigned therapists, and session fees.
- **Insurance Claim Submission:** Track claims from submission to settlement.
- **Co-Pay Calculation:** Automatically calculates the remaining balance the patient owes after insurance settles using the core formula:
  `balance_due = session_fee − insurance_settled_amount`
- **Analytics Dashboard:** Real-time financial visibility showing total billed, insurance settled, and outstanding co-pays.
- **Patient Ledger:** Detailed financial history for individual patients.

## 💻 Technology Stack

- **Frontend:** React.js, React Router, Axios
- **Backend:** Node.js, Express.js
- **Database:** MySQL

## 🛠️ How to Run Locally

### 1. Database Setup
1. Ensure MySQL is running on your machine.
2. Run the `backend/src/database.sql` script to create the `patient_billing` database and its tables.

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Ensure your `.env` file is set up with your MySQL credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).
4. Start the server:
   ```
   npm start
   ```
   *The server will run on http://localhost:5000*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
  ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the React app:
   ```
   npm start
   ```
   *The web application will open automatically at http://localhost:3000*

## 📖 API Documentation
Detailed API specifications and routing logic can be found in `docs/api_spec.md`.

---
*Developed for Delight Physiotherapy, Hyderabad.*
