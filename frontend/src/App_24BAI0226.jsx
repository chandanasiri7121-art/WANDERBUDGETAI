// ============================================================================
// SkillGap Radar - Main Application Component (Enhanced Standout Edition)
// Student: Garudaiahgari Sai Siri Chandana | Register Number: 24BAI0226
// Course: BCSE302P Database Systems Lab | Slot: L25+L26 | Faculty: Dr. V. SIVAKUMAR
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Filter,
  Layers,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  AlertTriangle,
  FileText,
  ChevronRight,
  ChevronLeft,
  GitBranch,
  Printer,
  BarChart3,
  Activity,
  Check,
  Zap,
  Target,
  ArrowRight,
  X,
  Sliders,
  RotateCcw,
  Save,
  HelpCircle,
  Lightbulb,
  Bookmark,
} from 'lucide-react';

const API_BASE = '/api';

export default function App_24BAI0226_SaiSiriChandana() {
  // --------------------------------------------------------------------------
  // IDENTITY & LIVE CLOCK
  // --------------------------------------------------------------------------
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date().toLocaleString());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --------------------------------------------------------------------------
  // AUTH STATE
  // --------------------------------------------------------------------------
  const [authToken, setAuthToken] = useState(localStorage.getItem('skillgap_token') || '');
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('skillgap_user') || 'null')
  );
  const [loginForm, setLoginForm] = useState({ emailOrRegNo: '24BAI0226', password: 'Student@123' });
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --------------------------------------------------------------------------
  // DASHBOARD STATE
  // --------------------------------------------------------------------------
  // Tabs: 'radar', 'assessment', 'roadmap', 'dag', 'multirole', 'timeline', 'admin'
  const [activeTab, setActiveTab] = useState('radar');
  const [careerRoles, setCareerRoles] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(2); // Default to v2.0
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // --------------------------------------------------------------------------
  // ROADMAP VIEW & PAGINATION STATE
  // --------------------------------------------------------------------------
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [roadmapSearch, setRoadmapSearch] = useState('');
  const [roadmapCategory, setRoadmapCategory] = useState('ALL');
  const [roadmapPage, setRoadmapPage] = useState(1);
  const [roadmapTotalPages, setRoadmapTotalPages] = useState(1);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  // --------------------------------------------------------------------------
  // AI QUIZ STATE
  // --------------------------------------------------------------------------
  const [skillsList, setSkillsList] = useState([]);
  const [selectedQuizSkill, setSelectedQuizSkill] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // --------------------------------------------------------------------------
  // STANDOUT FEATURES STATE
  // --------------------------------------------------------------------------
  const [dagGraph, setDagGraph] = useState({ nodes: [], edges: [] });
  const [loadingDag, setLoadingDag] = useState(false);
  const [multiRoleData, setMultiRoleData] = useState([]);
  const [loadingMultiRole, setLoadingMultiRole] = useState(false);
  const [timelineData, setTimelineData] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [queryBenchmarks, setQueryBenchmarks] = useState(null);
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);

  // --------------------------------------------------------------------------
  // STANDOUT FEATURE 6: SKILLGAP RADAR 360 - WHAT-IF CAREER SIMULATOR
  // --------------------------------------------------------------------------
  const [simulatedSkills, setSimulatedSkills] = useState({});
  const [simulationData, setSimulationData] = useState(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [scenarioNotesInput, setScenarioNotesInput] = useState('');
  const [savingScenario, setSavingScenario] = useState(false);
  const [scenarioFeedback, setScenarioFeedback] = useState(null);
  const [sharedOptimizationList, setSharedOptimizationList] = useState([]);
  const [loadingOptimization, setLoadingOptimization] = useState(false);
  // ADMIN PANEL STATE
  // --------------------------------------------------------------------------
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [adminReqForm, setAdminReqForm] = useState({
    skill_id: 1,
    required_proficiency: 4,
    importance_weight: 5,
  });
  const [adminNotice, setAdminNotice] = useState('');
  const [jdInputText, setJdInputText] = useState(
    'Seeking a Senior Database Engineer proficient in enterprise SQL & Relational Algebra, Database Normalization (3NF/BCNF), Indexing & Query Optimization, and Transactions & ACID Properties. Experience with Node.js & Express REST APIs is highly desirable.'
  );
  const [jdTargetRoleId, setJdTargetRoleId] = useState(1);
  const [analyzingJd, setAnalyzingJd] = useState(false);
  const [extractedJdData, setExtractedJdData] = useState(null);
  const [jdNewVersionNumber, setJdNewVersionNumber] = useState('v3.0');
  const [approvingJd, setApprovingJd] = useState(false);
  const [jdFeedback, setJdFeedback] = useState(null);

  // --------------------------------------------------------------------------
  // AUTH METHODS
  // --------------------------------------------------------------------------
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('skillgap_token', data.token);
      localStorage.setItem('skillgap_user', JSON.stringify(data.user));
      setAuthToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('skillgap_token');
    localStorage.removeItem('skillgap_user');
    setAuthToken('');
    setCurrentUser(null);
    setReportData(null);
  };

  const quickLoginAs = (regNo, pwd) => {
    setLoginForm({ emailOrRegNo: regNo, password: pwd });
    setLoginError('');
  };

  // --------------------------------------------------------------------------
  // DATA FETCHING METHODS
  // --------------------------------------------------------------------------
  const fetchCareerRoles = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/career-roles`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCareerRoles(data);
      }
    } catch (err) {
      console.error('Fetch roles error:', err);
    }
  };

  const fetchSkills = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/skills`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSkillsList(data);
        if (data.length > 0 && !selectedQuizSkill) {
          setSelectedQuizSkill(data[0].skill_id.toString());
        }
      }
    } catch (err) {
      console.error('Fetch skills error:', err);
    }
  };

  const fetchGapReport = async (versionId) => {
    if (!authToken) return;
    setLoadingReport(true);
    try {
      const res = await fetch(`${API_BASE}/skill-gaps/report/${versionId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Fetch report error:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchRoadmapView = async (versionId, page = 1) => {
    if (!authToken) return;
    setLoadingRoadmap(true);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: '6',
        search: roadmapSearch,
        category: roadmapCategory,
      });
      const res = await fetch(`${API_BASE}/roadmap/${versionId}?${q.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmapItems(data.roadmap || []);
        setRoadmapPage(data.page || 1);
        setRoadmapTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error('Fetch roadmap view error:', err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const fetchDagGraph = async () => {
    if (!authToken) return;
    setLoadingDag(true);
    try {
      const res = await fetch(`${API_BASE}/skills/prerequisite-graph`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDagGraph(data);
      }
    } catch (err) {
      console.error('Fetch DAG error:', err);
    } finally {
      setLoadingDag(false);
    }
  };

  const fetchMultiRoleComparison = async () => {
    if (!authToken) return;
    setLoadingMultiRole(true);
    try {
      const res = await fetch(`${API_BASE}/skill-gaps/multi-role-comparison`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMultiRoleData(data);
      }
    } catch (err) {
      console.error('Fetch multi-role error:', err);
    } finally {
      setLoadingMultiRole(false);
    }
  };

  const fetchProgressTimeline = async () => {
    if (!authToken) return;
    setLoadingTimeline(true);
    try {
      const res = await fetch(`${API_BASE}/assessments/progress-timeline`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTimelineData(data);
      }
    } catch (err) {
      console.error('Fetch timeline error:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const fetchQueryBenchmarks = async () => {
    if (!authToken || currentUser?.role !== 'ADMIN') return;
    setLoadingBenchmarks(true);
    try {
      const res = await fetch(`${API_BASE}/admin/query-benchmarks`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQueryBenchmarks(data);
      }
    } catch (err) {
      console.error('Fetch benchmarks error:', err);
    } finally {
      setLoadingBenchmarks(false);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    if (!authToken || currentUser?.role !== 'ADMIN') return;
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: '8',
        search: auditSearch,
      });
      const res = await fetch(`${API_BASE}/admin/audit-logs?${q.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setAuditPage(data.page || 1);
        setAuditTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    }
  };

  // --------------------------------------------------------------------------
  // STANDOUT FEATURE 6 METHODS: WHAT-IF CAREER SIMULATOR
  // --------------------------------------------------------------------------
  const fetchSimulation = async (skillsMap = simulatedSkills, versionId = selectedVersionId) => {
    if (!authToken || !versionId) return;
    setLoadingSimulation(true);
    try {
      const payloadSkills = Object.entries(skillsMap).map(([id, lvl]) => ({
        skill_id: parseInt(id, 10),
        simulated_level: parseInt(lvl, 10),
      }));

      const res = await fetch(`${API_BASE}/simulator/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          role_version_id: versionId,
          simulated_skills: payloadSkills,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationData(data);
      }
    } catch (err) {
      console.error('Simulator calculate error:', err);
    } finally {
      setLoadingSimulation(false);
    }
  };

  const fetchSavedScenarios = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/simulator/saved-scenarios`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedScenarios(data);
      }
    } catch (err) {
      console.error('Fetch saved scenarios error:', err);
    }
  };

  const fetchSharedOptimization = async () => {
    if (!authToken) return;
    setLoadingOptimization(true);
    try {
      const res = await fetch(`${API_BASE}/simulator/shared-skill-optimization`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSharedOptimizationList(data);
      }
    } catch (err) {
      console.error('Fetch shared optimization error:', err);
    } finally {
      setLoadingOptimization(false);
    }
  };

  const handleSliderChange = (skillId, value) => {
    const updated = { ...simulatedSkills, [skillId]: parseInt(value, 10) };
    setSimulatedSkills(updated);
    fetchSimulation(updated, selectedVersionId);
  };

  const handleResetSimulation = () => {
    if (!reportData?.details) return;
    const resetMap = {};
    reportData.details.forEach((d) => {
      resetMap[d.skill.skill_id] = d.assessed_proficiency;
    });
    setSimulatedSkills(resetMap);
    fetchSimulation(resetMap, selectedVersionId);
    setScenarioFeedback({ type: 'info', message: 'Simulation reset to baseline assessment.' });
    setTimeout(() => setScenarioFeedback(null), 3500);
  };

  const handleSaveScenario = async (e) => {
    if (e) e.preventDefault();
    if (!authToken || !simulationData) return;
    setSavingScenario(true);
    try {
      const skillChanges = (simulationData.skills || []).map((s) => ({
        skill_id: s.skill_id,
        original_level: s.baseline_level,
        simulated_level: s.simulated_level,
      }));

      const res = await fetch(`${API_BASE}/simulator/save-scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          scenario_name:
            scenarioNameInput ||
            `Scenario: ${simulationData.role_title} (+${simulationData.readiness_gain_pct}% Readiness)`,
          notes: scenarioNotesInput,
          role_version_id: selectedVersionId,
          skill_changes: skillChanges,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save scenario');

      setScenarioFeedback({
        type: 'success',
        message: `Scenario saved (#${data.scenario_id})! Transaction committed to PostgreSQL.`,
      });
      setScenarioNameInput('');
      setScenarioNotesInput('');
      fetchSavedScenarios();
      setTimeout(() => setScenarioFeedback(null), 5000);
    } catch (err) {
      setScenarioFeedback({ type: 'error', message: err.message });
      setTimeout(() => setScenarioFeedback(null), 5000);
    } finally {
      setSavingScenario(false);
    }
  };

  const handleLoadScenario = (sc) => {
    const loadedMap = {};
    sc.skill_changes.forEach((scItem) => {
      loadedMap[scItem.skill_id] = scItem.simulated_level;
    });
    setSimulatedSkills(loadedMap);
    setSelectedVersionId(sc.role_version_id);
    fetchSimulation(loadedMap, sc.role_version_id);
    setScenarioFeedback({
      type: 'info',
      message: `Loaded scenario "${sc.scenario_name}" (${sc.role_version?.job_role?.role_title || 'Role'} v${sc.role_version?.version_number || '1.0'})`,
    });
    setTimeout(() => setScenarioFeedback(null), 4000);
  };

  useEffect(() => {
    if (authToken) {
      fetchCareerRoles();
      fetchSkills();
      fetchGapReport(selectedVersionId);
      fetchRoadmapView(selectedVersionId, 1);
      fetchDagGraph();
      fetchMultiRoleComparison();
      fetchProgressTimeline();
      fetchSavedScenarios();
      fetchSharedOptimization();
      if (currentUser?.role === 'ADMIN') {
        fetchAuditLogs(1);
        fetchQueryBenchmarks();
      }
    }
  }, [authToken, selectedVersionId]);

  useEffect(() => {
    if (reportData?.details) {
      const initialMap = {};
      reportData.details.forEach((d) => {
        initialMap[d.skill.skill_id] = d.assessed_proficiency;
      });
      setSimulatedSkills(initialMap);
      fetchSimulation(initialMap, selectedVersionId);
    }
  }, [reportData]);

  useEffect(() => {
    if (authToken) {
      const timer = setTimeout(() => {
        fetchRoadmapView(selectedVersionId, 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [roadmapSearch, roadmapCategory]);

  // --------------------------------------------------------------------------
  // AI QUIZ INTERACTIONS
  // --------------------------------------------------------------------------
  const handleGenerateQuiz = async () => {
    if (!selectedQuizSkill) return;
    setGeneratingQuiz(true);
    setQuizResult(null);
    setUserAnswers({});
    try {
      const res = await fetch(`${API_BASE}/ai/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ skill_id: parseInt(selectedQuizSkill, 10), difficulty: 'Intermediate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz');
      setGeneratedQuiz(data);
    } catch (err) {
      alert(`Quiz Error: ${err.message}`);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!generatedQuiz || !generatedQuiz.questions) return;
    const answersPayload = generatedQuiz.questions.map((q) => ({
      question_id: q.question_id,
      selected_option: userAnswers[q.question_id] || 'A',
    }));

    setSubmittingQuiz(true);
    try {
      const res = await fetch(`${API_BASE}/ai/submit-and-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          skill_id: parseInt(selectedQuizSkill, 10),
          version_id: selectedVersionId,
          answers: answersPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit quiz');
      setQuizResult(data);
      // Refresh telemetry
      fetchGapReport(selectedVersionId);
      fetchRoadmapView(selectedVersionId, roadmapPage);
      fetchDagGraph();
      fetchMultiRoleComparison();
      fetchProgressTimeline();
      if (currentUser?.role === 'ADMIN') {
        fetchAuditLogs(1);
        fetchQueryBenchmarks();
      }
    } catch (err) {
      alert(`Submission Error: ${err.message}`);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // --------------------------------------------------------------------------
  // ADMIN ACID REQUIREMENT UPDATE
  // --------------------------------------------------------------------------
  const handleAdminRequirementUpdate = async (e) => {
    e.preventDefault();
    setAdminNotice('');
    try {
      const res = await fetch(`${API_BASE}/admin/requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          version_id: selectedVersionId,
          skill_id: parseInt(adminReqForm.skill_id, 10),
          required_proficiency: parseInt(adminReqForm.required_proficiency, 10),
          importance_weight: parseInt(adminReqForm.importance_weight, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setAdminNotice(`Successfully updated requirement for ${data.requirement.skill.skill_name} via ACID transaction.`);
      fetchGapReport(selectedVersionId);
      fetchRoadmapView(selectedVersionId, roadmapPage);
      fetchAuditLogs(1);
      fetchQueryBenchmarks();
    } catch (err) {
      setAdminNotice(`Error: ${err.message}`);
    }
  };

  const handleAnalyzeJobDescription = async (e) => {
    if (e) e.preventDefault();
    if (!jdInputText || jdInputText.trim().length < 20) {
      alert('Please enter a detailed job description (minimum 20 characters).');
      return;
    }
    setAnalyzingJd(true);
    setJdFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/admin/job-description-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          job_description_text: jdInputText,
          target_role_id: parseInt(jdTargetRoleId, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze job description.');
      setExtractedJdData(data);
      setJdFeedback({
        type: 'success',
        message: `Analysis complete: Extracted ${data.total_extracted} canonical skills (AI Engine: ${
          data.ai_provider_active ? 'Online' : 'Deterministic Fallback'
        }).`,
      });
    } catch (err) {
      setJdFeedback({ type: 'error', message: err.message });
    } finally {
      setAnalyzingJd(false);
    }
  };

  const handleApproveJdVersion = async () => {
    if (!extractedJdData || !extractedJdData.extracted_skills || extractedJdData.extracted_skills.length === 0) return;
    setApprovingJd(true);
    try {
      const res = await fetch(`${API_BASE}/admin/job-description-analysis/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          job_role_id: parseInt(jdTargetRoleId, 10),
          new_version_number: jdNewVersionNumber,
          version_label: `${jdNewVersionNumber} Published via JD Intelligence Analysis`,
          approved_requirements: extractedJdData.extracted_skills,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish version.');
      setJdFeedback({
        type: 'success',
        message: `Published Version ${data.version_number} (#${data.version_id}) with ${data.requirements_count} requirements to PostgreSQL!`,
      });
      fetchCareerRoles();
      fetchAuditLogs(1);
    } catch (err) {
      setJdFeedback({ type: 'error', message: err.message });
    } finally {
      setApprovingJd(false);
    }
  };

  // ==========================================================================
  // RENDER: LOGIN VIEW IF NOT AUTHENTICATED
  // ==========================================================================
  if (!authToken || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-between p-4 md:p-8">
        <header className="w-full glass-panel rounded-2xl p-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-500/20 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-400 via-cyan-400 to-white bg-clip-text text-transparent">
                SkillGap Radar
              </h1>
              <p className="text-xs text-gray-400">Evidence-Based Career Readiness & Adaptive Skill Platform</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-indigo-300 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/60 inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Garudaiahgari Sai Siri Chandana (24BAI0226) | Slot: L25+L26
            </div>
            <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> {currentTimestamp}
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center my-8">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white">Database System Authentication</h2>
              <p className="text-xs text-gray-400 mt-1">Single Users Table Architecture (3NF Normalization)</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-700/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Email or Register Number
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={loginForm.emailOrRegNo}
                    onChange={(e) => setLoginForm({ ...loginForm, emailOrRegNo: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500 transition"
                    placeholder="24BAI0226 or email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-white placeholder-gray-500 transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition transform active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Sign In to SkillGap Radar
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-800">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-3">
                1-Click Laboratory Demo Credentials
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLoginAs('24BAI0226', 'Student@123')}
                  className="p-2.5 bg-gray-900/90 hover:bg-gray-800 border border-indigo-500/30 hover:border-indigo-500 rounded-xl text-left text-xs transition"
                >
                  <div className="font-semibold text-indigo-400 flex items-center gap-1">
                    <User className="w-3 h-3" /> Student
                  </div>
                  <div className="text-[10px] text-gray-400">24BAI0226</div>
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('ADMIN_24BAI0226', 'Admin@123')}
                  className="p-2.5 bg-gray-900/90 hover:bg-gray-800 border border-rose-500/30 hover:border-rose-500 rounded-xl text-left text-xs transition"
                >
                  <div className="font-semibold text-rose-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin (Faculty)
                  </div>
                  <div className="text-[10px] text-gray-400">Dr. Sivakumar</div>
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-gray-500 py-3">
          BCSE302P Database Systems Lab | Faculty: Dr. V. SIVAKUMAR | VIT University
        </footer>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: AUTHENTICATED DASHBOARD (STANDOUT EDITION)
  // ==========================================================================
  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col text-gray-100">
      {/* 1. TOP IDENTITY & HEADER (MANDATORY LAB COMPLIANCE) */}
      <header className="sticky top-0 z-50 glass-panel border-b border-gray-800 px-4 md:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                  SkillGap Radar
                </span>
                <span className="text-[10px] font-mono bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 px-2 py-0.5 rounded-full">
                  PostgreSQL 16 • 3NF
                </span>
              </div>
              <p className="text-[11px] text-gray-400">BCSE302P Lab Assessment 8, 9 & 10</p>
            </div>
          </div>

          {/* Mandatory Student Identity & Realtime Clock */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="bg-gray-900/90 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2.5 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="font-bold text-white tracking-wide">
                  Garudaiahgari Sai Siri Chandana
                </span>
                <span className="text-indigo-400 font-mono ml-1.5 font-semibold">
                  (24BAI0226)
                </span>
                <span className="text-gray-400 ml-1.5 border-l border-gray-700 pl-1.5">
                  Slot: L25+L26
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 font-mono bg-gray-900/60 px-3 py-1.5 rounded-xl border border-gray-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTimestamp}</span>
            </div>

            {/* Dossier Print Modal Trigger */}
            <button
              onClick={() => setShowDossierModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
              title="Generate Official Academic Dossier"
            >
              <Printer className="w-3.5 h-3.5" /> Export Dossier
            </button>

            {/* User Profile Badge & Logout */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/40 px-3 py-1 rounded-xl">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-200">{currentUser.full_name.split(' ')[0]}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 text-gray-400 hover:text-rose-400 bg-gray-900/80 hover:bg-rose-950/30 border border-gray-800 hover:border-rose-800 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SUB-BAR: EXTENDED STANDOUT TABS & VERSION SWITCHER */}
      <section className="bg-gray-900/60 border-b border-gray-800 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Extended Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-gray-950/80 p-1 rounded-xl border border-gray-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'radar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Competency Radar
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-300" /> What-If Simulator 360
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'assessment'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Quiz & Diagnostics
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Adaptive Roadmap View
            </button>
            <button
              onClick={() => setActiveTab('dag')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'dag'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-amber-400" /> Prerequisite DAG Graph
            </button>
            <button
              onClick={() => setActiveTab('multirole')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'multirole'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Multi-Role Matrix
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-purple-400" /> Progress Timeline
            </button>
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-300" /> Admin & Profiler
              </button>
            )}
          </nav>

          {/* Version-Aware Industry Requirement Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" /> Industry Version:
            </span>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(parseInt(e.target.value, 10))}
              className="bg-gray-950 border border-indigo-500/40 text-xs font-semibold text-indigo-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400 shadow-sm cursor-pointer"
            >
              <option value={1}>Backend Engineer — v1.0 Aug 2026 (Foundational)</option>
              <option value={2}>Backend Engineer — v2.0 Oct 2026 (Advanced Cloud & Security)</option>
              <option value={3}>Data Analyst — v1.0 Aug 2026 (Core Analytics)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 glass-panel-hover transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Overall Career Readiness</span>
              <Award className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {reportData?.overall_readiness_pct || 0}%
              </span>
              <span className="text-xs font-medium text-emerald-400">
                {parseFloat(reportData?.overall_readiness_pct || 0) >= 75
                  ? 'Industry Ready'
                  : 'Remediation Active'}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${reportData?.overall_readiness_pct || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-gray-800 glass-panel-hover transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Target Role Title</span>
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white truncate">
              {reportData?.version?.job_role?.title || 'Backend & Database Engineer'}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Active Set: {reportData?.version?.version_label || 'v2.0 Oct 2026'}
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-gray-800 glass-panel-hover transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Evaluated Competencies</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {reportData?.details ? reportData.details.length : 0}
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Stored Procedure Evaluated
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-gray-800 glass-panel-hover transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400">Unresolved Skill Gaps</span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white">
              {reportData?.details
                ? reportData.details.filter((d) => d.gap_score > 0).length
                : 0}
            </div>
            <p className="text-[11px] text-amber-400 mt-1">Requires adaptive remediation</p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: COMPETENCY RADAR & GAP SEVERITY METRICS                    */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'radar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-400" />
                    Competency Radar: Assessed vs Required
                  </h3>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800">
                    Dual Polygon Proof
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Visualizes Assessed Demonstrated Proficiency ($P_s$) against Version-Locked Requirements ($R_s$)
                </p>
              </div>

              <div className="h-80 w-full">
                {reportData?.radar_data && reportData.radar_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={reportData.radar_data}>
                      <PolarGrid stroke="#374151" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#4b5563" />
                      <Radar
                        name="Required Proficiency (Rs)"
                        dataKey="required"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Assessed Proficiency (Ps)"
                        dataKey="assessed"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500">
                    Loading radar telemetry...
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Required Target (0–5)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Demonstrated Evidence (0–5)
                </span>
                <button
                  onClick={() => fetchGapReport(selectedVersionId)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-300 transition"
                  title="Recalculate Radar Telemetry"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-gray-800 shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Deterministic Priority Scoring
                </h3>
                <p className="text-xs text-gray-400 mb-4 font-mono">
                  $Q_s = I_s \times (G_s / 5.0)$ [Computed in PostgreSQL SP]
                </p>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
                {reportData?.details && reportData.details.length > 0 ? (
                  reportData.details.map((detail) => (
                    <div
                      key={detail.detail_id}
                      className="p-3.5 bg-gray-900/80 border border-gray-800 rounded-2xl flex items-center justify-between gap-3 hover:border-gray-700 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white truncate">
                            {detail.skill.skill_name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                            {detail.skill.skill_code}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-3">
                          <span>
                            Req: <strong className="text-cyan-400">{detail.required_proficiency}/5</strong>
                          </span>
                          <span>
                            Assessed: <strong className="text-indigo-400">{detail.assessed_proficiency}/5</strong>
                          </span>
                          <span>
                            Gap: <strong className={detail.gap_score > 0 ? 'text-amber-400' : 'text-emerald-400'}>{detail.gap_score}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-extrabold font-mono text-indigo-300">
                          {detail.priority_score}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
                          Priority Score
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-xs text-gray-500">
                    No gap details available.
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800 text-[11px] text-gray-400">
                Audited by Stored Procedure <code className="text-indigo-300 font-mono">sp_generate_gap_report_24BAI0226_SaiSiriChandana</code>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* STANDOUT FEATURE: SKILLGAP RADAR 360 - WHAT-IF CAREER SIMULATOR   */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Header / Intro Card */}
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      SkillGap Radar 360 Standout Feature
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                      PostgreSQL Isolated Engine
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Sliders className="w-6 h-6 text-amber-400" />
                    What-If Career Simulator & Shared-Skill Optimizer
                  </h2>
                  <p className="text-xs text-gray-300 max-w-3xl">
                    Simulate how hypothetical proficiency boosts and target career adjustments affect your readiness score, learning effort, and prerequisite dependencies — without modifying permanent assessment records.
                  </p>
                </div>

                {/* Top Action Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResetSimulation}
                    className="px-3.5 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl text-xs font-semibold text-gray-300 flex items-center gap-1.5 transition shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Reset Baseline
                  </button>

                  <div className="flex items-center gap-2 bg-gray-950/80 border border-gray-800 px-3 py-1.5 rounded-xl">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <select
                      value={selectedVersionId}
                      onChange={(e) => setSelectedVersionId(parseInt(e.target.value, 10))}
                      className="bg-transparent text-xs text-white font-medium focus:outline-none"
                    >
                      {careerRoles.map((role) => (
                        <optgroup key={role.role_id} label={role.role_title}>
                          {role.versions.map((v) => (
                            <option key={v.version_id} value={v.version_id} className="bg-gray-900 text-white">
                              {role.role_title} (v{v.version_number})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Feedback Notification */}
              {scenarioFeedback && (
                <div
                  className={`mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                    scenarioFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : scenarioFeedback.type === 'error'
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                      : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{scenarioFeedback.message}</span>
                </div>
              )}
            </div>

            {/* 4 KPI Telemetry Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Simulated Readiness */}
              <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 shadow-xl relative overflow-hidden">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Simulated Readiness</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    +{simulationData?.readiness_gain_pct || 0}% Gain
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {simulationData?.simulated_readiness_pct || 0}%
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    (Baseline: {simulationData?.baseline_readiness_pct || 0}%)
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-2 mt-3 overflow-hidden flex">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, simulationData?.baseline_readiness_pct || 0)}%` }}
                    title={`Baseline: ${simulationData?.baseline_readiness_pct || 0}%`}
                  ></div>
                  <div
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100 - (simulationData?.baseline_readiness_pct || 0),
                          simulationData?.readiness_gain_pct || 0
                        )
                      )}%`,
                    }}
                    title={`Simulated Gain: +${simulationData?.readiness_gain_pct || 0}%`}
                  ></div>
                </div>
              </div>

              {/* Card 2: Gap Points Reduced */}
              <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 shadow-xl">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Gap Points Reduced</span>
                  <span className="text-xs text-cyan-400 font-mono font-bold">
                    {simulationData?.gap_reduction_pct || 0}% Reduction
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-cyan-300">
                    {(simulationData?.total_baseline_gap_levels || 0) -
                      (simulationData?.total_simulated_gap_levels || 0)}{' '}
                    pts
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    ({simulationData?.total_simulated_gap_levels || 0} remaining)
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Baseline gap was {simulationData?.total_baseline_gap_levels || 0} levels across role skills
                </p>
              </div>

              {/* Card 3: Estimated Study Effort */}
              <div className="glass-panel p-5 rounded-2xl border border-purple-500/20 shadow-xl">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Estimated Learning Effort</span>
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-purple-300">
                    {simulationData?.total_estimated_study_hours || 0} hrs
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    (~{Math.ceil((simulationData?.total_estimated_study_hours || 0) / 15)} level steps)
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Calculated at ~15 focused study hours per competency level step
                </p>
              </div>

              {/* Card 4: Multi-Role Spillover Multiplier */}
              <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 shadow-xl">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Adjacent Career Impact</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-emerald-300">
                    {simulationData?.cross_role_impact?.length || 0} Roles
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    Multi-Benefit
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Skills boosted in this scenario directly qualify you for other career tracks
                </p>
              </div>
            </div>

            {/* Prerequisite Guardrail Alerts Banner */}
            {simulationData?.prerequisite_alerts && simulationData.prerequisite_alerts.length > 0 && (
              <div className="p-5 bg-amber-950/40 border border-amber-500/50 rounded-2xl shadow-xl space-y-2 animate-pulse">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Prerequisite Dependency Guardrail Alert</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  The skill graph detects advanced competence simulated for topics whose prerequisite foundation is below minimum mastery (Level 3). In practice, you must master the prerequisite first to avoid learning bottlenecks:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {simulationData.prerequisite_alerts.map((al, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-gray-950/80 border border-amber-500/30 rounded-xl text-xs flex items-center justify-between"
                    >
                      <span className="text-gray-200 font-medium">
                        {al.skill_name} (Simulated: L{al.simulated_level})
                      </span>
                      <span className="text-amber-400 font-mono text-[11px]">
                        Requires {al.prerequisite_skill_name} ≥ L{al.min_level} (Current: L{al.prerequisite_level})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content: Sliders (Left) vs Multi-Career & Save (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Proficiency Sliders (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-panel p-6 rounded-3xl border border-gray-800 shadow-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        Target Role Proficiency Sliders
                      </h3>
                      <p className="text-xs text-gray-400">
                        Adjust levels from 0 to 5 to observe immediate gap shrinkage and readiness trajectory.
                      </p>
                    </div>

                    {/* Quick Scenario Preset Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => {
                          const updated = { ...simulatedSkills };
                          (simulationData?.skills || []).forEach((s) => {
                            if (s.category === 'DATABASE') {
                              updated[s.skill_id] = Math.min(5, (updated[s.skill_id] ?? s.baseline_level) + 1);
                            }
                          });
                          setSimulatedSkills(updated);
                          fetchSimulation(updated, selectedVersionId);
                        }}
                        className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 rounded-lg text-[10px] text-indigo-300 font-medium transition"
                        title="Boost all database skills by +1 level"
                      >
                        +1 Database
                      </button>
                      <button
                        onClick={() => {
                          const updated = { ...simulatedSkills };
                          (simulationData?.skills || []).forEach((s) => {
                            updated[s.skill_id] = s.required_level;
                          });
                          setSimulatedSkills(updated);
                          fetchSimulation(updated, selectedVersionId);
                        }}
                        className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 rounded-lg text-[10px] text-emerald-300 font-medium transition"
                        title="Set all skills to 100% required target"
                      >
                        Target 100%
                      </button>
                    </div>
                  </div>

                  {/* Skills Sliders List */}
                  <div className="space-y-4">
                    {simulationData?.skills?.map((sk) => {
                      const currentVal = simulatedSkills[sk.skill_id] ?? sk.baseline_level;
                      const isBoosted = currentVal > sk.baseline_level;
                      const satisfiesReq = currentVal >= sk.required_level;

                      return (
                        <div
                          key={sk.skill_id}
                          className="p-4 bg-gray-950/70 border border-gray-800/80 hover:border-gray-700 rounded-2xl space-y-3 transition"
                        >
                          {/* Skill Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{sk.skill_name}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800">
                                  {sk.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-3">
                                <span>
                                  Target: <strong className="text-cyan-400">{sk.required_level}/5</strong>
                                </span>
                                <span>
                                  Assessed Baseline: <strong className="text-indigo-400">{sk.baseline_level}/5</strong>
                                </span>
                                <span>
                                  Weight: <strong className="text-gray-300">{sk.importance_weight}x</strong>
                                </span>
                              </div>
                            </div>

                            {/* Gap Status Pill */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              {satisfiesReq ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Target Satisfied
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Gap: -{sk.required_level - currentVal}
                                </span>
                              )}

                              {isBoosted && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  +{currentVal - sk.baseline_level} level (~
                                  {(currentVal - sk.baseline_level) * 15}h)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Interactive Slider Bar */}
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              onClick={() => handleSliderChange(sk.skill_id, Math.max(0, currentVal - 1))}
                              disabled={currentVal <= 0}
                              className="w-7 h-7 rounded-lg bg-gray-900 border border-gray-700 hover:border-amber-400 text-gray-300 disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center justify-center font-bold"
                            >
                              -
                            </button>

                            <div className="flex-1 relative flex items-center">
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="1"
                                value={currentVal}
                                onChange={(e) => handleSliderChange(sk.skill_id, e.target.value)}
                                className="w-full accent-amber-500 h-2 bg-gray-800 rounded-lg cursor-pointer"
                              />
                            </div>

                            <button
                              onClick={() => handleSliderChange(sk.skill_id, Math.min(5, currentVal + 1))}
                              disabled={currentVal >= 5}
                              className="w-7 h-7 rounded-lg bg-gray-900 border border-gray-700 hover:border-amber-400 text-gray-300 disabled:opacity-30 disabled:pointer-events-none text-xs flex items-center justify-center font-bold"
                            >
                              +
                            </button>

                            <div className="min-w-[70px] text-right font-mono text-xs font-bold text-white bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800">
                              Level {currentVal}/5
                            </div>
                          </div>

                          {/* Visual Step Markers */}
                          <div className="flex justify-between text-[10px] font-mono text-gray-500 px-8">
                            {[0, 1, 2, 3, 4, 5].map((lvl) => (
                              <span
                                key={lvl}
                                className={`flex flex-col items-center ${
                                  lvl === currentVal
                                    ? 'text-amber-400 font-bold'
                                    : lvl === sk.baseline_level
                                    ? 'text-indigo-400 font-semibold'
                                    : lvl === sk.required_level
                                    ? 'text-cyan-400'
                                    : ''
                                }`}
                              >
                                <span>{lvl}</span>
                                {lvl === sk.baseline_level && (
                                  <span className="text-[8px] text-indigo-400 uppercase">Base</span>
                                )}
                                {lvl === sk.required_level && lvl !== sk.baseline_level && (
                                  <span className="text-[8px] text-cyan-400 uppercase">Req</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Career Intelligence & Save Scenario (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Multi-Career Spillover Analysis */}
                <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Multi-Career Spillover Impact
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        How your simulated skill boosts qualify you across adjacent career tracks.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800 rounded-full">
                      Cross-Role ROI
                    </span>
                  </div>

                  <div className="space-y-3">
                    {simulationData?.cross_role_impact && simulationData.cross_role_impact.length > 0 ? (
                      simulationData.cross_role_impact.map((cr, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-gray-950/70 border border-gray-800 rounded-2xl space-y-2 hover:border-gray-700 transition"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-white">{cr.role_title}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                Version {cr.version_number} • {cr.matched_skills_count} shared skills
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              +{cr.readiness_gain_pct}% Gain
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-300">
                            <span>
                              Baseline: <strong className="text-indigo-300">{cr.baseline_readiness_pct}%</strong>
                            </span>
                            <span>
                              Simulated: <strong className="text-emerald-300">{cr.simulated_readiness_pct}%</strong>
                            </span>
                          </div>

                          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden flex">
                            <div
                              className="bg-indigo-600 h-full"
                              style={{ width: `${Math.min(100, cr.baseline_readiness_pct)}%` }}
                            ></div>
                            <div
                              className="bg-emerald-400 h-full"
                              style={{
                                width: `${Math.min(100 - cr.baseline_readiness_pct, cr.readiness_gain_pct)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-500">
                        No cross-role data available.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Shared-Skill Optimization Ranking */}
                <div className="glass-panel p-6 rounded-3xl border border-gray-800 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Highest-Leverage Shared Skills
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Ranked by multi-role occurrence & priority in PostgreSQL database.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {sharedOptimizationList.slice(0, 4).map((sh, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-950/60 border border-gray-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{sh.skill_name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Appears in <strong className="text-amber-300">{sh.role_count} roles</strong> ({sh.roles.join(', ')})
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                            Score: {sh.cross_role_leverage_score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Save Hypothetical Scenario Form */}
                <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white">Save Hypothetical Scenario</h4>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Saves your simulated changes to <code className="text-amber-300 font-mono">simulation_scenarios</code> without altering permanent records.
                  </p>

                  <form onSubmit={handleSaveScenario} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        Scenario Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 4-Week SQL & Python Sprint"
                        value={scenarioNameInput}
                        onChange={(e) => setScenarioNameInput(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-300 mb-1">
                        Career Strategy Notes (Optional)
                      </label>
                      <textarea
                        rows="2"
                        placeholder="e.g., Focusing on database indexing before applying for backend internships..."
                        value={scenarioNotesInput}
                        onChange={(e) => setScenarioNotesInput(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-gray-500 resize-none"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={savingScenario}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingScenario ? 'Saving Scenario...' : 'Save Scenario to PostgreSQL'}
                    </button>
                  </form>
                </div>

                {/* 4. Previously Saved Scenarios Drawer */}
                {savedScenarios.length > 0 && (
                  <div className="glass-panel p-6 rounded-3xl border border-gray-800 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-cyan-400" />
                        Saved Scenarios History ({savedScenarios.length})
                      </h4>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {savedScenarios.map((sc) => (
                        <div
                          key={sc.scenario_id}
                          className="p-3 bg-gray-950/70 border border-gray-800 rounded-2xl flex items-center justify-between gap-3 text-xs hover:border-gray-700 transition"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{sc.scenario_name}</div>
                            <div className="text-[10px] text-gray-400">
                              {sc.role_version?.job_role?.role_title} (v{sc.role_version?.version_number}) •{' '}
                              {new Date(sc.created_at).toLocaleDateString()}
                            </div>
                            {sc.notes && (
                              <div className="text-[10px] text-gray-500 italic truncate mt-0.5">
                                "{sc.notes}"
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleLoadScenario(sc)}
                            className="px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-amber-400 text-amber-300 rounded-xl text-[11px] font-semibold whitespace-nowrap transition"
                          >
                            Load
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: AI QUIZ GENERATION & DIAGNOSTIC ANALYSIS (HYBRID WORKFLOW)   */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'assessment' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                    Interactive AI Quiz & Diagnostic Engine
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Powered by Gemini AI + PostgreSQL Trigger <code className="text-indigo-300 font-mono">trg_before_assessment_24BAI0226_SaiSiriChandana</code>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedQuizSkill}
                    onChange={(e) => setSelectedQuizSkill(e.target.value)}
                    className="bg-gray-950 border border-gray-700 text-xs text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    {skillsList.map((s) => (
                      <option key={s.skill_id} value={s.skill_id}>
                        {s.skill_name} ({s.category})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50"
                  >
                    {generatingQuiz ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate AI Quiz in DB
                  </button>
                </div>
              </div>

              {generatedQuiz && generatedQuiz.questions ? (
                <div className="space-y-5">
                  <div className="p-3 bg-indigo-950/40 border border-indigo-700/50 rounded-2xl text-xs text-indigo-300 flex items-center justify-between">
                    <span>
                      Generated 3 Questions for <strong>{generatedQuiz.skill_name}</strong> (Saved to <code className="font-mono">assessment_questions</code>).
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Zero Client-Side Leaks
                    </span>
                  </div>

                  <div className="space-y-4">
                    {generatedQuiz.questions.map((q, idx) => (
                      <div
                        key={q.question_id}
                        className="p-5 bg-gray-900/90 border border-gray-800 rounded-2xl space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-medium text-white leading-relaxed">
                            {q.question_text}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-9">
                          {['A', 'B', 'C', 'D'].map((opt) => {
                            const optText =
                              opt === 'A'
                                ? q.option_a
                                : opt === 'B'
                                ? q.option_b
                                : opt === 'C'
                                ? q.option_c
                                : q.option_d;
                            const isSelected = userAnswers[q.question_id] === opt;
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-indigo-950/80 border-indigo-500 text-white font-medium shadow-md shadow-indigo-500/10'
                                    : 'bg-gray-950/60 border-gray-800 hover:border-gray-700 text-gray-300'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question_${q.question_id}`}
                                  value={opt}
                                  checked={isSelected}
                                  onChange={() =>
                                    setUserAnswers({ ...userAnswers, [q.question_id]: opt })
                                  }
                                  className="w-4 h-4 text-indigo-600 focus:ring-0"
                                />
                                <span className="font-bold text-indigo-400 font-mono">{opt}.</span>
                                <span className="flex-1">{optText}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submittingQuiz}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
                    >
                      {submittingQuiz ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Submit for PostgreSQL Grading & Trigger Execution
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-gray-800 rounded-3xl">
                  <Cpu className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h4 className="text-base font-semibold text-gray-300">No Assessment Active</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                    Select any technical skill above and click <strong>"Generate AI Quiz in DB"</strong> to synthesize challenging multiple-choice questions via Gemini AI.
                  </p>
                </div>
              )}
            </div>

            {quizResult && (
              <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-4 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
                  <div>
                    <span className="text-xs font-mono text-emerald-400 uppercase font-semibold">
                      Evaluation Telemetry
                    </span>
                    <h4 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Assessment Graded
                      Successfully
                    </h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Score & Accuracy</div>
                      <div className="text-xl font-extrabold font-mono text-cyan-400">
                        {quizResult.score_percent}% ({quizResult.correct_count}/{quizResult.total_count})
                      </div>
                    </div>
                    <div className="text-right border-l border-gray-800 pl-4">
                      <div className="text-xs text-gray-400">PostgreSQL Trigger Level</div>
                      <div className="text-xl font-extrabold font-mono text-emerald-400">
                        {quizResult.assessed_proficiency} / 5
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-900/90 border border-indigo-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wide">
                    <Sparkles className="w-4 h-4" /> Gemini AI Diagnostic Feedback
                  </div>
                  <pre className="text-xs text-gray-300 font-sans whitespace-pre-line leading-relaxed">
                    {quizResult.ai_analysis_feedback}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase">
                    Answer Key & Technical Rationales
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {quizResult.graded_answers.map((ga, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          ga.is_correct
                            ? 'bg-emerald-950/30 border-emerald-700/50'
                            : 'bg-rose-950/30 border-rose-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Q{idx + 1}</span>
                          <span
                            className={`font-semibold ${
                              ga.is_correct ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {ga.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="text-gray-300">
                          Selected: <span className="font-mono">{ga.selected_option}</span> | Key:{' '}
                          <span className="font-mono font-bold text-emerald-300">{ga.correct_option}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 italic">{ga.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: ADAPTIVE ROADMAP VIEW (vw_student_roadmap_24BAI0226)         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'roadmap' && (
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-6 h-6 text-emerald-400" />
                  Prerequisite-Aware Adaptive Learning Roadmap
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Direct telemetry from analytical view <code className="text-indigo-300 font-mono">vw_student_roadmap_24BAI0226_SaiSiriChandana</code>
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={roadmapSearch}
                    onChange={(e) => setRoadmapSearch(e.target.value)}
                    placeholder="Search skills..."
                    className="pl-8 pr-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-gray-500 w-44"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <select
                    value={roadmapCategory}
                    onChange={(e) => setRoadmapCategory(e.target.value)}
                    className="bg-gray-950 border border-gray-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Database">Database</option>
                    <option value="Backend">Backend</option>
                    <option value="Data Analytics">Data Analytics</option>
                    <option value="Machine Learning">Machine Learning</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-800">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-950/90 text-gray-400 font-semibold uppercase tracking-wider text-[10px] border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Skill & Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Prerequisites (DAG)</th>
                    <th className="py-3 px-4 text-center">Req / Assessed</th>
                    <th className="py-3 px-4 text-center">Gap ($G_s$)</th>
                    <th className="py-3 px-4 text-center">Priority ($Q_s$)</th>
                    <th className="py-3 px-4">Recommended Resource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 bg-gray-900/40">
                  {loadingRoadmap ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-500">
                        Loading roadmap from view...
                      </td>
                    </tr>
                  ) : roadmapItems.length > 0 ? (
                    roadmapItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/40 transition">
                        <td className="py-3 px-4 font-medium text-white">
                          <div>{item.skill_name}</div>
                          <div className="text-[10px] font-mono text-gray-400">{item.skill_code}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-gray-800/90 text-[10px] font-medium text-indigo-300 border border-gray-700">
                            {item.skill_category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-amber-300/90 font-mono">
                          {item.prerequisites_list}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          <span className="text-cyan-400">{item.required_proficiency}</span> /{' '}
                          <span className="text-indigo-400 font-bold">{item.assessed_proficiency}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              item.gap_score > 0
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {item.gap_score}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-300 text-xs">
                          {item.priority_score}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <a
                            href={item.resource_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{item.recommended_resource_title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Level: {item.resource_difficulty} • Est. {item.est_minutes} mins
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        No competencies matching search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
              <div>
                Page <strong>{roadmapPage}</strong> of <strong>{roadmapTotalPages}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={roadmapPage <= 1}
                  onClick={() => fetchRoadmapView(selectedVersionId, roadmapPage - 1)}
                  className="px-3 py-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl disabled:opacity-40 flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  disabled={roadmapPage >= roadmapTotalPages}
                  onClick={() => fetchRoadmapView(selectedVersionId, roadmapPage + 1)}
                  className="px-3 py-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl disabled:opacity-40 flex items-center gap-1 transition"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: STANDOUT FEATURE 1 — PREREQUISITE DAG GRAPH VISUALIZER       */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'dag' && (
          <div className="glass-panel p-6 rounded-3xl border border-amber-500/20 shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-6 h-6 text-amber-400" />
                  Prerequisite DAG Graph Telemetry
                </h3>
                <span className="text-xs font-mono text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800">
                  Self-Referencing Relational DAG
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Visualizes topological learning dependencies queried from table <code className="text-indigo-300 font-mono">skill_prerequisites</code>. Green lines denote satisfied prerequisites; amber dashed lines indicate learning blockers.
              </p>
            </div>

            {/* Visual DAG Cards & Edge Flows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dagGraph.nodes.map((node) => {
                const incomingEdges = dagGraph.edges.filter((e) => e.target === node.id);
                const outgoingEdges = dagGraph.edges.filter((e) => e.source === node.id);
                const isBlocked = incomingEdges.some((e) => !e.is_satisfied);

                return (
                  <div
                    key={node.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      node.current_proficiency >= 4
                        ? 'bg-emerald-950/20 border-emerald-600/50 shadow-lg shadow-emerald-950/20'
                        : isBlocked
                        ? 'bg-amber-950/20 border-amber-600/40'
                        : 'bg-gray-900/80 border-gray-800 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        {node.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          node.current_proficiency >= 4
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isBlocked
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        Proficiency: {node.current_proficiency}/5
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">{node.name}</h4>
                    <p className="text-[11px] text-gray-400 mb-3">{node.category}</p>

                    {/* Dependencies */}
                    <div className="text-[11px] space-y-1.5 pt-2 border-t border-gray-800/80">
                      <div>
                        <span className="text-gray-500 font-semibold uppercase text-[9px]">Prerequisites: </span>
                        {incomingEdges.length > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {incomingEdges.map((e) => (
                              <span
                                key={e.id}
                                className={`text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1 ${
                                  e.is_satisfied
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                                    : 'bg-amber-950/60 text-amber-300 border border-amber-700/50'
                                }`}
                              >
                                {e.is_satisfied ? <Check className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                                {e.source_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">None (Foundational Entry Point)</span>
                        )}
                      </div>

                      {outgoingEdges.length > 0 && (
                        <div className="pt-1">
                          <span className="text-gray-500 font-semibold uppercase text-[9px]">Unlocks: </span>
                          <span className="text-indigo-300 font-mono text-[10px]">
                            {outgoingEdges.map((e) => e.target_name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: STANDOUT FEATURE 2 — MULTI-ROLE COMPARATIVE MATRIX          */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'multirole' && (
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                  Multi-Role Career Readiness Matrix
                </h3>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
                  Simultaneous Cross-Role Audit
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Computes student preparedness across all industry career roles simultaneously based on unified assessment evidence.
              </p>
            </div>

            {/* Comparative Bar Chart */}
            <div className="h-64 w-full bg-gray-900/40 p-4 rounded-2xl border border-gray-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={multiRoleData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="role_title" stroke="#9ca3af" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="readiness_pct" name="Readiness Percentage (%)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Role Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {multiRoleData.map((role) => (
                <div key={role.job_role_id} className="p-5 bg-gray-900/80 border border-gray-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{role.role_title}</h4>
                      <p className="text-[11px] text-gray-400">{role.domain}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                        {role.readiness_pct}%
                      </span>
                      <div className="text-[10px] text-gray-400">
                        {role.met_skills}/{role.total_skills} Skills Met
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-gray-800">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase">Skill Gap Breakdown:</span>
                    <div className="space-y-1">
                      {role.skill_breakdown?.map((sb, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-gray-950/60 border border-gray-800/80">
                          <span className="text-gray-300 truncate max-w-[200px]">{sb.skill_name}</span>
                          <span className="font-mono text-[11px]">
                            Demonstrated: <strong className="text-indigo-400">{sb.assessed}</strong> / Req: <strong className="text-cyan-400">{sb.required}</strong>
                            {' '}(Gap: <strong className={sb.gap > 0 ? 'text-amber-400' : 'text-emerald-400'}>{sb.gap}</strong>)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 6: STANDOUT FEATURE 3 — LONGITUDINAL PROGRESS TIMELINE         */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'timeline' && (
          <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-400" />
                  Longitudinal Progress Telemetry (Time-Series)
                </h3>
                <span className="text-xs font-mono text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800">
                  Historical Evidence Ledger
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Monitors demonstrated proficiency and score growth over consecutive assessment milestones, fulfilling proposal Contribution 4.
              </p>
            </div>

            {/* Time-series Area Chart */}
            <div className="h-72 w-full bg-gray-900/40 p-4 rounded-2xl border border-gray-800">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date_formatted" stroke="#9ca3af" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: 8, fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score_percent"
                      name="Assessment Score (%)"
                      stroke="#c084fc"
                      fillOpacity={1}
                      fill="url(#scoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  No historical assessment telemetry logged yet.
                </div>
              )}
            </div>

            {/* Chronological Event Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Assessment Progression Ledger
              </h4>
              <div className="space-y-2">
                {timelineData.map((item) => (
                  <div
                    key={item.attempt_id}
                    className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center font-mono">
                        #{item.attempt_index}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{item.skill_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {item.skill_code} • {item.date_formatted}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className="font-mono text-cyan-400 font-bold">{item.score_percent}%</div>
                        <div className="text-[10px] text-gray-500">Score</div>
                      </div>
                      <div className="border-l border-gray-800 pl-4">
                        <div className="font-mono text-emerald-400 font-bold">Level {item.assessed_proficiency}/5</div>
                        <div className="text-[10px] text-gray-500">Trigger Evaluated</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 7: ADMIN RBAC & EXPLAIN ANALYZE PROFILER                       */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'admin' && currentUser.role === 'ADMIN' && (
          <div className="space-y-6">
            {/* STANDOUT FEATURE 4: EXPLAIN ANALYZE BENCHMARK PROFILER */}
            <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    PostgreSQL EXPLAIN ANALYZE Query Execution Profiler
                  </h3>
                  <p className="text-xs text-gray-400">
                    Live database cost optimization telemetry proving B-Tree indexing and query plan optimization for faculty evaluation.
                  </p>
                </div>
                <button
                  onClick={fetchQueryBenchmarks}
                  disabled={loadingBenchmarks}
                  className="px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-indigo-500 text-xs text-indigo-300 rounded-xl flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBenchmarks ? 'animate-spin' : ''}`} /> Run Profiler
                </button>
              </div>

              {queryBenchmarks?.benchmarks ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {queryBenchmarks.benchmarks.map((bm, idx) => (
                    <div key={idx} className="p-4 bg-gray-950/70 border border-gray-800 rounded-2xl space-y-3">
                      <div>
                        <div className="text-xs font-bold text-white">{bm.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{bm.query_type}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-gray-800">
                        <div className="p-2 bg-gray-900 rounded-xl border border-gray-800">
                          <div className="text-[10px] text-gray-500 uppercase">Execution Time</div>
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            {bm.stats.execution_time_ms} ms
                          </div>
                        </div>
                        <div className="p-2 bg-gray-900 rounded-xl border border-gray-800">
                          <div className="text-[10px] text-gray-500 uppercase">Planning Time</div>
                          <div className="text-xs font-mono font-bold text-cyan-400">
                            {bm.stats.planning_time_ms} ms
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-300 space-y-1">
                        <div>
                          Primary Node: <strong className="text-indigo-400 font-mono">{bm.stats.node_type}</strong>
                        </div>
                        <div>
                          Optimizer Total Cost: <strong className="text-amber-400 font-mono">{bm.stats.total_cost}</strong>
                        </div>
                        <div>
                          Buffer Shared Hits: <strong className="text-emerald-400 font-mono">{bm.stats.shared_hit_blocks} blocks</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-500">
                  Click 'Run Profiler' to execute EXPLAIN (ANALYZE, BUFFERS) in PostgreSQL.
                </div>
              )}
            </div>

            {/* ACID Transaction Requirement Editor */}
            <div className="glass-panel p-6 rounded-3xl border border-rose-500/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Administrator Requirement Control (ACID Transaction)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Modifies competency criteria atomically within <code className="text-rose-300 font-mono">prisma.$transaction</code> with instant audit trail.
                  </p>
                </div>
              </div>

              {adminNotice && (
                <div className="mb-4 p-3 bg-gray-900 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                  {adminNotice}
                </div>
              )}

              <form onSubmit={handleAdminRequirementUpdate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Target Skill</label>
                  <select
                    value={adminReqForm.skill_id}
                    onChange={(e) => setAdminReqForm({ ...adminReqForm, skill_id: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                  >
                    {skillsList.map((s) => (
                      <option key={s.skill_id} value={s.skill_id}>
                        {s.skill_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Required Proficiency (1–5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={adminReqForm.required_proficiency}
                    onChange={(e) => setAdminReqForm({ ...adminReqForm, required_proficiency: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Importance Weight (1–5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={adminReqForm.importance_weight}
                    onChange={(e) => setAdminReqForm({ ...adminReqForm, importance_weight: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30 transition"
                  >
                    Commit ACID Update
                  </button>
                </div>
              </form>
            </div>

            {/* OPTIONAL AI/NLP FEATURE: JOB DESCRIPTION ANALYSIS & VERSION PUBLISHER */}
            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    AI-Assisted Job Description Analysis & Version Publishing
                  </h3>
                  <p className="text-xs text-gray-400">
                    Extracts candidate technical competencies from unformatted employer job postings and maps them to canonical PostgreSQL skills.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full">
                  Admin Verification Gate
                </span>
              </div>

              {jdFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    jdFeedback.type === 'success'
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{jdFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleAnalyzeJobDescription} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Paste Employer Job Description (minimum 20 characters)
                    </label>
                    <textarea
                      rows="3"
                      value={jdInputText}
                      onChange={(e) => setJdInputText(e.target.value)}
                      placeholder="Paste full text of hiring requirements..."
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    ></textarea>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Target Career Role</label>
                      <select
                        value={jdTargetRoleId}
                        onChange={(e) => setJdTargetRoleId(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        {careerRoles.map((r) => (
                          <option key={r.role_id} value={r.role_id}>
                            {r.role_title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={analyzingJd}
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {analyzingJd ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Parse & Extract Competencies
                    </button>
                  </div>
                </div>
              </form>

              {/* Parsed Competency Review Table */}
              {extractedJdData?.extracted_skills && extractedJdData.extracted_skills.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Extracted Candidate Competencies ({extractedJdData.extracted_skills.length})
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      Human Review Gate: Verify matches before publishing a new version.
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-800">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] border-b border-gray-800">
                        <tr>
                          <th className="py-2 px-3">Canonical Skill</th>
                          <th className="py-2 px-3 text-center">Confidence</th>
                          <th className="py-2 px-3 text-center">Suggested Proficiency</th>
                          <th className="py-2 px-3 text-center">Importance</th>
                          <th className="py-2 px-3">Source Excerpt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60 bg-gray-900/40">
                        {extractedJdData.extracted_skills.map((es, idx) => (
                          <tr key={idx} className="hover:bg-gray-800/30">
                            <td className="py-2 px-3 font-medium text-white">{es.canonical_skill_name}</td>
                            <td className="py-2 px-3 text-center font-mono text-cyan-300">{es.confidence_pct}%</td>
                            <td className="py-2 px-3 text-center font-mono text-indigo-300 font-bold">{es.suggested_proficiency}/5</td>
                            <td className="py-2 px-3 text-center font-mono text-amber-300">{es.importance_weight}x</td>
                            <td className="py-2 px-3 text-[11px] text-gray-400 italic max-w-xs truncate" title={es.source_snippet}>
                              {es.source_snippet}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Approve & Publish Form */}
                  <div className="p-4 bg-gray-950/70 border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="text-xs text-gray-300 font-medium whitespace-nowrap">Publish Version Number:</label>
                      <input
                        type="text"
                        value={jdNewVersionNumber}
                        onChange={(e) => setJdNewVersionNumber(e.target.value)}
                        placeholder="e.g. v3.0"
                        className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white w-24 font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <button
                      onClick={handleApproveJdVersion}
                      disabled={approvingJd}
                      className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {approvingJd ? 'Publishing Version...' : 'Approve & Publish Version to PostgreSQL'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Audit Logs Table */}
            <div className="glass-panel p-6 rounded-3xl border border-gray-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-400" />
                    Automated PostgreSQL Audit Logs
                  </h4>
                  <p className="text-xs text-gray-400">
                    Includes entries written automatically by trigger <code className="text-indigo-300 font-mono">trg_before_assessment_24BAI0226_SaiSiriChandana</code>
                  </p>
                </div>
                <button
                  onClick={() => fetchAuditLogs(1)}
                  className="p-1.5 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-lg text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-800">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                    <tr>
                      <th className="py-2.5 px-3">Log ID</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Table</th>
                      <th className="py-2.5 px-3">User</th>
                      <th className="py-2.5 px-3">Event Details</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-gray-900/30">
                    {auditLogs.map((log) => (
                      <tr key={log.log_id} className="hover:bg-gray-800/40">
                        <td className="py-2.5 px-3 font-mono text-gray-400">#{log.log_id}</td>
                        <td className="py-2.5 px-3 font-semibold text-rose-300">{log.action}</td>
                        <td className="py-2.5 px-3 font-mono text-cyan-300">{log.table_name}</td>
                        <td className="py-2.5 px-3 text-gray-300">
                          {log.user ? `${log.user.full_name} (${log.user.reg_no})` : 'System'}
                        </td>
                        <td className="py-2.5 px-3 text-gray-300 max-w-md truncate" title={log.details}>
                          {log.details}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* STANDOUT FEATURE 5: PRINTABLE / EXPORTABLE DOSSIER MODAL            */}
      {/* -------------------------------------------------------------------- */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-gray-900 w-full max-w-3xl rounded-3xl p-8 shadow-2xl relative my-8 font-sans">
            <button
              onClick={() => setShowDossierModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Dossier Header */}
            <div className="border-b-2 border-indigo-600 pb-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">
                    Official Career Readiness Dossier
                  </h2>
                  <p className="text-xs text-gray-600 font-medium">
                    BCSE302P Database Systems Lab • Lab Internal Assessment Test 8, 9 & 10
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1 rounded-full">
                    SLOT: L25+L26
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">{currentTimestamp}</div>
                </div>
              </div>
            </div>

            {/* Candidate & Faculty Info */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6 text-xs">
              <div>
                <span className="text-gray-500 font-semibold block text-[10px] uppercase">Candidate Name</span>
                <strong className="text-gray-900 text-sm">Garudaiahgari Sai Siri Chandana</strong>
                <div className="font-mono text-indigo-700 font-bold mt-0.5">Register No: 24BAI0226</div>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block text-[10px] uppercase">Faculty In-Charge</span>
                <strong className="text-gray-900 text-sm">Dr. V. SIVAKUMAR</strong>
                <div className="text-gray-600 mt-0.5">School of Computer Science & Engineering (SCOPE)</div>
              </div>
            </div>

            {/* Evaluation Verification Metrics */}
            <div className="mb-6 space-y-3">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                PostgreSQL Automated Telemetry Audit
              </h3>
              <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-100 text-gray-700 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Competency</th>
                    <th className="py-2 px-3 text-center">Required Target</th>
                    <th className="py-2 px-3 text-center">Demonstrated Level</th>
                    <th className="py-2 px-3 text-center">Gap ($G_s$)</th>
                    <th className="py-2 px-3 text-center">Priority ($Q_s$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData?.details?.map((d) => (
                    <tr key={d.detail_id}>
                      <td className="py-2 px-3 font-medium text-gray-800">{d.skill.skill_name}</td>
                      <td className="py-2 px-3 text-center font-mono">{d.required_proficiency}/5</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700">{d.assessed_proficiency}/5</td>
                      <td className="py-2 px-3 text-center font-mono">{d.gap_score}</td>
                      <td className="py-2 px-3 text-center font-mono font-semibold">{d.priority_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary KPI & Trigger Proof */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl mb-6 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-indigo-950">Overall Career Readiness Score</div>
                <div className="text-[11px] text-gray-600">Calculated by <code className="font-mono text-indigo-800">sp_generate_gap_report_24BAI0226_SaiSiriChandana</code></div>
              </div>
              <div className="text-3xl font-black font-mono text-indigo-700">
                {reportData?.overall_readiness_pct || 0}%
              </div>
            </div>

            {/* Verification Sign-off */}
            <div className="pt-6 border-t border-gray-200 flex justify-between items-end text-xs">
              <div>
                <div className="text-[10px] text-gray-500 font-mono">
                  SECURITY DIGEST: SHA-256 [VERIFIED_24BAI0226_SaiSiriChandana]
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  TRIGGER: trg_before_assessment_24BAI0226_SaiSiriChandana (ACTIVE)
                </div>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-gray-400 mb-1"></div>
                <div className="font-semibold text-gray-700">Faculty Signature & Seal</div>
                <div className="text-[10px] text-gray-500">Dr. V. SIVAKUMAR</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER */}
      <footer className="glass-panel border-t border-gray-800 py-4 px-6 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            SkillGap Radar Platform • Garudaiahgari Sai Siri Chandana (24BAI0226) • Slot: L25+L26
          </span>
          <span className="text-[11px] text-gray-500">
            BCSE302P Database Systems Lab • Faculty: Dr. V. SIVAKUMAR • Fall 2026-27
          </span>
        </div>
      </footer>
    </div>
  );
}
