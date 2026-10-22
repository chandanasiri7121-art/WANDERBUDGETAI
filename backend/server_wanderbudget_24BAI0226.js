// ============================================================================
// WanderBudget AI — Express.js Backend Server
// ============================================================================

const path = require('path');
const fs = require('fs');
// Always load the backend-local configuration, even when Node is launched from the repository root.
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { discoverDestinations } = require('./destination_discovery_24BAI0226');
const { OPENAI_MODEL, createAdvisorStore, getBudgetAdvice } = require('./openai_budget_advisor_24BAI0226');
const { calculateDynamicEstimate, calculateExternalDynamicPreview, routeExternalDestination, routeSelectedAttractions } = require('./dynamic_trip_estimator_24BAI0226');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || typeof JWT_SECRET !== 'string' || JWT_SECRET.trim() === '') {
  console.error('FATAL: JWT_SECRET environment variable is missing or empty. Server cannot start securely.');
  process.exit(1);
}

// In-memory OTP store: { email: { otp, expiresAt, attempts } }
const otpStore = new Map();
const budgetAdvisorStore = createAdvisorStore();

function configuredCorsOrigins(rawOrigins) {
  const origins = new Set();
  for (const value of String(rawOrigins || '').split(',')) {
    const origin = value.trim();
    if (!origin) continue;
    try {
      const parsed = new URL(origin);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
        throw new Error('origin must be an http(s) origin without a path');
      }
      origins.add(parsed.origin);
    } catch {
      throw new Error(`Invalid FRONTEND_ORIGINS entry: ${origin}`);
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }
  return origins;
}

const corsOrigins = configuredCorsOrigins(process.env.FRONTEND_ORIGINS);

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const RESEND_REQUEST_TIMEOUT_MS = 8000;

async function sendOtpEmail({ to, subject, html }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.RESEND_FROM_EMAIL || '').trim();
  if (!apiKey || !from) {
    throw new Error('Resend email delivery is not configured');
  }

  let response;
  try {
    response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html }),
      signal: AbortSignal.timeout(RESEND_REQUEST_TIMEOUT_MS)
    });
  } catch (err) {
    throw new Error(err?.name === 'TimeoutError' ? 'Resend email delivery timed out' : 'Resend email delivery failed');
  }

  if (!response.ok) {
    throw new Error(`Resend email delivery was rejected (${response.status})`);
  }
}

// Helper: generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


BigInt.prototype.toJSON = function() {
  return Number(this);
};

// Middleware. Same-origin requests have no Origin header; browser cross-origin
// requests must be explicitly listed in FRONTEND_ORIGINS.
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.has(origin)) return callback(null, true);
    return callback(new Error('CORS origin is not allowed'));
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Public readiness endpoint for Render. It deliberately returns no database
// configuration or provider error details.
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ok' });
  } catch (_) {
    return res.status(503).json({ status: 'unavailable' });
  }
});

// Global Headers & Audit Metadata Injection
app.use((req, res, next) => {
  res.setHeader('X-Project-Title', 'WanderBudget AI - Dynamic Trip Budget & Live Cost Analyzer');
  next();
});

// Helper: Audit Logging
async function createAuditLog(userId, action, entityType, entityId, details, req) {
  try {
    const ip = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        user_id: userId || null,
        action,
        entity_type: entityType,
        entity_id: entityId ? Number(entityId) : null,
        ip_address: ip,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details)
      }
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// RBAC Middleware: Admin Only
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required (24BAI0226 RBAC)' });
  }
}

// Strict numeric and integer validators for request parameters and payloads
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

// ============================================================================
// 1. AUTHENTICATION & RBAC ENDPOINTS (Section 5 Rubric Compliance)
// ============================================================================

// Register User (Default role: TRAVELER)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { reg_no, full_name, email, password, home_currency } = req.body;
    if (!reg_no || !full_name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { reg_no }] }
    });
    if (existing) {
      return res.status(400).json({ error: 'User with this Email or Register Number already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    // Strict RBAC: All public registrations are assigned role 'TRAVELER' (presented as User in UI).
    // Client-supplied 'role' or elevation flags in req.body are strictly ignored.
    const user = await prisma.user.create({
      data: {
        reg_no,
        full_name,
        email,
        password_hash,
        role: 'TRAVELER',
        home_currency: home_currency || 'INR'
      }
    });

    await createAuditLog(user.user_id, 'USER_REGISTER', 'USER', user.user_id, `Registered traveler ${user.reg_no}`, req);

    const token = jwt.sign(
      { user_id: user.user_id, reg_no: user.reg_no, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { user_id: user.user_id, reg_no: user.reg_no, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { login_id, password } = req.body; // Can be email or reg_no
    if (!login_id || !password) {
      return res.status(400).json({ error: 'Login identifier and password required' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: login_id }, { reg_no: login_id }] }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, reg_no: user.reg_no, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await createAuditLog(user.user_id, 'USER_LOGIN', 'USER', user.user_id, `Successful login by ${user.reg_no}`, req);

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        reg_no: user.reg_no,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        home_currency: user.home_currency
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Google OAuth Sign-In & Instant Account Linking (Section 5 Rubric Compliance)
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    // 1. Require cryptographic credential token (reject missing, empty, or non-string inputs)
    if (!credential || typeof credential !== 'string' || credential.trim() === '') {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    const expectedClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!expectedClientId) {
      console.error('Server configuration error: GOOGLE_CLIENT_ID is missing from environment');
      return res.status(500).json({ error: 'Google authentication service is temporarily misconfigured' });
    }

    // 2. Cryptographic signature and claim verification via Google Identity Service endpoint
    let payload;
    try {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential.trim())}`,
        { method: 'GET', signal: AbortSignal.timeout(8000) }
      );

      if (!verifyRes.ok) {
        return res.status(401).json({ error: 'Invalid, expired, or forged Google OAuth token' });
      }

      payload = await verifyRes.json();
    } catch (networkErr) {
      console.error('Google tokeninfo provider network failure:', networkErr.message);
      return res.status(502).json({ error: 'Unable to contact Google OAuth verification provider. Please try again later.' });
    }

    // Reject tokeninfo payloads that are null, arrays, or not objects
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return res.status(401).json({ error: 'Invalid or malformed response from Google token verification' });
    }

    // 3. Strict Audience (aud) Validation
    if (String(payload.aud || '').trim() !== expectedClientId) {
      return res.status(401).json({ error: 'Token audience mismatch: Token was not issued for this application.' });
    }

    // 4. Authorized Party (azp) Validation (Google ID-Token Spec)
    if (payload.azp && String(payload.azp).trim() !== expectedClientId) {
      return res.status(401).json({ error: 'Token authorized party (azp) mismatch.' });
    }

    // 5. Issuer (iss) Validation
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
      return res.status(401).json({ error: 'Invalid token issuer' });
    }

    // 6. Expiration (exp) Validation (must be a finite, positive numeric timestamp in the future)
    const rawExp = payload.exp;
    const expSeconds = (typeof rawExp === 'number' || (typeof rawExp === 'string' && rawExp.trim() !== '')) ? Number(rawExp) : NaN;
    if (!Number.isFinite(expSeconds) || expSeconds <= 0 || expSeconds * 1000 <= Date.now()) {
      return res.status(401).json({ error: 'Google OAuth token has expired or has invalid timestamp' });
    }

    // 7. Subject (sub) Identifier Validation
    if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.trim() === '') {
      return res.status(401).json({ error: 'Token subject identifier missing' });
    }

    // 8. Verified Email & String Type Check
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      return res.status(401).json({ error: 'Google email address is not verified' });
    }

    if (!payload.email || typeof payload.email !== 'string' || !payload.email.includes('@')) {
      return res.status(401).json({ error: 'Google OAuth token does not contain a valid email address' });
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    const cleanName = (typeof payload.name === 'string' && payload.name.trim())
      ? payload.name.trim()
      : cleanEmail.split('@')[0];

    // 9. User Lookup, Account Linking, Registration, Audit Logging & JWT Response
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (user) {
      user = await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          oauth_provider: 'GOOGLE',
          full_name: user.full_name || cleanName
        }
      });
      await createAuditLog(
        user.user_id,
        'OAUTH_LOGIN',
        'USER',
        user.user_id,
        `Google OAuth login for ${user.email} (${user.reg_no})`,
        req
      );
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedRegNo = `GGL_${cleanEmail.split('@')[0].toUpperCase().slice(0, 8)}_${randomSuffix}`;
      const dummyPasswordHash = await bcrypt.hash(`GOOGLE_OAUTH_${cleanEmail}_${Date.now()}`, 10);

      user = await prisma.user.create({
        data: {
          reg_no: generatedRegNo,
          full_name: cleanName,
          email: cleanEmail,
          password_hash: dummyPasswordHash,
          role: 'TRAVELER',
          home_currency: 'INR',
          oauth_provider: 'GOOGLE'
        }
      });

      await createAuditLog(
        user.user_id,
        'OAUTH_REGISTER',
        'USER',
        user.user_id,
        `New Google OAuth user registration: ${user.email} as ${user.reg_no}`,
        req
      );
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        reg_no: user.reg_no,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        oauth_provider: 'GOOGLE'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Signed in with Google successfully!',
      token,
      user: {
        user_id: user.user_id,
        reg_no: user.reg_no,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        home_currency: user.home_currency,
        oauth_provider: 'GOOGLE',
        avatar_url: payload.picture || null
      }
    });
  } catch (err) {
    console.error('Google OAuth unexpected error:', err.message);
    res.status(500).json({ error: 'Google OAuth authentication failed' });
  }
});


// ============================================================================
// OTP EMAIL AUTHENTICATION (Resend HTTPS API)
// ============================================================================

// POST /api/auth/send-otp — generate and email a 6-digit OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Rate-limit: only allow a new OTP every 60 seconds
    const existing = otpStore.get(cleanEmail);
    if (existing && existing.expiresAt - 4 * 60 * 1000 > Date.now()) {
      const waitSec = Math.ceil((existing.expiresAt - 4 * 60 * 1000 - Date.now()) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSec}s before requesting a new OTP` });
    }

    // Check if email exists in users table
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please sign up first.' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleanEmail, { otp, expiresAt, attempts: 0 });

    await sendOtpEmail({
      to: cleanEmail,
      subject: '🔐 Your WanderBudget AI Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #10b981; font-size: 24px; margin: 0;">WanderBudget AI</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Dynamic Trip Budget Builder</p>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">Hello <strong style="color: #e2e8f0;">${user.full_name}</strong>,</p>
          <p style="color: #94a3b8; font-size: 14px;">Use the one-time password below to log in. It expires in <strong style="color: #10b981;">5 minutes</strong>.</p>
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background: #0f172a; border: 2px solid #10b981; border-radius: 12px; padding: 18px 36px;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #10b981; font-family: monospace;">${otp}</span>
            </div>
          </div>
          <p style="color: #475569; font-size: 12px; text-align: center;">Do not share this OTP with anyone. It is valid for one-time use only.</p>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="color: #334155; font-size: 11px; text-align: center;">WanderBudget AI • Database Systems Lab Project • BCSE302P</p>
        </div>
      `
    });

    await createAuditLog(user.user_id, 'OTP_SENT', 'USER', user.user_id, `OTP sent to ${cleanEmail}`, req);

    res.json({ message: `OTP sent to ${cleanEmail}. Valid for 5 minutes.`, email: cleanEmail });
  } catch (err) {
    console.error('Send OTP email delivery failed:', err?.name || 'unknown error');
    res.status(500).json({ error: 'Failed to send OTP email. Please try again later.' });
  }
});

// POST /api/auth/verify-otp — verify OTP and issue JWT
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email. Please request a new OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Limit brute-force attempts
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      otpStore.delete(cleanEmail);
      return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(401).json({ error: `Incorrect OTP. ${5 - record.attempts} attempts remaining.` });
    }

    // OTP is valid — clear it immediately (single use)
    otpStore.delete(cleanEmail);

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, reg_no: user.reg_no, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await createAuditLog(user.user_id, 'OTP_LOGIN', 'USER', user.user_id, `OTP login verified for ${cleanEmail}`, req);

    res.json({
      message: 'OTP verified! Logged in successfully.',
      token,
      user: {
        user_id: user.user_id,
        reg_no: user.reg_no,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        home_currency: user.home_currency
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Current Profile

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: { user_id: true, reg_no: true, full_name: true, email: true, role: true, home_currency: true, created_at: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Live Currency Exchange Rate Cache & Real-Time Sync Provider
let LIVE_RATES_CACHE = null;
let LIVE_RATES_FETCH_TIME = 0;
const RATES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getLiveFxRateToInr(currencyCode, fallbackRate = 1.0) {
  if (!currencyCode || currencyCode === 'INR') return 1.0;
  const now = Date.now();
  if (!LIVE_RATES_CACHE || (now - LIVE_RATES_FETCH_TIME) > RATES_CACHE_TTL_MS) {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR', { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const json = await res.json();
        if (json && json.rates) {
          LIVE_RATES_CACHE = json.rates;
          LIVE_RATES_FETCH_TIME = now;
        }
      }
    } catch (err) {
      // Graceful fallback to static benchmark rate if external API is unreachable
    }
  }

  if (LIVE_RATES_CACHE && LIVE_RATES_CACHE[currencyCode]) {
    const inrPerUnit = 1 / LIVE_RATES_CACHE[currencyCode];
    if (inrPerUnit > 0) {
      return Number(inrPerUnit.toFixed(4));
    }
  }

  return fallbackRate;
}

// Live Generative AI Destination Analysis using Google Gemini
async function analyzeDestinationViaGemini(cityName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    return null;
  }

  try {
    const prompt = `You are a professional travel economist and tourism researcher.
Analyze the destination "${cityName}". Return ONLY a valid JSON object (no markdown, no backticks, no explanations) with this exact schema:
{
  "country": "Full country name",
  "currency": "3-letter ISO currency code e.g. USD, EUR, JPY, INR",
  "symbol": "Currency symbol e.g. $, €, ¥, ₹",
  "exchange_rate_to_inr": number representing how many INR equal 1 unit of local currency,
  "daily_accommodation_budget": number in local currency per night for budget stay/hostel,
  "daily_accommodation_standard": number in local currency per night for 3-star hotel,
  "daily_accommodation_luxury": number in local currency per night for 5-star/resort,
  "daily_food_budget": number in local currency per day for street food & local diners,
  "daily_food_standard": number in local currency per day for sit-down restaurants,
  "daily_food_luxury": number in local currency per day for fine dining,
  "daily_transit_public": number in local currency per day for metro/bus transit pass,
  "daily_taxi_per_km": number in local currency per km for local taxi/cab,
  "cost_index_score": integer between 10 and 100 relative to New York (100),
  "overview": "Concise 2-sentence cultural, geographic, and travel description",
  "attractions": [
    {
      "name": "Actual authentic tourist attraction or landmark name in ${cityName}",
      "category": "Temple / Fort / Museum / Nature / Beach / Viewpoint / Market / Palace",
      "ticket_price_local": number ticket price in local currency (0 if free),
      "avg_duration_hours": number estimated visit time in hours (e.g. 2.5)
    }
  ]
}
Ensure at least 5 authentic, real tourist attractions for ${cityName}.`;

    // Try Gemini 3.5 Flash Lite, 3.1 Flash Lite, and 3.8 Flash
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey.trim()}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey.trim()}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey.trim()}`
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.2
            }
          }),
          signal: AbortSignal.timeout(9000)
        });

        if (response.ok) {
          const result = await response.json();
          const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJsonStr);
            if (parsed.country && parsed.currency && Array.isArray(parsed.attractions) && parsed.attractions.length > 0) {
              return parsed;
            }
          }
        }
      } catch (errInner) {
        // Continue to next endpoint or return null
      }
    }
  } catch (err) {
    console.warn(`[Gemini AI] Query error for ${cityName}:`, err.message);
  }
  return null;
}

