// ============================================================================
// WanderBudget AI — Automated Verification & E2E Test Suite
// Student: Garudaiahgari Sai Siri Chandana | Register Number: 24BAI0226
// Course: BCSE302P Database Systems Lab | Slot: L25+L26
// ============================================================================

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('================================================================');
  console.log(' WanderBudget AI — Automated Verification Suite (24BAI0226) ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✔ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✖ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  let travelerToken = '';
  let adminToken = '';
  let tokyoDestId = null;
  let testTripId = null;
  let accommodationCatId = null;

  // Test 1: System Health & Database Status
  await test('Test 1: System Health & PostgreSQL Database Connectivity', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/system-health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'OPERATIONAL' || !data.database.connected) {
      throw new Error('Database is not operational');
    }
    if (data.student.reg_no !== '24BAI0226') {
      throw new Error('Student registration number mismatch');
    }
  });

  // Test 2: Traveler Login & JWT Generation
  await test('Test 2: Traveler Login & JWT Generation (24BAI0226)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: '24BAI0226', password: 'Traveler@123' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token || data.user.role !== 'TRAVELER') {
      throw new Error('Failed to obtain traveler JWT token');
    }
    travelerToken = data.token;
  });

  // Test 3: Admin Login & RBAC Verification
  await test('Test 3: Admin Login & RBAC Token Generation (ADMIN_24BAI0226)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_id: 'ADMIN_24BAI0226', password: 'Admin@123' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token || data.user.role !== 'ADMIN') {
      throw new Error('Failed to obtain admin token');
    }
    adminToken = data.token;
  });

  // Test 4: Destinations Listing & Master Data
  await test('Test 4: Fetch Destinations & Cost Index Master Data', async () => {
    const res = await fetch(`${BASE_URL}/api/destinations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No destinations returned');
    }
    const tokyo = data.find(d => d.city_name === 'Tokyo');
    if (!tokyo) throw new Error('Tokyo destination missing');
    tokyoDestId = tokyo.destination_id;
  });

  // Test 5: AI Cost-of-Living & Travel Market Internet Analyzer
  await test('Test 5: AI Cost-of-Living Internet Analyzer (Dynamic Destination Search)', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/analyze-destination`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination_query: 'Seoul', refresh: true })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.destination || !data.destination.cost_index) {
      throw new Error('AI analysis did not generate cost index');
    }
    if (data.source !== 'LIVE_WEB_SEARCH_AI') {
      throw new Error('Data source attribution missing');
    }
  });

  // Test 6: Categories Fetching
  await test('Test 6: Fetch Budget Categories Master Table', async () => {
    const res = await fetch(`${BASE_URL}/api/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 5) {
      throw new Error('Budget categories incomplete');
    }
    const acc = data.find(c => c.category_code === 'ACCOMMODATION');
    if (!acc) throw new Error('ACCOMMODATION category missing');
    accommodationCatId = acc.category_id;
  });

  // Test 7: Stored Procedure: sp_calculate_trip_budget & What-If Engine
  let generatedBudget = null;
  await test('Test 7: Dynamic Budget Calculation via PostgreSQL Stored Procedure & What-If Engine', async () => {
    const res = await fetch(`${BASE_URL}/api/trips/build-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_id: tokyoDestId,
        duration_days: 7,
        travel_style: 'STANDARD',
        group_size: 2,
        attraction_ids: []
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.total_budget_inr || data.total_budget_inr <= 0) {
      throw new Error('Dynamic budget calculation returned zero or invalid total');
    }
    if (!data.what_if_insights || !data.what_if_insights.budget_style_cost) {
      throw new Error('What-If comparisons missing from budget calculation');
    }
    generatedBudget = data;
  });

  // Test 7b: Mode 2: Reverse Budget Optimizer (Fit Itinerary to Wallet Budget)
  await test('Test 7b: Reverse Budget Optimizer (Mode 2: Fit Itinerary to Wallet Budget)', async () => {
    const res = await fetch(`${BASE_URL}/api/trips/optimize-budget-to-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_id: tokyoDestId,
        total_budget_inr: 80000,
        group_size: 2,
        desired_days: 5
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.recommended_travel_style || !data.recommended_days) {
      throw new Error('Reverse optimizer did not recommend travel style or feasible days');
    }
    if (!Array.isArray(data.category_breakdown) || data.total_planned_budget_inr > 80000) {
      throw new Error('Planned budget exceeds user wallet cap');
    }
  });

  // Test 8: ACID Transaction: Save Trip with Breakdowns & Audit Log
  await test('Test 8: ACID Transaction: Save Planned Trip, Breakdowns & Audit Log', async () => {
    const res = await fetch(`${BASE_URL}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        title: 'Tokyo 7-Day Sakura Tour',
        destination_id: tokyoDestId,
        duration_days: 7,
        travel_style: 'STANDARD',
        group_size: 2,
        total_budget_inr: generatedBudget.total_budget_inr,
        breakdowns: generatedBudget.category_breakdown,
        attraction_ids: []
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.trip || !data.trip.trip_id) {
      throw new Error('Trip was not created in transaction');
    }
    testTripId = data.trip.trip_id;
  });

  // Test 9: Expense Logging & Automated Database Trigger trg_check_budget_overrun
  await test('Test 9: Log Normal Expense (Trigger Evaluates Category Spend)', async () => {
    const res = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        trip_id: testTripId,
        category_id: accommodationCatId,
        expense_name: 'Hotel Advance Payment',
        amount_inr: 5000,
        currency_code: 'JPY',
        amount_original: 8900,
        payment_method: 'CARD'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.expense || !data.updated_trip) {
      throw new Error('Expense logging failed');
    }
  });

  // Test 10: Trigger Overrun Alert (>100% Budget Exceeded)
  await test('Test 10: Trigger Evaluation: Log Large Expense Exceeding Budget Threshold', async () => {
    // Log massive expense that exceeds accommodation allocation
    const res = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${travelerToken}`
      },
      body: JSON.stringify({
        trip_id: testTripId,
        category_id: accommodationCatId,
        expense_name: 'Luxury Penthouse Upgrade Overrun',
        amount_inr: 999999,
        currency_code: 'INR',
        payment_method: 'CARD'
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.triggered_alerts || data.triggered_alerts.length === 0) {
      throw new Error('Database trigger did not raise budget overrun alert');
    }
    const criticalAlert = data.triggered_alerts.find(a => a.alert_type === 'BUDGET_EXCEEDED' || a.alert_type === 'TRIP_OVERRUN');
    if (!criticalAlert) {
      throw new Error('Critical budget overrun alert type not detected');
    }
  });

  // Test 11: Analytical View: v_trip_budget_summary
  await test('Test 11: Query SQL Analytical View: v_trip_budget_summary', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics/trip-summary/${testTripId}`, {
      headers: { 'Authorization': `Bearer ${travelerToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.summary || data.summary.budget_health_status !== 'OVER_BUDGET') {
      throw new Error('v_trip_budget_summary did not reflect OVER_BUDGET status');
    }
    if (!Array.isArray(data.category_variance)) {
      throw new Error('v_trip_category_variance view returned empty');
    }
  });

  // Test 12: Analytical View: v_destination_cost_overview
  await test('Test 12: Query SQL Analytical View: v_destination_cost_overview', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics/destinations-overview`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Destination cost overview view returned empty');
    }
  });

  // Test 13: RBAC Security: Traveler Cannot Access Admin Audit Logs
  await test('Test 13: RBAC Security Enforcement (Traveler Blocked from Admin Logs)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { 'Authorization': `Bearer ${travelerToken}` }
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for traveler, received ${res.status}`);
    }
  });

  // Test 14: RBAC Security: Admin Successfully Accesses Audit Logs
  await test('Test 14: RBAC Access Authorized (Admin Accesses Audit Logs)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs?limit=5`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.logs) || data.logs.length === 0) {
      throw new Error('Admin audit logs query returned empty');
    }
  });

  // Test 15: Student Identity & Academic Integrity Headers
  await test('Test 15: Verification of Academic Identity Headers (24BAI0226)', async () => {
    const res = await fetch(`${BASE_URL}/api/destinations`);
    const regNo = res.headers.get('x-student-regno');
    const studentName = res.headers.get('x-student-name');
    if (regNo !== '24BAI0226' || !studentName.includes('Sai Siri Chandana')) {
      throw new Error('Academic compliance headers missing or invalid');
    }
  });

  // Test 16: Traveler AI Copilot Chatbot (Cost Estimation & Comparisons)
  await test('Test 16: Traveler AI Copilot Chatbot (PostgreSQL Grounding & Cost Estimation)', async () => {
    const res = await fetch(`${BASE_URL}/api/ai/traveler-chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the 4 day budget for Tirupati?' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.reply || typeof data.reply !== 'string' || !data.reply.includes('Tirupati')) {
      throw new Error('Chatbot did not generate grounded reply for Tirupati');
    }
    if (!data.detected_destination || data.detected_destination.city_name !== 'Tirupati') {
      throw new Error('Chatbot did not detect Tirupati destination context');
    }
  });

  // Test 17: Sign in with Google OAuth (Section 5 Rubric Compliance)
  await test('Test 17: Sign in with Google OAuth (Single Users Table & Audit Trail)', async () => {
    const testGoogleEmail = `tester_${Date.now()}@gmail.com`;
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testGoogleEmail,
        name: 'Automated Google Traveler',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        google_id: 'GGL_TEST_' + Date.now()
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token || !data.user || data.user.oauth_provider !== 'GOOGLE') {
      throw new Error('Google OAuth token or user verification failed');
    }
    if (!data.user.email || data.user.email !== testGoogleEmail) {
      throw new Error('Google OAuth registered user email mismatch');
    }
  });

  console.log('\n================================================================');
  console.log(` Test Results: ${passed} Passed | ${failed} Failed `);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner encountered fatal error:', err);
  process.exit(1);
});
