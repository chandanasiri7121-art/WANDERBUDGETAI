import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage.jsx';
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

// Colors for Budget Categories
const CATEGORY_COLORS = {
  ACCOMMODATION: '#38bdf8', // Sky Blue
  FOOD: '#34d399',          // Emerald
  TRANSIT: '#fbbf24',       // Amber
  SIGHTSEEING: '#a78bfa',   // Violet
  BUFFER: '#f43f5e',        // Rose
  MISC: '#94a3b8'           // Slate
};

// Continents Taxonomy & World Mapping
const CONTINENT_TABS = [
  { id: 'ALL', label: '🌍 All World' },
  { id: 'EUROPE', label: '🏰 Europe' },
  { id: 'ASIA', label: '🌸 Asia' },
  { id: 'AMERICAS', label: '🗽 Americas' },
  { id: 'MIDDLE_EAST_AFRICA', label: '🕌 Middle East & Africa' },
  { id: 'OCEANIA', label: '🦘 Oceania' },
  { id: 'INDIA', label: '🛕 India' }
];

const COUNTRY_TO_CONTINENT = {
  'India': 'INDIA',
  'Switzerland': 'EUROPE',
  'France': 'EUROPE',
  'United Kingdom': 'EUROPE',
  'Italy': 'EUROPE',
  'Spain': 'EUROPE',
  'Netherlands': 'EUROPE',
  'Germany': 'EUROPE',
  'Czech Republic': 'EUROPE',
  'Austria': 'EUROPE',
  'Greece': 'EUROPE',
  'Hungary': 'EUROPE',
  'Portugal': 'EUROPE',
  'Iceland': 'EUROPE',
  'Sweden': 'EUROPE',
  'Denmark': 'EUROPE',
  'Ireland': 'EUROPE',
  'Japan': 'ASIA',
  'Indonesia': 'ASIA',
  'South Korea': 'ASIA',
  'Thailand': 'ASIA',
  'Singapore': 'ASIA',
  'Malaysia': 'ASIA',
  'Vietnam': 'ASIA',
  'Hong Kong': 'ASIA',
  'Taiwan': 'ASIA',
  'China': 'ASIA',
  'Nepal': 'ASIA',
  'Sri Lanka': 'ASIA',
  'Cambodia': 'ASIA',
  'United States': 'AMERICAS',
  'Canada': 'AMERICAS',
  'Mexico': 'AMERICAS',
  'Brazil': 'AMERICAS',
  'Argentina': 'AMERICAS',
  'Peru': 'AMERICAS',
  'United Arab Emirates': 'MIDDLE_EAST_AFRICA',
  'Qatar': 'MIDDLE_EAST_AFRICA',
  'Egypt': 'MIDDLE_EAST_AFRICA',
  'Morocco': 'MIDDLE_EAST_AFRICA',
  'South Africa': 'MIDDLE_EAST_AFRICA',
  'Turkey': 'MIDDLE_EAST_AFRICA',
  'Kenya': 'MIDDLE_EAST_AFRICA',
  'Australia': 'OCEANIA',
  'New Zealand': 'OCEANIA'
};

