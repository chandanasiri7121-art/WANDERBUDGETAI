# DBMS Feature Demonstration: WanderBudget AI

**Course:** BCSE302P Database Systems Lab  
**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Slot:** L25+L26 | **Faculty In-Charge:** Dr. V. SIVAKUMAR  

---

## 1. Stored Procedure / Function: `sp_calculate_trip_budget`

### PL/pgSQL Implementation:
```sql
CREATE OR REPLACE FUNCTION sp_calculate_trip_budget(
    p_destination_id INT,
    p_days INT,
    p_style VARCHAR,
    p_group_size INT
)
RETURNS TABLE (
    category_code VARCHAR,
    allocated_inr NUMERIC,
    daily_rate_inr NUMERIC,
    calculation_basis TEXT
) AS $$
DECLARE
    v_acc_night NUMERIC;
    v_meal_day NUMERIC;
    v_transit_day NUMERIC;
    v_rate NUMERIC;
    v_rooms INT;
BEGIN
    -- 1. Fetch benchmark cost of living index
    SELECT 
        CASE 
            WHEN UPPER(p_style) = 'BUDGET' THEN accommodation_budget_night
            WHEN UPPER(p_style) = 'LUXURY' THEN accommodation_luxury_night
            ELSE accommodation_standard_night
        END,
        CASE 
            WHEN UPPER(p_style) = 'BUDGET' THEN meal_budget_day
            WHEN UPPER(p_style) = 'LUXURY' THEN meal_luxury_day
            ELSE meal_standard_day
        END,
        transit_pass_day,
        exchange_rate_to_inr
    INTO v_acc_night, v_meal_day, v_transit_day, v_rate
    FROM cost_of_living_indices
    WHERE destination_id = p_destination_id;

    -- Defaults if null
    v_acc_night := COALESCE(v_acc_night, 2500);
    v_meal_day := COALESCE(v_meal_day, 1200);
    v_transit_day := COALESCE(v_transit_day, 400);
    v_rate := COALESCE(v_rate, 1.0);

    -- Rooms required (2 persons per room)
    v_rooms := CEIL(p_group_size::NUMERIC / 2.0);

    -- Category 1: ACCOMMODATION
    category_code := 'ACCOMMODATION';
    allocated_inr := ROUND(p_days * v_acc_night * v_rate * v_rooms, 2);
    daily_rate_inr := ROUND(v_acc_night * v_rate, 2);
    calculation_basis := p_days || ' nights @ ' || daily_rate_inr || ' INR/night for ' || v_rooms || ' room(s)';
    RETURN NEXT;

    -- Category 2: FOOD
    category_code := 'FOOD';
    allocated_inr := ROUND(p_days * v_meal_day * v_rate * p_group_size, 2);
    daily_rate_inr := ROUND(v_meal_day * v_rate, 2);
    calculation_basis := p_days || ' days @ ' || daily_rate_inr || ' INR/day for ' || p_group_size || ' person(s)';
    RETURN NEXT;

    -- Category 3: TRANSIT
    category_code := 'TRANSIT';
    allocated_inr := ROUND(p_days * v_transit_day * v_rate * p_group_size, 2);
    daily_rate_inr := ROUND(v_transit_day * v_rate, 2);
    calculation_basis := p_days || ' days local transit pass for ' || p_group_size || ' person(s)';
    RETURN NEXT;

    -- Category 4: SIGHTSEEING
    category_code := 'SIGHTSEEING';
    allocated_inr := ROUND(p_days * 1000 * p_group_size, 2);
    daily_rate_inr := 1000;
    calculation_basis := 'Estimated ticket & entrance fees for selected itinerary attractions';
    RETURN NEXT;

    -- Category 5: BUFFER
    category_code := 'BUFFER';
    allocated_inr := ROUND((p_days * (v_acc_night * v_rooms + (v_meal_day + v_transit_day) * p_group_size) * v_rate) * 0.10, 2);
    daily_rate_inr := ROUND(allocated_inr / p_days, 2);
    calculation_basis := '10% Emergency contingency & currency fluctuation buffer';
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
```

