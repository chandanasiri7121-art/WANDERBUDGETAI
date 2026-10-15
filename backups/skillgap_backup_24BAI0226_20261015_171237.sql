--
-- PostgreSQL database dump
--

\restrict vB7RYReYTmX1ymchMjWdDRafhL1pccv5cPwuhNgjuQOAyTTHw8soFj7MsbVjVL6

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

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.skill_prerequisites DROP CONSTRAINT IF EXISTS skill_prerequisites_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.skill_prerequisites DROP CONSTRAINT IF EXISTS skill_prerequisites_prerequisite_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.skill_gap_reports DROP CONSTRAINT IF EXISTS skill_gap_reports_version_id_fkey;
ALTER TABLE IF EXISTS ONLY public.skill_gap_reports DROP CONSTRAINT IF EXISTS skill_gap_reports_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.skill_gap_details DROP CONSTRAINT IF EXISTS skill_gap_details_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.skill_gap_details DROP CONSTRAINT IF EXISTS skill_gap_details_report_id_fkey;
ALTER TABLE IF EXISTS ONLY public.learning_resources DROP CONSTRAINT IF EXISTS learning_resources_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_role_versions DROP CONSTRAINT IF EXISTS job_role_versions_job_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_requirements DROP CONSTRAINT IF EXISTS job_requirements_version_id_fkey;
ALTER TABLE IF EXISTS ONLY public.job_requirements DROP CONSTRAINT IF EXISTS job_requirements_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_questions DROP CONSTRAINT IF EXISTS assessment_questions_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_skill_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_answers DROP CONSTRAINT IF EXISTS assessment_answers_question_id_fkey;
ALTER TABLE IF EXISTS ONLY public.assessment_answers DROP CONSTRAINT IF EXISTS assessment_answers_attempt_id_fkey;
DROP TRIGGER IF EXISTS trg_before_assessment_24bai0226_saisirichandana ON public.assessment_attempts;
DROP INDEX IF EXISTS public.users_reg_no_key;
DROP INDEX IF EXISTS public.users_reg_no_idx;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.skills_skill_code_key;
DROP INDEX IF EXISTS public.skills_category_idx;
DROP INDEX IF EXISTS public.skill_prerequisites_skill_id_prerequisite_skill_id_key;
DROP INDEX IF EXISTS public.skill_gap_reports_user_id_version_id_idx;
DROP INDEX IF EXISTS public.skill_gap_details_report_id_idx;
DROP INDEX IF EXISTS public.roles_role_name_key;
DROP INDEX IF EXISTS public.learning_resources_skill_id_idx;
DROP INDEX IF EXISTS public.job_roles_title_key;
DROP INDEX IF EXISTS public.job_role_versions_job_role_id_version_number_key;
DROP INDEX IF EXISTS public.job_requirements_version_id_skill_id_key;
DROP INDEX IF EXISTS public.audit_logs_created_at_idx;
DROP INDEX IF EXISTS public.assessment_questions_skill_id_idx;
DROP INDEX IF EXISTS public.assessment_attempts_user_id_skill_id_idx;
DROP INDEX IF EXISTS public.assessment_answers_attempt_id_idx;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.skills DROP CONSTRAINT IF EXISTS skills_pkey;
ALTER TABLE IF EXISTS ONLY public.skill_prerequisites DROP CONSTRAINT IF EXISTS skill_prerequisites_pkey;
ALTER TABLE IF EXISTS ONLY public.skill_gap_reports DROP CONSTRAINT IF EXISTS skill_gap_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.skill_gap_details DROP CONSTRAINT IF EXISTS skill_gap_details_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.learning_resources DROP CONSTRAINT IF EXISTS learning_resources_pkey;
ALTER TABLE IF EXISTS ONLY public.job_roles DROP CONSTRAINT IF EXISTS job_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.job_role_versions DROP CONSTRAINT IF EXISTS job_role_versions_pkey;
ALTER TABLE IF EXISTS ONLY public.job_requirements DROP CONSTRAINT IF EXISTS job_requirements_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_questions DROP CONSTRAINT IF EXISTS assessment_questions_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_attempts DROP CONSTRAINT IF EXISTS assessment_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.assessment_answers DROP CONSTRAINT IF EXISTS assessment_answers_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.skills ALTER COLUMN skill_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.skill_prerequisites ALTER COLUMN prerequisite_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.skill_gap_reports ALTER COLUMN report_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.skill_gap_details ALTER COLUMN detail_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN role_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.learning_resources ALTER COLUMN resource_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.job_roles ALTER COLUMN job_role_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.job_role_versions ALTER COLUMN version_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.job_requirements ALTER COLUMN requirement_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN log_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_questions ALTER COLUMN question_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_attempts ALTER COLUMN attempt_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.assessment_answers ALTER COLUMN answer_id DROP DEFAULT;
DROP VIEW IF EXISTS public.vw_student_roadmap_24bai0226_saisirichandana;
DROP SEQUENCE IF EXISTS public.users_user_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.skills_skill_id_seq;
DROP TABLE IF EXISTS public.skills;
DROP SEQUENCE IF EXISTS public.skill_prerequisites_prerequisite_id_seq;
DROP TABLE IF EXISTS public.skill_prerequisites;
DROP SEQUENCE IF EXISTS public.skill_gap_reports_report_id_seq;
DROP TABLE IF EXISTS public.skill_gap_reports;
DROP SEQUENCE IF EXISTS public.skill_gap_details_detail_id_seq;
DROP TABLE IF EXISTS public.skill_gap_details;
DROP SEQUENCE IF EXISTS public.roles_role_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.learning_resources_resource_id_seq;
DROP TABLE IF EXISTS public.learning_resources;
DROP SEQUENCE IF EXISTS public.job_roles_job_role_id_seq;
DROP TABLE IF EXISTS public.job_roles;
DROP SEQUENCE IF EXISTS public.job_role_versions_version_id_seq;
DROP TABLE IF EXISTS public.job_role_versions;
DROP SEQUENCE IF EXISTS public.job_requirements_requirement_id_seq;
DROP TABLE IF EXISTS public.job_requirements;
DROP SEQUENCE IF EXISTS public.audit_logs_log_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.assessment_questions_question_id_seq;
DROP TABLE IF EXISTS public.assessment_questions;
DROP SEQUENCE IF EXISTS public.assessment_attempts_attempt_id_seq;
DROP TABLE IF EXISTS public.assessment_attempts;
DROP SEQUENCE IF EXISTS public.assessment_answers_answer_id_seq;
DROP TABLE IF EXISTS public.assessment_answers;
DROP PROCEDURE IF EXISTS public.sp_generate_gap_report_24bai0226_saisirichandana(IN p_user_id integer, IN p_version_id integer);
DROP FUNCTION IF EXISTS public.fn_before_assessment_24bai0226_saisirichandana();
--
-- Name: fn_before_assessment_24bai0226_saisirichandana(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_before_assessment_24bai0226_saisirichandana() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- Score to 0-5 proficiency mapping
      IF NEW.score_percent >= 90.0 THEN
        NEW.assessed_proficiency := 5;
      ELSIF NEW.score_percent >= 75.0 THEN
        NEW.assessed_proficiency := 4;
      ELSIF NEW.score_percent >= 60.0 THEN
        NEW.assessed_proficiency := 3;
      ELSIF NEW.score_percent >= 40.0 THEN
        NEW.assessed_proficiency := 2;
      ELSIF NEW.score_percent >= 20.0 THEN
        NEW.assessed_proficiency := 1;
      ELSE
        NEW.assessed_proficiency := 0;
      END IF;

      -- Automated security audit log insertion
      INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at)
      VALUES (
        NEW.user_id,
        'INSERT_ASSESSMENT_ATTEMPT',
        'assessment_attempts',
        NULL,
        CONCAT('Assessed proficiency calculated as ', NEW.assessed_proficiency, '/5 from score ', NEW.score_percent, '% by trg_before_assessment_24BAI0226_SaiSiriChandana'),
        NOW()
      );

      RETURN NEW;
    END;
    $$;


