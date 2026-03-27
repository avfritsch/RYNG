import { useNavigate } from 'react-router-dom';
import { usePublicPlans, usePlanVotes, useTogglePlanVote, useCopyPlan } from '../../hooks/usePlanLibrary.ts';
import { Icon } from '../ui/Icon.tsx';
import { SkeletonCard } from '../ui/SkeletonCard.tsx';
import '../../styles/plan-library.css';

export function PlanLibraryScreen() {
  const navigate = useNavigate();
  const { data: plans, isLoading } = usePublicPlans();
  const { data: votes } = usePlanVotes();
  const toggleVote = useTogglePlanVote();
  const copyPlan = useCopyPlan();

  if (isLoading) return <div className="plan-lib"><h2 className="plan-lib-title">Plan-Bibliothek</h2><SkeletonCard count={4} /></div>;

  return (
    <div className="plan-lib">
      <h2 className="plan-lib-title">Plan-Bibliothek</h2>
      <p className="plan-lib-desc">Öffentliche Trainingspläne der Community. Kopiere einen Plan, um ihn anzupassen.</p>

      {(!plans || plans.length === 0) ? (
        <p className="plan-lib-empty">Noch keine öffentlichen Pläne vorhanden.</p>
      ) : (
        <div className="plan-lib-list">
          {plans.map((plan) => {
            const hasVoted = votes?.has(plan.id) ?? false;
            return (
              <div key={plan.id} className="plan-lib-card card">
                <div className="plan-lib-card-header">
                  <span className="plan-lib-card-name">{plan.name}</span>
                  <button
                    className={`library-icon-btn library-icon-btn--vote ${hasVoted ? 'library-icon-btn--voted' : ''}`}
                    onClick={() => toggleVote.mutate({ planId: plan.id, hasVoted })}
                  >
                    <Icon name="thumbs-up" size={14} />
                    {plan.vote_count > 0 && <span className="library-vote-count">{plan.vote_count}</span>}
                  </button>
                </div>
                {plan.description && <p className="plan-lib-card-desc">{plan.description}</p>}
                <div className="plan-lib-card-meta">
                  {plan.is_system && <span className="plan-lib-badge">System</span>}
                  {plan.copy_count > 0 && <span>{plan.copy_count}× kopiert</span>}
                </div>
                <div className="plan-lib-card-actions">
                  <button className="library-action-btn" onClick={() => navigate(`/plans/${plan.id}`)}>
                    <Icon name="eye" size={14} /> Ansehen
                  </button>
                  <button className="library-action-btn library-action-btn--primary" onClick={() => copyPlan.mutate(plan.id)}>
                    <Icon name="copy" size={14} /> Kopieren
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
