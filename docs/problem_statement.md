# Problem Statement

## Patient Billing & Insurance Settlement Tracker
### Delight Physiotherapy, Hyderabad

---

## The Problem

Delight Physiotherapy provides rehabilitation and physiotherapy services to both insured and uninsured patients in Hyderabad. Despite serving a significant number of patients daily, the clinic currently relies entirely on manual registers, paper forms, and spreadsheets to manage all aspects of patient billing and insurance claim processing. This approach creates several critical operational failures:

1. **Unbilled Sessions**: Physiotherapy sessions are recorded manually, and some sessions go unbilled entirely. This results in direct revenue loss that the clinic cannot quantify or recover.

2. **Lost Pre-Authorisation Data**: Insurance pre-authorisation reference numbers (required before any claim can be submitted) are written on paper and frequently misplaced. Without the pre-auth code, a claim cannot be submitted, and the session revenue is lost.

3. **Unknown Claim Settlement Status**: Insurance claims are submitted via paper forms and tracked on a spreadsheet. The clinic has no real-time visibility into which claims have been approved, settled, or rejected without making manual phone calls to each insurer — a process that consumes hours of staff time weekly.

4. **Uncollected Patient Co-Pay**: The patient co-pay amount — the difference between the session fee and the insurance-settled amount — is not systematically tracked. Many patients never pay their outstanding share, and the clinic has no mechanism to identify or follow up on these balances.

5. **No Monthly Financial Summary**: At month-end, the finance team cannot determine the total amount billed, the total insurance-settled amount, and the total outstanding patient co-pay without manually aggregating data from multiple spreadsheets — a process that takes days and is prone to errors.

---

## Impact of the Problem

- Direct revenue loss from unbilled sessions and uncollected co-pays
- Claims submitted without pre-auth codes are rejected, causing 100% revenue loss on those sessions
- No ability to predict monthly cash flow
- Staff spend significant time on manual reconciliation instead of patient care
- Audit compliance risk due to incomplete and untracked financial records

---

## Proposed Solution

A Patient Billing & Insurance Settlement Tracker system that automates the complete billing lifecycle from session registration through insurance claim submission to co-pay collection, providing the clinic with real-time financial visibility and eliminating all manual reconciliation processes.

**Core Co-Pay Calculation Formula:**
```
balance_due = session_fee − insurance_settled_amount
```
