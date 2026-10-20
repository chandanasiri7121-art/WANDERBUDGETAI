# Testing & Verification: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Dr. V. SIVAKUMAR  

---

## 1. Automated End-to-End Verification Test Suite
WanderBudget AI includes a comprehensive, automated test runner (`test_wanderbudget_24BAI0226.js`) that directly exercises the Express.js API and verifies live PostgreSQL database mutations and calculations without mocks.

### Command to Execute Tests:
```bash
node test_wanderbudget_24BAI0226.js
```

---

## 2. Test Cases Specification & Results (15/15 PASS)

| Test ID | Test Name | Target Layer / Component | Assertion & Verification Condition | Status |
| :---: | :--- | :--- | :--- | :---: |
| **01** | System Health & DB Connectivity | PostgreSQL Connection Pool | Returns `OPERATIONAL`, `database.connected: true`, student reg: `24BAI0226`. | **PASS** |
| **02** | Traveler Authentication & JWT | Single Users Table / Bcrypt | Traveler `24BAI0226` logs in; receives signed JWT token with role `TRAVELER`. | **PASS** |
| **03** | Admin Authentication & RBAC | Single Users Table / Bcrypt | Admin `ADMIN001` logs in; receives signed JWT token with role `ADMIN`. | **PASS** |
| **04** | Global Destinations Retrieval | `destinations` & `cost_of_living` | Fetches active destinations with live cost indices and foreign exchange rates. | **PASS** |
| **05** | Stored Procedure Execution | `sp_calculate_trip_budget` | Dynamic calculation for Tokyo (5 days, Standard, 2 pax) generates 5 budget categories. | **PASS** |
| **06** | ACID Transaction Trip Creation | `prisma.$transaction` | Creates trip and atomically seeds `trip_budget_breakdowns` across all 5 categories. | **PASS** |
| **07** | Analytical View Inspection | `v_trip_budget_summary` | Verifies view aggregation of duration, total budget, spent amount, and health status. | **PASS** |
| **08** | Trip Itinerary Place Addition | `trip_places` & `attractions` | Links attraction to trip itinerary day with estimated entrance admission in INR. | **PASS** |
| **09** | Log Expense within Budget | `trip_expenses` & Trigger | Logs normal expense; trigger increments category spent without alert. | **PASS** |
| **10** | Trigger Alert: Warning (80%) | `trg_check_budget_overrun` | Logs expense reaching 85% of category allowance; trigger generates `WARNING_80_PERCENT`. | **PASS** |
| **11** | Trigger Alert: Critical (100%)| `trg_check_budget_overrun` | Logs expense exceeding 100% of category allowance; trigger generates `BUDGET_EXCEEDED`. | **PASS** |
| **12** | Budget Category Variance View | `v_trip_category_variance` | Reads analytical view; validates utilization percentage and variance calculation. | **PASS** |
| **13** | RBAC Privilege Enforcement | Route Guard Middleware | Traveler token attempting admin endpoint receives HTTP 403 Forbidden. | **PASS** |
| **14** | Audit Log Ledger Verification | `audit_logs` Table | Confirms tamper-evident records exist for logins, trip creations, and expense logs. | **PASS** |
| **15** | Destination Cost Overview View| `v_destination_cost_overview` | Verifies multi-table join and aggregate counts of attractions per destination. | **PASS** |

---

## 3. Sample Test Execution Console Log

```
================================================================
 WanderBudget AI — Automated Verification Suite (24BAI0226) 
================================================================

✔ PASS: Test 1: System Health & PostgreSQL Database Connectivity
✔ PASS: Test 2: Traveler Login & JWT Generation (24BAI0226)
✔ PASS: Test 3: Admin Login & RBAC Verification (ADMIN001)
✔ PASS: Test 4: Fetch Global Destinations with Cost Indices
✔ PASS: Test 5: Execute Stored Procedure sp_calculate_trip_budget
✔ PASS: Test 6: ACID Transaction - Create Trip & Seed Breakdowns
✔ PASS: Test 7: Verify Analytical View v_trip_budget_summary
✔ PASS: Test 8: Schedule Attraction into Trip Itinerary
✔ PASS: Test 9: Log Normal Expense within Budget Allowance
✔ PASS: Test 10: Trigger Verification - 80% Threshold Warning Alert
✔ PASS: Test 11: Trigger Verification - 100% Budget Overrun Alert
✔ PASS: Test 12: Verify Analytical View v_trip_category_variance
✔ PASS: Test 13: RBAC Security Guard - Prevent Unauthorized Admin Access
✔ PASS: Test 14: Tamper-Evident Audit Trail Logging Verification
✔ PASS: Test 15: Verify Analytical View v_destination_cost_overview

================================================================
 Test Summary: 15 Passed | 0 Failed (100% Success Rate)
 Student: Garudaiahgari Sai Siri Chandana (24BAI0226)
================================================================
```
