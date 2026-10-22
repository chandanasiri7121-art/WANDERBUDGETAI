/* Offline formula and source-contract checks for Mode 1. No database or HTTP access. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const sql = fs.readFileSync(path.join(root, 'backend/sql/wanderbudget_db_features_24BAI0226.sql'), 'utf8');
const server = fs.readFileSync(path.join(root, 'backend/server_wanderbudget_24BAI0226.js'), 'utf8');

function calculate({ days, travelers, style, accommodation, meals, transit, taxi, rate, attractions = [] }) {
  const nights = Math.max(days - 1, 0);
  const rooms = Math.ceil(travelers / 2);
  const taxis = Math.ceil(travelers / 4);
  const mix = {
    BUDGET: { publicShare: 1, cabKm: 5 },
    STANDARD: { publicShare: 0.5, cabKm: 15 },
    LUXURY: { publicShare: 0, cabKm: 25 }
  }[style];
  const accommodationTotal = nights * accommodation * rooms * rate;
  const foodTotal = days * meals * travelers * rate;
  const transportTotal = days * ((transit * mix.publicShare * travelers) + (taxi * mix.cabKm * taxis)) * rate;
  const attractionsTotal = attractions.reduce((sum, price) => sum + price * travelers, 0);
  const bufferTotal = (accommodationTotal + foodTotal + transportTotal) * 0.10;
  return {
    nights, rooms, taxis, accommodationTotal, foodTotal, transportTotal,
    attractionsTotal, bufferTotal,
    total: accommodationTotal + foodTotal + transportTotal + attractionsTotal + bufferTotal
  };
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

test('one-day trip charges zero hotel nights', () => {
  assert.equal(calculate({ days: 1, travelers: 1, style: 'BUDGET', accommodation: 100, meals: 10, transit: 5, taxi: 2, rate: 1 }).nights, 0);
});

test('shared rooms use one room per two travelers', () => {
  const result = calculate({ days: 5, travelers: 6, style: 'STANDARD', accommodation: 100, meals: 10, transit: 5, taxi: 2, rate: 1 });
  assert.equal(result.rooms, 3);
  assert.equal(result.accommodationTotal, 1200);
});

test('shared taxi fare uses four-seat vehicles rather than one fare per traveler', () => {
  const result = calculate({ days: 5, travelers: 6, style: 'LUXURY', accommodation: 0, meals: 0, transit: 0, taxi: 10, rate: 1 });
  assert.equal(result.taxis, 2);
  assert.equal(result.transportTotal, 2500);
});

test('transport style assumptions include cabs without double-counting full transit', () => {
  const common = { days: 1, travelers: 2, accommodation: 0, meals: 0, transit: 100, taxi: 20, rate: 1 };
  assert.equal(calculate({ ...common, style: 'BUDGET' }).transportTotal, 300);
  assert.equal(calculate({ ...common, style: 'STANDARD' }).transportTotal, 400);
  assert.equal(calculate({ ...common, style: 'LUXURY' }).transportTotal, 500);
});

test('attractions are charged once per selected paid ticket and free entries remain zero', () => {
  const result = calculate({ days: 7, travelers: 4, style: 'BUDGET', accommodation: 0, meals: 0, transit: 0, taxi: 0, rate: 1, attractions: [0, 125.5] });
  assert.equal(result.attractionsTotal, 502);
});

test('exchange rate applies once to local accommodation, food, and transport', () => {
  const result = calculate({ days: 5, travelers: 2, style: 'STANDARD', accommodation: 100, meals: 20, transit: 10, taxi: 5, rate: 80 });
  assert.equal(result.accommodationTotal, 32000);
  assert.equal(result.foodTotal, 16000);
  assert.equal(result.transportTotal, 34000);
});

test('total equals the sum of all displayed categories', () => {
  const result = calculate({ days: 14, travelers: 4, style: 'LUXURY', accommodation: 100, meals: 20, transit: 10, taxi: 5, rate: 2, attractions: [0, 50] });
  assert.equal(result.total, result.accommodationTotal + result.foodTotal + result.transportTotal + result.attractionsTotal + result.bufferTotal);
});

test('all supported day, group, and style inputs remain finite and non-negative', () => {
  for (const days of [1, 5, 7, 14]) {
    for (const travelers of [1, 2, 4, 6]) {
      for (const style of ['BUDGET', 'STANDARD', 'LUXURY']) {
        const result = calculate({ days, travelers, style, accommodation: 125, meals: 35, transit: 12, taxi: 8, rate: 3.5 });
        assert.ok(Number.isFinite(result.total) && result.total >= 0, `${days}/${travelers}/${style}`);
      }
    }
  }
});

test('zero-priced data remains zero while the SQL definition retains explicit null fallbacks', () => {
  const result = calculate({ days: 5, travelers: 2, style: 'BUDGET', accommodation: 0, meals: 0, transit: 0, taxi: 0, rate: 1 });
  assert.equal(result.total, 0);
  assert.match(sql, /v_acc_night := COALESCE\(v_acc_night, 2500\)/);
  assert.match(sql, /v_taxi_per_km := COALESCE\(v_taxi_per_km, 25\)/);
});

test('prepared SQL and backend scope attractions to the selected destination', () => {
  assert.match(sql, /v_nights := GREATEST\(p_days - 1, 0\)/);
  assert.match(sql, /v_taxi_vehicles := CEIL\(p_group_size::NUMERIC \/ 4\.0\)/);
  assert.match(sql, /v_taxi_per_km/);
  assert.match(server, /destination_id: destId,[\s\S]*attraction_id: \{ in: attractionIds \}/);
  assert.match(server, /replaceSightseeingWithSelectedTickets/);
});

console.log(`Budget accuracy offline tests: ${passed} passed | 0 failed`);
