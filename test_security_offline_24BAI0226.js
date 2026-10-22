// ============================================================================
// WanderBudget AI — Offline In-Memory Security Verification Suite
// Student: Garudaiahgari Sai Siri Chandana | Reg No: 24BAI0226
// Course: BCSE302P Database Systems Lab | Slot: L25+L26
//
// STATIC PROOF OF SAFETY & DETERMINISTIC EXECUTION:
// 1. Zero Network / Zero Server: Uses in-memory mock req/res. No open ports.
// 2. Zero Database Operations: No PrismaClient instantiation or DB calls.
// 3. Zero External Services: Validates auth, RBAC, validators, & BOLA locally.
// 4. Zero Secrets Copied: Uses mock secret or process.env.JWT_SECRET.
// ============================================================================

const path = require('path');

// Resolve jsonwebtoken from backend dependencies portably across environments
let jwt;
try {
  jwt = require('jsonwebtoken');
} catch (e1) {
  try {
    jwt = require(path.resolve(__dirname, 'backend', 'node_modules', 'jsonwebtoken'));
  } catch (e2) {
    jwt = require(path.resolve(process.cwd(), 'backend', 'node_modules', 'jsonwebtoken'));
  }
}

// 1. Mock Request / Response Factory
function createMockReqRes({ headers = {}, user = null, body = {}, params = {} } = {}) {
  const req = {
    headers: { ...headers },
    user,
    body: { ...body },
    params: { ...params }
  };

  let statusCode = 200;
  let responseData = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getStatus: () => statusCode,
    getData: () => responseData,
    wasNextCalled: () => nextCalled
  };
}

// 2. Logic Aligned with backend/server_wanderbudget_24BAI0226.js
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'offline-test-secret-24BAI0226-do-not-leak';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, TEST_JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required (24BAI0226 RBAC)' });
  }
}

function isStrictPositiveInteger(val) {
  if (typeof val === 'number') {
    return Number.isInteger(val) && val > 0;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!/^[1-9]\d*$/.test(trimmed)) return false;
    const num = Number(trimmed);
    return Number.isSafeInteger(num) && num > 0;
  }
  return false;
}

function isStrictPositiveNumber(val) {
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!/^\d+(\.\d+)?$/.test(trimmed)) return false;
    const num = Number(trimmed);
    return Number.isFinite(num) && num > 0;
  }
  return false;
}

function validateGoogleCredentialPayload(body) {
  const { credential } = body || {};
  if (!credential || typeof credential !== 'string' || credential.trim() === '') {
    return { valid: false, status: 400, error: 'Google credential token is required' };
  }
  return { valid: true };
}

function checkTripOwnership(user, trip) {
  if (!trip) return { allowed: false, status: 404, error: 'Trip not found' };
  if (user.role !== 'ADMIN' && trip.user_id !== user.user_id) {
    return { allowed: false, status: 403, error: 'Forbidden: You do not have permission' };
  }
  return { allowed: true };
}

function checkExpenseLoggingPermission(user, trip) {
  if (!trip) return { allowed: false, status: 404, error: 'Referenced trip not found' };
  // Application policy: Only the owner of the trip may log expenses against their itinerary
  if (trip.user_id !== user.user_id) {
    return { allowed: false, status: 403, error: 'Forbidden: You can only log expenses for your own trips' };
  }
  return { allowed: true };
}

function sanitizeRegistrationData(body, passwordHash = 'mock_hash') {
  const { reg_no, full_name, email, home_currency } = body || {};
  // Server-enforced role: ignores req.body.role or any elevation flags
  return {
    reg_no: reg_no ? String(reg_no).trim() : '',
    full_name: full_name ? String(full_name).trim() : '',
    email: email ? String(email).trim() : '',
    password_hash: passwordHash,
    role: 'TRAVELER', // Fixed default role, presented as User in UI
    home_currency: home_currency || 'INR'
  };
}

function sanitizeGoogleOAuthUserCreation(googlePayload, dummyHash = 'mock_oauth_hash') {
  const cleanEmail = (googlePayload.email || '').toLowerCase().trim();
  const cleanName = (typeof googlePayload.name === 'string' && googlePayload.name.trim())
    ? googlePayload.name.trim()
    : cleanEmail.split('@')[0];
  const generatedRegNo = `GGL_${cleanEmail.split('@')[0].toUpperCase().slice(0, 8)}_9999`;

  return {
    reg_no: generatedRegNo,
    full_name: cleanName,
    email: cleanEmail,
    password_hash: dummyHash,
    role: 'TRAVELER', // Fixed default role, presented as User in UI
    home_currency: 'INR',
    oauth_provider: 'GOOGLE'
  };
}

