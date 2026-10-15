# Database Design & Normalization: SkillGap Radar

**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Dr. V. SIVAKUMAR  

---

## 1. Normalization Analysis (1NF to 3NF)

### First Normal Form (1NF)
- Every table has a distinct primary key (`PK`).
- Attribute values are atomic (e.g., student full name, individual options `option_a`, `option_b`, `option_c`, `option_d`).
- No repeating groups or comma-separated lists of skills in user records.

### Second Normal Form (2NF)
- All tables are in 1NF.
- Every non-key attribute is fully functionally dependent on the entire primary key.
- Composite relationships (e.g., `JobRequirements`, `SkillPrerequisites`, `SimulationSkillChanges`) isolate association attributes so no partial dependency on composite keys occurs.

### Third Normal Form (3NF)
- All tables are in 2NF.
- No transitive dependencies exist. For example:
  - Role titles and domains are isolated in `job_roles`, not redundantly stored in `job_role_versions` or `skill_gap_reports`.
  - Skill category and descriptions reside exclusively in `skills`.
  - User role names reside in `roles`, linked via foreign key `role_id` in `users`.

---

## 2. Integrity Constraints & Foreign Keys

| Constraint Type | Table | Columns / Rule | Academic Justification |
| :--- | :--- | :--- | :--- |
| **PRIMARY KEY** | All 20 tables | Unique integer `id` (`autoincrement`) | Enforces entity integrity and enables clustered B-Tree indexing. |
| **UNIQUE** | `users` | `email`, `reg_no` | Guarantees uniqueness for university registration numbers and emails. |
| **UNIQUE** | `job_requirements` | `(version_id, skill_id)` | Prevents duplicate skill definitions within the same role version. |
| **CHECK** | `job_requirements` | `1 <= required_proficiency <= 5` | Mathematical bounds for industry competency scales. |
| **CHECK** | `assessment_attempts`| `score_percent BETWEEN 0 AND 100` | Percentage validation for quiz grading. |
| **FOREIGN KEY** | `job_role_versions` | `job_role_id REFERENCES job_roles(job_role_id) ON DELETE CASCADE` | Referential integrity linking version to career track. |
| **FOREIGN KEY** | `simulation_scenarios` | `user_id REFERENCES users(user_id) ON DELETE CASCADE` | Preserves ownership and isolated student scenario sandboxing. |

---

## 3. Indexing Strategy
To optimize throughput under concurrent queries, the following PostgreSQL B-Tree indexes are deployed:
- `idx_users_reg_no` on `users(reg_no)`: Rapid login lookup.
- `idx_attempts_user_skill` on `assessment_attempts(user_id, skill_id)`: Sub-millisecond lookup for latest student proficiency.
- `idx_job_reqs_version` on `job_requirements(version_id)`: Fast retrieval during stored procedure execution.
- `idx_audit_logs_user` on `audit_logs(user_id, created_at)`: Instant audit ledger sorting.
