const REQUIRED_CATEGORIES = [
  ['ACCOMMODATION', 'Accommodation'],
  ['FOOD', 'Food'],
  ['TRANSPORT', 'Transport'],
  ['SIGHTSEEING', 'Attractions'],
  ['CONTINGENCY', 'Contingency']
];

const finiteAmount = (value) => value === null || value === undefined || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);

// Keep response interpretation in one place so a missing value is never presented as ₹0.
export function dynamicBudgetPresentation(estimate) {
  const byCode = new Map((estimate?.categories || []).map((category) => [category.code, category]));
  const categories = REQUIRED_CATEGORIES.map(([code, label]) => {
    const category = byCode.get(code);
    if (!category) {
      return {
        code,
        label,
        amount_inr: null,
        status: 'unavailable',
        source: 'Not returned by the dynamic estimator',
        freshness: null,
        confidence: 'unknown',
        explanation: 'No sourced dynamic amount is available for this category.'
      };
    }
    return { ...category, label, amount_inr: finiteAmount(category.amount_inr) };
  });

  const missingCategories = categories.filter((category) => category.amount_inr === null || category.status === 'unavailable').map((category) => category.label);
  const total = finiteAmount(estimate?.known_total_inr);
  const isPartial = estimate?.total_status === 'partial' || total === null || missingCategories.length > 0;

  return { categories, total, missingCategories, isPartial };
}
