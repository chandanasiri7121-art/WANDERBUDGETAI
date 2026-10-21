# Project Overview: WanderBudget AI

**Project Title:** WanderBudget AI — Dynamic Trip Budget Builder & Live AI Cost-of-Living Analyzer  
**Course:** BCSE302P Database Systems Lab  
`24BAI0226`  
**Slot:** `L25+L26` | **Faculty In-Charge:** Faculty In-Charge  
**Institution:** School of Computer Science and Engineering (SCOPE), VIT Chennai  
**Academic Year:** Fall Semester 2026–27  

---

## 1. Executive Summary
**WanderBudget AI** is an enterprise-grade, full-stack database application engineered to provide travelers, tourists, and student explorers with deterministic, evidence-based travel budget planning coupled with real-time cost-of-living intelligence. 

While conventional platforms like MakeMyTrip or Booking.com restrict their functionality to booking static hotel and airline tickets, WanderBudget AI models the complete daily economics of travel — accommodating meals, intra-city transit passes, attraction admission fees, and currency fluctuation contingency buffers.

### Core DBMS Highlights:
1. **11 Normalized Relational Tables (3NF/BCNF)**: Covering users, destinations, cost indices, attractions, trips, itinerary places, budget categories, breakdowns, expenses, alerts, and audit logs.
2. **PostgreSQL Stored Procedure (`sp_calculate_trip_budget`)**: Computes itemized travel budgets dynamically based on duration, party size, travel style, and live cost-of-living indices.
3. **Automated Budget Overrun Trigger (`trg_check_budget_overrun`)**: Fires automatically upon every expense insert/update, updating totals and creating real-time alert logs at 80% and 100% budget thresholds.
4. **Analytical SQL Views**: Pre-compiled database views (`v_trip_budget_summary`, `v_trip_category_variance`, `v_destination_cost_overview`) providing instant reporting and KPI calculations.
5. **ACID Transactions (`prisma.$transaction`)**: Guarantees atomic trip generation and category breakdown seeding.
6. **Single Users Table RBAC**: Manages all user identities within a single `users` table with role distinction (`TRAVELER` vs `ADMIN`), bcrypt password hashing, and Google OAuth 2.0 integration.
7. **What-If Financial Simulator**: Interactive frontend simulator enabling users to dynamically model budget changes without altering stored records.
