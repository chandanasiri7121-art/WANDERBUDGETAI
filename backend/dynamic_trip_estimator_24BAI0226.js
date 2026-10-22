const NOMINATIM_URL = process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const NOMINATIM_USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'WanderBudgetAI/1.0 (college demonstration)';
const REQUEST_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_ROUTED_STOPS = 23; // OSRM supports more waypoints; start and return use two.
const MAX_PUBLIC_NOMINATIM_STOPS = 5; // Small public-service demonstration only.
const NOMINATIM_MIN_INTERVAL_MS = 1000;
let nextNominatimRequestAt = 0;
let nominatimQueue = Promise.resolve();

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value) {
  return Math.round(number(value) * 100) / 100;
}

function coordinate(value) {
  if (!value || typeof value !== 'object') return null;
  const latitude = number(value.latitude, NaN);
  const longitude = number(value.longitude, NaN);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}

async function fetchJson(fetchImpl, url, options) {
  const response = await fetchImpl(url, options);
  if (!response?.ok) return null;
  try { return await response.json(); } catch { return null; }
}

async function pacedNominatimJson(fetchImpl, url, userAgent) {
  const request = async () => {
    const waitMs = Math.max(0, nextNominatimRequestAt - Date.now());
    if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
    nextNominatimRequestAt = Date.now() + NOMINATIM_MIN_INTERVAL_MS;
    return fetchJson(fetchImpl, url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': userAgent, Accept: 'application/json', 'Accept-Language': 'en' }
    });
  };
  const queued = nominatimQueue.then(request, request);
  nominatimQueue = queued.catch(() => undefined);
  return queued;
}

function createRoutingCache() {
  const geocodes = new Map();
  const routes = new Map();
  const get = (store, key, now = Date.now()) => {
    const entry = store.get(key);
    if (!entry || entry.expires_at <= now) { store.delete(key); return null; }
    return entry.value;
  };
  const put = (store, key, value, now = Date.now()) => store.set(key, { value, expires_at: now + CACHE_TTL_MS });
  return {
    getGeocode: (key, now) => get(geocodes, key, now), putGeocode: (key, value, now) => put(geocodes, key, value, now),
    getRoute: (key, now) => get(routes, key, now), putRoute: (key, value, now) => put(routes, key, value, now)
  };
}

const routingCache = createRoutingCache();
function normalized(value) { return String(value || '').trim().toLocaleLowerCase(); }
function featureText(feature) { return normalized([feature?.name, feature?.display_name, feature?.namedetails?.name, feature?.address?.tourism, feature?.address?.amenity, feature?.address?.historic].filter(Boolean).join(' ')); }
const GENERIC_ATTRACTION_WORDS = new Set(['and', 'the', 'with', 'tour', 'heritage', 'view', 'viewpoint', 'experience', 'attraction', 'walk', 'trip', 'visit']);
const ACTIVITY_SUFFIX = /\s+(heritage tour|guided tour|walking tour|visit)$/i;
function significantTokens(value) {
  return [...new Set(normalized(value).replace(/[^a-z0-9]+/g, ' ').split(' ').filter(token => token.length >= 3 && !GENERIC_ATTRACTION_WORDS.has(token)))];
}
function canonicalAttractionName(value) {
  return String(value || '').trim().replace(ACTIVITY_SUFFIX, '').trim();
}
function relevantFeature(feature, attractionName, destinationName, regionName, countryName) {
  const text = featureText(feature);
  const attractionTokens = significantTokens(attractionName);
  const attractionMatches = attractionTokens.filter(token => text.includes(token)).length;
  const requiredAttractionMatches = attractionTokens.length <= 2 ? attractionTokens.length : 2;
  const destination = normalized(destinationName).split(',')[0].trim();
  const region = normalized(regionName);
  const country = normalized(countryName);
  const geographicText = JSON.stringify(feature).toLocaleLowerCase();
  return Boolean(text && attractionTokens.length && attractionMatches >= requiredAttractionMatches && (!destination || geographicText.includes(destination)) && (!region || geographicText.includes(region)) && (!country || geographicText.includes(country)));
}