// Destination benchmark knowledge base for real-world live synthesis
const GLOBAL_COST_BENCHMARKS = {
  'hyderabad': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2400, acc_l: 7500, meal_b: 400, meal_s: 950, meal_l: 2400, transit: 350, taxi: 20,
    attractions: [
      { name: 'Charminar & Laad Bazaar Heritage Walk', category: 'Iconic Landmark', price: 25, hours: 2.0 },
      { name: 'Golconda Fort & Sound & Light Show', category: 'Historical Fort', price: 50, hours: 3.5 },
      { name: 'Ramoji Film City Thematic Experience', category: 'Entertainment Studio', price: 1350, hours: 6.0 },
      { name: 'Salar Jung Historic Art Museum', category: 'Art & Heritage', price: 50, hours: 2.5 },
      { name: 'Birla Mandir & Hussain Sagar Buddha View', category: 'Temple & Lake Promenade', price: 0, hours: 2.0 },
      { name: 'Chowmahalla Royal Nizami Palace', category: 'Palace Architecture', price: 100, hours: 2.0 }
    ]
  },
  'bangalore': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 950, acc_s: 2800, acc_l: 8500, meal_b: 450, meal_s: 1100, meal_l: 2800, transit: 400, taxi: 22,
    attractions: [
      { name: 'Bangalore Palace Tudor Estate & Grounds', category: 'Royal Palace', price: 250, hours: 2.5 },
      { name: 'Lalbagh Botanical Garden & Glass House', category: 'Botanical Park', price: 30, hours: 2.0 },
      { name: 'Bannerghatta National Park & Lion Safari', category: 'Wildlife Sanctuary', price: 350, hours: 4.5 },
      { name: 'Cubbon Park & Visvesvaraya Science Museum', category: 'Public Park & Museum', price: 85, hours: 2.5 },
      { name: 'ISKCON Sri Radha Krishna Temple', category: 'Spiritual Heritage', price: 0, hours: 2.0 }
    ]
  },
  'chennai': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2300, acc_l: 7000, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 300, taxi: 19,
    attractions: [
      { name: 'Marina Beach & Historic Lighthouse View', category: 'Coastal Promenade', price: 20, hours: 2.0 },
      { name: 'Kapaleeshwarar Ancient Dravidian Temple', category: 'Dravidian Temple', price: 0, hours: 1.5 },
      { name: 'Fort St. George & Colonial Clive Museum', category: 'Colonial Heritage', price: 25, hours: 2.0 },
      { name: 'DakshinaChitra Living Heritage Museum', category: 'Cultural Heritage', price: 175, hours: 3.0 },
      { name: 'San Thome Cathedral Basilica', category: 'Historic Cathedral', price: 0, hours: 1.5 }
    ]
  },
  'mumbai': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 1100, acc_s: 3600, acc_l: 12000, meal_b: 500, meal_s: 1400, meal_l: 3800, transit: 450, taxi: 26,
    attractions: [
      { name: 'Gateway of India & Colaba Causeway Walk', category: 'Iconic Monument', price: 0, hours: 2.0 },
      { name: 'Elephanta Caves UNESCO Rock-Cut Sculptures', category: 'UNESCO Heritage Caves', price: 260, hours: 4.5 },
      { name: 'Marine Drive Queen\'s Necklace Sunset Stroll', category: 'Oceanfront Promenade', price: 0, hours: 2.0 },
      { name: 'Chhatrapati Shivaji Maharaj Vastu Sangrahalaya', category: 'Museum of History', price: 150, hours: 3.0 },
      { name: 'Shree Siddhivinayak Temple', category: 'Sacred Temple', price: 0, hours: 1.5 }
    ]
  },
  'delhi': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 900, acc_s: 2700, acc_l: 9000, meal_b: 450, meal_s: 1100, meal_l: 2900, transit: 400, taxi: 22,
    attractions: [
      { name: 'Red Fort (Lal Qila) UNESCO Citadel', category: 'UNESCO Fort', price: 50, hours: 3.0 },
      { name: 'Qutub Minar & Mehrauli Archaeological Complex', category: 'Ancient Monument', price: 50, hours: 2.5 },
      { name: 'India Gate & Kartavya Path Memorial', category: 'War Memorial', price: 0, hours: 1.5 },
      { name: 'Humayun\'s Tomb Mughal Garden Heritage', category: 'Mughal Architecture', price: 50, hours: 2.0 },
      { name: 'Swaminarayan Akshardham Temple Complex', category: 'Spiritual Complex', price: 0, hours: 3.5 }
    ]
  },
  'agra': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2100, acc_l: 7500, meal_b: 380, meal_s: 900, meal_l: 2300, transit: 300, taxi: 18,
    attractions: [
      { name: 'Taj Mahal UNESCO Wonder of the World Ticket', category: 'Wonder of the World', price: 50, hours: 3.5 },
      { name: 'Agra Fort Red Sandstone Royal Citadel', category: 'Mughal Fort', price: 50, hours: 2.5 },
      { name: 'Fatehpur Sikri Imperial Desert Capital', category: 'UNESCO Heritage City', price: 50, hours: 3.0 },
      { name: 'Mehtab Bagh Moonlight Garden Sunset View', category: 'Scenic Garden', price: 25, hours: 1.5 }
    ]
  },
  'amritsar': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2000, acc_l: 6500, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 300, taxi: 18,
    attractions: [
      { name: 'Golden Temple (Harmandir Sahib) & Langar', category: 'Sacred Sikh Gurdwara', price: 0, hours: 3.5 },
      { name: 'Wagah Border India-Pakistan Retreat Ceremony', category: 'Patriotic Ceremony', price: 0, hours: 3.0 },
      { name: 'Jallianwala Bagh Historic Memorial', category: 'National Memorial', price: 0, hours: 1.5 },
      { name: 'Gobindgarh Fort & 7D Heritage Light Show', category: 'Historic Fort', price: 150, hours: 2.5 }
    ]
  },
  'kolkata': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 7000, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 280, taxi: 18,
    attractions: [
      { name: 'Victoria Memorial Hall & Royal Gardens', category: 'Colonial Monument', price: 50, hours: 3.0 },
      { name: 'Howrah Bridge & Hooghly River Ferry', category: 'Iconic Bridge', price: 10, hours: 1.5 },
      { name: 'Dakshineswar Kali Temple & Belur Math', category: 'Sacred Temple', price: 0, hours: 3.0 },
      { name: 'Indian Museum (Greatest Museum of India)', category: 'National Museum', price: 50, hours: 2.5 }
    ]
  },
  'kochi': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2300, acc_l: 7500, meal_b: 400, meal_s: 950, meal_l: 2400, transit: 350, taxi: 20,
    attractions: [
      { name: 'Fort Kochi Beach & Chinese Fishing Nets', category: 'Maritime Heritage', price: 0, hours: 2.0 },
      { name: 'Mattancherry Dutch Palace & Jewish Synagogue', category: 'Historic Palace', price: 25, hours: 2.0 },
      { name: 'Alleppey Backwaters Shikara Day Cruise', category: 'Backwater Cruise', price: 800, hours: 4.0 },
      { name: 'Kathakali Traditional Classical Arts Show', category: 'Cultural Dance', price: 400, hours: 2.0 }
    ]
  },
  'mysore': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6800, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 300, taxi: 18,
    attractions: [
      { name: 'Mysore Palace (Amba Vilas) Royal Halls', category: 'Royal Palace', price: 100, hours: 2.5 },
      { name: 'Chamundeshwari Temple & Nandi Hill View', category: 'Hilltop Temple', price: 0, hours: 2.0 },
      { name: 'Brindavan Gardens & Musical Fountain Show', category: 'Botanical Gardens', price: 50, hours: 2.5 },
      { name: 'Sri Chamarajendra Zoological Park', category: 'Zoo & Conservation', price: 100, hours: 3.0 }
    ]
  },
  'pondicherry': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2500, acc_l: 7800, meal_b: 420, meal_s: 1000, meal_l: 2500, transit: 320, taxi: 20,
    attractions: [
      { name: 'French Quarter (White Town) Heritage Walk', category: 'Colonial Architecture', price: 0, hours: 2.5 },
      { name: 'Auroville Matrimandir & Peace Pavilion', category: 'Spiritual Commune', price: 0, hours: 3.0 },
      { name: 'Paradise Beach Ferry & Water Sports', category: 'Island Beach', price: 150, hours: 3.0 },
      { name: 'Sri Aurobindo Ashram Peaceful Meditation', category: 'Ashram Sanctuary', price: 0, hours: 1.5 }
    ]
  },
  'visakhapatnam': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 380, meal_s: 880, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'INS Kursura Submarine Museum at RK Beach', category: 'Maritime Military Museum', price: 40, hours: 2.0 },
      { name: 'Kailasagiri Hilltop Ropeway & Bay View', category: 'Scenic Hill Viewpoint', price: 100, hours: 2.5 },
      { name: 'Borra Caves & Araku Valley Coffee Tour', category: 'Limestone Caves & Nature', price: 80, hours: 5.0 },
      { name: 'Rushikonda Blue Flag Beach & Surfing', category: 'Beach & Coastal', price: 0, hours: 2.5 }
    ]
  },
  'vellore': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2000, acc_l: 5800, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 280, taxi: 18,
    attractions: [
      { name: 'Vellore Fort & Jalakanteswarar Temple', category: 'Historic Fort & Temple', price: 0, hours: 2.5 },
      { name: 'Sripuram Sri Lakshmi Narayani Golden Temple', category: 'Spiritual Golden Shrine', price: 100, hours: 3.0 },
      { name: 'Amirthi Zoological Forest Park & Waterfalls', category: 'Nature & Wildlife', price: 20, hours: 2.5 }
    ]
  },
  'vijayawada': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6200, meal_b: 380, meal_s: 880, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Sri Durga Malleswara Swamy (Kanaka Durga) Temple', category: 'Hilltop Sacred Temple', price: 100, hours: 2.5 },
      { name: 'Undavalli 4th-Century Rock-Cut Cave Temples', category: 'Ancient Caves', price: 25, hours: 2.0 },
      { name: 'Bhavani Island River Resort & Boating', category: 'River Island & Watersports', price: 150, hours: 3.0 },
      { name: 'Prakasam Barrage Evening Riverfront Walk', category: 'River Barrage Promenade', price: 0, hours: 1.5 }
    ]
  },
  'shimla': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2600, acc_l: 8500, meal_b: 420, meal_s: 1050, meal_l: 2600, transit: 350, taxi: 22,
    attractions: [
      { name: 'The Ridge & Mall Road Colonial Stroll', category: 'Colonial Promenade', price: 0, hours: 2.0 },
      { name: 'Jakhoo Hilltop Temple & Ropeway Cable Car', category: 'Temple & Cable Car', price: 250, hours: 2.0 },
      { name: 'Kalka-Shimla UNESCO Mountain Toy Train Ride', category: 'UNESCO Toy Train', price: 75, hours: 4.0 },
      { name: 'Kufri Snow Adventure Valley', category: 'Mountain Adventure', price: 300, hours: 3.5 }
    ]
  },
  'ladakh': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 950, acc_s: 3000, acc_l: 9500, meal_b: 450, meal_s: 1100, meal_l: 2700, transit: 450, taxi: 26,
    attractions: [
      { name: 'Pangong Tso Alpine Blue Lake Excursion', category: 'High-Altitude Lake', price: 400, hours: 8.0 },
      { name: 'Khardung La High Mountain Pass (17,582 ft)', category: 'Mountain Pass', price: 200, hours: 4.0 },
      { name: 'Nubra Valley Hunder Sand Dunes Camel Safari', category: 'Desert Dunes in Himalayas', price: 350, hours: 6.0 },
      { name: 'Thiksey Buddhist Monastery Morning Chants', category: 'Buddhist Monastery', price: 50, hours: 2.5 }
    ]
  },
  'udaipur': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2700, acc_l: 9500, meal_b: 450, meal_s: 1100, meal_l: 2800, transit: 380, taxi: 20,
    attractions: [
      { name: 'City Palace of Udaipur & Museum Complex', category: 'Royal Palace Museum', price: 300, hours: 3.0 },
      { name: 'Lake Pichola Sunset Boat Cruise to Jag Mandir', category: 'Lake Sunset Cruise', price: 500, hours: 2.0 },
      { name: 'Saheliyon-ki-Bari Royal Fountains Garden', category: 'Royal Mughal Gardens', price: 20, hours: 1.5 },
      { name: 'Bagore Ki Haveli Dharohar Rajasthani Folk Show', category: 'Folk Dance & Puppetry', price: 100, hours: 2.0 }
    ]
  },
  'rishikesh': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2100, acc_l: 7000, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 300, taxi: 18,
    attractions: [
      { name: 'Laxman Jhula & Triveni Ghat Evening Ganga Aarti', category: 'Spiritual River Ceremony', price: 0, hours: 2.0 },
      { name: 'Ganges White Water River Rafting (16 km)', category: 'Adventure Rafting', price: 650, hours: 3.5 },
      { name: 'The Beatles Ashram (Chaurasi Kutia)', category: 'Spiritual Art Ruins', price: 150, hours: 2.5 },
      { name: 'Neelkanth Mahadev Sacred Mountain Shrine', category: 'Sacred Shiva Temple', price: 0, hours: 3.0 }
    ]
  },
  'kedarnath': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2400, acc_l: 6500, meal_b: 450, meal_s: 950, meal_l: 2200, transit: 400, taxi: 25,
    attractions: [
      { name: 'Kedarnath Jyotirlinga Himalayan Sacred Shrine', category: 'Himalayan Jyotirlinga', price: 0, hours: 5.0 },
      { name: 'Bhairavnath Mountain Ridge Viewpoint', category: 'Alpine Viewpoint', price: 0, hours: 2.0 },
      { name: 'Vasuki Tal High Altitude Glacial Lake Trek', category: 'Glacial Trekking', price: 0, hours: 4.0 },
      { name: 'Gaurikund Sacred Hot Water Thermal Spring', category: 'Thermal Springs', price: 0, hours: 1.5 }
    ]
  },
  'london': { country: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 108.5, acc_b: 45, acc_s: 140, acc_l: 380, meal_b: 20, meal_s: 55, meal_l: 150, transit: 9, taxi: 2.5,
    attractions: [
      { name: 'Tower of London & Crown Jewels Exhibition', category: 'Royal Fortress', price: 34, hours: 3.0 },
      { name: 'British Museum Masterpieces Guided Walk', category: 'World History Museum', price: 0, hours: 3.0 },
      { name: 'London Eye Riverside Observation Wheel', category: 'Skyline Wheel', price: 38, hours: 1.5 },
      { name: 'Westminster Abbey Royal Coronation Church', category: 'Gothic Royal Abbey', price: 29, hours: 2.0 },
      { name: 'Buckingham Palace & Changing of the Guard', category: 'Royal Monarchy', price: 0, hours: 1.5 }
    ]
  },
  'new york': { country: 'United States', currency: 'USD', symbol: '$', rate: 84.0, acc_b: 55, acc_s: 175, acc_l: 450, meal_b: 25, meal_s: 65, meal_l: 180, transit: 12, taxi: 2.8,
    attractions: [
      { name: 'Empire State Building 86th Floor Observatory', category: 'Skyline Observatory', price: 44, hours: 2.0 },
      { name: 'Statue of Liberty & Ellis Island National Monument', category: 'National Monument', price: 25, hours: 3.5 },
      { name: 'The Metropolitan Museum of Art (The Met)', category: 'World Art Museum', price: 30, hours: 3.5 },
      { name: 'Central Park & Strawberry Fields Stroll', category: 'Urban Park Sanctuary', price: 0, hours: 2.0 },
      { name: 'Times Square & Broadway Theatre District Walk', category: 'Entertainment Hub', price: 0, hours: 2.0 }
    ]
  },
  'bangkok': { country: 'Thailand', currency: 'THB', symbol: '฿', rate: 2.3, acc_b: 450, acc_s: 1500, acc_l: 4800, meal_b: 150, meal_s: 450, meal_l: 1500, transit: 120, taxi: 15,
    attractions: [
      { name: 'The Grand Palace & Wat Phra Kaew (Emerald Buddha)', category: 'Royal Palace & Temple', price: 500, hours: 3.0 },
      { name: 'Wat Arun (Temple of Dawn) on Chao Phraya River', category: 'Riverside Temple', price: 100, hours: 1.5 },
      { name: 'Wat Pho Giant Golden Reclining Buddha', category: 'Sacred Buddha Shrine', price: 200, hours: 2.0 },
      { name: 'Chao Phraya Princess Sunset Buffet Cruise', category: 'River Dinner Cruise', price: 1200, hours: 2.5 }
    ]
  },
  'seoul': { country: 'South Korea', currency: 'KRW', symbol: '₩', rate: 0.062, acc_b: 28000, acc_s: 85000, acc_l: 260000, meal_b: 7000, meal_s: 22000, meal_l: 65000, transit: 3000, taxi: 1000,
    attractions: [
      { name: 'Gyeongbokgung Palace & Hanbok Experience', category: 'Heritage', price: 3000, hours: 2.5 },
      { name: 'N Seoul Tower Observatory', category: 'Viewpoint', price: 21000, hours: 2.0 },
      { name: 'Bukchon Hanok Village Walk', category: 'Culture', price: 0, hours: 2.0 },
      { name: 'Lotte World Theme Park & Aquarium', category: 'Theme Park', price: 59000, hours: 5.0 }
    ]
  },
  'rome': { country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 40, acc_s: 120, acc_l: 320, meal_b: 20, meal_s: 55, meal_l: 150, transit: 7, taxi: 1.8,
    attractions: [
      { name: 'Colosseum & Roman Forum Fast Track', category: 'Ancient Wonder', price: 24, hours: 3.5 },
      { name: 'Vatican Museums & Sistine Chapel', category: 'Art & Religion', price: 29, hours: 4.0 },
      { name: 'Trevi Fountain & Pantheon Historic Walk', category: 'Landmark', price: 5, hours: 2.0 },
      { name: 'Borghese Gallery & Villa Gardens', category: 'Art Gallery', price: 22, hours: 2.5 }
    ]
  },
  'reykjavik': { country: 'Iceland', currency: 'ISK', symbol: 'kr', rate: 0.61, acc_b: 6500, acc_s: 22000, acc_l: 55000, meal_b: 2800, meal_s: 7500, meal_l: 19000, transit: 1200, taxi: 450,
    attractions: [
      { name: 'Blue Lagoon Geothermal Spa Comfort Ticket', category: 'Geothermal Spa', price: 11900, hours: 3.5 },
      { name: 'Golden Circle Express Tour (Geysir & Gullfoss)', category: 'Nature Excursion', price: 9500, hours: 7.0 },
      { name: 'Hallgrimskirkja Church Tower View', category: 'Architecture', price: 1400, hours: 1.0 },
      { name: 'Northern Lights (Aurora Borealis) Chase Boat', category: 'Natural Wonder', price: 13500, hours: 3.0 }
    ]
  },
  'dubai': { country: 'United Arab Emirates', currency: 'AED', symbol: 'AED', rate: 22.8, acc_b: 110, acc_s: 350, acc_l: 1200, meal_b: 45, meal_s: 140, meal_l: 450, transit: 20, taxi: 2.5,
    attractions: [
      { name: 'Burj Khalifa At the Top (Levels 124 & 125)', category: 'Skyscraper Observation', price: 179, hours: 2.0 },
      { name: 'Desert Safari with Dune Bashing & BBQ Dinner', category: 'Adventure & Culture', price: 220, hours: 6.0 },
      { name: 'Museum of the Future Interactive Entry', category: 'Innovation Exhibit', price: 149, hours: 2.5 },
      { name: 'Dubai Aquarium & Underwater Zoo', category: 'Marine Wildlife', price: 150, hours: 2.0 }
    ]
  },
  'singapore': { country: 'Singapore', currency: 'SGD', symbol: 'S$', rate: 62.5, acc_b: 45, acc_s: 160, acc_l: 480, meal_b: 15, meal_s: 50, meal_l: 160, transit: 10, taxi: 1.6,
    attractions: [
      { name: 'Gardens by the Bay (Flower Dome + Supertree Observatory)', category: 'Botanic Wonder', price: 32, hours: 3.0 },
      { name: 'Universal Studios Singapore Full Day Pass', category: 'Theme Park', price: 82, hours: 6.0 },
      { name: 'Marina Bay Sands SkyPark Observation Deck', category: 'Skyline View', price: 30, hours: 1.5 },
      { name: 'Singapore Night Safari Tram & Walking Trail', category: 'Nocturnal Wildlife', price: 55, hours: 3.5 }
    ]
  },
  'ooty': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2500, acc_l: 7500, meal_b: 450, meal_s: 1100, meal_l: 2800, transit: 350, taxi: 20,
    attractions: [
      { name: 'Nilgiri Mountain Railway (Toy Train to Coonoor)', category: 'UNESCO Heritage Train', price: 200, hours: 3.0 },
      { name: 'Ooty Botanical Gardens & Rose Garden', category: 'Botanical Park', price: 50, hours: 2.0 },
      { name: 'Doddabetta Peak & Telescope House', category: 'Mountain Peak', price: 30, hours: 1.5 },
      { name: 'Pykara Lake Boating & Waterfalls', category: 'Lake & Boating', price: 250, hours: 2.5 }
    ]
  },
  'tirupati': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2200, acc_l: 6500, meal_b: 400, meal_s: 950, meal_l: 2200, transit: 350, taxi: 18,
    attractions: [
      { name: 'Sri Venkateswara Swamy Temple (Tirumala)', category: 'Pilgrimage & Sacred Temple', price: 300, hours: 4.5 },
      { name: 'Sri Padmavathi Ammavari Temple (Tiruchanur)', category: 'Heritage Temple', price: 100, hours: 2.0 },
      { name: 'Chandragiri Historic Fort & Raja Mahal', category: 'Historical Fort', price: 50, hours: 2.5 },
      { name: 'Kapila Theertham Waterfalls & Shiva Temple', category: 'Waterfalls & Sacred Shrine', price: 0, hours: 1.5 },
      { name: 'Silathoranam Natural Rock Arch & Chakra Theertham', category: 'Geological Wonder', price: 20, hours: 1.5 },
      { name: 'Sri Govindaraja Swamy Temple', category: 'Historic Vaishnavite Shrine', price: 50, hours: 2.0 },
      { name: 'Talakona Waterfalls Eco-Trek (Sri Venkateswara NP)', category: 'Nature & Trekking', price: 50, hours: 4.0 },
      { name: 'Sri Venkateswara Zoological Park & Safari', category: 'Wildlife Sanctuary', price: 80, hours: 3.0 },
      { name: 'Srikalahasteeswara Temple (Srikalahasti)', category: 'Pancha Bhoota Shiva Temple', price: 200, hours: 3.0 }
    ]
  },
  'varanasi': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 650, acc_s: 2000, acc_l: 6000, meal_b: 350, meal_s: 850, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Kashi Vishwanath Jyotirlinga Temple', category: 'Pilgrimage & Sacred Temple', price: 300, hours: 3.0 },
      { name: 'Dashashwamedh Ghat Evening Ganga Aarti', category: 'Spiritual Ceremony', price: 0, hours: 2.0 },
      { name: 'Sarnath Buddhist Dhamek Stupa & Archaeological Museum', category: 'Buddhist Heritage', price: 25, hours: 3.0 },
      { name: 'Assi Ghat Sunrise Boat Cruise & Subah-e-Banaras', category: 'River Cruise', price: 400, hours: 2.0 },
      { name: 'Manikarnika Ghat Historic Walk', category: 'Cultural Heritage', price: 0, hours: 1.5 }
    ]
  },
  'tirumala': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2200, acc_l: 6500, meal_b: 400, meal_s: 950, meal_l: 2200, transit: 350, taxi: 18,
    attractions: [
      { name: 'Sri Venkateswara Swamy Temple (Tirumala Balaji Main Sanctum)', category: 'Sacred Maha Kshetram', price: 300, hours: 4.5 },
      { name: 'Silathoranam Natural Rock Arch & Chakra Theertham', category: 'Geological Wonder', price: 0, hours: 1.5 },
      { name: 'Papavinasanam Sacred Waterfalls & Reservoir', category: 'Holy Theertham', price: 0, hours: 2.0 },
      { name: 'Srivari Padaalu (Sacred Divine Footprints)', category: 'Holy Footprints', price: 0, hours: 1.5 },
      { name: 'Japali Hanuman Theertham Forest Shrine', category: 'Forest Shrine', price: 0, hours: 2.0 }
    ]
  },
  'arunachalam': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2000, acc_l: 6000, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 280, taxi: 18,
    attractions: [
      { name: 'Sri Arunachaleswarar Temple (Agni Lingam Pancha Bhoota Sthalam)', category: 'Pancha Bhoota Shiva Temple', price: 50, hours: 3.0 },
      { name: 'Girivalam (14 km Holy Mountain Circumambulation Path)', category: 'Spiritual Girivalam', price: 0, hours: 4.5 },
      { name: 'Sri Ramana Maharshi Ashram & Virupaksha Cave', category: 'Spiritual Ashram & Cave', price: 0, hours: 2.0 },
      { name: 'Sri Seshadri Swamigal Ashram & Samadhi', category: 'Spiritual Ashram', price: 0, hours: 1.5 }
    ]
  },
  'tirunelveli': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2000, acc_l: 5800, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 280, taxi: 18,
    attractions: [
      { name: 'Nellaiappar Ancient Temple & Musical Stone Pillars', category: 'Dravidian Temple', price: 20, hours: 2.5 },
      { name: 'Courtallam (Kutralam) Main Waterfalls & Herbal Spa', category: 'Cascading Waterfalls', price: 0, hours: 3.0 },
      { name: 'Manimuthar Dam & Waterfalls Nature Reserve', category: 'Nature & Dam', price: 30, hours: 3.5 },
      { name: 'Iruttu Kadai Halwa Authentic Heritage Stroll', category: 'Culinary Heritage', price: 0, hours: 1.5 }
    ]
  },
  'thanjavur': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 380, meal_s: 900, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Brihadisvara Temple (Great Living Chola Temple - UNESCO)', category: 'UNESCO World Heritage', price: 0, hours: 3.5 },
      { name: 'Thanjavur Maratha Royal Palace & Saraswathi Mahal Library', category: 'Royal Palace & Library', price: 50, hours: 2.5 },
      { name: 'Thanjavur Art Gallery (Chola Bronze Sculptures)', category: 'Bronze Sculpture Art', price: 30, hours: 2.0 },
      { name: 'Schwartz Church & Sivaganga Park', category: 'Historic Church & Garden', price: 10, hours: 1.5 }
    ]
  },
  'araku': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 380, meal_s: 880, meal_l: 2100, transit: 350, taxi: 20,
    attractions: [
      { name: 'Borra Caves Million-Year-Old Limestone Formations', category: 'Limestone Caves', price: 80, hours: 3.0 },
      { name: 'Katiki Waterfalls Trek & Bamboo Chicken Trail', category: 'Waterfalls & Trekking', price: 50, hours: 3.5 },
      { name: 'Araku Tribal Museum & Coffee Plantations', category: 'Tribal Culture & Coffee', price: 40, hours: 2.0 },
      { name: 'Padmapuram Botanical Gardens & Tree Huts', category: 'Botanical Gardens', price: 30, hours: 2.0 },
      { name: 'Chaparai (Dumbriguda) Cascading Rock Waterfalls', category: 'Cascading Waterfalls', price: 20, hours: 2.5 }
    ]
  },
  'warangal': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6200, meal_b: 380, meal_s: 880, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Thousand Pillar Temple (Kakatiya Masterpiece)', category: 'Historic Temple', price: 0, hours: 2.0 },
      { name: 'Warangal Fort & Kakatiya Kala Thoranam', category: 'Historical Fort', price: 25, hours: 2.5 },
      { name: 'Ramappa Temple (Rudreshwara UNESCO World Heritage)', category: 'UNESCO World Heritage', price: 25, hours: 3.0 },
      { name: 'Bhadrakali Temple & Lake Promenade', category: 'Ancient Sacred Temple', price: 0, hours: 2.0 }
    ]
  },
  'nellore': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2000, acc_l: 5800, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 280, taxi: 18,
    attractions: [
      { name: 'Sri Talpagiri Ranganathaswamy Ancient Temple', category: 'Historic Vaishnavite Shrine', price: 0, hours: 2.0 },
      { name: 'Mypadu Beach Golden Sand Coastline', category: 'Coastal Beach', price: 0, hours: 2.5 },
      { name: 'Pulicat Lake & Nelapattu Bird Sanctuary', category: 'Bird Sanctuary', price: 50, hours: 3.5 },
      { name: 'Jonnawada Kamakshi Malleswara Swamy Temple', category: 'Sacred Temple', price: 0, hours: 2.0 }
    ]
  },
  'rajahmundry': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6200, meal_b: 380, meal_s: 880, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Godavari River Pushkar Ghat & Evening Harathi', category: 'Sacred River Ghat', price: 0, hours: 2.0 },
      { name: 'Papikondalu Scenic River Cruise on Godavari', category: 'River Gorge Cruise', price: 950, hours: 6.0 },
      { name: 'ISKCON Sri Gopinath Temple (Rajahmundry)', category: 'Spiritual Temple', price: 0, hours: 1.5 },
      { name: 'Kotilingeswara Temple & Havelock Bridge View', category: 'Riverfront Viewpoint', price: 0, hours: 2.0 }
    ]
  },
  'kanyakumari': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 800, acc_s: 2300, acc_l: 7000, meal_b: 400, meal_s: 900, meal_l: 2200, transit: 300, taxi: 18,
    attractions: [
      { name: 'Vivekananda Rock Memorial & Ferry Ride', category: 'National Monument', price: 50, hours: 2.5 },
      { name: 'Thiruvalluvar Giant Stone Statue', category: 'Monument', price: 20, hours: 1.5 },
      { name: 'Triveni Sangam (Confluence of 3 Oceans) & Sunrise Point', category: 'Sacred Confluence', price: 0, hours: 2.0 },
      { name: 'Kanyakumari Bhagavathi Amman 3000-Yr Temple', category: 'Ancient Sacred Temple', price: 0, hours: 1.5 }
    ]
  },
  'munnar': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2600, acc_l: 8500, meal_b: 420, meal_s: 1050, meal_l: 2600, transit: 350, taxi: 22,
    attractions: [
      { name: 'Eravikulam National Park (Nilgiri Tahr Safari)', category: 'Wildlife Sanctuary', price: 200, hours: 3.5 },
      { name: 'Mattupetty Dam & Speed Boating', category: 'Dam & Boating', price: 100, hours: 2.0 },
      { name: 'Tea Museum & Tata Tea Processing Tour', category: 'Tea Heritage', price: 150, hours: 2.0 },
      { name: 'Top Station Panoramic Western Ghats Viewpoint', category: 'Mountain Viewpoint', price: 25, hours: 2.5 }
    ]
  },
  'coorg': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2600, acc_l: 8500, meal_b: 420, meal_s: 1050, meal_l: 2600, transit: 350, taxi: 22,
    attractions: [
      { name: 'Abbey Waterfalls & Hanging Bridge', category: 'Scenic Waterfalls', price: 20, hours: 2.0 },
      { name: 'Raja\'s Seat Sunset Viewpoint & Musical Fountain', category: 'Sunset Viewpoint', price: 20, hours: 2.0 },
      { name: 'Namdroling Monastery Golden Temple (Bylakuppe)', category: 'Tibetan Monastery', price: 0, hours: 2.5 },
      { name: 'Dubare Elephant Camp River Crossing & Interaction', category: 'Wildlife Camp', price: 100, hours: 3.0 }
    ]
  },
  'wayanad': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 850, acc_s: 2500, acc_l: 8000, meal_b: 400, meal_s: 1000, meal_l: 2500, transit: 350, taxi: 22,
    attractions: [
      { name: 'Banasura Sagar Dam (Largest Earthen Dam in India)', category: 'Earthen Dam & Boating', price: 50, hours: 2.5 },
      { name: 'Edakkal Prehistoric Rock Carving Caves Trek', category: 'Prehistoric Caves', price: 50, hours: 3.0 },
      { name: 'Soochipara (Sentinel Rock) Waterfalls', category: 'Waterfalls & Trek', price: 50, hours: 2.5 },
      { name: 'Pookode Freshwater Lake & Pedal Boating', category: 'Freshwater Lake', price: 30, hours: 2.0 }
    ]
  },
  'shirdi': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 300, taxi: 18,
    attractions: [
      { name: 'Sri Sai Baba Samadhi Mandir & Dwarkamai', category: 'Sacred Samadhi Mandir', price: 0, hours: 3.5 },
      { name: 'Sai Teerth Devotional Theme Park & 5D Show', category: 'Spiritual Theme Park', price: 400, hours: 3.0 },
      { name: 'Gurusthan & Chavadi Sacred Meditation', category: 'Holy Shrine', price: 0, hours: 1.5 },
      { name: 'Shani Shingnapur Sacred Shani Temple', category: 'Sacred Temple', price: 0, hours: 2.5 }
    ]
  },
  'srisailam': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 380, meal_s: 900, meal_l: 2100, transit: 320, taxi: 20,
    attractions: [
      { name: 'Mallikarjuna Swamy Jyotirlinga & Bhramaramba Devi', category: 'Jyotirlinga Maha Kshetram', price: 100, hours: 3.5 },
      { name: 'Srisailam Dam & Ropeway Cable Car to Pathalaganga', category: 'Ropeway & Dam', price: 120, hours: 2.5 },
      { name: 'Akka Mahadevi Natural Caves Boating Safari', category: 'River Boating & Caves', price: 350, hours: 4.0 },
      { name: 'Sakshi Ganapathi Temple & Shikhareswaram View', category: 'Spiritual Viewpoint', price: 0, hours: 2.0 }
    ]
  },
  'srikalahasti': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 700, acc_s: 2000, acc_l: 5800, meal_b: 350, meal_s: 850, meal_l: 2000, transit: 280, taxi: 18,
    attractions: [
      { name: 'Srikalahasteeswara Temple (Vayu Lingam & Rahu Ketu Pooja)', category: 'Pancha Bhoota Vayu Lingam', price: 200, hours: 3.0 },
      { name: 'Bhakta Kannappa Hilltop Shrine & Swarnamukhi River', category: 'Hilltop Shrine', price: 0, hours: 2.0 },
      { name: 'Subrahmanya Swamy Temple & Theertham', category: 'Sacred Temple', price: 0, hours: 1.5 }
    ]
  },
  'kanchipuram': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 380, meal_s: 900, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Sri Kamakshi Amman Temple (Shakti Peetham)', category: 'Shakti Peetham', price: 0, hours: 2.0 },
      { name: 'Ekambareswarar Temple (Prithvi Lingam & 3500-Yr Tree)', category: 'Pancha Bhoota Prithvi Lingam', price: 0, hours: 2.5 },
      { name: 'Kailasanathar Ancient 7th-Century Pallava Stone Temple', category: 'Pallava Architecture', price: 0, hours: 2.0 },
      { name: 'Kanchipuram Silk Weavers Co-operative Guild Trail', category: 'Handloom Silk Heritage', price: 0, hours: 2.0 }
    ]
  },
  'rameshwaram': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 380, meal_s: 900, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Ramanathaswamy Jyotirlinga Temple & 22 Holy Wells', category: 'Char Dham Jyotirlinga', price: 25, hours: 3.5 },
      { name: 'Dhanushkodi Ghost Town & Ram Setu Beach Point', category: 'Historical Coastal Landmark', price: 150, hours: 3.0 },
      { name: 'Dr. A.P.J. Abdul Kalam National Memorial', category: 'National Memorial', price: 0, hours: 1.5 },
      { name: 'Pamban Sea Bridge & Railway Engineering Wonder', category: 'Sea Bridge Landmark', price: 0, hours: 1.5 }
    ]
  },
  'madurai': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2200, acc_l: 6500, meal_b: 380, meal_s: 900, meal_l: 2100, transit: 300, taxi: 18,
    attractions: [
      { name: 'Meenakshi Amman Temple & 1000-Pillar Hall', category: 'Historic Dravidian Wonder', price: 50, hours: 3.5 },
      { name: 'Thirumalai Nayakkar Mahal Palace Light & Sound Show', category: 'Royal Palace', price: 50, hours: 2.0 },
      { name: 'Gandhi Memorial Museum & Heritage Archive', category: 'National Museum', price: 0, hours: 2.0 },
      { name: 'Alagar Kovil Hill Temple & Natural Springs', category: 'Hillside Sacred Temple', price: 0, hours: 2.5 }
    ]
  },
  'sydney': { country: 'Australia', currency: 'AUD', symbol: 'A$', rate: 55.5, acc_b: 50, acc_s: 160, acc_l: 420, meal_b: 22, meal_s: 58, meal_l: 160, transit: 10, taxi: 2.5,
    attractions: [
      { name: 'Sydney Opera House Guided Architectural Tour', category: 'Iconic Architecture', price: 43, hours: 2.0 },
      { name: 'Sydney Harbour Bridge Pylon Lookout & Walk', category: 'Harbour Landmark', price: 24, hours: 2.5 },
      { name: 'Bondi to Coogee Coastal Walk', category: 'Oceanfront Coastal Walk', price: 0, hours: 3.0 },
      { name: 'Taronga Zoo Sydney Ferry & Wildlife Pass', category: 'Harbour Wildlife Zoo', price: 51, hours: 4.0 }
    ]
  },
  'toronto': { country: 'Canada', currency: 'CAD', symbol: 'C$', rate: 61.5, acc_b: 50, acc_s: 150, acc_l: 390, meal_b: 22, meal_s: 55, meal_l: 150, transit: 10, taxi: 2.2,
    attractions: [
      { name: 'CN Tower Main Observation Level & Glass Floor', category: 'Skyline Tower', price: 43, hours: 2.0 },
      { name: 'Ripley\'s Aquarium of Canada Underwater Tunnel', category: 'Marine Aquarium', price: 44, hours: 2.5 },
      { name: 'Royal Ontario Museum (ROM) Art & Nature', category: 'World Museum', price: 26, hours: 3.0 },
      { name: 'Toronto Islands Ferry & Skyline Beach Walk', category: 'Island Park', price: 9, hours: 3.5 }
    ]
  },
  'jaipur': { country: 'India', currency: 'INR', symbol: '₹', rate: 1.0, acc_b: 750, acc_s: 2400, acc_l: 8500, meal_b: 450, meal_s: 1100, meal_l: 2800, transit: 400, taxi: 20,
    attractions: [
      { name: 'Amber Palace & Jaigarh Fort', category: 'Historical Fort', price: 200, hours: 4.0 },
      { name: 'Hawa Mahal (Palace of Winds)', category: 'Iconic Landmark', price: 50, hours: 1.5 },
      { name: 'City Palace & Chandra Mahal Museum', category: 'Royal Palace', price: 300, hours: 2.5 },
      { name: 'Jantar Mantar UNESCO Astronomical Observatory', category: 'Astronomical Heritage', price: 200, hours: 2.0 },
      { name: 'Nahargarh Fort Sunset Viewpoint', category: 'Panoramic Viewpoint', price: 50, hours: 2.0 }
    ]
  },
  'rome': { country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 40, acc_s: 120, acc_l: 320, meal_b: 20, meal_s: 55, meal_l: 150, transit: 7, taxi: 1.8,
    attractions: [
      { name: 'Colosseum & Roman Forum Fast Track', category: 'Ancient Wonder', price: 24, hours: 3.5 },
      { name: 'Vatican Museums & Sistine Chapel', category: 'Art & Religion', price: 29, hours: 4.0 },
      { name: 'Trevi Fountain & Pantheon Historic Walk', category: 'Landmark', price: 5, hours: 2.0 },
      { name: 'Borghese Gallery & Villa Gardens', category: 'Art Gallery', price: 22, hours: 2.5 }
    ]
  },
  'barcelona': { country: 'Spain', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 35, acc_s: 110, acc_l: 290, meal_b: 18, meal_s: 48, meal_l: 135, transit: 6.5, taxi: 1.6,
    attractions: [
      { name: 'Sagrada Família Basilica Tower Access', category: 'Gaudí Architecture', price: 36, hours: 2.5 },
      { name: 'Park Güell Monumental Zone Guided Tour', category: 'Iconic Park', price: 13, hours: 2.0 },
      { name: 'Casa Batlló Immersive 10D Experience', category: 'Modernist Mansion', price: 29, hours: 2.0 },
      { name: 'Gothic Quarter (Barri Gòtic) Walking Trail', category: 'Historic Quarter', price: 0, hours: 2.0 }
    ]
  },
  'amsterdam': { country: 'Netherlands', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 42, acc_s: 130, acc_l: 340, meal_b: 22, meal_s: 58, meal_l: 155, transit: 8.5, taxi: 2.1,
    attractions: [
      { name: 'Rijksmuseum Dutch Masters Guided Entry', category: 'Art & History Museum', price: 25, hours: 3.5 },
      { name: 'Van Gogh Museum Masterpieces Tour', category: 'Art Gallery', price: 22, hours: 2.5 },
      { name: 'Amsterdam UNESCO Canal Ring Boat Cruise', category: 'Scenic Canal Cruise', price: 18, hours: 1.5 },
      { name: 'Anne Frank House Historic Exhibition', category: 'Historic Memorial', price: 16, hours: 2.0 }
    ]
  },
  'venice': { country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 45, acc_s: 140, acc_l: 380, meal_b: 24, meal_s: 62, meal_l: 165, transit: 9.5, taxi: 3.0,
    attractions: [
      { name: 'St. Mark\'s Basilica & Golden Pala d\'Oro', category: 'Byzantine Cathedral', price: 15, hours: 2.0 },
      { name: 'Doge\'s Palace & Bridge of Sighs Access', category: 'Gothic Palace', price: 30, hours: 2.5 },
      { name: 'Grand Canal Traditional Gondola Ride', category: 'Gondola Cruise', price: 35, hours: 1.0 },
      { name: 'Rialto Bridge & Fish Market Stroll', category: 'Historic Bridge', price: 0, hours: 1.5 }
    ]
  },
  'prague': { country: 'Czech Republic', currency: 'CZK', symbol: 'Kč', rate: 3.65, acc_b: 650, acc_s: 1900, acc_l: 5200, meal_b: 280, meal_s: 750, meal_l: 2100, transit: 120, taxi: 30,
    attractions: [
      { name: 'Prague Castle & St. Vitus Cathedral Complex', category: 'Medieval Castle', price: 250, hours: 3.5 },
      { name: 'Charles Bridge Historic Statues Walk', category: 'Historic Bridge', price: 0, hours: 1.5 },
      { name: 'Old Town Astronomical Clock & Hall Tower', category: 'Astronomical Clock', price: 250, hours: 2.0 },
      { name: 'Vltava River Panoramic Sightseeing Cruise', category: 'River Cruise', price: 350, hours: 1.5 }
    ]
  },
  'vienna': { country: 'Austria', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 38, acc_s: 115, acc_l: 310, meal_b: 20, meal_s: 52, meal_l: 140, transit: 8.0, taxi: 1.9,
    attractions: [
      { name: 'Schönbrunn Palace Grand Imperial Tour', category: 'Imperial Palace', price: 26, hours: 3.0 },
      { name: 'St. Stephen\'s Cathedral & South Tower Climb', category: 'Gothic Cathedral', price: 12, hours: 2.0 },
      { name: 'Belvedere Palace (Klimt\'s The Kiss)', category: 'Baroque Palace & Art', price: 18, hours: 2.5 },
      { name: 'Hofburg Imperial Apartments & Sisi Museum', category: 'Habsburg Palace', price: 17, hours: 2.0 }
    ]
  },
  'athens': { country: 'Greece', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 30, acc_s: 90, acc_l: 250, meal_b: 16, meal_s: 42, meal_l: 115, transit: 6.0, taxi: 1.4,
    attractions: [
      { name: 'Acropolis & Parthenon Archaeological Site', category: 'Ancient Wonder', price: 20, hours: 3.0 },
      { name: 'Acropolis Museum Masterpieces Gallery', category: 'Archaeological Museum', price: 15, hours: 2.5 },
      { name: 'Plaka Historic Neighborhood & Anafiotika Walk', category: 'Historic Quarter', price: 0, hours: 2.0 },
      { name: 'Temple of Olympian Zeus & Hadrian\'s Arch', category: 'Ancient Ruins', price: 8, hours: 1.5 }
    ]
  },
  'berlin': { country: 'Germany', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 35, acc_s: 105, acc_l: 280, meal_b: 18, meal_s: 48, meal_l: 130, transit: 7.5, taxi: 2.0,
    attractions: [
      { name: 'Brandenburg Gate & Pariser Platz Stroll', category: 'National Monument', price: 0, hours: 1.5 },
      { name: 'Reichstag Building Glass Dome & Parliament Access', category: 'Historic Parliament', price: 0, hours: 2.0 },
      { name: 'Museum Island (Pergamon & Neues Museum Pass)', category: 'UNESCO Museum Complex', price: 24, hours: 4.0 },
      { name: 'East Side Gallery & Berlin Wall Memorial', category: 'Historical Memorial', price: 0, hours: 2.0 }
    ]
  },
  'florence': { country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 38, acc_s: 115, acc_l: 310, meal_b: 19, meal_s: 50, meal_l: 140, transit: 6.5, taxi: 1.7,
    attractions: [
      { name: 'Uffizi Gallery Renaissance Masterpieces Tour', category: 'World Art Gallery', price: 25, hours: 3.5 },
      { name: 'Florence Duomo & Brunelleschi\'s Dome Climb', category: 'Renaissance Cathedral', price: 20, hours: 2.5 },
      { name: 'Galleria dell\'Accademia (Michelangelo\'s David)', category: 'Sculpture Museum', price: 16, hours: 2.0 },
      { name: 'Ponte Vecchio Medieval Bridge & Piazzale Sunset', category: 'Historic Bridge', price: 0, hours: 2.0 }
    ]
  },
  'budapest': { country: 'Hungary', currency: 'HUF', symbol: 'Ft', rate: 0.23, acc_b: 9500, acc_s: 28000, acc_l: 75000, meal_b: 4500, meal_s: 12000, meal_l: 32000, transit: 1800, taxi: 450,
    attractions: [
      { name: 'Hungarian Parliament Building Guided Interior Tour', category: 'Gothic Revival Parliament', price: 6000, hours: 2.0 },
      { name: 'Széchenyi Thermal Bath Full Day Spa Ticket', category: 'Historic Thermal Bath', price: 10500, hours: 4.0 },
      { name: 'Buda Castle & Fisherman\'s Bastion Panorama', category: 'Medieval Fortress', price: 1200, hours: 3.0 },
      { name: 'Danube Evening Sightseeing Cruise with Welcome Drink', category: 'River Cruise', price: 5500, hours: 1.5 }
    ]
  },
  'lisbon': { country: 'Portugal', currency: 'EUR', symbol: '€', rate: 90.5, acc_b: 30, acc_s: 90, acc_l: 240, meal_b: 15, meal_s: 40, meal_l: 110, transit: 6.0, taxi: 1.4,
    attractions: [
      { name: 'Belém Tower UNESCO Maritime Fortress', category: 'Maritime Monument', price: 8, hours: 2.0 },
      { name: 'Jerónimos Monastery Manueline Masterpiece', category: 'Historic Monastery', price: 12, hours: 2.5 },
      { name: 'Historic Tram 28 Scenic Hills Route', category: 'Heritage Transit', price: 3, hours: 1.5 },
      { name: 'Castelo de São Jorge Panoramic Viewpoint', category: 'Moorish Castle', price: 15, hours: 2.0 }
    ]
  },
  'kyoto': { country: 'Japan', currency: 'JPY', symbol: '¥', rate: 0.56, acc_b: 3500, acc_s: 11000, acc_l: 32000, meal_b: 1500, meal_s: 4500, meal_l: 12000, transit: 700, taxi: 350,
    attractions: [
      { name: 'Fushimi Inari Taisha (10,000 Torii Gates Trail)', category: 'Shinto Shrine', price: 0, hours: 3.0 },
      { name: 'Kinkaku-ji (Golden Pavilion) Zen Temple', category: 'Zen Temple', price: 500, hours: 2.0 },
      { name: 'Arashiyama Bamboo Grove & Tenryu-ji Temple', category: 'Natural Wonder', price: 500, hours: 2.5 },
      { name: 'Gion Historic Geisha District Walking Tour', category: 'Cultural Quarter', price: 0, hours: 2.0 }
    ]
  },
  'hanoi': { country: 'Vietnam', currency: 'VND', symbol: '₫', rate: 0.0034, acc_b: 350000, acc_s: 1100000, acc_l: 3200000, meal_b: 150000, meal_s: 400000, meal_l: 1100000, transit: 80000, taxi: 15000,
    attractions: [
      { name: 'Halong Bay UNESCO World Heritage Day Cruise', category: 'Scenic Limestone Bay', price: 950000, hours: 8.0 },
      { name: 'Hanoi Old Quarter Street Food & Cyclo Tour', category: 'Culinary Walk', price: 250000, hours: 3.0 },
      { name: 'Temple of Literature (First University of Vietnam)', category: 'Confucian Temple', price: 30000, hours: 2.0 },
      { name: 'Ho Chi Minh Mausoleum & One Pillar Pagoda', category: 'National Monument', price: 0, hours: 2.0 }
    ]
  },
  'kuala lumpur': { country: 'Malaysia', currency: 'MYR', symbol: 'RM', rate: 19.5, acc_b: 65, acc_s: 200, acc_l: 600, meal_b: 25, meal_s: 70, meal_l: 200, transit: 15, taxi: 3.0,
    attractions: [
      { name: 'Petronas Twin Towers Skybridge & 86th Floor', category: 'Twin Skyscrapers', price: 80, hours: 2.0 },
      { name: 'Batu Caves Murugan Statue & 272 Rainbow Steps', category: 'Hindu Cave Temple', price: 0, hours: 2.5 },
      { name: 'KL Tower (Menara KL) Sky Deck & Box View', category: 'Observation Tower', price: 60, hours: 1.5 },
      { name: 'Jalan Alor Famous Night Street Food Market', category: 'Food Market', price: 0, hours: 2.0 }
    ]
  },
  'hong kong': { country: 'Hong Kong', currency: 'HKD', symbol: 'HK$', rate: 10.8, acc_b: 280, acc_s: 850, acc_l: 2500, meal_b: 90, meal_s: 260, meal_l: 750, transit: 30, taxi: 9.0,
    attractions: [
      { name: 'Victoria Peak Historic Tram & Sky Terrace 428', category: 'Skyline Tram', price: 99, hours: 2.5 },
      { name: 'Tian Tan (Big Buddha) & Po Lin Monastery Cable Car', category: 'Giant Buddha & Cable Car', price: 235, hours: 4.0 },
      { name: 'Star Ferry Victoria Harbour Sunset Crossing', category: 'Heritage Ferry', price: 5, hours: 1.0 },
      { name: 'Hong Kong Disneyland Resort Day Pass', category: 'Theme Park', price: 639, hours: 6.0 }
    ]
  },
  'taipei': { country: 'Taiwan', currency: 'TWD', symbol: 'NT$', rate: 2.65, acc_b: 850, acc_s: 2600, acc_l: 7500, meal_b: 250, meal_s: 700, meal_l: 2000, transit: 100, taxi: 25,
    attractions: [
      { name: 'Taipei 101 Observatory (89th Floor High-Speed Lift)', category: 'Skyscraper Observatory', price: 600, hours: 2.0 },
      { name: 'National Palace Museum Imperial Treasures', category: 'Imperial Art Museum', price: 350, hours: 3.5 },
      { name: 'Shilin Night Market Michelin Bib Gourmand Trail', category: 'Night Street Food', price: 0, hours: 2.5 },
      { name: 'Jiufen Mountain Old Village & Tea House Excursion', category: 'Heritage Mountain Town', price: 200, hours: 4.0 }
    ]
  },
  'san francisco': { country: 'United States', currency: 'USD', symbol: '$', rate: 84.0, acc_b: 55, acc_s: 180, acc_l: 450, meal_b: 25, meal_s: 68, meal_l: 185, transit: 12, taxi: 3.0,
    attractions: [
      { name: 'Golden Gate Bridge Walk & Vista Point Lookout', category: 'Iconic Bridge', price: 0, hours: 2.5 },
      { name: 'Alcatraz Island Penitentiary Ferry & Audio Tour', category: 'Historic Penitentiary', price: 45, hours: 3.5 },
      { name: 'Fisherman\'s Wharf & Pier 39 Sea Lions', category: 'Harbour Promenade', price: 0, hours: 2.0 },
      { name: 'Historic Cable Car Ride (Powell-Hyde Line)', category: 'Heritage Cable Car', price: 8, hours: 1.0 }
    ]
  },
  'los angeles': { country: 'United States', currency: 'USD', symbol: '$', rate: 84.0, acc_b: 55, acc_s: 175, acc_l: 440, meal_b: 24, meal_s: 65, meal_l: 180, transit: 11, taxi: 2.8,
    attractions: [
      { name: 'Universal Studios Hollywood Theme Park & Studio Tour', category: 'Movie Studio Theme Park', price: 109, hours: 7.0 },
      { name: 'Santa Monica Pier & Venice Beach Boardwalk', category: 'Oceanfront Pier', price: 0, hours: 3.0 },
      { name: 'Griffith Observatory & Hollywood Sign Viewpoint', category: 'Observatory & Landmark', price: 0, hours: 2.5 },
      { name: 'Hollywood Walk of Fame & TCL Chinese Theatre', category: 'Celebrity Walkway', price: 0, hours: 2.0 }
    ]
  },
  'vancouver': { country: 'Canada', currency: 'CAD', symbol: 'C$', rate: 61.5, acc_b: 48, acc_s: 155, acc_l: 395, meal_b: 22, meal_s: 55, meal_l: 150, transit: 10, taxi: 2.3,
    attractions: [
      { name: 'Stanley Park Seawall & Totem Poles Bike Tour', category: 'Urban Forest Park', price: 0, hours: 3.0 },
      { name: 'Capilano Suspension Bridge Park & Treetops', category: 'Suspension Bridge', price: 65, hours: 2.5 },
      { name: 'Granville Island Public Market & Artisan Walk', category: 'Public Market', price: 0, hours: 2.0 },
      { name: 'Grouse Mountain Skyride & Peak Panorama', category: 'Mountain Resort', price: 75, hours: 3.5 }
    ]
  },
  'rio de janeiro': { country: 'Brazil', currency: 'BRL', symbol: 'R$', rate: 15.2, acc_b: 95, acc_s: 300, acc_l: 850, meal_b: 45, meal_s: 120, meal_l: 340, transit: 18, taxi: 4.5,
    attractions: [
      { name: 'Christ the Redeemer & Corcovado Cog Train', category: 'Wonder of the World', price: 110, hours: 3.0 },
      { name: 'Sugarloaf Mountain (Pão de Açúcar) Cable Car', category: 'Cable Car Viewpoint', price: 150, hours: 2.5 },
      { name: 'Copacabana & Ipanema Famous Beach Walk', category: 'World Famous Beach', price: 0, hours: 2.5 },
      { name: 'Selarón Steps (Escadaria Selarón) Lapa Tour', category: 'Ceramic Mosaic Art', price: 0, hours: 1.5 }
    ]
  },
  'cancun': { country: 'Mexico', currency: 'MXN', symbol: '$', rate: 4.3, acc_b: 400, acc_s: 1400, acc_l: 4500, meal_b: 200, meal_s: 550, meal_l: 1600, transit: 60, taxi: 18,
    attractions: [
      { name: 'Chichen Itza UNESCO Mayan Pyramid Guided Tour', category: 'Wonder of the World', price: 614, hours: 5.0 },
      { name: 'Xcaret Eco-Archaeological Theme Park Day Pass', category: 'Eco Theme Park', price: 2100, hours: 7.0 },
      { name: 'Isla Mujeres Catamaran Cruise & Snorkeling', category: 'Catamaran Reef Cruise', price: 1200, hours: 5.0 },
      { name: 'Playa Delfines (El Mirador) Lookout Beach', category: 'Public Beach', price: 0, hours: 2.0 }
    ]
  },
  'cairo': { country: 'Egypt', currency: 'EGP', symbol: 'E£', rate: 1.75, acc_b: 650, acc_s: 2000, acc_l: 6500, meal_b: 250, meal_s: 700, meal_l: 2000, transit: 70, taxi: 15,
    attractions: [
      { name: 'Great Pyramids of Giza & Great Sphinx Entry', category: 'Wonder of Ancient World', price: 540, hours: 4.0 },
      { name: 'The Grand Egyptian Museum (GEM) Antiquities', category: 'World Museum of Antiquities', price: 450, hours: 3.5 },
      { name: 'Khan el-Khalili Historic Medieval Bazaar', category: '14th-Century Souq', price: 0, hours: 2.5 },
      { name: 'Felucca Traditional Sailboat Cruise on the Nile', category: 'Nile Sailing', price: 300, hours: 1.5 }
    ]
  },
  'istanbul': { country: 'Turkey', currency: 'TRY', symbol: '₺', rate: 2.45, acc_b: 600, acc_s: 1800, acc_l: 5500, meal_b: 220, meal_s: 600, meal_l: 1800, transit: 65, taxi: 18,
    attractions: [
      { name: 'Hagia Sophia Grand Mosque Historical Tour', category: 'Byzantine Architectural Wonder', price: 850, hours: 2.5 },
      { name: 'Topkapi Palace & Imperial Harem Access', category: 'Ottoman Imperial Palace', price: 1500, hours: 3.5 },
      { name: 'Bosphorus Sunset Sightseeing Cruise', category: 'Intercontinental Cruise', price: 450, hours: 2.0 },
      { name: 'Grand Bazaar & Spice Market Heritage Walk', category: 'Historic Covered Market', price: 0, hours: 2.5 }
    ]
  },
  'cape town': { country: 'South Africa', currency: 'ZAR', symbol: 'R', rate: 4.8, acc_b: 350, acc_s: 1100, acc_l: 3200, meal_b: 160, meal_s: 420, meal_l: 1200, transit: 50, taxi: 12,
    attractions: [
      { name: 'Table Mountain Aerial Cableway Return Ticket', category: 'Mountain Cableway', price: 420, hours: 3.0 },
      { name: 'Boulders Beach African Penguin Colony', category: 'Wildlife Penguin Sanctuary', price: 190, hours: 2.0 },
      { name: 'Cape of Good Hope & Cape Point Nature Reserve', category: 'Historic Oceanic Cape', price: 376, hours: 4.0 },
      { name: 'V&A Waterfront Promenade & Robben Island Ferry', category: 'Harbour Promenade', price: 0, hours: 2.5 }
    ]
  },
  'marrakech': { country: 'Morocco', currency: 'MAD', symbol: 'DH', rate: 8.5, acc_b: 220, acc_s: 700, acc_l: 2100, meal_b: 95, meal_s: 260, meal_l: 750, transit: 25, taxi: 6.0,
    attractions: [
      { name: 'Jardin Majorelle & Yves Saint Laurent Museum', category: 'Botanical Sanctuary', price: 150, hours: 2.0 },
      { name: 'Bahia Palace 19th-Century Islamic Architecture', category: 'Islamic Royal Palace', price: 70, hours: 2.0 },
      { name: 'Jemaa el-Fnaa Medina Square Street Performance', category: 'UNESCO Cultural Square', price: 0, hours: 2.5 },
      { name: 'Koutoubia Mosque Gardens & Historic Minaret', category: 'Historic Mosque Gardens', price: 0, hours: 1.5 }
    ]
  },
  'melbourne': { country: 'Australia', currency: 'AUD', symbol: 'A$', rate: 55.5, acc_b: 48, acc_s: 150, acc_l: 390, meal_b: 22, meal_s: 55, meal_l: 150, transit: 10, taxi: 2.4,
    attractions: [
      { name: 'Great Ocean Road & 12 Apostles Day Tour', category: 'Scenic Coastal Wonder', price: 145, hours: 8.0 },
      { name: 'Melbourne Skydeck (88th Floor Southern View)', category: 'Skydeck Observatory', price: 38, hours: 2.0 },
      { name: 'Royal Botanic Gardens Victoria Guided Walk', category: 'Botanical Gardens', price: 0, hours: 2.5 },
      { name: 'Hosier Lane Street Art & Laneway Coffee Trail', category: 'Street Art & Laneways', price: 0, hours: 2.0 }
    ]
  },
  'queenstown': { country: 'New Zealand', currency: 'NZD', symbol: 'NZ$', rate: 51.5, acc_b: 52, acc_s: 165, acc_l: 430, meal_b: 24, meal_s: 60, meal_l: 165, transit: 10, taxi: 2.8,
    attractions: [
      { name: 'Milford Sound UNESCO Glacier Fjord Cruise', category: 'Glacier Fjord Cruise', price: 165, hours: 8.0 },
      { name: 'Skyline Queenstown Gondola & Gravity Luge', category: 'Mountain Gondola & Luge', price: 73, hours: 3.0 },
      { name: 'TSS Earnslaw Vintage Steamship Cruise & Farm', category: 'Vintage Steamship Cruise', price: 99, hours: 3.5 },
      { name: 'Queenstown Gardens & Lake Wakatipu Peninsula', category: 'Alpine Lake Peninsula', price: 0, hours: 2.0 }
    ]
  }
};

