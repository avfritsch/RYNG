import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth.ts';
import { useOffline } from './hooks/useOffline.ts';
import { AuthScreen } from './components/auth/AuthScreen.tsx';
import { BottomNav } from './components/ui/BottomNav.tsx';
import { ConfigScreen } from './components/config/ConfigScreen.tsx';
import { DoneScreen } from './components/config/DoneScreen.tsx';
import { TimerScreen } from './components/timer/TimerScreen.tsx';
import { PlanListScreen } from './components/plans/PlanListScreen.tsx';
import { PlanDetailScreen } from './components/plans/PlanDetailScreen.tsx';
import { PlanEditorScreen } from './components/plans/PlanEditorScreen.tsx';
import { HistoryListScreen } from './components/history/HistoryListScreen.tsx';
import { SessionDetailScreen } from './components/history/SessionDetailScreen.tsx';
import { ProfileScreen } from './components/profile/ProfileScreen.tsx';
import { LibraryScreen } from './components/library/LibraryScreen.tsx';
import { PlanLibraryScreen } from './components/library/PlanLibraryScreen.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { ToastContainer } from './components/ui/ToastContainer.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        <Routes>
          <Route path="/" element={<ConfigScreen />} />
          <Route path="/plans" element={<PlanListScreen />} />
          <Route path="/plans/new" element={<PlanEditorScreen />} />
          <Route path="/plans/:planId" element={<PlanDetailScreen />} />
          <Route path="/plans/:planId/edit" element={<PlanEditorScreen />} />
          <Route path="/history" element={<HistoryListScreen />} />
          <Route path="/history/:sessionId" element={<SessionDetailScreen />} />
          <Route path="/library" element={<LibraryScreen />} />
          <Route path="/library/plans" element={<PlanLibraryScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Routes>
      </main>
      <BottomNav />

      {/* Fullscreen overlays — rendered above everything */}
      <TimerScreen />
      <DoneScreen />
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
