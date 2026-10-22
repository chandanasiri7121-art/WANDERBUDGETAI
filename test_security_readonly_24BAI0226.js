// ============================================================================
// WanderBudget AI — Read-Only & Non-Destructive Security Integration Test Harness
// Reg No: 24BAI0226
//
// STATIC PROOF OF SAFETY:
// 1. Zero Database Writes: Every test included here is either:
//    - A pure GET query to static/master tables or SQL views.
//    - A negative security test rejected in middleware/validators before any DB write.
// 2. Offline JWT Tokens: Tokens are generated cryptographically in memory using
//    process.env.JWT_SECRET. No calls to /api/auth/login, avoiding audit_logs inserts.
// 3. Zero External API Calls: Excludes Gemini, Google tokeninfo, SMTP, and FX fetchers.
// 4. Zero Record Mutations: Excludes trip creation, expense creation, and deletion.
// 5. Per-Request Timeout: Every HTTP call enforces a 5-second AbortSignal timeout.
// ============================================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET;
const REQUEST_TIMEOUT_MS = 5000;

async function runReadOnlyTests() {
  console.log('================================================================');
  console.log(' WanderBudget AI — Read-Only Security Verification Suite ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Safe wrapper enforcing per-request timeout
  async function fetchWithTimeout(url, options = {}) {
    const signal = options.signal || AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    return fetch(url, { ...options, signal });
  }

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✔ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✖ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  function skip(name, reason) {
    console.log(`⚪ SKIP: ${name} (${reason})`);
    skipped++;
  }

  // 1. Offline Token Signing (Zero DB Write Guarantee)
  let travelerToken = null;
  let adminToken = null;

  if (JWT_SECRET && typeof JWT_SECRET === 'string' && JWT_SECRET.trim().length > 0) {
    travelerToken = jwt.sign(
      { user_id: 888888, reg_no: '24BAI0226_TEST', role: 'TRAVELER' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    adminToken = jwt.sign(
      { user_id: 999999, reg_no: 'ADMIN_TEST', role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  } else {
    console.warn('⚠️ Notice: JWT_SECRET unavailable. Authenticated tests will be safely skipped.\n');
  }

  // ============================================================================
  // GROUP 1: Public Read-Only Endpoints (Zero Writes, Static Queries)
  // ============================================================================

  await test('Test 1: Public Telemetry Endpoint (GET /api/system/api-status)', async () => {
    // Static Evidence: server line 2983 returns in-memory JSON. Zero DB queries.
    const res = await fetchWithTimeout(`${BASE_URL}/api/system/api-status`);
    if (!res.ok) throw new Error(`Expected HTTP 200, received ${res.status}`);
    const data = await res.json();
    if (!data.model) throw new Error('API status payload missing model field');
  });

  await test('Test 2: Master Destinations Catalog (GET /api/destinations)', async () => {
    // Static Evidence: server line 1966 runs prisma.destination.findMany(). Pure read.
    const res = await fetchWithTimeout(`${BASE_URL}/api/destinations`);
    if (!res.ok) throw new Error(`Expected HTTP 200, received ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected array of destinations');
  });

  await test('Test 3: Master Budget Categories (GET /api/categories)', async () => {
    // Static Evidence: server line 2274 runs prisma.budgetCategory.findMany(). Pure read.
    const res = await fetchWithTimeout(`${BASE_URL}/api/categories`);
    if (!res.ok) throw new Error(`Expected HTTP 200, received ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Categories list empty');
  });

  await test('Test 4: Analytical SQL View (GET /api/analytics/destinations-overview)', async () => {
    // Static Evidence: server line 2908 queries v_destination_cost_overview view. Pure read.
    const res = await fetchWithTimeout(`${BASE_URL}/api/analytics/destinations-overview`);
    if (!res.ok) throw new Error(`Expected HTTP 200, received ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected array from analytical view');
  });

  // ============================================================================
  // GROUP 2: Authentication Middleware Rejections (Zero DB Queries, Early Exit)
  // ============================================================================

  await test('Test 5: Unauthenticated Admin Health Rejection (GET /api/admin/system-health -> 401)', async () => {
    // Static Evidence: server line 2947 has authenticateToken. Missing header exits at line 75 with 401.
    const res = await fetchWithTimeout(`${BASE_URL}/api/admin/system-health`);
    if (res.status !== 401) throw new Error(`Expected HTTP 401, received ${res.status}`);
  });

  await test('Test 6: Unauthenticated Audit Logs Rejection (GET /api/admin/audit-logs -> 401)', async () => {
    // Static Evidence: server line 2924 has authenticateToken. Exits at line 75 with 401.
    const res = await fetchWithTimeout(`${BASE_URL}/api/admin/audit-logs`);
    if (res.status !== 401) throw new Error(`Expected HTTP 401, received ${res.status}`);
  });

  await test('Test 7: Malformed Bearer Token Rejection (GET /api/admin/system-health -> 403)', async () => {
    // Static Evidence: jwt.verify fails at line 79, returning 403. Zero DB queries.
    const res = await fetchWithTimeout(`${BASE_URL}/api/admin/system-health`, {
      headers: { 'Authorization': 'Bearer malformed.token.string' }
    });
    if (res.status !== 403) throw new Error(`Expected HTTP 403, received ${res.status}`);
  });

  // ============================================================================
  // GROUP 3: Administrative RBAC Rejections (Zero DB Queries, Rejected in Middleware)
  // ============================================================================

  if (travelerToken) {
    await test('Test 8: Traveler Blocked from Admin Health (GET /api/admin/system-health -> 403)', async () => {
      // Static Evidence: requireAdmin line 87 checks req.user.role === 'ADMIN'. Returns 403 at line 90.
      const res = await fetchWithTimeout(`${BASE_URL}/api/admin/system-health`, {
        headers: { 'Authorization': `Bearer ${travelerToken}` }
      });
      if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, received ${res.status}`);
    });

    await test('Test 9: Traveler Blocked from Audit Logs (GET /api/admin/audit-logs -> 403)', async () => {
      // Static Evidence: requireAdmin line 90 returns 403. Zero DB queries.
      const res = await fetchWithTimeout(`${BASE_URL}/api/admin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${travelerToken}` }
      });
      if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, received ${res.status}`);
    });

    await test('Test 10: Traveler Blocked from Saving Gemini Key (POST /api/system/save-gemini-key -> 403)', async () => {
      // Static Evidence: requireAdmin line 90 returns 403 before handler or .env write is reached.
      const res = await fetchWithTimeout(`${BASE_URL}/api/system/save-gemini-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${travelerToken}`
        },
        body: JSON.stringify({ apiKey: 'AIzaSyFakeKeyForTesting123' })
      });
      if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, received ${res.status}`);
    });

    await test('Test 11: Traveler Blocked from Rate Sync (POST /api/destinations/1/sync-rates -> 403)', async () => {
      // Static Evidence: requireAdmin line 90 returns 403 before live rate fetch.
      const res = await fetchWithTimeout(`${BASE_URL}/api/destinations/1/sync-rates`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${travelerToken}` }
      });
      if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, received ${res.status}`);
    });

    await test('Test 12: Traveler Blocked from Deleting Attraction (DELETE /api/attractions/1 -> 403)', async () => {
      // Static Evidence: requireAdmin line 90 returns 403 before DB delete.
      const res = await fetchWithTimeout(`${BASE_URL}/api/attractions/1`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${travelerToken}` }
      });
      if (res.status !== 403) throw new Error(`Expected HTTP 403 Forbidden, received ${res.status}`);
    });
  } else {
    skip('Group 3 RBAC Tests (Tests 8-12)', 'JWT_SECRET unavailable');
  }

  // ============================================================================
  // GROUP 4: Strict Identifier & Payload Validation (Zero DB Queries, Rejected in Validator)
  // ============================================================================

  if (travelerToken) {
    await test('Test 13: Strict ID Validation on Trip Detail (GET /api/trips/12abc -> 400)', async () => {
      // Static Evidence: isStrictPositiveInteger line 2654 rejects "12abc", returns 400 at line 2655 before Prisma lookup.
      const res = await fetchWithTimeout(`${BASE_URL}/api/trips/12abc`, {
        headers: { 'Authorization': `Bearer ${travelerToken}` }
      });
      if (res.status !== 400) throw new Error(`Expected HTTP 400 Bad Request, received ${res.status}`);
    });

    await test('Test 14: Strict ID Validation on Trip Alerts (GET /api/trips/12abc/alerts -> 400)', async () => {
      // Static Evidence: isStrictPositiveInteger line 2837 rejects "12abc", returns 400 at line 2838 before Prisma lookup.
      const res = await fetchWithTimeout(`${BASE_URL}/api/trips/12abc/alerts`, {
        headers: { 'Authorization': `Bearer ${travelerToken}` }
      });
      if (res.status !== 400) throw new Error(`Expected HTTP 400 Bad Request, received ${res.status}`);
    });

    await test('Test 15: Strict ID Validation on Trip Summary (GET /api/analytics/trip-summary/12abc -> 400)', async () => {
      // Static Evidence: isStrictPositiveInteger line 2871 rejects "12abc", returns 400 at line 2872 before Prisma lookup.
      const res = await fetchWithTimeout(`${BASE_URL}/api/analytics/trip-summary/12abc`, {
        headers: { 'Authorization': `Bearer ${travelerToken}` }
      });
      if (res.status !== 400) throw new Error(`Expected HTTP 400 Bad Request, received ${res.status}`);
    });

    await test('Test 16: Strict Expense Validation Rejection (POST /api/expenses with amount_inr: "50abc" -> 400)', async () => {
      // Static Evidence: isStrictPositiveNumber line 2714 rejects "50abc", returns 400 at line 2715 before trip lookup or insert.
      const res = await fetchWithTimeout(`${BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${travelerToken}`
        },
        body: JSON.stringify({
          trip_id: 1,
          category_id: 1,
          expense_name: 'Test Expense',
          amount_inr: '50abc'
        })
      });
      if (res.status !== 400) throw new Error(`Expected HTTP 400 Bad Request, received ${res.status}`);
    });
  } else {
    skip('Group 4 Validation Tests (Tests 13-16)', 'JWT_SECRET unavailable');
  }

  await test('Test 17: Google OAuth Missing Credential Rejection (POST /api/auth/google with {} -> 400)', async () => {
    // Static Evidence: line 228 checks !credential. Returns 400 at line 229 before Google tokeninfo call.
    const res = await fetchWithTimeout(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400 Bad Request, received ${res.status}`);
  });

  // ============================================================================
  // GROUP 5: Authorized Admin Read-Only Operations (Zero Writes, Read-Only Counts)
  // ============================================================================

  if (adminToken) {
    await test('Test 18: Admin Access to System Health (GET /api/admin/system-health -> 200)', async () => {
      // Static Evidence: line 2947 requires ADMIN. Queries counts and SELECT 1. Zero writes.
      const res = await fetchWithTimeout(`${BASE_URL}/api/admin/system-health`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error(`Expected HTTP 200 OK, received ${res.status}`);
      const data = await res.json();
      if (data.status !== 'OPERATIONAL') throw new Error('Expected status OPERATIONAL');
    });

    await test('Test 19: Admin Access to Audit Logs (GET /api/admin/audit-logs -> 200)', async () => {
      // Static Evidence: line 2924 requires ADMIN. Queries prisma.auditLog.findMany(). Zero writes.
      const res = await fetchWithTimeout(`${BASE_URL}/api/admin/audit-logs?limit=5`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) throw new Error(`Expected HTTP 200 OK, received ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.logs)) throw new Error('Expected logs array');
    });
  } else {
    skip('Group 5 Admin Read Tests (Tests 18-19)', 'JWT_SECRET unavailable');
  }

  console.log('\n================================================================');
  console.log(` Summary: ${passed} Passed | ${failed} Failed | ${skipped} Skipped`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runReadOnlyTests().catch(err => {
  console.error('Test harness execution error:', err.message);
  process.exit(1);
});
