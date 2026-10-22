/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wb: {
          bg: 'var(--wb-bg)',
          surface: 'var(--wb-surface)',
          subtle: 'var(--wb-subtle)',
          card: 'var(--wb-card)',
          'card-solid': 'var(--wb-card-solid)',
          border: 'var(--wb-border)',
          'border-hover': 'var(--wb-border-hover)',
          text: 'var(--wb-text-main)',
          'text-muted': 'var(--wb-text-muted)',
          'text-subtle': 'var(--wb-text-subtle)',
          accent: 'var(--wb-accent)',
          'accent-hover': 'var(--wb-accent-hover)',
          'accent-subtle': 'var(--wb-accent-subtle)',
          'accent-text': 'var(--wb-accent-text)',
        },
        radar: {
          dark: '#0b0f19',
          card: '#111827',
          border: '#1f2937',
          accent: '#6366f1',
          accentHover: '#4f46e5',
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