// 3. Test Runner
async function runOfflineVerification() {
  console.log('================================================================');
  console.log(' WanderBudget AI — Offline In-Memory Security Verification ');
  console.log(' Reg No: 24BAI0226 | Pure Logic & Mock In-Memory Tests ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✔ PASS: ${name}`);
      passed++;
    } else {
      console.error(`✖ FAIL: ${name} -> ${details}`);
      failed++;
    }
  }

  // A. Authentication Middleware Tests
  console.log('--- A. Authentication Middleware Rejection & Passing ---');
  {
    // A1: Missing token (no header)
    const ctx = createMockReqRes({ headers: {} });
    authenticateToken(ctx.req, ctx.res, ctx.next);
    assert('Auth: Rejects missing Authorization header with 401',
      ctx.getStatus() === 401 && ctx.getData()?.error === 'Access token required' && !ctx.wasNextCalled());

    // A2: Malformed Bearer header (no token)
    const ctx2 = createMockReqRes({ headers: { authorization: 'Bearer' } });
    authenticateToken(ctx2.req, ctx2.res, ctx2.next);
    assert('Auth: Rejects empty Bearer header with 401',
      ctx2.getStatus() === 401 && !ctx2.wasNextCalled());

    // A3: Malformed token string
    const ctx3 = createMockReqRes({ headers: { authorization: 'Bearer malformed.token.value' } });
    authenticateToken(ctx3.req, ctx3.res, ctx3.next);
    assert('Auth: Rejects malformed JWT token with 403',
      ctx3.getStatus() === 403 && ctx3.getData()?.error === 'Invalid or expired token' && !ctx3.wasNextCalled());

    // A4: Token signed with mismatched secret
    const wrongSecretToken = jwt.sign({ user_id: 1, role: 'TRAVELER' }, 'wrong-secret');
    const ctx4 = createMockReqRes({ headers: { authorization: `Bearer ${wrongSecretToken}` } });
    authenticateToken(ctx4.req, ctx4.res, ctx4.next);
    assert('Auth: Rejects token signed with wrong secret with 403',
      ctx4.getStatus() === 403 && !ctx4.wasNextCalled());

    // A5: Valid token signed with correct secret
    const validToken = jwt.sign({ user_id: 101, reg_no: '24BAI0226', role: 'TRAVELER' }, TEST_JWT_SECRET);
    const ctx5 = createMockReqRes({ headers: { authorization: `Bearer ${validToken}` } });
    authenticateToken(ctx5.req, ctx5.res, ctx5.next);
    assert('Auth: Accepts valid signed token and attaches req.user',
      ctx5.getStatus() === 200 && ctx5.wasNextCalled() && ctx5.req.user?.user_id === 101 && ctx5.req.user?.role === 'TRAVELER');
  }

  // B. Role-Based Access Control (requireAdmin)
  console.log('\n--- B. RBAC (requireAdmin) Enforcement ---');
  {
    // B1: TRAVELER role blocked
    const ctx = createMockReqRes({ user: { user_id: 101, role: 'TRAVELER' } });
    requireAdmin(ctx.req, ctx.res, ctx.next);
    assert('RBAC: Rejects TRAVELER role with 403',
      ctx.getStatus() === 403 && ctx.getData()?.error.includes('Administrator privileges required') && !ctx.wasNextCalled());

    // B2: USER role blocked
    const ctxUser = createMockReqRes({ user: { user_id: 102, role: 'USER' } });
    requireAdmin(ctxUser.req, ctxUser.res, ctxUser.next);
    assert('RBAC: Rejects USER role with 403',
      ctxUser.getStatus() === 403 && ctxUser.getData()?.error.includes('Administrator privileges required') && !ctxUser.wasNextCalled());

    // B3: Missing role / null user blocked
    const ctx2 = createMockReqRes({ user: null });
    requireAdmin(ctx2.req, ctx2.res, ctx2.next);
    assert('RBAC: Rejects missing req.user with 403',
      ctx2.getStatus() === 403 && !ctx2.wasNextCalled());

    // B4: Custom or unexpected role blocked
    const ctx3 = createMockReqRes({ user: { role: 'OPERATOR' } });
    requireAdmin(ctx3.req, ctx3.res, ctx3.next);
    assert('RBAC: Rejects non-admin arbitrary role (OPERATOR) with 403',
      ctx3.getStatus() === 403 && !ctx3.wasNextCalled());

    // B5: ADMIN role allowed
    const ctx4 = createMockReqRes({ user: { user_id: 999, role: 'ADMIN' } });
    requireAdmin(ctx4.req, ctx4.res, ctx4.next);
    assert('RBAC: Allows user with role ADMIN to proceed (calls next)',
      ctx4.wasNextCalled() && ctx4.getStatus() === 200);
  }

  // C. Strict Positive Integer Validator
  console.log('\n--- C. Strict Positive Integer Validator (isStrictPositiveInteger) ---');
  {
    const acceptCases = [1, 5, 100, '1', '5', '100', '999999'];
    const rejectCases = ['12abc', '0', '-1', '', '   ', null, undefined, true, false, NaN, 1.5, '1.5', 0, -5, Infinity];

    let allAcceptPass = true;
    for (const c of acceptCases) {
      if (!isStrictPositiveInteger(c)) {
        allAcceptPass = false;
        console.error(`Unexpected rejection for valid int: ${JSON.stringify(c)}`);
      }
    }
    assert(`Integer Validator: Correctly accepts all ${acceptCases.length} valid cases`, allAcceptPass);

    let allRejectPass = true;
    for (const c of rejectCases) {
      if (isStrictPositiveInteger(c)) {
        allRejectPass = false;
        console.error(`Failed to reject invalid int: ${JSON.stringify(c)}`);
      }
    }
    assert(`Integer Validator: Correctly rejects all ${rejectCases.length} invalid/malicious cases`, allRejectPass);
  }

  // D. Strict Positive Number Validator
  console.log('\n--- D. Strict Positive Number Validator (isStrictPositiveNumber) ---');
  {
    const acceptCases = [5.5, 100, 0.01, '5.5', '100', '0.01', '999.99'];
    const rejectCases = ['50abc', 0, '0', -2, '-2', false, true, null, undefined, NaN, '', '   ', Infinity, '-0.5'];

    let allAcceptPass = true;
    for (const c of acceptCases) {
      if (!isStrictPositiveNumber(c)) {
        allAcceptPass = false;
        console.error(`Unexpected rejection for valid number: ${JSON.stringify(c)}`);
      }
    }
    assert(`Numeric Validator: Correctly accepts all ${acceptCases.length} valid positive numbers`, allAcceptPass);

    let allRejectPass = true;
    for (const c of rejectCases) {
      if (isStrictPositiveNumber(c)) {
        allRejectPass = false;
        console.error(`Failed to reject invalid number: ${JSON.stringify(c)}`);
      }
    }
    assert(`Numeric Validator: Correctly rejects all ${rejectCases.length} invalid/non-positive cases`, allRejectPass);
  }

  // E. Google Credential Input Validation
  console.log('\n--- E. Google OAuth Credential Pre-flight Rejection ---');
  {
    const missingCases = [
      {},
      { credential: null },
      { credential: '' },
      { credential: '   ' },
      { credential: 12345 },
      { credential: true },
      { otherKey: 'test' }
    ];

    let allGoogleRejectPass = true;
    for (const body of missingCases) {
      const res = validateGoogleCredentialPayload(body);
      if (res.valid || res.status !== 400 || res.error !== 'Google credential token is required') {
        allGoogleRejectPass = false;
        console.error(`Failed Google credential rejection for: ${JSON.stringify(body)}`);
      }
    }
    assert(`Google Auth Pre-flight: Rejects all ${missingCases.length} empty/invalid credential payloads with 400`, allGoogleRejectPass);

    const validGooglePayload = { credential: 'mock.valid.cryptographic.jwt.id_token' };
    const validRes = validateGoogleCredentialPayload(validGooglePayload);
    assert('Google Auth Pre-flight: Passes non-empty string credential to tokeninfo stage', validRes.valid === true);
  }

  // F. Object-Level Authorization (BOLA Ownership Checks)
  console.log('\n--- F. Object-Level Authorization (BOLA Ownership) ---');
  {
    const tripRecord = { trip_id: 42, user_id: 101, title: 'Goa Holiday' };

    // F1: Different traveler blocked from viewing trip
    const foreignUser = { user_id: 202, role: 'TRAVELER' };
    const res1 = checkTripOwnership(foreignUser, tripRecord);
    assert('BOLA: Unauthorized traveler (id 202) rejected from viewing trip 42 (owner 101) with 403',
      res1.allowed === false && res1.status === 403);

    // F2: Different user (with role USER) blocked from viewing trip
    const foreignStandardUser = { user_id: 203, role: 'USER' };
    const res2 = checkTripOwnership(foreignStandardUser, tripRecord);
    assert('BOLA: Unauthorized user (id 203, role USER) rejected from viewing trip 42 with 403',
      res2.allowed === false && res2.status === 403);

    // F3: Owner traveler allowed to view trip
    const ownerUser = { user_id: 101, role: 'TRAVELER' };
    const res3 = checkTripOwnership(ownerUser, tripRecord);
    assert('BOLA: Legitimate trip owner (id 101) authorized to access trip 42',
      res3.allowed === true);

    // F4: Admin role allowed to inspect trip (for audit logs & administrative oversight)
    const adminUser = { user_id: 999, role: 'ADMIN' };
    const res4 = checkTripOwnership(adminUser, tripRecord);
    assert('BOLA: Administrator (id 999) authorized to inspect trip 42 for oversight',
      res4.allowed === true);

    // F5: Foreign user blocked from logging expenses on another user's trip
    const expenseRes1 = checkExpenseLoggingPermission(foreignUser, tripRecord);
    assert('BOLA: Foreign user (id 202) rejected from logging expense on trip 42 with 403',
      expenseRes1.allowed === false && expenseRes1.status === 403);

    // F6: Admin restricted from logging expenses on another user's private trip per application policy
    const expenseRes2 = checkExpenseLoggingPermission(adminUser, tripRecord);
    assert('BOLA: Admin restricted from logging expenses on traveler trip 42 (policy: owner-only)',
      expenseRes2.allowed === false && expenseRes2.status === 403);

    // F7: Owner allowed to log expenses on their own trip
    const expenseRes3 = checkExpenseLoggingPermission(ownerUser, tripRecord);
    assert('BOLA: Trip owner (id 101) authorized to log expenses on trip 42',
      expenseRes3.allowed === true);
  }

  // G. Privilege Escalation Prevention (Registration & Google OAuth)
  console.log('\n--- G. Role Escalation Prevention in Registration & OAuth ---');
  {
    // G1: Public registration cannot self-assign ADMIN role
    const maliciousRegistrationPayload = {
      reg_no: '24BAI0226_HACK',
      full_name: 'Attacker Attempting Escalation',
      email: 'attacker@evil.local',
      role: 'ADMIN',
      isAdmin: true,
      home_currency: 'INR'
    };
    const createdUser = sanitizeRegistrationData(maliciousRegistrationPayload);
    assert('Privilege Escalation: Public registration ignores client-supplied role: ADMIN and forces TRAVELER/User',
      createdUser.role === 'TRAVELER');

    // G2: Arbitrary role injection in registration is neutralized
    const arbitraryPayload = {
      reg_no: '24BAI0226_ROOT',
      full_name: 'Super User Candidate',
      email: 'candidate@test.local',
      role: 'SUPERUSER',
      permissions: ['ALL']
    };
    const neutralizedUser = sanitizeRegistrationData(arbitraryPayload);
    assert('Privilege Escalation: Arbitrary role (SUPERUSER) neutralized to default TRAVELER/User role',
      neutralizedUser.role === 'TRAVELER');

    // G3: Google OAuth account creation forces TRAVELER role regardless of claims
    const maliciousGoogleClaims = {
      email: 'google_admin_attempt@gmail.com',
      name: 'Google User',
      role: 'ADMIN',
      is_admin: true
    };
    const googleUser = sanitizeGoogleOAuthUserCreation(maliciousGoogleClaims);
    assert('Privilege Escalation: Google OAuth signup forces role TRAVELER and disregards injected ADMIN claims',
      googleUser.role === 'TRAVELER');
  }

  console.log('\n================================================================');
  console.log(` Offline Suite Results: ${passed} Passed | ${failed} Failed`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runOfflineVerification().catch(err => {
  console.error('Offline harness runtime error:', err);
  process.exit(1);
});
