# Problem Statement: SkillGap Radar

**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Dr. V. SIVAKUMAR  

---

## 1. The Core Problem
Undergraduate engineering students and early-career job applicants face an acute mismatch between university curriculum outcomes and rapidly evolving industry technical requirements. While thousands of online job descriptions and learning platforms exist, students struggle with three fundamental obstacles:

1. **Unverified Self-Perception vs. Industry Criteria**: Most career platforms rely on self-reported checkboxes (e.g., "Intermediate SQL" on LinkedIn). Students lack an objective, mathematically rigorous method to evaluate their demonstrated technical competency against current industry baselines.
2. **Static Snapshots without Longitudinal Tracking**: Traditional career guidance treats skill acquisition as a static point-in-time assessment. When industry requirements evolve (e.g., transition from monolithic SQL to distributed transactions), students have no version-aware mechanism to see how older assessments relate to new standards.
3. **Absence of Hypothetical "What-If" Planning**: When planning their final semester or summer internship preparation, students constantly ask: *"If I dedicate 4 weeks to mastering Database Indexing and Python, will that single effort qualify me for both Backend Engineering and Data Analytics?"* Existing systems do not offer an isolated sandbox to model hypothetical gains without tampering with actual assessment evidence.

---

## 2. Research & Academic Scope
In the context of the **BCSE302P Database Systems Lab**, this project solves these problems using formal database engineering principles:
- **Preventing Self-Reported Bias**: Proficiency values ($1 \le P \le 5$) are strictly calculated via database trigger `trg_before_assessment_24BAI0226_SaiSiriChandana` based on actual assessment attempt scores.
- **Relational Integrity & 3NF Normalization**: 20 normalized tables model career hierarchies, versioning, prerequisite graphs, learning assets, and audit logs without data anomalies.
- **Deterministic Prioritization**: Avoids black-box predictive claims; priorities and readiness scores are computed transparently via stored procedures using well-documented formulas.
- **Isolated Simulation Sandbox**: Hypothetical changes are persisted in dedicated tables (`simulation_scenarios`, `simulation_skill_changes`), preserving historical assessment attempts from corruption.
