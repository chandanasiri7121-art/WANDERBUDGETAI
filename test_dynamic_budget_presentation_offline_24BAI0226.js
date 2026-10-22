import assert from 'node:assert/strict';
import { dynamicBudgetPresentation } from './frontend/src/dynamicBudgetPresentation_24BAI0226.mjs';

const presentation = dynamicBudgetPresentation({
  known_total_inr: 2062.55,
  total_status: 'partial',
  categories: [
    { code: 'ACCOMMODATION', amount_inr: 0, status: 'estimated' },
    { code: 'FOOD', amount_inr: 800, status: 'estimated' },
    { code: 'TRANSPORT', amount_inr: 1262.55, status: 'estimated' },
    { code: 'SIGHTSEEING', amount_inr: null, status: 'unavailable' }
  ]
});

assert.equal(presentation.total, 2062.55);
assert.equal(presentation.isPartial, true);
assert.equal(presentation.categories.find((category) => category.code === 'ACCOMMODATION').amount_inr, 0);
assert.equal(presentation.categories.find((category) => category.code === 'SIGHTSEEING').amount_inr, null);
assert.equal(presentation.categories.find((category) => category.code === 'CONTINGENCY').amount_inr, null);
assert.deepEqual(presentation.missingCategories, ['Attractions', 'Contingency']);
console.log('PASS dynamic budget presentation keeps dynamic totals separate and missing values unavailable');