// Global Country & Currency Registry for Universal AI Search
const WORLD_COUNTRY_LOOKUP = {
  // Europe
  'france': { country: 'France', currency: 'EUR', symbol: '€', rate: 90.5 },
  'italy': { country: 'Italy', currency: 'EUR', symbol: '€', rate: 90.5 },
  'spain': { country: 'Spain', currency: 'EUR', symbol: '€', rate: 90.5 },
  'germany': { country: 'Germany', currency: 'EUR', symbol: '€', rate: 90.5 },
  'united kingdom': { country: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 108.5 },
  'uk': { country: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 108.5 },
  'england': { country: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 108.5 },
  'scotland': { country: 'Scotland', currency: 'GBP', symbol: '£', rate: 108.5 },
  'switzerland': { country: 'Switzerland', currency: 'CHF', symbol: 'CHF', rate: 94.0 },
  'netherlands': { country: 'Netherlands', currency: 'EUR', symbol: '€', rate: 90.5 },
  'austria': { country: 'Austria', currency: 'EUR', symbol: '€', rate: 90.5 },
  'greece': { country: 'Greece', currency: 'EUR', symbol: '€', rate: 90.5 },
  'portugal': { country: 'Portugal', currency: 'EUR', symbol: '€', rate: 90.5 },
  'ireland': { country: 'Ireland', currency: 'EUR', symbol: '€', rate: 90.5 },
  'belgium': { country: 'Belgium', currency: 'EUR', symbol: '€', rate: 90.5 },
  'norway': { country: 'Norway', currency: 'NOK', symbol: 'kr', rate: 7.8 },
  'sweden': { country: 'Sweden', currency: 'SEK', symbol: 'kr', rate: 7.9 },
  'denmark': { country: 'Denmark', currency: 'DKK', symbol: 'kr', rate: 12.1 },
  'finland': { country: 'Finland', currency: 'EUR', symbol: '€', rate: 90.5 },
  'poland': { country: 'Poland', currency: 'PLN', symbol: 'zł', rate: 21.0 },
  'czech': { country: 'Czech Republic', currency: 'CZK', symbol: 'Kč', rate: 3.65 },
  'croatia': { country: 'Croatia', currency: 'EUR', symbol: '€', rate: 90.5 },
  'hungary': { country: 'Hungary', currency: 'HUF', symbol: 'Ft', rate: 0.23 },
  'turkey': { country: 'Turkey', currency: 'TRY', symbol: '₺', rate: 2.45 },
  'iceland': { country: 'Iceland', currency: 'ISK', symbol: 'kr', rate: 0.61 },

  // Americas
  'usa': { country: 'United States', currency: 'USD', symbol: '$', rate: 84.0 },
  'united states': { country: 'United States', currency: 'USD', symbol: '$', rate: 84.0 },
  'america': { country: 'United States', currency: 'USD', symbol: '$', rate: 84.0 },
  'canada': { country: 'Canada', currency: 'CAD', symbol: 'C$', rate: 61.5 },
  'mexico': { country: 'Mexico', currency: 'MXN', symbol: '$', rate: 4.3 },
  'brazil': { country: 'Brazil', currency: 'BRL', symbol: 'R$', rate: 15.2 },
  'argentina': { country: 'Argentina', currency: 'ARS', symbol: '$', rate: 0.086 },
  'peru': { country: 'Peru', currency: 'PEN', symbol: 'S/.', rate: 22.5 },
  'chile': { country: 'Chile', currency: 'CLP', symbol: '$', rate: 0.088 },
  'colombia': { country: 'Colombia', currency: 'COP', symbol: '$', rate: 0.02 },

  // Asia
  'japan': { country: 'Japan', currency: 'JPY', symbol: '¥', rate: 0.56 },
  'korea': { country: 'South Korea', currency: 'KRW', symbol: '₩', rate: 0.062 },
  'south korea': { country: 'South Korea', currency: 'KRW', symbol: '₩', rate: 0.062 },
  'china': { country: 'China', currency: 'CNY', symbol: '¥', rate: 11.6 },
  'thailand': { country: 'Thailand', currency: 'THB', symbol: '฿', rate: 2.3 },
  'vietnam': { country: 'Vietnam', currency: 'VND', symbol: '₫', rate: 0.0034 },
  'indonesia': { country: 'Indonesia', currency: 'IDR', symbol: 'Rp', rate: 0.0054 },
  'malaysia': { country: 'Malaysia', currency: 'MYR', symbol: 'RM', rate: 19.5 },
  'singapore': { country: 'Singapore', currency: 'SGD', symbol: 'S$', rate: 62.5 },
  'philippines': { country: 'Philippines', currency: 'PHP', symbol: '₱', rate: 1.45 },
  'taiwan': { country: 'Taiwan', currency: 'TWD', symbol: 'NT$', rate: 2.65 },
  'hong kong': { country: 'Hong Kong', currency: 'HKD', symbol: 'HK$', rate: 10.8 },
  'nepal': { country: 'Nepal', currency: 'NPR', symbol: 'रु', rate: 0.625 },
  'sri lanka': { country: 'Sri Lanka', currency: 'LKR', symbol: 'Rs', rate: 0.28 },
  'maldives': { country: 'Maldives', currency: 'MVR', symbol: 'Rf', rate: 5.45 },

  // Middle East & Africa
  'uae': { country: 'United Arab Emirates', currency: 'AED', symbol: 'AED', rate: 22.8 },
  'dubai': { country: 'United Arab Emirates', currency: 'AED', symbol: 'AED', rate: 22.8 },
  'abu dhabi': { country: 'United Arab Emirates', currency: 'AED', symbol: 'AED', rate: 22.8 },
  'saudi': { country: 'Saudi Arabia', currency: 'SAR', symbol: 'SR', rate: 22.4 },
  'qatar': { country: 'Qatar', currency: 'QAR', symbol: 'QR', rate: 23.1 },
  'egypt': { country: 'Egypt', currency: 'EGP', symbol: 'E£', rate: 1.75 },
  'south africa': { country: 'South Africa', currency: 'ZAR', symbol: 'R', rate: 4.8 },
  'morocco': { country: 'Morocco', currency: 'MAD', symbol: 'DH', rate: 8.5 },
  'kenya': { country: 'Kenya', currency: 'KES', symbol: 'KSh', rate: 0.65 },
  'jordan': { country: 'Jordan', currency: 'JOD', symbol: 'JD', rate: 118.5 },

  // Oceania
  'australia': { country: 'Australia', currency: 'AUD', symbol: 'A$', rate: 55.5 },
  'new zealand': { country: 'New Zealand', currency: 'NZD', symbol: 'NZ$', rate: 51.5 },
  'fiji': { country: 'Fiji', currency: 'FJD', symbol: 'FJ$', rate: 37.0 }
};

