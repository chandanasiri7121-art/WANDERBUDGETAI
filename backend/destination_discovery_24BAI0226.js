// External destination discovery only. This module never reads or writes WanderBudget data.
const path = require('path');
const fs = require('fs');

const HF_NER_MODEL = 'dslim/bert-base-NER';
const HF_NER_URL = `https://router.huggingface.co/hf-inference/models/${HF_NER_MODEL}`;
const MAPBOX_FORWARD_URL = 'https://api.mapbox.com/search/geocode/v6/forward';
const REQUEST_TIMEOUT_MS = 2500;
const MAX_QUERY_LENGTH = 160;
const DISCOVERY_CACHE_TTL_MS = 5 * 60 * 1000;
const discoveryCache = new Map();

function getMapboxToken(env = process.env) {
  let token = String(env?.MAPBOX_ACCESS_TOKEN || '').trim();
  if (!token) {
    try {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/^MAPBOX_ACCESS_TOKEN\s*=\s*([^\s#]+)/m);
        if (match && match[1]) {
          token = match[1].trim();
        }
      }
    } catch (_) {}
  }
  return token;
}

function uniqueStrings(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function validCoordinates(value) {
  const longitude = Number(value?.longitude ?? value?.[0]);
  const latitude = Number(value?.latitude ?? value?.[1]);
  return Number.isFinite(longitude) && Number.isFinite(latitude) && Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90
    ? { longitude, latitude }
    : null;
}

function levenshtein(a, b) {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = Array.from({ length: bn + 1 }, () => Array(an + 1).fill(0));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let j = 0; j <= bn; ++j) matrix[j][0] = j;
  for (let j = 1; j <= bn; ++j) {
    for (let i = 1; i <= an; ++i) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j - 1][i] + 1, matrix[j][i - 1] + 1, matrix[j - 1][i - 1] + cost);
    }
  }
  return matrix[bn][an];
}

const CITY_ALIASES = {
  bengaluru: ['bangalore'],
  bangalore: ['bengaluru'],
  mumbai: ['bombay'],
  bombay: ['mumbai'],
  chennai: ['madras'],
  madras: ['chennai'],
  kolkata: ['calcutta'],
  calcutta: ['kolkata'],
  varanasi: ['banaras', 'kashi', 'benares'],
  banaras: ['varanasi'],
  kashi: ['varanasi'],
  benares: ['varanasi'],
  kochi: ['cochin'],
  cochin: ['kochi'],
  visakhapatnam: ['vizag'],
  vizag: ['visakhapatnam'],
  puducherry: ['pondicherry'],
  pondicherry: ['puducherry'],
  thiruvananthapuram: ['trivandrum'],
  trivandrum: ['thiruvananthapuram'],
  badrinath: ['badrinathpuri'],
  badrinathpuri: ['badrinath'],
  vizianagaram: ['vijayanagaram', 'vijayangaram'],
  vijayanagaram: ['vizianagaram', 'vijayangaram'],
  vijayangaram: ['vizianagaram', 'vijayanagaram']
};

function matchesCityName(candidate, target) {
  if (!candidate || !target) return false;
  const c = candidate.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (c === t) return true;
  if (CITY_ALIASES[t]?.includes(c) || CITY_ALIASES[c]?.includes(t)) return true;
  if (c.startsWith(t) || (t.length >= 4 && t.startsWith(c))) return true;
  if (t.length >= 4 && Math.abs(c.length - t.length) <= 2 && levenshtein(c, t) <= 2) return true;
  return false;
}

function parseQueryConstraints(query) {
  const parts = String(query || '').split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return { city: '', region: null, country: null };
  const city = parts[0];
  let region = null;
  let country = null;
  if (parts.length === 2) {
    country = parts[1];
  } else if (parts.length >= 3) {
    region = parts[1];
    country = parts[parts.length - 1];
  }
  return { city, region, country };
}