ALTER FUNCTION public.fn_before_assessment_24bai0226_saisirichandana() OWNER TO postgres;

--
-- Name: sp_generate_gap_report_24bai0226_saisirichandana(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.sp_generate_gap_report_24bai0226_saisirichandana(IN p_user_id integer, IN p_version_id integer)
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_report_id INT;
      v_total_skills INT := 0;
      v_met_skills INT := 0;
      v_readiness_pct DECIMAL(5, 2) := 0.0;
      v_req RECORD;
      v_assessed_prof INT;
      v_gap INT;
      v_priority DECIMAL(5, 2);
      v_reason TEXT;
      v_user_name VARCHAR(150);
    BEGIN
      SELECT full_name INTO v_user_name FROM users WHERE user_id = p_user_id;

      INSERT INTO skill_gap_reports (user_id, version_id, overall_readiness_pct, generated_at)
      VALUES (p_user_id, p_version_id, 0.0, NOW())
      RETURNING report_id INTO v_report_id;

      FOR v_req IN 
        SELECT jr.skill_id, jr.required_proficiency, jr.importance_weight, s.skill_name
        FROM job_requirements jr
        JOIN skills s ON s.skill_id = jr.skill_id
        WHERE jr.version_id = p_version_id
      LOOP
        v_total_skills := v_total_skills + 1;

        SELECT COALESCE(
          (SELECT assessed_proficiency 
           FROM assessment_attempts 
           WHERE user_id = p_user_id AND skill_id = v_req.skill_id 
           ORDER BY attempted_at DESC LIMIT 1), 
          0
        ) INTO v_assessed_prof;

        IF v_req.required_proficiency > v_assessed_prof THEN
          v_gap := v_req.required_proficiency - v_assessed_prof;
        ELSE
          v_gap := 0;
          v_met_skills := v_met_skills + 1;
        END IF;

        v_priority := ROUND((v_req.importance_weight * (v_gap::NUMERIC / 5.0)), 2);

        IF v_gap = 0 THEN
          v_reason := CONCAT('Proficiency achieved (', v_assessed_prof, '/', v_req.required_proficiency, '). Skill criteria satisfied.');
        ELSE
          v_reason := CONCAT('Skill gap of ', v_gap, ' level(s) for ', v_req.skill_name, ' (Required: ', v_req.required_proficiency, ', Demonstrated: ', v_assessed_prof, '). Importance weight: ', v_req.importance_weight, '/5.');
        END IF;

        INSERT INTO skill_gap_details (
          report_id, skill_id, required_proficiency, assessed_proficiency, gap_score, priority_score, recommendation_reason
        ) VALUES (
          v_report_id, v_req.skill_id, v_req.required_proficiency, v_assessed_prof, v_gap, v_priority, v_reason
        );
      END LOOP;

      IF v_total_skills > 0 THEN
        v_readiness_pct := ROUND(((v_met_skills::NUMERIC / v_total_skills::NUMERIC) * 100.0), 2);
      ELSE
        v_readiness_pct := 0.0;
      END IF;

      UPDATE skill_gap_reports
      SET overall_readiness_pct = v_readiness_pct
      WHERE report_id = v_report_id;

      INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at)
      VALUES (
        p_user_id,
        'GENERATE_GAP_REPORT',
        'skill_gap_reports',
        v_report_id,
        CONCAT('SkillGap report #', v_report_id, ' generated for ', v_user_name, ' (Version #', p_version_id, ') with readiness ', v_readiness_pct, '% via sp_generate_gap_report_24BAI0226_SaiSiriChandana'),
        NOW()
      );
    END;
    $$;


