import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './styles/globals.css';
import './lib/i18n'; // Initialize i18n before render
import { initPostHog } from './lib/analytics';

// ── Sentry Initialization ──
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

// ── PostHog Initialization ──
initPostHog();

// ── Render ──
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto text-2xl border border-red-100">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Une erreur est survenue</h1>
            <p className="text-sm text-slate-500 mb-4">
              L'application a rencontré un problème inattendu. Veuillez rafraîchir la page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Rafraîchir la page
            </button>
            {import.meta.env.DEV && error ? (
              <pre className="mt-4 text-left text-xs text-red-600 bg-red-50 p-3 rounded-lg overflow-auto max-h-40">
                {error instanceof Error ? error.message : String(error)}
              </pre>
            ) : null}
          </div>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
