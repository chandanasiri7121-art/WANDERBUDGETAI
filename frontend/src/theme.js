// ============================================================================
// WanderBudget AI — Theme Management Foundation (Light / Dark)
// ============================================================================
// Provides reliable initialization, persistence, and reactive hook support
// using Tailwind's class-based dark mode ('dark' on document.documentElement).
// ============================================================================

import { useState, useEffect } from 'react';

export const THEME_STORAGE_KEY = 'wanderbudget_theme';
export const THEME_EVENT = 'wanderbudget_theme_change';

/**
 * Reads the preferred theme from localStorage or falls back to 'dark'.
 * Defaults to 'dark' to preserve the existing look and feel seamlessly.
 *
 * @returns {'dark' | 'light'}
 */
export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch (err) {
    console.warn('Could not read theme from localStorage:', err);
  }
  return 'dark';
}

/**
 * Applies the theme to <html> class list and updates localStorage.
 *
 * @param {'dark' | 'light'} theme
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (err) {
    console.warn('Could not persist theme to localStorage:', err);
  }

  // Dispatch custom event so any listener or hook can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
  }
}

/**
 * Toggles between 'light' and 'dark' and persists the result.
 *
 * @returns {'dark' | 'light'} The new active theme
 */
export function toggleTheme() {
  const current = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';
  const nextTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  return nextTheme;
}

/**
 * Initializes the theme on application bootstrap.
 */
export function initTheme() {
  const theme = getInitialTheme();
  applyTheme(theme);
  return theme;
}

/**
 * React hook to read and manipulate the active theme reactively.
 *
 * @returns {{ theme: 'dark' | 'light', isDark: boolean, setTheme: (t: 'dark'|'light') => void, toggleTheme: () => 'dark'|'light' }}
 */
export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail?.theme) {
        setThemeState(e.detail.theme);
      }
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);
    return () => window.removeEventListener(THEME_EVENT, handleThemeChange);
  }, []);

  const setTheme = (next) => {
    applyTheme(next);
    setThemeState(next);
  };

  const toggle = () => {
    const next = toggleTheme();
    setThemeState(next);
    return next;
  };

  return {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme: toggle
  };
}

// Immediately ensure class is applied on module load
if (typeof window !== 'undefined') {
  initTheme();
}