ALTER PROCEDURE public.sp_generate_gap_report_24bai0226_saisirichandana(IN p_user_id integer, IN p_version_id integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assessment_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_answers (
    answer_id integer NOT NULL,
    attempt_id integer NOT NULL,
    question_id integer NOT NULL,
    selected_option character(1) NOT NULL,
    is_correct boolean NOT NULL
);


ALTER TABLE public.assessment_answers OWNER TO postgres;

--
-- Name: assessment_answers_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_answers_answer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_answers_answer_id_seq OWNER TO postgres;

--
-- Name: assessment_answers_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_answers_answer_id_seq OWNED BY public.assessment_answers.answer_id;


--
-- Name: assessment_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_attempts (
    attempt_id integer NOT NULL,
    user_id integer NOT NULL,
    skill_id integer NOT NULL,
    score_percent numeric(5,2) NOT NULL,
    assessed_proficiency integer DEFAULT 0 NOT NULL,
    ai_analysis_feedback text,
    attempted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.assessment_attempts OWNER TO postgres;

--
-- Name: assessment_attempts_attempt_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_attempts_attempt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_attempts_attempt_id_seq OWNER TO postgres;

--
-- Name: assessment_attempts_attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_attempts_attempt_id_seq OWNED BY public.assessment_attempts.attempt_id;


--
-- Name: assessment_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_questions (
    question_id integer NOT NULL,
    skill_id integer NOT NULL,
    question_text text NOT NULL,
    option_a character varying(255) NOT NULL,
    option_b character varying(255) NOT NULL,
    option_c character varying(255) NOT NULL,
    option_d character varying(255) NOT NULL,
    correct_option character(1) NOT NULL,
    explanation text NOT NULL,
    generated_by character varying(50) DEFAULT 'GEMINI_AI'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.assessment_questions OWNER TO postgres;

--
-- Name: assessment_questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_questions_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_questions_question_id_seq OWNER TO postgres;

--
-- Name: assessment_questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_questions_question_id_seq OWNED BY public.assessment_questions.question_id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id integer,
    details text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: job_requirements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_requirements (
    requirement_id integer NOT NULL,
    version_id integer NOT NULL,
    skill_id integer NOT NULL,
    required_proficiency integer NOT NULL,
    importance_weight integer NOT NULL
);


ALTER TABLE public.job_requirements OWNER TO postgres;

--
-- Name: job_requirements_requirement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_requirements_requirement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_requirements_requirement_id_seq OWNER TO postgres;

--
-- Name: job_requirements_requirement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_requirements_requirement_id_seq OWNED BY public.job_requirements.requirement_id;


--
-- Name: job_role_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_role_versions (
    version_id integer NOT NULL,
    job_role_id integer NOT NULL,
    version_number character varying(20) NOT NULL,
    version_label character varying(100) NOT NULL,
    effective_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.job_role_versions OWNER TO postgres;

--
-- Name: job_role_versions_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_role_versions_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_role_versions_version_id_seq OWNER TO postgres;

--
-- Name: job_role_versions_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_role_versions_version_id_seq OWNED BY public.job_role_versions.version_id;


--
-- Name: job_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_roles (
    job_role_id integer NOT NULL,
    title character varying(150) NOT NULL,
    description text NOT NULL,
    domain character varying(100) NOT NULL
);


ALTER TABLE public.job_roles OWNER TO postgres;

--
-- Name: job_roles_job_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_roles_job_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_roles_job_role_id_seq OWNER TO postgres;

--
-- Name: job_roles_job_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_roles_job_role_id_seq OWNED BY public.job_roles.job_role_id;


--
-- Name: learning_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learning_resources (
    resource_id integer NOT NULL,
    skill_id integer NOT NULL,
    title character varying(200) NOT NULL,
    resource_url character varying(500) NOT NULL,
    difficulty_level character varying(50) NOT NULL,
    est_minutes integer NOT NULL
);


ALTER TABLE public.learning_resources OWNER TO postgres;

--
-- Name: learning_resources_resource_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learning_resources_resource_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learning_resources_resource_id_seq OWNER TO postgres;

--
-- Name: learning_resources_resource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learning_resources_resource_id_seq OWNED BY public.learning_resources.resource_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: skill_gap_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_gap_details (
    detail_id integer NOT NULL,
    report_id integer NOT NULL,
    skill_id integer NOT NULL,
    required_proficiency integer NOT NULL,
    assessed_proficiency integer NOT NULL,
    gap_score integer NOT NULL,
    priority_score numeric(5,2) NOT NULL,
    recommendation_reason text NOT NULL
);


ALTER TABLE public.skill_gap_details OWNER TO postgres;

--
-- Name: skill_gap_details_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skill_gap_details_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skill_gap_details_detail_id_seq OWNER TO postgres;

--
-- Name: skill_gap_details_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skill_gap_details_detail_id_seq OWNED BY public.skill_gap_details.detail_id;


--
-- Name: skill_gap_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_gap_reports (
    report_id integer NOT NULL,
    user_id integer NOT NULL,
    version_id integer NOT NULL,
    overall_readiness_pct numeric(5,2) NOT NULL,
    generated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.skill_gap_reports OWNER TO postgres;

--
-- Name: skill_gap_reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skill_gap_reports_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skill_gap_reports_report_id_seq OWNER TO postgres;

--
-- Name: skill_gap_reports_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skill_gap_reports_report_id_seq OWNED BY public.skill_gap_reports.report_id;


--
-- Name: skill_prerequisites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_prerequisites (
    prerequisite_id integer NOT NULL,
    skill_id integer NOT NULL,
    prerequisite_skill_id integer NOT NULL
);


ALTER TABLE public.skill_prerequisites OWNER TO postgres;

--
-- Name: skill_prerequisites_prerequisite_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skill_prerequisites_prerequisite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skill_prerequisites_prerequisite_id_seq OWNER TO postgres;

--
-- Name: skill_prerequisites_prerequisite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skill_prerequisites_prerequisite_id_seq OWNED BY public.skill_prerequisites.prerequisite_id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skills (
    skill_id integer NOT NULL,
    skill_code character varying(50) NOT NULL,
    skill_name character varying(150) NOT NULL,
    category character varying(100) NOT NULL
);


ALTER TABLE public.skills OWNER TO postgres;

--
-- Name: skills_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skills_skill_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skills_skill_id_seq OWNER TO postgres;

--
-- Name: skills_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skills_skill_id_seq OWNED BY public.skills.skill_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    reg_no character varying(50) NOT NULL,
    full_name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    oauth_provider character varying(50) DEFAULT 'LOCAL'::character varying,
    role_id integer NOT NULL,
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
-- Name: vw_student_roadmap_24bai0226_saisirichandana; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vw_student_roadmap_24bai0226_saisirichandana AS
 SELECT u.user_id,
    u.reg_no,
    u.full_name,
    jr.title AS career_role_title,
    jrv.version_id,
    jrv.version_number,
    jrv.version_label,
    sgr.report_id,
    sgr.overall_readiness_pct,
    sgr.generated_at AS report_generated_at,
    s.skill_id,
    s.skill_code,
    s.skill_name,
    s.category AS skill_category,
    sgd.required_proficiency,
    sgd.assessed_proficiency,
    sgd.gap_score,
    sgd.priority_score,
    sgd.recommendation_reason,
    COALESCE(( SELECT string_agg((ps.skill_name)::text, ', '::text) AS string_agg
           FROM (public.skill_prerequisites sp
             JOIN public.skills ps ON ((ps.skill_id = sp.prerequisite_skill_id)))
          WHERE (sp.skill_id = s.skill_id)), 'None'::text) AS prerequisites_list,
    COALESCE(lr.title, 'Curated Practice Problems & Documentation'::character varying) AS recommended_resource_title,
    COALESCE(lr.resource_url, 'https://github.com/topics/database'::character varying) AS resource_url,
    COALESCE(lr.difficulty_level, 'Intermediate'::character varying) AS resource_difficulty,
    COALESCE(lr.est_minutes, 45) AS est_minutes
   FROM ((((((public.skill_gap_reports sgr
     JOIN public.users u ON ((u.user_id = sgr.user_id)))
     JOIN public.job_role_versions jrv ON ((jrv.version_id = sgr.version_id)))
     JOIN public.job_roles jr ON ((jr.job_role_id = jrv.job_role_id)))
     JOIN public.skill_gap_details sgd ON ((sgd.report_id = sgr.report_id)))
     JOIN public.skills s ON ((s.skill_id = sgd.skill_id)))
     LEFT JOIN LATERAL ( SELECT lr_inner.title,
            lr_inner.resource_url,
            lr_inner.difficulty_level,
            lr_inner.est_minutes
           FROM public.learning_resources lr_inner
          WHERE (lr_inner.skill_id = s.skill_id)
          ORDER BY lr_inner.resource_id
         LIMIT 1) lr ON (true));


ALTER VIEW public.vw_student_roadmap_24bai0226_saisirichandana OWNER TO postgres;

--
-- Name: assessment_answers answer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_answers ALTER COLUMN answer_id SET DEFAULT nextval('public.assessment_answers_answer_id_seq'::regclass);


--
-- Name: assessment_attempts attempt_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts ALTER COLUMN attempt_id SET DEFAULT nextval('public.assessment_attempts_attempt_id_seq'::regclass);


--
-- Name: assessment_questions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions ALTER COLUMN question_id SET DEFAULT nextval('public.assessment_questions_question_id_seq'::regclass);


--
-- Name: audit_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN log_id SET DEFAULT nextval('public.audit_logs_log_id_seq'::regclass);


--
-- Name: job_requirements requirement_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements ALTER COLUMN requirement_id SET DEFAULT nextval('public.job_requirements_requirement_id_seq'::regclass);


--
-- Name: job_role_versions version_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_role_versions ALTER COLUMN version_id SET DEFAULT nextval('public.job_role_versions_version_id_seq'::regclass);


--
-- Name: job_roles job_role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_roles ALTER COLUMN job_role_id SET DEFAULT nextval('public.job_roles_job_role_id_seq'::regclass);


--
-- Name: learning_resources resource_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_resources ALTER COLUMN resource_id SET DEFAULT nextval('public.learning_resources_resource_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: skill_gap_details detail_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gap_details ALTER COLUMN detail_id SET DEFAULT nextval('public.skill_gap_details_detail_id_seq'::regclass);


--
-- Name: skill_gap_reports report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gap_reports ALTER COLUMN report_id SET DEFAULT nextval('public.skill_gap_reports_report_id_seq'::regclass);


--
-- Name: skill_prerequisites prerequisite_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_prerequisites ALTER COLUMN prerequisite_id SET DEFAULT nextval('public.skill_prerequisites_prerequisite_id_seq'::regclass);


--
-- Name: skills skill_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills ALTER COLUMN skill_id SET DEFAULT nextval('public.skills_skill_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: assessment_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_answers (answer_id, attempt_id, question_id, selected_option, is_correct) FROM stdin;
\.


--
-- Data for Name: assessment_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_attempts (attempt_id, user_id, skill_id, score_percent, assessed_proficiency, ai_analysis_feedback, attempted_at) FROM stdin;
1	1	1	85.00	4	Solid grasp of relational joins and logical query processing. Minor edge case confusion on outer join NULL handling.	2026-10-13 11:38:30.688
2	1	2	68.00	3	Demonstrated 2NF and 3NF functional dependency awareness. Review Boyce-Codd normal form anomalies.	2026-10-14 11:38:30.69
\.


--
-- Data for Name: assessment_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_questions (question_id, skill_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, generated_by, created_at) FROM stdin;
1	1	Which SQL clause is executed FIRST in the logical query processing phase?	WHERE	FROM	SELECT	GROUP BY	B	In SQL logical query execution order, the FROM clause is processed first to establish the source data sets before filtering (WHERE) or grouping (GROUP BY).	SEED_INITIAL	2026-10-15 11:38:07.049
2	1	What is the primary difference between a LEFT OUTER JOIN and an INNER JOIN?	INNER JOIN returns all rows from left table regardless of matches	LEFT JOIN returns matching rows only from both tables	LEFT JOIN includes all rows from the left table and matched rows from the right table (NULL if no match)	Both joins produce identical result sets under all conditions	C	A LEFT JOIN returns all rows from the left table along with matched rows from the right table, substituting NULLs when no corresponding right-side match exists.	SEED_INITIAL	2026-10-15 11:38:07.051
3	2	A relation is in Third Normal Form (3NF) if it is in 2NF and has no:	Partial functional dependencies	Transitive functional dependencies on non-prime attributes	Multi-valued dependencies	Foreign key constraints	B	3NF requires that every non-prime attribute is non-transitively dependent on every candidate key of the relation.	SEED_INITIAL	2026-10-15 11:38:07.052
4	4	Which index type is default in PostgreSQL and optimal for range queries (<, <=, =, >=, >)?	Hash Index	GIN Index	B-Tree Index	BRIN Index	C	B-Trees are self-balancing search trees that handle sorting, equality, and range queries with O(log n) lookup efficiency.	SEED_INITIAL	2026-10-15 11:38:07.053
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (log_id, user_id, action, table_name, record_id, details, created_at) FROM stdin;
1	1	INSERT_ASSESSMENT_ATTEMPT	assessment_attempts	\N	Assessed proficiency calculated as 4/5 from score 85.00% by trg_before_assessment_24BAI0226_SaiSiriChandana	2026-10-15 11:38:30.688
2	1	INSERT_ASSESSMENT_ATTEMPT	assessment_attempts	\N	Assessed proficiency calculated as 3/5 from score 68.00% by trg_before_assessment_24BAI0226_SaiSiriChandana	2026-10-15 11:38:30.69
3	1	GENERATE_GAP_REPORT	skill_gap_reports	1	SkillGap report #1 generated for Garudaiahgari Sai Siri Chandana (Version #1) with readiness 50.00% via sp_generate_gap_report_24BAI0226_SaiSiriChandana	2026-10-15 11:38:30.691
4	1	GENERATE_GAP_REPORT	skill_gap_reports	2	SkillGap report #2 generated for Garudaiahgari Sai Siri Chandana (Version #2) with readiness 16.67% via sp_generate_gap_report_24BAI0226_SaiSiriChandana	2026-10-15 11:38:30.695
\.


--
-- Data for Name: job_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_requirements (requirement_id, version_id, skill_id, required_proficiency, importance_weight) FROM stdin;
1	1	1	3	5
2	1	2	3	4
3	1	5	3	4
4	1	4	2	3
5	2	1	4	5
6	2	2	4	5
7	2	3	3	4
8	2	4	4	5
9	2	5	4	4
10	2	8	3	4
11	3	1	4	5
12	3	6	4	5
13	3	2	2	3
14	3	7	2	3
\.


--
-- Data for Name: job_role_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_role_versions (version_id, job_role_id, version_number, version_label, effective_date, is_active) FROM stdin;
1	1	v1.0	v1.0 Aug 2026 (Foundational)	2026-08-01 00:00:00	f
2	1	v2.0	v2.0 Oct 2026 (Advanced Cloud & Security)	2026-10-01 00:00:00	t
3	2	v1.0	v1.0 Aug 2026 (Core Analytics)	2026-08-15 00:00:00	t
\.


--
-- Data for Name: job_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_roles (job_role_id, title, description, domain) FROM stdin;
1	Backend & Database Engineer	Designs scalable relational schemas, writes high-performance SQL, ensures ACID transaction integrity, and builds robust REST APIs.	Software & Data Engineering
2	Data Analyst	Transforms raw organizational data into actionable business intelligence through complex SQL aggregations, Pandas workflows, and visualization.	Business Intelligence & Analytics
\.


--
-- Data for Name: learning_resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learning_resources (resource_id, skill_id, title, resource_url, difficulty_level, est_minutes) FROM stdin;
1	1	PostgreSQL Mastery: Subqueries, Window Functions, and Joins	https://www.postgresql.org/docs/16/tutorial-sql.html	Intermediate	45
2	2	Database Normalization Fundamentals: 1NF through BCNF with Functional Dependencies	https://en.wikipedia.org/wiki/Database_normalization	Intermediate	40
3	3	Transaction Concurrency, Isolation Levels, and Two-Phase Commit in PostgreSQL	https://www.postgresql.org/docs/16/transaction-iso.html	Advanced	60
4	4	B-Tree & Hash Index Optimization with EXPLAIN ANALYZE	https://www.postgresql.org/docs/16/using-explain.html	Advanced	50
5	5	Building Production REST APIs with Express.js & Prisma ORM	https://www.prisma.io/docs/getting-started/quickstart	Beginner	35
6	6	Exploratory Data Analysis with Python, Pandas, and NumPy	https://pandas.pydata.org/docs/user_guide/index.html	Intermediate	45
7	7	Applied Machine Learning: Feature Engineering and Model Evaluation	https://scikit-learn.org/stable/tutorial/index.html	Intermediate	55
8	8	Web Application Security, BCrypt Hashing, and Stateless JWT Tokens	https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html	Advanced	50
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name) FROM stdin;
1	ADMIN
2	STUDENT
3	EDUCATOR
\.


--
-- Data for Name: skill_gap_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_gap_details (detail_id, report_id, skill_id, required_proficiency, assessed_proficiency, gap_score, priority_score, recommendation_reason) FROM stdin;
1	1	1	3	4	0	0.00	Proficiency achieved (4/3). Skill criteria satisfied.
2	1	2	3	3	0	0.00	Proficiency achieved (3/3). Skill criteria satisfied.
3	1	4	2	0	2	1.20	Skill gap of 2 level(s) for Indexing & Query Optimization (Required: 2, Demonstrated: 0). Importance weight: 3/5.
4	1	5	3	0	3	2.40	Skill gap of 3 level(s) for Node.js & Express REST APIs (Required: 3, Demonstrated: 0). Importance weight: 4/5.
5	2	1	4	4	0	0.00	Proficiency achieved (4/4). Skill criteria satisfied.
6	2	2	4	3	1	1.00	Skill gap of 1 level(s) for Database Normalization (3NF/BCNF) (Required: 4, Demonstrated: 3). Importance weight: 5/5.
7	2	3	3	0	3	2.40	Skill gap of 3 level(s) for Transactions & ACID Properties (Required: 3, Demonstrated: 0). Importance weight: 4/5.
8	2	4	4	0	4	4.00	Skill gap of 4 level(s) for Indexing & Query Optimization (Required: 4, Demonstrated: 0). Importance weight: 5/5.
9	2	5	4	0	4	3.20	Skill gap of 4 level(s) for Node.js & Express REST APIs (Required: 4, Demonstrated: 0). Importance weight: 4/5.
10	2	8	3	0	3	2.40	Skill gap of 3 level(s) for System Security & JWT Auth (Required: 3, Demonstrated: 0). Importance weight: 4/5.
\.


--
-- Data for Name: skill_gap_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_gap_reports (report_id, user_id, version_id, overall_readiness_pct, generated_at) FROM stdin;
1	1	1	50.00	2026-10-15 11:38:30.691
2	1	2	16.67	2026-10-15 11:38:30.695
\.


--
-- Data for Name: skill_prerequisites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_prerequisites (prerequisite_id, skill_id, prerequisite_skill_id) FROM stdin;
1	2	1
2	4	1
3	3	2
4	7	6
5	8	5
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skills (skill_id, skill_code, skill_name, category) FROM stdin;
1	SKL_SQL_01	SQL & Relational Algebra	Database
2	SKL_NORM_02	Database Normalization (3NF/BCNF)	Database
3	SKL_ACID_03	Transactions & ACID Properties	Database
4	SKL_IDX_04	Indexing & Query Optimization	Database
5	SKL_API_05	Node.js & Express REST APIs	Backend
6	SKL_PANDAS_06	Python Data Analysis & Pandas	Data Analytics
7	SKL_ML_07	Machine Learning Foundations	Machine Learning
8	SKL_SEC_08	System Security & JWT Auth	Backend
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, reg_no, full_name, email, password_hash, oauth_provider, role_id, created_at) FROM stdin;
2	ADMIN_24BAI0226	Administrator (Dr. V. SIVAKUMAR)	admin.sivakumar@vit.ac.in	$2a$10$24fu81/OyC4yPb1aYNZxrupHBOfjssrepMLZsLbhpChWmYvgtjvS.	LOCAL	1	2026-10-15 11:38:06.983
3	FAC_24BAI0226	Faculty Evaluator - DBMS Lab	evaluator@vit.ac.in	$2a$10$Re552MrrTNUyjGpAjP6mI.On8l9ECfEnVAXfWPRs0kXcEp8fGpWHO	LOCAL	3	2026-10-15 11:38:06.987
1	24BAI0226	Garudaiahgari Sai Siri Chandana	saisirichandana@vitstudent.ac.in	$2a$10$S67uwQXeXy/xPsGuYkQizOTNsGOG.1C/IbXwkbc9bUyNJ8Vigi6m6	LOCAL	2	2026-10-15 11:38:06.979
\.


--
-- Name: assessment_answers_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_answers_answer_id_seq', 1, false);


--
-- Name: assessment_attempts_attempt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_attempts_attempt_id_seq', 2, true);


--
-- Name: assessment_questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_questions_question_id_seq', 4, true);


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_log_id_seq', 4, true);


--
-- Name: job_requirements_requirement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_requirements_requirement_id_seq', 14, true);


--
-- Name: job_role_versions_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_role_versions_version_id_seq', 3, true);


--
-- Name: job_roles_job_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_roles_job_role_id_seq', 2, true);


--
-- Name: learning_resources_resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.learning_resources_resource_id_seq', 8, true);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 3, true);


--
-- Name: skill_gap_details_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_gap_details_detail_id_seq', 10, true);


--
-- Name: skill_gap_reports_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_gap_reports_report_id_seq', 2, true);


--
-- Name: skill_prerequisites_prerequisite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_prerequisites_prerequisite_id_seq', 5, true);


--
-- Name: skills_skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skills_skill_id_seq', 16, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 4, true);


--
-- Name: assessment_answers assessment_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_answers
    ADD CONSTRAINT assessment_answers_pkey PRIMARY KEY (answer_id);


--
-- Name: assessment_attempts assessment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_pkey PRIMARY KEY (attempt_id);


--
-- Name: assessment_questions assessment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions
    ADD CONSTRAINT assessment_questions_pkey PRIMARY KEY (question_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id);


--
-- Name: job_requirements job_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements
    ADD CONSTRAINT job_requirements_pkey PRIMARY KEY (requirement_id);


--
-- Name: job_role_versions job_role_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_role_versions
    ADD CONSTRAINT job_role_versions_pkey PRIMARY KEY (version_id);


--
-- Name: job_roles job_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_roles
    ADD CONSTRAINT job_roles_pkey PRIMARY KEY (job_role_id);


--
-- Name: learning_resources learning_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_resources
    ADD CONSTRAINT learning_resources_pkey PRIMARY KEY (resource_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: skill_gap_details skill_gap_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gap_details
    ADD CONSTRAINT skill_gap_details_pkey PRIMARY KEY (detail_id);


--
-- Name: skill_gap_reports skill_gap_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gap_reports
    ADD CONSTRAINT skill_gap_reports_pkey PRIMARY KEY (report_id);


--
-- Name: skill_prerequisites skill_prerequisites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_prerequisites
    ADD CONSTRAINT skill_prerequisites_pkey PRIMARY KEY (prerequisite_id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (skill_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: assessment_answers_attempt_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_answers_attempt_id_idx ON public.assessment_answers USING btree (attempt_id);


--
-- Name: assessment_attempts_user_id_skill_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_attempts_user_id_skill_id_idx ON public.assessment_attempts USING btree (user_id, skill_id);


--
-- Name: assessment_questions_skill_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX assessment_questions_skill_id_idx ON public.assessment_questions USING btree (skill_id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: job_requirements_version_id_skill_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX job_requirements_version_id_skill_id_key ON public.job_requirements USING btree (version_id, skill_id);


--
-- Name: job_role_versions_job_role_id_version_number_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX job_role_versions_job_role_id_version_number_key ON public.job_role_versions USING btree (job_role_id, version_number);


--
-- Name: job_roles_title_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX job_roles_title_key ON public.job_roles USING btree (title);


--
-- Name: learning_resources_skill_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX learning_resources_skill_id_idx ON public.learning_resources USING btree (skill_id);


--
-- Name: roles_role_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_role_name_key ON public.roles USING btree (role_name);


--
-- Name: skill_gap_details_report_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX skill_gap_details_report_id_idx ON public.skill_gap_details USING btree (report_id);


--
-- Name: skill_gap_reports_user_id_version_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX skill_gap_reports_user_id_version_id_idx ON public.skill_gap_reports USING btree (user_id, version_id);


--
-- Name: skill_prerequisites_skill_id_prerequisite_skill_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX skill_prerequisites_skill_id_prerequisite_skill_id_key ON public.skill_prerequisites USING btree (skill_id, prerequisite_skill_id);


--
-- Name: skills_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX skills_category_idx ON public.skills USING btree (category);


--
-- Name: skills_skill_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX skills_skill_code_key ON public.skills USING btree (skill_code);


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
-- Name: assessment_attempts trg_before_assessment_24bai0226_saisirichandana; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_before_assessment_24bai0226_saisirichandana BEFORE INSERT ON public.assessment_attempts FOR EACH ROW EXECUTE FUNCTION public.fn_before_assessment_24bai0226_saisirichandana();


--
-- Name: assessment_answers assessment_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_answers
    ADD CONSTRAINT assessment_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.assessment_attempts(attempt_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessment_answers assessment_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_answers
    ADD CONSTRAINT assessment_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.assessment_questions(question_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessment_attempts assessment_attempts_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessment_attempts assessment_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: assessment_questions assessment_questions_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions
    ADD CONSTRAINT assessment_questions_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: job_requirements job_requirements_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements
    ADD CONSTRAINT job_requirements_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_requirements job_requirements_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements
    ADD CONSTRAINT job_requirements_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.job_role_versions(version_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: job_role_versions job_role_versions_job_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_role_versions
    ADD CONSTRAINT job_role_versions_job_role_id_fkey FOREIGN KEY (job_role_id) REFERENCES public.job_roles(job_role_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: learning_resources learning_resources_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_resources
    ADD CONSTRAINT learning_resources_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_gap_details skill_gap_details_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gap_details
    ADD CONSTRAINT skill_gap_details_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.skill_gap_reports(report_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_gap_details skill_gap_details_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gap_details
    ADD CONSTRAINT skill_gap_details_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_gap_reports skill_gap_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gap_reports
    ADD CONSTRAINT skill_gap_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_gap_reports skill_gap_reports_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_gap_reports
    ADD CONSTRAINT skill_gap_reports_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.job_role_versions(version_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_prerequisites skill_prerequisites_prerequisite_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_prerequisites
    ADD CONSTRAINT skill_prerequisites_prerequisite_skill_id_fkey FOREIGN KEY (prerequisite_skill_id) REFERENCES public.skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: skill_prerequisites skill_prerequisites_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_prerequisites
    ADD CONSTRAINT skill_prerequisites_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(skill_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict vB7RYReYTmX1ymchMjWdDRafhL1pccv5cPwuhNgjuQOAyTTHw8soFj7MsbVjVL6

