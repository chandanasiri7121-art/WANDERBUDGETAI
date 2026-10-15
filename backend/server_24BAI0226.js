// ============================================================================
// SkillGap Radar: Express Backend Application
// Student: Garudaiahgari Sai Siri Chandana | Register Number: 24BAI0226
// Course: BCSE302P Database Systems Lab | Slot: L25+L26 | Faculty: Dr. V. SIVAKUMAR
// ============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const prisma_24BAI0226_SaiSiriChandana = new PrismaClient();
const app = express();

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'SaiSiriChandana_24BAI0226_SuperSecureJWTSecret_2026';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(cors());
app.use(express.json());

// Log middleware embedding Identity & Timestamp
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [24BAI0226_SaiSiriChandana] ${req.method} ${req.url}`);
  res.setHeader('X-Student-Identity', 'Garudaiahgari Sai Siri Chandana (24BAI0226) | Slot: L25+L26');
  res.setHeader('X-Server-Timestamp', timestamp);
  next();
});

// ============================================================================
// AUTHENTICATION & RBAC MIDDLEWARES
// ============================================================================
const authenticate_24BAI0226_SaiSiriChandana = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or malformed Bearer token.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma_24BAI0226_SaiSiriChandana.user.findUnique({
      where: { user_id: decoded.user_id },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found in database.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token.', details: err.message });
  }
};

const requireRole_24BAI0226_SaiSiriChandana = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role.role_name)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: ${req.user?.role?.role_name || 'NONE'}.`,
      });
    }
    next();
  };
};

// ============================================================================
// AI QUIZ & DIAGNOSTIC SERVICES (GEMINI AI + DETERMINISTIC FALLBACK)
// ============================================================================
class RadarEngine_24BAI0226_SaiSiriChandana {
  static async generateQuizQuestions(skillName, category, difficulty = 'Intermediate') {
    if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
      try {
        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = `Generate exactly 3 challenging multiple-choice questions for technical assessment on the skill "${skillName}" (Category: ${category}, Difficulty: ${difficulty}).
Format the response strictly as a JSON array of objects without any markdown formatting or ticks.
Each object must have these exact keys:
"question_text": "string",
"option_a": "string",
"option_b": "string",
"option_c": "string",
"option_d": "string",
"correct_option": "A" or "B" or "C" or "D",
"explanation": "concise technical rationale"`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return parsed.slice(0, 3).map((q) => ({ ...q, generated_by: 'GEMINI_2.5_FLASH' }));
        }
      } catch (geminiError) {
        console.warn('[Gemini AI] Quota or API issue, activating deterministic fallback generator:', geminiError.message);
      }
    }

    // High-fidelity domain-calibrated deterministic question generator
    return [
      {
        question_text: `In enterprise ${skillName}, how is data integrity guaranteed during concurrent transaction anomalies?`,
        option_a: 'By relying strictly on client-side state caching',
        option_b: 'Through multi-version concurrency control (MVCC) and strict two-phase locking protocols',
        option_c: 'By disabling write-ahead logging (WAL)',
        option_d: 'Through unconditional table drop and recreation cycles',
        correct_option: 'B',
        explanation: 'Relational database engines preserve serializability and ACID guarantees using MVCC and 2PL locking protocols.',
        generated_by: 'ENGINE_DETERMINISTIC_FALLBACK',
      },
      {
        question_text: `When evaluating ${skillName} query plans, what does a "Seq Scan" combined with high cost indicate?`,
        option_a: 'Optimal index lookup utilizing existing B-Trees',
        option_b: 'The query executed in nanosecond constant time O(1)',
        option_c: 'The optimizer scanned every disk page because no suitable index was eligible for the predicate',
        option_d: 'The table has zero rows and requires no CPU cycles',
        correct_option: 'C',
        explanation: 'A sequential scan reads all table pages sequentially from disk, signaling a prime candidate for indexing or predicate refactoring.',
        generated_by: 'ENGINE_DETERMINISTIC_FALLBACK',
      },
      {
        question_text: `Under 3NF and BCNF guidelines for ${skillName}, how are transitive dependencies resolved?`,
        option_a: 'By combining all attributes into a single denormalized table',
        option_b: 'By decomposing the relation into smaller tables where every determinant is a candidate key',
        option_c: 'By omitting foreign key constraints to reduce overhead',
        option_d: 'By converting integer columns to text representations',
        correct_option: 'B',
        explanation: 'Lossless decomposition isolates non-key determinants into dedicated relational schemas, eliminating insertion and update anomalies.',
        generated_by: 'ENGINE_DETERMINISTIC_FALLBACK',
      },
    ];
  }

  static async generateDiagnosticAnalysis(skillName, scorePercent, correctCount, totalCount) {
    if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
      try {
        const { GoogleGenAI } = require('@google/genai');
        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        const prompt = `A student completed a skill assessment for "${skillName}".
Score: ${scorePercent}% (${correctCount}/${totalCount} questions correct).
Provide a concise 3-bullet diagnostic analysis in clean plain text:
1. Demonstrated Strengths
2. Identified Core Knowledge Gaps
3. Concrete Remediation Action Plan (Database and engineering focused)`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        if (response.text) return response.text.trim();
      } catch (err) {
        console.warn('[Gemini AI] Fallback for diagnostic analysis:', err.message);
      }
    }

    if (scorePercent >= 80) {
      return `• Demonstrated Strengths: High proficiency in ${skillName} core paradigms, syntax, and relational execution logic.\n• Identified Gaps: Minor nuances around advanced concurrency locks and boundary edge cases.\n• Action Plan: Proceed to complex architecture optimization benchmarks and enterprise partitioning challenges.`;
    } else if (scorePercent >= 50) {
      return `• Demonstrated Strengths: Good baseline comprehension of fundamental principles in ${skillName}.\n• Identified Gaps: Struggles with query cost optimization, join strategies, and normalization decomposition proofs.\n• Action Plan: Complete curated exercises in PostgreSQL EXPLAIN ANALYZE and review 3NF decomposition algorithms.`;
    } else {
      return `• Demonstrated Strengths: Initial exposure to foundational definitions.\n• Identified Gaps: Substantial gap in operational execution, relational constraints, and core design theory.\n• Action Plan: Revisit prerequisite learning modules before re-attempting the assessment. Follow the recommended learning roadmap closely.`;
    }
  }
}

