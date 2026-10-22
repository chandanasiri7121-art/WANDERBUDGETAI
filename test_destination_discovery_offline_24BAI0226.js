const assert = require('assert');
const fs = require('fs');
const {
  discoverDestinations,
  locationCandidatesFromNer,
  externalPlaceFromFeature,
  matchesCityName,
  parseQueryConstraints
} = require('./backend/destination_discovery_24BAI0226');

const env = { HUGGINGFACE_API_TOKEN: 'hf_test_token', MAPBOX_ACCESS_TOKEN: 'mapbox_test_token' };
const response = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

function mapboxFeature(city, country, coordinates = [82.23, 16.99], region = null) {
  let defaultRegion = region;
  if (!defaultRegion) {
    if (city === 'Hyderabad') defaultRegion = 'Telangana';
    else if (['Kakinada', 'Visakhapatnam', 'Vijayawada'].includes(city)) defaultRegion = 'Andhra Pradesh';
    else if (['Bengaluru', 'Bangalore'].includes(city)) defaultRegion = 'Karnataka';
    else if (city === 'Mumbai') defaultRegion = 'Maharashtra';
    else if (city === 'Chennai') defaultRegion = 'Tamil Nadu';
  }
  return {
    id: `${city}-${country}`,
    geometry: { type: 'Point', coordinates },
    properties: {
      name: city,
      feature_type: 'place',
      place_formatted: `${defaultRegion ? `${defaultRegion}, ` : ''}${country}`,
      coordinates: { longitude: coordinates[0], latitude: coordinates[1] },
      context: {
        country: { name: country, country_code: country === 'India' ? 'in' : country === 'Japan' ? 'jp' : country === 'France' ? 'fr' : 'sg' },
        ...(defaultRegion ? { region: { name: defaultRegion } } : {})
      }
    }
  };
}

