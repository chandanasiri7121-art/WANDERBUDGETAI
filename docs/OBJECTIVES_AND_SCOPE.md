# Objectives & Scope: SkillGap Radar

**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Dr. V. SIVAKUMAR  

---

## 1. Project Objectives

1. **Relational Database Integrity (3NF)**: Design and implement a normalized PostgreSQL database schema comprising 20 tables modeling users, roles, skills, requirements, versions, attempts, questions, learning resources, and audit logs.
2. **Deterministic Proficiency Evaluation**: Implement active database triggers (`trg_before_assessment_24BAI0226_SaiSiriChandana`) to convert raw quiz percentage scores into validated proficiency levels (1–5) and log events to audit tables.
3. **Automated Gap Analysis & Scoring**: Develop stored procedures (`sp_generate_gap_report_24BAI0226_SaiSiriChandana`) executing parameterized gap computations ($G_s = \max(R_s - A_s, 0)$) and role importance prioritization ($Q_s = W_s \times (G_s / 5.0)$).
4. **Adaptive Learning & Analytical Roadmaps**: Deploy PostgreSQL views (`vw_student_roadmap_24BAI0226_SaiSiriChandana`) joining gaps with learning resources, prerequisite constraints, and duration estimates.
5. **Interactive What-If Career Simulation (SkillGap Radar 360)**: Build a hypothetical modeling engine allowing students to adjust proficiencies, calculate gap reductions, receive prerequisite violation alerts, and measure cross-career spillover without mutating permanent assessment rows.
6. **Administrative Governance & ACID Transactions**: Provide administrator tools with atomic transactions (`prisma.$transaction`) for modifying requirement criteria and publishing new versions from employer job descriptions.
7. **Comprehensive Auditability & Profiling**: Implement PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` execution profiling and continuous security audit logging.

---

## 2. Scope Boundaries

### In Scope
- Full-stack web application with React 18, Tailwind CSS, Recharts, Express.js, Prisma ORM, and PostgreSQL 16.
- Role-Based Access Control (`STUDENT` and `ADMIN`) secured via bcrypt password hashing and JSON Web Tokens (JWT).
- Support for multiple active career roles (Backend & Database Engineer, Data Analyst, Database Developer, Machine Learning Engineer).
- Native backup and restore automation via shell scripts (`backup_24BAI0226.sh`).
- Containerized development environment using Docker and Docker Compose.
- Automated end-to-end testing suite (`test_e2e_24BAI0226.js`) with 14 comprehensive test cases.

### Out of Scope / Explicit Limitations
- The system does not claim to guarantee employment, predict hiring probabilities, or replace comprehensive professional credentialing.
- Third-party learning URLs and questions are curated illustrative academic demonstration fixtures.