// ============================================================================
// SYSTEM & HEALTH ENDPOINTS
// ============================================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'SkillGap Radar: Evidence-Based Career Readiness Platform',
    developer: 'Garudaiahgari Sai Siri Chandana',
    reg_no: '24BAI0226',
    slot: 'L25+L26',
    faculty: 'Dr. V. SIVAKUMAR',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// AUTHENTICATION ROUTES (BCRYPT + JWT + SINGLE USERS TABLE)
// ============================================================================
const registerSchema = z.object({
  reg_no: z.string().min(3),
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role_name: z.enum(['STUDENT', 'ADMIN', 'EDUCATOR']).default('STUDENT'),
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.format() });
    }

    const { reg_no, full_name, email, password, role_name } = parseResult.data;

    // Check existing
    const existing = await prisma_24BAI0226_SaiSiriChandana.user.findFirst({
      where: { OR: [{ email }, { reg_no }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'User with this email or Register Number already exists.' });
    }

    const role = await prisma_24BAI0226_SaiSiriChandana.role.findUnique({
      where: { role_name },
    });
    if (!role) {
      return res.status(400).json({ error: 'Specified role not recognized in roles master.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await prisma_24BAI0226_SaiSiriChandana.user.create({
      data: {
        reg_no,
        full_name,
        email,
        password_hash,
        role_id: role.role_id,
        oauth_provider: 'LOCAL',
      },
      include: { role: true },
    });

    // Create initial audit log
    await prisma_24BAI0226_SaiSiriChandana.auditLog.create({
      data: {
        user_id: newUser.user_id,
        action: 'USER_REGISTRATION',
        table_name: 'users',
        record_id: newUser.user_id,
        details: `Registered new user ${newUser.full_name} (${newUser.reg_no}) with role ${role.role_name}.`,
      },
    });

    const token = jwt.sign(
      {
        user_id: newUser.user_id,
        reg_no: newUser.reg_no,
        role: newUser.role.role_name,
        full_name: newUser.full_name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'User registered successfully into single Users table.',
      token,
      user: {
        user_id: newUser.user_id,
        reg_no: newUser.reg_no,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role.role_name,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrRegNo, password } = req.body;
    if (!emailOrRegNo || !password) {
      return res.status(400).json({ error: 'Please provide Email/Register Number and password.' });
    }

    const user = await prisma_24BAI0226_SaiSiriChandana.user.findFirst({
      where: {
        OR: [{ email: emailOrRegNo }, { reg_no: emailOrRegNo }],
      },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Password mismatch.' });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        reg_no: user.reg_no,
        role: user.role.role_name,
        full_name: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    await prisma_24BAI0226_SaiSiriChandana.auditLog.create({
      data: {
        user_id: user.user_id,
        action: 'USER_LOGIN',
        table_name: 'users',
        record_id: user.user_id,
        details: `Successful login by ${user.full_name} (${user.reg_no}) [${user.role.role_name}].`,
      },
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        reg_no: user.reg_no,
        full_name: user.full_name,
        email: user.email,
        role: user.role.role_name,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

app.get('/api/auth/me', authenticate_24BAI0226_SaiSiriChandana, (req, res) => {
  res.json({
    user: {
      user_id: req.user.user_id,
      reg_no: req.user.reg_no,
      full_name: req.user.full_name,
      email: req.user.email,
      role: req.user.role.role_name,
    },
  });
});

// ============================================================================
// CAREER ROLES & VERSION-AWARE REQUIREMENTS
// ============================================================================
app.get('/api/career-roles', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const roles = await prisma_24BAI0226_SaiSiriChandana.jobRole.findMany({
      include: {
        versions: {
          orderBy: { version_number: 'desc' },
          include: {
            requirements: {
              include: { skill: true },
            },
          },
        },
      },
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve career roles.', details: error.message });
  }
});

app.get('/api/career-roles/versions/:versionId', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId, 10);
    const version = await prisma_24BAI0226_SaiSiriChandana.jobRoleVersion.findUnique({
      where: { version_id: versionId },
      include: {
        job_role: true,
        requirements: {
          include: {
            skill: {
              include: {
                prerequisites: {
                  include: { prerequisite_skill: true },
                },
                resources: true,
              },
            },
          },
          orderBy: { importance_weight: 'desc' },
        },
      },
    });

    if (!version) {
      return res.status(404).json({ error: 'Role version not found.' });
    }

    res.json(version);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch version details.', details: error.message });
  }
});

// ============================================================================
// SKILLS & PREREQUISITES
// ============================================================================
app.get('/api/skills', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const skills = await prisma_24BAI0226_SaiSiriChandana.skill.findMany({
      include: {
        prerequisites: {
          include: { prerequisite_skill: true },
        },
        resources: true,
      },
      orderBy: { skill_name: 'asc' },
    });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve skills.', details: error.message });
  }
});

// ============================================================================
// AI QUIZ GENERATION & ASSESSMENT SUBMISSION (HYBRID AI + DBMS)
// ============================================================================
app.post('/api/ai/generate-quiz', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const { skill_id, difficulty } = req.body;
    if (!skill_id) {
      return res.status(400).json({ error: 'skill_id is required.' });
    }

    const skill = await prisma_24BAI0226_SaiSiriChandana.skill.findUnique({
      where: { skill_id: parseInt(skill_id, 10) },
    });
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found in database.' });
    }

    // Call Hybrid Generator
    const rawQuestions = await RadarEngine_24BAI0226_SaiSiriChandana.generateQuizQuestions(
      skill.skill_name,
      skill.category,
      difficulty || 'Intermediate'
    );

    // Save into PostgreSQL via Prisma transaction
    const savedQuestions = await prisma_24BAI0226_SaiSiriChandana.$transaction(
      rawQuestions.map((q) =>
        prisma_24BAI0226_SaiSiriChandana.assessmentQuestion.create({
          data: {
            skill_id: skill.skill_id,
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
            explanation: q.explanation,
            generated_by: q.generated_by,
          },
        })
      )
    );

    // Audit log
    await prisma_24BAI0226_SaiSiriChandana.auditLog.create({
      data: {
        user_id: req.user.user_id,
        action: 'AI_QUIZ_GENERATED',
        table_name: 'assessment_questions',
        record_id: savedQuestions[0].question_id,
        details: `Generated ${savedQuestions.length} questions for skill "${skill.skill_name}" via ${savedQuestions[0].generated_by}.`,
      },
    });

    // Return to client WITHOUT leaking correct_option
    const publicQuestions = savedQuestions.map((q) => ({
      question_id: q.question_id,
      skill_id: q.skill_id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      generated_by: q.generated_by,
    }));

    res.json({
      message: 'Quiz generated and recorded in PostgreSQL successfully.',
      skill_name: skill.skill_name,
      questions: publicQuestions,
    });
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate quiz.', details: error.message });
  }
});