function matchesGeographicConstraints(place, constraints) {
  if (!constraints) return true;
  if (constraints.country) {
    const cNorm = constraints.country.toLowerCase().trim();
    const placeCountry = (place.country_name || '').toLowerCase().trim();
    const placeCode = (place.country_code || '').toLowerCase().trim();
    if (!placeCountry.includes(cNorm) && !cNorm.includes(placeCountry) && placeCode !== cNorm) {
      return false;
    }
  }
  if (constraints.region) {
    const rNorm = constraints.region.toLowerCase().trim();
    const placeRegion = (place.region_name || '').toLowerCase().trim();
    if (!placeRegion.includes(rNorm) && !rNorm.includes(placeRegion)) {
      return false;
    }
  }
  return true;
}

function isStateOrCountryFeature(feature) {
  if (!feature || typeof feature !== 'object') return true;
  const properties = feature.properties || {};
  const featureType = String(properties.feature_type || properties.place_type || '').toLowerCase();
  const id = String(feature.id || properties.mapbox_id || '').toLowerCase();
  const placeTypes = Array.isArray(feature.place_type) ? feature.place_type.map(t => String(t).toLowerCase()) : [];

  if (featureType === 'region' || featureType === 'country' || featureType === 'district') return true;
  if (id.startsWith('region.') || id.startsWith('country.') || id.startsWith('district.')) return true;
  if (placeTypes.includes('region') || placeTypes.includes('country') || placeTypes.includes('district')) {
    if (!placeTypes.includes('place') && !placeTypes.includes('locality')) return true;
  }
  return false;
}

// Accepts Mapbox Search v6 (properties.context as object) and Mapbox v5
// (context as array) without fabricating coordinates or destination IDs.
function externalPlaceFromFeature(feature, fallbackId, targetCity = null, constraints = null) {
  if (!feature || typeof feature !== 'object') return null;
  if (isStateOrCountryFeature(feature)) return null;

  const properties = feature.properties || {};
  const rawContext = properties.context || feature.context || {};

  let countryName = null;
  let countryCode = null;
  let regionName = null;

  if (Array.isArray(rawContext)) {
    // Mapbox v5 Array context format
    const countryItem = rawContext.find(item => item && (String(item.id || '').startsWith('country') || item.short_code));
    const regionItem = rawContext.find(item => item && (String(item.id || '').startsWith('region') || String(item.id || '').startsWith('district')));
    if (countryItem) {
      countryName = countryItem.name || countryItem.text;
      countryCode = countryItem.short_code || countryItem.country_code;
    }
    if (regionItem) {
      regionName = regionItem.name || regionItem.text;
    }
  } else if (rawContext && typeof rawContext === 'object') {
    // Mapbox v6 Object context format
    const countryObj = rawContext.country || properties.country || feature.country;
    if (typeof countryObj === 'string') {
      countryName = countryObj;
    } else if (countryObj && typeof countryObj === 'object') {
      countryName = countryObj.name;
      countryCode = countryObj.country_code || countryObj.country_code_alpha_3;
    }
    const regionObj = rawContext.region || properties.region || feature.region;
    if (typeof regionObj === 'string') {
      regionName = regionObj;
    } else if (regionObj && typeof regionObj === 'object') {
      regionName = regionObj.name;
    }
  }

  if (!countryName && typeof properties.country === 'string') countryName = properties.country;
  if (!regionName && typeof properties.region === 'string') regionName = properties.region;
  if (!countryCode && properties.country_code) countryCode = properties.country_code;

  const cityName = properties.name_preferred || properties.name || feature.text || feature.name;
  const coordinates = validCoordinates(properties.coordinates) || validCoordinates(feature.geometry?.coordinates) || validCoordinates(feature.center);

  if (!cityName || !countryName || !coordinates) return null;

  // Reject country-only or state-only masquerading as city
  const cityLower = String(cityName).toLowerCase().trim();
  const countryLower = String(countryName).toLowerCase().trim();
  const regionLower = regionName ? String(regionName).toLowerCase().trim() : null;

  if (cityLower === countryLower && !['singapore', 'monaco', 'vatican'].includes(cityLower)) {
    return null;
  }
  if (regionLower && cityLower === regionLower) {
    return null;
  }

  // Verify city matches requested target if provided
  if (targetCity && !matchesCityName(cityName, targetCity)) {
    return null;
  }

  // Verify geographic constraints (e.g. state, country) if requested
  if (constraints && !matchesGeographicConstraints({ country_name: countryName, country_code: countryCode, region_name: regionName }, constraints)) {
    return null;
  }

  // Construct clean full_name
  let fullName = '';
  if (regionName) {
    fullName = `${cityName}, ${regionName}, ${countryName}`;
  } else {
    fullName = `${cityName}, ${countryName}`;
  }

  return {
    external_id: String(feature.id || properties.mapbox_id || fallbackId),
    city_name: String(cityName),
    region_name: regionName ? String(regionName) : null,
    country_name: String(countryName),
    country_code: countryCode ? String(countryCode).toUpperCase() : null,
    full_name: fullName,
    coordinates,
    provider: 'MAPBOX_GEOCODING',
    attribution: '© Mapbox',
    is_external: true,
    verified: false,
    destination_id: null
  };
}

