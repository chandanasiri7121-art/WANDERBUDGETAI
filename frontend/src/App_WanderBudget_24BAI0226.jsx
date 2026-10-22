import React, { useState, useEffect, useMemo, useRef } from 'react';
import LoginPage from './LoginPage.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useTheme } from './theme.js';
import { safeAttractionsFor, selectionStateFor, destinationDropdownGroups, externalPlacesFromDiscovery, isCurrentSearchRequest } from './destinationSelection_24BAI0226.mjs';
import { dynamicBudgetPresentation } from './dynamicBudgetPresentation_24BAI0226.mjs';
import { apiFetch } from './api.js';
import {
  Compass, MapPin, Calendar, Users, DollarSign, Sparkles, TrendingUp,
  AlertTriangle, ShieldCheck, CheckCircle2, Search, ArrowRight, RefreshCw,
  PlusCircle, CreditCard, ChevronRight, PieChart as PieIcon, BarChart3,
  Hotel, Utensils, Bus, Camera, ShieldAlert, Award, FileText, Database,
  Activity, Layers, Info, Check, LogOut, UserCheck, Globe, Key, Cpu,
  Bot, MessageSquare, Send, Trash2, X, Minimize2, Maximize2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

// All calls in this module are application API calls. apiFetch preserves the
// Vite proxy locally and uses VITE_API_BASE_URL in separately hosted builds.
const fetch = apiFetch;

// Colors for Budget Categories
const CATEGORY_COLORS = {
  ACCOMMODATION: '#38bdf8', // Sky Blue
  FOOD: '#34d399',          // Emerald
  TRANSIT: '#fbbf24',       // Amber
  TRANSPORT: '#fbbf24',     // Amber
  SIGHTSEEING: '#a78bfa',   // Violet
  BUFFER: '#f43f5e',        // Rose
  CONTINGENCY: '#f43f5e',   // Rose
  MISC: '#94a3b8'           // Slate
};

// Destination taxonomy is completely data-driven from PostgreSQL Destination model (country_name)


// Markdown Formatter Helper for Traveler Chatbot
function renderFormattedMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let tableRows = [];
  let inTable = false;

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const dataRows = tableRows.slice(2); // skip separator row
      elements.push(
        <div key={`table_${key}`} className="my-2 overflow-x-auto rounded-lg border border-slate-700/80 bg-slate-950/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} className="p-2 font-semibold text-slate-200">
                    {parseInlineStyles(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 text-slate-300">
                      {parseInlineStyles(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const parseInlineStyles = (str) => {
    // Bold: **text**
    const parts = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="font-semibold text-slate-100">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }
    return parts.length > 0 ? parts : str;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cols = trimmed.split('|').slice(1, -1);
      tableRows.push(cols);
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={idx} className="text-xs font-bold text-emerald-400 mt-2 mb-1 flex items-center gap-1">
          {parseInlineStyles(trimmed.replace('### ', ''))}
        </h4>
      );
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <div key={idx} className="flex items-start gap-1.5 my-0.5 text-xs text-slate-300 ml-1">
          <span className="text-emerald-400 text-xs mt-0.5">•</span>
          <span className="flex-1">{parseInlineStyles(trimmed.slice(2))}</span>
        </div>
      );
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1" />);
    } else {
      elements.push(
        <p key={idx} className="text-xs text-slate-300 my-0.5 leading-relaxed">
          {parseInlineStyles(trimmed)}
        </p>
      );
    }
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return elements;
}

// Google 'G' Logo SVG Component
function GoogleLogoSvg({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export default function App_WanderBudget_24BAI0226() {
  const { isDark } = useTheme();

  // Current Active Tab
  const [activeTab, setActiveTab] = useState('ai_explorer'); // 'ai_explorer', 'builder', 'trips', 'expenses', 'admin', 'chatbot'

  // User Auth State & Google OAuth
  const [token, setToken] = useState(localStorage.getItem('wb_token') || '');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authNotification, setAuthNotification] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('wb_token');
    setToken('');
    setUser(null);
    setActiveTab('ai_explorer');
  };

  const handleGoogleCredentialResponse = async (credential) => {
    if (!credential || typeof credential !== 'string') return;
    setAuthLoading(true);
    setAuthNotification(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('wb_token', data.token);
        setAuthNotification({ type: 'success', text: `Signed in as ${data.user.full_name} (${data.user.email}) via Google OAuth!` });
        setTimeout(() => setShowAuthModal(false), 1200);
      } else {
        setAuthNotification({ type: 'error', text: data.error || 'Failed to sign in with Google' });
      }
    } catch (err) {
      setAuthNotification({ type: 'error', text: err.message });
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!showAuthModal) return;

    let isMounted = true;
    let intervalId = null;
    let timeoutId = null;

    const GOOGLE_CLIENT_ID = '585498529067-sc1te4irkgeo13iqbtei89l5ba59jak7.apps.googleusercontent.com';

    const tryInitModalGoogleGsi = () => {
      if (!isMounted) return false;
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response?.credential && isMounted) {
                handleGoogleCredentialResponse(response.credential);
              }
            }
          });
          const btnEl = document.getElementById('google-modal-btn-official');
          if (btnEl && isMounted) {
            btnEl.innerHTML = '';
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'outline',
              size: 'large',
              width: 280,
              text: 'continue_with',
              shape: 'pill'
            });
          }
          return true;
        } catch (e) {
          console.warn('Google GSI modal initialization notice:', e.message);
          return false;
        }
      }
      return false;
    };

    // Try immediately if already loaded
    if (tryInitModalGoogleGsi()) {
      return () => {
        isMounted = false;
      };
    }

    // Bounded retries every 300 ms for up to ~6 seconds
    intervalId = setInterval(() => {
      if (tryInitModalGoogleGsi()) {
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);
      }
    }, 300);

    // Timeout ceiling of ~6 seconds
    timeoutId = setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
    }, 6000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [showAuthModal]);


  // Master Data
  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // AI Explorer State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [analyzingCity, setAnalyzingCity] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [syncingRates, setSyncingRates] = useState(false);
  const [rateSyncMessage, setRateSyncMessage] = useState('');
  const [costSummary, setCostSummary] = useState(null);
  const [costDurationPreset, setCostDurationPreset] = useState('week');
  const [costStylePreset, setCostStylePreset] = useState('standard');
  const [externalDiscoveryResults, setExternalDiscoveryResults] = useState([]);
  const [exploreDestinationMenuOpen, setExploreDestinationMenuOpen] = useState(false);
  const [exploreDiscoveryLoading, setExploreDiscoveryLoading] = useState(false);
  const [exploreExternalResults, setExploreExternalResults] = useState([]);
  const [exploreDiscoveryError, setExploreDiscoveryError] = useState('');
  const exploreDiscoveryRequestRef = useRef(0);
  const exploreDiscoveryDebounceRef = useRef(null);

  const [builderSearchQuery, setBuilderSearchQuery] = useState('');
  const [builderDestinationMenuOpen, setBuilderDestinationMenuOpen] = useState(false);
  const [builderDiscoveryLoading, setBuilderDiscoveryLoading] = useState(false);
  const [builderExternalResults, setBuilderExternalResults] = useState([]);
  const [builderDiscoveryError, setBuilderDiscoveryError] = useState('');
  const builderDiscoveryRequestRef = useRef(0);
  const builderDiscoveryDebounceRef = useRef(null);

  // Dynamic Country List & Filter derived directly from DB Destination records
  const availableCountries = useMemo(() => {
    const set = new Set();
    destinations.forEach(d => {
      if (d.country_name) set.add(d.country_name.trim());
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    if (selectedCountry === 'ALL') return destinations;
    return destinations.filter(d => d.country_name === selectedCountry);
  }, [destinations, selectedCountry]);

  const visibleAttractions = useMemo(() => safeAttractionsFor(selectedDestination), [selectedDestination]);
  const builderDropdownGroups = useMemo(() => destinationDropdownGroups(
    builderSearchQuery, destinations, builderExternalResults
  ), [builderSearchQuery, destinations, builderExternalResults]);
  const exploreDropdownGroups = useMemo(() => destinationDropdownGroups(
    searchQuery, destinations, exploreExternalResults
  ), [searchQuery, destinations, exploreExternalResults]);

  // Trip Budget Builder State
  const [builderDestinationId, setBuilderDestinationId] = useState('');
  const [durationDays, setDurationDays] = useState(5);
  const [travelStyle, setTravelStyle] = useState('STANDARD'); // 'BUDGET', 'STANDARD', 'LUXURY'
  const [groupSize, setGroupSize] = useState(2);
  const [selectedAttractionIds, setSelectedAttractionIds] = useState([]);
  const [calculatedBudget, setCalculatedBudget] = useState(null);
  const [budgetAdvice, setBudgetAdvice] = useState(null);
  const [budgetAdviceLoading, setBudgetAdviceLoading] = useState(false);
  const [budgetAdviceError, setBudgetAdviceError] = useState('');
  const [dynamicEstimate, setDynamicEstimate] = useState(null);
  const [dynamicEstimateLoading, setDynamicEstimateLoading] = useState(false);
  const [dynamicEstimateError, setDynamicEstimateError] = useState('');
  const displayedDynamicBudget = useMemo(
    () => dynamicBudgetPresentation(dynamicEstimate),
    [dynamicEstimate]
  );
  const [dynamicTripInputs, setDynamicTripInputs] = useState({
    starting_point: '',
    overnight_stay: false,
    overnight_nights: 0,
    room_occupancy: 2,
    meals_per_person_per_day: 3,
    transport_preference: 'MIXED',
    cab_distance_share: 0.5
  });
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

  // Gemini & External API Status State
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState(null);

  const fetchApiStatus = async () => {
    try {
      const res = await fetch('/api/system/api-status');
      if (res.ok) {
        const data = await res.json();
        setApiStatus(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSaveGeminiKey = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!geminiKeyInput || geminiKeyInput.trim().length < 8) {
      setKeySaveMessage({ type: 'error', text: 'Please enter a valid Gemini API key (starts with AIzaSy...)' });
      return;
    }
    setSavingKey(true);
    setKeySaveMessage(null);
    try {
      const res = await fetch('/api/system/save-gemini-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setKeySaveMessage({ type: 'success', text: data.message });
        setGeminiKeyInput('');
        fetchApiStatus();
      } else {
        setKeySaveMessage({ type: 'error', text: data.error || 'Failed to save key' });
      }
    } catch (err) {
      setKeySaveMessage({ type: 'error', text: err.message });
    } finally {
      setSavingKey(false);
    }
  };

  // Traveler AI Copilot Chatbot State (24BAI0226)
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello! 👋 I am **WanderBot**, your intelligent AI Traveler Copilot for **WanderBudget AI**!

I can help you plan trips, compare costs, and estimate travel budgets for **destinations worldwide**, backed by verified database benchmarks and live exchange rates.

Ask me anything like:
* 🥐 *"What is the budget for 5 days in Paris?"*
* ⚖️ *"Compare Tokyo vs Zurich daily costs"*
* 🏛️ *"Show free attractions in Rome"*
* 🌴 *"Give me budget tips for traveling in Bali"*
* 🛕 *"What is the 4-day budget for Tirupati?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSuggestedPrompts, setChatSuggestedPrompts] = useState([
    "What is the budget for 5 days in Paris?",
    "Compare Tokyo vs Zurich daily costs",
    "Show free attractions in Rome",
    "Give me budget tips for Bali"
  ]);

  const handleSendChatMessage = async (customPrompt) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : chatInput;
    if (!textToSend || !textToSend.trim() || chatLoading) return;

    const userMsg = {
      id: 'user_' + Date.now(),
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const history = chatMessages.slice(-6).map(m => ({ role: m.role, text: m.text }));
      const res = await fetch('/api/ai/traveler-chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          history,
          destination_id: selectedDestination?.destination_id || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg = {
          id: 'bot_' + Date.now(),
          role: 'assistant',
          text: data.reply,
          engine: data.engine,
          detected_destination: data.detected_destination,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, botMsg]);
        if (data.suggested_prompts && data.suggested_prompts.length > 0) {
          setChatSuggestedPrompts(data.suggested_prompts);
        }
      } else {
        const errData = await res.json();
        setChatMessages(prev => [...prev, {
          id: 'bot_err_' + Date.now(),
          role: 'assistant',
          text: `⚠️ **Error:** ${errData.error || 'Failed to contact Traveler AI'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: 'bot_err_' + Date.now(),
        role: 'assistant',
        text: `⚠️ **Network Error:** Could not connect to chatbot service (${err.message})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        fetchApiStatus();

        // 1. Check for stored token and verify active session
        const savedToken = localStorage.getItem('wb_token');
        if (savedToken) {
          try {
            const meRes = await fetch('/api/auth/me', {
              headers: { 'Authorization': `Bearer ${savedToken}` }
            });
            if (meRes.ok) {
              const meUser = await meRes.json();
              setUser(meUser);
              setToken(savedToken);
            } else {
              localStorage.removeItem('wb_token');
              setToken('');
              setUser(null);
            }
          } catch (tokenErr) {
            console.warn('Session verification error:', tokenErr.message);
          }
        } else {
          setToken('');
          setUser(null);
        }

        // Fetch Destinations
        const destRes = await fetch('/api/destinations');
        if (destRes.ok) {
          const destData = await destRes.json();
          setDestinations(destData);
          if (destData.length > 0) {
            const initialSelection = selectionStateFor(destData[0]);
            setSelectedDestination(initialSelection.destination);
            setBuilderDestinationId(initialSelection.destination.destination_id);
            setSelectedAttractionIds(initialSelection.attractionIds);
            setBuilderSearchQuery(`${initialSelection.destination.city_name}, ${initialSelection.destination.country_name}`);
            calculateDynamicBudget(initialSelection.destination.destination_id, initialSelection.attractionIds);
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
      if (user?.role === 'ADMIN') {
        fetchAdminData();
      } else {
        setActiveTab('ai_explorer');
      }
    }
  }, [activeTab, token, user?.role]);

  // Recalculate dynamic budget or reverse-optimize whenever builder parameters change
  useEffect(() => {
    if ((builderDestinationId || selectedDestination?.is_external) && activeTab === 'builder') {
      if (builderMode === 'PLAN_TO_COST') {
        calculateDynamicBudget();
      } else {
        handleOptimizeBudgetToPlan();
      }
    }
  }, [builderDestinationId, selectedDestination, durationDays, travelStyle, groupSize, selectedAttractionIds, builderMode, targetWalletBudget, activeTab]);

  // Advice is tied to these exact inputs and must not survive a new calculation.
  useEffect(() => {
    setBudgetAdvice(null);
    setBudgetAdviceError('');
  }, [builderDestinationId, durationDays, travelStyle, groupSize, selectedAttractionIds, dynamicTripInputs]);

  // Update selected destination object when builderDestinationId changes & default all its attractions to included
  useEffect(() => {
    if (builderDestinationId && destinations.length > 0) {
      const match = destinations.find(d => d.destination_id === Number(builderDestinationId));
      if (match) {
        const next = selectionStateFor(match);
        setSelectedAttractionIds([]);
        setSelectedDestination(next.destination);
        setSelectedAttractionIds(next.attractionIds);
      }
    }
  }, [builderDestinationId, destinations]);

  // Load verified summaries from the catalog, or use the analyzer's in-memory preview
  // summary. Clearing first prevents the previous city's figures from being displayed.
  useEffect(() => {
    let cancelled = false;
    setCostSummary(null);
    if (selectedDestination?.is_preview) {
      setCostSummary(selectedDestination.cost_summary || null);
    } else if (selectedDestination?.destination_id) {
      fetch(`/api/destinations/${selectedDestination.destination_id}/cost-of-living-summary`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (!cancelled && data) setCostSummary(data); })
        .catch(err => console.error('Cost summary fetch error:', err));
    }
    return () => { cancelled = true; };
  }, [selectedDestination?.destination_id, selectedDestination?.is_preview, selectedDestination?.cost_summary]);

  // Select an existing destination from verified catalog
  const handleSelectDestination = (dest) => {
    const next = selectionStateFor(dest);
    setCostSummary(null);
    setCalculatedBudget(null);
    setOptimizedPlanResult(null);
    setSelectedDestination(next.destination);
    setSearchError('');
    setBuilderSearchQuery(`${next.destination.city_name}, ${next.destination.country_name}`);
    setBuilderDestinationMenuOpen(false);
    setSelectedAttractionIds(next.attractionIds);
    if (next.canUseDatabaseEstimator) {
      setBuilderDestinationId(next.destination.destination_id);
      calculateDynamicBudget(next.destination.destination_id, next.attractionIds);
    }
  };

  // External geographic results have no persistent database destination record.
  const handleSelectExternalDestination = (place) => {
    const next = selectionStateFor({ ...place, is_external: true, is_preview: false, attractions: Array.isArray(place.attractions) ? place.attractions : [] });
    setCostSummary(null);
    setSelectedDestination(next.destination);
    setBuilderDestinationId('');
    setSelectedAttractionIds(next.attractionIds);
    setCalculatedBudget(null);
    setDynamicEstimate(null);
    setDynamicEstimateError('');
    setOptimizedPlanResult(null);
    setSearchError('');
    setBuilderSearchQuery(place.full_name || (place.region_name ? `${place.city_name}, ${place.region_name}, ${place.country_name}` : `${place.city_name}, ${place.country_name}`));
    setBuilderDestinationMenuOpen(false);
    calculateDynamicBudget(null, next.attractionIds, next.destination);
  };

  const handleBuilderDestinationSearch = (rawQuery) => {
    setBuilderSearchQuery(rawQuery);
    setBuilderDestinationMenuOpen(true);
    setBuilderDiscoveryError('');
    if (builderDiscoveryDebounceRef.current) {
      clearTimeout(builderDiscoveryDebounceRef.current);
    }
    const query = rawQuery.trim();
    if (query.length < 2) {
      setBuilderExternalResults([]);
      setBuilderDiscoveryLoading(false);
      return;
    }
    const authToken = token || localStorage.getItem('wb_token');
    if (!authToken) {
      setBuilderExternalResults([]);
      setBuilderDiscoveryLoading(false);
      setBuilderDiscoveryError('Sign in to search external places. Verified database destinations remain available.');
      return;
    }
    setBuilderDiscoveryLoading(true);
    builderDiscoveryDebounceRef.current = setTimeout(async () => {
      const requestId = ++builderDiscoveryRequestRef.current;
      try {
        const response = await fetch('/api/destinations/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify({ query })
        });
        if (!response.ok) {
          if (isCurrentSearchRequest(requestId, builderDiscoveryRequestRef.current)) {
            setBuilderExternalResults([]);
            setBuilderDiscoveryError(response.status === 401 || response.status === 403
              ? 'Your session has expired. Sign in again to search external places.'
              : 'External place search is temporarily unavailable. Verified database destinations remain available.');
          }
          return;
        }
        const data = await response.json();
        if (!isCurrentSearchRequest(requestId, builderDiscoveryRequestRef.current)) return;
        setBuilderExternalResults(externalPlacesFromDiscovery(data, destinations));
        if (data?.provider_status === 'not_configured' || data?.provider_status === 'unavailable') {
          setBuilderDiscoveryError('External place search is temporarily unavailable. Verified database destinations remain available.');
        } else if (data?.provider_status === 'rate_limited') {
          setBuilderDiscoveryError('Mapbox rate limit reached. Please wait a moment before searching again.');
        }
      } catch (err) {
        if (isCurrentSearchRequest(requestId, builderDiscoveryRequestRef.current)) {
          setBuilderExternalResults([]);
          setBuilderDiscoveryError('External place search is temporarily unavailable. Verified database destinations remain available.');
        }
      } finally {
        if (isCurrentSearchRequest(requestId, builderDiscoveryRequestRef.current)) setBuilderDiscoveryLoading(false);
      }
    }, 250);
  };

  const handleExploreDestinationSearch = (rawQuery) => {
    setSearchQuery(rawQuery);
    setExploreDestinationMenuOpen(true);
    setExploreDiscoveryError('');
    if (exploreDiscoveryDebounceRef.current) {
      clearTimeout(exploreDiscoveryDebounceRef.current);
    }
    const query = rawQuery.trim();
    if (query.length < 2) {
      setExploreExternalResults([]);
      setExploreDiscoveryLoading(false);
      return;
    }
    const authToken = token || localStorage.getItem('wb_token');
    if (!authToken) {
      setExploreExternalResults([]);
      setExploreDiscoveryLoading(false);
      return;
    }
    setExploreDiscoveryLoading(true);
    exploreDiscoveryDebounceRef.current = setTimeout(async () => {
      const requestId = ++exploreDiscoveryRequestRef.current;
      try {
        const response = await fetch('/api/destinations/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify({ query })
        });
        if (!response.ok) {
          if (isCurrentSearchRequest(requestId, exploreDiscoveryRequestRef.current)) {
            setExploreExternalResults([]);
            if (response.status === 401 || response.status === 403) {
              setExploreDiscoveryError('Session expired. Sign in to search external places.');
            }
          }
          return;
        }
        const data = await response.json();
        if (!isCurrentSearchRequest(requestId, exploreDiscoveryRequestRef.current)) return;
        setExploreExternalResults(externalPlacesFromDiscovery(data, destinations));
      } catch (err) {
        if (isCurrentSearchRequest(requestId, exploreDiscoveryRequestRef.current)) {
          setExploreExternalResults([]);
        }
      } finally {
        if (isCurrentSearchRequest(requestId, exploreDiscoveryRequestRef.current)) {
          setExploreDiscoveryLoading(false);
        }
      }
    }, 250);
  };

  const handleSelectExploreCataloged = (dest) => {
    handleSelectDestination(dest);
    setSearchQuery(`${dest.city_name}, ${dest.country_name}`);
    setExploreDestinationMenuOpen(false);
  };

  const handleSelectExploreExternal = (place) => {
    handleSelectExternalDestination(place);
    setSearchQuery(place.full_name || (place.region_name ? `${place.city_name}, ${place.region_name}, ${place.country_name}` : `${place.city_name}, ${place.country_name}`));
    setExploreDestinationMenuOpen(false);
  };

  // External discovery is attempted first. If it cannot resolve a place, the established
  // read-only analyzer remains available as the existing search fallback.
  const handleAnalyzeCity = async (cityName) => {
    setExploreDestinationMenuOpen(false);
    const query = cityName || searchQuery;
    if (!query || query.trim().length < 2) {
      setSearchError('Please enter at least 2 characters to search for a destination.');
      return;
    }

    const cleanQuery = query.trim().toLowerCase();

    // 1. Check local catalog first
    const localMatch = destinations.find(d =>
      d.city_name?.toLowerCase() === cleanQuery ||
      d.country_name?.toLowerCase() === cleanQuery
    );

    if (localMatch) {
      handleSelectDestination(localMatch);
      return;
    }

    // 2. Search real geographic places without adding them to the verified catalog.
    let matchedExternalPlace = null;
    try {
      setAnalyzingCity(true);
      setSearchError('');
      const discoveryRes = await fetch('/api/destinations/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: query.trim() })
      });

      if (discoveryRes.ok) {
        const discovery = await discoveryRes.json();
        const places = Array.isArray(discovery.results) ? discovery.results : [];
        const verifiedMatch = places.map(place => destinations.find(dest =>
          dest.city_name?.toLowerCase() === place.city_name?.toLowerCase() &&
          dest.country_name?.toLowerCase() === place.country_name?.toLowerCase()
        )).find(Boolean);
        const externalPlaces = places.filter(place => !destinations.some(dest =>
          dest.city_name?.toLowerCase() === place.city_name?.toLowerCase() &&
          dest.country_name?.toLowerCase() === place.country_name?.toLowerCase()
        ));
        setExternalDiscoveryResults(externalPlaces);
        if (verifiedMatch) {
          handleSelectDestination(verifiedMatch);
          setAnalyzingCity(false);
          return;
        }
        if (externalPlaces.length > 0) {
          matchedExternalPlace = externalPlaces.find(p => {
            const pCity = p.city_name?.toLowerCase();
            return pCity === cleanQuery || cleanQuery.startsWith(pCity) || pCity.startsWith(cleanQuery);
          }) || externalPlaces[0];
        }
      }
    } catch (err) {
      console.warn('External destination discovery unavailable; using existing analysis fallback.', err);
    }

    // 3. Obtain AI-generated travel context and cost benchmarks.
    try {
      const res = await fetch('/api/ai/analyze-destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ destination_query: query.trim(), refresh: false })
      });
      if (!res.ok) {
        if (matchedExternalPlace) {
          handleSelectExternalDestination(matchedExternalPlace);
          return;
        }
        const err = await res.json().catch(() => ({}));
        setSearchError(err.error || `Could not find travel information for "${query}". Try searching for another city.`);
        return;
      }
      const data = await res.json();
      const next = selectionStateFor({ ...data.destination, cost_summary: data.cost_summary || null });
      const dest = next.destination;
      const finalDest = matchedExternalPlace ? {
        ...dest,
        is_external: true,
        region_name: matchedExternalPlace.region_name || dest.region_name,
        country_name: matchedExternalPlace.country_name || dest.country_name,
        full_name: matchedExternalPlace.full_name || `${dest.city_name}, ${dest.country_name}`,
        coordinates: matchedExternalPlace.coordinates
      } : dest;
      setCostSummary(null);
      setSelectedAttractionIds([]);
      setSelectedDestination(finalDest);
      setSelectedAttractionIds(next.attractionIds);
      if (finalDest.destination_id) {
        setBuilderDestinationId(finalDest.destination_id);
      } else {
        setBuilderDestinationId('');
        setCalculatedBudget(null);
        setOptimizedPlanResult(null);
      }
    } catch (err) {
      if (matchedExternalPlace) {
        handleSelectExternalDestination(matchedExternalPlace);
        return;
      }
      console.error('AI analysis fallback error:', err);
      setSearchError('Unable to connect to travel service. Please check your network connection.');
    } finally {
      setAnalyzingCity(false);
    }
  };

  // API Call: Sync Real-Time Market Exchange Rates for Destination
  const handleSyncLiveFxRates = async (destId) => {
    if (!destId) return;
    try {
      setSyncingRates(true);
      const res = await fetch(`/api/destinations/${destId}/sync-rates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedDestination(data.destination);
        setRateSyncMessage(data.message);
        setTimeout(() => setRateSyncMessage(''), 5000);
        setDestinations(prev => prev.map(d => d.destination_id === destId ? data.destination : d));
      } else {
        const errData = await res.json().catch(() => ({}));
        setRateSyncMessage(errData.error || 'Failed to sync rates. Administrator privileges required.');
        setTimeout(() => setRateSyncMessage(''), 5000);
      }
    } catch (err) {
      console.error('Rate sync error:', err);
    } finally {
      setSyncingRates(false);
    }
  };

  // API Call: Calculate Dynamic Budget (Mode 1: Plan-to-Cost)
  const calculateDynamicBudget = async (explicitDestId = null, explicitAttractionIds = null, explicitExternal = null) => {
    const destId = explicitDestId || builderDestinationId;
    const external = explicitExternal || (selectedDestination?.is_external ? selectedDestination : null);
    if (!destId && !external) return;
    const attractionIds = Array.isArray(explicitAttractionIds) ? explicitAttractionIds : selectedAttractionIds;
    try {
      const res = await fetch('/api/trips/build-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(destId ? { destination_id: destId } : {
            external_destination: {
              is_external: true,
              city_name: external.city_name,
              region_name: external.region_name || null,
              country_name: external.country_name,
              coordinates: external.coordinates,
              cost_index: external.cost_index,
              attractions: external.attractions
            }
          }),
          duration_days: durationDays,
          travel_style: travelStyle,
          group_size: groupSize,
          attraction_ids: attractionIds
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

  // Optional advice is intentionally separate from the deterministic total.
  const handleGetBudgetAdvice = async () => {
    if (!builderDestinationId || !calculatedBudget || budgetAdviceLoading) return;
    const authToken = token || localStorage.getItem('wb_token');
    if (!authToken) {
      setBudgetAdviceError('Sign in again to request AI recommendations. Your deterministic estimate is unchanged.');
      return;
    }
    try {
      setBudgetAdviceLoading(true);
      setBudgetAdviceError('');
      const res = await fetch('/api/trips/budget-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          destination_id: builderDestinationId,
          duration_days: durationDays,
          travel_style: travelStyle,
          group_size: groupSize,
          attraction_ids: selectedAttractionIds
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBudgetAdvice(null);
        const retryAfter = Number.isFinite(Number(data.retry_after_seconds)) && !String(data.error || '').includes('Try again in') ? ` Try again in ${data.retry_after_seconds} seconds.` : '';
        setBudgetAdviceError(res.status === 401 || res.status === 403 ? 'Your session has expired. Sign in again to request recommendations.' : res.status === 404 ? 'The active backend does not include AI recommendations. Restart the backend after deploying this code.' : `${data.error || 'AI recommendations are temporarily unavailable.'}${retryAfter}`);
        return;
      }
      setBudgetAdvice(data);
    } catch {
      setBudgetAdvice(null);
      setBudgetAdviceError('Cannot reach the AI recommendations backend. Check that the backend is running on the configured API proxy.');
    } finally {
      setBudgetAdviceLoading(false);
    }
  };

  // This is a separate, read-only estimate. The existing saved-trip budget is never replaced.
  const handleDynamicEstimate = async (targetOverride = null, attractionIdsOverride = null) => {
    const activeTarget = targetOverride || selectedDestination;
    const targetDestId = (targetOverride && targetOverride.destination_id) || builderDestinationId;
    const externalDestination = (activeTarget?.is_external && activeTarget?.coordinates)
      ? activeTarget
      : null;
    if ((!targetDestId && !externalDestination) || dynamicEstimateLoading) return;
    const authToken = token || localStorage.getItem('wb_token');
    if (!authToken) {
      setDynamicEstimateError('Sign in again to build a dynamic estimate.');
      return;
    }
    const effectiveAttractionIds = Array.isArray(attractionIdsOverride)
      ? attractionIdsOverride
      : (activeTarget && Array.isArray(activeTarget.attractions) && activeTarget.attractions.length > 0
          ? safeAttractionsFor(activeTarget).map(a => a.attraction_id)
          : selectedAttractionIds);
    try {
      setDynamicEstimateLoading(true);
      setDynamicEstimateError('');
      setDynamicEstimate(null);
      const res = await fetch('/api/trips/dynamic-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          ...(targetDestId ? { destination_id: targetDestId } : { external_destination: {
            is_external: true,
            city_name: externalDestination.city_name,
            region_name: externalDestination.region_name || null,
            country_name: externalDestination.country_name,
            coordinates: externalDestination.coordinates
          } }),
          duration_days: durationDays,
          travel_style: travelStyle,
          group_size: groupSize,
          attraction_ids: effectiveAttractionIds,
          ...dynamicTripInputs
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDynamicEstimateError(res.status === 401 || res.status === 403 ? 'Your session has expired. Sign in again to build a dynamic estimate.' : res.status === 404 ? 'The active backend does not include dynamic estimates. Restart the backend after deploying this code.' : data.error || 'Dynamic estimate is temporarily unavailable.');
        return;
      }
      const estimate = data?.estimate || data;
      if (!estimate?.calculation_version || !Array.isArray(estimate.categories)) {
        setDynamicEstimateError('The estimator returned an unsupported response. Restart the backend after deploying this code.');
        return;
      }
      setDynamicEstimate(estimate);
    } catch {
      setDynamicEstimateError('Cannot reach the dynamic-estimate backend. Check that the backend is running on the configured API proxy.');
    } finally {
      setDynamicEstimateLoading(false);
    }
  };

  const handleContinueToTripEstimator = async (dest) => {
    const target = dest || selectedDestination;
    if (!target) return;

    setDynamicEstimateError('');
    setDynamicEstimate(null);

    // 1. If it's a cataloged database destination
    if (target.destination_id) {
      handleSelectDestination(target);
      setBuilderMode('PLAN_TO_COST');
      setActiveTab('builder');
      const attractionIds = safeAttractionsFor(target).map(a => a.attraction_id);
      calculateDynamicBudget(target.destination_id, attractionIds);
      await handleDynamicEstimate(target, attractionIds);
      return;
    }

    // 2. If it's an external destination with verified coordinates
    if (target.is_external && target.coordinates) {
      handleSelectExternalDestination(target);
      setBuilderMode('PLAN_TO_COST');
      setActiveTab('builder');
      await handleDynamicEstimate(target);
      return;
    }

    // 3. If it's an AI preview or unverified destination without coordinates, resolve via Mapbox discover
    let destinationToEstimate = target;
    try {
      const authToken = token || localStorage.getItem('wb_token');
      const res = await fetch('/api/destinations/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ query: target.city_name || searchQuery })
      });
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data.results) ? data.results : [];
        if (results.length > 0) {
          const match = results[0];
          destinationToEstimate = {
            ...target,
            city_name: match.city_name || target.city_name,
            region_name: match.region_name || target.region_name,
            country_name: match.country_name || target.country_name,
            coordinates: match.coordinates,
            is_external: true
          };
        }
      }
    } catch (err) {
      console.warn('Coordinates discovery error on route & estimate:', err);
    }

    handleSelectExternalDestination(destinationToEstimate);
    setBuilderMode('PLAN_TO_COST');
    setActiveTab('builder');

    if (destinationToEstimate.coordinates) {
      await handleDynamicEstimate(destinationToEstimate);
    } else {
      setDynamicEstimateError(`Geographic coordinates could not be resolved for "${target.city_name}". You can search for the city in the Mapbox destination selector below.`);
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
    if (selectedDestination.is_preview || !builderDestinationId) {
      setSaveSuccessMsg('AI estimate previews are for exploration only. Select a verified database destination to save a trip.');
      return;
    }
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
      const tripAttrIds = (activeTrip.attractions && activeTrip.attractions.length > 0)
        ? activeTrip.attractions.map(a => a.attraction_id)
        : (activeTrip.trip_attractions ? activeTrip.trip_attractions.map(ta => ta.attraction_id) : []);

      const res = await fetch('/api/trips/build-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_id: activeTrip.destination_id,
          duration_days: days,
          travel_style: style,
          group_size: activeTrip.group_size,
          attraction_ids: tripAttrIds
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

  // API Call: Admin Data (RBAC Enforced via session token)
  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const [healthRes, logsRes] = await Promise.all([
        fetch('/api/admin/system-health', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/audit-logs?limit=15', {
          headers: { 'Authorization': `Bearer ${token}` }
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
    setSelectedAttractionIds(visibleAttractions.map(a => a.attraction_id));
  };

  const handleDiscardAllAttractions = () => {
    setSelectedAttractionIds([]);
  };

  // Add Custom Tourist Attraction (Not Hardcoded) — Admin Authorized
  const handleAddCustomAttraction = async (destId) => {
    if (!destId || !newAttrForm.name.trim()) return;
    try {
      setAddingAttr(true);
      const res = await fetch(`/api/destinations/${destId}/attractions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to add attraction. Administrator privileges required.');
      }
    } catch (err) {
      console.error('Add custom attraction error:', err);
    } finally {
      setAddingAttr(false);
    }
  };

  // Delete Attraction Permanently — Admin Authorized
  const handleDeleteAttraction = async (attrId, destId) => {
    if (String(attrId).startsWith('est_') || selectedDestination?.is_preview || !destId) {
      return;
    }
    try {
      const res = await fetch(`/api/attractions/${attrId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
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
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to delete attraction. Administrator privileges required.');
      }
    } catch (err) {
      console.error('Delete attraction error:', err);
    }
  };

  if (!user || !token) {
    return (
      <LoginPage
        onLoginSuccess={(loggedInUser, loggedInToken) => {
          setUser(loggedInUser);
          setToken(loggedInToken);
          if (loggedInUser.role === 'ADMIN') {
            fetchAdminData();
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* 1. TOP HEADER & IDENTITY EMBEDDING */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm dark:shadow-xl transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
                WanderBudget AI
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                v2.0 • Smart Travel
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Dynamic Trip Itinerary Budget Builder & Live AI Cost Analyzer</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Visual Theme Toggle (Light / Dark) */}
          <ThemeToggle />


          {/* User Role Badge (Clickable to switch accounts) */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-xs transition-all text-left text-slate-800 dark:text-slate-200"
            title="Click to view profile and account details"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{user?.full_name?.split(' ')[0]}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
              user?.role === 'ADMIN'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
            }`}>
              {user?.role === 'ADMIN' ? 'Admin' : 'User'}
            </span>
          </button>

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Sign out of WanderBudget"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* 2. NAVIGATION BAR */}
      <nav className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur px-6 py-2 flex items-center justify-between overflow-x-auto gap-2 transition-colors duration-200">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('ai_explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ai_explorer'
                ? 'bg-emerald-600 text-white dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1. AI Cost Explorer
          </button>

          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'builder'
                ? 'bg-emerald-600 text-white dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            2. Trip Budget Builder
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'trips'
                ? 'bg-emerald-600 text-white dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            3. My Trips & What-If
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'expenses'
                ? 'bg-emerald-600 text-white dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            4. Live Expense Tracker
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              5. Admin & Audit Logs
            </button>
          )}

          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chatbot'
                ? 'bg-emerald-600 text-white dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 dark:text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30'
            }`}
          >
            <Bot className="w-4 h-4" />
            6. 🤖 Traveler AI Copilot
          </button>
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
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden transition-colors duration-200">
              <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-2xl space-y-3 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Web Search & AI Travel Cost-of-Living Analyzer
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Where would you like to travel?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Search any destination in the world. WanderBudget connects to live travel indicators and calculates accommodation, dining, transit, and attraction costs in real time.
                </p>

                {/* Search Form */}
                <form
                  onSubmit={(e) => { e.preventDefault(); setExploreDestinationMenuOpen(false); handleAnalyzeCity(); }}
                  className="flex items-center gap-2 pt-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 z-10" />
                    <input
                      type="text"
                      placeholder="e.g., Seoul, Paris, Goa, Reykjavik, Tokyo, Dubai, Manali..."
                      value={searchQuery}
                      onFocus={() => setExploreDestinationMenuOpen(true)}
                      onChange={(e) => handleExploreDestinationSearch(e.target.value)}
                      role="combobox"
                      aria-expanded={exploreDestinationMenuOpen}
                      aria-controls="explore-destination-results"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                    />
                    {exploreDiscoveryLoading && (
                      <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-emerald-500 z-10" />
                    )}
                    {exploreDestinationMenuOpen && searchQuery.trim().length >= 1 && (
                      <div id="explore-destination-results" className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 shadow-2xl">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Cataloged Destination</p>
                        {exploreDropdownGroups.verified.length > 0 ? exploreDropdownGroups.verified.map(destination => (
                          <button
                            key={destination.destination_id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectExploreCataloged(destination)}
                            className="block w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-800 dark:text-slate-200 hover:bg-emerald-500/15"
                          >
                            ✓ {destination.city_name}{destination.region_name ? `, ${destination.region_name}` : ''}, {destination.country_name}
                          </button>
                        )) : (
                          <p className="px-2 py-1.5 text-[11px] text-slate-400">No cataloged database matches.</p>
                        )}

                        <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">External Destination</p>
                        {exploreDropdownGroups.external.length > 0 ? exploreDropdownGroups.external.map(place => (
                          <button
                            key={place.external_id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectExploreExternal(place)}
                            className="block w-full rounded-lg px-2.5 py-2 text-left text-xs text-amber-800 dark:text-amber-200 hover:bg-amber-500/15"
                          >
                            ✨ {place.full_name || (place.region_name ? `${place.city_name}, ${place.region_name}, ${place.country_name}` : `${place.city_name}, ${place.country_name}`)}
                          </button>
                        )) : exploreDiscoveryLoading ? (
                          <p className="px-2 py-1.5 text-[11px] text-slate-500">Searching external places worldwide…</p>
                        ) : exploreDiscoveryError ? (
                          <p className="px-2 py-1.5 text-[11px] text-amber-500 font-medium">⚠️ {exploreDiscoveryError}</p>
                        ) : (
                          <p className="px-2 py-1.5 text-[11px] text-slate-400">
                            {exploreDropdownGroups.verified.length === 0 && searchQuery.trim().length >= 2 ? 'No matching destinations found.' : 'No external place results.'}
                          </p>
                        )}
                      </div>
                    )}
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

                {/* Search Error / Not Found Feedback */}
                {searchError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{searchError}</span>
                    </div>
                    <button type="button" onClick={() => setSearchError('')} className="text-rose-500 hover:text-rose-400 font-bold ml-2">✕</button>
                  </div>
                )}

                {/* Dynamic Country Filter & Cataloged Destination Pills */}
                <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Browse Cataloged Destinations by Country:
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {filteredDestinations.length} Destinations
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {availableCountries.map(country => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => setSelectedCountry(country)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedCountry === country
                            ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-emerald-600 dark:border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {country === 'ALL' ? '🌍 All Countries' : country}
                      </button>
                    ))}
                  </div>

                  {/* Destination Pills for Selected Country */}
                  <div className="space-y-3 pt-1 max-h-52 overflow-y-auto pr-1">
                    {selectedCountry === 'India' && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Verified Database Destinations ({filteredDestinations.length})</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {filteredDestinations.map(item => (
                            <button key={item.destination_id} type="button" onClick={() => handleSelectDestination(item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedDestination?.destination_id === item.destination_id ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30 font-extrabold' : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                              ✓ {item.city_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedCountry !== 'India' && (
                      <div className="flex flex-wrap items-center gap-2">
                        {filteredDestinations.map(item => (
                          <button key={item.destination_id || item.city_name} type="button" onClick={() => handleSelectDestination(item)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedDestination?.city_name?.toLowerCase() === item.city_name?.toLowerCase() ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30 font-extrabold' : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
                            📍 {item.city_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Cost Index Details */}
            {selectedDestination && selectedDestination.cost_index && (
              <div className="space-y-6">
                {/* Rate Sync Success Notification */}
                {rateSyncMessage && (
                  <div className="p-3.5 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-300 flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{rateSyncMessage}</span>
                    </div>
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded">REAL-TIME ACCURACY</span>
                  </div>
                )}

                {/* Destination Hero Card */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                    {selectedDestination.image_url && (
                      <img
                        src={selectedDestination.image_url}
                        alt={selectedDestination.city_name}
                        className="w-full md:w-44 h-28 object-cover rounded-xl border border-slate-700/80 shadow-md shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          <MapPin className="w-6 h-6 text-emerald-400" />
                          {selectedDestination.city_name}, {selectedDestination.country_name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-mono text-emerald-300 border border-slate-700">
                          {selectedDestination.currency_code} ({selectedDestination.currency_symbol})
                        </span>
                        {selectedDestination.destination_id && (
                          <button
                            type="button"
                            onClick={() => handleSyncLiveFxRates(selectedDestination.destination_id)}
                            disabled={syncingRates}
                            className="px-2.5 py-0.5 rounded-full bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                            title="Fetch real-time foreign exchange rates from global currency API"
                          >
                            <RefreshCw className={`w-3 h-3 ${syncingRates ? 'animate-spin' : ''}`} />
                            {syncingRates ? 'Syncing FX...' : '⚡ Sync Live FX Rate'}
                          </button>
                        )}
                      </div>
                      {selectedDestination.is_preview && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-300 font-semibold">
                          <Sparkles className="w-3 h-3 text-violet-400" />
                          AI-Generated Overview • Supplementary Planning Reference
                        </div>
                      )}
                      <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                        {selectedDestination.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                        {selectedDestination.is_preview ? (
                          <span className="flex items-center gap-1 text-amber-400 font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            Unverified AI Estimate (Preview)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified Database Record
                          </span>
                        )}
                        <span>•</span>
                        <span className="font-mono text-slate-200">
                          1 {selectedDestination.currency_code} = ₹{selectedDestination.cost_index.exchange_rate_to_inr} INR
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">
                          {selectedDestination.is_preview ? 'Estimated Benchmark Source: ' : 'Source: '}{selectedDestination.cost_index.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedDestination.destination_id ? (
                    <button
                      onClick={() => {
                        handleContinueToTripEstimator(selectedDestination);
                      }}
                      disabled={dynamicEstimateLoading}
                      className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 w-full md:w-auto justify-center disabled:opacity-60"
                    >
                      {dynamicEstimateLoading ? 'Calculating Dynamic Budget…' : `Build Dynamic Budget for ${selectedDestination.city_name}`}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleContinueToTripEstimator(selectedDestination);
                      }}
                      disabled={dynamicEstimateLoading}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-teal-500 hover:from-amber-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 w-full md:w-auto justify-center disabled:opacity-60"
                    >
                      {dynamicEstimateLoading ? 'Calculating Route & Budget…' : 'Route & Estimate in Trip Builder'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
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

                {/* ========================================================================= */}
                {/* CURRENT COST OF LIVING BUDGET PROFILE FOR SELECTED PARTICULAR PLACE */}
                {/* ========================================================================= */}
                {costSummary && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-500/30 p-6 space-y-5 shadow-xl animate-fadeIn transition-colors duration-200">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 text-xs font-mono font-bold border border-teal-500/30">
                            {costSummary.is_preview ? 'AI ESTIMATE COST PROFILE' : 'CURRENT COST OF LIVING PROFILE'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            Score: {costSummary.cost_index_score}/100
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          Living Budget for {costSummary.city_name}, {costSummary.country_name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {costSummary.is_preview
                            ? 'Unverified planning estimates derived from an AI preview; not verified local prices.'
                            : 'Real-time synthesized cost of living estimates grounded in current housing, dining, and transit indexes.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          costSummary.cost_tier === 'VERY_EXPENSIVE'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40'
                            : costSummary.cost_tier === 'EXPENSIVE'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            : costSummary.cost_tier === 'MODERATE'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        }`}>
                          {costSummary.tier_label}
                        </span>
                      </div>
                    </div>

                    {/* Live Interactive Budget Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      {/* Controls Column (7 Cols) */}
                      <div className="md:col-span-7 space-y-4">
                        {/* Duration Presets */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>Select Stay Duration:</span>
                            <span className="text-teal-600 dark:text-teal-400 font-mono text-[11px]">
                              {costSummary.estimated_budgets[costDurationPreset]?.days} Days
                            </span>
                          </label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {[
                              { id: 'daily', label: '1 Day', icon: '☀️' },
                              { id: 'weekend', label: '3 Days', icon: '🏖️' },
                              { id: 'week', label: '1 Week', icon: '📅' },
                              { id: 'fortnight', label: '2 Weeks', icon: '✈️' },
                              { id: 'month', label: '1 Month', icon: '🏠' }
                            ].map(preset => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => setCostDurationPreset(preset.id)}
                                className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                                  costDurationPreset === preset.id
                                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 border-teal-600 dark:border-teal-400 shadow-md shadow-teal-500/20'
                                    : 'bg-slate-50 dark:bg-slate-950/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="text-sm">{preset.icon}</div>
                                <div className="text-[10px] truncate">{preset.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Travel Style Selector */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Select Living Comfort Tier:
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'budget', label: 'Budget Living', icon: '🎒', desc: 'Hostels & Local Food' },
                              { id: 'standard', label: 'Comfort Mid-Range', icon: '🏨', desc: '3-Star & Casual Dining' },
                              { id: 'luxury', label: 'Luxury Premium', icon: '👑', desc: '5-Star & Fine Dining' }
                            ].map(style => (
                              <button
                                key={style.id}
                                type="button"
                                onClick={() => setCostStylePreset(style.id)}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  costStylePreset === style.id
                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-white shadow-md'
                                    : 'bg-slate-50 dark:bg-slate-950/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <div className="text-base">{style.icon}</div>
                                <div className="font-bold text-xs mt-1 text-slate-900 dark:text-slate-200">{style.label}</div>
                                <div className="text-[9px] text-slate-500 dark:text-slate-400">{style.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Result Display Card (5 Cols) */}
                      <div className="md:col-span-5 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-teal-500/30 p-5 space-y-4 shadow-md dark:shadow-xl">
                        <div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
                            Total Estimated Cost of Living ({costSummary.estimated_budgets[costDurationPreset]?.label})
                          </div>
                          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                            ₹{costSummary.estimated_budgets[costDurationPreset]?.[`${costStylePreset}_inr`]?.toLocaleString() || 0}
                          </div>
                          {costSummary.currency_code !== 'INR' && (
                            <div className="text-xs text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                              ≈ {costSummary.currency_symbol}{costSummary.estimated_budgets[costDurationPreset]?.[`${costStylePreset}_local`]?.toLocaleString() || 0} {costSummary.currency_code}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-2">
                            <span>Daily Burn Rate:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              ₹{costSummary.daily_totals_inr[costStylePreset]?.toLocaleString() || 0} / day
                            </span>
                          </div>
                        </div>

                        {/* Transfer Button */}
                        {costSummary.is_preview ? (
                          <p className="w-full rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-center text-xs font-semibold text-amber-700 dark:text-amber-300">
                            Exploration only — trip saving requires a verified database destination.
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setBuilderDestinationId(costSummary.destination_id);
                              setDurationDays(costSummary.estimated_budgets[costDurationPreset]?.days || 5);
                              setTravelStyle(costStylePreset.toUpperCase());
                              setActiveTab('builder');
                            }}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-teal-500/20 transition-all"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Transfer to Interactive Trip Builder
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Monthly Expat & Long-Term Living Grid */}
                    <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          Monthly Living Costs in {costSummary.city_name} (Digital Nomad & Long-Term Living):
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Based on 30-day index</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">👤 Solo Expat / Nomad</span>
                          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                            ₹{costSummary.monthly_living.solo_monthly_inr.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {costSummary.currency_code !== 'INR' && `(${costSummary.currency_symbol}${Math.round(costSummary.monthly_living.solo_monthly_inr / costSummary.exchange_rate_to_inr).toLocaleString()})`}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">👫 Couple Living</span>
                          <div className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                            ₹{costSummary.monthly_living.couple_monthly_inr.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {costSummary.currency_code !== 'INR' && `(${costSummary.currency_symbol}${Math.round(costSummary.monthly_living.couple_monthly_inr / costSummary.exchange_rate_to_inr).toLocaleString()})`}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">👨‍👩‍👧‍👦 Family of 4 Living</span>
                          <div className="text-base font-bold text-violet-600 dark:text-violet-400 font-mono mt-0.5">
                            ₹{costSummary.monthly_living.family4_monthly_inr.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {costSummary.currency_code !== 'INR' && `(${costSummary.currency_symbol}${Math.round(costSummary.monthly_living.family4_monthly_inr / costSummary.exchange_rate_to_inr).toLocaleString()})`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Popular Attractions in this Destination with Include / Discard Toggles */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <Camera className="w-5 h-5 text-violet-400" />
                        Attractions for {selectedDestination.city_name} ({visibleAttractions.length} Places)
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
                    {visibleAttractions.map(attr => {
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
                              {selectedDestination.currency_code !== 'INR' && Number(attr.ticket_price_local) > 0 && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {selectedDestination.currency_symbol}{Number(attr.ticket_price_local).toLocaleString()} {selectedDestination.currency_code}
                                </div>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider inline-block mt-0.5 ${
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

                            {!selectedDestination.is_preview && !String(attr.attraction_id).startsWith('est_') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAttraction(attr.attraction_id, selectedDestination.destination_id)}
                                className="text-slate-500 hover:text-rose-400 text-[11px]"
                                title="Delete permanently from catalog"
                              >
                                🗑️
                              </button>
                            )}
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-400" />
                    World Travel Catalog ({destinations.length} Destinations Worldwide)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Explore authentic destinations across 6 continents. Click any city to load real-time cost indexes & attractions</p>
                </div>

                {/* Search Box in Catalog */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search world destinations..."
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Country Filter Chips */}
              <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3 max-h-28 overflow-y-auto">
                {availableCountries.map(country => {
                  const count = country === 'ALL'
                    ? destinations.length
                    : destinations.filter(d => d.country_name === country).length;
                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => setSelectedCountry(country)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        selectedCountry === country
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{country === 'ALL' ? '🌍 All Countries' : country}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-800/80 rounded font-mono text-slate-400">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Filtered Destinations Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                {destinations
                  .filter(d => {
                    const matchesCountry = selectedCountry === 'ALL' || d.country_name === selectedCountry;
                    const matchesSearch = !catalogSearchQuery.trim() ||
                      d.city_name?.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                      d.country_name?.toLowerCase().includes(catalogSearchQuery.toLowerCase());
                    return matchesCountry && matchesSearch;
                  })
                  .map(d => {
                    const isCurrent = selectedDestination?.destination_id === d.destination_id;
                    return (
                      <button
                        key={d.destination_id}
                        onClick={() => handleAnalyzeCity(d.city_name)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isCurrent
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/40'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="font-bold text-xs truncate text-slate-100 flex items-center justify-between">
                          <span>{d.city_name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-semibold">{d.currency_symbol}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{d.country_name}</div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                          <span className="text-teal-400 font-mono">
                            {d.attractions ? `${d.attractions.length} spots` : (d._count?.attractions ? `${d._count.attractions} spots` : 'spots')}
                          </span>
                          <span className="text-[9px] text-slate-500 uppercase font-mono">EXPLORE</span>
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

                    {/* 1. Unified searchable destination dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        Target Destination
                      </label>
                      <div className="relative">
                        <input
                          value={builderSearchQuery}
                          onFocus={() => setBuilderDestinationMenuOpen(true)}
                          onChange={(event) => handleBuilderDestinationSearch(event.target.value)}
                          placeholder="Search verified or worldwide destinations..."
                          role="combobox"
                          aria-expanded={builderDestinationMenuOpen}
                          aria-controls="mode1-destination-results"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        {builderDiscoveryLoading && <RefreshCw className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-400" />}
                        {builderDestinationMenuOpen && (
                          <div id="mode1-destination-results" className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
                            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">Cataloged Destination</p>
                            {builderDropdownGroups.verified.length > 0 ? builderDropdownGroups.verified.map(destination => (
                              <button key={destination.destination_id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelectDestination(destination)} className="block w-full rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-emerald-500/15">
                                ✓ {destination.city_name}{destination.region_name ? `, ${destination.region_name}` : ''}, {destination.country_name}
                              </button>
                            )) : <p className="px-2 py-1.5 text-[11px] text-slate-500">No cataloged database matches.</p>}
                            <div className="my-1 border-t border-slate-800" />
                            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">External Destination</p>
                            {builderDropdownGroups.external.length > 0 ? builderDropdownGroups.external.map(place => (
                              <button key={place.external_id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelectExternalDestination(place)} className="block w-full rounded-lg px-2.5 py-2 text-left text-xs text-amber-200 hover:bg-amber-500/15">
                                ✨ {place.full_name || (place.region_name ? `${place.city_name}, ${place.region_name}, ${place.country_name}` : `${place.city_name}, ${place.country_name}`)}
                              </button>
                            )) : builderDiscoveryError ? (
                              <p className="px-2 py-1.5 text-[11px] text-amber-300 font-medium">⚠️ {builderDiscoveryError}</p>
                            ) : (
                              <p className="px-2 py-1.5 text-[11px] text-slate-500">
                                {builderDropdownGroups.verified.length === 0 && builderSearchQuery.trim().length >= 2 ? 'No matching destinations found.' : builderSearchQuery.trim().length < 2 ? 'Type at least two characters to search Mapbox.' : builderDiscoveryLoading ? 'Searching external places…' : 'No external place results.'}
                              </p>
                            )}
                            {builderDiscoveryError && builderDropdownGroups.external.length > 0 && <p className="px-2 py-1.5 text-[11px] text-amber-300 font-medium">⚠️ {builderDiscoveryError}</p>}
                          </div>
                        )}
                      </div>
                      {selectedDestination?.is_external && <p className="text-[10px] text-amber-200">External Place — Not in Database. You can build a read-only partial route preview, but missing prices remain unavailable and this place cannot be saved as a trip.</p>}
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

                    {/* 5. Optional real-world inputs for the separate read-only estimate. */}
                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-300">Real-world estimate inputs</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">These do not alter the saved-trip calculation.</p>
                      </div>
                      <input
                        value={dynamicTripInputs.starting_point}
                        onChange={(event) => setDynamicTripInputs(prev => ({ ...prev, starting_point: event.target.value }))}
                        placeholder="Starting point for round-trip route (e.g., airport or city)"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2 text-[11px] text-slate-300">
                          <input type="checkbox" checked={dynamicTripInputs.overnight_stay} onChange={(event) => setDynamicTripInputs(prev => ({ ...prev, overnight_stay: event.target.checked, overnight_nights: event.target.checked ? Math.max(1, prev.overnight_nights) : 0 }))} />
                          Overnight stay
                        </label>
                        <label className="text-[10px] text-slate-400">Confirmed nights
                          <input type="number" min="0" max="59" disabled={!dynamicTripInputs.overnight_stay} value={dynamicTripInputs.overnight_nights} onChange={(event) => setDynamicTripInputs(prev => ({ ...prev, overnight_nights: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 disabled:opacity-40" />
                        </label>
                        <label className="text-[10px] text-slate-400">People per room
                          <select value={dynamicTripInputs.room_occupancy} onChange={(event) => setDynamicTripInputs(prev => ({ ...prev, room_occupancy: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100">
                            {[1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}
                          </select>
                        </label>
                        <label className="text-[10px] text-slate-400">Meals/person/day
                          <select value={dynamicTripInputs.meals_per_person_per_day} onChange={(event) => setDynamicTripInputs(prev => ({ ...prev, meals_per_person_per_day: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100">
                            {[0, 1, 2, 3, 4].map(value => <option key={value} value={value}>{value}</option>)}
                          </select>
                        </label>
                      </div>
                      <label className="block text-[10px] text-slate-400">Transport preference
                        <select value={dynamicTripInputs.transport_preference} onChange={(event) => setDynamicTripInputs(prev => ({ ...prev, transport_preference: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100">
                          <option value="PUBLIC">Public transport</option>
                          <option value="CAB">Cab</option>
                          <option value="MIXED">Mixed public transport and cab</option>
                          <option value="RENTAL">Rental vehicle</option>
                        </select>
                      </label>
                      {dynamicTripInputs.transport_preference === 'MIXED' && <label className="block text-[10px] text-slate-400">Cab share of route
                        <select value={dynamicTripInputs.cab_distance_share} onChange={(event) => setDynamicTripInputs(prev => ({ ...prev, cab_distance_share: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100">
                          <option value={0.25}>25%</option><option value={0.5}>50%</option><option value={0.75}>75%</option>
                        </select>
                      </label>}
                    </div>

                    {/* 6. Select Attractions / Places with Include & Discard Action Toggles */}
                    {selectedDestination && visibleAttractions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-violet-400" />
                            Tourist Spots ({selectedAttractionIds.length} of {visibleAttractions.length} Included)
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
                          {visibleAttractions.map(attr => {
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
                      disabled={savingTrip || !calculatedBudget || selectedDestination?.is_external}
                      title={selectedDestination?.is_external ? 'External destinations are read-only planning previews and cannot be saved to the database.' : ''}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      {savingTrip ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving Trip Itinerary...
                        </>
                      ) : selectedDestination?.is_external ? (
                        <>
                          <Compass className="w-4 h-4" />
                          External Preview (Read-Only)
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-4 h-4" />
                          Save Itinerary & Budget
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column: Calculated Dynamic Budget & What-If Visualizer (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  {calculatedBudget || dynamicEstimate || (selectedDestination?.is_external && selectedDestination?.coordinates) ? (
                    <>
                      {/* Deterministic Dynamic Budget & What-If Insights */}
                      {calculatedBudget && <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/30 p-6 shadow-xl relative overflow-hidden transition-colors duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs uppercase font-mono tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" />
                              Estimated Plan Cost • {durationDays} Days • {travelStyle}
                            </span>
                            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                              ₹{calculatedBudget.total_budget_inr.toLocaleString()}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Per Traveler: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300">₹{calculatedBudget.per_person_inr.toLocaleString()}</span> ({groupSize} people)
                            </p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-right shadow-sm">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">Calculation Model</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{calculatedBudget.is_external ? 'AI Planning Estimate' : 'Dynamic Trip Budget'}</div>
                            <div className={`text-[10px] font-mono ${calculatedBudget.is_external ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{calculatedBudget.is_external ? 'Unverified • Not in Database' : 'Database Stored Procedure'}</div>
                          </div>
                        </div>

                        {/* What-If Comparisons Bar */}
                        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                          <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">What-If Budget Style</div>
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-200 mt-0.5">
                              ₹{calculatedBudget.what_if_insights.budget_style_cost.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Save ₹{calculatedBudget.what_if_insights.budget_style_savings.toLocaleString()}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">What-If Luxury Style</div>
                            <div className="font-mono font-bold text-violet-700 dark:text-violet-300 mt-0.5">
                              ₹{calculatedBudget.what_if_insights.luxury_style_cost.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
                              +₹{calculatedBudget.what_if_insights.luxury_upgrade_cost.toLocaleString()}
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="text-slate-500 dark:text-slate-400 text-[10px]">What-If -1 Day</div>
                            <div className="font-mono font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                              -₹{calculatedBudget.what_if_insights.minus_one_day_savings.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                              Marginal Saving
                            </div>
                          </div>
                        </div>
                      </div>}

                      {/* Category Cost Allocation Breakdown */}
                      {calculatedBudget && <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-emerald-400" />
                            Category Cost Allocation Breakdown
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">BUDGET ALLOCATION</span>
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
                                  contentStyle={{
                                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                                    borderColor: isDark ? '#334155' : '#e2e8f0',
                                    color: isDark ? '#f8fafc' : '#0f172a',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                  }}
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
                      </div>}
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
                        style={{ color: '#f8fafc', backgroundColor: '#020617' }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-teal-500 transition-colors shadow-inner font-medium"
                      >
                        <option value="" style={{ backgroundColor: '#020617', color: '#f8fafc' }}>Select a verified database destination</option>
                        {availableCountries.filter(c => c !== 'ALL').map(country => {
                          const list = destinations.filter(d => d.country_name === country);
                          if (!list || list.length === 0) return null;
                          return (
                            <optgroup key={country} label={`${country} (${list.length})`} style={{ backgroundColor: '#0f172a', color: '#38bdf8' }}>
                              {list.map(d => (
                                <option key={d.destination_id} value={d.destination_id} style={{ backgroundColor: '#020617', color: '#f8fafc' }}>
                                  {d.city_name}, {d.country_name} ({d.currency_code} {d.currency_symbol})
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
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
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-500/30 p-6 shadow-xl space-y-4 transition-colors duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-xs uppercase font-mono tracking-wider text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Reverse Optimization Result • Budget Fit
                            </span>
                            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                              ₹{optimizedPlanResult.total_planned_budget_inr.toLocaleString()}
                              <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                                of ₹{optimizedPlanResult.input_budget_inr.toLocaleString()} wallet cap
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold text-xs border border-teal-500/30">
                                Recommended Tier: {optimizedPlanResult.recommended_travel_style}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold text-xs border border-sky-500/30">
                                Affordable Stay: {optimizedPlanResult.recommended_days} Days
                              </span>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-right shadow-sm">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">Unused Surplus</div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{optimizedPlanResult.remaining_surplus_inr.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">Extra Cushion</div>
                          </div>
                        </div>

                        {/* Advisory Notes Box */}
                        {optimizedPlanResult.advisory_notes && optimizedPlanResult.advisory_notes.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-teal-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                            {optimizedPlanResult.advisory_notes.map((note, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
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
                        Budget Threshold Alert: {alert.alert_type}
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
                    <p className="text-xs text-slate-400">Automatically recalculates category spending and monitors budget limits</p>
                  </div>

                  <form onSubmit={handleLogExpense} className="space-y-3.5 text-xs">
                    {/* Select Trip */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Active Trip</label>
                      <select
                        value={activeTrip?.trip_id || ''}
                        onChange={(e) => selectTripForDetails(Number(e.target.value))}
                        style={{ color: '#f8fafc', backgroundColor: '#020617' }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium shadow-inner"
                      >
                        {trips.map(t => (
                          <option key={t.trip_id} value={t.trip_id} style={{ backgroundColor: '#020617', color: '#f8fafc' }}>
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
                        style={{ color: '#f8fafc', backgroundColor: '#020617' }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Budget Category</label>
                      <select
                        value={expenseForm.category_id}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, category_id: e.target.value }))}
                        style={{ color: '#f8fafc', backgroundColor: '#020617' }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium shadow-inner"
                      >
                        {categories.map(c => (
                          <option key={c.category_id} value={c.category_id} style={{ backgroundColor: '#020617', color: '#f8fafc' }}>
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
                        style={{ color: '#f8fafc', backgroundColor: '#020617' }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
                        required
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1">
                      <label className="text-slate-300 font-semibold">Payment Method</label>
                      <select
                        value={expenseForm.payment_method}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, payment_method: e.target.value }))}
                        style={{ color: '#f8fafc', backgroundColor: '#020617' }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium shadow-inner"
                      >
                        <option value="CARD" style={{ backgroundColor: '#020617', color: '#f8fafc' }}>Credit / Debit Card</option>
                        <option value="UPI" style={{ backgroundColor: '#020617', color: '#f8fafc' }}>UPI / Digital Wallet</option>
                        <option value="CASH" style={{ backgroundColor: '#020617', color: '#f8fafc' }}>Local Cash</option>
                        <option value="FOREX" style={{ backgroundColor: '#020617', color: '#f8fafc' }}>Forex Travel Card</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={expenseLogging || !activeTrip}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all shadow-lg"
                    >
                      {expenseLogging ? 'Logging Expense...' : 'Record Expense & Check Budget'}
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
          user?.role === 'ADMIN' ? (
            <div className="space-y-6 animate-fadeIn">
            {/* System Health Overview Cards */}
            {systemHealth && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Database Status</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    CONNECTED
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Latency: {systemHealth.database?.latency_ms}ms
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">System Tables</div>
                  <div className="text-lg font-bold text-sky-400 mt-1 font-mono">
                    {systemHealth.database?.tables_count} Tables
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Data Catalog</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Trips Stored</div>
                  <div className="text-lg font-bold text-violet-400 mt-1 font-mono">
                    {systemHealth.database?.total_trips} Trips
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Active Itineraries</div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Budget Alerts</div>
                  <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
                    {systemHealth.database?.total_alerts} Alerts
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Automated Monitoring</div>
                </div>
              </div>
            )}

            {/* Security Audit Logs Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Security & Activity Audit Logs
                  </h3>
                  <p className="text-xs text-slate-400">Immutable ledger of user activity, authentication events, and administrative actions</p>
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
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-rose-500/30 shadow-sm space-y-3">
              <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">Access Restricted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Administrator privileges required. Regular users cannot access administrative controls or audit logs.
              </p>
              <button
                onClick={() => setActiveTab('ai_explorer')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                Return to AI Cost Explorer
              </button>
            </div>
          )
        )}

        {/* ========================================================================= */}
        {/* TAB 6: TRAVELER AI COPILOT CHATBOT STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'chatbot' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header banner */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-emerald-500/20 shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors duration-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/25">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Traveler AI Copilot Studio</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono">
                      WanderBot v2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live interactive travel assistant powered by curated travel insights & Google Gemini AI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Engine: {apiStatus?.gemini_configured ? 'Google Gemini 1.5 Flash' : 'Travel Knowledge Engine'}
                </span>
                <button
                  onClick={() => setChatMessages([])}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Chat
                </button>
              </div>
            </div>

            {/* Studio 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left sidebar: Context & Presets (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                {/* Active Destination Context Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Active Context
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {selectedDestination?.currency_code || 'INR'}
                    </span>
                  </div>
                  <select
                    value={selectedDestination?.destination_id || ''}
                    onChange={(e) => {
                      const d = destinations.find(x => x.destination_id === parseInt(e.target.value));
                      if (d) setSelectedDestination(d);
                    }}
                    style={{ color: '#f8fafc', backgroundColor: '#020617' }}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium shadow-inner"
                  >
                    {destinations.map(d => (
                      <option key={d.destination_id} value={d.destination_id} style={{ backgroundColor: '#020617', color: '#f8fafc' }}>
                        {d.city_name}, {d.country_name}
                      </option>
                    ))}
                  </select>

                  {selectedDestination && (
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Daily Standard Hotel:</span>
                        <span className="text-slate-200 font-mono font-medium">
                          ₹{Math.round(Number(selectedDestination.cost_index?.accommodation_standard_night) * Number(selectedDestination.cost_index?.exchange_rate_to_inr || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Daily Meals (3x):</span>
                        <span className="text-slate-200 font-mono font-medium">
                          ₹{Math.round(Number(selectedDestination.cost_index?.meal_standard_day) * Number(selectedDestination.cost_index?.exchange_rate_to_inr || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Attractions in DB:</span>
                        <span className="text-emerald-400 font-mono font-medium">
                          {selectedDestination.attractions?.length || 0} Verified
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Travel Questions Library */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    Prompt Library
                  </span>
                  <div className="space-y-1.5">
                    {[
                      selectedDestination ? `What is a 5-day budget for ${selectedDestination.city_name}?` : "What is a 5-day budget for Paris?",
                      selectedDestination ? `Top free attractions in ${selectedDestination.city_name}?` : "Top free attractions in Rome?",
                      "Compare Tokyo vs Zurich daily costs",
                      "Give me budget tips for traveling in Bali",
                      "What is the 4-day budget for Tirupati?"
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChatMessage(p)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-950/50 hover:bg-emerald-950/20 border border-slate-800 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-emerald-300 transition-all flex items-center justify-between group"
                      >
                        <span className="line-clamp-1">{p}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors ml-2 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Transfer to Builder CTA */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/30 text-xs space-y-2 shadow-sm">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    Interactive Trip Builder Link
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Satisfied with the AI Copilot recommendations? Transfer directly into Tab 2 to dynamically select attractions and generate an itemized trip budget.
                  </p>
                  <button
                    onClick={() => {
                      if (selectedDestination) {
                        setBuilderDestinationId(selectedDestination.destination_id);
                      }
                      setActiveTab('builder');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    Load into Trip Builder
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right pane: Chat Studio Window (8 cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
                {/* Chat Studio Top Bar */}
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">WanderBot Assistant</div>
                      <div className="text-[10px] text-slate-400">Context: {selectedDestination?.city_name || 'Global'}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {chatMessages.length} Messages
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 text-xs ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-br-none shadow-md shadow-emerald-900/20'
                            : 'bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-bl-none shadow-md'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          renderFormattedMessage(msg.text)
                        )}
                        <div className={`mt-2 text-[10px] flex items-center gap-2 ${msg.role === 'user' ? 'text-emerald-200 justify-end' : 'text-slate-500'}`}>
                          <span>{msg.timestamp}</span>
                          {msg.engine && (
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                              {msg.engine === 'GOOGLE_GEMINI_1_5_FLASH' ? 'Gemini AI' : 'Travel Guide'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {chatLoading && (
                    <div className="flex gap-3 items-center text-xs text-slate-400">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 rounded-bl-none flex items-center gap-2">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono ml-2">WanderBot is calculating travel economics...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Prompt Chips */}
                {chatSuggestedPrompts.length > 0 && (
                  <div className="px-5 py-2.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 font-semibold">
                      Suggestions:
                    </span>
                    {chatSuggestedPrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendChatMessage(prompt)}
                        className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700/60 hover:border-emerald-500/40 text-[11px] text-slate-300 hover:text-emerald-300 transition-colors shrink-0"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Chat Studio Input Form */}
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                  className="p-4 border-t border-slate-800 bg-slate-950/90 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={selectedDestination ? `Ask WanderBot about ${selectedDestination.city_name}, or any destination worldwide...` : "Ask WanderBot about destinations worldwide, budgets, itineraries, or comparisons..."}
                    disabled={chatLoading}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 px-6 py-4 mt-auto text-xs text-slate-500 dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-200">
        <div>
          WanderBudget AI • <span className="text-slate-700 dark:text-slate-300 font-medium">Dynamic Trip Budget Builder & Live Cost Analyzer</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Intelligent Travel Planning</span>
          <span>•</span>
          <span>Real-Time Currency Engine</span>
          <span>•</span>
          <span>Smart Budget Alerts</span>
        </div>
      </footer>

      {/* 5. API KEYS & AI ENGINE CONFIGURATION MODAL */}
      {showApiModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">AI Search Engine & API Integrations</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure real-time web research & external data providers</p>
                </div>
              </div>
              <button
                onClick={() => { setShowApiModal(false); setKeySaveMessage(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Provider 1: Google Gemini */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Google Gemini Generative AI</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  apiStatus?.gemini_configured
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {apiStatus?.gemini_configured ? '🟢 Active & Connected' : '⚪ Fallback Heuristic Active'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Powers real-time generative analysis for <strong className="text-slate-800 dark:text-slate-300">any obscure town or village worldwide</strong>. Discovers authentic tourist attractions, local transport fares, food costs, and currency benchmarks dynamically.
              </p>

              {apiStatus?.gemini_configured && (
                <div className="text-xs text-emerald-700 dark:text-emerald-400/90 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-2.5">
                  Provider configuration is active. API key material is never displayed in the browser.
                </div>
              )}

              <form onSubmit={handleSaveGeminiKey} className="space-y-2 pt-1">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium block">
                  {apiStatus?.gemini_configured ? 'Update Gemini API Key:' : 'Enter Google Gemini API Key:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={savingKey || !geminiKeyInput}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white dark:text-slate-950 font-semibold rounded-lg text-xs transition-all shadow-md shadow-emerald-600/20"
                  >
                    {savingKey ? 'Saving...' : 'Connect'}
                  </button>
                </div>
                {keySaveMessage && (
                  <p className={`text-xs ${keySaveMessage.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {keySaveMessage.text}
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Tip: Obtain a free Gemini API key from <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 underline hover:text-teal-500">Google AI Studio</a>.
                </p>
              </form>
            </div>

            {/* Provider 2: Foreign Exchange Rates */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Live Foreign Exchange (FX) Feed</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time open currency rates API with 1-hr TTL cache</p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 font-mono">
                🟢 Live Active
              </span>
            </div>

            {/* Provider 3: Custom Datasets (CSV / JSON) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Custom Datasets (CSV / JSON)</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Have a specialized travel cost or attraction dataset (e.g. Numbeo or Wikivoyage)? Drop the file into the project directory and WanderBudget will automatically ingest and index it.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowApiModal(false); setKeySaveMessage(null); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5b. GOOGLE OAUTH & ACADEMIC ROLE SWITCHER MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200 text-slate-900 dark:text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Account & Authentication</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage your profile, Google account connection, and session security</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAuthModal(false); setAuthNotification(null); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Notification alert */}
            {authNotification && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                authNotification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
              }`}>
                {authNotification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{authNotification.text}</span>
              </div>
            )}

            {/* 1. Primary Google OAuth Sign-In Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GoogleLogoSvg className="w-4 h-4" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Sign In with Google</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Verified Identity
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect your Google Account to sign in seamlessly with one click.
              </p>

              {/* Official Google GSI Render Button */}
              <div className="flex flex-col items-center justify-center py-2 min-h-[50px]">
                <div id="google-modal-btn-official" />
                {authLoading && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 animate-pulse mt-2">Verifying Google ID token with backend...</p>
                )}
              </div>
            </div>

            {/* Active Session Info */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Active:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.full_name}</span>
                <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {user?.oauth_provider || 'LOCAL'}
                </span>
              </div>
              <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] ${
                user?.role === 'ADMIN'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              }`}>
                {user?.role === 'ADMIN' ? 'Admin' : 'User'}
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowAuthModal(false); setAuthNotification(null); }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FLOATING TRAVELER AI COPILOT LAUNCHER & DRAWER */}
      {!showChatDrawer && activeTab !== 'chatbot' && (
        <button
          onClick={() => setShowChatDrawer(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-3 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center gap-2.5 font-bold text-xs transition-all hover:scale-105 active:scale-95 border border-emerald-300/40 group"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
          </div>
          <span className="tracking-wide">Ask Traveler AI</span>
          <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-full font-mono">
            Copilot
          </span>
        </button>
      )}

      {showChatDrawer && activeTab !== 'chatbot' && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[560px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200 text-slate-900 dark:text-slate-100">
          {/* Drawer Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  WanderBot Copilot
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    AI Copilot
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Context: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{selectedDestination?.city_name || 'Global'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowChatDrawer(false); setActiveTab('chatbot'); }}
                title="Expand to Full Studio Tab"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowChatDrawer(false)}
                title="Minimize Chat"
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Drawer Message Stream */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-900/60 text-xs">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderFormattedMessage(msg.text)
                  )}
                  <div className={`mt-1.5 text-[9px] flex items-center gap-1.5 ${msg.role === 'user' ? 'text-emerald-100 justify-end' : 'text-slate-500'}`}>
                    <span>{msg.timestamp}</span>
                    {msg.engine && (
                      <span className="font-mono text-[8px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400">
                        {msg.engine === 'GOOGLE_GEMINI_1_5_FLASH' ? 'Gemini' : 'Guide'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 rounded-bl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono ml-1.5">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions in drawer */}
          {chatSuggestedPrompts.length > 0 && (
            <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800/60 bg-slate-100 dark:bg-slate-950/50 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              {chatSuggestedPrompts.slice(0, 3).map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendChatMessage(prompt)}
                  className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors shrink-0 line-clamp-1 max-w-[180px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Drawer Input Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
            className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-1.5"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about costs, destinations worldwide, Paris..."
              disabled={chatLoading}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