app.post('/api/ai/submit-and-analyze', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const { skill_id, version_id, answers } = req.body;
    // answers = [{ question_id: 1, selected_option: 'B' }]
    if (!skill_id || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'skill_id and answers array are required.' });
    }

    const parsedSkillId = parseInt(skill_id, 10);
    const parsedVersionId = parseInt(version_id || 2, 10); // Default to v2.0 if not specified

    const skill = await prisma_24BAI0226_SaiSiriChandana.skill.findUnique({
      where: { skill_id: parsedSkillId },
    });
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });

    // Fetch questions to grade
    const questionIds = answers.map((a) => parseInt(a.question_id, 10));
    const questionsInDb = await prisma_24BAI0226_SaiSiriChandana.assessmentQuestion.findMany({
      where: { question_id: { in: questionIds } },
    });

    const qMap = {};
    questionsInDb.forEach((q) => {
      qMap[q.question_id] = q;
    });

    let correctCount = 0;
    const gradedAnswers = answers.map((a) => {
      const q = qMap[a.question_id];
      const isCorrect = q ? q.correct_option.trim().toUpperCase() === (a.selected_option || '').trim().toUpperCase() : false;
      if (isCorrect) correctCount++;
      return {
        question_id: a.question_id,
        selected_option: (a.selected_option || '').toUpperCase(),
        is_correct: isCorrect,
        correct_option: q ? q.correct_option : null,
        explanation: q ? q.explanation : null,
        question_text: q ? q.question_text : null,
      };
    });

    const scorePercent = parseFloat(((correctCount / answers.length) * 100.0).toFixed(2));

    // Generate AI Diagnostic Analysis
    const aiFeedback = await RadarEngine_24BAI0226_SaiSiriChandana.generateDiagnosticAnalysis(
      skill.skill_name,
      scorePercent,
      correctCount,
      answers.length
    );

    // Save attempt using raw query or Prisma so Trigger trg_before_assessment_24BAI0226_SaiSiriChandana executes!
    // Notice that trg_before_assessment_24BAI0226_SaiSiriChandana computes assessed_proficiency from score_percent and logs to audit_logs.
    const attemptResult = await prisma_24BAI0226_SaiSiriChandana.$queryRawUnsafe(`
      INSERT INTO assessment_attempts (user_id, skill_id, score_percent, assessed_proficiency, ai_analysis_feedback, attempted_at)
      VALUES (
        ${req.user.user_id},
        ${parsedSkillId},
        ${scorePercent},
        0,
        ${"'" + aiFeedback.replace(/'/g, "''") + "'"},
        NOW()
      )
      RETURNING attempt_id, assessed_proficiency, score_percent, attempted_at;
    `);

    const attempt = attemptResult[0];

    // Save individual answers
    for (const ga of gradedAnswers) {
      await prisma_24BAI0226_SaiSiriChandana.assessmentAnswer.create({
        data: {
          attempt_id: attempt.attempt_id,
          question_id: ga.question_id,
          selected_option: ga.selected_option,
          is_correct: ga.is_correct,
        },
      });
    }

    // Call PostgreSQL Stored Procedure sp_generate_gap_report_24BAI0226_SaiSiriChandana
    await prisma_24BAI0226_SaiSiriChandana.$executeRawUnsafe(`
      CALL sp_generate_gap_report_24BAI0226_SaiSiriChandana(${req.user.user_id}, ${parsedVersionId});
    `);

    // Fetch updated report
    const latestReport = await prisma_24BAI0226_SaiSiriChandana.skillGapReport.findFirst({
      where: { user_id: req.user.user_id, version_id: parsedVersionId },
      orderBy: { generated_at: 'desc' },
      include: {
        details: {
          include: { skill: true },
        },
      },
    });

    res.json({
      message: 'Assessment graded and processed via PostgreSQL Trigger and Stored Procedure.',
      attempt_id: attempt.attempt_id,
      score_percent: scorePercent,
      assessed_proficiency: attempt.assessed_proficiency,
      correct_count: correctCount,
      total_count: answers.length,
      ai_analysis_feedback: aiFeedback,
      graded_answers: gradedAnswers,
      updated_readiness_pct: latestReport ? latestReport.overall_readiness_pct : 0,
      report_id: latestReport ? latestReport.report_id : null,
    });
  } catch (error) {
    console.error('Submit Assessment Error:', error);
    res.status(500).json({ error: 'Failed to submit assessment.', details: error.message });
  }
});

