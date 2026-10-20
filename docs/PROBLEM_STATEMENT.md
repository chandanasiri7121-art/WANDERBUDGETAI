# Problem Statement: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Dr. V. SIVAKUMAR  

---

## 1. Context & Background
Planning leisure or educational travel requires balancing diverse expenditure streams: accommodation, dining, intra-city transit, sightseeing attraction admissions, and contingency buffers. In international destinations, this is further compounded by foreign currency exchange rate conversions, differing local standards of living, and unpredictable inflation.

## 2. Research Gap & Deficiencies in Existing Systems
1. **Disconnected Travel Booking Platforms**: Commercial engines (MakeMyTrip, Booking.com, Airbnb) focus solely on static pre-trip bookings (hotels and flights). They provide zero predictive ground expense intelligence (e.g., how much will 5 days of meals, metro passes, and museum entries cost in Tokyo vs. Paris for a student?).
2. **Absence of Real-Time Dynamic Modeling**: Static tourism guides and blogs become outdated rapidly as local transport tariffs and currency exchange rates fluctuate.
3. **Lack of Automated Budget Controls**: Travelers routinely face unexpected budget overruns because traditional applications lack automated threshold warning triggers that alert users when specific categories (e.g., dining or shopping) cross allocated boundaries.
4. **Relational Data Management Challenges**: Most student-built projects simplify travel planning into non-relational or unnormalized models without ACID transaction guarantees, leading to inconsistent state between total budgets and category breakdowns.

## 3. The Proposed Solution: WanderBudget AI
**WanderBudget AI** addresses these challenges by implementing an enterprise relational database system engineered on PostgreSQL 16 and Prisma ORM:
* **Dynamic Budget Calculation Engine**: A native stored procedure (`sp_calculate_trip_budget`) that generates itemized budgets dynamically using destination benchmarks, party size, and travel style.
* **Proactive Budget Overrun Triggers**: An automated trigger (`trg_check_budget_overrun`) executing after every expense insert/update, updating totals and creating real-time alert logs at 80% and 100% threshold crossings.
* **Single Users Table RBAC**: Adherence to database best practices by managing all roles (`TRAVELER` and `ADMIN`) within a single table with secure password hashing and OAuth integration.
* **What-If Simulation Sandbox**: A dynamic interactive interface enabling travelers to explore cost variations across styles and durations without mutating permanent database records.
