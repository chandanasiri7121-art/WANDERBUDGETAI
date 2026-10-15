# DBMS Feature Demonstration: SkillGap Radar

**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Dr. V. SIVAKUMAR  

---

## 1. Relational Triggers (`trg_before_assessment`)
Executed before `INSERT` on `assessment_attempts`. Automatically computes discrete proficiency level (1–5) from raw percentage scores and writes an audit event:

```sql
CREATE OR REPLACE FUNCTION fn_before_assessment_attempt_24BAI0226_SaiSiriChandana()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score_percent >= 90.0 THEN
    NEW.assessed_proficiency := 5;
  ELSIF NEW.score_percent >= 75.0 THEN
    NEW.assessed_proficiency := 4;
  ELSIF NEW.score_percent >= 60.0 THEN
    NEW.assessed_proficiency := 3;
  ELSIF NEW.score_percent >= 40.0 THEN
    NEW.assessed_proficiency := 2;
  ELSE
    NEW.assessed_proficiency := 1;
  END IF;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at)
  VALUES (
    NEW.user_id,
    'INSERT_ASSESSMENT_ATTEMPT',
    'assessment_attempts',
    NEW.attempt_id,
    CONCAT('Assessed proficiency calculated as ', NEW.assessed_proficiency, '/5 from score ', ROUND(NEW.score_percent, 2), '% by trg_before_assessment_24BAI0226_SaiSiriChandana'),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_before_assessment_24BAI0226_SaiSiriChandana
BEFORE INSERT ON assessment_attempts
FOR EACH ROW
EXECUTE FUNCTION fn_before_assessment_attempt_24BAI0226_SaiSiriChandana();
```

---

## 2. Stored Procedures (`sp_generate_gap_report`)
Calculates prioritized gaps and aggregate career readiness percentages atomically:

```sql
CREATE OR REPLACE PROCEDURE sp_generate_gap_report_24BAI0226_SaiSiriChandana(
  p_user_id INT,
  p_version_id INT
)
LANGUAGE plpgsql AS $$
DECLARE
  v_report_id INT;
  v_req RECORD;
  v_assessed_prof INT;
  v_gap INT;
  v_priority NUMERIC(5,2);
  v_reason TEXT;
  v_total_skills INT := 0;
  v_met_skills INT := 0;
  v_readiness_pct NUMERIC(5,2) := 0.0;
BEGIN
  INSERT INTO skill_gap_reports (user_id, version_id, overall_readiness_pct, generated_at)
  VALUES (p_user_id, p_version_id, 0.0, NOW())
  RETURNING report_id INTO v_report_id;

  FOR v_req IN
    SELECT jr.skill_id, jr.required_proficiency, jr.importance_weight, s.skill_name
    FROM job_requirements jr
    JOIN skills s ON s.skill_id = jr.skill_id
    WHERE jr.version_id = p_version_id
  LOOP
    v_total_skills := v_total_skills + 1;

    SELECT COALESCE(
      (SELECT assessed_proficiency 
       FROM assessment_attempts 
       WHERE user_id = p_user_id AND skill_id = v_req.skill_id 
       ORDER BY attempted_at DESC LIMIT 1), 
      0
    ) INTO v_assessed_prof;

    IF v_req.required_proficiency > v_assessed_prof THEN
      v_gap := v_req.required_proficiency - v_assessed_prof;
    ELSE
      v_gap := 0;
      v_met_skills := v_met_skills + 1;
    END IF;

    v_priority := ROUND((v_req.importance_weight * (v_gap::NUMERIC / 5.0)), 2);
    v_reason := CONCAT('Skill gap of ', v_gap, ' level(s) for ', v_req.skill_name, '. Priority: ', v_priority);

    INSERT INTO skill_gap_details (
      report_id, skill_id, required_proficiency, assessed_proficiency, gap_score, priority_score, recommendation_reason
    ) VALUES (
      v_report_id, v_req.skill_id, v_req.required_proficiency, v_assessed_prof, v_gap, v_priority, v_reason
    );
  END LOOP;

  IF v_total_skills > 0 THEN
    v_readiness_pct := ROUND(((v_met_skills::NUMERIC / v_total_skills::NUMERIC) * 100.0), 2);
  END IF;

  UPDATE skill_gap_reports
  SET overall_readiness_pct = v_readiness_pct
  WHERE report_id = v_report_id;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at)
  VALUES (
    p_user_id,
    'GENERATE_GAP_REPORT',
    'skill_gap_reports',
    v_report_id,
    CONCAT('SkillGap report #', v_report_id, ' generated for user ', p_user_id, ' with readiness ', v_readiness_pct, '% via sp_generate_gap_report_24BAI0226_SaiSiriChandana'),
    NOW()
  );
END;
$$;
```

---

## 3. Analytical Views (`vw_student_roadmap`)
Multi-table analytical view joining gap details, skill taxonomies, prerequisites, and learning resources:

```sql
CREATE OR REPLACE VIEW vw_student_roadmap_24BAI0226_SaiSiriChandana AS
SELECT 
  sgr.report_id,
  sgr.user_id,
  u.full_name AS student_name,
  u.reg_no,
  jrv.version_id,
  jrv.version_number,
  jr.title AS role_title,
  s.skill_id,
  s.skill_name,
  s.skill_code,
  s.category AS skill_category,
  sgd.required_proficiency,
  sgd.assessed_proficiency,
  sgd.gap_score,
  sgd.priority_score,
  sgd.recommendation_reason,
  COALESCE(
    (SELECT string_agg(ps.skill_name, ', ')
     FROM skill_prerequisites sp
     JOIN skills ps ON ps.skill_id = sp.prerequisite_skill_id
     WHERE sp.skill_id = s.skill_id),
    'None'
  ) AS prerequisites_list,
  COALESCE(lr.title, 'Curated Practice Problems & Documentation') AS recommended_resource_title,
  COALESCE(lr.resource_url, 'https://github.com/topics/database') AS resource_url,
  COALESCE(lr.difficulty_level, 'Intermediate') AS resource_difficulty,
  COALESCE(lr.est_minutes, 45) AS est_minutes
FROM skill_gap_reports sgr
JOIN users u ON u.user_id = sgr.user_id
JOIN job_role_versions jrv ON jrv.version_id = sgr.version_id
JOIN job_roles jr ON jr.job_role_id = jrv.job_role_id
JOIN skill_gap_details sgd ON sgd.report_id = sgr.report_id
JOIN skills s ON s.skill_id = sgd.skill_id
LEFT JOIN LATERAL (
  SELECT lr_inner.title, lr_inner.resource_url, lr_inner.difficulty_level, lr_inner.est_minutes
  FROM learning_resources lr_inner
  WHERE lr_inner.skill_id = s.skill_id
  ORDER BY lr_inner.resource_id ASC
  LIMIT 1
) lr ON TRUE;
```

---

## 4. Query Profiling via `EXPLAIN (ANALYZE, BUFFERS)`
Live performance telemetry verified via `/api/admin/query-benchmarks`:
- **Indexed B-Tree Lookup (`assessment_attempts`)**: Execution time **0.022 ms** | Planning time: **0.031 ms** | Shared hit blocks: **1**.
- **Analytical View (`vw_student_roadmap`)**: Execution time **0.787 ms** | Planning time: **2.282 ms** | Shared hit blocks: **159**.