// ============================================================================
// SKILL GAP ANALYSIS & ANALYTICAL VIEW (vw_student_roadmap_24BAI0226_SaiSiriChandana)
// ============================================================================
app.get('/api/skill-gaps/report/:versionId', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId, 10);

    // Check if report exists, otherwise run stored procedure
    let report = await prisma_24BAI0226_SaiSiriChandana.skillGapReport.findFirst({
      where: { user_id: req.user.user_id, version_id: versionId },
      orderBy: { generated_at: 'desc' },
      include: {
        version: { include: { job_role: true } },
        details: {
          include: {
            skill: {
              include: {
                prerequisites: { include: { prerequisite_skill: true } },
                resources: true,
              },
            },
          },
          orderBy: { priority_score: 'desc' },
        },
      },
    });

    if (!report) {
      await prisma_24BAI0226_SaiSiriChandana.$executeRawUnsafe(`
        CALL sp_generate_gap_report_24BAI0226_SaiSiriChandana(${req.user.user_id}, ${versionId});
      `);
      report = await prisma_24BAI0226_SaiSiriChandana.skillGapReport.findFirst({
        where: { user_id: req.user.user_id, version_id: versionId },
        orderBy: { generated_at: 'desc' },
        include: {
          version: { include: { job_role: true } },
          details: {
            include: {
              skill: {
                include: {
                  prerequisites: { include: { prerequisite_skill: true } },
                  resources: true,
                },
              },
            },
            orderBy: { priority_score: 'desc' },
          },
        },
      });
    }

    // Format for Radar Chart
    const radarData = report
      ? report.details.map((d) => ({
          skill: d.skill.skill_name.length > 18 ? d.skill.skill_code : d.skill.skill_name,
          full_name: d.skill.skill_name,
          category: d.skill.category,
          assessed: d.assessed_proficiency,
          required: d.required_proficiency,
          gap: d.gap_score,
          priority: parseFloat(d.priority_score),
          reason: d.recommendation_reason,
        }))
      : [];

    res.json({
      report_id: report?.report_id,
      overall_readiness_pct: report?.overall_readiness_pct,
      generated_at: report?.generated_at,
      version: report?.version,
      radar_data: radarData,
      details: report?.details || [],
    });
  } catch (error) {
    console.error('Gap Report Error:', error);
    res.status(500).json({ error: 'Failed to retrieve skill gap report.', details: error.message });
  }
});

