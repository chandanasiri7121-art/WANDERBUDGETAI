--
-- PostgreSQL database dump
--

\restrict MXLSkGiJyUUR5Y3tjBRV35yNWeCAdS4RkqW2tV5A5j0Z5bIr4LQfz8pFHCJGnMc

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.trips DROP CONSTRAINT IF EXISTS trips_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trips DROP CONSTRAINT IF EXISTS trips_destination_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trip_places DROP CONSTRAINT IF EXISTS trip_places_trip_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trip_places DROP CONSTRAINT IF EXISTS trip_places_attraction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trip_expenses DROP CONSTRAINT IF EXISTS trip_expenses_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trip_expenses DROP CONSTRAINT IF EXISTS trip_expenses_trip_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trip_expenses DROP CONSTRAINT IF EXISTS trip_expenses_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trip_budget_breakdowns DROP CONSTRAINT IF EXISTS trip_budget_breakdowns_trip_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trip_budget_breakdowns DROP CONSTRAINT IF EXISTS trip_budget_breakdowns_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cost_of_living_indices DROP CONSTRAINT IF EXISTS cost_of_living_indices_destination_id_fkey;
ALTER TABLE IF EXISTS ONLY public.budget_alerts DROP CONSTRAINT IF EXISTS budget_alerts_trip_id_fkey;
ALTER TABLE IF EXISTS ONLY public.budget_alerts DROP CONSTRAINT IF EXISTS budget_alerts_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attractions DROP CONSTRAINT IF EXISTS attractions_destination_id_fkey;
DROP TRIGGER IF EXISTS trg_check_budget_overrun ON public.trip_expenses;
DROP INDEX IF EXISTS public.users_reg_no_key;
DROP INDEX IF EXISTS public.users_reg_no_idx;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.trips_user_id_idx;
DROP INDEX IF EXISTS public.trips_destination_id_idx;
DROP INDEX IF EXISTS public.trip_places_trip_id_idx;
DROP INDEX IF EXISTS public.trip_places_attraction_id_idx;
DROP INDEX IF EXISTS public.trip_expenses_trip_id_idx;
DROP INDEX IF EXISTS public.trip_expenses_expense_date_idx;
DROP INDEX IF EXISTS public.trip_expenses_category_id_idx;
DROP INDEX IF EXISTS public.trip_budget_breakdowns_trip_id_idx;
DROP INDEX IF EXISTS public.trip_budget_breakdowns_trip_id_category_id_key;
DROP INDEX IF EXISTS public.destinations_country_name_idx;
DROP INDEX IF EXISTS public.destinations_city_name_country_name_key;
DROP INDEX IF EXISTS public.cost_of_living_indices_destination_id_key;
DROP INDEX IF EXISTS public.budget_categories_category_code_key;
DROP INDEX IF EXISTS public.budget_alerts_trip_id_idx;
DROP INDEX IF EXISTS public.audit_logs_timestamp_idx;
DROP INDEX IF EXISTS public.audit_logs_action_idx;
DROP INDEX IF EXISTS public.attractions_destination_id_idx;
DROP INDEX IF EXISTS public.attractions_category_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.trips DROP CONSTRAINT IF EXISTS trips_pkey;
ALTER TABLE IF EXISTS ONLY public.trip_places DROP CONSTRAINT IF EXISTS trip_places_pkey;
ALTER TABLE IF EXISTS ONLY public.trip_expenses DROP CONSTRAINT IF EXISTS trip_expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.trip_budget_breakdowns DROP CONSTRAINT IF EXISTS trip_budget_breakdowns_pkey;
ALTER TABLE IF EXISTS ONLY public.destinations DROP CONSTRAINT IF EXISTS destinations_pkey;
ALTER TABLE IF EXISTS ONLY public.cost_of_living_indices DROP CONSTRAINT IF EXISTS cost_of_living_indices_pkey;
ALTER TABLE IF EXISTS ONLY public.budget_categories DROP CONSTRAINT IF EXISTS budget_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.budget_alerts DROP CONSTRAINT IF EXISTS budget_alerts_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.attractions DROP CONSTRAINT IF EXISTS attractions_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trips ALTER COLUMN trip_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trip_places ALTER COLUMN trip_place_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trip_expenses ALTER COLUMN expense_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.trip_budget_breakdowns ALTER COLUMN breakdown_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.destinations ALTER COLUMN destination_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cost_of_living_indices ALTER COLUMN cost_index_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.budget_categories ALTER COLUMN category_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.budget_alerts ALTER COLUMN alert_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN log_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.attractions ALTER COLUMN attraction_id DROP DEFAULT;
DROP VIEW IF EXISTS public.v_trip_category_variance;
DROP VIEW IF EXISTS public.v_trip_budget_summary;
DROP VIEW IF EXISTS public.v_destination_cost_overview;
DROP SEQUENCE IF EXISTS public.users_user_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.trips_trip_id_seq;
DROP TABLE IF EXISTS public.trips;
DROP SEQUENCE IF EXISTS public.trip_places_trip_place_id_seq;
DROP TABLE IF EXISTS public.trip_places;
DROP SEQUENCE IF EXISTS public.trip_expenses_expense_id_seq;
DROP TABLE IF EXISTS public.trip_expenses;
DROP SEQUENCE IF EXISTS public.trip_budget_breakdowns_breakdown_id_seq;
DROP TABLE IF EXISTS public.trip_budget_breakdowns;
DROP SEQUENCE IF EXISTS public.destinations_destination_id_seq;
DROP TABLE IF EXISTS public.destinations;
DROP SEQUENCE IF EXISTS public.cost_of_living_indices_cost_index_id_seq;
DROP TABLE IF EXISTS public.cost_of_living_indices;
DROP SEQUENCE IF EXISTS public.budget_categories_category_id_seq;
DROP TABLE IF EXISTS public.budget_categories;
DROP SEQUENCE IF EXISTS public.budget_alerts_alert_id_seq;
DROP TABLE IF EXISTS public.budget_alerts;
DROP SEQUENCE IF EXISTS public.audit_logs_log_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.attractions_attraction_id_seq;
DROP TABLE IF EXISTS public.attractions;
DROP FUNCTION IF EXISTS public.sp_calculate_trip_budget(p_destination_id integer, p_days integer, p_style character varying, p_group_size integer);
DROP FUNCTION IF EXISTS public.fn_check_budget_overrun();
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: fn_check_budget_overrun(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_check_budget_overrun() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.fn_check_budget_overrun() OWNER TO postgres;

--
-- Name: sp_calculate_trip_budget(integer, integer, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sp_calculate_trip_budget(p_destination_id integer, p_days integer, p_style character varying, p_group_size integer) RETURNS TABLE(category_code character varying, allocated_inr numeric, daily_rate_inr numeric, calculation_basis text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_acc_night NUMERIC;
    v_meal_day NUMERIC;
    v_transit_day NUMERIC;
    v_rate NUMERIC;
    v_rooms INT;
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
        exchange_rate_to_inr
    INTO v_acc_night, v_meal_day, v_transit_day, v_rate
    FROM cost_of_living_indices
    WHERE destination_id = p_destination_id;

    -- Defaults if null
    v_acc_night := COALESCE(v_acc_night, 2500);
    v_meal_day := COALESCE(v_meal_day, 1200);
    v_transit_day := COALESCE(v_transit_day, 400);
    v_rate := COALESCE(v_rate, 1.0);

    -- Rooms needed (assuming 2 persons per room)
    v_rooms := CEIL(p_group_size::NUMERIC / 2.0);

    -- Return Category 1: ACCOMMODATION
    category_code := 'ACCOMMODATION';
    allocated_inr := ROUND(p_days * v_acc_night * v_rate * v_rooms, 2);
    daily_rate_inr := ROUND(v_acc_night * v_rate, 2);
    calculation_basis := p_days || ' nights @ ' || daily_rate_inr || ' INR/night for ' || v_rooms || ' room(s)';
    RETURN NEXT;

    -- Return Category 2: FOOD
    category_code := 'FOOD';
    allocated_inr := ROUND(p_days * v_meal_day * v_rate * p_group_size, 2);
    daily_rate_inr := ROUND(v_meal_day * v_rate, 2);
    calculation_basis := p_days || ' days @ ' || daily_rate_inr || ' INR/day for ' || p_group_size || ' person(s)';
    RETURN NEXT;

    -- Return Category 3: TRANSIT
    category_code := 'TRANSIT';
    allocated_inr := ROUND(p_days * v_transit_day * v_rate * p_group_size, 2);
    daily_rate_inr := ROUND(v_transit_day * v_rate, 2);
    calculation_basis := p_days || ' days local transit pass for ' || p_group_size || ' person(s)';
    RETURN NEXT;

    -- Return Category 4: SIGHTSEEING
    category_code := 'SIGHTSEEING';
    allocated_inr := ROUND(p_days * 1000 * p_group_size, 2);
    daily_rate_inr := 1000;
    calculation_basis := 'Estimated ticket & entrance fees for selected itinerary attractions';
    RETURN NEXT;

    -- Return Category 5: BUFFER
    category_code := 'BUFFER';
    allocated_inr := ROUND((p_days * (v_acc_night * v_rooms + (v_meal_day + v_transit_day) * p_group_size) * v_rate) * 0.10, 2);
    daily_rate_inr := ROUND(allocated_inr / p_days, 2);
    calculation_basis := '10% Emergency contingency & currency fluctuation buffer';
    RETURN NEXT;
END;
$$;


ALTER FUNCTION public.sp_calculate_trip_budget(p_destination_id integer, p_days integer, p_style character varying, p_group_size integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attractions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attractions (
    attraction_id integer NOT NULL,
    destination_id integer NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(100) NOT NULL,
    ticket_price_local numeric(12,2) DEFAULT 0.0 NOT NULL,
    ticket_price_inr numeric(12,2) DEFAULT 0.0 NOT NULL,
    avg_duration_hours numeric(4,1) DEFAULT 2.5 NOT NULL,
    recommended_style character varying(50) DEFAULT 'ALL'::character varying NOT NULL,
    image_url character varying(500),
    description text
);


ALTER TABLE public.attractions OWNER TO postgres;

--
-- Name: attractions_attraction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attractions_attraction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attractions_attraction_id_seq OWNER TO postgres;

--
-- Name: attractions_attraction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attractions_attraction_id_seq OWNED BY public.attractions.attraction_id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id integer,
    ip_address character varying(100),
    details text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_log_id_seq OWNER TO postgres;

--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_log_id_seq OWNED BY public.audit_logs.log_id;


--
-- Name: budget_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_alerts (
    alert_id integer NOT NULL,
    trip_id integer NOT NULL,
    category_id integer,
    alert_type character varying(50) NOT NULL,
    message text NOT NULL,
    threshold_pct numeric(10,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL
);


ALTER TABLE public.budget_alerts OWNER TO postgres;

--
-- Name: budget_alerts_alert_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_alerts_alert_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_alerts_alert_id_seq OWNER TO postgres;

--
-- Name: budget_alerts_alert_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_alerts_alert_id_seq OWNED BY public.budget_alerts.alert_id;


--
-- Name: budget_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_categories (
    category_id integer NOT NULL,
    category_code character varying(50) NOT NULL,
    category_name character varying(100) NOT NULL,
    icon character varying(50) DEFAULT 'Tag'::character varying NOT NULL
);


ALTER TABLE public.budget_categories OWNER TO postgres;

--
-- Name: budget_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_categories_category_id_seq OWNER TO postgres;

--
-- Name: budget_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_categories_category_id_seq OWNED BY public.budget_categories.category_id;


--
-- Name: cost_of_living_indices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cost_of_living_indices (
    cost_index_id integer NOT NULL,
    destination_id integer NOT NULL,
    accommodation_budget_night numeric(12,2) NOT NULL,
    accommodation_standard_night numeric(12,2) NOT NULL,
    accommodation_luxury_night numeric(12,2) NOT NULL,
    meal_budget_day numeric(12,2) NOT NULL,
    meal_standard_day numeric(12,2) NOT NULL,
    meal_luxury_day numeric(12,2) NOT NULL,
    transit_pass_day numeric(12,2) NOT NULL,
    taxi_per_km numeric(12,2) NOT NULL,
    exchange_rate_to_inr numeric(12,4) NOT NULL,
    source character varying(100) DEFAULT 'LIVE_WEB_SEARCH_AI'::character varying NOT NULL,
    confidence_score numeric(4,2) DEFAULT 0.95 NOT NULL,
    last_synced_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.cost_of_living_indices OWNER TO postgres;

--
-- Name: cost_of_living_indices_cost_index_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cost_of_living_indices_cost_index_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cost_of_living_indices_cost_index_id_seq OWNER TO postgres;

--
-- Name: cost_of_living_indices_cost_index_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cost_of_living_indices_cost_index_id_seq OWNED BY public.cost_of_living_indices.cost_index_id;


--
-- Name: destinations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.destinations (
    destination_id integer NOT NULL,
    city_name character varying(100) NOT NULL,
    country_name character varying(100) NOT NULL,
    currency_code character varying(10) NOT NULL,
    currency_symbol character varying(10) DEFAULT '₹'::character varying NOT NULL,
    description text,
    image_url character varying(500),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.destinations OWNER TO postgres;

--
-- Name: destinations_destination_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.destinations_destination_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.destinations_destination_id_seq OWNER TO postgres;

--
-- Name: destinations_destination_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.destinations_destination_id_seq OWNED BY public.destinations.destination_id;


--
-- Name: trip_budget_breakdowns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trip_budget_breakdowns (
    breakdown_id integer NOT NULL,
    trip_id integer NOT NULL,
    category_id integer NOT NULL,
    allocated_amount_inr numeric(12,2) NOT NULL,
    spent_amount_inr numeric(12,2) DEFAULT 0.0 NOT NULL
);


ALTER TABLE public.trip_budget_breakdowns OWNER TO postgres;

--
-- Name: trip_budget_breakdowns_breakdown_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trip_budget_breakdowns_breakdown_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trip_budget_breakdowns_breakdown_id_seq OWNER TO postgres;

--
-- Name: trip_budget_breakdowns_breakdown_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trip_budget_breakdowns_breakdown_id_seq OWNED BY public.trip_budget_breakdowns.breakdown_id;


--
-- Name: trip_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trip_expenses (
    expense_id integer NOT NULL,
    trip_id integer NOT NULL,
    category_id integer NOT NULL,
    user_id integer NOT NULL,
    expense_name character varying(200) NOT NULL,
    amount_inr numeric(12,2) NOT NULL,
    currency_code character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    amount_original numeric(12,2) NOT NULL,
    expense_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payment_method character varying(50) DEFAULT 'CARD'::character varying NOT NULL,
    receipt_url character varying(500),
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.trip_expenses OWNER TO postgres;

--
-- Name: trip_expenses_expense_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trip_expenses_expense_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trip_expenses_expense_id_seq OWNER TO postgres;

--
-- Name: trip_expenses_expense_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trip_expenses_expense_id_seq OWNED BY public.trip_expenses.expense_id;


--
-- Name: trip_places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trip_places (
    trip_place_id integer NOT NULL,
    trip_id integer NOT NULL,
    attraction_id integer NOT NULL,
    planned_day integer DEFAULT 1 NOT NULL,
    estimated_cost_inr numeric(12,2) NOT NULL,
    notes text
);


ALTER TABLE public.trip_places OWNER TO postgres;

--
-- Name: trip_places_trip_place_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trip_places_trip_place_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trip_places_trip_place_id_seq OWNER TO postgres;

--
-- Name: trip_places_trip_place_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trip_places_trip_place_id_seq OWNED BY public.trip_places.trip_place_id;


--
-- Name: trips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trips (
    trip_id integer NOT NULL,
    user_id integer NOT NULL,
    destination_id integer NOT NULL,
    title character varying(200) NOT NULL,
    start_date date,
    end_date date,
    duration_days integer DEFAULT 3 NOT NULL,
    travel_style character varying(50) DEFAULT 'STANDARD'::character varying NOT NULL,
    group_size integer DEFAULT 1 NOT NULL,
    total_budget_inr numeric(14,2) NOT NULL,
    total_spent_inr numeric(14,2) DEFAULT 0.0 NOT NULL,
    status character varying(50) DEFAULT 'PLANNING'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.trips OWNER TO postgres;

--
-- Name: trips_trip_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trips_trip_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trips_trip_id_seq OWNER TO postgres;

--
-- Name: trips_trip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trips_trip_id_seq OWNED BY public.trips.trip_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    reg_no character varying(50) NOT NULL,
    full_name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'TRAVELER'::character varying NOT NULL,
    home_currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    oauth_provider character varying(50) DEFAULT 'LOCAL'::character varying,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: v_destination_cost_overview; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_destination_cost_overview AS
 SELECT d.destination_id,
    d.city_name,
    d.country_name,
    d.currency_code,
    c.accommodation_budget_night,
    c.accommodation_standard_night,
    c.accommodation_luxury_night,
    c.meal_standard_day,
    c.transit_pass_day,
    c.exchange_rate_to_inr,
    count(a.attraction_id) AS total_attractions,
    c.source,
    c.last_synced_at
   FROM ((public.destinations d
     LEFT JOIN public.cost_of_living_indices c ON ((d.destination_id = c.destination_id)))
     LEFT JOIN public.attractions a ON ((d.destination_id = a.destination_id)))
  GROUP BY d.destination_id, d.city_name, d.country_name, d.currency_code, c.accommodation_budget_night, c.accommodation_standard_night, c.accommodation_luxury_night, c.meal_standard_day, c.transit_pass_day, c.exchange_rate_to_inr, c.source, c.last_synced_at;


ALTER VIEW public.v_destination_cost_overview OWNER TO postgres;

--
-- Name: v_trip_budget_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_trip_budget_summary AS
 SELECT t.trip_id,
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
    COALESCE(sum(e.amount_inr), (0)::numeric) AS total_spent_inr,
    (t.total_budget_inr - COALESCE(sum(e.amount_inr), (0)::numeric)) AS remaining_budget_inr,
    round(
        CASE
            WHEN (t.total_budget_inr > (0)::numeric) THEN ((COALESCE(sum(e.amount_inr), (0)::numeric) / t.total_budget_inr) * (100)::numeric)
            ELSE (0)::numeric
        END, 2) AS budget_utilization_pct,
        CASE
            WHEN (COALESCE(sum(e.amount_inr), (0)::numeric) > t.total_budget_inr) THEN 'OVER_BUDGET'::text
            WHEN ((COALESCE(sum(e.amount_inr), (0)::numeric) / NULLIF(t.total_budget_inr, (0)::numeric)) >= 0.85) THEN 'WARNING_NEAR_LIMIT'::text
            ELSE 'HEALTHY'::text
        END AS budget_health_status,
    t.created_at
   FROM (((public.trips t
     JOIN public.users u ON ((t.user_id = u.user_id)))
     JOIN public.destinations d ON ((t.destination_id = d.destination_id)))
     LEFT JOIN public.trip_expenses e ON ((t.trip_id = e.trip_id)))
  GROUP BY t.trip_id, t.title, t.user_id, u.full_name, u.reg_no, d.city_name, d.country_name, t.duration_days, t.travel_style, t.group_size, t.total_budget_inr, t.created_at;


ALTER VIEW public.v_trip_budget_summary OWNER TO postgres;

--
-- Name: v_trip_category_variance; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_trip_category_variance AS
 SELECT b.trip_id,
    t.title AS trip_title,
    c.category_id,
    c.category_code,
    c.category_name,
    b.allocated_amount_inr,
    COALESCE(b.spent_amount_inr, (0)::numeric) AS spent_amount_inr,
    (b.allocated_amount_inr - COALESCE(b.spent_amount_inr, (0)::numeric)) AS variance_inr,
    round(
        CASE
            WHEN (b.allocated_amount_inr > (0)::numeric) THEN ((COALESCE(b.spent_amount_inr, (0)::numeric) / b.allocated_amount_inr) * (100)::numeric)
            ELSE (0)::numeric
        END, 2) AS category_utilization_pct,
        CASE
            WHEN (COALESCE(b.spent_amount_inr, (0)::numeric) > b.allocated_amount_inr) THEN 'OVER_BUDGET'::text
            WHEN ((COALESCE(b.spent_amount_inr, (0)::numeric) / NULLIF(b.allocated_amount_inr, (0)::numeric)) >= 0.80) THEN 'WARNING'::text
            ELSE 'NORMAL'::text
        END AS category_status
   FROM ((public.trip_budget_breakdowns b
     JOIN public.trips t ON ((b.trip_id = t.trip_id)))
     JOIN public.budget_categories c ON ((b.category_id = c.category_id)));


ALTER VIEW public.v_trip_category_variance OWNER TO postgres;

--
-- Name: attractions attraction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attractions ALTER COLUMN attraction_id SET DEFAULT nextval('public.attractions_attraction_id_seq'::regclass);


--
-- Name: audit_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN log_id SET DEFAULT nextval('public.audit_logs_log_id_seq'::regclass);


--
-- Name: budget_alerts alert_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts ALTER COLUMN alert_id SET DEFAULT nextval('public.budget_alerts_alert_id_seq'::regclass);


--
-- Name: budget_categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories ALTER COLUMN category_id SET DEFAULT nextval('public.budget_categories_category_id_seq'::regclass);


--
-- Name: cost_of_living_indices cost_index_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cost_of_living_indices ALTER COLUMN cost_index_id SET DEFAULT nextval('public.cost_of_living_indices_cost_index_id_seq'::regclass);


--
-- Name: destinations destination_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.destinations ALTER COLUMN destination_id SET DEFAULT nextval('public.destinations_destination_id_seq'::regclass);


--
-- Name: trip_budget_breakdowns breakdown_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_budget_breakdowns ALTER COLUMN breakdown_id SET DEFAULT nextval('public.trip_budget_breakdowns_breakdown_id_seq'::regclass);


--
-- Name: trip_expenses expense_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_expenses ALTER COLUMN expense_id SET DEFAULT nextval('public.trip_expenses_expense_id_seq'::regclass);


--
-- Name: trip_places trip_place_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_places ALTER COLUMN trip_place_id SET DEFAULT nextval('public.trip_places_trip_place_id_seq'::regclass);


--
-- Name: trips trip_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips ALTER COLUMN trip_id SET DEFAULT nextval('public.trips_trip_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: attractions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attractions (attraction_id, destination_id, name, category, ticket_price_local, ticket_price_inr, avg_duration_hours, recommended_style, image_url, description) FROM stdin;
1	1	Tokyo Skytree Observatory	Observation Deck	3100.00	1736.00	2.0	ALL	\N	\N
2	1	TeamLab Planets Immersive Digital Art	Modern Art	3800.00	2128.00	2.5	ALL	\N	\N
3	1	Senso-ji Temple & Asakusa Market	Culture & Heritage	0.00	0.00	2.0	BUDGET	\N	\N
4	1	Shinjuku Gyoen National Garden	Nature & Parks	500.00	280.00	1.5	ALL	\N	\N
5	1	Akihabara Electric Town Tour	Pop Culture & Gaming	1200.00	672.00	3.0	ALL	\N	\N
6	2	Louvre Museum Entrance	Art & History	22.00	1991.00	3.5	ALL	\N	\N
7	2	Eiffel Tower Summit Access	Landmark	35.30	3194.00	2.5	ALL	\N	\N
8	2	Palace of Versailles Full Estate	Royal Heritage	32.00	2896.00	4.0	STANDARD	\N	\N
9	2	Seine River Sunset Cruise	Sightseeing	18.00	1629.00	1.5	ALL	\N	\N
10	2	Montmartre & Sacré-Cœur Walking Tour	Culture & Views	0.00	0.00	2.0	BUDGET	\N	\N
11	3	Uluwatu Temple & Kecak Fire Dance	Cultural Performance	150000.00	795.00	2.5	ALL	\N	\N
12	3	Tegallalang Rice Terraces & Swing	Nature & Scenery	100000.00	530.00	2.0	ALL	\N	\N
13	3	Mount Batur Sunrise Trek	Adventure & Hiking	450000.00	2385.00	5.0	STANDARD	\N	\N
14	3	Sacred Monkey Forest Sanctuary Ubud	Wildlife Sanctuary	80000.00	424.00	1.5	ALL	\N	\N
15	3	Nusa Penida Island Day Tour	Island Excursion	700000.00	3710.00	8.0	ALL	\N	\N
16	4	Dudhsagar Waterfalls Jeep Safari	Adventure & Nature	1800.00	1800.00	5.0	ALL	\N	\N
17	4	Fort Aguada & Lighthouse Viewpoint	Heritage Fort	50.00	50.00	1.5	ALL	\N	\N
18	4	Grand Island Scuba Diving & Snorkeling	Water Sports	2800.00	2800.00	4.5	STANDARD	\N	\N
19	4	Basilica of Bom Jesus Heritage Tour	UNESCO Heritage	0.00	0.00	1.5	BUDGET	\N	\N
20	4	Mandovi River Sunset Cruise with Goan Folk Dance	Cruise	500.00	500.00	2.0	ALL	\N	\N
21	5	Mount Uetliberg Top of Zurich Train & View	Alpine View	18.00	1710.00	3.0	ALL	\N	\N
22	5	Lindt Home of Chocolate Interactive Tour	Culinary Museum	17.00	1615.00	2.0	ALL	\N	\N
23	5	Lake Zurich Cruise & Promenade	Lake Cruise	12.00	1140.00	2.0	ALL	\N	\N
24	5	Swiss National Museum	History & Culture	13.00	1235.00	2.5	ALL	\N	\N
25	5	Altstadt (Old Town) Historic Guided Walk	Walking Tour	0.00	0.00	2.0	BUDGET	\N	\N
26	6	Solang Valley Paragliding & Adventure Hub	Extreme Sports	2500.00	2500.00	4.0	ALL	\N	\N
27	6	Rohtang Pass Snow Excursion Permit	Snow Mountain Pass	1200.00	1200.00	6.0	STANDARD	\N	\N
28	6	Hadimba Devi Ancient Temple in Cedar Forest	Heritage Temple	20.00	20.00	1.0	ALL	\N	\N
29	6	Jogini Waterfall Trek & Vashisht Hot Springs	Nature Trek	0.00	0.00	3.5	BUDGET	\N	\N
30	6	Old Manali Cafe Crawl & Riverside Stroll	Food & Culture	600.00	600.00	2.5	ALL	\N	\N
31	7	Gyeongbokgung Palace & Hanbok Experience	Heritage	3000.00	186.00	2.5	ALL	\N	\N
32	7	N Seoul Tower Observatory	Viewpoint	21000.00	1302.00	2.0	ALL	\N	\N
33	7	Bukchon Hanok Village Walk	Culture	0.00	0.00	2.0	ALL	\N	\N
34	7	Lotte World Theme Park & Aquarium	Theme Park	59000.00	3658.00	5.0	ALL	\N	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (log_id, user_id, action, entity_type, entity_id, ip_address, details, "timestamp") FROM stdin;
1	1	TRIP_BUDGET_CREATED	TRIP	1	127.0.0.1	Created Tokyo 5-Day Standard trip with 95,000 INR dynamic budget	2026-10-15 14:26:12.256
2	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:28:18.801
3	2	USER_LOGIN	USER	2	::1	Successful login by ADMIN_24BAI0226	2026-10-15 14:28:18.913
4	\N	AI_DESTINATION_ANALYZED	DESTINATION	7	::1	AI internet search analysis complete for Seoul, South Korea	2026-10-15 14:28:18.942
5	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:29:37.012
6	2	USER_LOGIN	USER	2	::1	Successful login by ADMIN_24BAI0226	2026-10-15 14:29:37.122
7	\N	AI_DESTINATION_ANALYZED	DESTINATION	7	::1	AI internet search analysis complete for Seoul, South Korea	2026-10-15 14:29:37.151
8	1	TRIP_BUDGET_SAVED	TRIP	2	::1	Trip 'Tokyo 7-Day Sakura Tour' saved with total budget of 139048 INR	2026-10-15 14:29:37.18
9	1	EXPENSE_LOGGED	EXPENSE	4	::1	Logged expense 'Hotel Advance Payment' of 5000 INR for trip 2	2026-10-15 14:29:37.192
10	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:30:02.244
11	2	USER_LOGIN	USER	2	::1	Successful login by ADMIN_24BAI0226	2026-10-15 14:30:02.351
12	\N	AI_DESTINATION_ANALYZED	DESTINATION	7	::1	AI internet search analysis complete for Seoul, South Korea	2026-10-15 14:30:02.378
13	1	TRIP_BUDGET_SAVED	TRIP	3	::1	Trip 'Tokyo 7-Day Sakura Tour' saved with total budget of 139048 INR	2026-10-15 14:30:02.401
14	1	EXPENSE_LOGGED	EXPENSE	6	::1	Logged expense 'Hotel Advance Payment' of 5000 INR for trip 3	2026-10-15 14:30:02.412
15	1	EXPENSE_LOGGED	EXPENSE	7	::1	Logged expense 'Luxury Penthouse Upgrade Overrun' of 999999 INR for trip 3	2026-10-15 14:30:02.418
16	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:32:47.692
17	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:32:47.692
18	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:35:24.247
19	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:35:24.376
20	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:35:24.476
21	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:36:07.739
22	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:36:07.747
23	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:36:09.53
24	1	USER_LOGIN	USER	1	::1	Successful login by 24BAI0226	2026-10-15 14:36:09.53
\.


--
-- Data for Name: budget_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_alerts (alert_id, trip_id, category_id, alert_type, message, threshold_pct, created_at, is_resolved) FROM stdin;
1	3	1	BUDGET_EXCEEDED	Critical Alert: Category spending (1004999.00 INR) has exceeded 100% of allocated budget (54880.00 INR)!	1831.27	2026-10-15 14:30:02.414	f
2	3	\N	TRIP_OVERRUN	CRITICAL: Overall trip spending (1004999.00 INR) has crossed total trip budget (139048.00 INR)!	722.77	2026-10-15 14:30:02.414	f
\.


--
-- Data for Name: budget_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_categories (category_id, category_code, category_name, icon) FROM stdin;
1	ACCOMMODATION	Hotels & Accommodation	Hotel
2	FOOD	Food & Dining	Utensils
3	SIGHTSEEING	Attractions & Sightseeing	Camera
4	TRANSIT	Local Transport & Cabs	Bus
5	BUFFER	Emergency & Buffer Fund	ShieldAlert
6	MISC	Shopping & Miscellaneous	ShoppingBag
\.


--
-- Data for Name: cost_of_living_indices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cost_of_living_indices (cost_index_id, destination_id, accommodation_budget_night, accommodation_standard_night, accommodation_luxury_night, meal_budget_day, meal_standard_day, meal_luxury_day, transit_pass_day, taxi_per_km, exchange_rate_to_inr, source, confidence_score, last_synced_at) FROM stdin;
1	1	4500.00	14000.00	40000.00	2200.00	6500.00	18000.00	1000.00	450.00	0.5600	LIVE_WEB_SEARCH_AI	0.95	2026-10-15 14:26:12.196
2	2	45.00	130.00	350.00	25.00	65.00	180.00	9.50	2.10	90.5000	LIVE_WEB_SEARCH_AI	0.95	2026-10-15 14:26:12.21
3	3	220000.00	650000.00	2500000.00	120000.00	350000.00	950000.00	80000.00	7500.00	0.0053	LIVE_WEB_SEARCH_AI	0.95	2026-10-15 14:26:12.217
4	4	1200.00	3800.00	14000.00	700.00	1800.00	5500.00	450.00	35.00	1.0000	LIVE_WEB_SEARCH_AI	0.95	2026-10-15 14:26:12.225
5	5	70.00	210.00	600.00	35.00	90.00	240.00	14.00	4.50	95.0000	LIVE_WEB_SEARCH_AI	0.95	2026-10-15 14:26:12.231
6	6	900.00	2800.00	9500.00	550.00	1400.00	3500.00	600.00	25.00	1.0000	LIVE_WEB_SEARCH_AI	0.95	2026-10-15 14:26:12.237
7	7	28000.00	85000.00	260000.00	7000.00	22000.00	65000.00	3000.00	1000.00	0.0620	LIVE_WEB_SEARCH_AI	0.95	2026-10-15 14:30:02.37
\.


--
-- Data for Name: destinations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.destinations (destination_id, city_name, country_name, currency_code, currency_symbol, description, image_url, created_at, updated_at) FROM stdin;
1	Tokyo	Japan	JPY	¥	Futuristic metropolis blending historic shrines, world-class culinary art, and high-speed rail.	https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80	2026-10-15 14:26:12.193	2026-10-15 14:26:12.193
2	Paris	France	EUR	€	The City of Light famed for haute cuisine, the Eiffel Tower, art museums, and bohemian boulevards.	https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80	2026-10-15 14:26:12.209	2026-10-15 14:26:12.209
3	Bali	Indonesia	IDR	Rp	Tropical paradise known for volcanic forested mountains, iconic rice paddies, beaches and coral reefs.	https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80	2026-10-15 14:26:12.217	2026-10-15 14:26:12.217
4	Goa	India	INR	₹	Sun-drenched coastal state renowned for Arabian Sea beaches, Portuguese architecture, and vibrant shacks.	https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80	2026-10-15 14:26:12.224	2026-10-15 14:26:12.224
5	Zurich	Switzerland	CHF	CHF	Alpine banking powerhouse on Lake Zurich, offering pristine mountain vistas, Swiss chocolate, and luxury living.	https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80	2026-10-15 14:26:12.23	2026-10-15 14:26:12.23
6	Manali	India	INR	₹	Himalayan resort town on the Beas River, famed for snow-capped peaks, Solang Valley sports, and pine forests.	https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80	2026-10-15 14:26:12.236	2026-10-15 14:26:12.236
7	Seoul	South Korea	KRW	₩	Live AI-indexed travel destination: Seoul, South Korea. Synthesized using real-time cost-of-living indicators.	https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80	2026-10-15 14:28:18.929	2026-10-15 14:30:02.369
\.


--
-- Data for Name: trip_budget_breakdowns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trip_budget_breakdowns (breakdown_id, trip_id, category_id, allocated_amount_inr, spent_amount_inr) FROM stdin;
4	1	4	5600.00	0.00
5	1	5	6700.00	0.00
1	1	1	39000.00	8000.00
2	1	2	36000.00	3500.00
3	1	3	7700.00	1000.00
7	2	2	50960.00	0.00
8	2	4	7840.00	0.00
9	2	3	14000.00	0.00
10	2	5	11368.00	0.00
6	2	1	54880.00	5000.00
12	3	2	50960.00	0.00
13	3	4	7840.00	0.00
14	3	3	14000.00	0.00
15	3	5	11368.00	0.00
11	3	1	54880.00	1004999.00
\.


--
-- Data for Name: trip_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trip_expenses (expense_id, trip_id, category_id, user_id, expense_name, amount_inr, currency_code, amount_original, expense_date, payment_method, receipt_url, notes, created_at) FROM stdin;
1	1	1	1	Shinjuku Hotel Deposit (2 nights)	8000.00	JPY	14285.00	2026-10-15 14:26:12.25	CARD	\N	Initial booking advance via Agoda	2026-10-15 14:26:12.25
2	1	2	1	Ichiran Ramen Dinner for 2	3500.00	JPY	6250.00	2026-10-15 14:26:12.254	CASH	\N	Dinner after flight arrival	2026-10-15 14:26:12.254
3	1	3	1	Tokyo Skytree Fast Pass	1000.00	JPY	1785.00	2026-10-15 14:26:12.255	UPI	\N	Advance booking slot	2026-10-15 14:26:12.255
4	2	1	1	Hotel Advance Payment	5000.00	JPY	8900.00	2026-10-15 14:29:37.184	CARD	\N	\N	2026-10-15 14:29:37.184
6	3	1	1	Hotel Advance Payment	5000.00	JPY	8900.00	2026-10-15 14:30:02.405	CARD	\N	\N	2026-10-15 14:30:02.405
7	3	1	1	Luxury Penthouse Upgrade Overrun	999999.00	INR	999999.00	2026-10-15 14:30:02.415	CARD	\N	\N	2026-10-15 14:30:02.415
\.


--
-- Data for Name: trip_places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trip_places (trip_place_id, trip_id, attraction_id, planned_day, estimated_cost_inr, notes) FROM stdin;
\.


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trips (trip_id, user_id, destination_id, title, start_date, end_date, duration_days, travel_style, group_size, total_budget_inr, total_spent_inr, status, created_at, updated_at) FROM stdin;
1	1	1	Tokyo 5-Day Tech & Cultural Odyssey	\N	\N	5	STANDARD	2	95000.00	12500.00	PLANNING	2026-10-15 14:26:12.243	2026-10-15 14:26:12.243
2	1	1	Tokyo 7-Day Sakura Tour	\N	\N	7	STANDARD	2	139048.00	5000.00	PLANNING	2026-10-15 14:29:37.173	2026-10-15 14:29:37.173
3	1	1	Tokyo 7-Day Sakura Tour	\N	\N	7	STANDARD	2	139048.00	1004999.00	PLANNING	2026-10-15 14:30:02.395	2026-10-15 14:30:02.395
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, reg_no, full_name, email, password_hash, role, home_currency, oauth_provider, created_at) FROM stdin;
1	24BAI0226	Garudaiahgari Sai Siri Chandana	saisirichandana.g2024@vitstudent.ac.in	$2a$10$ruZYAlhxNvJB3iDzkZtiG.hT2HbLGYsu9DK4t4smADteinCa4ylEy	TRAVELER	INR	LOCAL	2026-10-15 14:26:12.182
2	ADMIN_24BAI0226	Garudaiahgari Sai Siri Chandana (System Admin)	admin.wanderbudget@vit.ac.in	$2a$10$nj9yYTrmvJhRIpleSZrnEOerQT79BqLX5c5dSdu3xveD7v75BJXJ6	ADMIN	INR	LOCAL	2026-10-15 14:26:12.191
\.


--
-- Name: attractions_attraction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attractions_attraction_id_seq', 34, true);


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_log_id_seq', 24, true);


--
-- Name: budget_alerts_alert_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_alerts_alert_id_seq', 2, true);


--
-- Name: budget_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_categories_category_id_seq', 6, true);


--
-- Name: cost_of_living_indices_cost_index_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cost_of_living_indices_cost_index_id_seq', 9, true);


--
-- Name: destinations_destination_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.destinations_destination_id_seq', 9, true);


--
-- Name: trip_budget_breakdowns_breakdown_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trip_budget_breakdowns_breakdown_id_seq', 15, true);


--
-- Name: trip_expenses_expense_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trip_expenses_expense_id_seq', 7, true);


--
-- Name: trip_places_trip_place_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trip_places_trip_place_id_seq', 1, false);


--
-- Name: trips_trip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trips_trip_id_seq', 3, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 2, true);


--
-- Name: attractions attractions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attractions
    ADD CONSTRAINT attractions_pkey PRIMARY KEY (attraction_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id);


--
-- Name: budget_alerts budget_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts
    ADD CONSTRAINT budget_alerts_pkey PRIMARY KEY (alert_id);


--
-- Name: budget_categories budget_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_pkey PRIMARY KEY (category_id);


--
-- Name: cost_of_living_indices cost_of_living_indices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cost_of_living_indices
    ADD CONSTRAINT cost_of_living_indices_pkey PRIMARY KEY (cost_index_id);


--
-- Name: destinations destinations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.destinations
    ADD CONSTRAINT destinations_pkey PRIMARY KEY (destination_id);


--
-- Name: trip_budget_breakdowns trip_budget_breakdowns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_budget_breakdowns
    ADD CONSTRAINT trip_budget_breakdowns_pkey PRIMARY KEY (breakdown_id);


--
-- Name: trip_expenses trip_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_expenses
    ADD CONSTRAINT trip_expenses_pkey PRIMARY KEY (expense_id);


--
-- Name: trip_places trip_places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_places
    ADD CONSTRAINT trip_places_pkey PRIMARY KEY (trip_place_id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (trip_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: attractions_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attractions_category_idx ON public.attractions USING btree (category);


--
-- Name: attractions_destination_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attractions_destination_id_idx ON public.attractions USING btree (destination_id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_timestamp_idx ON public.audit_logs USING btree ("timestamp");


--
-- Name: budget_alerts_trip_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX budget_alerts_trip_id_idx ON public.budget_alerts USING btree (trip_id);


--
-- Name: budget_categories_category_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX budget_categories_category_code_key ON public.budget_categories USING btree (category_code);


--
-- Name: cost_of_living_indices_destination_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX cost_of_living_indices_destination_id_key ON public.cost_of_living_indices USING btree (destination_id);


--
-- Name: destinations_city_name_country_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX destinations_city_name_country_name_key ON public.destinations USING btree (city_name, country_name);


--
-- Name: destinations_country_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX destinations_country_name_idx ON public.destinations USING btree (country_name);


--
-- Name: trip_budget_breakdowns_trip_id_category_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX trip_budget_breakdowns_trip_id_category_id_key ON public.trip_budget_breakdowns USING btree (trip_id, category_id);


--
-- Name: trip_budget_breakdowns_trip_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trip_budget_breakdowns_trip_id_idx ON public.trip_budget_breakdowns USING btree (trip_id);


--
-- Name: trip_expenses_category_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trip_expenses_category_id_idx ON public.trip_expenses USING btree (category_id);


--
-- Name: trip_expenses_expense_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trip_expenses_expense_date_idx ON public.trip_expenses USING btree (expense_date);


--
-- Name: trip_expenses_trip_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trip_expenses_trip_id_idx ON public.trip_expenses USING btree (trip_id);


--
-- Name: trip_places_attraction_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trip_places_attraction_id_idx ON public.trip_places USING btree (attraction_id);


--
-- Name: trip_places_trip_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trip_places_trip_id_idx ON public.trip_places USING btree (trip_id);


--
-- Name: trips_destination_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trips_destination_id_idx ON public.trips USING btree (destination_id);


--
-- Name: trips_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trips_user_id_idx ON public.trips USING btree (user_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_reg_no_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_reg_no_idx ON public.users USING btree (reg_no);


--
-- Name: users_reg_no_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_reg_no_key ON public.users USING btree (reg_no);


--
-- Name: trip_expenses trg_check_budget_overrun; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_check_budget_overrun AFTER INSERT OR UPDATE ON public.trip_expenses FOR EACH ROW EXECUTE FUNCTION public.fn_check_budget_overrun();


--
-- Name: attractions attractions_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attractions
    ADD CONSTRAINT attractions_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(destination_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: budget_alerts budget_alerts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts
    ADD CONSTRAINT budget_alerts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.budget_categories(category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: budget_alerts budget_alerts_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_alerts
    ADD CONSTRAINT budget_alerts_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(trip_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cost_of_living_indices cost_of_living_indices_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cost_of_living_indices
    ADD CONSTRAINT cost_of_living_indices_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(destination_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trip_budget_breakdowns trip_budget_breakdowns_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_budget_breakdowns
    ADD CONSTRAINT trip_budget_breakdowns_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.budget_categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trip_budget_breakdowns trip_budget_breakdowns_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_budget_breakdowns
    ADD CONSTRAINT trip_budget_breakdowns_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(trip_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trip_expenses trip_expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_expenses
    ADD CONSTRAINT trip_expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.budget_categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trip_expenses trip_expenses_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_expenses
    ADD CONSTRAINT trip_expenses_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(trip_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trip_expenses trip_expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_expenses
    ADD CONSTRAINT trip_expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trip_places trip_places_attraction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_places
    ADD CONSTRAINT trip_places_attraction_id_fkey FOREIGN KEY (attraction_id) REFERENCES public.attractions(attraction_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trip_places trip_places_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trip_places
    ADD CONSTRAINT trip_places_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(trip_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trips trips_destination_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(destination_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: trips trips_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict MXLSkGiJyUUR5Y3tjBRV35yNWeCAdS4RkqW2tV5A5j0Z5bIr4LQfz8pFHCJGnMc