function cachedDiscovery(key, now = Date.now()) {
  const entry = discoveryCache.get(key);
  if (!entry || entry.expires_at <= now) { discoveryCache.delete(key); return null; }
  return entry.value;
}

function locationCandidatesFromNer(payload) {
  if (!Array.isArray(payload)) return [];
  const candidates = [];
  let active = null;
  payload.forEach(entity => {
    if (!entity || typeof entity !== 'object' || Number(entity.score) < 0.60 || typeof entity.word !== 'string') return;
    const label = entity.entity_group || entity.entity;
    const fragment = entity.word.replace(/^##/, '').trim();
    const isLocation = label === 'LOC' || label === 'B-LOC' || label === 'I-LOC';
    if (!isLocation || !fragment) return;
    if (label === 'LOC' || label === 'B-LOC') {
      if (active) candidates.push(active.value);
      active = { value: fragment, end: Number(entity.end), joinsWord: entity.word.startsWith('##') };
      return;
    }
    // I-LOC fragments belong to the preceding location. Preserve WordPiece joins
    // (e.g. "Bang" + "##alore") while retaining spaces between ordinary tokens.
    if (active) {
      const contiguous = Number.isFinite(active.end) && Number(entity.start) === active.end;
      active.value += (entity.word.startsWith('##') || contiguous || active.joinsWord) ? fragment : ` ${fragment}`;
      active.end = Number(entity.end);
      active.joinsWord = entity.word.startsWith('##');
    } else {
      active = { value: fragment, end: Number(entity.end), joinsWord: entity.word.startsWith('##') };
    }
  });
  if (active) candidates.push(active.value);
  return uniqueStrings(candidates);
}

async function fetchJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  if (!response || !response.ok) return { ok: false, status: response?.status || 0, body: null };
  try {
    return { ok: true, status: response.status, body: await response.json() };
  } catch (_) {
    return { ok: false, status: response.status, body: null };
  }
}

