// ============================================================================
// SkillGap Radar - Main Application Component
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
  XAxis,
  YAxis,
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
  const [activeTab, setActiveTab] = useState('radar'); // 'radar', 'assessment', 'roadmap', 'admin'
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

  useEffect(() => {
    if (authToken) {
      fetchCareerRoles();
      fetchSkills();
      fetchGapReport(selectedVersionId);
      fetchRoadmapView(selectedVersionId, 1);
      if (currentUser?.role === 'ADMIN') {
        fetchAuditLogs(1);
      }
    }
  }, [authToken, selectedVersionId]);

  // Refetch roadmap on search/category change
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
      // Refresh report & roadmap
      fetchGapReport(selectedVersionId);
      fetchRoadmapView(selectedVersionId, roadmapPage);
      if (currentUser?.role === 'ADMIN') {
        fetchAuditLogs(1);
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
    } catch (err) {
      setAdminNotice(`Error: ${err.message}`);
    }
  };

  // ==========================================================================
  // RENDER: LOGIN VIEW IF NOT AUTHENTICATED
  // ==========================================================================
  if (!authToken || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-between p-4 md:p-8">
        {/* Top Identity Header */}
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

        {/* Login Container */}
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

            {/* Quick Demo Login Autofill Buttons */}
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
  // RENDER: AUTHENTICATED DASHBOARD
  // ==========================================================================
  const activeRoleVersion = careerRoles
    .flatMap((r) => r.versions)
    .find((v) => v.version_id === selectedVersionId);

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
          <div className="flex items-center gap-4 flex-wrap justify-center">
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

      {/* 2. SUB-BAR: CONTROLS & VERSION-AWARE SWITCHER */}
      <section className="bg-gray-900/60 border-b border-gray-800 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-gray-950/80 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Competency Radar
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'assessment'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Quiz & Diagnostics
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeTab === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" /> Adaptive Roadmap View
            </button>
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-300" /> Admin RBAC & Audits
              </button>
            )}
          </nav>

          {/* Version-Aware Industry Requirement Switcher (Novel Contribution 2) */}
          <div className="flex items-center gap-2">
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
            {/* Left: Recharts Competency Radar Chart */}
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

            {/* Right: Gap Severity & Priority Scoring Breakdown */}
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

              {/* Quiz Body */}
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

            {/* Diagnostic Results Card (Fired after submission) */}
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

                {/* AI Diagnostic Report */}
                <div className="p-4 bg-gray-900/90 border border-indigo-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wide">
                    <Sparkles className="w-4 h-4" /> Gemini AI Diagnostic Feedback
                  </div>
                  <pre className="text-xs text-gray-300 font-sans whitespace-pre-line leading-relaxed">
                    {quizResult.ai_analysis_feedback}
                  </pre>
                </div>

                {/* Per question explanations */}
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

              {/* Filters: Search & Category */}
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

            {/* Table */}
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

            {/* Pagination Controls */}
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
        {/* TAB 4: ADMIN RBAC & AUDIT LOG PANEL (ADMIN ONLY)                   */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === 'admin' && currentUser.role === 'ADMIN' && (
          <div className="space-y-6">
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
