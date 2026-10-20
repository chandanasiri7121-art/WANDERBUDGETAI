# Objectives & Scope: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Dr. V. SIVAKUMAR  

---

## 1. Project Objectives
1. **Design a Comprehensive 3NF Relational Database**: Build an 11-table schema enforcing referential integrity, check constraints, unique constraints, and B-Tree indexing.
2. **Develop a Dynamic Budget Stored Procedure**: Implement `sp_calculate_trip_budget` in PostgreSQL to calculate accommodation, food, transit, admissions, and buffer allowances based on destination cost indices.
3. **Automate Overrun Prevention with Triggers**: Build `trg_check_budget_overrun` on `trip_expenses` to automatically calculate category spending and log threshold alerts.
4. **Deploy Multi-Table Analytical Views**: Provide high-performance views (`v_trip_budget_summary`, `v_trip_category_variance`, `v_destination_cost_overview`) for immediate dashboard rendering.
5. **Implement Secure Single Users Table RBAC**: Secure the system via JWT tokens and Google OAuth 2.0 while maintaining all users in a single `users` table as requested by faculty.
6. **Provide Interactive What-If Simulation**: Allow travelers to simulate itinerary variations, style changes, and duration adjustments dynamically.

---

## 2. Project Scope
* **Geographical Coverage**: Destinations across Europe, Asia, Americas, Middle East, Oceania, and India.
* **Budget Categories**: Accommodation, Food, Transit, Sightseeing, and 10% Contingency Buffer.
* **Traveler Styles**: Budget (hostels & street food), Standard (3-star & casual dining), Luxury (5-star & fine dining).
* **Security & Auditing**: Tamper-evident logging of all system actions in `audit_logs`.
* **DevOps & Backup**: Complete native `pg_dump` backup scripts, Docker containerization, and GitHub Actions CI/CD.
