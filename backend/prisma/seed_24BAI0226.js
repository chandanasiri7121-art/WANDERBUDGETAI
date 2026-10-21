// ============================================================================
// SkillGap Radar - Database Seed & Advanced SQL Procedures
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main_seed_24BAI0226_SaiSiriChandana() {
  console.log('----------------------------------------------------------------');
  console.log('Garudaiahgari Sai Siri Chandana (24BAI0226) | Slot: L25+L26');
  console.log('Initiating Seed & SQL Object Creation at:', new Date().toISOString());
  console.log('----------------------------------------------------------------');

  // 1. Roles
  console.log('[1/7] Seeding Roles Master...');
  const roles = ['ADMIN', 'STUDENT', 'EDUCATOR'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { role_name: roleName },
      update: {},
      create: { role_name: roleName },
    });
  }

  const roleStudent = await prisma.role.findUnique({ where: { role_name: 'STUDENT' } });
  const roleAdmin = await prisma.role.findUnique({ where: { role_name: 'ADMIN' } });
  const roleEducator = await prisma.role.findUnique({ where: { role_name: 'EDUCATOR' } });

  // 2. Single Users Table (Strict Compliance Rule)
  console.log('[2/7] Seeding Users into Single "users" Table...');
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const educatorPasswordHash = await bcrypt.hash('Faculty@123', 10);

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@vitstudent.ac.in' },
    update: { reg_no: '24BAI0226', full_name: 'Student User' },
    create: {
      reg_no: '24BAI0226',
      full_name: 'Student User',
      email: 'student@vitstudent.ac.in',
      password_hash: studentPasswordHash,
      role_id: roleStudent.role_id,
      oauth_provider: 'LOCAL',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vit.ac.in' },
    update: {},
    create: {
      reg_no: 'ADMIN_USER',
      full_name: 'System Administrator',
      email: 'admin@vit.ac.in',
      password_hash: adminPasswordHash,
      role_id: roleAdmin.role_id,
      oauth_provider: 'LOCAL',
    },
  });

  const educatorUser = await prisma.user.upsert({
    where: { email: 'evaluator@vit.ac.in' },
    update: {},
    create: {
      reg_no: 'FAC_24BAI0226',
      full_name: 'Faculty Evaluator - DBMS Lab',
      email: 'evaluator@vit.ac.in',
      password_hash: educatorPasswordHash,
      role_id: roleEducator.role_id,
      oauth_provider: 'LOCAL',
    },
  });

  // 3. Technical Skills Catalogue
  console.log('[3/7] Seeding Technical Skills Catalogue...');
  const skillsData = [
    { code: 'SKL_SQL_01', name: 'SQL & Relational Algebra', category: 'Database' },
    { code: 'SKL_NORM_02', name: 'Database Normalization (3NF/BCNF)', category: 'Database' },
    { code: 'SKL_ACID_03', name: 'Transactions & ACID Properties', category: 'Database' },
    { code: 'SKL_IDX_04', name: 'Indexing & Query Optimization', category: 'Database' },
    { code: 'SKL_API_05', name: 'Node.js & Express REST APIs', category: 'Backend' },
    { code: 'SKL_PANDAS_06', name: 'Python Data Analysis & Pandas', category: 'Data Analytics' },
    { code: 'SKL_ML_07', name: 'Machine Learning Foundations', category: 'Machine Learning' },
    { code: 'SKL_SEC_08', name: 'System Security & JWT Auth', category: 'Backend' },
  ];

  const skillMap = {};
  for (const s of skillsData) {
    const createdSkill = await prisma.skill.upsert({
      where: { skill_code: s.code },
      update: { skill_name: s.name, category: s.category },
      create: { skill_code: s.code, skill_name: s.name, category: s.category },
    });
    skillMap[s.code] = createdSkill;
  }

  // 4. Skill Prerequisites (Self-referencing DAG)
  console.log('[4/7] Seeding Skill Prerequisites Graph...');
  const prereqPairs = [
    { skill: 'SKL_NORM_02', prereq: 'SKL_SQL_01' },
    { skill: 'SKL_IDX_04', prereq: 'SKL_SQL_01' },
    { skill: 'SKL_ACID_03', prereq: 'SKL_NORM_02' },
    { skill: 'SKL_ML_07', prereq: 'SKL_PANDAS_06' },
    { skill: 'SKL_SEC_08', prereq: 'SKL_API_05' },
  ];

  for (const p of prereqPairs) {
    const sId = skillMap[p.skill].skill_id;
    const pId = skillMap[p.prereq].skill_id;
    await prisma.skillPrerequisite.upsert({
      where: {
        skill_id_prerequisite_skill_id: {
          skill_id: sId,
          prerequisite_skill_id: pId,
        },
      },
      update: {},
      create: {
        skill_id: sId,
        prerequisite_skill_id: pId,
      },
    });
  }

  // 5. Job Roles & Versioned Requirements
  console.log('[5/7] Seeding Career Job Roles and Versions (v1.0 vs v2.0)...');
  const backendRole = await prisma.jobRole.upsert({
    where: { title: 'Backend & Database Engineer' },
    update: {},
    create: {
      title: 'Backend & Database Engineer',
      description: 'Designs scalable relational schemas, writes high-performance SQL, ensures ACID transaction integrity, and builds robust REST APIs.',
      domain: 'Software & Data Engineering',
    },
  });

  const dataAnalystRole = await prisma.jobRole.upsert({
    where: { title: 'Data Analyst' },
    update: {},
    create: {
      title: 'Data Analyst',
      description: 'Transforms raw organizational data into actionable business intelligence through complex SQL aggregations, Pandas workflows, and visualization.',
      domain: 'Business Intelligence & Analytics',
    },
  });

  // Version 1.0 (August 2026)
  const v1 = await prisma.jobRoleVersion.upsert({
    where: {
      job_role_id_version_number: {
        job_role_id: backendRole.job_role_id,
        version_number: 'v1.0',
      },
    },
    update: {},
    create: {
      job_role_id: backendRole.job_role_id,
      version_number: 'v1.0',
      version_label: 'v1.0 Aug 2026 (Foundational)',
      effective_date: new Date('2026-08-01'),
      is_active: false,
    },
  });

  // Version 2.0 (October 2026 - Modern Industry Standard)
  const v2 = await prisma.jobRoleVersion.upsert({
    where: {
      job_role_id_version_number: {
        job_role_id: backendRole.job_role_id,
        version_number: 'v2.0',
      },
    },
    update: {},
    create: {
      job_role_id: backendRole.job_role_id,
      version_number: 'v2.0',
      version_label: 'v2.0 Oct 2026 (Advanced Cloud & Security)',
      effective_date: new Date('2026-10-01'),
      is_active: true,
    },
  });

  // Data Analyst Version 1.0
  const vDA = await prisma.jobRoleVersion.upsert({
    where: {
      job_role_id_version_number: {
        job_role_id: dataAnalystRole.job_role_id,
        version_number: 'v1.0',
      },
    },
    update: {},
    create: {
      job_role_id: dataAnalystRole.job_role_id,
      version_number: 'v1.0',
      version_label: 'v1.0 Aug 2026 (Core Analytics)',
      effective_date: new Date('2026-08-15'),
      is_active: true,
    },
  });

  // Requirements for Backend v1.0
  const reqsV1 = [
    { skill: 'SKL_SQL_01', reqProf: 3, weight: 5 },
    { skill: 'SKL_NORM_02', reqProf: 3, weight: 4 },
    { skill: 'SKL_API_05', reqProf: 3, weight: 4 },
    { skill: 'SKL_IDX_04', reqProf: 2, weight: 3 },
  ];
  for (const r of reqsV1) {
    await prisma.jobRequirement.upsert({
      where: {
        version_id_skill_id: {
          version_id: v1.version_id,
          skill_id: skillMap[r.skill].skill_id,
        },
      },
      update: {},
      create: {
        version_id: v1.version_id,
        skill_id: skillMap[r.skill].skill_id,
        required_proficiency: r.reqProf,
        importance_weight: r.weight,
      },
    });
  }

  // Requirements for Backend v2.0 (Higher expectations in indexing, ACID, security)
  const reqsV2 = [
    { skill: 'SKL_SQL_01', reqProf: 4, weight: 5 },
    { skill: 'SKL_NORM_02', reqProf: 4, weight: 5 },
    { skill: 'SKL_ACID_03', reqProf: 3, weight: 4 },
    { skill: 'SKL_IDX_04', reqProf: 4, weight: 5 },
    { skill: 'SKL_API_05', reqProf: 4, weight: 4 },
    { skill: 'SKL_SEC_08', reqProf: 3, weight: 4 },
  ];
  for (const r of reqsV2) {
    await prisma.jobRequirement.upsert({
      where: {
        version_id_skill_id: {
          version_id: v2.version_id,
          skill_id: skillMap[r.skill].skill_id,
        },
      },
      update: {},
      create: {
        version_id: v2.version_id,
        skill_id: skillMap[r.skill].skill_id,
        required_proficiency: r.reqProf,
        importance_weight: r.weight,
      },
    });
  }

  // Requirements for Data Analyst
  const reqsDA = [
    { skill: 'SKL_SQL_01', reqProf: 4, weight: 5 },
    { skill: 'SKL_PANDAS_06', reqProf: 4, weight: 5 },
    { skill: 'SKL_NORM_02', reqProf: 2, weight: 3 },
    { skill: 'SKL_ML_07', reqProf: 2, weight: 3 },
  ];
  for (const r of reqsDA) {
    await prisma.jobRequirement.upsert({
      where: {
        version_id_skill_id: {
          version_id: vDA.version_id,
          skill_id: skillMap[r.skill].skill_id,
        },
      },
      update: {},
      create: {
        version_id: vDA.version_id,
        skill_id: skillMap[r.skill].skill_id,
        required_proficiency: r.reqProf,
        importance_weight: r.weight,
      },
    });
  }

  // 6. Curated Learning Resources
  console.log('[6/7] Seeding Learning Resources & Curricula...');
  const resourcesData = [
    {
      skill: 'SKL_SQL_01',
      title: 'PostgreSQL Mastery: Subqueries, Window Functions, and Joins',
      url: 'https://www.postgresql.org/docs/16/tutorial-sql.html',
      difficulty: 'Intermediate',
      minutes: 45,
    },
    {
      skill: 'SKL_NORM_02',
      title: 'Database Normalization Fundamentals: 1NF through BCNF with Functional Dependencies',
      url: 'https://en.wikipedia.org/wiki/Database_normalization',
      difficulty: 'Intermediate',
      minutes: 40,
    },
    {
      skill: 'SKL_ACID_03',
      title: 'Transaction Concurrency, Isolation Levels, and Two-Phase Commit in PostgreSQL',
      url: 'https://www.postgresql.org/docs/16/transaction-iso.html',
      difficulty: 'Advanced',
      minutes: 60,
    },
    {
      skill: 'SKL_IDX_04',
      title: 'B-Tree & Hash Index Optimization with EXPLAIN ANALYZE',
      url: 'https://www.postgresql.org/docs/16/using-explain.html',
      difficulty: 'Advanced',
      minutes: 50,
    },
    {
      skill: 'SKL_API_05',
      title: 'Building Production REST APIs with Express.js & Prisma ORM',
      url: 'https://www.prisma.io/docs/getting-started/quickstart',
      difficulty: 'Beginner',
      minutes: 35,
    },
    {
      skill: 'SKL_PANDAS_06',
      title: 'Exploratory Data Analysis with Python, Pandas, and NumPy',
      url: 'https://pandas.pydata.org/docs/user_guide/index.html',
      difficulty: 'Intermediate',
      minutes: 45,
    },
    {
      skill: 'SKL_ML_07',
      title: 'Applied Machine Learning: Feature Engineering and Model Evaluation',
      url: 'https://scikit-learn.org/stable/tutorial/index.html',
      difficulty: 'Intermediate',
      minutes: 55,
    },
    {
      skill: 'SKL_SEC_08',
      title: 'Web Application Security, BCrypt Hashing, and Stateless JWT Tokens',
      url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
      difficulty: 'Advanced',
      minutes: 50,
    },
  ];

  for (const res of resourcesData) {
    const existing = await prisma.learningResource.findFirst({
      where: { skill_id: skillMap[res.skill].skill_id, title: res.title },
    });
    if (!existing) {
      await prisma.learningResource.create({
        data: {
          skill_id: skillMap[res.skill].skill_id,
          title: res.title,
          resource_url: res.url,
          difficulty_level: res.difficulty,
          est_minutes: res.minutes,
        },
      });
    }
  }

  // 7. Initial Seed Assessment Questions
  console.log('[7/7] Seeding Baseline Assessment Questions...');
  const sampleQuestions = [
    {
      skill: 'SKL_SQL_01',
      text: 'Which SQL clause is executed FIRST in the logical query processing phase?',
      a: 'WHERE',
      b: 'FROM',
      c: 'SELECT',
      d: 'GROUP BY',
      correct: 'B',
      explanation: 'In SQL logical query execution order, the FROM clause is processed first to establish the source data sets before filtering (WHERE) or grouping (GROUP BY).',
    },
    {
      skill: 'SKL_SQL_01',
      text: 'What is the primary difference between a LEFT OUTER JOIN and an INNER JOIN?',
      a: 'INNER JOIN returns all rows from left table regardless of matches',
      b: 'LEFT JOIN returns matching rows only from both tables',
      c: 'LEFT JOIN includes all rows from the left table and matched rows from the right table (NULL if no match)',
      d: 'Both joins produce identical result sets under all conditions',
      correct: 'C',
      explanation: 'A LEFT JOIN returns all rows from the left table along with matched rows from the right table, substituting NULLs when no corresponding right-side match exists.',
    },
    {
      skill: 'SKL_NORM_02',
      text: 'A relation is in Third Normal Form (3NF) if it is in 2NF and has no:',
      a: 'Partial functional dependencies',
      b: 'Transitive functional dependencies on non-prime attributes',
      c: 'Multi-valued dependencies',
      d: 'Foreign key constraints',
      correct: 'B',
      explanation: '3NF requires that every non-prime attribute is non-transitively dependent on every candidate key of the relation.',
    },
    {
      skill: 'SKL_IDX_04',
      text: 'Which index type is default in PostgreSQL and optimal for range queries (<, <=, =, >=, >)?',
      a: 'Hash Index',
      b: 'GIN Index',
      c: 'B-Tree Index',
      d: 'BRIN Index',
      correct: 'C',
      explanation: 'B-Trees are self-balancing search trees that handle sorting, equality, and range queries with O(log n) lookup efficiency.',
    },
  ];

  for (const q of sampleQuestions) {
    const existingQ = await prisma.assessmentQuestion.findFirst({
      where: { skill_id: skillMap[q.skill].skill_id, question_text: q.text },
    });
    if (!existingQ) {
      await prisma.assessmentQuestion.create({
        data: {
          skill_id: skillMap[q.skill].skill_id,
          question_text: q.text,
          option_a: q.a,
          option_b: q.b,
          option_c: q.c,
          option_d: q.d,
          correct_option: q.correct,
          explanation: q.explanation,
          generated_by: 'SEED_INITIAL',
        },
      });
    }
  }

  // ==========================================================================
  // MANDATORY LAB ADVANCED SQL IMPLEMENTATION (RAW POSTGRESQL STATEMENTS)
  // 1. TRIGGER: trg_before_assessment_24BAI0226_SaiSiriChandana
  // 2. STORED PROCEDURE: sp_generate_gap_report_24BAI0226_SaiSiriChandana
  // 3. VIEW: vw_student_roadmap_24BAI0226_SaiSiriChandana
  // ==========================================================================
  console.log('----------------------------------------------------------------');
  console.log('Compiling PostgreSQL Trigger, Stored Procedure, and View...');
  console.log('Naming: 24BAI0226 & SaiSiriChandana (Mandatory Lab Compliance)');
  console.log('----------------------------------------------------------------');

  // Trigger function & Trigger
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION fn_before_assessment_24BAI0226_SaiSiriChandana()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Score to 0-5 proficiency mapping
      IF NEW.score_percent >= 90.0 THEN
        NEW.assessed_proficiency := 5;
      ELSIF NEW.score_percent >= 75.0 THEN
        NEW.assessed_proficiency := 4;
      ELSIF NEW.score_percent >= 60.0 THEN
        NEW.assessed_proficiency := 3;
      ELSIF NEW.score_percent >= 40.0 THEN
        NEW.assessed_proficiency := 2;
      ELSIF NEW.score_percent >= 20.0 THEN
        NEW.assessed_proficiency := 1;
      ELSE
        NEW.assessed_proficiency := 0;
      END IF;

      -- Automated security audit log insertion
      INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at)
      VALUES (
        NEW.user_id,
        'INSERT_ASSESSMENT_ATTEMPT',
        'assessment_attempts',
        NULL,
        CONCAT('Assessed proficiency calculated as ', NEW.assessed_proficiency, '/5 from score ', NEW.score_percent, '% by trg_before_assessment_24BAI0226_SaiSiriChandana'),
        NOW()
      );

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS trg_before_assessment_24BAI0226_SaiSiriChandana ON assessment_attempts;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_before_assessment_24BAI0226_SaiSiriChandana
    BEFORE INSERT ON assessment_attempts
    FOR EACH ROW
    EXECUTE FUNCTION fn_before_assessment_24BAI0226_SaiSiriChandana();
  `);
  console.log('✓ Trigger "trg_before_assessment_24BAI0226_SaiSiriChandana" installed.');

  // Stored Procedure
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE PROCEDURE sp_generate_gap_report_24BAI0226_SaiSiriChandana(
      p_user_id INT,
      p_version_id INT
    )
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_report_id INT;
      v_total_skills INT := 0;
      v_met_skills INT := 0;
      v_readiness_pct DECIMAL(5, 2) := 0.0;
      v_req RECORD;
      v_assessed_prof INT;
      v_gap INT;
      v_priority DECIMAL(5, 2);
      v_reason TEXT;
      v_user_name VARCHAR(150);
    BEGIN
      SELECT full_name INTO v_user_name FROM users WHERE user_id = p_user_id;

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

        IF v_gap = 0 THEN
          v_reason := CONCAT('Proficiency achieved (', v_assessed_prof, '/', v_req.required_proficiency, '). Skill criteria satisfied.');
        ELSE
          v_reason := CONCAT('Skill gap of ', v_gap, ' level(s) for ', v_req.skill_name, ' (Required: ', v_req.required_proficiency, ', Demonstrated: ', v_assessed_prof, '). Importance weight: ', v_req.importance_weight, '/5.');
        END IF;

        INSERT INTO skill_gap_details (
          report_id, skill_id, required_proficiency, assessed_proficiency, gap_score, priority_score, recommendation_reason
        ) VALUES (
          v_report_id, v_req.skill_id, v_req.required_proficiency, v_assessed_prof, v_gap, v_priority, v_reason
        );
      END LOOP;

      IF v_total_skills > 0 THEN
        v_readiness_pct := ROUND(((v_met_skills::NUMERIC / v_total_skills::NUMERIC) * 100.0), 2);
      ELSE
        v_readiness_pct := 0.0;
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
        CONCAT('SkillGap report #', v_report_id, ' generated for ', v_user_name, ' (Version #', p_version_id, ') with readiness ', v_readiness_pct, '% via sp_generate_gap_report_24BAI0226_SaiSiriChandana'),
        NOW()
      );
    END;
    $$;
  `);
  console.log('✓ Stored Procedure "sp_generate_gap_report_24BAI0226_SaiSiriChandana" installed.');

  // View
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE VIEW vw_student_roadmap_24BAI0226_SaiSiriChandana AS
    SELECT 
      u.user_id,
      u.reg_no,
      u.full_name,
      jr.title AS career_role_title,
      jrv.version_id,
      jrv.version_number,
      jrv.version_label,
      sgr.report_id,
      sgr.overall_readiness_pct,
      sgr.generated_at AS report_generated_at,
      s.skill_id,
      s.skill_code,
      s.skill_name,
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
  `);
  console.log('✓ Analytical View "vw_student_roadmap_24BAI0226_SaiSiriChandana" installed.');

  // Pre-seed an initial demonstration assessment attempt for Student 24BAI0226
  console.log('Creating initial demonstration assessment attempt for Student 24BAI0226...');
  // Inserting via raw query so trigger fires explicitly
  await prisma.$executeRawUnsafe(`
    INSERT INTO assessment_attempts (user_id, skill_id, score_percent, assessed_proficiency, ai_analysis_feedback, attempted_at)
    VALUES (
      ${studentUser.user_id},
      ${skillMap['SKL_SQL_01'].skill_id},
      85.0,
      0,
      'Solid grasp of relational joins and logical query processing. Minor edge case confusion on outer join NULL handling.',
      NOW() - INTERVAL '2 days'
    );
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO assessment_attempts (user_id, skill_id, score_percent, assessed_proficiency, ai_analysis_feedback, attempted_at)
    VALUES (
      ${studentUser.user_id},
      ${skillMap['SKL_NORM_02'].skill_id},
      68.0,
      0,
      'Demonstrated 2NF and 3NF functional dependency awareness. Review Boyce-Codd normal form anomalies.',
      NOW() - INTERVAL '1 day'
    );
  `);

  // Run the stored procedure to generate initial reports for both v1.0 and v2.0
  await prisma.$executeRawUnsafe(`
    CALL sp_generate_gap_report_24BAI0226_SaiSiriChandana(${studentUser.user_id}, ${v1.version_id});
  `);
  await prisma.$executeRawUnsafe(`
    CALL sp_generate_gap_report_24BAI0226_SaiSiriChandana(${studentUser.user_id}, ${v2.version_id});
  `);
  console.log('✓ Stored procedure executed for Student 24BAI0226 across v1.0 and v2.0 requirements.');

  console.log('================================================================');
  console.log('Database Seeding & SQL Compilation Completed Successfully!');
  console.log('Garudaiahgari Sai Siri Chandana (24BAI0226) | Slot: L25+L26');
  console.log('================================================================');
}

main_seed_24BAI0226_SaiSiriChandana()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