async function discoverDestinations({ query, fetchImpl = fetch, env = process.env }) {
  const originalQuery = typeof query === 'string' ? query.trim().slice(0, MAX_QUERY_LENGTH) : '';
  if (originalQuery.length < 2) return { results: [], provider_status: 'invalid_query', transformer_used: false };

  // HUGGINGFACE_API_TOKEN is the deployment variable. HF_TOKEN remains a
  // backwards-compatible alias for existing local setups.
  const hfToken = String(env.HUGGINGFACE_API_TOKEN || env.HF_TOKEN || '').trim();
  const mapboxToken = getMapboxToken(env);
  if (!mapboxToken) return { results: [], provider_status: 'not_configured', transformer_used: false };

  const cacheKey = originalQuery.toLowerCase();
  const cached = cachedDiscovery(cacheKey);
  if (cached) return { ...cached, cached: true };

  const constraints = parseQueryConstraints(originalQuery);
  const targetCity = constraints.city || originalQuery;

  // Check if query is conversational (e.g. contains intent verbs or multi-city comparison)
  const isConversational = /\b(compare|visit|trip|travel|flights?|vacation|budget|recommend|between|and)\b/i.test(originalQuery) && originalQuery.split(/\s+/).length > 2;

  let transformerUsed = false;
  let candidates = [];

  if (isConversational && hfToken) {
    try {
      const hfResult = await fetchJson(fetchImpl, HF_NER_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: originalQuery, parameters: { aggregation_strategy: 'simple' } }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (hfResult.ok) {
        transformerUsed = true;
        candidates = locationCandidatesFromNer(hfResult.body);
      }
    } catch (_) {
      // Fail open: geographic search below still receives the original user query.
    }
  }

  // Prioritize user's original query as the primary candidate.
  // Never replace the user's city query with a state extracted by NER.
  if (candidates.length > 0) {
    candidates = uniqueStrings([originalQuery, ...candidates]).slice(0, 3);
  } else if (originalQuery.includes(',')) {
    candidates = uniqueStrings([originalQuery, targetCity]).slice(0, 2);
  } else {
    candidates = [originalQuery];
  }

  const results = [];
  let isRateLimited = false;
  let hasProviderError = false;

  for (const candidate of candidates) {
    try {
      // Only request place and locality level to prevent Mapbox from returning whole states or countries
      const params = new URLSearchParams({
        q: candidate,
        types: 'place,locality',
        limit: '5',
        autocomplete: 'true',
        access_token: mapboxToken
      });
      const mapboxResult = await fetchJson(fetchImpl, `${MAPBOX_FORWARD_URL}?${params.toString()}`, {
        method: 'GET',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (mapboxResult.status === 429) {
        isRateLimited = true;
        continue;
      }
      if (!mapboxResult.ok) {
        hasProviderError = true;
        continue;
      }
      if (!Array.isArray(mapboxResult.body?.features)) continue;

      const candidateTarget = candidate.includes(',') ? parseQueryConstraints(candidate).city : candidate;
      const effectiveTarget = isConversational && candidate !== originalQuery ? candidateTarget : targetCity;
      const effectiveConstraints = isConversational && candidate !== originalQuery ? parseQueryConstraints(candidate) : constraints;

      mapboxResult.body.features.forEach((feature, index) => {
        const place = externalPlaceFromFeature(feature, `mapbox_${candidate}_${index}`, effectiveTarget, effectiveConstraints);
        if (place) results.push(place);
      });
    } catch (_) {
      hasProviderError = true;
    }
  }

  const seen = new Set();
  const filteredResults = results.filter(result => {
    const key = `${result.city_name.toLowerCase()}|${result.country_name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Prioritize exact or alias matches, then prefix matches, then other valid matches
  const targetLower = targetCity.toLowerCase().trim();
  filteredResults.sort((a, b) => {
    const aLower = a.city_name.toLowerCase().trim();
    const bLower = b.city_name.toLowerCase().trim();
    const aExact = aLower === targetLower || Boolean(CITY_ALIASES[targetLower]?.includes(aLower));
    const bExact = bLower === targetLower || Boolean(CITY_ALIASES[targetLower]?.includes(bLower));
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    const aPrefix = aLower.startsWith(targetLower);
    const bPrefix = bLower.startsWith(targetLower);
    if (aPrefix && !bPrefix) return -1;
    if (!aPrefix && bPrefix) return 1;
    return 0;
  });
  const prioritizedResults = filteredResults.slice(0, 10);

  let providerStatus = 'ok';
  if (prioritizedResults.length === 0) {
    if (isRateLimited) providerStatus = 'rate_limited';
    else if (hasProviderError) providerStatus = 'unavailable';
    else providerStatus = 'no_match';
  }

  const response = {
    results: prioritizedResults,
    provider_status: providerStatus,
    transformer_used: transformerUsed
  };

  // Cache only a completed provider response with results.
  if (response.provider_status === 'ok') {
    discoveryCache.set(cacheKey, { value: response, expires_at: Date.now() + DISCOVERY_CACHE_TTL_MS });
  }
  return response;
}

module.exports = {
  discoverDestinations,
  locationCandidatesFromNer,
  externalPlaceFromFeature,
  HF_NER_MODEL,
  getMapboxToken,
  matchesCityName,
  parseQueryConstraints
};
