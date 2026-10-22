const assert = require('node:assert/strict');
const { calculateDynamicEstimate, calculateExternalDynamicPreview, createRoutingCache, routeExternalDestination, routeRoundTrip, routeSelectedAttractions } = require('./backend/dynamic_trip_estimator_24BAI0226');

const costIndex = {
  exchange_rate_to_inr: 1,
  accommodation_budget_night: 1000,
  accommodation_standard_night: 2000,
  accommodation_luxury_night: 5000,
  meal_budget_day: 600,
  meal_standard_day: 900,
  meal_luxury_day: 1800,
  transit_pass_day: 100,
  taxi_per_km: 12
};
const route = { status: 'estimated', distance_km: 120, duration_minutes: 180, source: 'MAPBOX_DIRECTIONS_V5', freshness: 'mocked route' };
function estimate(trip, attractions = [], currentRoute = route) {
  return calculateDynamicEstimate({ costIndex, source: 'verified benchmark', lastSyncedAt: '2026-01-01', trip: { duration_days: 1, travelers: 2, travel_style: 'STANDARD', ...trip }, attractions, route: currentRoute });
}
let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log(`PASS ${name}`); }

(async () => {
  await test('a one-day trip has zero hotel cost until overnight is explicitly confirmed', () => {
    const result = estimate({ overnight_stay: false, overnight_nights: 9, transport_preference: 'PUBLIC' });
    const hotel = result.categories.find(item => item.code === 'ACCOMMODATION');
    assert.equal(hotel.amount_inr, 0);
    assert.match(hotel.explanation, /No overnight stay/);
  });

  await test('confirmed nights use occupancy and room count', () => {
    const result = estimate({ travelers: 5, overnight_stay: true, overnight_nights: 2, room_occupancy: 2, transport_preference: 'PUBLIC' });
    assert.equal(result.categories.find(item => item.code === 'ACCOMMODATION').amount_inr, 12000);
  });

  await test('cab cost uses supplied routed distance rather than a fixed daily distance', () => {
    const result = estimate({ travelers: 6, transport_preference: 'CAB' });
    const transport = result.categories.find(item => item.code === 'TRANSPORT');
    assert.equal(transport.amount_inr, 2880); // 120 route km × ₹12 × two shared cabs
    assert.match(transport.explanation, /120 routed cab km/);
  });

  await test('mixed transport applies only the user-confirmed cab route share', () => {
    const result = estimate({ duration_days: 2, transport_preference: 'MIXED', cab_distance_share: 0.25 });
    assert.equal(result.categories.find(item => item.code === 'TRANSPORT').amount_inr, 660);
  });

  await test('unknown attraction prices are not silently treated as free', () => {
    const result = estimate({ transport_preference: 'PUBLIC' }, [{ ticket_price_inr: 100 }, { ticket_price_inr: null }]);
    const sights = result.categories.find(item => item.code === 'SIGHTSEEING');
    assert.equal(sights.amount_inr, 200);
    assert.equal(sights.status, 'partial');
    assert.match(sights.explanation, /unknown ticket prices/);
    assert.equal(result.total_status, 'PARTIAL_ESTIMATE');
  });

  await test('rental and missing route state remain explicitly unavailable', () => {
    assert.equal(estimate({ transport_preference: 'RENTAL' }).categories.find(item => item.code === 'TRANSPORT').status, 'unavailable');
    assert.equal(estimate({ transport_preference: 'CAB' }, [], { status: 'unavailable', reason: 'No route' }).categories.find(item => item.code === 'TRANSPORT').amount_inr, null);
  });

  await test('public routing is not called without a starting point', async () => {
    let calls = 0;
    const noStart = await routeRoundTrip({ startLocation: '', destinationLabel: 'Goa, India', fetchImpl: async () => { calls += 1; } });
    assert.equal(noStart.status, 'unavailable');
    assert.equal(calls, 0);
  });

  await test('Nominatim and OSRM route parsing works with mocked provider responses', async () => {
    const responses = [
      [{ lon: '73.82', lat: '15.49' }],
      [{ lon: '74.12', lat: '15.3' }],
      { routes: [{ distance: 42000, duration: 5100 }] }
    ];
    const result = await routeRoundTrip({ startLocation: 'Goa Airport', destinationLabel: 'Goa, India', fetchImpl: async () => ({ ok: true, json: async () => responses.shift() }) });
    assert.deepEqual(result, { status: 'estimated', distance_km: 42, duration_minutes: 85, source: 'OSRM_DRIVING', freshness: 'live request' });
  });

  await test('external geocoded destination preview keeps unknown prices unavailable', async () => {
    const route = await routeExternalDestination({
      startLocation: 'Kakinada Railway Station',
      destinationCoordinates: { longitude: 82.2475, latitude: 16.9891 },
      cache: createRoutingCache(),
      fetchImpl: async () => ({ ok: true, json: async () => [{ lon: '82.24', lat: '16.98' }] })
    });
    // The mocked geocoder response is intentionally insufficient for OSRM, so the price preview must remain safe.
    const preview = calculateExternalDynamicPreview({ trip: { overnight_stay: false }, route });
    assert.equal(preview.calculation_version, 'EXTERNAL_DESTINATION_PREVIEW_V1');
    assert.equal(preview.categories.find(item => item.code === 'ACCOMMODATION').amount_inr, 0);
    assert.equal(preview.categories.find(item => item.code === 'FOOD').amount_inr, null);
    assert.equal(preview.categories.find(item => item.code === 'TRANSPORT').amount_inr, null);
    assert.equal(preview.known_total_inr, null);
  });

  await test('selected attractions route in the selected order and cache successful lookups', async () => {
    const cache = createRoutingCache();
    const responses = [
      [{ lon: '73.82', lat: '15.49' }],
      [{ name: 'Fort Aguada', display_name: 'Fort Aguada, Goa, India', lon: '73.77', lat: '15.49' }],
      [{ name: 'Basilica of Bom Jesus', display_name: 'Basilica of Bom Jesus, Goa, India', lon: '73.91', lat: '15.5' }],
      { routes: [{ distance: 55000, duration: 7200 }] }
    ];
    let calls = 0;
    const request = async () => { calls += 1; return { ok: true, json: async () => responses.shift() }; };
    const input = { startLocation: 'Goa Airport', destinationLabel: 'Goa', regionName: 'Goa', countryName: 'India', fetchImpl: request, cache, selectedAttractions: [{ attraction_id: 9, name: 'Fort Aguada' }, { attraction_id: 4, name: 'Basilica of Bom Jesus' }] };
    const first = await routeSelectedAttractions(input);
    assert.equal(first.status, 'estimated');
    assert.deepEqual(first.resolved_stops.map(stop => stop.attraction_id), [9, 4]);
    assert.equal(first.distance_km, 55);
    const second = await routeSelectedAttractions(input);
    assert.equal(second.freshness, 'cached');
    assert.equal(calls, 4);
  });

  await test('ambiguous attraction matches are excluded and produce a partial route', async () => {
    const responses = [
      [{ lon: '73.82', lat: '15.49' }],
      [{ name: 'Fort Aguada', display_name: 'Fort Aguada, Goa, India', lon: '73.77', lat: '15.49' }],
      [{ name: 'Unrelated Museum', display_name: 'Unrelated Museum, Lisbon, Portugal', lon: '-9.1', lat: '38.7' }],
      { routes: [{ distance: 18000, duration: 1800 }] }
    ];
    const result = await routeSelectedAttractions({ startLocation: 'Goa Airport', destinationLabel: 'Goa', regionName: 'Goa', countryName: 'India', cache: createRoutingCache(), fetchImpl: async () => ({ ok: true, json: async () => responses.shift() }), selectedAttractions: [{ attraction_id: 1, name: 'Fort Aguada' }, { attraction_id: 2, name: 'Museum of Goa' }] });
    assert.equal(result.status, 'partial');
    assert.deepEqual(result.resolved_stops.map(stop => stop.name), ['Fort Aguada']);
    assert.equal(result.unresolved_stops[0].attraction_id, 2);
    assert.match(result.unresolved_stops[0].reason, /unambiguous/);
  });

  await test('Basilica of Bom Jesus Heritage Tour retries a recognized suffix-free name and resolves only in Goa, India', async () => {
    const responses = [
      [{ lon: '73.82', lat: '15.49' }],
      [],
      [
        { name: 'Basilica of Bom Jesus', display_name: 'Basilica of Bom Jesus, Old Goa, India', lon: '73.91', lat: '15.5' },
        { name: 'Basilica of Bom Jesus', display_name: 'Basilica of Bom Jesus, Goa, India', lon: '73.91', lat: '15.5' }
      ],
      { routes: [{ distance: 36000, duration: 4200 }] }
    ];
    const requestedUrls = [];
    const result = await routeSelectedAttractions({ startLocation: 'Goa Airport', destinationLabel: 'Goa, India', regionName: 'Goa', countryName: 'India', cache: createRoutingCache(), fetchImpl: async (url) => { requestedUrls.push(url); return { ok: true, json: async () => responses.shift() }; }, selectedAttractions: [{ attraction_id: 19, name: 'Basilica of Bom Jesus Heritage Tour' }] });
    assert.equal(result.status, 'estimated');
    assert.equal(result.distance_km, 36);
    assert.deepEqual(result.resolved_stops.map(stop => stop.attraction_id), [19]);
    assert.equal(new URL(requestedUrls[1]).searchParams.get('q'), 'Basilica of Bom Jesus Heritage Tour, Goa, India');
    assert.equal(new URL(requestedUrls[2]).searchParams.get('q'), 'Basilica of Bom Jesus, Goa, India');
  });

  console.log(`Dynamic trip estimator offline tests: ${passed} passed | 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
