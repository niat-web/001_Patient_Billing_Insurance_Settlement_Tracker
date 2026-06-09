# API Specification
## Patient Billing & Insurance Settlement Tracker
### Base URL: http://localhost:5000

---

## 1. Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns server status |

**Response:**
```json
{
  "status": "ok",
  "project": "patient-billing---insurance-settlement-tracker",
  "company": "Delight Physiotherapy"
}
```

---

## 2. Patients API

### 2.1 Register Patient
**POST** `/api/patients`

**Request Body:**
```json
{
  "name": "Rajesh Kumar",
  "phone": "9876543210",
  "email": "rajesh@email.com",
  "date_of_birth": "1985-03-15",
  "insurer": "Star Health Insurance",
  "policy_no": "SH2024001",
  "preauth_code": "AUTH001",
  "approved_sessions": 12
}
```
**Required Fields:** `name`

**Success Response (201):**
```json
{ "success": true, "message": "Patient registered successfully", "id": 1 }
```

---

### 2.2 Get All Patients
**GET** `/api/patients`

**Query Parameters:**
- `search` — Search by name, policy number, or insurer

**Success Response (200):**
```json
{ "success": true, "data": [...patients array] }
```

---

### 2.3 Get Patient Details (with all sessions, claims, balances)
**GET** `/api/patients/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Rajesh Kumar",
    "insurer": "Star Health Insurance",
    "policy_no": "SH2024001",
    "sessions": [
      {
        "id": 1,
        "session_date": "2026-06-05",
        "fee": 1500.00,
        "claim_no": "CLM001",
        "claim_status": "Settled",
        "settled_amount": 1200.00,
        "balance_due": 300.00
      }
    ]
  }
}
```

---

### 2.4 Update Patient
**PUT** `/api/patients/:id`

**Request Body:** Same as POST. `name` is required.

---

### 2.5 Delete Patient
**DELETE** `/api/patients/:id`

---

## 3. Sessions API

### 3.1 Record Session
**POST** `/api/sessions`

**Request Body:**
```json
{
  "patient_id": 1,
  "session_date": "2026-06-05",
  "physiotherapist": "Dr. Priya Mehta",
  "session_type": "Treatment",
  "duration_mins": 60,
  "fee": 1500.00,
  "notes": "Lower back rehabilitation"
}
```
**Required Fields:** `patient_id`, `session_date`, `fee`

**session_type values:** `Assessment`, `Treatment`, `Review`

---

### 3.2 Get All Sessions
**GET** `/api/sessions`

**Query Parameters:**
- `patient_id` — Filter by patient
- `session_type` — Filter by type

---

### 3.3 Get Session Detail
**GET** `/api/sessions/:id`

---

## 4. Insurance Claims API

### 4.1 Submit Insurance Claim
**POST** `/api/claims`

**Request Body:**
```json
{
  "session_id": 1,
  "claim_no": "CLM2026001",
  "submitted_date": "2026-06-06",
  "claimed_amount": 1500.00,
  "insurer": "Star Health Insurance",
  "notes": "Pre-auth code AUTH001"
}
```
**Required Fields:** `session_id`, `claim_no`, `submitted_date`, `claimed_amount`

---

### 4.2 Get All Claims
**GET** `/api/claims`

**Query Parameters:**
- `status` — Filter by: `Pending`, `Approved`, `Rejected`, `Settled`
- `patient_id` — Filter by patient

---

### 4.3 Update Claim Status
**PATCH** `/api/claims/:id/status`

**Request Body:**
```json
{ "status": "Approved" }
```
**Valid statuses:** `Pending`, `Approved`, `Rejected`, `Settled`

---

## 5. Settlements API

### 5.1 Record Settlement (Core Business Logic)
**POST** `/api/settlements`

Core Formula: `balance_due = session_fee − insurance_settled_amount`

**Request Body:**
```json
{
  "claim_id": 1,
  "settled_amount": 1200.00,
  "settlement_date": "2026-06-10",
  "shortfall_reason": "Policy deductible applied"
}
```
**Required Fields:** `claim_id`, `settled_amount`, `settlement_date`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Settlement recorded successfully",
  "data": {
    "session_fee": 1500.00,
    "settled_amount": 1200.00,
    "balance_due": 300.00,
    "copay_status": "Outstanding"
  }
}
```

---

### 5.2 Get All Settlements
**GET** `/api/settlements`

---

## 6. Dashboard API

### 6.1 Summary Statistics
**GET** `/api/dashboard/summary`

**Response includes:**
- `totals` — Total sessions, total billed, insurance pending/settled, total co-pay outstanding
- `claimsByStatus` — Count and amount per claim status (for pie chart)
- `monthlyTrend` — 6-month billed vs settled vs outstanding (for bar chart)
- `physiotherapistStats` — Session count per physiotherapist (for comparison chart)
- `outstandingCopay` — Top 5 patients with highest outstanding balance

---

### 6.2 Outstanding Co-Pay Balances
**GET** `/api/dashboard/copay-balances`

Returns all sessions with an outstanding patient co-pay balance.

---

## Error Response Format

All errors follow this standard format:

```json
{
  "success": false,
  "message": "Specific error description"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request — validation error |
| 404 | Not Found — resource does not exist |
| 500 | Internal Server Error |