// Shared shape for the verified cost-summary endpoint and read-only AI previews.
// This is deliberately in-memory: preview requests must never persist destinations or prices.
function buildCostSummary({ destination_id = null, city_name, country_name, currency_code, currency_symbol, cost_index, is_preview = false }) {
  const rate = Number(cost_index.exchange_rate_to_inr || 1);
  const dailyTotals = {
    budget: Math.round((Number(cost_index.accommodation_budget_night) + Number(cost_index.meal_budget_day) + Number(cost_index.transit_pass_day)) * rate),
    standard: Math.round((Number(cost_index.accommodation_standard_night) + Number(cost_index.meal_standard_day) + Number(cost_index.transit_pass_day)) * rate),
    luxury: Math.round((Number(cost_index.accommodation_luxury_night) + Number(cost_index.meal_luxury_day) + Number(cost_index.transit_pass_day)) * rate)
  };
  const durations = [
    ['daily', '1 Day', 1], ['weekend', 'Weekend (3 Days)', 3], ['week', '1 Week (7 Days)', 7],
    ['fortnight', '2 Weeks (14 Days)', 14], ['month', '1 Month Living (30 Days)', 30]
  ];
  const estimated_budgets = Object.fromEntries(durations.map(([key, label, days]) => [key, {
    label, days,
    budget_inr: Math.round(dailyTotals.budget * days * 1.10),
    standard_inr: Math.round(dailyTotals.standard * days * 1.10),
    luxury_inr: Math.round(dailyTotals.luxury * days * 1.10),
    budget_local: Math.round((dailyTotals.budget * days * 1.10) / rate),
    standard_local: Math.round((dailyTotals.standard * days * 1.10) / rate),
    luxury_local: Math.round((dailyTotals.luxury * days * 1.10) / rate)
  }]));
  const score = Math.min(100, Math.max(15, Math.round((dailyTotals.standard / 22000) * 100)));
  const cost_tier = score >= 80 ? 'VERY_EXPENSIVE' : score >= 55 ? 'EXPENSIVE' : score >= 35 ? 'MODERATE' : 'BUDGET_FRIENDLY';
  const tier_label = cost_tier === 'VERY_EXPENSIVE' ? 'Very High Cost (Premium Living)' : cost_tier === 'EXPENSIVE' ? 'High Cost (Developed Metropolis)' : cost_tier === 'MODERATE' ? 'Moderate Living Cost (Balanced)' : 'Highly Affordable (Budget Friendly)';
  return {
    destination_id, city_name, country_name, currency_code, currency_symbol, exchange_rate_to_inr: rate,
    cost_index_score: score, cost_tier, tier_label, daily_totals_inr: dailyTotals, estimated_budgets,
    monthly_living: {
      solo_monthly_inr: Math.round(dailyTotals.standard * 30 * 0.85),
      couple_monthly_inr: Math.round(dailyTotals.standard * 30 * 1.45),
      family4_monthly_inr: Math.round(dailyTotals.standard * 30 * 2.50),
      currency: currency_code, currency_symbol, rate_to_inr: rate
    },
    source: cost_index.source, confidence_score: cost_index.confidence_score, last_synced_at: cost_index.last_synced_at,
    is_preview, unverified: is_preview
  };
}