// Query Analytical View vw_student_roadmap_24BAI0226_SaiSiriChandana with Search & Pagination
app.get('/api/roadmap/:versionId', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId, 10);
    const { search = '', category = '', page = 1, limit = 5 } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Direct query against the PostgreSQL View
    let baseSql = `
      FROM vw_student_roadmap_24BAI0226_SaiSiriChandana
      WHERE user_id = ${req.user.user_id} AND version_id = ${versionId}
    `;

    if (search.trim() !== '') {
      const sanitized = search.replace(/'/g, "''");
      baseSql += ` AND (skill_name ILIKE '%${sanitized}%' OR skill_code ILIKE '%${sanitized}%')`;
    }

    if (category.trim() !== '' && category !== 'ALL') {
      const sanitizedCat = category.replace(/'/g, "''");
      baseSql += ` AND skill_category = '${sanitizedCat}'`;
    }

    const countResult = await prisma_24BAI0226_SaiSiriChandana.$queryRawUnsafe(`
      SELECT COUNT(*) as total ${baseSql}
    `);
    const totalRecords = parseInt(countResult[0]?.total || 0, 10);

    const rows = await prisma_24BAI0226_SaiSiriChandana.$queryRawUnsafe(`
      SELECT * ${baseSql}
      ORDER BY priority_score DESC, skill_name ASC
      LIMIT ${parseInt(limit, 10)} OFFSET ${offset}
    `);

    res.json({
      total: totalRecords,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total_pages: Math.ceil(totalRecords / parseInt(limit, 10)) || 1,
      roadmap: rows,
    });
  } catch (error) {
    console.error('Roadmap View Query Error:', error);
    res.status(500).json({ error: 'Failed to query roadmap view.', details: error.message });
  }
});