async function geocode(query, fetchImpl = fetch, { cache = routingCache, cacheKey = query, relevance, nominatimUrl = NOMINATIM_URL, userAgent = NOMINATIM_USER_AGENT } = {}) {
  if (!query) return null;
  const key = `nominatim:${normalized(cacheKey)}`;
  const cached = cache?.getGeocode(key);
  if (cached) return { ...cached, freshness: 'cached' };
  const params = new URLSearchParams({ q: query, format: 'jsonv2', addressdetails: '1', limit: relevance ? '5' : '1' });
  const body = await pacedNominatimJson(fetchImpl, `${nominatimUrl}?${params}`, userAgent);
  const features = Array.isArray(body) ? body : [];
  const feature = relevance ? features.find(relevance) : features[0];
  const coordinates = feature && (!relevance || relevance(feature))
    ? coordinate({ longitude: feature.lon, latitude: feature.lat })
    : null;
  const result = coordinates ? { ...coordinates, freshness: 'live request' } : null;
  if (result?.latitude !== undefined) cache?.putGeocode(key, result);
  return result;
}

async function routeRoundTrip({ startLocation, destinationLabel, fetchImpl = fetch }) {
  if (!String(startLocation || '').trim()) return { status: 'unavailable', reason: 'A starting point is required for a route estimate' };
  try {
    const [start, destination] = await Promise.all([
      geocode(startLocation, fetchImpl),
      geocode(destinationLabel, fetchImpl)
    ]);
    if (!start || !destination) return { status: 'unavailable', reason: 'Starting point or destination could not be geocoded' };
    const path = `${start.longitude},${start.latitude};${destination.longitude},${destination.latitude};${start.longitude},${start.latitude}`;
    const params = new URLSearchParams({ overview: 'false', steps: 'false' });
    const body = await fetchJson(fetchImpl, `${OSRM_URL}/route/v1/driving/${path}?${params}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const route = Array.isArray(body?.routes) ? body.routes[0] : null;
    if (!route || !Number.isFinite(Number(route.distance))) return { status: 'unavailable', reason: 'No driving route is available for this journey' };
    return {
      status: 'estimated',
      distance_km: round(Number(route.distance) / 1000),
      duration_minutes: round(Number(route.duration) / 60),
      source: 'OSRM_DRIVING',
      freshness: 'live request'
    };
  } catch {
    return { status: 'unavailable', reason: 'Routing provider is temporarily unavailable' };
  }
}

// External discovery supplies coordinates from its geocoder. Use them only for
// a read-only route preview; without verified local fare data, no transport
// price is inferred from this distance.
async function routeExternalDestination({ startLocation, destinationCoordinates, fetchImpl = fetch, cache = routingCache, osrmUrl = OSRM_URL, userAgent = NOMINATIM_USER_AGENT }) {
  if (!String(startLocation || '').trim()) return { status: 'unavailable', reason: 'A starting point is required for a route estimate', resolved_stops: [], unresolved_stops: [] };
  const destination = coordinate(destinationCoordinates);
  if (!destination) return { status: 'unavailable', reason: 'Verified destination coordinates are required for an external route preview', resolved_stops: [], unresolved_stops: [] };
  try {
    const start = await geocode(startLocation, fetchImpl, { cache, cacheKey: `start:${startLocation}`, userAgent });
    if (!start) return { status: 'unavailable', reason: 'Starting point could not be geocoded', resolved_stops: [], unresolved_stops: [] };
    const path = [start, destination, start].map(item => `${item.longitude},${item.latitude}`).join(';');
    const routeKey = `external-route:${path}`;
    const cachedRoute = cache?.getRoute(routeKey);
    if (cachedRoute) return { ...cachedRoute, freshness: 'cached' };
    const body = await fetchJson(fetchImpl, `${osrmUrl}/route/v1/driving/${path}?overview=false&steps=false`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const route = Array.isArray(body?.routes) ? body.routes[0] : null;
    if (!route || !Number.isFinite(Number(route.distance))) return { status: 'unavailable', reason: 'No driving route is available for this journey', resolved_stops: [], unresolved_stops: [] };
    const result = { status: 'estimated', distance_km: round(Number(route.distance) / 1000), duration_minutes: round(Number(route.duration) / 60), source: 'OSRM_DRIVING', freshness: 'live request', resolved_stops: [], unresolved_stops: [], attribution: '© OpenStreetMap contributors; routed by OSRM' };
    cache?.putRoute(routeKey, result);
    return result;
  } catch {
    return { status: 'unavailable', reason: 'Routing provider is temporarily unavailable', resolved_stops: [], unresolved_stops: [] };
  }
}

async function routeSelectedAttractions({ startLocation, selectedAttractions, destinationLabel, regionName, countryName, fetchImpl = fetch, cache = routingCache, nominatimUrl = NOMINATIM_URL, osrmUrl = OSRM_URL, userAgent = NOMINATIM_USER_AGENT }) {
  if (!String(startLocation || '').trim()) return { status: 'unavailable', reason: 'A starting point is required for an attraction route estimate', resolved_stops: [], unresolved_stops: [] };
  const selected = Array.isArray(selectedAttractions) ? selectedAttractions : [];
  if (!selected.length) return { status: 'unavailable', reason: 'Select at least one attraction for an attraction route estimate', resolved_stops: [], unresolved_stops: [] };
  try {
    const start = await geocode(startLocation, fetchImpl, { cache, cacheKey: `start:${startLocation}`, nominatimUrl, userAgent });
    if (!start) return { status: 'unavailable', reason: 'Starting point could not be geocoded', resolved_stops: [], unresolved_stops: selected.map(item => ({ attraction_id: item.attraction_id, name: item.name, reason: 'Route was not started' })) };
    const routingLimit = Math.min(MAX_ROUTED_STOPS, MAX_PUBLIC_NOMINATIM_STOPS);
    const routable = selected.slice(0, routingLimit);
    const excess = selected.slice(routingLimit).map(item => ({ attraction_id: item.attraction_id, name: item.name, reason: 'Public Nominatim demo limit: select at most five attractions per route' }));
    const lookedUp = await Promise.all(routable.map(async item => {
      const name = String(item.name || '').trim();
      const region = regionName || destinationLabel;
      const canonicalName = canonicalAttractionName(name);
      const queries = [...new Set([name, canonicalName].filter(Boolean))];
      let point = null;
      for (const queryName of queries) {
        point = await geocode(`${queryName}, ${region}, ${countryName}`, fetchImpl, {
          cache, cacheKey: `attraction:${queryName}|${destinationLabel}|${region}|${countryName}`, nominatimUrl, userAgent,
          relevance: feature => relevantFeature(feature, canonicalName, destinationLabel, region, countryName)
        });
        if (point) break;
      }
      return point ? { attraction_id: item.attraction_id, name, ...point } : { attraction_id: item.attraction_id, name, reason: 'No unambiguous OpenStreetMap match in the selected destination' };
    }));
    const resolved = lookedUp.filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    const unresolved = [...lookedUp.filter(item => !Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)).map(({ attraction_id, name, reason }) => ({ attraction_id, name, reason })), ...excess];
    if (!resolved.length) return { status: 'unavailable', reason: 'No selected attractions could be geocoded unambiguously', resolved_stops: [], unresolved_stops: unresolved };
    const path = [start, ...resolved, start].map(item => `${item.longitude},${item.latitude}`).join(';');
    const routeKey = `route:${path}`;
    const cachedRoute = cache?.getRoute(routeKey);
    if (cachedRoute) return { ...cachedRoute, freshness: 'cached' };
    const params = new URLSearchParams({ overview: 'false', steps: 'false' });
    const body = await fetchJson(fetchImpl, `${osrmUrl}/route/v1/driving/${path}?${params}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const osrmRoute = Array.isArray(body?.routes) ? body.routes[0] : null;
    if (!osrmRoute || !Number.isFinite(Number(osrmRoute.distance))) return { status: 'unavailable', reason: 'No driving route is available for the resolved attraction stops', resolved_stops: resolved.map(({ attraction_id, name }) => ({ attraction_id, name })), unresolved_stops: unresolved };
    const result = { status: unresolved.length ? 'partial' : 'estimated', distance_km: round(Number(osrmRoute.distance) / 1000), duration_minutes: round(Number(osrmRoute.duration) / 60), source: 'OSRM_DRIVING', freshness: 'live request', resolved_stops: resolved.map(({ attraction_id, name }) => ({ attraction_id, name })), unresolved_stops: unresolved, attribution: '© OpenStreetMap contributors; routed by OSRM' };
    cache?.putRoute(routeKey, result);
    return result;
  } catch {
    return { status: 'unavailable', reason: 'Routing provider is temporarily unavailable', resolved_stops: [], unresolved_stops: [] };
  }
}

function calculateDynamicEstimate({ costIndex, source, lastSyncedAt, trip, attractions, route }) {
  const rate = number(costIndex.exchange_rate_to_inr, 1);
  const travelers = Math.max(1, Math.floor(number(trip.travelers, 1)));
  const days = Math.max(1, Math.floor(number(trip.duration_days, 1)));
  const style = trip.travel_style === 'BUDGET' || trip.travel_style === 'LUXURY' ? trip.travel_style : 'STANDARD';
  const roomOccupancy = Math.max(1, Math.floor(number(trip.room_occupancy, 2)));
  const rooms = Math.ceil(travelers / roomOccupancy);
  const overnightStay = trip.overnight_stay === true;
  const requestedNights = Math.max(0, Math.floor(number(trip.overnight_nights, 0)));
  const accommodationRate = number(costIndex[style === 'BUDGET' ? 'accommodation_budget_night' : style === 'LUXURY' ? 'accommodation_luxury_night' : 'accommodation_standard_night']);
  const mealRate = number(costIndex[style === 'BUDGET' ? 'meal_budget_day' : style === 'LUXURY' ? 'meal_luxury_day' : 'meal_standard_day']);
  const mealsPerPersonPerDay = Math.max(0, Math.min(6, number(trip.meals_per_person_per_day, 3)));
  const overnightAmount = overnightStay ? round(requestedNights * accommodationRate * rooms * rate) : 0;
  const foodAmount = round(days * travelers * mealsPerPersonPerDay * (mealRate / 3) * rate);
  const selected = Array.isArray(attractions) ? attractions : [];
  const hasKnownTicketPrice = (item) => item?.ticket_price_inr !== null && item?.ticket_price_inr !== undefined && item.ticket_price_inr !== '' && Number.isFinite(Number(item.ticket_price_inr)) && Number(item.ticket_price_inr) >= 0;
  const pricedAttractions = selected.filter(hasKnownTicketPrice);
  const unknownAttractions = selected.filter(item => !hasKnownTicketPrice(item));
  const attractionAmount = round(pricedAttractions.reduce((sum, item) => sum + Number(item.ticket_price_inr) * travelers, 0));
  const preference = ['PUBLIC', 'CAB', 'RENTAL', 'MIXED'].includes(trip.transport_preference) ? trip.transport_preference : 'MIXED';
  let transport = { amount_inr: null, status: 'unavailable', source: 'No supported fare source', freshness: null, confidence: 'low', explanation: 'Choose public transport, cab, or mixed transport with available benchmark or routing data.' };
  if (preference === 'PUBLIC') {
    transport = { amount_inr: round(number(costIndex.transit_pass_day) * days * travelers * rate), status: 'estimated', source: source || 'destination cost benchmark', freshness: lastSyncedAt || null, confidence: 'medium', explanation: `${days} daily public-transit benchmark passes for ${travelers} traveler(s). Route distance is informational only.` };
  } else if ((preference === 'CAB' || preference === 'MIXED') && route.status === 'estimated') {
    const cabShare = preference === 'CAB' ? 1 : Math.max(0, Math.min(1, number(trip.cab_distance_share, 0.5)));
    const vehicles = Math.ceil(travelers / 4);
    const cabAmount = route.distance_km * cabShare * number(costIndex.taxi_per_km) * vehicles * rate;
    const publicAmount = preference === 'MIXED' ? number(costIndex.transit_pass_day) * days * travelers * rate * (1 - cabShare) : 0;
    transport = { amount_inr: round(cabAmount + publicAmount), status: 'estimated', source: `${route.source}; ${source || 'destination cost benchmark'}`, freshness: route.freshness, confidence: 'medium', explanation: `${round(route.distance_km * cabShare)} routed cab km, ${vehicles} shared cab(s), plus ${Math.round((1 - cabShare) * 100)}% public-transit benchmark for mixed travel.` };
  } else if (preference === 'RENTAL') {
    transport = { amount_inr: null, status: 'unavailable', source: 'No configured rental-rate provider', freshness: null, confidence: 'low', explanation: 'Rental vehicle pricing is unavailable until a dated supplier rate is supplied.' };
  } else {
    transport = { amount_inr: null, status: 'unavailable', source: route.reason || 'Routing unavailable', freshness: null, confidence: 'low', explanation: 'Cab pricing needs a routed distance; no route estimate was available.' };
  }
  const categories = [
    { code: 'ACCOMMODATION', amount_inr: overnightAmount, status: 'estimated', currency: 'INR', source: overnightStay ? (source || 'destination cost benchmark') : 'User-confirmed day trip', freshness: overnightStay ? lastSyncedAt || null : 'current input', confidence: overnightStay ? 'medium' : 'high', explanation: overnightStay ? `${requestedNights} confirmed night(s), ${rooms} room(s), occupancy ${roomOccupancy}. Benchmark, not a live hotel quote.` : 'No overnight stay selected; hotel cost is ₹0.' },
    { code: 'FOOD', amount_inr: foodAmount, status: 'estimated', currency: 'INR', source: source || 'destination cost benchmark', freshness: lastSyncedAt || null, confidence: 'medium', explanation: `${mealsPerPersonPerDay} meals/person/day using one-third of the selected style daily meal benchmark per meal.` },
    { code: 'TRANSPORT', currency: 'INR', ...transport },
    { code: 'SIGHTSEEING', amount_inr: attractionAmount, status: unknownAttractions.length ? 'partial' : 'estimated', currency: 'INR', source: 'Selected verified attraction records', freshness: lastSyncedAt || null, confidence: unknownAttractions.length ? 'low' : 'high', explanation: unknownAttractions.length ? `${unknownAttractions.length} selected attraction(s) have unknown ticket prices and are excluded from the known subtotal.` : `${pricedAttractions.length} selected attraction ticket price(s) × ${travelers} traveler(s).` }
  ];
  const knownTotal = round(categories.reduce((sum, category) => sum + (Number.isFinite(category.amount_inr) ? category.amount_inr : 0), 0));
  const incomplete = categories.some(category => category.status === 'unavailable' || category.status === 'partial');
  return { calculation_version: 'DYNAMIC_ESTIMATE_V1', currency: 'INR', route, categories, known_total_inr: knownTotal, total_status: incomplete ? 'PARTIAL_ESTIMATE' : 'ESTIMATED', disclaimer: 'This read-only dynamic estimate never changes the deterministic PostgreSQL budget or a saved trip.' };
}

function calculateExternalDynamicPreview({ trip = {}, route, attractions = [] }) {
  const overnight = trip.overnight_stay === true;
  const travelers = Math.max(1, Math.floor(number(trip.travelers, 1)));
  const selected = Array.isArray(attractions) ? attractions : [];
  const hasKnownTicketPrice = (item) => item?.ticket_price_inr !== null && item?.ticket_price_inr !== undefined && item.ticket_price_inr !== '' && Number.isFinite(Number(item.ticket_price_inr)) && Number(item.ticket_price_inr) >= 0;
  const pricedAttractions = selected.filter(hasKnownTicketPrice);
  const unknownAttractions = selected.filter(item => !hasKnownTicketPrice(item));
  const attractionAmount = pricedAttractions.length > 0
    ? round(pricedAttractions.reduce((sum, item) => sum + Number(item.ticket_price_inr) * travelers, 0))
    : null;

  const categories = [
    { code: 'ACCOMMODATION', amount_inr: overnight ? null : 0, status: overnight ? 'unavailable' : 'estimated', currency: 'INR', source: overnight ? 'No verified external accommodation rate' : 'User-confirmed day trip', freshness: overnight ? null : 'current input', confidence: overnight ? 'low' : 'high', explanation: overnight ? 'No dated, verified accommodation rate is configured for this external destination.' : 'No overnight stay selected; hotel cost is ₹0.' },
    { code: 'FOOD', amount_inr: null, status: 'unavailable', currency: 'INR', source: 'No verified external meal-price data', freshness: null, confidence: 'low', explanation: 'Food is unavailable until verified local price data is available.' },
    { code: 'TRANSPORT', amount_inr: null, status: 'unavailable', currency: 'INR', source: route?.source || 'No verified external fare data', freshness: route?.freshness || null, confidence: 'low', explanation: route?.status === 'estimated' ? 'Route distance is available, but no verified local fare is configured; no transport price was inferred.' : 'Transport is unavailable because routing or verified local fare data is unavailable.' },
    { code: 'SIGHTSEEING', amount_inr: attractionAmount, status: attractionAmount !== null ? (unknownAttractions.length ? 'partial' : 'estimated') : 'unavailable', currency: 'INR', source: selected.length ? 'Selected external attraction records' : 'No verified external attraction data', freshness: null, confidence: 'low', explanation: selected.length ? (unknownAttractions.length ? `${unknownAttractions.length} selected attraction(s) have unknown ticket prices and are excluded from the known subtotal.` : `${pricedAttractions.length} selected attraction ticket fee(s) calculated.`) : 'Attraction costs are unavailable until verified attraction records are available.' }
  ];
  return { calculation_version: 'EXTERNAL_DESTINATION_PREVIEW_V1', currency: 'INR', route, categories, known_total_inr: null, total_status: 'PARTIAL_ESTIMATE', disclaimer: 'External destination exploration only. Missing price categories are unavailable, not zero, and this preview cannot be saved as a trip.' };
}

module.exports = { calculateDynamicEstimate, calculateExternalDynamicPreview, canonicalAttractionName, createRoutingCache, routeRoundTrip, routeExternalDestination, routeSelectedAttractions };
