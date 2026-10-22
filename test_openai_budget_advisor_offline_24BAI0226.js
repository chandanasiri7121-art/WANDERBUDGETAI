const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { OPENAI_MODEL, createAdvisorStore, getBudgetAdvice } = require('./backend/openai_budget_advisor_24BAI0226');

const validAdvice = {
  accommodation: { recommendation: 'Share a standard room.', assumptions: ['Two travelers per room.'] },
  food: { recommendation: 'Mix local meals and cafes.', assumptions: [] },
  transport: { recommendation: 'Use metro for core routes.', public_transport_usage: 'Most daytime trips', cab_distance_km_per_day: 12, assumptions: ['Traffic can change cab use.'] },
  miscellaneous: { recommendation: 'Keep the existing contingency separate.', assumptions: ['No mandatory fees assumed.'] },
  itinerary_order: ['Visit the selected waterfront attraction first.', 'Choose the museum in the afternoon.'],
  savings_opportunities: ['Book a shared room early.'],
  uncertainties: ['Seasonal hotel availability is not verified.'],
  disclaimer: 'Planning advice only; deterministic calculations remain unchanged.'
};

function response(body, ok = true, status = 200, headers = {}) {
  return { ok, status, headers: { get: (name) => headers[String(name).toLowerCase()] || null }, json: async () => body };
}

const context = { destination: { city: 'Goa', country: 'India', currency: 'INR' }, trip: { duration_days: 5, travelers: 2, travel_style: 'STANDARD' } };
let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log(`PASS ${name}`); }

(async () => {
  await test('valid structured Responses output is accepted', async () => {
    let request;
    const result = await getBudgetAdvice({ apiKey: 'x'.repeat(24), context, fetchImpl: async (_, options) => {
      request = JSON.parse(options.body);
      return response({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(validAdvice) }] }] });
    } });
    assert.equal(result.status, 'ok');
    assert.equal(result.model, OPENAI_MODEL);
    assert.equal(request.text.format.type, 'json_schema');
    assert.equal(request.text.format.strict, true);
  });

  await test('invalid structured output is rejected', async () => {
    const result = await getBudgetAdvice({ apiKey: 'x'.repeat(24), context, fetchImpl: async () => response({ output_text: '{"unexpected":true}' }) });
    assert.equal(result.status, 'invalid');
  });

  await test('provider timeout falls back safely', async () => {
    const timeout = new Error('aborted'); timeout.name = 'AbortError';
    const result = await getBudgetAdvice({ apiKey: 'x'.repeat(24), context, fetchImpl: async () => { throw timeout; } });
    assert.equal(result.status, 'unavailable');
    assert.match(result.reason, /timed out/);
  });

  await test('provider configuration failures remain safe but actionable', async () => {
    const credentials = await getBudgetAdvice({ apiKey: 'x'.repeat(24), context, fetchImpl: async () => response({}, false, 401) });
    assert.equal(credentials.status, 'unavailable');
    assert.match(credentials.reason, /credentials were rejected/);
    const model = await getBudgetAdvice({ apiKey: 'x'.repeat(24), context, fetchImpl: async () => response({}, false, 404) });
    assert.match(model.reason, /model is unavailable/);
  });

  await test('rate limits, retry windows, and quota failures are distinguished', async () => {
    const limited = await getBudgetAdvice({ apiKey: 'x'.repeat(24), context, fetchImpl: async () => response({ error: { code: 'rate_limit_exceeded' } }, false, 429, { 'retry-after': '17' }) });
    assert.equal(limited.provider_status, 429);
    assert.equal(limited.retry_after_seconds, 17);
    assert.match(limited.reason, /17 seconds/);
    const quota = await getBudgetAdvice({ apiKey: 'x'.repeat(24), context, fetchImpl: async () => response({ error: { code: 'insufficient_quota' } }, false, 429) });
    assert.match(quota.reason, /insufficient quota/);
  });

  await test('missing API key does not attempt a provider request', async () => {
    let called = false;
    const result = await getBudgetAdvice({ apiKey: '', context, fetchImpl: async () => { called = true; } });
    assert.equal(result.status, 'unavailable');
    assert.equal(called, false);
  });

  await test('in-memory per-user rate limit and cache behave predictably', async () => {
    const store = createAdvisorStore();
    for (let i = 0; i < 5; i += 1) assert.equal(store.allow('user-1', 1000), true);
    assert.equal(store.allow('user-1', 1000), false);
    store.putCached('key', { ok: true }, 1000);
    assert.deepEqual(store.getCached('key', 1001), { ok: true });
  });

  await test('route requires authentication and cannot alter deterministic totals', async () => {
    const server = fs.readFileSync(path.join(__dirname, 'backend/server_wanderbudget_24BAI0226.js'), 'utf8');
    assert.match(server, /app\.post\('\/api\/trips\/budget-advice', authenticateToken/);
    assert.match(server, /calculated_amounts_changed: false/);
    assert.match(server, /The deterministic PostgreSQL budget engine owns all totals/);
  });

  console.log(`OpenAI budget advisor offline tests: ${passed} passed | 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