// External discovery is intentionally separate from the analyzer and all budget/trip paths.
// It returns transient geographic names only; it never creates or modifies database records.
app.post('/api/destinations/discover', authenticateToken, async (req, res) => {
  const rawQuery = req.body?.query;
  if (typeof rawQuery !== 'string' || rawQuery.trim().length < 2 || rawQuery.trim().length > 160) {
    return res.status(400).json({ error: 'Please provide a destination search between 2 and 160 characters.' });
  }
  try {
    const discovery = await discoverDestinations({ query: rawQuery });
    return res.json(discovery);
  } catch (err) {
    // Keep discovery non-authoritative and fail closed without leaking provider details.
    console.warn('External destination discovery unavailable:', err.message);
    return res.json({ results: [], provider_status: 'unavailable', transformer_used: false });
  }
});

// Endpoint: AI Cost of Living Search & Analyzer
app.post('/api/ai/analyze-destination', authenticateToken, async (req, res) => {
  try {
    const rawQuery = req.body.destination_query || req.body.city || req.body.query || '';
    const destination_query = typeof rawQuery === 'string' ? rawQuery.trim() : String(rawQuery).trim();
    const { refresh } = req.body;
    if (!destination_query || destination_query.length < 2) {
      return res.status(400).json({ error: 'Please enter a valid destination city or region name' });
    }

    // Sanitize query: strip trailing punctuation/quotes/apostrophes
    const rawClean = destination_query.replace(/['"\.,;!\?]+$/g, '').trim();
    let queryClean = rawClean.toLowerCase();

    // Comprehensive phonetic & spelling aliases
    const SPELLING_MAP = {
      'aaraku': 'araku',
      'araku valley': 'araku',
      'thiruvanveli': 'tirunelveli',
      'thanjavore': 'thanjavur',
      'tanjore': 'thanjavur',
      'tiruvannamalai': 'arunachalam',
      'vizag': 'visakhapatnam',
      'kanchi': 'kanchipuram',
      'conjeevaram': 'kanchipuram',
      'trichy': 'tiruchirappalli',
      'tiruchi': 'tiruchirappalli',
      'rameswaram': 'rameshwaram',
      'bengaluru': 'bangalore',
      'madras': 'chennai',
      'cochin': 'kochi',
      'mysuru': 'mysore',
      'puducherry': 'pondicherry',
      'bombay': 'mumbai',
      'calcutta': 'kolkata',
      'banaras': 'varanasi',
      'kashi': 'varanasi',
      'nyc': 'new york',
      'syd': 'sydney',
      'sf': 'san francisco',
      'la': 'los angeles'
    };

    if (SPELLING_MAP[queryClean]) {
      queryClean = SPELLING_MAP[queryClean];
    }

    // Check existing destination in database first
    const existing = await prisma.destination.findFirst({
      where: {
        OR: [
          { city_name: { equals: rawClean, mode: 'insensitive' } },
          { city_name: { equals: queryClean, mode: 'insensitive' } },
          { city_name: { contains: queryClean, mode: 'insensitive' } }
        ]
      },
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } }
      }
    });

    if (existing && !refresh && existing.cost_index && existing.attractions && existing.attractions.length > 0) {
      return res.json({
        cached: true,
        source: existing.cost_index.source,
        last_synced_at: existing.cost_index.last_synced_at,
        destination: existing
      });
    }

    // Capitalize city name
    const formattedCity = rawClean.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    let data;

    // 1. Try Live Generative AI via Google Gemini if API Key is configured
    const geminiData = await analyzeDestinationViaGemini(formattedCity);
    if (geminiData) {
      data = {
        country: geminiData.country || 'International',
        currency: geminiData.currency || 'USD',
        symbol: geminiData.symbol || '¤',
        rate: Number(geminiData.exchange_rate_to_inr) || 1.0,
        acc_b: Number(geminiData.daily_accommodation_budget) || 1200,
        acc_s: Number(geminiData.daily_accommodation_standard) || 3000,
        acc_l: Number(geminiData.daily_accommodation_luxury) || 8500,
        meal_b: Number(geminiData.daily_food_budget) || 500,
        meal_s: Number(geminiData.daily_food_standard) || 1200,
        meal_l: Number(geminiData.daily_food_luxury) || 3200,
        transit: Number(geminiData.daily_transit_public) || 350,
        taxi: Number(geminiData.daily_taxi_per_km) || 25,
        source: 'GOOGLE_GEMINI_LIVE_AI',
        description: geminiData.overview || `Live AI research for ${formattedCity}, ${geminiData.country}.`,
        attractions: Array.isArray(geminiData.attractions) ? geminiData.attractions.map(a => ({
          name: a.name,
          category: a.category || 'Tourist Landmark',
          price: Number(a.ticket_price_local) || 0,
          hours: Number(a.avg_duration_hours) || 2.0
        })) : []
      };
    } else {
      // 2. Match local curated benchmarks
      let benchmarkKey = Object.keys(GLOBAL_COST_BENCHMARKS).find(k => queryClean.includes(k) || k.includes(queryClean));

      if (benchmarkKey) {
        data = { ...GLOBAL_COST_BENCHMARKS[benchmarkKey], source: 'CURATED_BENCHMARK' };
      } else {
        // 3. Dynamic AI Synthesis with Country Knowledge Lookup
        let matchedCountryKey = Object.keys(WORLD_COUNTRY_LOOKUP).find(k => queryClean.includes(k) || k.includes(queryClean));

        if (matchedCountryKey) {
          const cInfo = WORLD_COUNTRY_LOOKUP[matchedCountryKey];
          data = {
            country: cInfo.country,
            currency: cInfo.currency,
            symbol: cInfo.symbol,
            rate: cInfo.rate,
            acc_b: Math.round(3500 / cInfo.rate),
            acc_s: Math.round(10000 / cInfo.rate),
            acc_l: Math.round(28000 / cInfo.rate),
            meal_b: Math.round(1600 / cInfo.rate),
            meal_s: Math.round(4500 / cInfo.rate),
            meal_l: Math.round(12000 / cInfo.rate),
            transit: Math.round(650 / cInfo.rate),
            taxi: Math.round(160 / cInfo.rate),
            source: 'COUNTRY_HEURISTIC_MODEL',
            attractions: [
              { name: `${formattedCity} National Heritage & Cultural Landmark`, category: 'Historic Landmark', price: Math.round(1200 / cInfo.rate), hours: 2.5 },
              { name: `${formattedCity} Royal Palace & Historical Museum`, category: 'Palace Museum', price: Math.round(1600 / cInfo.rate), hours: 3.0 },
              { name: `${formattedCity} Scenic Waterfront / Mountain Viewpoint`, category: 'Scenic Nature', price: Math.round(800 / cInfo.rate), hours: 2.0 },
              { name: `${formattedCity} Traditional Old Town & Cultural Market Walk`, category: 'Cultural Quarter', price: 0, hours: 2.5 }
            ]
          };
        } else {
          // Check if query is Indian or default
          const indianPatterns = [
            'india', 'andhra', 'telangana', 'karnataka', 'tamil', 'kerala', 'maharashtra', 'gujarat',
            'rajasthan', 'punjab', 'bengal', 'odisha', 'bihar', 'up', 'uttar', 'madhya', 'himachal',
            'kashmir', 'patna', 'indore', 'bhubaneswar', 'madurai', 'trivandrum', 'thiruvananthapuram',
            'calicut', 'kozhikode', 'mangalore', 'mangaluru', 'mysore', 'pune', 'nagpur', 'surat',
            'vadodara', 'ahmedabad', 'ranchi', 'guwahati', 'shillong', 'gangtok', 'darjeeling',
            'jodhpur', 'jaisalmer', 'bikaner', 'pushkar', 'ajmer', 'mathura', 'vrindavan', 'haridwar',
            'dehradun', 'nainital', 'mussoorie', 'kullu', 'dharamshala', 'dalhousie', 'hampi',
            'puri', 'ongole', 'guntur', 'chittoor', 'kadapa', 'kurnool', 'tirupati', 'tirumala'
          ];
          const isDomestic = indianPatterns.some(p => queryClean.includes(p)) ||
            queryClean.endsWith('am') || queryClean.endsWith('puram') || queryClean.endsWith('palli') || queryClean.endsWith('pet') || queryClean.endsWith('konda');

          if (isDomestic) {
            data = {
              country: 'India', currency: 'INR', symbol: '₹', rate: 1.0,
              acc_b: 750, acc_s: 2200, acc_l: 6800, meal_b: 380, meal_s: 900, meal_l: 2200, transit: 300, taxi: 18,
              source: 'DOMESTIC_HEURISTIC_MODEL',
              attractions: [
                { name: `${formattedCity} Ancient Sacred Temple & Sanctum Darshan`, category: 'Spiritual Shrine', price: 50, hours: 2.5 },
                { name: `${formattedCity} Historical Heritage Fort & Royal Citadel`, category: 'Heritage Fort', price: 25, hours: 2.5 },
                { name: `${formattedCity} Scenic Hills & Waterfalls Viewpoint`, category: 'Scenic Nature', price: 20, hours: 2.0 },
                { name: `${formattedCity} Traditional Heritage Bazaar & Cultural Food Trail`, category: 'Cultural Market', price: 0, hours: 2.0 }
              ]
            };
          } else {
            // General International Destination Model
            data = {
              country: 'International', currency: 'USD', symbol: '$', rate: 84.0,
              acc_b: 40, acc_s: 130, acc_l: 350, meal_b: 20, meal_s: 52, meal_l: 140, transit: 9.0, taxi: 2.2,
              source: 'INTERNATIONAL_HEURISTIC_MODEL',
              attractions: [
                { name: `${formattedCity} Historic Old Town & City Landmark`, category: 'City Landmark', price: 0, hours: 2.0 },
                { name: `${formattedCity} National Museum & Art Gallery Pass`, category: 'Museum', price: 22, hours: 3.0 },
                { name: `${formattedCity} Panoramic Observation Deck & Skyline View`, category: 'Observation Deck', price: 28, hours: 2.0 },
                { name: `${formattedCity} Waterfront Harbour & Botanical Promenade`, category: 'Nature Promenade', price: 0, hours: 2.0 }
              ]
            };
          }
        }
      }
    }

    // Uncataloged destination: Return in-memory read-only preview without mutating the database
    const previewDestination = {
      destination_id: null,
      city_name: formattedCity,
      country_name: data.country,
      currency_code: data.currency,
      currency_symbol: data.symbol,
      description: data.description || `Estimated AI travel profile for ${formattedCity}, ${data.country}. Note: This destination is not cataloged in our verified database. All figures are AI/heuristic estimates for planning reference.`,
      image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
      is_preview: true,
      verified: false,
      cost_index: {
        destination_id: null,
        accommodation_budget_night: data.acc_b,
        accommodation_standard_night: data.acc_s,
        accommodation_luxury_night: data.acc_l,
        meal_budget_day: data.meal_b,
        meal_standard_day: data.meal_s,
        meal_luxury_day: data.meal_l,
        transit_pass_day: data.transit,
        taxi_per_km: data.taxi,
        exchange_rate_to_inr: data.rate,
        source: data.source || 'AI_ESTIMATE',
        confidence_score: 0.70,
        last_synced_at: new Date()
      },
      attractions: (data.attractions || []).map((attr, idx) => ({
        attraction_id: `est_${idx + 1}`,
        destination_id: null,
        name: attr.name,
        category: attr.category,
        ticket_price_local: attr.price,
        ticket_price_inr: Math.round(attr.price * data.rate),
        avg_duration_hours: attr.hours,
        recommended_style: 'ALL',
        is_estimate: true
      }))
    };

    res.json({
      cached: false,
      verified: false,
      is_preview: true,
      source: data.source || 'AI_ESTIMATE',
      last_synced_at: new Date(),
      destination: previewDestination,
      cost_summary: buildCostSummary({
        city_name: previewDestination.city_name,
        country_name: previewDestination.country_name,
        currency_code: previewDestination.currency_code,
        currency_symbol: previewDestination.currency_symbol,
        cost_index: previewDestination.cost_index,
        is_preview: true
      }),
      note: 'Uncataloged destination. Displaying unverified AI travel estimates for reference.'
    });
  } catch (err) {
    console.error('AI Destination Analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze destination cost of living' });
  }
});

