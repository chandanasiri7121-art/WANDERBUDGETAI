import React from 'react';
import ReactDOM from 'react-dom/client';
import App_WanderBudget_24BAI0226 from './App_WanderBudget_24BAI0226.jsx';
import './theme.js';
import './index.css';

console.log('================================================================');
console.log('WanderBudget AI: Dynamic Trip Budget Builder & Live Cost Analyzer');
console.log('Timestamp:', new Date().toISOString());
console.log('================================================================');

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('RootErrorBoundary caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', padding: '32px', fontFamily: 'monospace' }}>
          <div style={{ maxWidth: '700px', margin: '40px auto', background: '#0f172a', border: '1px solid #ef4444', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0' }}>⚠️ Application Render Error</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>An error occurred during page rendering:</p>
            <pre style={{ background: '#020617', padding: '16px', borderRadius: '8px', color: '#fca5a5', overflowX: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
            </pre>
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                style={{ background: '#10b981', color: '#020617', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Clear Storage & Reload
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{ background: '#334155', color: '#f8fafc', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App_WanderBudget_24BAI0226 />
    </RootErrorBoundary>
  </React.StrictMode>
);
