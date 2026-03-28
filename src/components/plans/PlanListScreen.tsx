import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans, useDeletePlan } from '../../hooks/usePlans.ts';
import { useNavigationStore } from '../../stores/navigation-store.ts';
import { Icon } from '../ui/Icon.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import { ImportModal } from '../ui/ShareModal.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import { AiPlannerModal } from '../config/AiPlannerModal.tsx';
import { saveGeneratedPlan } from '../../lib/ai-planner.ts';
import { toast } from '../../stores/toast-store.ts';
import type { TimerConfig } from '../../types/timer.ts';
import '../../styles/plan-list.css';

export function PlanListScreen() {
  const { data: plans, isLoading, error } = usePlans();
  const [showImport, setShowImport] = useState(false);
  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const deletePlan = useDeletePlan();
  const navigate = useNavigate();
  const setPendingConfig = useNavigationStore((s) => s.setPendingConfig);

  if (isLoading) {
    return <div className="plan-list"><h2 className="plan-list-title">Trainingspläne</h2><SkeletonCard count={4} /></div>;
  }

  if (error) {
    return (
      <div className="plan-list" style={{ padding: 24 }}>
        <h2 className="plan-list-title">Trainingspläne</h2>
        <p style={{ color: 'var(--color-rest)' }} role="alert">Fehler: {(error as Error).message}</p>
      </div>
    );
  }

  const systemPlans = plans?.filter((p) => p.is_system) ?? [];
  const customPlans = plans?.filter((p) => !p.is_system) ?? [];

  return (
    <div className="plan-list">
      <h2 className="plan-list-title">Trainingspläne</h2>

      {systemPlans.length > 0 && (
        <section className="plan-section">
          <h3 className="plan-section-label">Eingebaute Pläne</h3>
          <div className="plan-cards">
            {systemPlans.map((plan) => (
              <button
                key={plan.id}
                className="card card--interactive plan-card"
                onClick={() => navigate(`/plans/${plan.id}`)}
              >
                <span className="plan-card-name">{plan.name}</span>
                <span className="plan-card-desc">{plan.description}</span>
                <span className="plan-card-badge plan-card-badge--system">System</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="plan-section">
        <h3 className="plan-section-label">Meine Pläne</h3>
        {customPlans.length === 0 ? (
          <p className="plan-empty">Noch keine eigenen Pläne erstellt.</p>
        ) : (
          <div className="plan-cards">
            {customPlans.map((plan) => (
              <div key={plan.id} className="plan-card-wrapper">
                <button
                  className="card card--interactive plan-card"
                  onClick={() => navigate(`/plans/${plan.id}`)}
                >
                  <span className="plan-card-name">{plan.name}</span>
                  <span className="plan-card-desc">{plan.description}</span>
                </button>
                <button
                  className="plan-card-delete"
                  onClick={() => setPlanToDelete(plan.id)}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="plan-add-btn"
            style={{ flex: 1, marginTop: 0 }}
            onClick={() => navigate('/plans/new')}
          >
            + Neuer Plan
          </button>
          <button
            className="plan-add-btn"
            style={{ flex: 1, marginTop: 0 }}
            onClick={() => setShowImport(true)}
          >
            <Icon name="download" size={14} /> Import
          </button>
        </div>
        <button
          className="plan-ai-btn"
          onClick={() => setShowAiPlanner(true)}
        >
          Plan mit KI erstellen
        </button>
      </section>

      {planToDelete && (
        <ConfirmModal
          title="Plan löschen"
          message="Dieser Plan und alle Übungen werden gelöscht."
          confirmLabel="Löschen"
          danger
          onCancel={() => setPlanToDelete(null)}
          onConfirm={() => { deletePlan.mutate(planToDelete); setPlanToDelete(null); }}
        />
      )}

      {showImport && (
        <ImportModal
          onImport={(_name: string, config: TimerConfig) => {
            setPendingConfig(config);
            navigate('/');
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {showAiPlanner && (
        <AiPlannerModal
          onApply={async (plan) => {
            try {
              const planId = await saveGeneratedPlan(plan);
              setShowAiPlanner(false);
              toast.success('Plan gespeichert');
              navigate(`/plans/${planId}`);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'Fehler beim Speichern');
            }
          }}
          onClose={() => setShowAiPlanner(false)}
        />
      )}
    </div>
  );
}