// Endpoint: AI Traveler Copilot Chatbot (Gemini Generative + PostgreSQL Context + Smart Heuristic Fallback)
app.post('/api/ai/traveler-chatbot', authenticateToken, async (req, res) => {
  try {
    const { message, history = [], destination_id } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Please enter a travel message or question.' });
    }

    const cleanMsg = message.trim();
    const lowerMsg = cleanMsg.toLowerCase();

    // 1. Identify destination context: User's explicit message takes PRIORITY over selected destination
    let destContext = null;
    const allDests = await prisma.destination.findMany({
      select: { destination_id: true, city_name: true, country_name: true }
    });

    // Match message against destinations in database (check longer names first)
    const sortedDests = [...allDests].sort((a, b) => b.city_name.length - a.city_name.length);
    const matchedInMsg = sortedDests.find(d => {
      const reg = new RegExp(`\\b${d.city_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return reg.test(cleanMsg);
    });

    if (matchedInMsg) {
      destContext = await prisma.destination.findUnique({
        where: { destination_id: matchedInMsg.destination_id },
        include: {
          cost_index: true,
          attractions: { orderBy: { ticket_price_inr: 'asc' } }
        }
      });
    } else {
      // If user did not name a destination, use destination_id ONLY if message is context-dependent
      const isContextDependent = /\b(here|this city|this place|the city|current destination|local|hotel|hotels|stay|food|meal|transit|attraction|attractions|things to do|itinerary for this|day \d)\b/i.test(cleanMsg);
      if (isContextDependent && destination_id) {
        destContext = await prisma.destination.findUnique({
          where: { destination_id: parseInt(destination_id) },
          include: {
            cost_index: true,
            attractions: { orderBy: { ticket_price_inr: 'asc' } }
          }
        });
      }
    }

    // 2. Check if Google Gemini is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 10 && apiKey !== 'YOUR_GEMINI_API_KEY') {
      try {
        const destSummary = destContext ? `
Verified Destination Grounding Data from 3NF PostgreSQL Database:
- City: ${destContext.city_name}, Country: ${destContext.country_name}
- Local Currency: ${destContext.currency_code} (${destContext.currency_symbol}), Exchange Rate: 1 ${destContext.currency_code} = ₹${destContext.cost_index?.exchange_rate_to_inr || 1} INR
- Daily Accommodation (INR): Budget ₹${Math.round(destContext.cost_index?.accommodation_budget_night * destContext.cost_index?.exchange_rate_to_inr)}, Standard ₹${Math.round(destContext.cost_index?.accommodation_standard_night * destContext.cost_index?.exchange_rate_to_inr)}, Luxury ₹${Math.round(destContext.cost_index?.accommodation_luxury_night * destContext.cost_index?.exchange_rate_to_inr)}
- Daily Meals (INR): Budget ₹${Math.round(destContext.cost_index?.meal_budget_day * destContext.cost_index?.exchange_rate_to_inr)}, Standard ₹${Math.round(destContext.cost_index?.meal_standard_day * destContext.cost_index?.exchange_rate_to_inr)}, Luxury ₹${Math.round(destContext.cost_index?.meal_luxury_day * destContext.cost_index?.exchange_rate_to_inr)}
- Transit Pass: ₹${Math.round(destContext.cost_index?.transit_pass_day * destContext.cost_index?.exchange_rate_to_inr)}/day, Taxi: ₹${Math.round(destContext.cost_index?.taxi_per_km * destContext.cost_index?.exchange_rate_to_inr)}/km
- Verified Tourist Landmarks in DB:
${(destContext.attractions || []).slice(0, 10).map(a => `  * ${a.name} [${a.category}] - Ticket: ₹${a.ticket_price_inr} (${a.ticket_price_local} ${destContext.currency_code}) - Duration: ${a.avg_duration_hours} hrs`).join('\n')}
` : 'No specific active database destination attached. Assist with any worldwide destination requested.';

        const systemPrompt = `You are "WanderBot", the friendly, expert AI Traveler Copilot for WanderBudget AI.
You help travelers with worldwide travel planning, budget estimates, personalized itineraries, destination comparisons, and smart travel budgeting across any city or country globally.

${destSummary}

Instructions & Guidelines:
- Support questions about destinations worldwide (cities, countries, attractions, transit, accommodation, itineraries, weather, and budgeting).
- The user's explicit question and destination intent take highest priority. If the user asks about a different city or general travel, answer their query directly and do not restrict your answer to the reference destination.
- Clearly distinguish between verified database data and AI-generated estimates. Do not claim that AI-generated prices, real-time availability, or live weather are verified real-time records unless they are from the verified database grounding.
- If data for an uncataloged city is estimated, transparently note that it is an estimate.
- Use clean, structured Markdown with emojis, bold headers, bullet points, and specific numbers in INR and local currencies.
- Keep responses engaging, informative, and concise (under 250 words unless a comprehensive itinerary is requested).`;

        const geminiHistory = (history || []).slice(-6).map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }]
        }));

        geminiHistory.push({
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${cleanMsg}` }]
        });

        const chatEndpoints = [
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey.trim()}`,
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey.trim()}`,
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`
        ];

        let replyText = null;
        for (const endpointUrl of chatEndpoints) {
          try {
            const geminiRes = await fetch(endpointUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: geminiHistory,
                generationConfig: { temperature: 0.3 }
              }),
              signal: AbortSignal.timeout(8000)
            });

            if (geminiRes.ok) {
              const gData = await geminiRes.json();
              const candidate = gData.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidate && candidate.trim().length > 10) {
                replyText = candidate.trim();
                break;
              }
            }
          } catch (endpointErr) {
            // try next endpoint
          }
        }

        if (replyText) {
          return res.json({
            reply: replyText,
            engine: 'GOOGLE_GEMINI_3_5_FLASH_LITE',
            detected_destination: destContext ? {
              destination_id: destContext.destination_id,
              city_name: destContext.city_name,
              country_name: destContext.country_name
            } : null,
            suggested_prompts: destContext ? [
              `What is a 5-day budget for ${destContext.city_name}?`,
              `Top free attractions in ${destContext.city_name}?`,
              `How does ${destContext.city_name} compare to Paris?`
            ] : [
              "What is the budget for 5 days in Paris?",
              "Compare Tokyo vs Zurich daily costs",
              "Give me budget tips for Bali"
            ]
          });
        }
      } catch (gemErr) {
        console.warn('[Chatbot] Gemini call failed, falling back to smart heuristic:', gemErr.message);
      }
    }

    // 3. Smart Domain-Aware Heuristic Travel Brain (100% Reliable & Worldwide Capable)
    let reply = '';
    let suggestedPrompts = [];

    // Case A: Comparison Query (e.g. "Paris vs Rome", "Tokyo vs Zurich")
    if (lowerMsg.includes(' vs ') || lowerMsg.includes('versus') || lowerMsg.includes('compare')) {
      const parts = cleanMsg.split(/ vs | versus | compare /i);
      const city1Query = (parts[0] || '').replace(/compare/i, '').trim();
      const city2Query = (parts[1] || '').trim();

      const [c1, c2] = await Promise.all([
        prisma.destination.findFirst({
          where: { city_name: { contains: city1Query, mode: 'insensitive' } },
          include: { cost_index: true }
        }),
        prisma.destination.findFirst({
          where: { city_name: { contains: city2Query, mode: 'insensitive' } },
          include: { cost_index: true }
        })
      ]);

      if (c1 && c2 && c1.cost_index && c2.cost_index) {
        const rate1 = Number(c1.cost_index.exchange_rate_to_inr) || 1.0;
        const rate2 = Number(c2.cost_index.exchange_rate_to_inr) || 1.0;
        const daily1 = Math.round((Number(c1.cost_index.accommodation_standard_night) + Number(c1.cost_index.meal_standard_day) + Number(c1.cost_index.transit_pass_day)) * rate1);
        const daily2 = Math.round((Number(c2.cost_index.accommodation_standard_night) + Number(c2.cost_index.meal_standard_day) + Number(c2.cost_index.transit_pass_day)) * rate2);
        const cheaper = daily1 < daily2 ? c1.city_name : c2.city_name;
        const diffPercent = Math.abs(Math.round(((daily1 - daily2) / Math.max(daily1, daily2)) * 100));

        reply = `### ⚖️ Cost Comparison: **${c1.city_name}** vs **${c2.city_name}**
*(Verified PostgreSQL Database Figures)*

| Metric | **${c1.city_name}** (${c1.country_name}) | **${c2.city_name}** (${c2.country_name}) |
| :--- | :--- | :--- |
| **Currency** | ${c1.currency_code} (1 = ₹${rate1.toFixed(2)}) | ${c2.currency_code} (1 = ₹${rate2.toFixed(2)}) |
| **Standard Hotel/Night** | ₹${Math.round(Number(c1.cost_index.accommodation_standard_night) * rate1).toLocaleString('en-IN')} | ₹${Math.round(Number(c2.cost_index.accommodation_standard_night) * rate2).toLocaleString('en-IN')} |
| **Daily Meals (3x)** | ₹${Math.round(Number(c1.cost_index.meal_standard_day) * rate1).toLocaleString('en-IN')} | ₹${Math.round(Number(c2.cost_index.meal_standard_day) * rate2).toLocaleString('en-IN')} |
| **Daily Burn Rate** | **₹${daily1.toLocaleString('en-IN')} / day** | **₹${daily2.toLocaleString('en-IN')} / day** |

💡 **Economist Verdict:** **${cheaper}** is approximately **${diffPercent}% more economical** for a standard mid-range traveler!`;
        suggestedPrompts = [
          `What are the best attractions in ${c1.city_name}?`,
          `What are the best attractions in ${c2.city_name}?`,
          `Calculate 5-day budget for ${cheaper}`
        ];
      } else {
        reply = `### ⚖️ Destination Cost Comparison
To provide a precise cost comparison, you can compare any of our cataloged destinations (such as Paris, Tokyo, Zurich, Rome, London, New York, Bali, or Tirupati).
* Mention the two cities explicitly (e.g., *"Compare Paris vs Tokyo"* or *"London vs Rome"*).
* Our database will contrast standard accommodation, meals, transit, and daily burn rates in INR.`;
        suggestedPrompts = [
          "Compare Tokyo vs Paris daily costs",
          "Compare London vs Rome daily costs",
          "Compare Zurich vs Vienna daily costs"
        ];
      }
    }

    // Case B: Budget for N days (e.g., "5 days in Paris", "3 day budget", "cost for a week")
    if (!reply && (lowerMsg.includes('day') || lowerMsg.includes('week') || lowerMsg.includes('budget') || lowerMsg.includes('cost'))) {
      const targetDest = destContext;

      if (targetDest && targetDest.cost_index) {
        // Parse days if specified
        const dayMatch = lowerMsg.match(/(\d+)\s*day/i) || lowerMsg.match(/for\s*(\d+)/i);
        const days = dayMatch ? Math.min(30, Math.max(1, parseInt(dayMatch[1]))) : 5;
        const rate = Number(targetDest.cost_index.exchange_rate_to_inr) || 1.0;

        const bAcc = Math.round(Number(targetDest.cost_index.accommodation_budget_night) * rate);
        const bMeal = Math.round(Number(targetDest.cost_index.meal_budget_day) * rate);
        const bTransit = Math.round(Number(targetDest.cost_index.transit_pass_day) * rate);
        const totalBudgetTier = (bAcc + bMeal + bTransit) * days;

        const sAcc = Math.round(Number(targetDest.cost_index.accommodation_standard_night) * rate);
        const sMeal = Math.round(Number(targetDest.cost_index.meal_standard_day) * rate);
        const sTransit = Math.round(Number(targetDest.cost_index.transit_pass_day) * rate);
        const totalStandardTier = (sAcc + sMeal + sTransit) * days;

        const lAcc = Math.round(Number(targetDest.cost_index.accommodation_luxury_night) * rate);
        const lMeal = Math.round(Number(targetDest.cost_index.meal_luxury_day) * rate);
        const lTransit = Math.round((Number(targetDest.cost_index.transit_pass_day) + Number(targetDest.cost_index.taxi_per_km) * 20) * rate);
        const totalLuxuryTier = (lAcc + lMeal + lTransit) * days;

        reply = `### 💰 Estimated **${days}-Day Budget** for **${targetDest.city_name}, ${targetDest.country_name}**
*(Local currency: ${targetDest.currency_code} • Live FX: 1 = ₹${rate} INR • Database Grounded)*

* **🎒 Backpacker / Budget Tier:** **₹${totalBudgetTier.toLocaleString('en-IN')} INR** *(~₹${(totalBudgetTier/days).toFixed(0)}/day)*
  * Stay: ₹${bAcc}/night in clean hostels / budget stays
  * Food: ₹${bMeal}/day for local street food & casual eateries
  * Transit: ₹${bTransit}/day public bus / metro

* **🌟 Comfort / Standard Tier (Recommended):** **₹${totalStandardTier.toLocaleString('en-IN')} INR** *(~₹${(totalStandardTier/days).toFixed(0)}/day)*
  * Stay: ₹${sAcc}/night in 3-star AC hotel
  * Food: ₹${sMeal}/day for standard sit-down restaurants
  * Transit: ₹${sTransit}/day app cabs & city transit

* **👑 Luxury / VIP Tier:** **₹${totalLuxuryTier.toLocaleString('en-IN')} INR** *(~₹${(totalLuxuryTier/days).toFixed(0)}/day)*
  * Stay: ₹${lAcc}/night in 5-star resort / luxury suite
  * Food: ₹${lMeal}/day fine dining & curated banquets
  * Transit: ₹${lTransit}/day dedicated chauffeur car rental

🎯 **Next Step:** You can load this destination into **Tab 2 (Trip Budget Builder)** to include specific sightseeing attractions!`;

        suggestedPrompts = [
          `Show me top attractions in ${targetDest.city_name}`,
          `Which places are free in ${targetDest.city_name}?`,
          `Compare ${targetDest.city_name} vs Paris`
        ];
      } else {
        reply = `### 💰 Worldwide Travel Budgeting Framework
When planning trips worldwide, expenses generally distribute across five core categories:
* **🏨 Accommodation (40%):** Hostels & budget rooms (₹1,000–₹3,500/night), 3-star standard hotels (₹3,500–₹9,000/night), Luxury resorts (₹12,000+/night).
* **🍽️ Food & Dining (25%):** Local markets and street cuisine (₹500–₹1,500/day), Mid-range restaurants (₹1,500–₹4,000/day).
* **🚇 Local Transit (15%):** City metro passes, commuter buses, or rideshares.
* **🎟️ Attractions & Experiences (10%):** Museum tickets, heritage monuments, and tours.
* **🛡️ Contingency Reserve (10%):** Unplanned fees, tips, and travel buffer.

💡 **Tip:** Mention any destination in your prompt (e.g., *"What is the budget for 5 days in Paris?"* or *"Tokyo cost breakdown"*) and I'll compute a destination-specific estimate!`;
        suggestedPrompts = [
          "What is the budget for 5 days in Paris?",
          "What is the 4-day budget for Tokyo?",
          "What are budget travel tips for Bali?",
          "Compare London vs Rome daily costs"
        ];
      }
    }

    // Case C: Attractions & Things to do query
    if (!reply && (lowerMsg.includes('attraction') || lowerMsg.includes('places') || lowerMsg.includes('visit') || lowerMsg.includes('see') || lowerMsg.includes('things to do') || lowerMsg.includes('free'))) {
      const targetDest = destContext;

      if (targetDest && targetDest.attractions && targetDest.attractions.length > 0) {
        const isFreeFilter = lowerMsg.includes('free') || lowerMsg.includes('cheap');
        let attrs = isFreeFilter
          ? targetDest.attractions.filter(a => a.ticket_price_inr === 0 || a.ticket_price_inr < 100)
          : targetDest.attractions;

        if (attrs.length === 0) attrs = targetDest.attractions;

        reply = `### 🏛️ ${isFreeFilter ? 'Free & Affordable' : 'Must-Visit'} Attractions in **${targetDest.city_name}, ${targetDest.country_name}**:

${attrs.slice(0, 7).map((a, idx) => `**${idx + 1}. ${a.name}**
* Category: *${a.category}*
* Ticket: **${a.ticket_price_inr === 0 ? '🆓 FREE Entry' : `₹${a.ticket_price_inr} INR (${a.ticket_price_local} ${targetDest.currency_code})`}**
* Est. Time: ${a.avg_duration_hours} hours`).join('\n\n')}

✨ **Interactive Feature:** Every single one of these attractions can be checked or discarded in **Tab 2 (Trip Builder)**, and ticket costs update dynamically in real time!`;

        suggestedPrompts = [
          `What is a 3-day budget for ${targetDest.city_name}?`,
          `How much is hotel stay in ${targetDest.city_name}?`,
          `What can I do with ₹10,000 in ${targetDest.city_name}?`
        ];
      } else {
        reply = `### 🏛️ Worldwide Attractions & Sightseeing Guidance
To view verified attractions and ticket prices in INR, mention any of our cataloged destinations or browse the Destination Explorer.
* Examples: *"Show attractions in Paris"*, *"Top places to visit in Tokyo"*, *"Free things to do in Rome"*, or *"Attractions in Tirupati"*.
* Every verified attraction includes entry fees, duration, and can be dynamically loaded into your Trip Builder.`;
        suggestedPrompts = [
          "Show top attractions in Paris",
          "Must-visit places in Tokyo",
          "Free attractions in Rome",
          "Top attractions in Tirupati"
        ];
      }
    }

    // Case D: General Greetings & Fallback
    if (!reply) {
      reply = `Hello! 👋 I am **WanderBot**, your intelligent AI Traveler Copilot for **WanderBudget AI**!

I provide travel assistance for **destinations across the globe**, backed by our 3NF PostgreSQL database of verified destinations, attractions, and real-time cost-of-living indicators.

Here are some things you can ask me:
* 🥐 **"What is the budget for 5 days in Paris?"**
* ⚖️ **"Compare Tokyo vs Zurich daily costs"**
* 🏛️ **"Show free attractions in Rome"**
* 🌴 **"Give me budget tips for Bali"**
* 🗽 **"Average hotel and dining costs in New York"**
* 🛕 **"What is the budget for 4 days in Tirupati?"**

Where would you like to travel today? 🌍`;

      suggestedPrompts = [
        "What is the budget for 5 days in Paris?",
        "Compare Tokyo vs Zurich daily costs",
        "Show free attractions in Rome",
        "Best budget destinations under ₹30,000"
      ];
    }

    res.json({
      reply,
      engine: 'WANDERBOT_EXPERT_HEURISTIC',
      detected_destination: destContext ? {
        destination_id: destContext.destination_id,
        city_name: destContext.city_name,
        country_name: destContext.country_name
      } : null,
      suggested_prompts: suggestedPrompts
    });
  } catch (err) {
    console.error('Traveler Chatbot error:', err);
    res.status(500).json({ error: 'Failed to generate chatbot response: ' + err.message });
  }
});

// ============================================================================
// 3. DESTINATIONS & ATTRACTIONS MASTER DATA API
// ============================================================================

// List All Destinations (Includes full attractions array)
app.get('/api/destinations', async (req, res) => {
  try {
    const destinations = await prisma.destination.findMany({
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } },
        _count: { select: { trips: true } }
      },
      orderBy: { city_name: 'asc' }
    });
    res.json(destinations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// Get Destination Details with Attractions
app.get('/api/destinations/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const destination = await prisma.destination.findUnique({
      where: { destination_id: id },
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } }
      }
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    res.json(destination);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch destination details' });
  }
});

// Comprehensive Cost of Living Budget Profile for a Particular Destination
app.get('/api/destinations/:id/cost-of-living-summary', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const destination = await prisma.destination.findUnique({
      where: { destination_id: id },
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } }
      }
    });

    if (!destination || !destination.cost_index) {
      return res.status(404).json({ error: 'Destination or cost index not found' });
    }

    const idx = destination.cost_index;
    const rate = Number(idx.exchange_rate_to_inr || 1.0);

    // Daily Rates in Local & INR
    const budgetDailyStayLocal = Number(idx.accommodation_budget_night);
    const standardDailyStayLocal = Number(idx.accommodation_standard_night);
    const luxuryDailyStayLocal = Number(idx.accommodation_luxury_night);

    const budgetDailyMealLocal = Number(idx.meal_budget_day);
    const standardDailyMealLocal = Number(idx.meal_standard_day);
    const luxuryDailyMealLocal = Number(idx.meal_luxury_day);

    const dailyTransitLocal = Number(idx.transit_pass_day);

    // Daily totals per person in INR
    const dailyBudgetInr = Math.round((budgetDailyStayLocal + budgetDailyMealLocal + dailyTransitLocal) * rate);
    const dailyStandardInr = Math.round((standardDailyStayLocal + standardDailyMealLocal + dailyTransitLocal) * rate);
    const dailyLuxuryInr = Math.round((luxuryDailyStayLocal + luxuryDailyMealLocal + dailyTransitLocal) * rate);

    // Cost of Living Index Score (0 to 100 relative to global benchmarks)
    const costIndexScore = Math.min(100, Math.max(15, Math.round((dailyStandardInr / 22000) * 100)));
    let costTier = 'MODERATE';
    let tierLabel = 'Moderate Living Cost';
    if (costIndexScore >= 80) {
      costTier = 'VERY_EXPENSIVE';
      tierLabel = 'Very High Cost (Premium Living)';
    } else if (costIndexScore >= 55) {
      costTier = 'EXPENSIVE';
      tierLabel = 'High Cost (Developed Metropolis)';
    } else if (costIndexScore >= 35) {
      costTier = 'MODERATE';
      tierLabel = 'Moderate Living Cost (Balanced)';
    } else {
      costTier = 'BUDGET_FRIENDLY';
      tierLabel = 'Highly Affordable (Budget Friendly)';
    }

    // Standard Stay Scenarios (1 Day, 3 Days, 7 Days, 14 Days, 30 Days)
    const durations = [
      { key: 'daily', label: '1 Day', days: 1 },
      { key: 'weekend', label: 'Weekend (3 Days)', days: 3 },
      { key: 'week', label: '1 Week (7 Days)', days: 7 },
      { key: 'fortnight', label: '2 Weeks (14 Days)', days: 14 },
      { key: 'month', label: '1 Month Living (30 Days)', days: 30 }
    ];

    const estimatedBudgets = {};
    for (const d of durations) {
      estimatedBudgets[d.key] = {
        label: d.label,
        days: d.days,
        budget_inr: Math.round(dailyBudgetInr * d.days * 1.10), // includes 10% contingency
        standard_inr: Math.round(dailyStandardInr * d.days * 1.10),
        luxury_inr: Math.round(dailyLuxuryInr * d.days * 1.10),
        budget_local: Math.round((dailyBudgetInr * d.days * 1.10) / rate),
        standard_local: Math.round((dailyStandardInr * d.days * 1.10) / rate),
        luxury_local: Math.round((dailyLuxuryInr * d.days * 1.10) / rate)
      };
    }

    // Long-Term Monthly Expat / Living Cost Breakdown (30 Days)
    const monthlyLiving = {
      solo_monthly_inr: Math.round(dailyStandardInr * 30 * 0.85), // long term stay discount
      couple_monthly_inr: Math.round(dailyStandardInr * 30 * 1.45),
      family4_monthly_inr: Math.round(dailyStandardInr * 30 * 2.50),
      currency: destination.currency_code,
      currency_symbol: destination.currency_symbol,
      rate_to_inr: rate
    };

    res.json({
      destination_id: destination.destination_id,
      city_name: destination.city_name,
      country_name: destination.country_name,
      currency_code: destination.currency_code,
      currency_symbol: destination.currency_symbol,
      exchange_rate_to_inr: rate,
      cost_index_score: costIndexScore,
      cost_tier: costTier,
      tier_label: tierLabel,
      daily_rates_local: {
        budget_stay: budgetDailyStayLocal,
        standard_stay: standardDailyStayLocal,
        luxury_stay: luxuryDailyStayLocal,
        budget_meals: budgetDailyMealLocal,
        standard_meals: standardDailyMealLocal,
        luxury_meals: luxuryDailyMealLocal,
        transit: dailyTransitLocal,
        taxi_per_km: Number(idx.taxi_per_km)
      },
      daily_totals_inr: {
        budget: dailyBudgetInr,
        standard: dailyStandardInr,
        luxury: dailyLuxuryInr
      },
      estimated_budgets: estimatedBudgets,
      monthly_living: monthlyLiving,
      source: idx.source,
      confidence_score: idx.confidence_score,
      last_synced_at: idx.last_synced_at
    });
  } catch (err) {
    console.error('Cost of living summary error:', err);
    res.status(500).json({ error: 'Failed to generate cost of living budget profile' });
  }
});

// Dynamic Custom Attraction Creation (Not Hardcoded) — Admin Authorized
app.post('/api/destinations/:id/attractions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rawDestId = req.params.id;
    if (!isStrictPositiveInteger(rawDestId)) {
      return res.status(400).json({ error: 'Invalid destination identifier. Expected positive integer.' });
    }
    const destId = Number(rawDestId);
    const { name, category, ticket_price_inr, avg_duration_hours, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Attraction name is required' });
    }

    const destination = await prisma.destination.findUnique({
      where: { destination_id: destId },
      include: { cost_index: true }
    });

    if (!destination) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    let priceInr = 0;
    if (ticket_price_inr !== undefined && ticket_price_inr !== null && ticket_price_inr !== '') {
      if (!isStrictPositiveNumber(ticket_price_inr) && ticket_price_inr !== 0 && ticket_price_inr !== '0') {
        return res.status(400).json({ error: 'ticket_price_inr must be a non-negative number' });
      }
      priceInr = Number(ticket_price_inr);
    }

    const rate = Number(destination.cost_index?.exchange_rate_to_inr || 1.0);
    const priceLocal = rate > 0 ? priceInr / rate : priceInr;

    let duration = 2.0;
    if (avg_duration_hours !== undefined && avg_duration_hours !== null && avg_duration_hours !== '') {
      if (!isStrictPositiveNumber(avg_duration_hours)) {
        return res.status(400).json({ error: 'avg_duration_hours must be a positive number' });
      }
      duration = Number(avg_duration_hours);
    }

    const newAttr = await prisma.attraction.create({
      data: {
        destination_id: destId,
        name: name.trim(),
        category: (category && typeof category === 'string' && category.trim()) ? category.trim() : 'Custom Sightseeing',
        ticket_price_local: priceLocal,
        ticket_price_inr: priceInr,
        avg_duration_hours: duration,
        description: (description && typeof description === 'string' && description.trim()) ? description.trim() : 'Admin-added custom tourist spot'
      }
    });

    res.status(201).json({
      message: 'Tourist attraction successfully added',
      attraction: newAttr
    });
  } catch (err) {
    console.error('Create attraction error:', err.message);
    res.status(500).json({ error: 'Failed to create attraction' });
  }
});

// Delete / Discard Attraction from Destination Catalog — Admin Authorized
app.delete('/api/attractions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!isStrictPositiveInteger(rawId)) {
      return res.status(400).json({ error: 'Invalid attraction identifier. Expected positive integer.' });
    }
    const attrId = Number(rawId);
    const existing = await prisma.attraction.findUnique({
      where: { attraction_id: attrId }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Attraction not found' });
    }

    await prisma.attraction.delete({ where: { attraction_id: attrId } });
    res.json({ message: 'Attraction removed from destination catalog' });
  } catch (err) {
    console.error('Delete attraction error:', err.message);
    res.status(500).json({ error: 'Failed to delete attraction' });
  }
});

// Live Rate Sync Endpoint: Refresh Real-Time Foreign Exchange Rates & Synchronize Attractions — Admin Authorized
app.post('/api/destinations/:id/sync-rates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rawDestId = req.params.id;
    if (!isStrictPositiveInteger(rawDestId)) {
      return res.status(400).json({ error: 'Invalid destination identifier. Expected positive integer.' });
    }
    const destId = Number(rawDestId);
    const destination = await prisma.destination.findUnique({
      where: { destination_id: destId },
      include: { cost_index: true, attractions: true }
    });

    if (!destination || !destination.cost_index) {
      return res.status(404).json({ error: 'Destination or cost index not found' });
    }

    const currentRate = Number(destination.cost_index.exchange_rate_to_inr || 1.0);
    const liveRate = await getLiveFxRateToInr(destination.currency_code, currentRate);

    // Update cost index with real-time rate and timestamp
    await prisma.costOfLivingIndex.update({
      where: { destination_id: destId },
      data: {
        exchange_rate_to_inr: liveRate,
        source: 'LIVE_WEB_SEARCH_AI (Real-time Market FX)',
        last_synced_at: new Date()
      }
    });

    // Recalculate attraction ticket prices in INR based on live rate
    if (destination.attractions && destination.attractions.length > 0) {
      for (const attr of destination.attractions) {
        const localPrice = Number(attr.ticket_price_local);
        const newPriceInr = Math.round(localPrice * liveRate);
        await prisma.attraction.update({
          where: { attraction_id: attr.attraction_id },
          data: { ticket_price_inr: newPriceInr }
        });
      }
    }

    const updated = await prisma.destination.findUnique({
      where: { destination_id: destId },
      include: {
        cost_index: true,
        attractions: { orderBy: { ticket_price_inr: 'asc' } }
      }
    });

    res.json({
      message: `Successfully synchronized ${updated.city_name} with real-time FX rate: 1 ${updated.currency_code} = ₹${liveRate} INR`,
      destination: updated
    });
  } catch (err) {
    console.error('Sync rates error:', err.message);
    res.status(500).json({ error: 'Failed to sync live exchange rates' });
  }
});

