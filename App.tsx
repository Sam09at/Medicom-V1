import { AppProviders } from './providers/AppProviders';

/**
 * App entry point.
 * All navigation is handled by React Router (see router/index.tsx).
 * All layout is handled by AppLayout/AdminLayout (see router/).
 * MockLoginPicker provides dev auth (replaced in Phase 14).
 */
function App() {
  return <AppProviders />;
}

export default App;