// Assessment History for current user
app.get('/api/assessments/history', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const history = await prisma_24BAI0226_SaiSiriChandana.assessmentAttempt.findMany({
      where: { user_id: req.user.user_id },
      include: { skill: true },
      orderBy: { attempted_at: 'desc' },
      take: 20,
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve assessment history.', details: error.message });
  }
});

// ============================================================================
// ADMIN ONLY OPERATIONS (ACID TRANSACTIONS & AUDIT LOGS)
// ============================================================================
app.get('/api/admin/audit-logs', authenticate_24BAI0226_SaiSiriChandana, requireRole_24BAI0226_SaiSiriChandana(['ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const whereClause = search
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { details: { contains: search, mode: 'insensitive' } },
            { table_name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, logs] = await Promise.all([
      prisma_24BAI0226_SaiSiriChandana.auditLog.count({ where: whereClause }),
      prisma_24BAI0226_SaiSiriChandana.auditLog.findMany({
        where: whereClause,
        include: { user: { select: { full_name: true, reg_no: true, email: true } } },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: parseInt(limit, 10),
      }),
    ]);

    res.json({
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total_pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      logs,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve audit logs.', details: error.message });
  }
});

// ACID Transaction to update or insert job requirements
app.post('/api/admin/requirements', authenticate_24BAI0226_SaiSiriChandana, requireRole_24BAI0226_SaiSiriChandana(['ADMIN']), async (req, res) => {
  try {
    const { version_id, skill_id, required_proficiency, importance_weight } = req.body;
    if (!version_id || !skill_id || !required_proficiency || !importance_weight) {
      return res.status(400).json({ error: 'version_id, skill_id, required_proficiency, importance_weight are required.' });
    }

    // ACID Transaction via Prisma $transaction
    const result = await prisma_24BAI0226_SaiSiriChandana.$transaction(async (tx) => {
      const requirement = await tx.jobRequirement.upsert({
        where: {
          version_id_skill_id: {
            version_id: parseInt(version_id, 10),
            skill_id: parseInt(skill_id, 10),
          },
        },
        update: {
          required_proficiency: parseInt(required_proficiency, 10),
          importance_weight: parseInt(importance_weight, 10),
        },
        create: {
          version_id: parseInt(version_id, 10),
          skill_id: parseInt(skill_id, 10),
          required_proficiency: parseInt(required_proficiency, 10),
          importance_weight: parseInt(importance_weight, 10),
        },
        include: { skill: true, version: true },
      });

      // Write Audit Log within the same atomic transaction
      await tx.auditLog.create({
        data: {
          user_id: req.user.user_id,
          action: 'ADMIN_UPSERT_REQUIREMENT',
          table_name: 'job_requirements',
          record_id: requirement.requirement_id,
          details: `Admin ${req.user.full_name} updated requirement for Skill "${requirement.skill.skill_name}" (Req Prof: ${required_proficiency}, Imp Weight: ${importance_weight}) in Version #${version_id}.`,
        },
      });

      return requirement;
    });

    res.json({ message: 'Requirement updated atomically via ACID transaction.', requirement: result });
  } catch (error) {
    console.error('Admin Requirement Update Error:', error);
    res.status(500).json({ error: 'Failed to update requirement.', details: error.message });
  }
});

// ============================================================================
// STANDOUT FEATURE 1: SKILL PREREQUISITE DAG GRAPH TELEMETRY
// ============================================================================
app.get('/api/skills/prerequisite-graph', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const [skills, prereqs, userAttempts] = await Promise.all([
      prisma_24BAI0226_SaiSiriChandana.skill.findMany({
        include: { resources: true },
        orderBy: { skill_id: 'asc' },
      }),
      prisma_24BAI0226_SaiSiriChandana.skillPrerequisite.findMany({
        include: { skill: true, prerequisite_skill: true },
      }),
      prisma_24BAI0226_SaiSiriChandana.assessmentAttempt.findMany({
        where: { user_id: req.user.user_id },
        orderBy: { attempted_at: 'desc' },
      }),
    ]);

    const profMap = {};
    for (const a of userAttempts) {
      if (profMap[a.skill_id] === undefined) {
        profMap[a.skill_id] = a.assessed_proficiency;
      }
    }

    const nodes = skills.map((s) => {
      const currentProf = profMap[s.skill_id] || 0;
      return {
        id: s.skill_id,
        code: s.skill_code,
        name: s.skill_name,
        category: s.category,
        current_proficiency: currentProf,
        resource_count: s.resources.length,
      };
    });

    const edges = prereqs.map((p) => {
      const prereqProf = profMap[p.prerequisite_skill_id] || 0;
      const isSatisfied = prereqProf >= 3;
      return {
        id: `${p.prerequisite_skill_id}->${p.skill_id}`,
        source: p.prerequisite_skill_id,
        target: p.skill_id,
        source_name: p.prerequisite_skill.skill_name,
        target_name: p.skill.skill_name,
        is_satisfied: isSatisfied,
      };
    });

    res.json({ nodes, edges });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate DAG prerequisite graph.', details: error.message });
  }
});