// List Budget Categories Master
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.budgetCategory.findMany({
      orderBy: { category_id: 'asc' }
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================================================
// 4. DYNAMIC BUDGET BUILDER & WHAT-IF ENGINE (Section 3 & 4 Rubric)
// ============================================================================

// Versioned, read-only real-world estimate. The established PostgreSQL function
// and saved-trip API remain unchanged until a user explicitly chooses another path.
app.post('/api/trips/dynamic-estimate', authenticateToken, async (req, res) => {
  const body = req.body || {};
  const destinationId = Number(body.destination_id);
  const days = Number(body.duration_days);
  const travelers = Number(body.group_size);
  const style = typeof body.travel_style === 'string' ? body.travel_style.trim().toUpperCase() : '';
  const external = body.external_destination;
  const externalCoordinates = external?.coordinates;
  const externalIsValid = external?.is_external === true && typeof external?.city_name === 'string' && external.city_name.trim().length >= 2 && typeof external?.country_name === 'string' && external.country_name.trim().length >= 2 && Number.isFinite(Number(externalCoordinates?.longitude)) && Number.isFinite(Number(externalCoordinates?.latitude)) && Math.abs(Number(externalCoordinates.latitude)) <= 90 && Math.abs(Number(externalCoordinates.longitude)) <= 180;
  if ((!Number.isSafeInteger(destinationId) || destinationId <= 0) && !externalIsValid) {
    return res.status(400).json({ error: 'Provide a verified destination or externally geocoded destination coordinates.' });
  }
  if (!Number.isSafeInteger(days) || days < 1 || days > 60 || !Number.isSafeInteger(travelers) || travelers < 1 || travelers > 20 || !['BUDGET', 'STANDARD', 'LUXURY'].includes(style)) {
    return res.status(400).json({ error: 'Provide 1-60 days, 1-20 travelers, and a valid travel style.' });
  }
  const attractionIds = Array.isArray(body.attraction_ids)
    ? [...new Set(body.attraction_ids.map(Number).filter(Number.isSafeInteger))].slice(0, 30)
    : [];
  try {
    if (externalIsValid && (!Number.isSafeInteger(destinationId) || destinationId <= 0)) {
      const route = await routeExternalDestination({
        startLocation: typeof body.starting_point === 'string' ? body.starting_point.trim().slice(0, 160) : '',
        destinationCoordinates: externalCoordinates,
        osrmUrl: process.env.OSRM_BASE_URL,
        userAgent: process.env.NOMINATIM_USER_AGENT
      });
      const estimate = calculateExternalDynamicPreview({
        trip: { overnight_stay: body.overnight_stay === true }, route
      });
      return res.json({ destination: { city_name: external.city_name.trim(), region_name: typeof external.region_name === 'string' ? external.region_name.trim() || null : null, country_name: external.country_name.trim(), coordinates: externalCoordinates, is_external: true, verified: false }, ...estimate });
    }
    const destination = await prisma.destination.findUnique({ where: { destination_id: destinationId }, include: { cost_index: true } });
    if (!destination?.cost_index) return res.status(404).json({ error: 'Verified destination cost data was not found.' });
    const foundAttractions = attractionIds.length
      ? await prisma.attraction.findMany({ where: { destination_id: destinationId, attraction_id: { in: attractionIds } }, select: { attraction_id: true, name: true, ticket_price_inr: true } })
      : [];
    // Preserve the user's selected attraction order; no AI or database ordering is applied.
    const attractionsById = new Map(foundAttractions.map(item => [Number(item.attraction_id), item]));
    const attractions = attractionIds.map(attractionId => attractionsById.get(attractionId) || ({ attraction_id: attractionId, name: `Unknown attraction #${attractionId}`, ticket_price_inr: null }));
    const route = await routeSelectedAttractions({
      startLocation: typeof body.starting_point === 'string' ? body.starting_point.trim().slice(0, 160) : '',
      selectedAttractions: attractions,
      destinationLabel: `${destination.city_name}, ${destination.country_name}`,
      regionName: destination.city_name,
      countryName: destination.country_name,
      nominatimUrl: process.env.NOMINATIM_BASE_URL,
      osrmUrl: process.env.OSRM_BASE_URL,
      userAgent: process.env.NOMINATIM_USER_AGENT
    });
    const estimate = calculateDynamicEstimate({
      costIndex: destination.cost_index,
      source: destination.cost_index.source,
      lastSyncedAt: destination.cost_index.last_synced_at,
      trip: {
        duration_days: days,
        travelers,
        travel_style: style,
        overnight_stay: body.overnight_stay === true,
        overnight_nights: body.overnight_nights,
        room_occupancy: body.room_occupancy,
        meals_per_person_per_day: body.meals_per_person_per_day,
        transport_preference: body.transport_preference,
        cab_distance_share: body.cab_distance_share
      },
      attractions,
      route
    });
    return res.json({ destination: { destination_id: destination.destination_id, city_name: destination.city_name, country_name: destination.country_name }, ...estimate });
  } catch (error) {
    // Deliberately diagnostic-only: do not expose provider, database, or credential details to clients.
    console.error('Dynamic estimate failed:', error?.name || 'Error', error?.code || '');
    return res.status(503).json({ error: 'Dynamic estimate is temporarily unavailable. The deterministic budget estimate remains available.' });
  }
});

// Optional, read-only OpenAI planning advice. This endpoint never calculates or
// persists a budget; PostgreSQL remains the sole source of final totals.
app.post('/api/trips/budget-advice', authenticateToken, async (req, res) => {
  const { destination_id, duration_days, travel_style, group_size, attraction_ids } = req.body || {};
  const destinationId = Number(destination_id);
  const days = Number(duration_days);
  const travelers = Number(group_size);
  const style = typeof travel_style === 'string' ? travel_style.trim().toUpperCase() : '';
  if (!Number.isSafeInteger(destinationId) || destinationId <= 0 || !Number.isSafeInteger(days) || days < 1 || days > 21 || !Number.isSafeInteger(travelers) || travelers < 1 || travelers > 20 || !['BUDGET', 'STANDARD', 'LUXURY'].includes(style)) {
    return res.status(400).json({ error: 'Provide a verified destination, 1-21 days, 1-20 travelers, and a valid travel style.' });
  }

  const attractionIds = Array.isArray(attraction_ids)
    ? [...new Set(attraction_ids.map(Number).filter(Number.isSafeInteger))].slice(0, 30)
    : [];
  const cacheKey = JSON.stringify({ user: req.user.user_id, destinationId, days, travelers, style, attractionIds });
  const cached = budgetAdvisorStore.getCached(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });
  if (!budgetAdvisorStore.allow(req.user.user_id)) {
    return res.status(429).json({ error: 'AI budget recommendations are limited to five requests every 15 minutes. Please try again later.' });
  }

  try {
    const destination = await prisma.destination.findUnique({
      where: { destination_id: destinationId },
      include: { cost_index: true }
    });
    if (!destination || !destination.cost_index) {
      return res.status(404).json({ error: 'Verified destination cost data was not found.' });
    }
    const selectedAttractions = attractionIds.length > 0
      ? await prisma.attraction.findMany({
        where: { destination_id: destinationId, attraction_id: { in: attractionIds } },
        select: { name: true, category: true, ticket_price_inr: true }
      })
      : [];
    const index = destination.cost_index;
    const context = {
      destination: { city: destination.city_name, country: destination.country_name, currency: destination.currency_code },
      trip: { duration_days: days, travelers, travel_style: style, accommodation_nights: Math.max(days - 1, 0) },
      verified_cost_benchmarks_local_currency: {
        accommodation_budget_night: Number(index.accommodation_budget_night),
        accommodation_standard_night: Number(index.accommodation_standard_night),
        accommodation_luxury_night: Number(index.accommodation_luxury_night),
        meal_budget_day: Number(index.meal_budget_day),
        meal_standard_day: Number(index.meal_standard_day),
        meal_luxury_day: Number(index.meal_luxury_day),
        transit_pass_day: Number(index.transit_pass_day),
        taxi_per_km: Number(index.taxi_per_km)
      },
      verified_selected_attractions: selectedAttractions.map(item => ({
        name: item.name, category: item.category, ticket_price_inr: Number(item.ticket_price_inr)
      })),
      rules: [
        'The deterministic PostgreSQL budget engine owns all totals.',
        'Recommendations are informational and cannot change calculated amounts.',
        'Do not claim any unsupported information is verified.'
      ]
    };
    const result = await getBudgetAdvice({ apiKey: process.env.OPENAI_API_KEY, context });
    if (result.status !== 'ok') {
      const status = result.status === 'invalid' ? 502 : result.provider_status === 429 ? 429 : 503;
      return res.status(status).json({ error: result.reason, retry_after_seconds: result.retry_after_seconds || undefined, fallback: 'The deterministic budget estimate remains available.' });
    }
    const payload = {
      model: result.model,
      advice: result.advice,
      calculated_amounts_changed: false,
      cached: false
    };
    budgetAdvisorStore.putCached(cacheKey, payload);
    return res.json(payload);
  } catch (error) {
    // Deliberately diagnostic-only: clients receive a safe fallback while server logs retain the error class/code.
    console.error('Budget advice failed:', error?.name || 'Error', error?.code || '');
    return res.status(503).json({ error: 'AI budget recommendations are temporarily unavailable.', fallback: 'The deterministic budget estimate remains available.' });
  }
});

// Calculate Dynamic Budget using PostgreSQL Stored Procedure + Selected Places
app.post('/api/trips/build-budget', async (req, res) => {
  try {
    const { destination_id, duration_days, travel_style, group_size, attraction_ids } = req.body;

    const days = Math.max(1, parseInt(duration_days) || 3);
    const travelers = Math.max(1, parseInt(group_size) || 1);
    const style = (travel_style || 'STANDARD').toUpperCase();
    const destId = parseInt(destination_id);
    const external = req.body.external_destination;
    const isExternal = (!destId || destId <= 0) && external?.is_external === true && typeof external?.city_name === 'string';

    if (!destId && !isExternal) {
      return res.status(400).json({ error: 'destination_id or external_destination is required' });
    }

    if (isExternal) {
      const idx = external.cost_index;
      const isDomestic = (external.country_name || '').toLowerCase().includes('india') ||
                         (external.city_name || '').toLowerCase().includes('india') ||
                         ['badrinath', 'kakinada', 'vizianagaram', 'tirupati'].some(c => (external.city_name || '').toLowerCase().includes(c));

      const defaultIdx = isDomestic ? {
        accommodation_budget_night: 750, accommodation_standard_night: 2200, accommodation_luxury_night: 6800,
        meal_budget_day: 380, meal_standard_day: 900, meal_luxury_day: 2200,
        transit_pass_day: 300, taxi_per_km: 18, exchange_rate_to_inr: 1.0
      } : {
        accommodation_budget_night: 40, accommodation_standard_night: 130, accommodation_luxury_night: 350,
        meal_budget_day: 20, meal_standard_day: 52, meal_luxury_day: 140,
        transit_pass_day: 9.0, taxi_per_km: 2.2, exchange_rate_to_inr: 84.0
      };

      const validNum = (val, fallback) => (Number.isFinite(Number(val)) && Number(val) > 0 ? Number(val) : fallback);
      const rate = validNum(idx?.exchange_rate_to_inr, defaultIdx.exchange_rate_to_inr);
      const accRate = validNum(idx?.[style === 'BUDGET' ? 'accommodation_budget_night' : style === 'LUXURY' ? 'accommodation_luxury_night' : 'accommodation_standard_night'], defaultIdx[style === 'BUDGET' ? 'accommodation_budget_night' : style === 'LUXURY' ? 'accommodation_luxury_night' : 'accommodation_standard_night']);
      const mealRate = validNum(idx?.[style === 'BUDGET' ? 'meal_budget_day' : style === 'LUXURY' ? 'meal_luxury_day' : 'meal_standard_day'], defaultIdx[style === 'BUDGET' ? 'meal_budget_day' : style === 'LUXURY' ? 'meal_luxury_day' : 'meal_standard_day']);
      const transitRate = validNum(idx?.transit_pass_day, defaultIdx.transit_pass_day);

      const rooms = Math.ceil(travelers / 2);
      const accTotal = Math.round(days * accRate * rooms * rate);
      const foodTotal = Math.round(days * travelers * mealRate * rate);
      const transitTotal = Math.round(days * travelers * transitRate * rate);

      let selectedAttractions = [];
      let attractionsCostInr = 0;
      if (Array.isArray(external.attractions) && external.attractions.length > 0) {
        selectedAttractions = external.attractions.filter(a =>
          !Array.isArray(attraction_ids) || attraction_ids.length === 0 || attraction_ids.includes(a.attraction_id)
        );
        attractionsCostInr = selectedAttractions.reduce((sum, a) => sum + (validNum(a.ticket_price_inr, 0) * travelers), 0);
      } else {
        attractionsCostInr = Math.round(days * travelers * 150 * (isDomestic ? 1 : rate / 84));
      }

      const subtotal = accTotal + foodTotal + transitTotal + attractionsCostInr;
      const bufferTotal = Math.round(subtotal * 0.10);
      const totalBudgetInr = subtotal + bufferTotal;
      const perPersonInr = Math.round(totalBudgetInr / travelers);

      const breakdown = [
        {
          category_code: 'ACCOMMODATION',
          category_name: 'Accommodation',
          icon: 'Hotel',
          allocated_inr: accTotal,
          daily_rate_inr: Math.round(accRate * rate),
          calculation_basis: `${days} nights, ${rooms} room(s) @ ₹${Math.round(accRate * rate)}/night (${style.toLowerCase()})`
        },
        {
          category_code: 'FOOD',
          category_name: 'Food & Dining',
          icon: 'Utensils',
          allocated_inr: foodTotal,
          daily_rate_inr: Math.round(mealRate * rate),
          calculation_basis: `${days} days × ${travelers} traveler(s) @ ₹${Math.round(mealRate * rate)}/day`
        },
        {
          category_code: 'TRANSIT',
          category_name: 'Local Transport',
          icon: 'Train',
          allocated_inr: transitTotal,
          daily_rate_inr: Math.round(transitRate * rate),
          calculation_basis: `${days} days × ${travelers} traveler(s) @ ₹${Math.round(transitRate * rate)}/day transit pass`
        },
        {
          category_code: 'SIGHTSEEING',
          category_name: 'Sightseeing & Admissions',
          icon: 'Camera',
          allocated_inr: attractionsCostInr,
          daily_rate_inr: Math.round(attractionsCostInr / days),
          calculation_basis: selectedAttractions.length > 0 ? `${selectedAttractions.length} attraction ticket(s) × ${travelers} traveler(s)` : `Sightseeing activities allowance for ${travelers} traveler(s)`
        },
        {
          category_code: 'BUFFER',
          category_name: 'Contingency & Fluctuation',
          icon: 'Shield',
          allocated_inr: bufferTotal,
          daily_rate_inr: Math.round(bufferTotal / days),
          calculation_basis: '10% Emergency contingency & currency fluctuation buffer'
        }
      ];

      const budgetAcc = validNum(idx?.accommodation_budget_night, defaultIdx.accommodation_budget_night);
      const budgetMeal = validNum(idx?.meal_budget_day, defaultIdx.meal_budget_day);
      const budgetSubtotal = Math.round(days * budgetAcc * rooms * rate) + Math.round(days * travelers * budgetMeal * rate) + transitTotal + attractionsCostInr;
      const budgetTotal = Math.round(budgetSubtotal * 1.10);

      const luxuryAcc = validNum(idx?.accommodation_luxury_night, defaultIdx.accommodation_luxury_night);
      const luxuryMeal = validNum(idx?.meal_luxury_day, defaultIdx.meal_luxury_day);
      const luxurySubtotal = Math.round(days * luxuryAcc * rooms * rate) + Math.round(days * travelers * luxuryMeal * rate) + transitTotal + attractionsCostInr;
      const luxuryTotal = Math.round(luxurySubtotal * 1.10);

      let minusOneDaySavings = 0;
      if (days > 1) {
        const minusDaySubtotal = Math.round((days - 1) * accRate * rooms * rate) + Math.round((days - 1) * travelers * mealRate * rate) + Math.round((days - 1) * travelers * transitRate * rate) + attractionsCostInr;
        minusOneDaySavings = Math.round(totalBudgetInr - (minusDaySubtotal * 1.10));
      }

      return res.json({
        duration_days: days,
        group_size: travelers,
        travel_style: style,
        total_budget_inr: totalBudgetInr,
        per_person_inr: perPersonInr,
        category_breakdown: breakdown,
        selected_attractions: selectedAttractions,
        what_if_insights: {
          budget_style_cost: budgetTotal,
          budget_style_savings: Math.max(0, totalBudgetInr - budgetTotal),
          luxury_style_cost: luxuryTotal,
          luxury_upgrade_cost: Math.max(0, luxuryTotal - totalBudgetInr),
          minus_one_day_savings: Math.max(0, minusOneDaySavings),
          split_per_traveler: perPersonInr
        },
        is_external: true,
        verified: false,
        calculation_model: 'AI Destination Benchmark (Google Gemini / Live AI) • External Preview'
      });
    }

    // Call PostgreSQL Stored Procedure: sp_calculate_trip_budget
    const spResult = await prisma.$queryRaw`
      SELECT * FROM sp_calculate_trip_budget(${destId}::INT, ${days}::INT, ${style}::VARCHAR, ${travelers}::INT)
    `;

    // Fetch selected attractions cost
    const attractionIds = Array.isArray(attraction_ids)
      ? [...new Set(attraction_ids.map(Number).filter(Number.isSafeInteger))]
      : [];
    let attractionsCostInr = 0;
    let selectedAttractions = [];
    if (attractionIds.length > 0) {
      selectedAttractions = await prisma.attraction.findMany({
        where: {
          destination_id: destId,
          attraction_id: { in: attractionIds }
        }
      });
      attractionsCostInr = selectedAttractions.reduce((sum, a) => sum + (Number(a.ticket_price_inr) * travelers), 0);
    }

    const replaceSightseeingWithSelectedTickets = (rows) => rows.reduce((sum, row) => (
      sum + (row.category_code === 'SIGHTSEEING'
        ? attractionsCostInr
        : Number(row.allocated_inr))
    ), 0);

    // Map categories from stored procedure
    const categories = await prisma.budgetCategory.findMany();
    const catMap = Object.fromEntries(categories.map(c => [c.category_code, c]));

    const breakdown = spResult.map(row => {
      let finalAllocated = Number(row.allocated_inr);
      // Replace sightseeing estimation with exact tickets if attractions were specified
      if (row.category_code === 'SIGHTSEEING') {
        finalAllocated = Math.round(attractionsCostInr * 100) / 100;
      }

      return {
        category_code: row.category_code,
        category_name: catMap[row.category_code]?.category_name || row.category_code,
        category_id: catMap[row.category_code]?.category_id,
        icon: catMap[row.category_code]?.icon || 'Tag',
        allocated_inr: finalAllocated,
        daily_rate_inr: Number(row.daily_rate_inr),
        calculation_basis: row.calculation_basis
      };
    });

    const totalBudgetInr = breakdown.reduce((acc, curr) => acc + curr.allocated_inr, 0);
    const perPersonInr = Math.round(totalBudgetInr / travelers);

    // Compute What-If Comparisons:
    // 1. Budget Style Alternative
    const budgetStyleSP = await prisma.$queryRaw`
      SELECT * FROM sp_calculate_trip_budget(${destId}::INT, ${days}::INT, 'BUDGET'::VARCHAR, ${travelers}::INT)
    `;
    const budgetTotal = Math.round(replaceSightseeingWithSelectedTickets(budgetStyleSP) * 100) / 100;

    // 2. Luxury Style Alternative
    const luxuryStyleSP = await prisma.$queryRaw`
      SELECT * FROM sp_calculate_trip_budget(${destId}::INT, ${days}::INT, 'LUXURY'::VARCHAR, ${travelers}::INT)
    `;
    const luxuryTotal = Math.round(replaceSightseeingWithSelectedTickets(luxuryStyleSP) * 100) / 100;

    // 3. Minus 1 Day Alternative
    let minusOneDaySavings = 0;
    if (days > 1) {
      const minusDaySP = await prisma.$queryRaw`
        SELECT * FROM sp_calculate_trip_budget(${destId}::INT, ${(days - 1)}::INT, ${style}::VARCHAR, ${travelers}::INT)
      `;
      minusOneDaySavings = Math.round((totalBudgetInr - replaceSightseeingWithSelectedTickets(minusDaySP)) * 100) / 100;
    }

    res.json({
      duration_days: days,
      group_size: travelers,
      travel_style: style,
      total_budget_inr: totalBudgetInr,
      per_person_inr: perPersonInr,
      category_breakdown: breakdown,
      selected_attractions: selectedAttractions,
      what_if_insights: {
        budget_style_cost: budgetTotal,
        budget_style_savings: Math.max(0, totalBudgetInr - budgetTotal),
        luxury_style_cost: luxuryTotal,
        luxury_upgrade_cost: Math.max(0, luxuryTotal - totalBudgetInr),
        minus_one_day_savings: minusOneDaySavings,
        split_per_traveler: perPersonInr
      }
    });
  } catch (err) {
    console.error('Build budget error:', err);
    res.status(500).json({ error: 'Failed to calculate dynamic trip budget' });
  }
});

// Mode 2: Reverse Budget Optimizer (Takes Fixed Wallet Budget -> Fits & Generates Optimal Itinerary & Luxury Choices)
app.post('/api/trips/optimize-budget-to-plan', async (req, res) => {
  try {
    const { destination_id, total_budget_inr, group_size, desired_days, attraction_ids } = req.body;
    const destId = parseInt(destination_id);
    const budget = parseFloat(total_budget_inr);
    const travelers = Math.max(1, parseInt(group_size) || 1);
    let targetDays = Math.max(1, parseInt(desired_days) || 5);

    if (!destId || !budget || budget <= 0) {
      return res.status(400).json({ error: 'Valid destination_id and positive total_budget_inr are required' });
    }

    const destination = await prisma.destination.findUnique({
      where: { destination_id: destId },
      include: { cost_index: true, attractions: true }
    });

    if (!destination || !destination.cost_index) {
      return res.status(404).json({ error: 'Destination or cost index not found' });
    }

    const idx = destination.cost_index;
    const rate = Number(idx.exchange_rate_to_inr);
    const rooms = Math.ceil(travelers / 2);

    // Calculate daily base costs in INR for each luxury tier:
    const dailyCostBudget = Math.round((Number(idx.accommodation_budget_night) * rooms + (Number(idx.meal_budget_day) + Number(idx.transit_pass_day)) * travelers) * rate);
    const dailyCostStandard = Math.round((Number(idx.accommodation_standard_night) * rooms + (Number(idx.meal_standard_day) + Number(idx.transit_pass_day)) * travelers) * rate);
    const dailyCostLuxury = Math.round((Number(idx.accommodation_luxury_night) * rooms + (Number(idx.meal_luxury_day) + Number(idx.transit_pass_day)) * travelers) * rate);

    const availableForPlan = budget * 0.90; // Reserve 10% contingency buffer

    let recommendedStyle = 'BUDGET';
    let feasibleDays = targetDays;
    let feasibilityStatus = 'FEASIBLE_COMFORTABLE';
    let advisoryNotes = [];

    // Check if Luxury fits for targetDays
    if (availableForPlan >= (dailyCostLuxury * targetDays)) {
      recommendedStyle = 'LUXURY';
      advisoryNotes.push(`Your budget of ₹${budget.toLocaleString()} comfortably covers a luxury 5-star experience for ${targetDays} days!`);
    } else if (availableForPlan >= (dailyCostStandard * targetDays)) {
      recommendedStyle = 'STANDARD';
      const gapToLuxury = Math.round((dailyCostLuxury * targetDays * 1.10) - budget);
      advisoryNotes.push(`Recommended Tier: Standard (3-Star hotels & casual dining). Upgrade to Luxury for +₹${gapToLuxury.toLocaleString()}.`);
    } else if (availableForPlan >= (dailyCostBudget * targetDays)) {
      recommendedStyle = 'BUDGET';
      const gapToStandard = Math.round((dailyCostStandard * targetDays * 1.10) - budget);
      advisoryNotes.push(`Recommended Tier: Budget (Hostels & street eats). To upgrade to 3-Star comfort, add ₹${gapToStandard.toLocaleString()}.`);
    } else {
      feasibilityStatus = 'BUDGET_DEFICIT';
      feasibleDays = Math.max(1, Math.floor(availableForPlan / Math.max(1, dailyCostBudget)));
      advisoryNotes.push(`Your budget of ₹${budget.toLocaleString()} can cover up to ${feasibleDays} days in Budget style, rather than ${targetDays} days.`);
    }

    // Category breakdown
    const accommodationPerNight = Math.round((recommendedStyle === 'LUXURY' ? Number(idx.accommodation_luxury_night) : (recommendedStyle === 'STANDARD' ? Number(idx.accommodation_standard_night) : Number(idx.accommodation_budget_night))) * rate * rooms);
    const foodPerDay = Math.round((recommendedStyle === 'LUXURY' ? Number(idx.meal_luxury_day) : (recommendedStyle === 'STANDARD' ? Number(idx.meal_standard_day) : Number(idx.meal_budget_day))) * rate * travelers);
    const transitPerDay = Math.round(Number(idx.transit_pass_day) * rate * travelers);

    const baseLivingCost = (accommodationPerNight + foodPerDay + transitPerDay) * feasibleDays;
    let remainingForAttractions = Math.max(0, availableForPlan - baseLivingCost);

    let candidateAttractions = destination.attractions;
    if (Array.isArray(attraction_ids)) {
      const allowedSet = new Set(attraction_ids.map(Number));
      candidateAttractions = candidateAttractions.filter(a => allowedSet.has(Number(a.attraction_id)));
    }

    const sortedAttractions = [...candidateAttractions].sort((a, b) => Number(a.ticket_price_inr) - Number(b.ticket_price_inr));

    let selectedAttractions = [];
    let deferredAttractions = [];
    let totalAttractionCost = 0;

    for (const attr of sortedAttractions) {
      const costForGroup = Math.round(Number(attr.ticket_price_inr) * travelers);
      if (costForGroup <= remainingForAttractions) {
        selectedAttractions.push({ ...attr, cost_for_group: costForGroup, status: 'INCLUDED' });
        remainingForAttractions -= costForGroup;
        totalAttractionCost += costForGroup;
      } else {
        deferredAttractions.push({ ...attr, cost_for_group: costForGroup, status: 'EXCEEDS_BUDGET_CAP' });
      }
    }

    const subtotal = (accommodationPerNight * feasibleDays) + (foodPerDay * feasibleDays) + (transitPerDay * feasibleDays) + totalAttractionCost;
    const bufferAmount = Math.max(Math.round(subtotal * 0.10), Math.round(budget - subtotal));
    const totalPlanned = subtotal + bufferAmount;

    const categories = await prisma.budgetCategory.findMany();
    const catMap = Object.fromEntries(categories.map(c => [c.category_code, c]));

    const categoryBreakdown = [
      {
        category_code: 'ACCOMMODATION',
        category_name: catMap['ACCOMMODATION']?.category_name || 'Hotels & Stay',
        category_id: catMap['ACCOMMODATION']?.category_id,
        allocated_inr: accommodationPerNight * feasibleDays,
        daily_rate_inr: accommodationPerNight,
        calculation_basis: `${feasibleDays} nights @ ₹${accommodationPerNight.toLocaleString()}/night (${recommendedStyle})`
      },
      {
        category_code: 'FOOD',
        category_name: catMap['FOOD']?.category_name || 'Food & Dining',
        category_id: catMap['FOOD']?.category_id,
        allocated_inr: foodPerDay * feasibleDays,
        daily_rate_inr: foodPerDay,
        calculation_basis: `${feasibleDays} days dining for ${travelers} traveler(s)`
      },
      {
        category_code: 'TRANSIT',
        category_name: catMap['TRANSIT']?.category_name || 'Local Transit',
        category_id: catMap['TRANSIT']?.category_id,
        allocated_inr: transitPerDay * feasibleDays,
        daily_rate_inr: transitPerDay,
        calculation_basis: `Daily passes & metro for ${feasibleDays} days`
      },
      {
        category_code: 'SIGHTSEEING',
        category_name: catMap['SIGHTSEEING']?.category_name || 'Attractions & Sightseeing',
        category_id: catMap['SIGHTSEEING']?.category_id,
        allocated_inr: totalAttractionCost,
        daily_rate_inr: Math.round(totalAttractionCost / feasibleDays),
        calculation_basis: `${selectedAttractions.length} attraction tickets fitting within wallet cap`
      },
      {
        category_code: 'BUFFER',
        category_name: catMap['BUFFER']?.category_name || 'Emergency Buffer',
        category_id: catMap['BUFFER']?.category_id,
        allocated_inr: bufferAmount,
        daily_rate_inr: Math.round(bufferAmount / feasibleDays),
        calculation_basis: 'Contingency & currency cushion'
      }
    ];

    res.json({
      input_budget_inr: budget,
      feasibility_status: feasibilityStatus,
      recommended_travel_style: recommendedStyle,
      recommended_days: feasibleDays,
      original_desired_days: targetDays,
      group_size: travelers,
      total_planned_budget_inr: totalPlanned,
      remaining_surplus_inr: Math.max(0, Math.round(budget - totalPlanned)),
      category_breakdown: categoryBreakdown,
      selected_attractions: selectedAttractions,
      deferred_attractions: deferredAttractions,
      advisory_notes: advisoryNotes
    });
  } catch (err) {
    console.error('Optimize budget to plan error:', err);
    res.status(500).json({ error: 'Failed to reverse-optimize budget into itinerary plan' });
  }
});

// ============================================================================
// 5. TRIPS & ATOMIC TRANSACTIONS (Section 3 Rubric ACID Compliance)
// ============================================================================

// Save Planned Trip (ACID Transaction with Prisma.$transaction)
app.post('/api/trips', authenticateToken, async (req, res) => {
  try {
    const { title, destination_id, duration_days, travel_style, group_size, total_budget_inr, breakdowns, attraction_ids } = req.body;

    if (!title || !destination_id || !total_budget_inr) {
      return res.status(400).json({ error: 'Missing required trip parameters' });
    }

    // ACID Transaction executing all inserts atomically
    const savedTrip = await prisma.$transaction(async (tx) => {
      // 1. Create Trip Master
      const trip = await tx.trip.create({
        data: {
          user_id: req.user.user_id,
          destination_id: Number(destination_id),
          title,
          duration_days: Number(duration_days) || 3,
          travel_style: (travel_style || 'STANDARD').toUpperCase(),
          group_size: Number(group_size) || 1,
          total_budget_inr: Number(total_budget_inr),
          total_spent_inr: 0,
          status: 'PLANNING'
        }
      });

      // 2. Create Budget Breakdowns
      if (breakdowns && Array.isArray(breakdowns)) {
        for (const b of breakdowns) {
          if (b.category_id && b.allocated_inr) {
            await tx.tripBudgetBreakdown.create({
              data: {
                trip_id: trip.trip_id,
                category_id: Number(b.category_id),
                allocated_amount_inr: Number(b.allocated_inr),
                spent_amount_inr: 0
              }
            });
          }
        }
      }

      // 3. Create Itinerary Places
      if (attraction_ids && Array.isArray(attraction_ids)) {
        for (let idx = 0; idx < attraction_ids.length; idx++) {
          const attrId = Number(attraction_ids[idx]);
          const attr = await tx.attraction.findUnique({ where: { attraction_id: attrId } });
          await tx.tripPlace.create({
            data: {
              trip_id: trip.trip_id,
              attraction_id: attrId,
              planned_day: (idx % (Number(duration_days) || 3)) + 1,
              estimated_cost_inr: attr ? Number(attr.ticket_price_inr) : 0
            }
          });
        }
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          user_id: req.user.user_id,
          action: 'TRIP_BUDGET_SAVED',
          entity_type: 'TRIP',
          entity_id: trip.trip_id,
          ip_address: req.ip || '127.0.0.1',
          details: `Trip '${title}' saved with total budget of ${total_budget_inr} INR`
        }
      });

      return trip;
    });

    res.status(201).json({
      message: 'Trip itinerary and dynamic budget successfully saved',
      trip: savedTrip
    });
  } catch (err) {
    console.error('Save trip error:', err);
    res.status(500).json({ error: 'Failed to save trip in transaction' });
  }
});

