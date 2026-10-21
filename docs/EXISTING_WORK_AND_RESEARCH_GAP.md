# Existing Work & Research Gap: SkillGap Radar

`24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Faculty In-Charge  

---

## 1. Review of Existing Systems

| Platform / Framework | Assessment Methodology | Versioning Support | Prerequisite Intelligence | What-If Simulation |
| :--- | :--- | :--- | :--- | :--- |
| **LinkedIn Skill Badges** | Static 15-question quiz; binary pass/fail badge. | No versioning of requirements. | None; flat skill list. | None; static profile view. |
| **Coursera Career Academy** | Video watch progress + graded assignments. | Dynamic course updates but opaque criteria. | Course-level sequential recommendations. | None. |
| **Pluralsight Skill IQ** | Adaptive Bayesian quiz with percentile ranking. | Proprietary percentile baselines. | Linear domain tracks. | None; single-role score only. |
| **O*NET & ESCO Databases** | Authoritative occupational taxonomies. | Periodic multi-year survey revisions. | Hierarchical knowledge structures. | Government database lookup only. |
| **SkillGap Radar 360** (This Work) | **Evidence-based scoring via PostgreSQL trigger; 1–5 level mapping.** | **Versioned job requirements (`v1.0`, `v2.0`) with historical report preservation.** | **Directed Acyclic Graph (DAG) with prerequisite guardrails.** | **Interactive proficiency modeling & multi-role shared-skill optimization.** |

---

## 2. Identified Research & Engineering Gaps

### Gap 1: Superficial Chatbots vs. Deterministic Database Engines
Many modern proposals attempt to bolt an LLM chatbot onto a platform to "talk about careers." However, career readiness requires verifiable, deterministic calculations. Chatbots hallucinate percentages and cannot guarantee ACID consistency across requirement updates. SkillGap Radar uses PostgreSQL triggers and stored procedures for mathematical precision, reserving AI strictly as an auxiliary tool for optional job description parsing and question generation.

### Gap 2: Conflation of Actual Evidence and Hypothetical Goals
In existing systems, if a student changes their profile to reflect an aspirational skill level, their actual historical record is overwritten. SkillGap Radar enforces a strict architectural boundary:
- `assessment_attempts`: Permanent, unalterable historical assessment evidence.
- `simulation_scenarios`: Isolated hypothetical models that never mutate production readiness scores.

### Gap 3: Single-Role Isolation vs. Multi-Career Optimization
Traditional systems ask a student to commit to a single career track (e.g., "Full Stack Developer"). If the student also considers "Data Analyst", they must re-run completely separate analyses. SkillGap Radar's **Shared-Skill Multi-Role Optimizer** calculates cross-role spillover and ranks skills by multi-career leverage scores.
