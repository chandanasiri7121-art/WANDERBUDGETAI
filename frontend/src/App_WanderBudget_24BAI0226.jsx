import React, { useState, useEffect } from 'react';
import {
  Compass, MapPin, Calendar, Users, DollarSign, Sparkles, TrendingUp,
  AlertTriangle, ShieldCheck, CheckCircle2, Search, ArrowRight, RefreshCw,
  PlusCircle, CreditCard, ChevronRight, PieChart as PieIcon, BarChart3,
  Hotel, Utensils, Bus, Camera, ShieldAlert, Award, FileText, Database,
  Activity, Layers, Info, Check, LogOut, UserCheck
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

// Colors for Budget Categories
const CATEGORY_COLORS = {
  ACCOMMODATION: '#38bdf8', // Sky Blue
  FOOD: '#34d399',          // Emerald
  TRANSIT: '#fbbf24',       // Amber
  SIGHTSEEING: '#a78bfa',   // Violet
  BUFFER: '#f43f5e',        // Rose
  MISC: '#94a3b8'           // Slate
};

export default function App_WanderBudget_24BAI0226() {
  // Current Active Tab
  const [activeTab, setActiveTab] = useState('ai_explorer'); // 'ai_explorer', 'builder', 'trips', 'expenses', 'admin'

  // User Auth State
  const [user, setUser] = useState({
    user_id: 1,
    reg_no: '24BAI0226',
    full_name: 'Garudaiahgari Sai Siri Chandana',
    role: 'TRAVELER',
    email: 'saisirichandana.g2024@vitstudent.ac.in',
    home_currency: 'INR'
  });
  const [token, setToken] = useState('');

  // Master Data
  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // AI Explorer State
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzingCity, setAnalyzingCity] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  // Trip Budget Builder State
  const [builderDestinationId, setBuilderDestinationId] = useState('');
  const [durationDays, setDurationDays] = useState(5);
  const [travelStyle, setTravelStyle] = useState('STANDARD'); // 'BUDGET', 'STANDARD', 'LUXURY'
  const [groupSize, setGroupSize] = useState(2);
  const [selectedAttractionIds, setSelectedAttractionIds] = useState([]);
  const [calculatedBudget, setCalculatedBudget] = useState(null);
  const [savingTrip, setSavingTrip] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Dual-Mode State: 'PLAN_TO_COST' vs 'BUDGET_TO_PLAN'
  const [builderMode, setBuilderMode] = useState('PLAN_TO_COST');
  const [targetWalletBudget, setTargetWalletBudget] = useState(60000);
  const [optimizedPlanResult, setOptimizedPlanResult] = useState(null);
  const [optimizingPlan, setOptimizingPlan] = useState(false);

  // Dynamic Custom Attraction Creation State (Not Hardcoded)
  const [showAddAttrModal, setShowAddAttrModal] = useState(false);
  const [newAttrForm, setNewAttrForm] = useState({
    name: '',
    category: 'Sacred Temple / Shrine',
    ticket_price_inr: '',
    avg_duration_hours: '2.0',
    description: ''
  });
  const [addingAttr, setAddingAttr] = useState(false);

  // My Trips State
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTripDetails, setActiveTripDetails] = useState(null);

  // What-If Simulator on Saved Trip
  const [simDays, setSimDays] = useState(5);
  const [simStyle, setSimStyle] = useState('STANDARD');
  const [simulatedResult, setSimulatedResult] = useState(null);

  // Expense Logger State
  const [expenseForm, setExpenseForm] = useState({
    expense_name: '',
    category_id: '',
    amount_inr: '',
    payment_method: 'CARD',
    notes: ''
  });
  const [expenseLogging, setExpenseLogging] = useState(false);
  const [recentTriggerAlerts, setRecentTriggerAlerts] = useState([]);

  // Admin & System Health State
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // 1. Initial Load: Login & Fetch Master Data
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        // Login default traveler
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login_id: '24BAI0226', password: 'Traveler@123' })
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          setUser(loginData.user);
          setToken(loginData.token);
          localStorage.setItem('wb_token', loginData.token);
        }

        // Fetch Destinations
        const destRes = await fetch('/api/destinations');
        if (destRes.ok) {
          const destData = await destRes.json();
          setDestinations(destData);
          if (destData.length > 0) {
            setSelectedDestination(destData[0]);
            setBuilderDestinationId(destData[0].destination_id);
            if (destData[0].attractions && destData[0].attractions.length > 0) {
              setSelectedAttractionIds(destData[0].attractions.map(a => a.attraction_id));
            }
          }
        }

        // Fetch Categories
        const catRes = await fetch('/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
          if (catData.length > 0) {
            setExpenseForm(prev => ({ ...prev, category_id: catData[0].category_id }));
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch Trips when tab changes to 'trips' or 'expenses'
  useEffect(() => {
    if ((activeTab === 'trips' || activeTab === 'expenses') && token) {
      fetchTrips();
    }
    if (activeTab === 'admin') {
      fetchAdminData();
    }
  }, [activeTab, token]);

  // Recalculate dynamic budget or reverse-optimize whenever builder parameters change
  useEffect(() => {
    if (builderDestinationId && activeTab === 'builder') {
      if (builderMode === 'PLAN_TO_COST') {
        calculateDynamicBudget();
      } else {
        handleOptimizeBudgetToPlan();
      }
    }
  }, [builderDestinationId, durationDays, travelStyle, groupSize, selectedAttractionIds, builderMode, targetWalletBudget, activeTab]);

  // Update selected destination object when builderDestinationId changes & default all its attractions to included
  useEffect(() => {
    if (builderDestinationId && destinations.length > 0) {
      const match = destinations.find(d => d.destination_id === Number(builderDestinationId));
      if (match) {
        setSelectedDestination(match);
        if (match.attractions && match.attractions.length > 0) {
          setSelectedAttractionIds(match.attractions.map(a => a.attraction_id));
        } else {
          setSelectedAttractionIds([]);
        }
      }
    }
  }, [builderDestinationId, destinations]);

  // API Call: AI Internet Search & Cost-of-Living Analysis
  const handleAnalyzeCity = async (cityName) => {
    const query = cityName || searchQuery;
    if (!query || query.trim().length < 2) return;

    try {
      setAnalyzingCity(true);
      const res = await fetch('/api/ai/analyze-destination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ destination_query: query, refresh: false })
      });

      if (res.ok) {
        const data = await res.json();
        const dest = data.destination;
        setSelectedDestination(dest);

        // Immediately update attractions of the newly selected destination
        if (dest.attractions && dest.attractions.length > 0) {
          setSelectedAttractionIds(dest.attractions.map(a => a.attraction_id));
        } else {
          setSelectedAttractionIds([]);
        }

        // Update destinations list if new or updated
        setDestinations(prev => {
          const exists = prev.some(d => d.destination_id === dest.destination_id);
          if (exists) {
            return prev.map(d => d.destination_id === dest.destination_id ? dest : d);
          }
          return [dest, ...prev];
        });

        setBuilderDestinationId(dest.destination_id);
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAnalyzingCity(false);
    }
  };

  // API Call: Calculate Dynamic Budget (Mode 1: Plan-to-Cost)
  const calculateDynamicBudget = async () => {
    try {
      const res = await fetch('/api/trips/build-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_id: builderDestinationId,
          duration_days: durationDays,
          travel_style: travelStyle,
          group_size: groupSize,
          attraction_ids: selectedAttractionIds
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCalculatedBudget(data);
      }
    } catch (err) {
      console.error('Calculate budget error:', err);
    }
  };

  // API Call: Reverse Budget Optimizer (Mode 2: Budget-to-Plan)
  const handleOptimizeBudgetToPlan = async () => {
    if (!builderDestinationId || !targetWalletBudget) return;
    try {
      setOptimizingPlan(true);
      const res = await fetch('/api/trips/optimize-budget-to-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_id: builderDestinationId,
          total_budget_inr: parseFloat(targetWalletBudget),
          group_size: groupSize,
          desired_days: durationDays,
          attraction_ids: selectedAttractionIds
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOptimizedPlanResult(data);
      }
    } catch (err) {
      console.error('Optimize budget error:', err);
    } finally {
      setOptimizingPlan(false);
    }
  };

  // API Call: Save Trip Itinerary
  const handleSaveTrip = async () => {
    if (!calculatedBudget || !selectedDestination) return;
    try {
      setSavingTrip(true);
      const tripTitle = `${selectedDestination.city_name} ${durationDays}-Day ${travelStyle} Adventure`;
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: tripTitle,
          destination_id: builderDestinationId,
          duration_days: durationDays,
          travel_style: travelStyle,
          group_size: groupSize,
          total_budget_inr: calculatedBudget.total_budget_inr,
          breakdowns: calculatedBudget.category_breakdown,
          attraction_ids: selectedAttractionIds
        })
      });

      if (res.ok) {
        setSaveSuccessMsg(`Trip "${tripTitle}" saved with dynamic budget of ₹${calculatedBudget.total_budget_inr.toLocaleString()}!`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
        fetchTrips();
      }
    } catch (err) {
      console.error('Save trip error:', err);
    } finally {
      setSavingTrip(false);
    }
  };

  // API Call: Fetch User Trips
  const fetchTrips = async () => {
    try {
      const res = await fetch('/api/trips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
        if (data.length > 0 && !activeTrip) {
          selectTripForDetails(data[0].trip_id);
        }
      }
    } catch (err) {
      console.error('Fetch trips error:', err);
    }
  };

  // API Call: Select Trip & Fetch Analytical Details
  const selectTripForDetails = async (tripId) => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTrip(data);
        setSimDays(data.duration_days);
        setSimStyle(data.travel_style);

        // Fetch analytical views
        const summaryRes = await fetch(`/api/analytics/trip-summary/${tripId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setActiveTripDetails(summaryData);
        }
      }
    } catch (err) {
      console.error('Fetch trip details error:', err);
    }
  };

  // Run What-If on existing trip
  const handleSimulateWhatIf = async (days, style) => {
    if (!activeTrip) return;
    setSimDays(days);
    setSimStyle(style);
    try {
      const res = await fetch('/api/trips/build-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_id: activeTrip.destination_id,
          duration_days: days,
          travel_style: style,
          group_size: activeTrip.group_size,
          attraction_ids: []
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulatedResult(data);
      }
    } catch (err) {
      console.error('Simulate error:', err);
    }
  };

  // API Call: Log Expense
  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!activeTrip || !expenseForm.amount_inr || !expenseForm.expense_name) return;

    try {
      setExpenseLogging(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trip_id: activeTrip.trip_id,
          category_id: expenseForm.category_id,
          expense_name: expenseForm.expense_name,
          amount_inr: parseFloat(expenseForm.amount_inr),
          payment_method: expenseForm.payment_method,
          notes: expenseForm.notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExpenseForm({
          expense_name: '',
          category_id: categories[0]?.category_id || '',
          amount_inr: '',
          payment_method: 'CARD',
          notes: ''
        });

        // Show Trigger Alerts if any
        if (data.triggered_alerts && data.triggered_alerts.length > 0) {
          setRecentTriggerAlerts(data.triggered_alerts);
        }

        // Refresh trip details
        selectTripForDetails(activeTrip.trip_id);
      }
    } catch (err) {
      console.error('Log expense error:', err);
    } finally {
      setExpenseLogging(false);
    }
  };

  // API Call: Admin Data
  const fetchAdminData = async () => {
    try {
      // Login as admin if needed to view admin logs
      const adminLoginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: 'ADMIN_24BAI0226', password: 'Admin@123' })
      });
      let adminTok = token;
      if (adminLoginRes.ok) {
        const adminData = await adminLoginRes.json();
        adminTok = adminData.token;
      }

      const [healthRes, logsRes] = await Promise.all([
        fetch('/api/admin/system-health'),
        fetch('/api/admin/audit-logs?limit=15', {
          headers: { 'Authorization': `Bearer ${adminTok}` }
        })
      ]);

      if (healthRes.ok) {
        const health = await healthRes.json();
        setSystemHealth(health);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error('Fetch admin data error:', err);
    }
  };

  // Toggle Attraction in Builder (Include / Discard)
  const toggleAttraction = (id) => {
    setSelectedAttractionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const includeAttraction = (id) => {
    setSelectedAttractionIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const discardAttraction = (id) => {
    setSelectedAttractionIds(prev => prev.filter(x => x !== id));
  };

  const handleIncludeAllAttractions = () => {
    if (selectedDestination?.attractions) {
      setSelectedAttractionIds(selectedDestination.attractions.map(a => a.attraction_id));
    }
  };

  const handleDiscardAllAttractions = () => {
    setSelectedAttractionIds([]);
  };

  // Add Custom Tourist Attraction (Not Hardcoded)
  const handleAddCustomAttraction = async (destId) => {
    if (!destId || !newAttrForm.name.trim()) return;
    try {
      setAddingAttr(true);
      const res = await fetch(`/api/destinations/${destId}/attractions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAttrForm)
      });
      if (res.ok) {
        const data = await res.json();
        const createdAttr = data.attraction;
        setSelectedDestination(prev => ({
          ...prev,
          attractions: [...(prev.attractions || []), createdAttr]
        }));
        setDestinations(prev => prev.map(d => {
          if (d.destination_id === destId) {
            return { ...d, attractions: [...(d.attractions || []), createdAttr] };
          }
          return d;
        }));
        setSelectedAttractionIds(prev => [...prev, createdAttr.attraction_id]);
        setNewAttrForm({ name: '', category: 'Sacred Temple / Shrine', ticket_price_inr: '', avg_duration_hours: '2.0', description: '' });
        setShowAddAttrModal(false);
      }
    } catch (err) {
      console.error('Add custom attraction error:', err);
    } finally {
      setAddingAttr(false);
    }
  };

  // Delete Attraction Permanently
  const handleDeleteAttraction = async (attrId, destId) => {
    try {
      const res = await fetch(`/api/attractions/${attrId}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedAttractionIds(prev => prev.filter(id => id !== attrId));
        setSelectedDestination(prev => ({
          ...prev,
          attractions: (prev.attractions || []).filter(a => a.attraction_id !== attrId)
        }));
        setDestinations(prev => prev.map(d => {
          if (d.destination_id === destId) {
            return { ...d, attractions: (d.attractions || []).filter(a => a.attraction_id !== attrId) };
          }
          return d;
        }));
      }
    } catch (err) {
      console.error('Delete attraction error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. TOP HEADER & IDENTITY EMBEDDING */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                WanderBudget AI
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                v2.0 • 3NF DBMS
              </span>
            </div>
            <p className="text-xs text-slate-400">Dynamic Trip Itinerary Budget Builder & Live AI Cost Analyzer</p>
          </div>
        </div>

        {/* Academic Compliance & Student Metadata Badge */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Student:</span>
            <span className="font-semibold text-slate-200">Garudaiahgari Sai Siri Chandana</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400">Reg No:</span>
            <span className="ml-1 font-mono font-bold text-emerald-400">24BAI0226</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="text-slate-400">
            Slot: <span className="text-slate-200 font-medium">L25+L26</span>
          </div>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-medium text-slate-300">{user?.full_name?.split(' ')[0]}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
              {user?.role}
            </span>
          </div>
        </div>
      </header>

      {/* 2. NAVIGATION BAR */}
      <nav className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-2 flex items-center justify-between overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('ai_explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ai_explorer'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1. AI Cost Explorer
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'builder'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            2. Trip Budget Builder
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'trips'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            3. My Trips & What-If
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'expenses'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            4. Live Expense Tracker
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            5. Admin & Audit Logs
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
          PostgreSQL 16 • ACID Transactions • Trigger Alerts
        </div>
      </nav>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* ========================================================================= */}
        {/* TAB 1: AI LIVE DESTINATION & COST-OF-LIVING EXPLORER */}
        {/* ========================================================================= */}
        {activeTab === 'ai_explorer' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Search Bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-2xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Web Search & AI Travel Cost-of-Living Analyzer
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Where would you like to travel?
                </h2>
                <p className="text-sm text-slate-400">
                  Search any city in the world. The AI automatically connects to live travel indicators, calculates accommodation, dining, transit, and attraction fees, and normalizes it into PostgreSQL.
                </p>

                {/* Search Form */}
                <form
                  onSubmit={(e) => { e.preventDefault(); handleAnalyzeCity(); }}
                  className="flex items-center gap-2 pt-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g., Seoul, Paris, Goa, Reykjavik, Tokyo, Dubai, Manali..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={analyzingCity}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
                  >
                    {analyzingCity ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing Web...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Destination
                      </>
                    )}
                  </button>
                </form>

                {/* Quick Destination Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs text-slate-400">Popular Destinations:</span>
                  {[
                    { id: 'Tirupati', label: '🛕 Tirupati' },
                    { id: 'Hyderabad', label: '🕌 Hyderabad' },
                    { id: 'Goa', label: '🏖️ Goa' },
                    { id: 'Manali', label: '🏔️ Manali' },
                    { id: 'Bangalore', label: '🌳 Bangalore' },
                    { id: 'Chennai', label: '🌊 Chennai' },
                    { id: 'Delhi', label: '🏛️ Delhi' },
                    { id: 'Agra', label: '🕌 Agra' },
                    { id: 'Varanasi', label: '🪔 Varanasi' },
                    { id: 'Tokyo', label: '🗼 Tokyo' },
                    { id: 'Paris', label: '🥐 Paris' },
                    { id: 'Bali', label: '🌴 Bali' },
                    { id: 'Zurich', label: '❄️ Zurich' },
                    { id: 'London', label: '🎡 London' },
                    { id: 'Dubai', label: '🏙️ Dubai' },
                    { id: 'Seoul', label: '🌸 Seoul' },
                    { id: 'Bangkok', label: '🏮 Bangkok' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAnalyzeCity(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        selectedDestination?.city_name?.toLowerCase() === item.id.toLowerCase()
                          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/60 text-slate-300 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Destination Cost Index Details */}
            {selectedDestination && selectedDestination.cost_index && (
              <div className="space-y-6">
                {/* Destination Hero Card */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-emerald-400" />
                        {selectedDestination.city_name}, {selectedDestination.country_name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-mono text-emerald-300 border border-slate-700">
                        {selectedDestination.currency_code} ({selectedDestination.currency_symbol})
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                      {selectedDestination.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Live Internet Indexed
                      </span>
                      <span>•</span>
                      <span>Exchange: 1 {selectedDestination.currency_code} = ₹{selectedDestination.cost_index.exchange_rate_to_inr} INR</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">Source: {selectedDestination.cost_index.source}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setBuilderDestinationId(selectedDestination.destination_id);
                      setActiveTab('builder');
                    }}
                    className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
                  >
                    Build Dynamic Budget for {selectedDestination.city_name}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Cost of Living Benchmark Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Accommodation Card */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                          <Hotel className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-white text-sm">Accommodation / Night</h4>
                      </div>
                      <span className="text-[10px] text-sky-400 font-mono">AVG NIGHTLY</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          🎒 Budget / Hostel
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {selectedDestination.currency_symbol}{Number(selectedDestination.cost_index.accommodation_budget_night).toLocaleString()}
                          <span className="text-[10px] text-slate-500 ml-1">
                            (₹{Math.round(selectedDestination.cost_index.accommodation_budget_night * selectedDestination.cost_index.exchange_rate_to_inr).toLocaleString()})
                          </span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          🏨 Standard 3-Star
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {selectedDestination.currency_symbol}{Number(selectedDestination.cost_index.accommodation_standard_night).toLocaleString()}
                          <span className="text-[10px] text-slate-500 ml-1">
                            (₹{Math.round(selectedDestination.cost_index.accommodation_standard_night * selectedDestination.cost_index.exchange_rate_to_inr).toLocaleString()})
                          </span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          👑 Luxury 5-Star
                        </span>
                        <span className="font-mono font-bold text-violet-400">
                          {selectedDestination.currency_symbol}{Number(selectedDestination.cost_index.accommodation_luxury_night).toLocaleString()}
                          <span className="text-[10px] text-slate-500 ml-1">
                            (₹{Math.round(selectedDestination.cost_index.accommodation_luxury_night * selectedDestination.cost_index.exchange_rate_to_inr).toLocaleString()})
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Food & Dining Card */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-white text-sm">Food & Dining / Day</h4>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">DAILY MEALS</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400">Street Food & Markets</span>
                        <span className="font-mono font-bold text-slate-200">
                          {selectedDestination.currency_symbol}{Number(selectedDestination.cost_index.meal_budget_day).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400">Mid-Range Sit-Down</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {selectedDestination.currency_symbol}{Number(selectedDestination.cost_index.meal_standard_day).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400">Fine Dining & Wine</span>
                        <span className="font-mono font-bold text-violet-400">
                          {selectedDestination.currency_symbol}{Number(selectedDestination.cost_index.meal_luxury_day).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Local Transit Card */}
                  <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Bus className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-white text-sm">Local Transit & Commute</h4>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono">MOBILITY</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400">Daily Metro / Transit Pass</span>
                        <span className="font-mono font-bold text-amber-400">
                          {selectedDestination.currency_symbol}{Number(selectedDestination.cost_index.transit_pass_day).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400">Taxi / Rideshare per km</span>
                        <span className="font-mono font-bold text-slate-200">
                          {selectedDestination.currency_symbol}{Number(selectedDestination.cost_index.taxi_per_km).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400">Currency Rate to INR</span>
                        <span className="font-mono font-bold text-teal-400">
                          ₹{selectedDestination.cost_index.exchange_rate_to_inr}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popular Attractions in this Destination with Include / Discard Toggles */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <Camera className="w-5 h-5 text-violet-400" />
                        Attractions for {selectedDestination.city_name} ({selectedDestination.attractions?.length || 0} Places)
                      </h4>
                      <p className="text-xs text-slate-400">You can Include or Discard any tourist spot to customize your trip budget</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleIncludeAllAttractions}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-bold transition-all"
                      >
                        ✓ Include All
                      </button>
                      <button
                        type="button"
                        onClick={handleDiscardAllAttractions}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-750 text-xs font-bold transition-all"
                      >
                        ✕ Discard All
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAttrModal(prev => !prev)}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        + Add Custom Tourist Spot
                      </button>
                    </div>
                  </div>

                  {/* Add Custom Attraction Inline Form (Not Hardcoded) */}
                  {showAddAttrModal && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-violet-500/40 space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-violet-300">Add New Tourist Attraction to {selectedDestination.city_name} (Not Hardcoded)</span>
                        <button type="button" onClick={() => setShowAddAttrModal(false)} className="text-slate-500 hover:text-slate-300">✕ Close</button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="Attraction Name (e.g. Alipiri Footpath Walk)"
                          value={newAttrForm.name}
                          onChange={(e) => setNewAttrForm(prev => ({ ...prev, name: e.target.value }))}
                          className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                        />
                        <input
                          type="text"
                          placeholder="Category (e.g. Trek / Temple)"
                          value={newAttrForm.category}
                          onChange={(e) => setNewAttrForm(prev => ({ ...prev, category: e.target.value }))}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                        />
                        <input
                          type="number"
                          placeholder="Ticket Price (INR)"
                          value={newAttrForm.ticket_price_inr}
                          onChange={(e) => setNewAttrForm(prev => ({ ...prev, ticket_price_inr: e.target.value }))}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={addingAttr || !newAttrForm.name.trim()}
                        onClick={() => handleAddCustomAttraction(selectedDestination.destination_id)}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                      >
                        {addingAttr ? 'Adding Attraction...' : 'Save & Include in Trip'}
                      </button>
                    </div>
                  )}

                  {/* Attractions List with Include / Discard Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDestination.attractions?.map(attr => {
                      const isIncluded = selectedAttractionIds.includes(attr.attraction_id);
                      return (
                        <div
                          key={attr.attraction_id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                            isIncluded
                              ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm'
                              : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className={`font-semibold text-sm ${isIncluded ? 'text-slate-100 font-bold' : 'text-slate-400 line-through'}`}>
                                {attr.name}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                                  {attr.category}
                                </span>
                                <span>•</span>
                                <span>~{attr.avg_duration_hours} hrs</span>
                              </div>
                              {attr.description && (
                                <p className="text-[11px] text-slate-400 line-clamp-1">{attr.description}</p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-mono font-bold text-sm text-emerald-400">
                                {Number(attr.ticket_price_inr) === 0 ? 'FREE' : `₹${Number(attr.ticket_price_inr).toLocaleString()}`}
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                isIncluded ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isIncluded ? 'INCLUDED' : 'DISCARDED'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              {isIncluded ? (
                                <button
                                  type="button"
                                  onClick={() => discardAttraction(attr.attraction_id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all"
                                >
                                  ✕ Discard from Trip
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => includeAttraction(attr.attraction_id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all"
                                >
                                  ✓ Include in Trip
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteAttraction(attr.attraction_id, selectedDestination.destination_id)}
                              className="text-slate-500 hover:text-rose-400 text-[11px]"
                              title="Delete permanently from catalog"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Destinations Catalog Grid */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    All Indexed Travel Destinations ({destinations.length} Cities in Database)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Click any destination to load all its authentic attractions, cost indicators, and customize your trip</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {destinations.length} Active Cities
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                {destinations.map(d => {
                  const isCurrent = selectedDestination?.destination_id === d.destination_id;
                  return (
                    <button
                      key={d.destination_id}
                      onClick={() => {
                        setSelectedDestination(d);
                        setBuilderDestinationId(d.destination_id);
                        if (d.attractions && d.attractions.length > 0) {
                          setSelectedAttractionIds(d.attractions.map(a => a.attraction_id));
                        } else {
                          setSelectedAttractionIds([]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="font-bold text-xs truncate text-slate-100 flex items-center justify-between">
                        <span>{d.city_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{d.currency_symbol}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{d.country_name}</div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                        <span className="text-emerald-400 font-mono">
                          {d.attractions ? `${d.attractions.length} spots` : (d._count?.attractions ? `${d._count.attractions} spots` : 'spots')}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-mono">SELECT</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BIDIRECTIONAL TRIP BUDGET BUILDER & WHAT-IF ENGINE */}
        {/* ========================================================================= */}
        {activeTab === 'builder' && (
          <div className="space-y-6 animate-fadeIn">
            {saveSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* DUAL-MODE SWITCHER (Plan-to-Cost vs Budget-to-Plan) */}
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-xl max-w-2xl mx-auto">
              <button
                type="button"
                onClick={() => setBuilderMode('PLAN_TO_COST')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  builderMode === 'PLAN_TO_COST'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-4 h-4" />
                Mode 1: Plan-to-Cost (Estimate Dream Plan Cost)
              </button>
              <button
                type="button"
                onClick={() => setBuilderMode('BUDGET_TO_PLAN')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  builderMode === 'BUDGET_TO_PLAN'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Mode 2: Budget-to-Plan (Fit Itinerary to Wallet)
              </button>
            </div>

            {/* MODE 1: FORWARD PLAN-TO-COST BUILDER */}
            {builderMode === 'PLAN_TO_COST' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Interactive Input Controls (5 Cols) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
                    <div className="border-b border-slate-800 pb-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold font-mono mb-1">
                        Mode 1 • Forward Plan Estimator
                      </div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Compass className="w-5 h-5 text-emerald-400" />
                        Trip Plan & Luxury Preference
                      </h3>
                      <p className="text-xs text-slate-400">Tell us where you want to go, stay duration, and luxury standard</p>
                    </div>

                    {/* 1. Destination Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        Target Destination
                      </label>
                      <select
                        value={builderDestinationId}
                        onChange={(e) => setBuilderDestinationId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        {destinations.map(d => (
                          <option key={d.destination_id} value={d.destination_id}>
                            {d.city_name}, {d.country_name} ({d.currency_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Stay Duration Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          Stay Duration (Days)
                        </span>
                        <span className="font-mono font-bold text-sm text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                          {durationDays} Days ({durationDays - 1} Nights)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="21"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value))}
                        className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>1 Day</span>
                        <span>7 Days (1 Wk)</span>
                        <span>14 Days (2 Wks)</span>
                        <span>21 Days</span>
                      </div>
                    </div>

                    {/* 3. Travel Style Tier Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        What Type of Luxury Do You Want?
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'BUDGET', label: 'Budget', icon: '🎒', desc: 'Hostels & Street Eats' },
                          { id: 'STANDARD', label: 'Comfort', icon: '🏨', desc: '3-Star & Casual Dining' },
                          { id: 'LUXURY', label: 'Luxury', icon: '👑', desc: '5-Star & Fine Dining' }
                        ].map(style => (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setTravelStyle(style.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              travelStyle === style.id
                                ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-lg">{style.icon}</div>
                            <div className="font-bold text-xs mt-1 text-slate-200">{style.label}</div>
                            <div className="text-[10px] text-slate-400">{style.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. Group Size */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-teal-400" />
                          Number of Travelers
                        </span>
                        <span className="font-mono font-bold text-sm text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                          {groupSize} {groupSize === 1 ? 'Solo' : 'Travelers'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 6].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setGroupSize(num)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              groupSize === num
                                ? 'bg-teal-500 text-slate-950 border-teal-400 font-extrabold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {num} {num === 1 ? 'Solo' : 'P'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. Select Attractions / Places with Include & Discard Action Toggles */}
                    {selectedDestination && selectedDestination.attractions && selectedDestination.attractions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-violet-400" />
                            Tourist Spots ({selectedAttractionIds.length} of {selectedDestination.attractions.length} Included)
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleIncludeAllAttractions}
                              className="text-[10px] font-bold text-emerald-400 hover:underline"
                            >
                              Include All
                            </button>
                            <span className="text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={handleDiscardAllAttractions}
                              className="text-[10px] font-bold text-rose-400 hover:underline"
                            >
                              Discard All
                            </button>
                          </div>
                        </div>

                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                          {selectedDestination.attractions.map(attr => {
                            const isSelected = selectedAttractionIds.includes(attr.attraction_id);
                            return (
                              <div
                                key={attr.attraction_id}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                                  isSelected
                                    ? 'bg-slate-950/80 border-emerald-500/40 text-slate-200'
                                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-60'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                    <span className={`font-semibold ${isSelected ? 'text-slate-200' : 'line-through text-slate-500'}`}>
                                      {attr.name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {attr.category} • {Number(attr.ticket_price_inr) === 0 ? 'FREE' : `₹${Number(attr.ticket_price_inr).toLocaleString()}`}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isSelected ? (
                                    <button
                                      type="button"
                                      onClick={() => discardAttraction(attr.attraction_id)}
                                      className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold"
                                    >
                                      ✕ Discard
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => includeAttraction(attr.attraction_id)}
                                      className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold"
                                    >
                                      ✓ Include
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Save Itinerary Button */}
                    <button
                      onClick={handleSaveTrip}
                      disabled={savingTrip || !calculatedBudget}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      {savingTrip ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving Trip in Transaction...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          Save Itinerary & Budget (ACID Transaction)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column: Calculated Dynamic Budget & What-If Visualizer (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {calculatedBudget ? (
                    <>
                      {/* Grand Total Budget Banner */}
                      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 rounded-2xl border border-emerald-500/30 p-6 shadow-2xl relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" />
                              Estimated Plan Cost • {durationDays} Days • {travelStyle}
                            </span>
                            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                              ₹{calculatedBudget.total_budget_inr.toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Per Traveler: <span className="font-mono font-bold text-emerald-300">₹{calculatedBudget.per_person_inr.toLocaleString()}</span> ({groupSize} people)
                            </p>
                          </div>

                          <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-mono">Calculated By</div>
                            <div className="text-xs font-bold text-slate-200">PostgreSQL SP</div>
                            <div className="text-[10px] text-emerald-400 font-mono">sp_calculate_trip_budget</div>
                          </div>
                        </div>

                        {/* What-If Comparisons Bar */}
                        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-800/80 text-xs">
                          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                            <div className="text-slate-400 text-[10px]">What-If Budget Style</div>
                            <div className="font-mono font-bold text-slate-200 mt-0.5">
                              ₹{calculatedBudget.what_if_insights.budget_style_cost.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-emerald-400">
                              Save ₹{calculatedBudget.what_if_insights.budget_style_savings.toLocaleString()}
                            </div>
                          </div>

                          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                            <div className="text-slate-400 text-[10px]">What-If Luxury Style</div>
                            <div className="font-mono font-bold text-violet-300 mt-0.5">
                              ₹{calculatedBudget.what_if_insights.luxury_style_cost.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-violet-400">
                              +₹{calculatedBudget.what_if_insights.luxury_upgrade_cost.toLocaleString()}
                            </div>
                          </div>

                          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                            <div className="text-slate-400 text-[10px]">What-If -1 Day</div>
                            <div className="font-mono font-bold text-amber-300 mt-0.5">
                              -₹{calculatedBudget.what_if_insights.minus_one_day_savings.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-amber-400">
                              Marginal Saving
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category Breakdown & Visual Chart */}
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-emerald-400" />
                            Category Cost Allocation Breakdown
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">NORMALIZED 3NF SCHEMA</span>
                        </div>

                        {/* Recharts Pie Chart & List Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-5 h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={calculatedBudget.category_breakdown}
                                  dataKey="allocated_inr"
                                  nameKey="category_name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={3}
                                >
                                  {calculatedBudget.category_breakdown.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={CATEGORY_COLORS[entry.category_code] || '#94a3b8'}
                                    />
                                  ))}
                                </Pie>
                                <RechartsTooltip
                                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Allocated']}
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Category List */}
                          <div className="md:col-span-7 space-y-2 text-xs">
                            {calculatedBudget.category_breakdown.map(item => (
                              <div
                                key={item.category_code}
                                className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: CATEGORY_COLORS[item.category_code] || '#94a3b8' }}
                                  />
                                  <span className="font-medium text-slate-200">{item.category_name}</span>
                                </div>

                                <div className="text-right">
                                  <div className="font-mono font-bold text-slate-200">
                                    ₹{item.allocated_inr.toLocaleString()}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {Math.round((item.allocated_inr / calculatedBudget.total_budget_inr) * 100)}% of budget
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                      <Compass className="w-10 h-10 mx-auto text-slate-600 mb-2 animate-bounce" />
                      <p>Adjust parameters on the left to see live dynamic budget calculation.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE 2: REVERSE BUDGET-TO-PLAN OPTIMIZER */}
            {builderMode === 'BUDGET_TO_PLAN' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Fixed Wallet Budget & Desired Scope (5 Cols) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
                    <div className="border-b border-slate-800 pb-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-[11px] font-semibold font-mono mb-1">
                        Mode 2 • Reverse Budget-to-Plan Fitter
                      </div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-teal-400" />
                        Enter Your Wallet Budget
                      </h3>
                      <p className="text-xs text-slate-400">Tell us your budget, and AI engineers the optimal plan & luxury standard</p>
                    </div>

                    {/* 1. Destination Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        Target Destination
                      </label>
                      <select
                        value={builderDestinationId}
                        onChange={(e) => setBuilderDestinationId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors"
                      >
                        {destinations.map(d => (
                          <option key={d.destination_id} value={d.destination_id}>
                            {d.city_name}, {d.country_name} ({d.currency_code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Wallet Budget Input with Quick Presets */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                          Total Available Budget (INR)
                        </label>
                        <span className="font-mono font-bold text-sm text-teal-300">
                          ₹{Number(targetWalletBudget || 0).toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="5000"
                        step="5000"
                        value={targetWalletBudget}
                        onChange={(e) => setTargetWalletBudget(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                        placeholder="e.g. 50000"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {[25000, 50000, 75000, 100000, 150000].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setTargetWalletBudget(amt)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                              targetWalletBudget === amt
                                ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            ₹{(amt / 1000)}k
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Desired Days to Aim For */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          Target Duration Aimed (Days)
                        </span>
                        <span className="font-mono font-bold text-sm text-sky-400">
                          {durationDays} Days
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="14"
                        value={durationDays}
                        onChange={(e) => setDurationDays(parseInt(e.target.value))}
                        className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                      />
                      <div className="text-[10px] text-slate-500">
                        The AI optimizer will verify if your budget covers this duration, or suggest feasible days.
                      </div>
                    </div>

                    {/* 4. Number of Travelers */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-teal-400" />
                          Travelers Sharing Budget
                        </span>
                        <span className="font-mono font-bold text-sm text-teal-400">
                          {groupSize} Person(s)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setGroupSize(num)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              groupSize === num
                                ? 'bg-teal-500 text-slate-950 border-teal-400 font-extrabold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {num} {num === 1 ? 'Solo' : 'P'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save Optimized Itinerary Button */}
                    <button
                      onClick={async () => {
                        if (!optimizedPlanResult || !selectedDestination) return;
                        try {
                          setSavingTrip(true);
                          const tripTitle = `${selectedDestination.city_name} ${optimizedPlanResult.recommended_days}-Day ${optimizedPlanResult.recommended_travel_style} (Budget Fit)`;
                          const res = await fetch('/api/trips', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              title: tripTitle,
                              destination_id: builderDestinationId,
                              duration_days: optimizedPlanResult.recommended_days,
                              travel_style: optimizedPlanResult.recommended_travel_style,
                              group_size: groupSize,
                              total_budget_inr: optimizedPlanResult.total_planned_budget_inr,
                              breakdowns: optimizedPlanResult.category_breakdown,
                              attraction_ids: optimizedPlanResult.selected_attractions?.map(a => a.attraction_id) || []
                            })
                          });
                          if (res.ok) {
                            setSaveSuccessMsg(`Trip "${tripTitle}" saved with reverse-engineered budget of ₹${optimizedPlanResult.total_planned_budget_inr.toLocaleString()}!`);
                            setTimeout(() => setSaveSuccessMsg(''), 4000);
                            fetchTrips();
                          }
                        } catch (err) {
                          console.error('Save reverse trip error:', err);
                        } finally {
                          setSavingTrip(false);
                        }
                      }}
                      disabled={savingTrip || !optimizedPlanResult}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all shadow-xl shadow-teal-500/20"
                    >
                      {savingTrip ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving Reverse Plan...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Save Reverse-Engineered Itinerary Plan
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column: Reverse-Engineered Itinerary & Recommendations (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {optimizedPlanResult ? (
                    <>
                      {/* Optimization Header Banner */}
                      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 rounded-2xl border border-teal-500/30 p-6 shadow-2xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs uppercase font-mono tracking-wider text-teal-400 font-semibold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Reverse Optimization Result • Budget Fit
                            </span>
                            <div className="text-3xl font-extrabold text-white mt-1">
                              ₹{optimizedPlanResult.total_planned_budget_inr.toLocaleString()}
                              <span className="text-sm font-normal text-slate-400 ml-2">
                                of ₹{optimizedPlanResult.input_budget_inr.toLocaleString()} wallet cap
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
                                Recommended Tier: {optimizedPlanResult.recommended_travel_style}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold text-xs border border-sky-500/30">
                                Affordable Stay: {optimizedPlanResult.recommended_days} Days
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800 text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-mono">Unused Surplus</div>
                            <div className="text-lg font-bold text-emerald-400 font-mono">
                              ₹{optimizedPlanResult.remaining_surplus_inr.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">Extra Cushion</div>
                          </div>
                        </div>

                        {/* Advisory Notes Box */}
                        {optimizedPlanResult.advisory_notes && optimizedPlanResult.advisory_notes.length > 0 && (
                          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-teal-500/20 text-xs text-slate-300 space-y-1">
                            {optimizedPlanResult.advisory_notes.map((note, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                                <span>{note}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Attractions Fitted into Wallet */}
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <Camera className="w-4 h-4 text-violet-400" />
                            Attractions Fitted Within Your Wallet Cap
                          </h4>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {optimizedPlanResult.selected_attractions?.length || 0} Afforded
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          {optimizedPlanResult.selected_attractions?.map(attr => (
                            <div
                              key={attr.attraction_id}
                              className="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/20 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="font-medium text-slate-200">{attr.name}</span>
                              </div>
                              <span className="font-mono text-emerald-300 font-bold">
                                ₹{attr.cost_for_group.toLocaleString()} ({groupSize} travelers)
                              </span>
                            </div>
                          ))}

                          {optimizedPlanResult.deferred_attractions?.map(attr => (
                            <div
                              key={attr.attraction_id}
                              className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 opacity-60 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <span className="text-slate-400 line-through">{attr.name}</span>
                              </div>
                              <span className="text-[10px] text-amber-400 font-mono">
                                Deferred (+₹{attr.cost_for_group.toLocaleString()})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Category Allocations */}
                      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <PieIcon className="w-4 h-4 text-teal-400" />
                          Reverse-Optimized Category Envelopes
                        </h4>

                        <div className="space-y-2 text-xs">
                          {optimizedPlanResult.category_breakdown?.map(item => (
                            <div
                              key={item.category_code}
                              className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: CATEGORY_COLORS[item.category_code] || '#94a3b8' }}
                                />
                                <div>
                                  <div className="font-medium text-slate-200">{item.category_name}</div>
                                  <div className="text-[10px] text-slate-500">{item.calculation_basis}</div>
                                </div>
                              </div>

                              <div className="font-mono font-bold text-slate-200 text-right">
                                ₹{item.allocated_inr.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                      <DollarSign className="w-10 h-10 mx-auto text-slate-600 mb-2 animate-bounce" />
                      <p>Enter your budget on the left to reverse-engineer your itinerary plan.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: MY TRIPS & WHAT-IF SIMULATOR */}
        {/* ========================================================================= */}
        {activeTab === 'trips' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Trip Cards List (4 Cols) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    My Saved Trips ({trips.length})
                  </h3>
                  <button
                    onClick={fetchTrips}
                    className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>

                {trips.map(trip => (
                  <div
                    key={trip.trip_id}
                    onClick={() => selectTripForDetails(trip.trip_id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      activeTrip?.trip_id === trip.trip_id
                        ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm">{trip.title}</h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {trip.destination?.city_name}, {trip.destination?.country_name} • {trip.duration_days} Days
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        Number(trip.total_spent_inr) > Number(trip.total_budget_inr)
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {Number(trip.total_spent_inr) > Number(trip.total_budget_inr) ? 'OVER BUDGET' : 'HEALTHY'}
                      </span>
                    </div>

                    <div className="mt-3 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Budget:</span>
                      <span className="font-mono font-bold text-emerald-400">₹{Number(trip.total_budget_inr).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trip Analytical Dashboard & What-If Simulator (8 Cols) */}
              <div className="lg:col-span-8 space-y-5">
                {activeTrip ? (
                  <>
                    {/* View: v_trip_budget_summary Details */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-white">{activeTrip.title}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                              Trip #{activeTrip.trip_id}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Analytical view: <code className="text-emerald-400">v_trip_budget_summary</code>
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400">Budget Spent</div>
                          <div className="text-2xl font-bold text-white font-mono">
                            ₹{Number(activeTrip.total_spent_inr).toLocaleString()} / <span className="text-emerald-400">₹{Number(activeTrip.total_budget_inr).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Budget Utilization Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Utilization:</span>
                          <span className="font-mono font-bold text-slate-200">
                            {Math.round((Number(activeTrip.total_spent_inr) / Number(activeTrip.total_budget_inr)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all rounded-full ${
                              (Number(activeTrip.total_spent_inr) / Number(activeTrip.total_budget_inr)) > 1.0
                                ? 'bg-rose-500'
                                : (Number(activeTrip.total_spent_inr) / Number(activeTrip.total_budget_inr)) > 0.8
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((Number(activeTrip.total_spent_inr) / Number(activeTrip.total_budget_inr)) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* Category Variances Table */}
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                          Category Variances (<code className="text-emerald-400 lowercase">v_trip_category_variance</code>)
                        </h4>
                        <div className="space-y-1.5 text-xs">
                          {activeTrip.budget_breakdowns?.map(b => (
                            <div
                              key={b.breakdown_id}
                              className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between"
                            >
                              <span className="font-medium text-slate-300">{b.category?.category_name}</span>
                              <div className="flex items-center gap-4 font-mono">
                                <span className="text-slate-400">
                                  Spent: ₹{Number(b.spent_amount_inr).toLocaleString()}
                                </span>
                                <span className="text-slate-200 font-bold">
                                  Allocated: ₹{Number(b.allocated_amount_inr).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* What-If Live Simulator on this Trip */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-teal-400" />
                            What-If Trip Reschedule Simulator
                          </h4>
                          <p className="text-xs text-slate-400">Simulate altering stay duration or travel tier without altering database</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 font-mono">
                          Dynamic Re-estimation
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400">Simulate Stay Duration: {simDays} Days</label>
                          <input
                            type="range"
                            min="1"
                            max="15"
                            value={simDays}
                            onChange={(e) => handleSimulateWhatIf(parseInt(e.target.value), simStyle)}
                            className="w-full accent-teal-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400">Simulate Travel Style</label>
                          <div className="flex gap-2">
                            {['BUDGET', 'STANDARD', 'LUXURY'].map(s => (
                              <button
                                key={s}
                                onClick={() => handleSimulateWhatIf(simDays, s)}
                                className={`flex-1 py-1 rounded text-xs font-bold border ${
                                  simStyle === s
                                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                                    : 'bg-slate-950 border-slate-800 text-slate-400'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {simulatedResult && (
                        <div className="mt-3 bg-slate-950/80 p-3.5 rounded-xl border border-teal-500/30 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400">Simulated Total Budget:</span>
                            <div className="text-lg font-bold text-teal-300 font-mono">
                              ₹{simulatedResult.total_budget_inr.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400">Variance from Saved:</span>
                            <div className={`font-mono font-bold text-sm ${
                              simulatedResult.total_budget_inr > activeTrip.total_budget_inr
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}>
                              {simulatedResult.total_budget_inr > activeTrip.total_budget_inr ? '+' : ''}
                              ₹{(simulatedResult.total_budget_inr - activeTrip.total_budget_inr).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
                    Select a trip from the left to view details and simulate.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVE EXPENSE TRACKER & TRIGGER ALERTS */}
        {/* ========================================================================= */}
        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Trigger Alerts Banner */}
            {recentTriggerAlerts.length > 0 && (
              <div className="space-y-2">
                {recentTriggerAlerts.map(alert => (
                  <div
                    key={alert.alert_id}
                    className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-start gap-3 shadow-lg"
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs uppercase tracking-wide text-rose-300">
                        PostgreSQL Trigger Fired: {alert.alert_type} (trg_check_budget_overrun)
                      </div>
                      <div className="text-sm font-medium">{alert.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Log Expense Form (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      Log Trip Expense
                    </h3>
                    <p className="text-xs text-slate-400">Fires PostgreSQL trigger to recalculate budget & test alert thresholds</p>
                  </div>

                  <form onSubmit={handleLogExpense} className="space-y-3.5 text-xs">
                    {/* Select Trip */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Active Trip</label>
                      <select
                        value={activeTrip?.trip_id || ''}
                        onChange={(e) => selectTripForDetails(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        {trips.map(t => (
                          <option key={t.trip_id} value={t.trip_id}>
                            {t.title} (Budget: ₹{Number(t.total_budget_inr).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expense Name */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Expense Description</label>
                      <input
                        type="text"
                        placeholder="e.g., Shibuya Izakaya Dinner, Hotel Advance, Tokyo Subway Pass"
                        value={expenseForm.expense_name}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_name: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Budget Category</label>
                      <select
                        value={expenseForm.category_id}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, category_id: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        {categories.map(c => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Amount (INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2500"
                        value={expenseForm.amount_inr}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount_inr: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono"
                        required
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Payment Method</label>
                      <select
                        value={expenseForm.payment_method}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_method: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                      >
                        <option value="CARD">Credit / Debit Card</option>
                        <option value="UPI">UPI / Digital Wallet</option>
                        <option value="CASH">Local Cash</option>
                        <option value="FOREX">Forex Travel Card</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={expenseLogging || !activeTrip}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all shadow-lg"
                    >
                      {expenseLogging ? 'Logging Expense...' : 'Record Expense & Evaluate Triggers'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Expense History & Trigger Alerts (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Recorded Expenses for {activeTrip?.title}
                    </h4>
                    <span className="text-xs font-mono text-slate-400">
                      {activeTrip?.expenses?.length || 0} recorded
                    </span>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {activeTrip?.expenses?.length > 0 ? (
                      activeTrip.expenses.map(exp => (
                        <div
                          key={exp.expense_id}
                          className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{exp.expense_name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {exp.category?.category_name}
                              </span>
                              <span>•</span>
                              <span>{exp.payment_method}</span>
                              <span>•</span>
                              <span>{new Date(exp.expense_date).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="font-mono font-bold text-emerald-400 text-sm">
                            ₹{Number(exp.amount_inr).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No expenses logged for this trip yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ADMIN & AUDIT LOGS (RBAC & SECURITY) */}
        {/* ========================================================================= */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fadeIn">
            {/* System Health Overview Cards */}
            {systemHealth && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">PostgreSQL Status</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    CONNECTED
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Latency: {systemHealth.database?.latency_ms}ms
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Relational Tables</div>
                  <div className="text-lg font-bold text-sky-400 mt-1 font-mono">
                    {systemHealth.database?.tables_count} Tables (3NF)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Normalized Schema</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Trips Stored</div>
                  <div className="text-lg font-bold text-violet-400 mt-1 font-mono">
                    {systemHealth.database?.total_trips} Trips
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">ACID Transactions</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Overrun Trigger Alerts</div>
                  <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
                    {systemHealth.database?.total_alerts} Alerts
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Automated Triggers</div>
                </div>
              </div>
            )}

            {/* Security Audit Logs Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Database Security Audit Logs (RBAC Enforced)
                  </h3>
                  <p className="text-xs text-slate-400">Immutable ledger of all user transactions, logins, and schema modifications</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ADMIN ONLY
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Log ID</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity Type</th>
                      <th className="p-3">User / Reg No</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auditLogs.map(log => (
                      <tr key={log.log_id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="p-3 font-mono text-slate-500">#{log.log_id}</td>
                        <td className="p-3 font-bold text-emerald-300">{log.action}</td>
                        <td className="p-3 font-mono text-slate-400">{log.entity_type}</td>
                        <td className="p-3 font-medium text-slate-200">
                          {log.user ? `${log.user.full_name} (${log.user.reg_no})` : 'SYSTEM'}
                        </td>
                        <td className="p-3 font-mono text-slate-400">{log.ip_address}</td>
                        <td className="p-3 font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
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
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 mt-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          WanderBudget AI • <span className="text-slate-300 font-medium">Garudaiahgari Sai Siri Chandana (24BAI0226)</span>
        </div>
        <div className="flex items-center gap-4">
          <span>BCSE302P Database Systems Lab</span>
          <span>•</span>
          <span>Faculty: Dr. V. SIVAKUMAR</span>
          <span>•</span>
          <span>Slot: L25+L26</span>
        </div>
      </footer>
    </div>
  );
}