// List User's Trips
app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: req.user.role === 'ADMIN' ? {} : { user_id: req.user.user_id },
      include: {
        destination: true,
        budget_breakdowns: { include: { category: true } },
        _count: { select: { expenses: true, alerts: true } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get Single Trip Full Details
app.get('/api/trips/:id', authenticateToken, async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!isStrictPositiveInteger(rawId)) {
      return res.status(400).json({ error: 'Invalid trip identifier. Expected positive integer.' });
    }
    const tripId = Number(rawId);

    const trip = await prisma.trip.findUnique({
      where: { trip_id: tripId },
      include: {
        destination: { include: { cost_index: true } },
        budget_breakdowns: { include: { category: true } },
        trip_places: { include: { attraction: true } },
        expenses: {
          include: { category: true },
          orderBy: { expense_date: 'desc' }
        },
        alerts: { orderBy: { created_at: 'desc' } }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Enforce Object-Level Authorization: Admins have read access; Travelers can only read their own trips
    if (req.user.role !== 'ADMIN' && trip.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this trip' });
    }

    res.json(trip);
  } catch (err) {
    console.error('Fetch trip details error:', err.message);
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
});

// ============================================================================
// 6. EXPENSES & DATABASE TRIGGER-DRIVEN OVERRUN ALERTS (Section 3 Rubric)
// ============================================================================

// Log Expense (Fires PostgreSQL Trigger trg_check_budget_overrun)
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const { trip_id, category_id, expense_name, amount_inr, currency_code, amount_original, payment_method, notes } = req.body;

    // 1. Primitive & Positive Number Validations (rejects booleans and trailing garbage like "12abc", "50abc")
    if (!isStrictPositiveInteger(trip_id)) {
      return res.status(400).json({ error: 'Valid positive integer trip_id is required' });
    }
    const parsedTripId = Number(trip_id);

    if (!isStrictPositiveInteger(category_id)) {
      return res.status(400).json({ error: 'Valid positive integer category_id is required' });
    }
    const parsedCategoryId = Number(category_id);

    if (!expense_name || typeof expense_name !== 'string' || expense_name.trim() === '') {
      return res.status(400).json({ error: 'Non-empty expense_name is required' });
    }

    if (!isStrictPositiveNumber(amount_inr)) {
      return res.status(400).json({ error: 'Expense amount must be a positive number' });
    }
    const parsedAmount = Number(amount_inr);

    let parsedOriginal = parsedAmount;
    if (amount_original !== undefined && amount_original !== null) {
      if (!isStrictPositiveNumber(amount_original)) {
        return res.status(400).json({ error: 'amount_original must be a positive number' });
      }
      parsedOriginal = Number(amount_original);
    }

    const allowedMethods = ['CARD', 'CASH', 'UPI', 'FOREX'];
    let method = 'CARD';
    if (payment_method !== undefined && payment_method !== null) {
      if (typeof payment_method !== 'string' || payment_method.trim() === '') {
        return res.status(400).json({ error: `Invalid payment_method. Allowed: ${allowedMethods.join(', ')}` });
      }
      method = payment_method.trim().toUpperCase();
      if (!allowedMethods.includes(method)) {
        return res.status(400).json({ error: `Invalid payment_method. Allowed: ${allowedMethods.join(', ')}` });
      }
    }

    let currency = 'INR';
    if (currency_code !== undefined && currency_code !== null) {
      if (typeof currency_code !== 'string') {
        return res.status(400).json({ error: 'currency_code must be a string of 1 to 10 characters' });
      }
      const trimmedCurrency = currency_code.trim().toUpperCase();
      if (trimmedCurrency.length < 1 || trimmedCurrency.length > 10) {
        return res.status(400).json({ error: 'currency_code must be between 1 and 10 characters' });
      }
      currency = trimmedCurrency;
    }

    // 2. Trip Existence & Ownership Verification
    const trip = await prisma.trip.findUnique({
      where: { trip_id: parsedTripId }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Referenced trip not found' });
    }

    // Enforce Ownership Policy: Only the trip owner may log expenses against their itinerary
    if (trip.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden: You can only log expenses for your own trips' });
    }

    // 3. Category Validation & Allocation Envelope Verification
    const category = await prisma.budgetCategory.findUnique({
      where: { category_id: parsedCategoryId }
    });

    if (!category) {
      return res.status(400).json({ error: 'Invalid category_id. Category does not exist in master catalog.' });
    }

    const breakdown = await prisma.tripBudgetBreakdown.findFirst({
      where: {
        trip_id: parsedTripId,
        category_id: parsedCategoryId
      }
    });

    if (!breakdown) {
      return res.status(400).json({ error: 'Category is not allocated within this trip budget breakdown' });
    }

    // 4. Safe Insertion into PostgreSQL (The database trigger fires automatically)
    const expense = await prisma.tripExpense.create({
      data: {
        trip_id: parsedTripId,
        category_id: parsedCategoryId,
        user_id: req.user.user_id,
        expense_name: expense_name.trim(),
        amount_inr: parsedAmount,
        currency_code: currency,
        amount_original: parsedOriginal,
        payment_method: method,
        notes: notes ? String(notes).trim() : null
      }
    });

    // Check newly generated alerts for this trip
    const recentAlerts = await prisma.budgetAlert.findMany({
      where: { trip_id: parsedTripId },
      orderBy: { created_at: 'desc' },
      take: 3
    });

    // Fetch updated trip status
    const updatedTrip = await prisma.trip.findUnique({
      where: { trip_id: parsedTripId },
      select: { total_budget_inr: true, total_spent_inr: true }
    });

    await createAuditLog(
      req.user.user_id,
      'EXPENSE_LOGGED',
      'EXPENSE',
      expense.expense_id,
      `Logged expense '${expense_name.trim()}' of ${parsedAmount} INR for trip ${parsedTripId}`,
      req
    );

    res.status(201).json({
      message: 'Expense successfully recorded. Database budget triggers evaluated.',
      expense,
      updated_trip: updatedTrip,
      triggered_alerts: recentAlerts
    });
  } catch (err) {
    console.error('Log expense error:', err);
    res.status(500).json({ error: 'Failed to record trip expense' });
  }
});

// Get Budget Alerts for a Trip — Strict ID & Ownership Checked
app.get('/api/trips/:id/alerts', authenticateToken, async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!isStrictPositiveInteger(rawId)) {
      return res.status(400).json({ error: 'Invalid trip identifier. Expected positive integer.' });
    }
    const tripId = Number(rawId);
    const trip = await prisma.trip.findUnique({
      where: { trip_id: tripId }
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    if (req.user.role !== 'ADMIN' && trip.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view alerts for this trip' });
    }

    const alerts = await prisma.budgetAlert.findMany({
      where: { trip_id: tripId },
      include: { category: true },
      orderBy: { created_at: 'desc' }
    });
    res.json(alerts);
  } catch (err) {
    console.error('Fetch trip alerts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch budget alerts' });
  }
});

// ============================================================================
// 7. ANALYTICAL SQL VIEWS & AGGREGATE QUERIES (Section 3 Rubric)
// ============================================================================

// Query SQL View: v_trip_budget_summary — Strict ID & Ownership Checked
app.get('/api/analytics/trip-summary/:id', authenticateToken, async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!isStrictPositiveInteger(rawId)) {
      return res.status(400).json({ error: 'Invalid trip identifier. Expected positive integer.' });
    }
    const tripId = Number(rawId);
    const trip = await prisma.trip.findUnique({
      where: { trip_id: tripId }
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    if (req.user.role !== 'ADMIN' && trip.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view analytics for this trip' });
    }

    const summary = await prisma.$queryRaw`
      SELECT * FROM v_trip_budget_summary WHERE trip_id = ${tripId}
    `;

    const categoryVariance = await prisma.$queryRaw`
      SELECT * FROM v_trip_category_variance WHERE trip_id = ${tripId} ORDER BY category_id ASC
    `;

    if (!summary || summary.length === 0) {
      return res.status(404).json({ error: 'Trip analytical summary not found' });
    }

    res.json({
      summary: summary[0],
      category_variance: categoryVariance
    });
  } catch (err) {
    console.error('Trip summary view error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytical trip view' });
  }
});

// Query SQL View: v_destination_cost_overview
app.get('/api/analytics/destinations-overview', async (req, res) => {
  try {
    const overview = await prisma.$queryRaw`
      SELECT * FROM v_destination_cost_overview ORDER BY city_name ASC
    `;
    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch destination overview' });
  }
});

// ============================================================================
// 8. ADMIN AUDIT LOGS & SYSTEM HEALTH (Best Practices & Security)
// ============================================================================

// Get Audit Logs (Admin only, RBAC enforced)
app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: { user: { select: { reg_no: true, full_name: true, role: true } } },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.auditLog.count()
    ]);

    res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// System Health & Database Stats — Admin Authorized
app.get('/api/admin/system-health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [userCount, tripCount, destCount, expenseCount, alertCount] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.destination.count(),
      prisma.tripExpense.count(),
      prisma.budgetAlert.count()
    ]);

    // Check PostgreSQL connection latency with EXPLAIN query
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    res.json({
      status: 'OPERATIONAL',
      database: {
        connected: true,
        latency_ms: latencyMs,
        tables_count: 11,
        total_users: userCount,
        total_trips: tripCount,
        total_destinations: destCount,
        total_expenses: expenseCount,
        total_alerts: alertCount
      },
      uptime_seconds: process.uptime()
    });
  } catch (err) {
    console.error('System health error:', err.message);
    res.status(500).json({ status: 'ERROR', error: 'Failed to retrieve system health metrics' });
  }
});

// API Status & Gemini Key Configuration Endpoints
app.get('/api/system/api-status', (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(key && key.trim().length > 10 && key !== 'YOUR_GEMINI_API_KEY');
  res.json({
    gemini_configured: isConfigured,
    model: 'Google Gemini 1.5 Flash / 2.0 Flash',
    fx_rates_source: 'live (open.er-api.com/v6/latest/INR)',
    curated_destinations_count: 98,
    database: 'PostgreSQL 14+ (wanderbudget_24BAI0226)'
  });
});

app.post('/api/system/save-gemini-key', authenticateToken, requireAdmin, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Gemini configuration is managed through environment variables in production.'
    });
  }

  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
      return res.status(400).json({ error: 'Please provide a valid Gemini API key (starts with AIzaSy...)' });
    }
    const cleanKey = apiKey.trim();
    process.env.GEMINI_API_KEY = cleanKey;

    // Read and update backend/.env
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('GEMINI_API_KEY=')) {
        envContent = envContent.replace(/GEMINI_API_KEY="?[^"\r\n]*"?/g, `GEMINI_API_KEY="${cleanKey}"`);
      } else {
        envContent += `\nGEMINI_API_KEY="${cleanKey}"\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');
    }

    res.json({
      success: true,
      message: 'Google Gemini API key securely updated and connected!',
      masked_key: `${cleanKey.slice(0, 6)}...${cleanKey.slice(-4)}`
    });
  } catch (err) {
    console.error('Save gemini key error:', err.message);
    res.status(500).json({ error: 'Failed to update Gemini API key due to internal server error' });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================================`);
  console.log(` WanderBudget AI — Dynamic Trip Budget Builder & Cost Analyzer `);
  console.log(` Running on Port: http://localhost:${PORT} `);
  console.log(`==================================================================`);
});

module.exports = app;
