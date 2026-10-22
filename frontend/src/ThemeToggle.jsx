import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './theme.js';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
        isDark
          ? 'bg-slate-800/80 hover:bg-slate-750 text-amber-300 border border-slate-700/70 shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-300/80 shadow-sm'
      } ${className}`}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
