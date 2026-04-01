import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth.ts';
import { useOffline } from './hooks/useOffline.ts';
import { useTimerStore } from './stores/timer-store.ts';
import { useGymStore } from './stores/gym-store.ts';
import { AuthScreen } from './components/auth/AuthScreen.tsx';
import { BottomNav } from './components/ui/BottomNav.tsx';
import { StartScreen } from './components/start/StartScreen.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { ToastContainer } from './components/ui/ToastContainer.tsx';

// Lazy-loaded overlay screens (only loaded when training is active)
const TimerScreen = lazy(() => import('./components/timer/TimerScreen.tsx').then(m => ({ default: m.TimerScreen })));
const DoneScreen = lazy(() => import('./components/config/DoneScreen.tsx').then(m => ({ default: m.DoneScreen })));
const GymSessionScreen = lazy(() => import('./components/gym/GymSessionScreen.tsx').then(m => ({ default: m.GymSessionScreen })));

// Lazy-loaded routes (not needed on initial load)
const PlanListScreen = lazy(() => import('./components/plans/PlanListScreen.tsx').then(m => ({ default: m.PlanListScreen })));
const PlanDetailScreen = lazy(() => import('./components/plans/PlanDetailScreen.tsx').then(m => ({ default: m.PlanDetailScreen })));
const PlanEditorScreen = lazy(() => import('./components/plans/PlanEditorScreen.tsx').then(m => ({ default: m.PlanEditorScreen })));
const ConfigScreen = lazy(() => import('./components/config/ConfigScreen.tsx').then(m => ({ default: m.ConfigScreen })));
const HistoryListScreen = lazy(() => import('./components/history/HistoryListScreen.tsx').then(m => ({ default: m.HistoryListScreen })));
const SessionDetailScreen = lazy(() => import('./components/history/SessionDetailScreen.tsx').then(m => ({ default: m.SessionDetailScreen })));
const ProfileScreen = lazy(() => import('./components/profile/ProfileScreen.tsx').then(m => ({ default: m.ProfileScreen })));
const LibraryScreen = lazy(() => import('./components/library/LibraryScreen.tsx').then(m => ({ default: m.LibraryScreen })));
const PlanLibraryScreen = lazy(() => import('./components/library/PlanLibraryScreen.tsx').then(m => ({ default: m.PlanLibraryScreen })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LazyFallback() {
  return <div className="loading-center"><div className="spinner" /></div>;
}

/** Mount TimerScreen only when the timer is running */
function LazyTimerOverlay() {
  const isRunning = useTimerStore((s) => s.state.isRunning);
  if (!isRunning) return null;
  return <TimerScreen />;
}

/** Mount DoneScreen only when the timer phase is 'done' (or idle with a summary) */
function LazyDoneOverlay() {
  const phase = useTimerStore((s) => s.state.phase);
  const hasSummary = useTimerStore((s) => !!s.lastSummary);
  if (!hasSummary) return null;
  if (phase !== 'done' && phase !== 'idle') return null;
  return <DoneScreen />;
}

/** Mount GymSessionScreen only when a gym session is active */
function LazyGymOverlay() {
  const isActive = useGymStore((s) => s.isActive);
  if (!isActive) return null;
  return <GymSessionScreen />;
}

function AppContent() {
  const { session, loading } = useAuth();
  const { isOnline } = useOffline();

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" /><span>Laden...</span>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="app-shell">
      <div className="safe-area-top-cover" />
      <div className="safe-area-top-spacer" />
      {!isOnline && (
        <div role="alert" aria-live="assertive" style={{
          background: 'var(--color-rest)',
          color: 'var(--bg-base)',
          textAlign: 'center',
          padding: '4px 8px',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          Offline — Daten werden lokal gespeichert
        </div>
      )}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/" element={<ErrorBoundary><StartScreen /></ErrorBoundary>} />
            <Route path="/plans" element={<ErrorBoundary><PlanListScreen /></ErrorBoundary>} />
            <Route path="/plans/new" element={<ErrorBoundary><PlanEditorScreen /></ErrorBoundary>} />
            <Route path="/plans/quick" element={<ErrorBoundary><ConfigScreen /></ErrorBoundary>} />
            <Route path="/plans/:planId" element={<ErrorBoundary><PlanDetailScreen /></ErrorBoundary>} />
            <Route path="/plans/:planId/edit" element={<ErrorBoundary><PlanEditorScreen /></ErrorBoundary>} />
            <Route path="/history" element={<ErrorBoundary><HistoryListScreen /></ErrorBoundary>} />
            <Route path="/history/:sessionId" element={<ErrorBoundary><SessionDetailScreen /></ErrorBoundary>} />
            <Route path="/library" element={<ErrorBoundary><LibraryScreen /></ErrorBoundary>} />
            <Route path="/library/plans" element={<ErrorBoundary><PlanLibraryScreen /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary><ProfileScreen /></ErrorBoundary>} />
          </Routes>
        </Suspense>
      </main>
      <BottomNav />

      {/* Fullscreen overlays — lazy-loaded, only mounted when active */}
      <Suspense fallback={null}>
        <LazyTimerOverlay />
        <LazyDoneOverlay />
        <LazyGymOverlay />
      </Suspense>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