async function run() {
  const {
    safeAttractionsFor,
    selectionStateFor,
    destinationDropdownGroups,
    externalPlacesFromDiscovery,
    isCurrentSearchRequest
  } = await import('./frontend/src/destinationSelection_24BAI0226.mjs');

  const vizianagaramSpot = { attraction_id: 900, destination_id: 9, name: 'Vizianagaram Fort' };
  const buenosAiresExternal = { city_name: 'Buenos Aires', country_name: 'Argentina', is_external: true, attractions: [vizianagaramSpot] };
  assert.deepStrictEqual(safeAttractionsFor(buenosAiresExternal), []);

  const goa = {
    destination_id: 1,
    city_name: 'Goa',
    country_name: 'India',
    attractions: [{ attraction_id: 101, destination_id: 1, name: 'Goa Beach' }, vizianagaramSpot]
  };
  assert.deepStrictEqual(safeAttractionsFor(goa).map(attraction => attraction.name), ['Goa Beach']);

  const fastSwitch = selectionStateFor({
    destination_id: 2,
    city_name: 'Manali',
    attractions: [{ attraction_id: 201, destination_id: 2, name: 'Manali Mall Road' }, vizianagaramSpot]
  });
  assert.deepStrictEqual(fastSwitch.attractionIds, [201]);
  assert.strictEqual(selectionStateFor(buenosAiresExternal).canUseDatabaseEstimator, false);
  assert.strictEqual(selectionStateFor(goa).canUseDatabaseEstimator, true);

  const dropdownGroups = destinationDropdownGroups('', [goa], [
    { external_id: 'tokyo-jp', city_name: 'Tokyo', country_name: 'Japan', full_name: 'Tokyo, Japan', is_external: true }
  ]);
  assert.strictEqual(dropdownGroups.verified[0].city_name, 'Goa');
  assert.strictEqual(dropdownGroups.external[0].city_name, 'Tokyo');
  assert.strictEqual(destinationDropdownGroups('Goa, India', [goa], []).verified[0].city_name, 'Goa');

  assert.deepStrictEqual(
    externalPlacesFromDiscovery({
      results: [
        { city_name: 'Goa', country_name: 'India' },
        { city_name: 'Tokyo', country_name: 'Japan', external_id: 'tokyo' }
      ]
    }, [goa]).map(place => place.city_name),
    ['Tokyo']
  );
  assert.strictEqual(externalPlacesFromDiscovery({ malformed: true }, [goa]).length, 0);
  assert.strictEqual(isCurrentSearchRequest(2, 2), true);
  assert.strictEqual(isCurrentSearchRequest(1, 2), false);

  const appSource = fs.readFileSync('./frontend/src/App_WanderBudget_24BAI0226.jsx', 'utf8');
  assert(appSource.includes('onChange={(event) => handleBuilderDestinationSearch(event.target.value)}'), 'Mode 1 input must invoke discovery from the dropdown');
  assert(appSource.includes("localStorage.getItem('wb_token')"), 'Mode 1 must retain session authentication while token state initializes');
  assert(appSource.includes('setBuilderDiscoveryLoading(false);'), 'Mode 1 must clear loading on empty queries');

  // NER candidate parsing
  assert.deepStrictEqual(locationCandidatesFromNer([
    { entity_group: 'LOC', word: 'Bengaluru', score: 0.99 },
    { entity: 'B-LOC', word: 'Chennai', score: 0.91 },
    { entity_group: 'ORG', word: 'Ignore', score: 0.99 }
  ]), ['Bengaluru', 'Chennai']);
  assert.deepStrictEqual(locationCandidatesFromNer([
    { entity: 'B-LOC', word: 'Bang', score: 0.99, start: 0, end: 4 },
    { entity: 'I-LOC', word: '##alore', score: 0.99, start: 4, end: 10 }
  ]), ['Bangalore']);

  // Conversational sentence with multiple cities
  const multiple = await discoverDestinations({
    query: 'Compare Bengaluru and Chennai', env,
    fetchImpl: async (url, options) => {
      if (options.method === 'POST') return response([
        { entity_group: 'LOC', word: 'Bengaluru', score: 0.99 },
        { entity_group: 'LOC', word: 'Chennai', score: 0.98 }
      ]);
      const q = new URL(url).searchParams.get('q');
      if (q && q.includes('Bengaluru')) return response({ features: [mapboxFeature('Bengaluru', 'India')] });
      if (q && q.includes('Chennai')) return response({ features: [mapboxFeature('Chennai', 'India')] });
      return response({ features: [mapboxFeature('Bengaluru', 'India'), mapboxFeature('Chennai', 'India')] });
    }
  });
  assert.strictEqual(multiple.transformer_used, true);
  assert.strictEqual(multiple.results.length, 2);

  // 1. Mandatory regression cities:
  // Kakinada -> Kakinada, Andhra Pradesh, India
  // Visakhapatnam -> Visakhapatnam, Andhra Pradesh, India
  // Hyderabad -> Hyderabad, Telangana, India
  // Tokyo -> Tokyo, Japan
  // Paris -> Paris, France
  const regressionCases = [
    { query: 'Kakinada', city: 'Kakinada', region: 'Andhra Pradesh', country: 'India', full: 'Kakinada, Andhra Pradesh, India' },
    { query: 'Visakhapatnam', city: 'Visakhapatnam', region: 'Andhra Pradesh', country: 'India', full: 'Visakhapatnam, Andhra Pradesh, India' },
    { query: 'Hyderabad', city: 'Hyderabad', region: 'Telangana', country: 'India', full: 'Hyderabad, Telangana, India' },
    { query: 'Tokyo', city: 'Tokyo', region: null, country: 'Japan', full: 'Tokyo, Japan' },
    { query: 'Paris', city: 'Paris', region: null, country: 'France', full: 'Paris, France' }
  ];

  for (const { query, city, region, country, full } of regressionCases) {
    const found = await discoverDestinations({
      query, env,
      fetchImpl: async () => response({ features: [mapboxFeature(city, country, [82.23, 16.99], region)] })
    });
    assert.strictEqual(found.results.length, 1, `Must find city for ${query}`);
    assert.strictEqual(found.results[0].city_name, city);
    assert.strictEqual(found.results[0].country_name, country);
    if (region) assert.strictEqual(found.results[0].region_name, region);
    assert.strictEqual(found.results[0].full_name, full);
    assert.strictEqual(found.results[0].is_external, true);
    assert.strictEqual(found.results[0].destination_id, null);
    assert.strictEqual(found.results[0].verified, false);
  }

  // 2. Reject state-only results when searching for a city:
  // Mapbox returns a region feature for "Andhra Pradesh"
  const stateFeature = {
    id: 'region.12345',
    properties: {
      name: 'Andhra Pradesh',
      feature_type: 'region',
      context: { country: { name: 'India', country_code: 'in' } },
      coordinates: { longitude: 80.0, latitude: 16.0 }
    }
  };
  assert.strictEqual(externalPlaceFromFeature(stateFeature, 'state-test', 'Kakinada'), null, 'State feature must be rejected');

  // 3. Reject unrelated foreign locations:
  // Mapbox returns Walungu in Democratic Republic of the Congo for a Kakinada search
  const walunguFeature = {
    id: 'place.drc.walungu',
    properties: {
      name: 'Walungu',
      feature_type: 'place',
      context: {
        country: { name: 'Democratic Republic of the Congo', country_code: 'cd' },
        region: { name: 'South Kivu' }
      },
      coordinates: { longitude: 28.6, latitude: -2.6 }
    }
  };
  assert.strictEqual(externalPlaceFromFeature(walunguFeature, 'walungu-test', 'Kakinada'), null, 'Unrelated DRC feature must be rejected');

  // 4. Mixed response test: Mapbox returns Andhra Pradesh (state), Walungu (DRC), and Kakinada (city).
  // Only Kakinada must be accepted!
  const mixedSearch = await discoverDestinations({
    query: 'Kakinada', env,
    fetchImpl: async () => response({
      features: [
        stateFeature,
        walunguFeature,
        mapboxFeature('Kakinada', 'India', [82.23, 16.99], 'Andhra Pradesh')
      ]
    })
  });
  assert.strictEqual(mixedSearch.results.length, 1, 'Only genuine city match must be accepted');
  assert.strictEqual(mixedSearch.results[0].city_name, 'Kakinada');
  assert.strictEqual(mixedSearch.results[0].country_name, 'India');
  assert.strictEqual(mixedSearch.results[0].region_name, 'Andhra Pradesh');

  // 5. Geographic constraints enforcement:
  // "Kakinada, Andhra Pradesh, India" must reject any non-Indian or non-AP result
  const constraints = parseQueryConstraints('Kakinada, Andhra Pradesh, India');
  assert.strictEqual(constraints.city, 'Kakinada');
  assert.strictEqual(constraints.region, 'Andhra Pradesh');
  assert.strictEqual(constraints.country, 'India');

  const kakinadaFull = await discoverDestinations({
    query: 'Kakinada, Andhra Pradesh, India', env,
    fetchImpl: async () => response({ features: [mapboxFeature('Kakinada', 'India', [82.23, 16.99], 'Andhra Pradesh')] })
  });
  assert.strictEqual(kakinadaFull.results[0].city_name, 'Kakinada');
  assert.strictEqual(kakinadaFull.results[0].region_name, 'Andhra Pradesh');
  assert.strictEqual(kakinadaFull.results[0].country_name, 'India');
  assert.strictEqual(kakinadaFull.results[0].full_name, 'Kakinada, Andhra Pradesh, India');

  // 6. Switching test between stored destination (Goa) and external destination (Kakinada) and back
  const kakinadaExternal = kakinadaFull.results[0];
  const stateStored = selectionStateFor(goa);
  assert.strictEqual(stateStored.canUseDatabaseEstimator, true);
  assert.strictEqual(stateStored.destination.destination_id, 1);
  assert.deepStrictEqual(stateStored.attractionIds, [101]);

  const stateExternal = selectionStateFor(kakinadaExternal);
  assert.strictEqual(stateExternal.canUseDatabaseEstimator, false);
  assert.strictEqual(stateExternal.destination.destination_id, null);
  assert.deepStrictEqual(stateExternal.attractionIds, []);

  const stateSwitchedBack = selectionStateFor(goa);
  assert.strictEqual(stateSwitchedBack.canUseDatabaseEstimator, true);
  assert.strictEqual(stateSwitchedBack.destination.destination_id, 1);
  assert.deepStrictEqual(stateSwitchedBack.attractionIds, [101]);

  // 7. Provider rate limiting (HTTP 429) test
  const rateLimited = await discoverDestinations({
    query: 'Tokyo, Japan', env,
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ message: 'Rate limit exceeded' }) })
  });
  assert.strictEqual(rateLimited.provider_status, 'rate_limited');
  assert.deepStrictEqual(rateLimited.results, []);

  // 8. Provider server error (HTTP 500) test
  const serverError = await discoverDestinations({
    query: 'Paris, France', env,
    fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({ message: 'Server error' }) })
  });
  assert.strictEqual(serverError.provider_status, 'unavailable');
  assert.deepStrictEqual(serverError.results, []);

  // 9. Mapbox v5 array context test
  const mapboxV5Feature = {
    id: 'place.kakinada',
    text: 'Kakinada',
    place_name: 'Kakinada, Andhra Pradesh, India',
    geometry: { type: 'Point', coordinates: [82.23, 16.99] },
    context: [
      { id: 'region.123', text: 'Andhra Pradesh' },
      { id: 'country.456', text: 'India', short_code: 'in' }
    ]
  };
  const parsedV5 = externalPlaceFromFeature(mapboxV5Feature, 'v5-test', 'Kakinada');
  assert.strictEqual(parsedV5.city_name, 'Kakinada');
  assert.strictEqual(parsedV5.region_name, 'Andhra Pradesh');
  assert.strictEqual(parsedV5.country_name, 'India');
  assert.strictEqual(parsedV5.country_code, 'IN');
  assert.strictEqual(parsedV5.full_name, 'Kakinada, Andhra Pradesh, India');
  assert.deepStrictEqual(parsedV5.coordinates, { longitude: 82.23, latitude: 16.99 });

  // 10. Mapbox v6 real-world format test where place_formatted only contains context
  const mapboxV6Feature = {
    id: 'poi.kakinada',
    properties: {
      name: 'Kakinada',
      feature_type: 'place',
      place_formatted: 'Andhra Pradesh, India',
      coordinates: { longitude: 82.23, latitude: 16.99 },
      context: {
        country: { name: 'India', country_code: 'in' },
        region: { name: 'Andhra Pradesh' }
      }
    }
  };
  const parsedV6 = externalPlaceFromFeature(mapboxV6Feature, 'v6-test', 'Kakinada');
  assert.strictEqual(parsedV6.city_name, 'Kakinada');
  assert.strictEqual(parsedV6.region_name, 'Andhra Pradesh');
  assert.strictEqual(parsedV6.country_name, 'India');
  assert.strictEqual(parsedV6.full_name, 'Kakinada, Andhra Pradesh, India');

  // Dropdown multi-term and token-based search matching
  const v6Dropdown = destinationDropdownGroups('Kakinada, Andhra Pradesh', [], [parsedV6]);
  assert.strictEqual(v6Dropdown.external.length, 1);
  assert.strictEqual(v6Dropdown.external[0].city_name, 'Kakinada');
  const v6NoCommaDropdown = destinationDropdownGroups('Kakinada India', [], [parsedV6]);
  assert.strictEqual(v6NoCommaDropdown.external.length, 1);

  // Invalid coordinates rejected
  assert.strictEqual(externalPlaceFromFeature({ properties: { name: 'Kakinada', context: { country: { name: 'India' } } } }, 'missing-coordinate'), null);
  assert.strictEqual(externalPlaceFromFeature({ properties: { name: 'Kakinada', context: { country: { name: 'India' } }, coordinates: { longitude: 200, latitude: 16.99 } } }, 'invalid-lon'), null);
  assert.strictEqual(externalPlaceFromFeature({ properties: { name: 'Kakinada', context: { country: { name: 'India' } }, coordinates: { longitude: 82.23, latitude: 95 } } }, 'invalid-lat'), null);

  // Empty Mapbox response handled properly (returns no_match and empty array)
  const emptySearch = await discoverDestinations({
    query: 'NonexistentPlace12345', env,
    fetchImpl: async () => response({ features: [] })
  });
  assert.strictEqual(emptySearch.provider_status, 'no_match');
  assert.deepStrictEqual(emptySearch.results, []);

  // Request timeout handled
  const timeout = await discoverDestinations({
    query: 'Kochi', env,
    fetchImpl: async () => { throw new Error('request timed out'); }
  });
  assert.deepStrictEqual(timeout.results, []);

  // City matching aliases and tolerance
  assert.strictEqual(matchesCityName('Bangalore', 'Bengaluru'), true);
  assert.strictEqual(matchesCityName('Bengaluru', 'Bangalore'), true);
  assert.strictEqual(matchesCityName('Kakinada Urban', 'Kakinada'), true);
  assert.strictEqual(matchesCityName('Kakinadha', 'Kakinada'), true);
  assert.strictEqual(matchesCityName('Badrinathpuri', 'Badrinath'), true);
  assert.strictEqual(matchesCityName('Badrinath', 'Badrinathpuri'), true);
  assert.strictEqual(matchesCityName('Walungu', 'Kakinada'), false);
  assert.strictEqual(matchesCityName('Andhra Pradesh', 'Kakinada'), false);

  // Badrinath Mapbox resolution
  const badrinathFeature = {
    id: 'place.badrinath',
    properties: {
      name: 'Badrinathpuri',
      feature_type: 'place',
      place_formatted: 'Joshimath, Chamoli, Uttarakhand, India',
      coordinates: { longitude: 79.49149, latitude: 30.746988 },
      context: {
        country: { name: 'India', country_code: 'in' },
        region: { name: 'Uttarakhand' }
      }
    }
  };
  const badrinathResolved = externalPlaceFromFeature(badrinathFeature, 'badrinath-test', 'Badrinath');
  assert.ok(badrinathResolved, 'Badrinathpuri feature must match Badrinath query');
  assert.strictEqual(badrinathResolved.city_name, 'Badrinathpuri');
  assert.strictEqual(badrinathResolved.region_name, 'Uttarakhand');
  assert.strictEqual(badrinathResolved.country_name, 'India');
  assert.strictEqual(badrinathResolved.is_external, true);
  assert.strictEqual(badrinathResolved.destination_id, null);
  assert.deepStrictEqual(badrinathResolved.coordinates, { longitude: 79.49149, latitude: 30.746988 });

  const badrinathDiscovery = await discoverDestinations({
    query: 'Badrinath', env,
    fetchImpl: async () => response({ features: [badrinathFeature] })
  });
  assert.strictEqual(badrinathDiscovery.results.length, 1);
  assert.strictEqual(badrinathDiscovery.results[0].city_name, 'Badrinathpuri');
  assert.strictEqual(badrinathDiscovery.results[0].full_name, 'Badrinathpuri, Uttarakhand, India');

  // Verify the replacement navigation remains in the unified trip builder.
  // The old external-preview CTA was intentionally removed to avoid duplicate
  // destination-selection panels.
  assert(appSource.includes('AI-Generated Overview • Supplementary Planning Reference'), 'AI description must be clearly labeled');
  assert(appSource.includes('Estimated Benchmark Source:'), 'AI prices must not be labeled live verified');
  assert(appSource.includes('Target Destination'), 'Unified trip builder must retain destination selection');
  assert(appSource.includes('handleContinueToTripEstimator(selectedDestination)'), 'Selection navigation must invoke the trip-estimator handler');
  assert(appSource.includes('is_external'), 'External places must remain distinguished from database destinations');

  console.log('Destination discovery offline tests: All 26 passed | 0 failed');
}

run().catch(err => {
  console.error('Destination discovery offline tests failed:', err);
  process.exitCode = 1;
});
