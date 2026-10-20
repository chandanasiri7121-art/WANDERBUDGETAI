# REST API Documentation: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Dr. V. SIVAKUMAR  
**Base URL:** `http://localhost:5001/api`

---

## 1. Authentication & RBAC Endpoints

### `POST /api/auth/register`
* **Description:** Register a new traveler into the single `users` table.
* **Payload:** `{ "reg_no": "24BAI0226", "full_name": "...", "email": "...", "password": "..." }`
* **Response:** `{ "message": "User registered successfully", "user": { ... } }`

### `POST /api/auth/login`
* **Description:** Authenticate traveler or admin, returning a cryptographically signed JWT.
* **Payload:** `{ "login_id": "24BAI0226", "password": "..." }`
* **Response:** `{ "token": "<JWT_TOKEN>", "user": { "user_id": 1, "role": "TRAVELER", ... } }`

### `POST /api/auth/google`
* **Description:** Sign in with Google OAuth 2.0 with account linking into the single `users` table.

---

## 2. Destinations & Live Cost Benchmarks

### `GET /api/destinations`
* **Description:** Fetch all destinations with joined cost of living benchmarks and attractions count.
* **Query Params:** `continent`, `search`, `page`, `limit`

### `GET /api/destinations/:id`
* **Description:** Fetch detailed destination profile, cost index tiers, and all available attractions.

### `POST /api/destinations/calculate-budget`
* **Description:** Invokes PostgreSQL stored procedure `sp_calculate_trip_budget`.
* **Payload:** `{ "destination_id": 1, "duration_days": 5, "travel_style": "STANDARD", "group_size": 2 }`
* **Response:** Array of 5 calculated categories with allocated INR, daily rates, and calculation basis.

---

## 3. Trip Planning & ACID Transactions

### `POST /api/trips`
* **Description:** Atomically creates a trip and initializes 5 budget breakdown rows via `prisma.$transaction`.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Payload:** `{ "destination_id": 1, "title": "Tokyo Summer", "duration_days": 5, "travel_style": "STANDARD", "group_size": 2 }`

### `GET /api/trips`
* **Description:** List trips created by the authenticated user with utilization status and alert indicators.

### `GET /api/trips/:id`
* **Description:** Get full trip details with itinerary places, breakdown categories, and logged expenses.

### `POST /api/trips/:id/places`
* **Description:** Schedule an attraction into a trip itinerary day.

---

## 4. Expenses & Overrun Trigger Alerts

### `POST /api/trips/:id/expenses`
* **Description:** Log a travel expense. Automatically fires PostgreSQL trigger `trg_check_budget_overrun`.
* **Payload:** `{ "category_id": 1, "expense_name": "Hotel Shinjuku", "amount_inr": 12000, "payment_method": "CARD" }`

### `GET /api/trips/:id/alerts`
* **Description:** Retrieve trigger-generated alerts (`WARNING_80_PERCENT`, `BUDGET_EXCEEDED`, `TRIP_OVERRUN`).

---

## 5. Analytical Views & Admin Diagnostics

### `GET /api/views/trip-summary`
* **Description:** Queries SQL view `v_trip_budget_summary`.

### `GET /api/views/category-variance/:tripId`
* **Description:** Queries SQL view `v_trip_category_variance`.

### `GET /api/admin/system-health`
* **Description:** Administrative telemetry (PostgreSQL pool status, table row counts, uptime, student register number). Requires `role = 'ADMIN'`.

### `GET /api/admin/audit-logs`
* **Description:** Read immutable audit trail records from `audit_logs` table.
