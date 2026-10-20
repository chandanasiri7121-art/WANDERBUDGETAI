# Security Architecture & RBAC: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Dr. V. SIVAKUMAR  

---

## 1. Single Users Table RBAC
WanderBudget AI maintains all user profiles in a single `users` table with a `role` attribute (`TRAVELER` vs `ADMIN`).

* **TRAVELER**: Allowed access to itinerary planning, destination exploratory dashboards, personal expense tracking, and personal alert notifications.
* **ADMIN**: Access to system health diagnostics, live destination benchmarks management, and PostgreSQL audit trail ledgers.

---

## 2. Authentication: JWT & Google OAuth 2.0
* **Bcrypt Password Hashing**: Hashed with 10 salt rounds before storage.
* **JWT Access Tokens**: Cryptographically signed using HMAC SHA-256 (`JWT_SECRET`) with 24-hour expiration.
* **Google OAuth 2.0**: Seamless single sign-on linking into the single `users` database table with audit trail recording.

---

## 3. SQL Injection Defense
* Interaction with PostgreSQL is mediated through **Prisma ORM**, which utilizes parameterized statements by design.
* Raw queries executed for analytical views and stored procedure triggers use parameterized placeholders (`$1`, `$2`), eliminating SQL injection vulnerabilities.

---

## 4. Secrets Management
* Database connection strings, JWT secrets, and AI API keys reside exclusively in `.env` and are excluded from Git via `.gitignore`.
