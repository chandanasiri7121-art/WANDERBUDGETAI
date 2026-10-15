# Security Architecture & RBAC: SkillGap Radar

**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Dr. V. SIVAKUMAR  

---

## 1. Security Architecture Principles

### 1. Cryptographic Password Hashing
- User passwords are salted and hashed using **bcrypt** with a cost factor of 10 (`bcrypt.hash(password, 10)`).
- Plaintext passwords are never stored in PostgreSQL or logged to console or audit trails.

### 2. Stateless JSON Web Tokens (JWT)
- Authenticated sessions issue signed JWTs containing `{ user_id, email, reg_no, role }`.
- Tokens expire in 24 hours (`expiresIn: '24h'`) and are validated on every secured route via `authenticate_24BAI0226_SaiSiriChandana`.

### 3. Role-Based Access Control (RBAC)
- Strict boundary between `STUDENT` and `ADMIN` roles:
  - Students can only view their own assessment attempts, generate personal gap reports, and save personal simulation scenarios.
  - Route middleware `authorize_24BAI0226_SaiSiriChandana(['ADMIN'])` blocks students from modifying requirement criteria, running query benchmarks, accessing system audit logs, or publishing requirement versions.

### 4. Zero Client-Side Assessment Leakage
- When questions are generated and sent to the client via `POST /api/ai/generate-quiz`, the `correct_option` field is explicitly deleted from the JSON response.
- Answer grading is performed strictly server-side inside `POST /api/ai/submit-and-analyze`.

### 5. SQL Injection Immunity
- All database operations are executed using **Prisma ORM** with parameterized queries or explicit typed parameters in raw SQL calls.

### 6. Automated PostgreSQL Audit Trail
- High-impact events are captured in `audit_logs` with timestamps, executing user ID, affected table, and forensic details:
  - `ADMIN_UPSERT_REQUIREMENT`
  - `GENERATE_GAP_REPORT`
  - `INSERT_ASSESSMENT_ATTEMPT`
  - `SAVE_WHAT_IF_SCENARIO`
  - `PUBLISH_VERSION_FROM_JD`