// ============================================================================
// STANDOUT FEATURE 2: MULTI-ROLE COMPARATIVE READINESS MATRIX
// ============================================================================
app.get('/api/skill-gaps/multi-role-comparison', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const roles = await prisma_24BAI0226_SaiSiriChandana.jobRole.findMany({
      include: {
        versions: {
          where: { is_active: true },
          include: {
            requirements: {
              include: { skill: true },
            },
            reports: {
              where: { user_id: req.user.user_id },
              orderBy: { generated_at: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const attempts = await prisma_24BAI0226_SaiSiriChandana.assessmentAttempt.findMany({
      where: { user_id: req.user.user_id },
      orderBy: { attempted_at: 'desc' },
    });
    const profMap = {};
    attempts.forEach((a) => {
      if (profMap[a.skill_id] === undefined) profMap[a.skill_id] = a.assessed_proficiency;
    });

    const comparison = roles.map((role) => {
      const activeVer = role.versions[0];
      if (!activeVer) {
        return {
          job_role_id: role.job_role_id,
          role_title: role.title,
          domain: role.domain,
          readiness_pct: 0,
          total_skills: 0,
          met_skills: 0,
        };
      }

      let metCount = 0;
      const skillBreakdown = activeVer.requirements.map((reqItem) => {
        const studentProf = profMap[reqItem.skill_id] || 0;
        const gap = Math.max(reqItem.required_proficiency - studentProf, 0);
        if (gap === 0) metCount++;
        return {
          skill_name: reqItem.skill.skill_name,
          required: reqItem.required_proficiency,
          assessed: studentProf,
          gap,
        };
      });

      const readinessPct = activeVer.requirements.length > 0
        ? parseFloat(((metCount / activeVer.requirements.length) * 100).toFixed(2))
        : 0;

      return {
        job_role_id: role.job_role_id,
        role_title: role.title,
        domain: role.domain,
        version_label: activeVer.version_label,
        readiness_pct: readinessPct,
        total_skills: activeVer.requirements.length,
        met_skills: metCount,
        skill_breakdown: skillBreakdown,
      };
    });

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: 'Failed to compile multi-role comparison.', details: error.message });
  }
});

// ============================================================================
// STANDOUT FEATURE 3: LONGITUDINAL PROGRESS TIMELINE (TIME-SERIES)
// ============================================================================
app.get('/api/assessments/progress-timeline', authenticate_24BAI0226_SaiSiriChandana, async (req, res) => {
  try {
    const attempts = await prisma_24BAI0226_SaiSiriChandana.assessmentAttempt.findMany({
      where: { user_id: req.user.user_id },
      include: { skill: true },
      orderBy: { attempted_at: 'asc' },
    });

    const timeline = attempts.map((a, idx) => ({
      attempt_index: idx + 1,
      attempt_id: a.attempt_id,
      skill_name: a.skill.skill_name,
      skill_code: a.skill.skill_code,
      category: a.skill.category,
      score_percent: parseFloat(a.score_percent),
      assessed_proficiency: a.assessed_proficiency,
      timestamp: a.attempted_at,
      date_formatted: new Date(a.attempted_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve progress timeline.', details: error.message });
  }
});

// ============================================================================
// STANDOUT FEATURE 4: POSTGRESQL EXPLAIN ANALYZE BENCHMARK PROFILER
// ============================================================================
app.get('/api/admin/query-benchmarks', authenticate_24BAI0226_SaiSiriChandana, requireRole_24BAI0226_SaiSiriChandana(['ADMIN']), async (req, res) => {
  try {
    const viewExplain = await prisma_24BAI0226_SaiSiriChandana.$queryRawUnsafe(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT * FROM vw_student_roadmap_24BAI0226_SaiSiriChandana
      WHERE user_id = ${req.user.user_id} AND version_id = 2
      ORDER BY priority_score DESC;
    `);

    const indexedExplain = await prisma_24BAI0226_SaiSiriChandana.$queryRawUnsafe(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT * FROM assessment_attempts
      WHERE user_id = ${req.user.user_id} AND skill_id = 1
      ORDER BY attempted_at DESC LIMIT 1;
    `);

    const aggregateExplain = await prisma_24BAI0226_SaiSiriChandana.$queryRawUnsafe(`
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT 
        s.category,
        AVG(a.score_percent) as avg_score,
        COUNT(a.attempt_id) as total_attempts,
        MAX(a.assessed_proficiency) as peak_proficiency
      FROM skills s
      LEFT JOIN assessment_attempts a ON a.skill_id = s.skill_id
      GROUP BY s.category;
    `);

    const parsePlan = (rawOutput) => {
      const planObj = rawOutput[0]['QUERY PLAN'][0];
      return {
        execution_time_ms: planObj['Execution Time'],
        planning_time_ms: planObj['Planning Time'],
        node_type: planObj['Plan']['Node Type'],
        total_cost: planObj['Plan']['Total Cost'],
        shared_hit_blocks: planObj['Plan']['Shared Hit Blocks'] || 0,
        shared_read_blocks: planObj['Plan']['Shared Read Blocks'] || 0,
        plan_summary: planObj['Plan'],
      };
    };

    res.json({
      status: 'BENCHMARK_PROFILED',
      auditor: 'Garudaiahgari Sai Siri Chandana (24BAI0226)',
      benchmarks: [
        {
          name: 'Analytical View Query (vw_student_roadmap_24BAI0226_SaiSiriChandana)',
          query_type: 'Multi-table View with Lateral Subqueries & String Aggregation',
          stats: parsePlan(viewExplain),
        },
        {
          name: 'Indexed B-Tree Lookup (assessment_attempts by user_id & skill_id)',
          query_type: 'B-Tree Index Scan Optimization',
          stats: parsePlan(indexedExplain),
        },
        {
          name: 'Category Aggregate Metrics (AVG, COUNT, MAX Group By)',
          query_type: 'HashAggregate with LEFT JOIN',
          stats: parsePlan(aggregateExplain),
        },
      ],
    });
  } catch (error) {
    console.error('EXPLAIN ANALYZE Error:', error);
    res.status(500).json({ error: 'Failed to run query benchmarks.', details: error.message });
  }
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log('================================================================');
  console.log('SkillGap Radar: Full-Stack Backend Service Online');
  console.log('Garudaiahgari Sai Siri Chandana (24BAI0226) | Slot: L25+L26');
  console.log(`Server listening on port ${PORT} | Time: ${new Date().toISOString()}`);
  console.log('================================================================');
});
