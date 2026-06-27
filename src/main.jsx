import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// ─── Error Boundary ────────────────────────────────────────────────────────────
// Catches any React render crash and shows a friendly screen instead of blank.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Luminexis ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          color: '#e2e8f0',
          textAlign: 'center',
          gap: '1.5rem'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>
              Application Error
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', maxWidth: '480px', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          {import.meta.env.PROD && !import.meta.env.VITE_API_URL && (
            <div style={{
              background: '#1a1a2e',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '1rem 1.5rem',
              maxWidth: '520px',
              textAlign: 'left'
            }}>
              <p style={{ color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Missing Configuration
              </p>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>
                <strong>VITE_API_URL</strong> is not set in your Vercel project.<br />
                Go to <strong>Vercel Dashboard → Project Settings → Environment Variables</strong> and add:<br />
                <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: '4px', color: '#34d399', fontSize: '0.78rem' }}>
                  VITE_API_URL = https://your-render-service.onrender.com/api/v1
                </code>
                <br />Then <strong>Redeploy</strong> the project.
              </p>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.6rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Query Client ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
