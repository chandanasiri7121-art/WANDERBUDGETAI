# REST API Documentation: SkillGap Radar

**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Dr. V. SIVAKUMAR  
**Base URL:** `http://localhost:5001/api`  
**Authentication:** `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new student account.
- **Request Body:** `{ full_name, email, reg_no, password }`
- **Response (201):** `{ message, user_id, email, reg_no }`

### `POST /api/auth/login`
Authenticates a student or administrator.
- **Request Body:** `{ emailOrRegNo, password }`
- **Response (200):** `{ token, user: { user_id, full_name, email, reg_no, role } }`

### `GET /api/auth/me`
Retrieves the currently authenticated user's profile.

---

## 2. Career Roles & Versioning

### `GET /api/career-roles`
Lists all career roles with their active and historical versions.

### `GET /api/career-roles/:roleId/requirements`
Retrieves required competencies, target proficiencies, and importance weights for a role.

---

## 3. Assessments & AI Diagnostic Engine

### `POST /api/ai/generate-quiz`
Generates a 3-question diagnostic quiz for a skill, saved directly into `assessment_questions`.
- **Request Body:** `{ skill_id, difficulty }`
- **Response (200):** `{ skill_id, skill_name, questions: [...] }` (Correct answers withheld from client)

### `POST /api/ai/submit-and-analyze`
Grades submission, invokes trigger `trg_before_assessment`, executes procedure `sp_generate_gap_report`, and returns updated readiness.
- **Request Body:** `{ skill_id, version_id, answers: [{ question_id, selected_option }] }`

---

## 4. Skill Gap Analysis & Analytical View

### `GET /api/skill-gaps/report/:versionId`
Fetches detailed competency gaps, priority scores, and overall readiness percentage.

### `GET /api/roadmap/:versionId`
Queries PostgreSQL analytical view `vw_student_roadmap_24BAI0226_SaiSiriChandana` with pagination, search, and category filtering.

---

## 5. Standout Telemetry & Graph Intelligence

### `GET /api/skills/prerequisite-graph`
Returns nodes and directed prerequisite edges for the competency DAG.

### `GET /api/skill-gaps/multi-role-comparison`
Computes comparative readiness across all active career roles.

### `GET /api/assessments/progress-timeline`
Retrieves the student's historical assessment trajectory chronologically.

---

## 6. SkillGap Radar 360: What-If Career Simulator

### `POST /api/simulator/calculate`
Calculates hypothetical readiness gains, gap reductions, study hours, and cross-role spillover.
- **Request Body:** `{ role_version_id, simulated_skills: [{ skill_id, simulated_level }] }`
- **Response (200):** `{ baseline_readiness_pct, simulated_readiness_pct, readiness_gain_pct, total_estimated_study_hours, prerequisite_alerts, cross_role_impact, skills }`

### `POST /api/simulator/save-scenario`
Persists a named hypothetical scenario in `simulation_scenarios` without mutating actual assessment rows.

### `GET /api/simulator/saved-scenarios`
Lists all saved scenarios for the authenticated student.

### `GET /api/simulator/shared-skill-optimization`
Ranks cross-cutting competencies by multi-role leverage score.

---

## 7. Administrator Control & Profiler

### `POST /api/admin/requirements`
Atomically updates role competency criteria via ACID transaction and logs to `audit_logs`.

### `GET /api/admin/query-benchmarks`
Executes `EXPLAIN (ANALYZE, BUFFERS)` on analytical view and indexed queries, returning real execution times and shared hit buffer blocks.

### `GET /api/admin/audit-logs`
Retrieves paginated tamper-evident security audit logs.

### `POST /api/admin/job-description-analysis`
Parses unstructured job description text, matching candidate skills to the canonical catalogue.

### `POST /api/admin/job-description-analysis/approve`
Publishes a new requirement version from human-reviewed job description requirements.
