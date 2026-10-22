-- ============================================================================
-- WanderBudget AI — Database Stored Procedures, Views, and Triggers
-- ============================================================================

-- 1. ANALYTICAL VIEW: Comprehensive Trip Budget Summary
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
GROUP BY t.trip_id, t.title, t.user_id, u.full_name, u.reg_no, d.city_name, d.country_name, t.duration_days, t.travel_style, t.group_size, t.total_budget_inr, t.created_at;

-- 2. ANALYTICAL VIEW: Category Budget Variance Analysis
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

-- 3. ANALYTICAL VIEW: Destination Cost of Living Overview
CREATE OR REPLACE VIEW v_destination_cost_overview AS
SELECT 
    d.destination_id,
    d.city_name,
    d.country_name,
    d.currency_code,
    c.accommodation_budget_night,
    c.accommodation_standard_night,
    c.accommodation_luxury_night,
    c.meal_standard_day,
    c.transit_pass_day,
    c.exchange_rate_to_inr,
    COUNT(a.attraction_id) AS total_attractions,
    c.source,
    c.last_synced_at
FROM destinations d
LEFT JOIN cost_of_living_indices c ON d.destination_id = c.destination_id
LEFT JOIN attractions a ON d.destination_id = a.destination_id
GROUP BY d.destination_id, d.city_name, d.country_name, d.currency_code, 
         c.accommodation_budget_night, c.accommodation_standard_night, c.accommodation_luxury_night,
         c.meal_standard_day, c.transit_pass_day, c.exchange_rate_to_inr, c.source, c.last_synced_at;

-- 4. STORED PROCEDURE / FUNCTION: Dynamic Trip Budget Calculator Engine
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
    v_taxi_per_km NUMERIC;
    v_rate NUMERIC;
    v_rooms INT;
    v_nights INT;
    v_taxi_vehicles INT;
    v_public_transit_share NUMERIC;
    v_cab_km_day NUMERIC;
    v_transport_day NUMERIC;
    v_accommodation_total NUMERIC;
    v_food_total NUMERIC;
    v_transport_total NUMERIC;
BEGIN
    -- Fetch cost of living index
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
        taxi_per_km,
        exchange_rate_to_inr
    INTO v_acc_night, v_meal_day, v_transit_day, v_taxi_per_km, v_rate
    FROM cost_of_living_indices
    WHERE destination_id = p_destination_id;

    -- Defaults if null
    v_acc_night := COALESCE(v_acc_night, 2500);
    v_meal_day := COALESCE(v_meal_day, 1200);
    v_transit_day := COALESCE(v_transit_day, 400);
    v_taxi_per_km := COALESCE(v_taxi_per_km, 25);
    v_rate := COALESCE(v_rate, 1.0);

    -- Rooms needed (assuming 2 persons per room)
    v_rooms := CEIL(p_group_size::NUMERIC / 2.0);
    -- The Mode 1 UI defines a trip as days with days - 1 hotel nights.
    v_nights := GREATEST(p_days - 1, 0);

    -- Transit mix is intentionally style-specific. Taxi pricing is per vehicle;
    -- a standard cab is assumed to seat four travelers, so a group shares fares.
    IF UPPER(p_style) = 'BUDGET' THEN
        v_public_transit_share := 1.0;
        v_cab_km_day := 5;
    ELSIF UPPER(p_style) = 'LUXURY' THEN
        v_public_transit_share := 0.0;
        v_cab_km_day := 25;
    ELSE
        v_public_transit_share := 0.5;
        v_cab_km_day := 15;
    END IF;
    v_taxi_vehicles := CEIL(p_group_size::NUMERIC / 4.0);
    v_transport_day := (v_transit_day * v_public_transit_share * p_group_size)
        + (v_taxi_per_km * v_cab_km_day * v_taxi_vehicles);

    v_accommodation_total := v_nights * v_acc_night * v_rate * v_rooms;
    v_food_total := p_days * v_meal_day * v_rate * p_group_size;
    v_transport_total := p_days * v_transport_day * v_rate;

    -- Return Category 1: ACCOMMODATION
    category_code := 'ACCOMMODATION';
    allocated_inr := ROUND(v_accommodation_total, 2);
    daily_rate_inr := ROUND(v_acc_night * v_rate, 2);
    calculation_basis := v_nights || ' nights @ ' || daily_rate_inr || ' INR/night for ' || v_rooms || ' room(s)';
    RETURN NEXT;

    -- Return Category 2: FOOD
    category_code := 'FOOD';
    allocated_inr := ROUND(v_food_total, 2);
    daily_rate_inr := ROUND(v_meal_day * v_rate, 2);
    calculation_basis := p_days || ' days @ ' || daily_rate_inr || ' INR/day for ' || p_group_size || ' person(s)';
    RETURN NEXT;

    -- Return Category 3: TRANSIT
    category_code := 'TRANSIT';
    allocated_inr := ROUND(v_transport_total, 2);
    daily_rate_inr := ROUND(v_transport_day * v_rate, 2);
    calculation_basis := p_days || ' days: ' || (v_public_transit_share * 100)
        || '% public transit plus ' || v_cab_km_day || ' cab km/day across ' || v_taxi_vehicles || ' cab(s)';
    RETURN NEXT;

    -- Return Category 4: SIGHTSEEING
    category_code := 'SIGHTSEEING';
    allocated_inr := ROUND(p_days * 1000 * p_group_size, 2);
    daily_rate_inr := 1000;
    calculation_basis := 'Estimated ticket & entrance fees for selected itinerary attractions';
    RETURN NEXT;

    -- Return Category 5: BUFFER
    category_code := 'BUFFER';
    allocated_inr := ROUND((v_accommodation_total + v_food_total + v_transport_total) * 0.10, 2);
    daily_rate_inr := ROUND(allocated_inr / p_days, 2);
    calculation_basis := '10% Emergency contingency & currency fluctuation buffer';
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 5. DATABASE TRIGGER: Automated Budget Overrun Alert System
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

    -- Update category spent amount in trip_budget_breakdowns
    SELECT COALESCE(SUM(amount_inr), 0)
    INTO v_spent
    FROM trip_expenses
    WHERE trip_id = v_trip_id AND category_id = v_cat_id;

    UPDATE trip_budget_breakdowns
    SET spent_amount_inr = v_spent
    WHERE trip_id = v_trip_id AND category_id = v_cat_id;

    -- Check Category Level Threshold
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

    -- Update Trip Total Spent
    SELECT COALESCE(SUM(amount_inr), 0) INTO v_trip_total_spent
    FROM trip_expenses
    WHERE trip_id = v_trip_id;

    UPDATE trips
    SET total_spent_inr = v_trip_total_spent
    WHERE trip_id = v_trip_id;

    -- Check Overall Trip Budget Overrun
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
