const assert = require('node:assert/strict');

// Test suite for external destination budget calculations (Badrinath, Kakinada, and Cataloged Abu Dhabi)
function computeExternalBudget({ external, duration_days = 3, travel_style = 'STANDARD', group_size = 2, attraction_ids = [] }) {
  const days = Math.max(1, parseInt(duration_days) || 3);
  const travelers = Math.max(1, parseInt(group_size) || 1);
  const style = (travel_style || 'STANDARD').toUpperCase();

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
    { category_code: 'ACCOMMODATION', allocated_inr: accTotal },
    { category_code: 'FOOD', allocated_inr: foodTotal },
    { category_code: 'TRANSIT', allocated_inr: transitTotal },
    { category_code: 'SIGHTSEEING', allocated_inr: attractionsCostInr },
    { category_code: 'BUFFER', allocated_inr: bufferTotal }
  ];

  return {
    total_budget_inr: totalBudgetInr,
    per_person_inr: perPersonInr,
    category_breakdown: breakdown,
    is_external: true,
    verified: false
  };
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }

// Test 1: Badrinath external calculation
test('Badrinath calculates realistic planning budget with all 5 categories and 10% buffer', () => {
  const badrinath = {
    is_external: true,
    city_name: 'Badrinath',
    region_name: 'Uttarakhand',
    country_name: 'India',
    coordinates: { longitude: 79.4938, latitude: 30.7433 },
    cost_index: {
      accommodation_standard_night: 2500,
      meal_standard_day: 800,
      transit_pass_day: 350,
      exchange_rate_to_inr: 1.0
    },
    attractions: [
      { attraction_id: 'bad_1', name: 'Badrinath Temple Sanctum', ticket_price_inr: 0 },
      { attraction_id: 'bad_2', name: 'Mana Village & Bheem Pul', ticket_price_inr: 50 }
    ]
  };

  const res = computeExternalBudget({ external: badrinath, duration_days: 4, travel_style: 'STANDARD', group_size: 2, attraction_ids: ['bad_1', 'bad_2'] });
  assert.equal(res.is_external, true);
  assert.equal(res.verified, false);
  // Rooms: ceil(2/2) = 1 room. 4 days * 2500 = 10000
  const acc = res.category_breakdown.find(c => c.category_code === 'ACCOMMODATION');
  assert.equal(acc.allocated_inr, 10000);
  // Food: 4 days * 2 travelers * 800 = 6400
  const food = res.category_breakdown.find(c => c.category_code === 'FOOD');
  assert.equal(food.allocated_inr, 6400);
  // Transit: 4 days * 2 travelers * 350 = 2800
  const transit = res.category_breakdown.find(c => c.category_code === 'TRANSIT');
  assert.equal(transit.allocated_inr, 2800);
  // Attractions: (0 + 50) * 2 = 100
  const sights = res.category_breakdown.find(c => c.category_code === 'SIGHTSEEING');
  assert.equal(sights.allocated_inr, 100);
  // Subtotal = 10000 + 6400 + 2800 + 100 = 19300. Buffer = 10% = 1930. Total = 21230.
  const buffer = res.category_breakdown.find(c => c.category_code === 'BUFFER');
  assert.equal(buffer.allocated_inr, 1930);
  assert.equal(res.total_budget_inr, 21230);
  assert.equal(res.per_person_inr, 10615);
});

// Test 2: Kakinada external calculation
test('Kakinada computes valid planning budget with domestic defaults when rates omitted', () => {
  const kakinada = {
    is_external: true,
    city_name: 'Kakinada',
    region_name: 'Andhra Pradesh',
    country_name: 'India',
    coordinates: { longitude: 82.2475, latitude: 16.9891 },
    cost_index: null
  };

  const res = computeExternalBudget({ external: kakinada, duration_days: 2, travel_style: 'STANDARD', group_size: 1 });
  assert.equal(res.is_external, true);
  assert.ok(res.total_budget_inr > 0);
  assert.equal(res.per_person_inr, res.total_budget_inr);
});

// Test 3: Currency conversion for international external destination
test('International destination converts from foreign currency to INR consistently', () => {
  const tokyo = {
    is_external: true,
    city_name: 'Tokyo',
    country_name: 'Japan',
    cost_index: {
      accommodation_standard_night: 15000,
      meal_standard_day: 4500,
      transit_pass_day: 1000,
      exchange_rate_to_inr: 0.55 // 1 JPY = 0.55 INR
    }
  };

  const res = computeExternalBudget({ external: tokyo, duration_days: 3, travel_style: 'STANDARD', group_size: 2 });
  // Acc: 3 nights * 15000 JPY * 1 room * 0.55 = 24750 INR
  const acc = res.category_breakdown.find(c => c.category_code === 'ACCOMMODATION');
  assert.equal(acc.allocated_inr, 24750);
});

// Test 4: Rejection of malformed/negative amounts
test('Negative or malformed AI values are rejected and safely fall back to positive defaults', () => {
  const badCity = {
    is_external: true,
    city_name: 'Somewhere',
    country_name: 'India',
    cost_index: {
      accommodation_standard_night: -500, // Invalid
      meal_standard_day: NaN, // Invalid
      transit_pass_day: 'free', // Invalid
      exchange_rate_to_inr: -1 // Invalid
    }
  };

  const res = computeExternalBudget({ external: badCity, duration_days: 1, travel_style: 'STANDARD', group_size: 1 });
  assert.ok(res.total_budget_inr > 0);
  for (const cat of res.category_breakdown) {
    assert.ok(Number.isFinite(cat.allocated_inr) && cat.allocated_inr >= 0, `Category ${cat.category_code} must be non-negative`);
  }
});

console.log(`\nExternal destination budget tests: All ${passed} passed | 0 failed`);