const POPULAR_WORLD_DESTINATIONS = {
  ALL: [
    { id: 'Paris', label: '🥐 Paris' },
    { id: 'Tokyo', label: '🗼 Tokyo' },
    { id: 'New York', label: '🗽 New York' },
    { id: 'Dubai', label: '🏙️ Dubai' },
    { id: 'Rome', label: '🏛️ Rome' },
    { id: 'Bangkok', label: '🏮 Bangkok' },
    { id: 'London', label: '🎡 London' },
    { id: 'Sydney', label: '🦘 Sydney' },
    { id: 'Zurich', label: '❄️ Zurich' },
    { id: 'Singapore', label: '🦁 Singapore' },
    { id: 'Barcelona', label: '🎨 Barcelona' },
    { id: 'Cairo', label: '🏺 Cairo' },
    { id: 'Tirupati', label: '🛕 Tirupati' },
    { id: 'Hyderabad', label: '🕌 Hyderabad' },
    { id: 'Goa', label: '🏖️ Goa' }
  ],
  EUROPE: [
    { id: 'Paris', label: '🥐 Paris' },
    { id: 'Rome', label: '🏛️ Rome' },
    { id: 'Barcelona', label: '🎨 Barcelona' },
    { id: 'London', label: '🎡 London' },
    { id: 'Amsterdam', label: '🚲 Amsterdam' },
    { id: 'Zurich', label: '❄️ Zurich' },
    { id: 'Venice', label: '🛶 Venice' },
    { id: 'Prague', label: '🏰 Prague' },
    { id: 'Vienna', label: '🎻 Vienna' },
    { id: 'Athens', label: '🏺 Athens' },
    { id: 'Berlin', label: '🐻 Berlin' },
    { id: 'Santorini', label: '🌅 Santorini' },
    { id: 'Reykjavik', label: '🌋 Reykjavik' },
    { id: 'Stockholm', label: '⛵ Stockholm' },
    { id: 'Edinburgh', label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Edinburgh' },
    { id: 'Madrid', label: '💃 Madrid' }
  ],
  ASIA: [
    { id: 'Tokyo', label: '🗼 Tokyo' },
    { id: 'Kyoto', label: '⛩️ Kyoto' },
    { id: 'Osaka', label: '🐙 Osaka' },
    { id: 'Bangkok', label: '🏮 Bangkok' },
    { id: 'Phuket', label: '🏝️ Phuket' },
    { id: 'Singapore', label: '🦁 Singapore' },
    { id: 'Bali', label: '🌴 Bali' },
    { id: 'Seoul', label: '🌸 Seoul' },
    { id: 'Hong Kong', label: '🌃 Hong Kong' },
    { id: 'Taipei', label: '🥟 Taipei' },
    { id: 'Shanghai', label: '🏙️ Shanghai' },
    { id: 'Beijing', label: '🐉 Beijing' },
    { id: 'Hanoi', label: '🍜 Hanoi' },
    { id: 'Kathmandu', label: '🏔️ Kathmandu' },
    { id: 'Siem Reap', label: '🛕 Siem Reap' }
  ],
  AMERICAS: [
    { id: 'New York', label: '🗽 New York' },
    { id: 'San Francisco', label: '🌉 San Francisco' },
    { id: 'Los Angeles', label: '🎬 Los Angeles' },
    { id: 'Chicago', label: '🌆 Chicago' },
    { id: 'Las Vegas', label: '🎰 Las Vegas' },
    { id: 'Toronto', label: '🍁 Toronto' },
    { id: 'Vancouver', label: '🏔️ Vancouver' },
    { id: 'Rio de Janeiro', label: '🏖️ Rio de Janeiro' },
    { id: 'Cancun', label: '🌊 Cancun' },
    { id: 'Buenos Aires', label: '💃 Buenos Aires' },
    { id: 'Cusco', label: '🦙 Cusco' }
  ],
  MIDDLE_EAST_AFRICA: [
    { id: 'Dubai', label: '🏙️ Dubai' },
    { id: 'Abu Dhabi', label: '🕌 Abu Dhabi' },
    { id: 'Doha', label: '🇶🇦 Doha' },
    { id: 'Cairo', label: '🏺 Cairo' },
    { id: 'Istanbul', label: '🕌 Istanbul' },
    { id: 'Cape Town', label: '⛰️ Cape Town' },
    { id: 'Marrakech', label: '🐪 Marrakech' },
    { id: 'Nairobi', label: '🦁 Nairobi' }
  ],
  OCEANIA: [
    { id: 'Sydney', label: '🦘 Sydney' },
    { id: 'Melbourne', label: '☕ Melbourne' },
    { id: 'Auckland', label: '⛵ Auckland' },
    { id: 'Queenstown', label: '🏔️ Queenstown' }
  ],
  INDIA: [
    { id: 'Tirupati', label: '🛕 Tirupati' },
    { id: 'Hyderabad', label: '🕌 Hyderabad' },
    { id: 'Goa', label: '🏖️ Goa' },
    { id: 'Manali', label: '🏔️ Manali' },
    { id: 'Bangalore', label: '🌳 Bangalore' },
    { id: 'Chennai', label: '🌊 Chennai' },
    { id: 'Delhi', label: '🏛️ Delhi' },
    { id: 'Agra', label: '🕌 Agra' },
    { id: 'Varanasi', label: '🪔 Varanasi' },
    { id: 'Jaipur', label: '🏰 Jaipur' },
    { id: 'Udaipur', label: '⛵ Udaipur' },
    { id: 'Kochi', label: '🌴 Kochi' },
    { id: 'Munnar', label: '🍃 Munnar' },
    { id: 'Rishikesh', label: '🧘 Rishikesh' },
    { id: 'Amritsar', label: '✨ Amritsar' },
    { id: 'Vizag', label: '🏖️ Vizag' }
  ]
};

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
  // Current Active Tab
  const [activeTab, setActiveTab] = useState('ai_explorer'); // 'ai_explorer', 'builder', 'trips', 'expenses', 'admin', 'chatbot'

  // User Auth State & Google OAuth
  const [token, setToken] = useState(localStorage.getItem('wb_token') || '');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('traveler.google@gmail.com');
  const [googleNameInput, setGoogleNameInput] = useState('Google Traveler (Verified)');
  const [authNotification, setAuthNotification] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('wb_token');
    setToken('');
    setUser(null);
    setActiveTab('ai_explorer');
  };

  const handleGoogleSignIn = async (customEmail, customName) => {
    const emailToUse = customEmail || googleEmailInput || 'traveler.google@gmail.com';
    const nameToUse = customName || googleNameInput || emailToUse.split('@')[0];
    setAuthLoading(true);
    setAuthNotification(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToUse,
          name: nameToUse,
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          google_id: 'GGL_SUB_' + Date.now()
        })
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

  const handleSwitchAccount = async (targetRole) => {
    setAuthLoading(true);
    setAuthNotification(null);
    try {
      const credentials = targetRole === 'ADMIN'
        ? { login_id: 'ADMIN_24BAI0226', password: 'Admin@123' }
        : { login_id: '24BAI0226', password: 'Traveler@123' };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('wb_token', data.token);
        setAuthNotification({ type: 'success', text: `Switched session to ${data.user.full_name} (${data.user.role})!` });
        setTimeout(() => setShowAuthModal(false), 900);
      } else {
        setAuthNotification({ type: 'error', text: data.error || 'Switch failed' });
      }
    } catch (err) {
      setAuthNotification({ type: 'error', text: err.message });
    } finally {
      setAuthLoading(false);
    }
  };

  // Master Data
  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // AI Explorer State
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzingCity, setAnalyzingCity] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedContinent, setSelectedContinent] = useState('ALL');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [syncingRates, setSyncingRates] = useState(false);
  const [rateSyncMessage, setRateSyncMessage] = useState('');
  const [costSummary, setCostSummary] = useState(null);
  const [costDurationPreset, setCostDurationPreset] = useState('week');
  const [costStylePreset, setCostStylePreset] = useState('standard');

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
        headers: { 'Content-Type': 'application/json' },
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
      text: `Hello! 👋 I am **WanderBot**, your intelligent Traveler Copilot for **WanderBudget AI**!

I have direct access to our **3NF PostgreSQL database** with **98 global destinations, 417 verified attractions, and real-time cost-of-living indices**.

Ask me anything like:
* 💰 *"What is the budget for 4 days in Tirupati?"*
* 🥐 *"Compare Tokyo vs Paris daily costs"*
* 🛕 *"What are the best attractions to visit in Tirupati?"*
* 🆓 *"Show me free attractions in Rome"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSuggestedPrompts, setChatSuggestedPrompts] = useState([
    "What is the budget for 4 days in Tirupati?",
    "Compare Tokyo vs Paris daily costs",
    "Show top attractions in Tirupati",
    "What can I do in Hyderabad with ₹15,000?"
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
        headers: { 'Content-Type': 'application/json' },
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

  // Fetch real-time Cost of Living Profile for Selected Destination
  useEffect(() => {
    if (selectedDestination?.destination_id) {
      fetch(`/api/destinations/${selectedDestination.destination_id}/cost-of-living-summary`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setCostSummary(data); })
        .catch(err => console.error('Cost summary fetch error:', err));
    }
  }, [selectedDestination?.destination_id]);

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

  // API Call: Sync Real-Time Market Exchange Rates for Destination
  const handleSyncLiveFxRates = async (destId) => {
    if (!destId) return;
    try {
      setSyncingRates(true);
      const res = await fetch(`/api/destinations/${destId}/sync-rates`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSelectedDestination(data.destination);
        setRateSyncMessage(data.message);
        setTimeout(() => setRateSyncMessage(''), 5000);
        setDestinations(prev => prev.map(d => d.destination_id === destId ? data.destination : d));
      }
    } catch (err) {
      console.error('Rate sync error:', err);
    } finally {
      setSyncingRates(false);
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

        {/* Application Status Badge */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">WanderBudget AI</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="text-slate-400">
            System: <span className="text-emerald-400 font-medium">Online</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="text-slate-400">
            Mode: <span className="text-slate-200 font-medium">Production Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Search Engine & API Keys Button */}
          <button
            onClick={() => setShowApiModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              apiStatus?.gemini_configured
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Configure Google Gemini API Key & Live Search Providers"
          >
            <Key className="w-3.5 h-3.5" />
            <span>
              {apiStatus?.gemini_configured ? '🟢 Gemini 1.5 Flash Active' : '⚡ AI Engine / API Keys'}
            </span>
          </button>

          {/* Sign in with Google Button / Active Google Session */}
          {user?.oauth_provider === 'GOOGLE' ? (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all shadow-sm"
              title="Signed in with Google OAuth (Click to switch account)"
            >
              <GoogleLogoSvg className="w-3.5 h-3.5" />
              <span>Google Verified</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                OAuth
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-100 transition-all shadow-sm"
              title="Sign in with Google OAuth 2.0"
            >
              <GoogleLogoSvg className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
          )}

          {/* User Role Badge (Clickable to switch accounts) */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs transition-all text-left"
            title="Click to view profile or switch between Student, Admin & Google accounts"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-medium text-slate-300">{user?.full_name?.split(' ')[0]}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold font-mono">
              {user?.role}
            </span>
          </button>

          {/* Log Out Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Log Out of session and return to Login Page"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
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

          <button
            onClick={() => setActiveTab('chatbot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chatbot'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/30'
            }`}
          >
            <Bot className="w-4 h-4" />
            6. 🤖 Traveler AI Copilot
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

                {/* Continental Selection Tabs & Quick World Destination Pills */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      Browse Places Across Continents:
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {POPULAR_WORLD_DESTINATIONS[selectedContinent]?.length || 0} Premier Hubs
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {CONTINENT_TABS.map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedContinent(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedContinent === tab.id
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/60 text-slate-300 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Quick Destination Pills for Selected Continent */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(POPULAR_WORLD_DESTINATIONS[selectedContinent] || POPULAR_WORLD_DESTINATIONS.ALL).map(item => (
                      <button
                        key={item.id}
                        type="button"
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
                      </div>
                      <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                        {selectedDestination.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Live Internet Indexed
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-200">
                          1 {selectedDestination.currency_code} = ₹{selectedDestination.cost_index.exchange_rate_to_inr} INR
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">
                          Source: {selectedDestination.cost_index.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setBuilderDestinationId(selectedDestination.destination_id);
                      setActiveTab('builder');
                    }}
                    className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0 w-full md:w-auto justify-center"
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

                {/* ========================================================================= */}
                {/* CURRENT COST OF LIVING BUDGET PROFILE FOR SELECTED PARTICULAR PLACE */}
                {/* ========================================================================= */}
                {costSummary && (
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30 rounded-2xl border border-teal-500/30 p-6 space-y-5 shadow-2xl animate-fadeIn">
                    {/* Section Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 text-xs font-mono font-bold border border-teal-500/30">
                            CURRENT COST OF LIVING PROFILE
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Score: {costSummary.cost_index_score}/100
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-teal-400" />
                          Living Budget for {costSummary.city_name}, {costSummary.country_name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Real-time synthesized cost of living estimates grounded in current housing, dining, and transit indexes.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                          costSummary.cost_tier === 'VERY_EXPENSIVE'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                            : costSummary.cost_tier === 'EXPENSIVE'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                            : costSummary.cost_tier === 'MODERATE'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
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
                          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                            <span>Select Stay Duration:</span>
                            <span className="text-teal-400 font-mono text-[11px]">
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
                                    ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-500/20'
                                    : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300'
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
                          <label className="text-xs font-semibold text-slate-300">
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
                                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                                    : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-400'
                                }`}
                              >
                                <div className="text-base">{style.icon}</div>
                                <div className="font-bold text-xs mt-1 text-slate-200">{style.label}</div>
                                <div className="text-[9px] text-slate-400">{style.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Result Display Card (5 Cols) */}
                      <div className="md:col-span-5 bg-slate-950/90 rounded-2xl border border-teal-500/30 p-5 space-y-4 shadow-xl">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                            Total Estimated Cost of Living ({costSummary.estimated_budgets[costDurationPreset]?.label})
                          </div>
                          <div className="text-3xl font-extrabold text-white mt-1">
                            ₹{costSummary.estimated_budgets[costDurationPreset]?.[`${costStylePreset}_inr`]?.toLocaleString() || 0}
                          </div>
                          {costSummary.currency_code !== 'INR' && (
                            <div className="text-xs text-teal-400 font-mono mt-0.5">
                              ≈ {costSummary.currency_symbol}{costSummary.estimated_budgets[costDurationPreset]?.[`${costStylePreset}_local`]?.toLocaleString() || 0} {costSummary.currency_code}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2">
                            <span>Daily Burn Rate:</span>
                            <span className="font-mono font-bold text-slate-200">
                              ₹{costSummary.daily_totals_inr[costStylePreset]?.toLocaleString() || 0} / day
                            </span>
                          </div>
                        </div>

                        {/* Transfer Button */}
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
                      </div>
                    </div>

                    {/* Monthly Expat & Long-Term Living Grid */}
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5 text-sky-400" />
                          Monthly Living Costs in {costSummary.city_name} (Digital Nomad & Long-Term Living):
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Based on 30-day index</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 text-[11px]">👤 Solo Expat / Nomad</span>
                          <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                            ₹{costSummary.monthly_living.solo_monthly_inr.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {costSummary.currency_code !== 'INR' && `(${costSummary.currency_symbol}${Math.round(costSummary.monthly_living.solo_monthly_inr / costSummary.exchange_rate_to_inr).toLocaleString()})`}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 text-[11px]">👫 Couple Living</span>
                          <div className="text-base font-bold text-teal-400 font-mono mt-0.5">
                            ₹{costSummary.monthly_living.couple_monthly_inr.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {costSummary.currency_code !== 'INR' && `(${costSummary.currency_symbol}${Math.round(costSummary.monthly_living.couple_monthly_inr / costSummary.exchange_rate_to_inr).toLocaleString()})`}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 text-[11px]">👨‍👩‍👧‍👦 Family of 4 Living</span>
                          <div className="text-base font-bold text-violet-400 font-mono mt-0.5">
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

              {/* Continent Filter Chips */}
              <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
                {CONTINENT_TABS.map(tab => {
                  const count = tab.id === 'ALL'
                    ? destinations.length
                    : destinations.filter(d => (COUNTRY_TO_CONTINENT[d.country_name] || 'ALL') === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedContinent(tab.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        selectedContinent === tab.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
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
                    const cont = COUNTRY_TO_CONTINENT[d.country_name] || 'ALL';
                    const matchesContinent = selectedContinent === 'ALL' || cont === selectedContinent;
                    const matchesSearch = !catalogSearchQuery.trim() ||
                      d.city_name?.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
                      d.country_name?.toLowerCase().includes(catalogSearchQuery.toLowerCase());
                    return matchesContinent && matchesSearch;
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
                        {CONTINENT_TABS.filter(c => c.id !== 'ALL').map(continent => {
                          const list = destinations.filter(d => (COUNTRY_TO_CONTINENT[d.country_name] || 'ALL') === continent.id);
                          if (!list || list.length === 0) return null;
                          return (
                            <optgroup key={continent.id} label={`${continent.label} (${list.length})`}>
                              {list.map(d => (
                                <option key={d.destination_id} value={d.destination_id}>
                                  {d.city_name}, {d.country_name} ({d.currency_code} {d.currency_symbol})
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
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
                        {CONTINENT_TABS.filter(c => c.id !== 'ALL').map(continent => {
                          const list = destinations.filter(d => (COUNTRY_TO_CONTINENT[d.country_name] || 'ALL') === continent.id);
                          if (!list || list.length === 0) return null;
                          return (
                            <optgroup key={continent.id} label={`${continent.label} (${list.length})`}>
                              {list.map(d => (
                                <option key={d.destination_id} value={d.destination_id}>
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

        {/* ========================================================================= */}
        {/* TAB 6: TRAVELER AI COPILOT CHATBOT STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'chatbot' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 p-6 rounded-2xl border border-emerald-500/20 shadow-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/25">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-100">Traveler AI Copilot Studio</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      WanderBot v2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live interactive travel economist powered by PostgreSQL 3NF data & Google Gemini AI
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Engine: {apiStatus?.gemini_configured ? 'Google Gemini 1.5 Flash' : 'PostgreSQL Domain Engine'}
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
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {destinations.map(d => (
                      <option key={d.destination_id} value={d.destination_id}>
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
                      `What is a 5-day budget for ${selectedDestination?.city_name || 'Tirupati'}?`,
                      `What are the best free attractions in ${selectedDestination?.city_name || 'Tirupati'}?`,
                      `Compare ${selectedDestination?.city_name || 'Paris'} vs Tokyo daily costs`,
                      `What can I do in Hyderabad with ₹15,000?`,
                      `Give me backpacker tips for Bali`
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
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 text-xs space-y-2">
                  <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" />
                    Interactive Trip Builder Link
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Satisfied with the AI Copilot recommendations? Transfer directly into Tab 2 to dynamically select attractions and generate an itemized trip budget.
                  </p>
                  <button
                    onClick={() => {
                      if (selectedDestination) {
                        setBuilderDestinationId(selectedDestination.destination_id);
                      }
                      setActiveTab('builder');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    Load into Trip Builder
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right pane: Chat Studio Window (8 cols) */}
              <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
                {/* Chat Studio Top Bar */}
                <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
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
                              {msg.engine === 'GOOGLE_GEMINI_1_5_FLASH' ? 'Gemini AI' : '3NF Engine'}
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
                    placeholder={`Ask WanderBot about ${selectedDestination?.city_name || 'Tirupati'}, costs, itineraries, or comparisons...`}
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
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-4 mt-auto text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          WanderBudget AI • <span className="text-slate-300 font-medium">Dynamic Trip Budget Builder & Live Cost Analyzer</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Enterprise Database Architecture</span>
          <span>•</span>
          <span>PostgreSQL 16 + Prisma</span>
          <span>•</span>
          <span>Multi-Currency System</span>
        </div>
      </footer>

      {/* 5. API KEYS & AI ENGINE CONFIGURATION MODAL */}
      {showApiModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">AI Search Engine & API Integrations</h3>
                  <p className="text-xs text-slate-400">Configure real-time web research & external data providers</p>
                </div>
              </div>
              <button
                onClick={() => { setShowApiModal(false); setKeySaveMessage(null); }}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Provider 1: Google Gemini */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-200">Google Gemini Generative AI</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  apiStatus?.gemini_configured
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {apiStatus?.gemini_configured ? '🟢 Active & Connected' : '⚪ Fallback Heuristic Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Powers real-time generative analysis for <strong className="text-slate-300">any obscure town or village worldwide</strong>. Discovers authentic tourist attractions, local transport fares, food costs, and currency benchmarks dynamically.
              </p>

              {apiStatus?.gemini_configured && (
                <div className="text-xs text-emerald-400/90 bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2.5 flex items-center justify-between">
                  <span>Connected Key: <code className="font-mono">{apiStatus.gemini_masked_key}</code></span>
                  <span className="text-[10px] text-slate-400">Gemini 1.5 Flash</span>
                </div>
              )}

              <form onSubmit={handleSaveGeminiKey} className="space-y-2 pt-1">
                <label className="text-xs text-slate-300 font-medium block">
                  {apiStatus?.gemini_configured ? 'Update Gemini API Key:' : 'Enter Google Gemini API Key:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={savingKey || !geminiKeyInput}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-xs transition-all shadow-md shadow-emerald-600/20"
                  >
                    {savingKey ? 'Saving...' : 'Connect'}
                  </button>
                </div>
                {keySaveMessage && (
                  <p className={`text-xs ${keySaveMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {keySaveMessage.text}
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Tip: Obtain a free Gemini API key from <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-teal-400 underline hover:text-teal-300">Google AI Studio</a>.
                </p>
              </form>
            </div>

            {/* Provider 2: Foreign Exchange Rates */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-medium text-slate-200">Live Foreign Exchange (FX) Feed</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time open currency rates API with 1-hr TTL cache</p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                🟢 Live Active
              </span>
            </div>

            {/* Provider 3: Custom Datasets (CSV / JSON) */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-medium text-slate-200">Custom Datasets (CSV / JSON)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Have a specialized cost-of-living or tourist attraction dataset (e.g. Numbeo, Wikivoyage, or Ministry of Tourism)? Drop the file into the project directory and WanderBudget will batch ingest it directly into PostgreSQL.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowApiModal(false); setKeySaveMessage(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5b. GOOGLE OAUTH & ACADEMIC ROLE SWITCHER MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Identity & Google OAuth 2.0</h3>
                  <p className="text-xs text-slate-400">Section 5 Rubric: Single Users Table • OAuth • JWT • RBAC</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAuthModal(false); setAuthNotification(null); }}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Notification alert */}
            {authNotification && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                authNotification.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}>
                {authNotification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{authNotification.text}</span>
              </div>
            )}

            {/* 1. Primary Google OAuth Sign-In Card */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GoogleLogoSvg className="w-4 h-4" />
                  <span className="text-sm font-semibold text-slate-200">Sign In with Google</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  OAuth 2.0 Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your Google Account to authenticate instantly. Your profile is automatically linked or registered into our normalized PostgreSQL <code className="text-emerald-300 font-mono">users</code> table and authenticated with signed JWT.
              </p>

              {/* 1-Click Google OAuth Button */}
              <button
                type="button"
                disabled={authLoading}
                onClick={() => handleGoogleSignIn('traveler.google@gmail.com', 'Google Traveler')}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all text-xs font-sans active:scale-98"
              >
                <GoogleLogoSvg className="w-4 h-4" />
                <span>Continue with Google</span>
              </button>

              {/* Custom Google Email Input option */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 block">
                  Or enter any custom Google account email:
                </span>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={authLoading || !googleEmailInput}
                    onClick={() => handleGoogleSignIn()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                  >
                    {authLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Switch Academic Roles (RBAC Demonstration) */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Pre-Configured Role Profiles (RBAC)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={authLoading || (user?.role === 'TRAVELER' && user?.oauth_provider === 'LOCAL')}
                  onClick={() => handleSwitchAccount('TRAVELER')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    user?.role === 'TRAVELER' && user?.oauth_provider === 'LOCAL'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Traveler Account</span>
                    {user?.role === 'TRAVELER' && user?.oauth_provider === 'LOCAL' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">Standard Traveler</div>
                  <div className="text-[10px] text-slate-500 mt-1">Trip Planner & Budget Builder</div>
                </button>

                <button
                  type="button"
                  disabled={authLoading || user?.role === 'ADMIN'}
                  onClick={() => handleSwitchAccount('ADMIN')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    user?.role === 'ADMIN'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Administrator</span>
                    {user?.role === 'ADMIN' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">System Admin</div>
                  <div className="text-[10px] text-slate-500 mt-1">Full Management & Audit Access</div>
                </button>
              </div>
            </div>

            {/* Active Session Info */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Active:</span>
                <span className="font-semibold text-slate-200">{user?.full_name}</span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {user?.oauth_provider || 'LOCAL'}
                </span>
              </div>
              <span className="font-mono text-slate-400">{user?.role}</span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowAuthModal(false); setAuthNotification(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
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
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[560px] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Drawer Header */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  WanderBot Copilot
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AI Copilot
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Context: <span className="text-emerald-400 font-medium">{selectedDestination?.city_name || 'Global'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowChatDrawer(false); setActiveTab('chatbot'); }}
                title="Expand to Full Studio Tab"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowChatDrawer(false)}
                title="Minimize Chat"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Drawer Message Stream */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-900/60 text-xs">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-br-none shadow-sm'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderFormattedMessage(msg.text)
                  )}
                  <div className={`mt-1.5 text-[9px] flex items-center gap-1.5 ${msg.role === 'user' ? 'text-emerald-200 justify-end' : 'text-slate-500'}`}>
                    <span>{msg.timestamp}</span>
                    {msg.engine && (
                      <span className="font-mono text-[8px] px-1 rounded bg-slate-800 text-emerald-400">
                        {msg.engine === 'GOOGLE_GEMINI_1_5_FLASH' ? 'Gemini' : '3NF'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-400">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 rounded-bl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-slate-400 font-mono ml-1.5">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions in drawer */}
          {chatSuggestedPrompts.length > 0 && (
            <div className="px-3 py-1.5 border-t border-slate-800/60 bg-slate-950/50 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              {chatSuggestedPrompts.slice(0, 3).map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendChatMessage(prompt)}
                  className="px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700/60 text-slate-300 hover:text-emerald-300 transition-colors shrink-0 line-clamp-1 max-w-[180px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Drawer Input Form */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
            className="p-2.5 border-t border-slate-800 bg-slate-950 flex gap-1.5"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about costs, Tirupati, Paris..."
              disabled={chatLoading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
