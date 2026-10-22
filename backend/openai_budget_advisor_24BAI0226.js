const { z } = require('zod');

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
// Pin a currently supported snapshot so the advisor does not depend on a deprecated alias.
const OPENAI_MODEL = 'gpt-5.4-nano-2026-03-17';
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const adviceSchema = z.object({
  accommodation: z.object({ recommendation: z.string().max(360), assumptions: z.array(z.string().max(220)).max(4) }),
  food: z.object({ recommendation: z.string().max(360), assumptions: z.array(z.string().max(220)).max(4) }),
  transport: z.object({
    recommendation: z.string().max(360),
    public_transport_usage: z.string().max(160),
    cab_distance_km_per_day: z.number().min(0).max(100),
    assumptions: z.array(z.string().max(220)).max(4)
  }),
  miscellaneous: z.object({ recommendation: z.string().max(360), assumptions: z.array(z.string().max(220)).max(4) }),
  itinerary_order: z.array(z.string().max(220)).max(8),
  savings_opportunities: z.array(z.string().max(260)).max(5),
  uncertainties: z.array(z.string().max(260)).max(5),
  disclaimer: z.string().max(300)
});

const adviceJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['accommodation', 'food', 'transport', 'miscellaneous', 'itinerary_order', 'savings_opportunities', 'uncertainties', 'disclaimer'],
  properties: {
    accommodation: {
      type: 'object', additionalProperties: false, required: ['recommendation', 'assumptions'],
      properties: { recommendation: { type: 'string' }, assumptions: { type: 'array', items: { type: 'string' } } }
    },
    food: {
      type: 'object', additionalProperties: false, required: ['recommendation', 'assumptions'],
      properties: { recommendation: { type: 'string' }, assumptions: { type: 'array', items: { type: 'string' } } }
    },
    transport: {
      type: 'object', additionalProperties: false, required: ['recommendation', 'public_transport_usage', 'cab_distance_km_per_day', 'assumptions'],
      properties: {
        recommendation: { type: 'string' }, public_transport_usage: { type: 'string' }, cab_distance_km_per_day: { type: 'number' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    },
    miscellaneous: {
      type: 'object', additionalProperties: false, required: ['recommendation', 'assumptions'],
      properties: { recommendation: { type: 'string' }, assumptions: { type: 'array', items: { type: 'string' } } }
    },
    itinerary_order: { type: 'array', items: { type: 'string' } },
    savings_opportunities: { type: 'array', items: { type: 'string' } },
    uncertainties: { type: 'array', items: { type: 'string' } },
    disclaimer: { type: 'string' }
  }
};

function createAdvisorStore() {
  const cache = new Map();
  const requestTimesByUser = new Map();
  return {
    getCached(key, now = Date.now()) {
      const entry = cache.get(key);
      if (!entry || entry.expiresAt <= now) {
        cache.delete(key);
        return null;
      }
      return entry.value;
    },
    putCached(key, value, now = Date.now()) {
      cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
    },
    allow(userId, now = Date.now()) {
      const previous = requestTimesByUser.get(userId) || [];
      const active = previous.filter(time => time > now - RATE_LIMIT_WINDOW_MS);
      if (active.length >= RATE_LIMIT_MAX_REQUESTS) {
        requestTimesByUser.set(userId, active);
        return false;
      }
      active.push(now);
      requestTimesByUser.set(userId, active);
      return true;
    }
  };
}

function responseText(body) {
  if (typeof body?.output_text === 'string') return body.output_text;
  const content = Array.isArray(body?.output) ? body.output.flatMap(item => item?.content || []) : [];
  const text = content.find(item => item?.type === 'output_text' && typeof item.text === 'string');
  return text?.text || null;
}

function buildInput(context) {
  return `Provide planning recommendations only. Do not calculate, alter, or restate a final trip total. Do not invent verified prices, attraction fees, exchange rates, taxes, tariffs, hotel availability, or live information. Use the supplied benchmark values only as context. Mark anything not supported by those values as an assumption or uncertainty. For itinerary_order, order only the supplied selected attraction names; it is a practical suggestion, not a route or distance claim.\n\nTrip context:\n${JSON.stringify(context)}`;
}

async function providerFailure(response) {
  let code = '';
  try {
    const body = await response.json();
    code = String(body?.error?.code || body?.error?.type || '').toLowerCase();
  } catch { /* Use only HTTP status when the provider body is absent or malformed. */ }
  const retryAfterRaw = response.headers?.get?.('retry-after');
  const retryAfterSeconds = /^\d+$/.test(String(retryAfterRaw || '')) ? Math.min(3600, Math.max(1, Number(retryAfterRaw))) : null;
  if (response.status === 401 || response.status === 403) return { status: 'unavailable', provider_status: response.status, reason: 'Advisor API credentials were rejected. Ask an administrator to check backend configuration.' };
  if (response.status === 404) return { status: 'unavailable', provider_status: 404, reason: 'The configured advisor model is unavailable. Ask an administrator to check backend configuration.' };
  if (response.status === 429 && (code.includes('insufficient_quota') || code.includes('billing'))) return { status: 'unavailable', provider_status: 429, reason: 'Advisor account has insufficient quota. Ask an administrator to check billing.', retry_after_seconds: retryAfterSeconds };
  if (response.status === 429) return { status: 'unavailable', provider_status: 429, reason: retryAfterSeconds ? `Provider rate limited the request. Try again in ${retryAfterSeconds} seconds.` : 'Provider rate limited the request', retry_after_seconds: retryAfterSeconds };
  if (response.status === 400) return { status: 'unavailable', provider_status: 400, reason: 'Advisor request was rejected by the provider' };
  return { status: 'unavailable', provider_status: response.status, reason: 'Advisor service is temporarily unavailable' };
}

async function getBudgetAdvice({ apiKey, context, fetchImpl = fetch }) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 20) {
    return { status: 'unavailable', reason: 'OPENAI_API_KEY is not configured' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          { role: 'system', content: 'You are a cautious travel planning advisor. Return only the requested JSON.' },
          { role: 'user', content: buildInput(context) }
        ],
        max_output_tokens: 700,
        text: { format: { type: 'json_schema', name: 'budget_advice', strict: true, schema: adviceJsonSchema } }
      })
    });
    if (!response.ok) {
      return providerFailure(response);
    }
    const body = await response.json();
    const text = responseText(body);
    if (!text) return { status: 'invalid', reason: 'Advisor returned no structured recommendation' };
    let parsed;
    try { parsed = JSON.parse(text); } catch { return { status: 'invalid', reason: 'Advisor returned invalid structured data' }; }
    const validation = adviceSchema.safeParse(parsed);
    return validation.success ? { status: 'ok', advice: validation.data, model: OPENAI_MODEL } : { status: 'invalid', reason: 'Advisor response failed validation' };
  } catch (error) {
    return { status: 'unavailable', reason: error?.name === 'AbortError' ? 'Advisor request timed out' : 'Advisor service is temporarily unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { OPENAI_MODEL, adviceSchema, createAdvisorStore, getBudgetAdvice, providerFailure };