### Execution Example & Output:
```sql
SELECT * FROM sp_calculate_trip_budget(1, 5, 'STANDARD', 2);
```
| category_code | allocated_inr | daily_rate_inr | calculation_basis |
| :--- | :---: | :---: | :--- |
| **ACCOMMODATION** | 35000.00 | 7000.00 | 5 nights @ 7000.00 INR/night for 1 room(s) |
| **FOOD** | 22500.00 | 2250.00 | 5 days @ 2250.00 INR/day for 2 person(s) |
| **TRANSIT** | 7500.00 | 750.00 | 5 days local transit pass for 2 person(s) |
| **SIGHTSEEING** | 10000.00 | 1000.00 | Estimated ticket & entrance fees for selected itinerary attractions |
| **BUFFER** | 6500.00 | 1300.00 | 10% Emergency contingency & currency fluctuation buffer |

---

## 2. Database Trigger: `trg_check_budget_overrun`

### Trigger & Function Implementation:
```sql
CREATE OR REPLACE FUNCTION fn_check_budget_overrun()
RETURNS TRIGGER AS $$
DECLARE
    v_trip_id INT;
    v_cat_id INT;
    v_allocated NUMERIC;
    v_spent NUMERIC;
    v_pct NUMERIC;
    v_trip_total_budget NUMERIC;
    v_trip_total_spent NUMERIC;
    v_trip_pct NUMERIC;
BEGIN
    v_trip_id := NEW.trip_id;
    v_cat_id := NEW.category_id;

    -- 1. Re-calculate category spent amount
    SELECT COALESCE(SUM(amount_inr), 0)
    INTO v_spent
    FROM trip_expenses
    WHERE trip_id = v_trip_id AND category_id = v_cat_id;

    UPDATE trip_budget_breakdowns
    SET spent_amount_inr = v_spent
    WHERE trip_id = v_trip_id AND category_id = v_cat_id;

    -- 2. Inspect category budget threshold
    SELECT allocated_amount_inr INTO v_allocated
    FROM trip_budget_breakdowns
    WHERE trip_id = v_trip_id AND category_id = v_cat_id;

    IF v_allocated > 0 THEN
        v_pct := (v_spent / v_allocated) * 100.0;
        IF v_pct >= 100.0 THEN
            INSERT INTO budget_alerts (trip_id, category_id, alert_type, message, threshold_pct, created_at)
            VALUES (
                v_trip_id, 
                v_cat_id, 
                'BUDGET_EXCEEDED', 
                'Critical Alert: Category spending (' || v_spent || ' INR) has exceeded 100% of allocated budget (' || v_allocated || ' INR)!',
                v_pct,
                NOW()
            );
        ELSIF v_pct >= 80.0 THEN
            INSERT INTO budget_alerts (trip_id, category_id, alert_type, message, threshold_pct, created_at)
            VALUES (
                v_trip_id, 
                v_cat_id, 
                'WARNING_80_PERCENT', 
                'Warning Alert: Category spending has reached ' || ROUND(v_pct, 1) || '% of allocated budget.',
                v_pct,
                NOW()
            );
        END IF;
    END IF;

    -- 3. Update Trip Total Spent
    SELECT COALESCE(SUM(amount_inr), 0) INTO v_trip_total_spent
    FROM trip_expenses
    WHERE trip_id = v_trip_id;

    UPDATE trips
    SET total_spent_inr = v_trip_total_spent
    WHERE trip_id = v_trip_id;

    -- 4. Check Trip Total Overrun
    SELECT total_budget_inr INTO v_trip_total_budget
    FROM trips WHERE trip_id = v_trip_id;

    IF v_trip_total_budget > 0 THEN
        v_trip_pct := (v_trip_total_spent / v_trip_total_budget) * 100.0;
        IF v_trip_pct >= 100.0 THEN
            INSERT INTO budget_alerts (trip_id, category_id, alert_type, message, threshold_pct, created_at)
            VALUES (
                v_trip_id, 
                NULL, 
                'TRIP_OVERRUN', 
                'CRITICAL: Overall trip spending (' || v_trip_total_spent || ' INR) has crossed total trip budget (' || v_trip_total_budget || ' INR)!',
                v_trip_pct,
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_budget_overrun ON trip_expenses;
CREATE TRIGGER trg_check_budget_overrun
AFTER INSERT OR UPDATE ON trip_expenses
FOR EACH ROW
EXECUTE FUNCTION fn_check_budget_overrun();
```

---

## 3. Relational Database Views

