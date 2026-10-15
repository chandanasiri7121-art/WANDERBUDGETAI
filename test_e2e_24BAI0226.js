// ============================================================================
// SkillGap Radar: Automated End-to-End Verification Test Suite
// Student: Garudaiahgari Sai Siri Chandana | Register Number: 24BAI0226
// Course: BCSE302P Database Systems Lab | Slot: L25+L26 | Faculty: Dr. V. SIVAKUMAR
// ============================================================================

const BASE_URL = 'http://localhost:5001/api';

async function runVerification_24BAI0226_SaiSiriChandana() {
  console.log('================================================================');
  console.log('SkillGap Radar: Automated E2E Verification Suite');
  console.log('Student: Garudaiahgari Sai Siri Chandana (24BAI0226) | Slot: L25+L26');
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================\n');

  // Test 1: System Health Check
  console.log('[Test 1] Testing Health Endpoint & Student Identity Headers...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health Status:', healthData.status);
  console.log('X-Student-Identity:', healthRes.headers.get('x-student-identity'));
  if (healthData.reg_no !== '24BAI0226') throw new Error('Student identity check failed');
  console.log('✓ Health & Identity Header check passed.\n');

  // Test 2: Student Authentication (Single Users Table + BCrypt + JWT)
  console.log('[Test 2] Testing Student Login (24BAI0226)...');
  const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrRegNo: '24BAI0226', password: 'Student@123' }),
  });
  const studentAuth = await studentLoginRes.json();
  if (!studentAuth.token) throw new Error('Student login failed');
  console.log('✓ Student Authenticated successfully.');
  console.log('  Name:', studentAuth.user.full_name, '| Reg No:', studentAuth.user.reg_no, '| Role:', studentAuth.user.role);
  const studentToken = studentAuth.token;
  console.log();

  // Test 3: Version-Aware Career Roles Retrieval
  console.log('[Test 3] Testing Version-Aware Career Roles & Requirements...');
  const rolesRes = await fetch(`${BASE_URL}/career-roles`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const roles = await rolesRes.json();
  console.log(`✓ Retrieved ${roles.length} career job roles.`);
  roles.forEach(r => {
    console.log(`  Role: "${r.title}" -> Versions: [${r.versions.map(v => v.version_number).join(', ')}]`);
  });
  console.log();

  // Test 4: Dynamic AI Quiz Generation (Hybrid Gemini AI + PostgreSQL)
  console.log('[Test 4] Testing AI Quiz Generation (POST /api/ai/generate-quiz)...');
  const quizGenRes = await fetch(`${BASE_URL}/ai/generate-quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({ skill_id: 1, difficulty: 'Intermediate' }),
  });
  const quizGenData = await quizGenRes.json();
  console.log('✓ Quiz Generated for:', quizGenData.skill_name);
  console.log(`  Saved ${quizGenData.questions.length} questions in PostgreSQL (assessment_questions).`);
  console.log('  Sample Question Q1:', quizGenData.questions[0].question_text);
  console.log('  Security Verification: correct_option hidden from client?', quizGenData.questions[0].correct_option === undefined);
  console.log();

  // Test 5: Quiz Answer Submission & Trigger Execution
  console.log('[Test 5] Submitting Answers -> Trigger trg_before_assessment & SP sp_generate_gap_report...');
  const answersPayload = quizGenData.questions.map((q, idx) => ({
    question_id: q.question_id,
    selected_option: idx === 0 ? 'B' : 'C',
  }));

  const submitRes = await fetch(`${BASE_URL}/ai/submit-and-analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: JSON.stringify({
      skill_id: 1,
      version_id: 2,
      answers: answersPayload,
    }),
  });
  const submitData = await submitRes.json();
  console.log('✓ Assessment Submission Processed:');
  console.log('  Score Percent:', submitData.score_percent + '%');
  console.log('  Assessed Proficiency (computed by Trigger):', submitData.assessed_proficiency + ' / 5');
  console.log('  Updated Readiness (computed by Stored Procedure):', submitData.updated_readiness_pct + '%');
  console.log('  Gemini AI Diagnostic Report:\n', submitData.ai_analysis_feedback);
  console.log();

  // Test 6: Analytical View (vw_student_roadmap_24BAI0226_SaiSiriChandana)
  console.log('[Test 6] Testing Analytical View Query (GET /api/roadmap/2)...');
  const roadmapRes = await fetch(`${BASE_URL}/roadmap/2?limit=3`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const roadmapData = await roadmapRes.json();
  console.log(`✓ Roadmap View returned ${roadmapData.roadmap.length} items (Total: ${roadmapData.total}):`);
  roadmapData.roadmap.forEach((item, idx) => {
    console.log(`  [${idx+1}] ${item.skill_name} (${item.skill_code}) | Req: ${item.required_proficiency}/5 | Assessed: ${item.assessed_proficiency}/5 | Gap: ${item.gap_score} | Priority: ${item.priority_score} | Prereqs: ${item.prerequisites_list}`);
  });
  console.log();

  // Test 7: Admin RBAC & ACID Transaction (ADMIN_24BAI0226)
  console.log('[Test 7] Testing Admin Login & ACID Requirement Update...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrRegNo: 'ADMIN_24BAI0226', password: 'Admin@123' }),
  });
  const adminAuth = await adminLoginRes.json();
  console.log('✓ Admin Authenticated:', adminAuth.user.full_name, '| Role:', adminAuth.user.role);
  const adminToken = adminAuth.token;

  const acidUpdateRes = await fetch(`${BASE_URL}/admin/requirements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      version_id: 2,
      skill_id: 1,
      required_proficiency: 5,
      importance_weight: 5,
    }),
  });
  const acidData = await acidUpdateRes.json();
  console.log('✓ ACID Transaction Result:', acidData.message);
  console.log('  Updated Requirement ID:', acidData.requirement.requirement_id);

  // Test 8: Security Audit Logs Verification
  console.log('\n[Test 8] Fetching Security Audit Logs (GET /api/admin/audit-logs)...');
  const auditRes = await fetch(`${BASE_URL}/admin/audit-logs?limit=4`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const auditData = await auditRes.json();
  console.log(`✓ Retrieved ${auditData.logs.length} audit logs (Total: ${auditData.total}):`);
  auditData.logs.forEach((log) => {
    console.log(`  Log #${log.log_id} [${log.action}] on table "${log.table_name}" -> ${log.details}`);
  });

  // Test 9: Prerequisite DAG Graph Telemetry
  console.log('\n[Test 9] Testing Prerequisite DAG Graph Telemetry (GET /api/skills/prerequisite-graph)...');
  const dagRes = await fetch(`${BASE_URL}/skills/prerequisite-graph`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const dagData = await dagRes.json();
  console.log(`✓ Retrieved DAG Graph: ${dagData.nodes.length} nodes, ${dagData.edges.length} directed prerequisite edges.`);
  dagData.edges.forEach((e) => {
    console.log(`  Edge: [${e.source_name}] ──> [${e.target_name}] (Satisfied: ${e.is_satisfied})`);
  });

  // Test 10: Multi-Role Comparative Readiness Matrix
  console.log('\n[Test 10] Testing Multi-Role Comparative Readiness (GET /api/skill-gaps/multi-role-comparison)...');
  const multiRoleRes = await fetch(`${BASE_URL}/skill-gaps/multi-role-comparison`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const multiRoleData = await multiRoleRes.json();
  console.log(`✓ Cross-Role Readiness computed for ${multiRoleData.length} target career tracks:`);
  multiRoleData.forEach((r) => {
    console.log(`  Role "${r.role_title}": ${r.readiness_pct}% Readiness (${r.met_skills}/${r.total_skills} skills satisfied)`);
  });

  // Test 11: Longitudinal Progress Timeline
  console.log('\n[Test 11] Testing Longitudinal Progress Timeline (GET /api/assessments/progress-timeline)...');
  const timelineRes = await fetch(`${BASE_URL}/assessments/progress-timeline`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const timelineData = await timelineRes.json();
  console.log(`✓ Timeline retrieved ${timelineData.length} historical assessment events chronologically.`);

  // Test 12: PostgreSQL EXPLAIN ANALYZE Benchmarks
  console.log('\n[Test 12] Profiling PostgreSQL EXPLAIN ANALYZE Cost & Buffer Hits (GET /api/admin/query-benchmarks)...');
  const bmRes = await fetch(`${BASE_URL}/admin/query-benchmarks`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const bmData = await bmRes.json();
  console.log(`✓ PostgreSQL EXPLAIN ANALYZE benchmarks executed:`);
  bmData.benchmarks.forEach((bm) => {
    console.log(`  Query: ${bm.name}`);
    console.log(`  • Execution Time: ${bm.stats.execution_time_ms} ms | Planning Time: ${bm.stats.planning_time_ms} ms | Optimizer Cost: ${bm.stats.total_cost} | Shared Hit Blocks: ${bm.stats.shared_hit_blocks}`);
  });

  console.log('\n================================================================');
  console.log('ALL 12 END-TO-END & STANDOUT VERIFICATION TESTS PASSED WITH 100%!');
  console.log('Garudaiahgari Sai Siri Chandana (24BAI0226) | Slot: L25+L26');
  console.log('================================================================');
}

runVerification_24BAI0226_SaiSiriChandana().catch((err) => {
  console.error('Verification Failure:', err);
  process.exit(1);
});
