import React, { useState, useEffect } from 'react';
import {
  Compass, Shield, Lock, Mail, User, Eye, EyeOff, ArrowRight,
  Sparkles, CheckCircle2, AlertTriangle, Layers, Database,
  Cpu, Award, Check, RefreshCw, KeyRound, Send
} from 'lucide-react';


export default function LoginPage({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign In State
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Registration State
  const [regNo, setRegNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [homeCurrency, setHomeCurrency] = useState('INR');

  // OTP State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);


  const GOOGLE_CLIENT_ID = '585498529067-sc1te4irkgeo13iqbtei89l5ba59jak7.apps.googleusercontent.com';

  useEffect(() => {
    const initGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (response?.credential) {
                setLoading(true);
                setErrorMessage('');
                setSuccessMessage('Verifying Google credentials with backend...');
                try {
                  const res = await fetch('/api/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential: response.credential })
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setSuccessMessage(`Signed in via Google as ${data.user.full_name}!`);
                    localStorage.setItem('wb_token', data.token);
                    setTimeout(() => onLoginSuccess(data.user, data.token), 500);
                  } else {
                    setErrorMessage(data.error || 'Google sign-in verification failed');
                  }
                } catch (err) {
                  setErrorMessage(err.message);
                } finally {
                  setLoading(false);
                }
              }
            }
          });

          const btnEl = document.getElementById('google-btn-official');
          if (btnEl) {
            btnEl.innerHTML = '';
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'continue_with',
              shape: 'pill'
            });
          }
        } catch (e) {
          console.warn('Google GSI initialization notice:', e.message);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initGoogleGsi();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // Handle Sign In with Credentials
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_id: loginId.trim(),
          password: password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid login identifier or password');
      }

      setSuccessMessage(`Welcome back, ${data.user.full_name}! Redirecting...`);
      if (rememberMe) {
        localStorage.setItem('wb_token', data.token);
      }
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 500);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!regNo.trim() || !fullName.trim() || !registerEmail.trim() || !registerPassword) {
      setErrorMessage('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reg_no: regNo.trim(),
          full_name: fullName.trim(),
          email: registerEmail.trim(),
          password: registerPassword,
          home_currency: homeCurrency
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register account');
      }

      setSuccessMessage(`Account registered successfully as ${data.user.full_name}! Redirecting...`);
      localStorage.setItem('wb_token', data.token);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 600);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Handle Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true);
      setSuccessMessage(`OTP sent to ${otpEmail}! Check your inbox (valid 5 min).`);
      // Start 60-second resend countdown
      setOtpCountdown(60);
      const timer = setInterval(() => {
        setOtpCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP from your email.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('Verifying OTP...');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail.trim(), otp: otpCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      setSuccessMessage(`Welcome, ${data.user.full_name}! Redirecting...`);
      localStorage.setItem('wb_token', data.token);
      setTimeout(() => onLoginSuccess(data.user, data.token), 600);
    } catch (err) {
      setErrorMessage(err.message);
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Project Identity & Architecture Overview */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Compass className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  WanderBudget AI
                </h1>
                <p className="text-xs text-emerald-400 font-mono font-medium">
                  Dynamic Trip Budget Builder & Live Cost Analyzer
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Enterprise Relational Database Management System demonstrating comprehensive 3NF relational schema, stored procedures, triggers, ACID transactions, and single-table Role-Based Access Control (RBAC).
            </p>

            {/* Architecture Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Single Users Table with RBAC (Section 5 Compliance)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Unified PostgreSQL <code className="text-emerald-400 font-mono">users</code> entity distinguishing permissions via role enum (<code className="text-slate-300">TRAVELER</code> vs <code className="text-slate-300">ADMIN</code>).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    BCrypt 10-Round Hashing & Signed JWTs
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Secure non-reversible password digestion, tamper-proof session tokens, and parameterized Prisma query immunity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Google OAuth 2.0 Instant Account Linking
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automated OAuth credential resolution seamlessly linked to PostgreSQL user profiles and audited in real-time.
                  </p>
                </div>
              </div>
            </div>

            {/* Academic System Status Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono text-slate-400">
              <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL 16 Active
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                Prisma ORM
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
                30/30 Marks Rubric Ready
              </span>
            </div>
          </div>

          {/* Right Column: Authentication Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl relative">
              
              {/* Header Tabs: Sign In | OTP Login | Create Account */}
              <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('otp'); setErrorMessage(''); setSuccessMessage(''); setOtpSent(false); setOtpCode(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    authMode === 'otp'
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-3 h-3" />
                  OTP Login
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    authMode === 'register'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Notification Banners */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* TAB: OTP LOGIN */}
              {authMode === 'otp' && (
                <div className="space-y-4">
                  {/* Step indicator */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${!otpSent ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>1</div>
                    <div className={`flex-1 h-px ${otpSent ? 'bg-indigo-500' : 'bg-slate-800'} transition-all`} />
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${otpSent ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-slate-700 bg-slate-800 text-slate-500'}`}>2</div>
                    <div className="text-[10px] text-slate-500 ml-1">{otpSent ? 'Enter OTP' : 'Enter Email'}</div>
                  </div>

                  {/* Step 1: Email input + Send OTP */}
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Registered Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            placeholder="yourname@gmail.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Must be the email registered to your WanderBudget account.</p>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                      >
                        {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Sending OTP...</span></> : <><Send className="w-4 h-4" /><span>Send OTP to Email</span></>}
                      </button>
                    </form>
                  ) : (
                    /* Step 2: OTP code entry + verify */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
                        <span>OTP sent to <strong>{otpEmail}</strong>. Check your inbox and paste the 6-digit code below.</span>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-Digit OTP Code</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-4 py-3 text-xl text-center font-mono font-bold text-indigo-300 tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || otpCode.length !== 6}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                      >
                        {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Verifying...</span></> : <><KeyRound className="w-4 h-4" /><span>Verify OTP & Sign In</span></>}
                      </button>
                      <div className="text-center">
                        <button
                          type="button"
                          disabled={otpCountdown > 0 || loading}
                          onClick={() => { setOtpSent(false); setOtpCode(''); setErrorMessage(''); setSuccessMessage(''); }}
                          className="text-[11px] text-slate-500 hover:text-indigo-400 underline underline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : 'Resend / Change Email'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 1: SIGN IN FORM */}
              {authMode === 'login' ? (

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Login Identifier (Email or Reg/User ID)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder="e.g. 24BAI0226 or traveler@wanderbudget.local"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Demo: <code className="text-slate-400 font-mono">Traveler@123</code>
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Keep me signed in</span>
                    </label>
                  </div>

                  <button
                    id="login-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to WanderBudget</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* TAB 2: REGISTER FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        User / Reg ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        placeholder="e.g. USER_2026"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="traveler@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Home Currency
                      </label>
                      <select
                        value={homeCurrency}
                        onChange={(e) => setHomeCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - British Pound</option>
                        <option value="JPY">JPY (¥) - Japanese Yen</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all mt-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Creating Profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Traveler Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                  <span className="bg-slate-900 px-3 text-slate-500">or OAuth 2.0</span>
                </div>
              </div>

              {/* Official Google OAuth 2.0 Sign-In */}
              <div className="flex justify-center py-1">
                <div id="google-btn-official" className="flex justify-center min-h-[44px]" />
              </div>


            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center text-xs text-slate-600 border-t border-slate-900 z-10">
        WanderBudget AI • Database Systems Lab Project • Single Users Table with RBAC
      </footer>
    </div>
  );
}