### View 1: `v_trip_budget_summary`
Combines 4 tables (`trips`, `users`, `destinations`, `trip_expenses`) with `COALESCE` and aggregate calculations:
```sql
CREATE OR REPLACE VIEW v_trip_budget_summary AS
SELECT 
    t.trip_id,
    t.title AS trip_title,
    t.user_id,
    u.full_name AS traveler_name,
    u.reg_no,
    d.city_name,
    d.country_name,
    t.duration_days,
    t.travel_style,
    t.group_size,
    t.total_budget_inr,
    COALESCE(SUM(e.amount_inr), 0) AS total_spent_inr,
    (t.total_budget_inr - COALESCE(SUM(e.amount_inr), 0)) AS remaining_budget_inr,
    ROUND(
        CASE 
            WHEN t.total_budget_inr > 0 
            THEN (COALESCE(SUM(e.amount_inr), 0) / t.total_budget_inr) * 100 
            ELSE 0 
        END, 2
    ) AS budget_utilization_pct,
    CASE 
        WHEN COALESCE(SUM(e.amount_inr), 0) > t.total_budget_inr THEN 'OVER_BUDGET'
        WHEN (COALESCE(SUM(e.amount_inr), 0) / NULLIF(t.total_budget_inr, 0)) >= 0.85 THEN 'WARNING_NEAR_LIMIT'
        ELSE 'HEALTHY'
    END AS budget_health_status,
    t.created_at
FROM trips t
JOIN users u ON t.user_id = u.user_id
JOIN destinations d ON t.destination_id = d.destination_id
LEFT JOIN trip_expenses e ON t.trip_id = e.trip_id
GROUP BY t.trip_id, t.title, t.user_id, u.full_name, u.reg_no, d.city_name, d.country_name, 
         t.duration_days, t.travel_style, t.group_size, t.total_budget_inr, t.created_at;
```

### View 2: `v_trip_category_variance`
Monitors variance between allocated budget and spent amount per category:
```sql
CREATE OR REPLACE VIEW v_trip_category_variance AS
SELECT 
    b.trip_id,
    t.title AS trip_title,
    c.category_id,
    c.category_code,
    c.category_name,
    b.allocated_amount_inr,
    COALESCE(b.spent_amount_inr, 0) AS spent_amount_inr,
    (b.allocated_amount_inr - COALESCE(b.spent_amount_inr, 0)) AS variance_inr,
    ROUND(
        CASE 
            WHEN b.allocated_amount_inr > 0 
            THEN (COALESCE(b.spent_amount_inr, 0) / b.allocated_amount_inr) * 100 
            ELSE 0 
        END, 2
    ) AS category_utilization_pct,
    CASE 
        WHEN COALESCE(b.spent_amount_inr, 0) > b.allocated_amount_inr THEN 'OVER_BUDGET'
        WHEN (COALESCE(b.spent_amount_inr, 0) / NULLIF(b.allocated_amount_inr, 0)) >= 0.80 THEN 'WARNING'
        ELSE 'NORMAL'
    END AS category_status
FROM trip_budget_breakdowns b
JOIN trips t ON b.trip_id = t.trip_id
JOIN budget_categories c ON b.category_id = c.category_id;
```

---

## 4. Multi-Table ACID Transactions
Atomic trip generation using Prisma Client transaction API:
```javascript
const newTrip = await prisma.$transaction(async (tx) => {
  // Step 1: Create Trip Master Record
  const trip = await tx.trip.create({
    data: {
      user_id: req.user.user_id,
      destination_id: Number(destination_id),
      title: title.trim(),
      duration_days: Number(duration_days),
      travel_style,
      group_size: Number(group_size),
      total_budget_inr: calculatedTotalBudget
    }
  });

  // Step 2: Seed 5 Category Breakdowns atomically
  for (const cat of categories) {
    await tx.tripBudgetBreakdown.create({
      data: {
        trip_id: trip.trip_id,
        category_id: cat.category_id,
        allocated_amount_inr: cat.allocated_amount_inr,
        spent_amount_inr: 0.0
      }
    });
  }

  // Step 3: Write Security Audit Trail
  await tx.auditLog.create({
    data: {
      user_id: req.user.user_id,
      action: 'CREATE_TRIP',
      entity_type: 'TRIP',
      entity_id: trip.trip_id,
      details: `Created trip #${trip.trip_id} for ${trip.title}`
    }
  });

  return trip;
});
```
If any category breakdown creation fails, the entire transaction rolls back cleanly, guaranteeing zero orphaned trips.
