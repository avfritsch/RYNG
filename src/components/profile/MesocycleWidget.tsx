import { useMesocycle, useCreateMesocycle } from '../../hooks/useMesocycle.ts';
import { getMesocycleSummary } from '../../lib/mesocycle.ts';
import '../../styles/mesocycle-widget.css';

interface MesocycleWidgetProps {
  onEdit: () => void;
}

export function MesocycleWidget({ onEdit }: MesocycleWidgetProps) {
  const { data: config, isLoading } = useMesocycle();
  const createMesocycle = useCreateMesocycle();

  if (isLoading) return null;

  if (!config) {
    return (
      <div className="meso-widget">
        <h3 className="meso-widget-title">Mesozyklus</h3>
        <p className="meso-widget-desc">
          Kein aktiver Mesozyklus. Aktiviere progressive Overload für automatische Zeitanpassungen.
        </p>
        <button
          className="meso-widget-activate"
          onClick={() => createMesocycle.mutate()}
          disabled={createMesocycle.isPending}
        >
          {createMesocycle.isPending ? 'Wird aktiviert...' : 'Mesozyklus aktivieren'}
        </button>
      </div>
    );
  }

  const summary = getMesocycleSummary(config);

  return (
    <div className="meso-widget">
      <div className="meso-widget-header">
        <h3 className="meso-widget-title">Mesozyklus</h3>
        <button className="meso-widget-edit" onClick={onEdit}>Bearbeiten</button>
      </div>

      <div className="meso-blocks">
        {Array.from({ length: summary.totalWeeks }, (_, i) => {
          const weekNum = i + 1;
          const weekKey = `week${weekNum}`;
          const weekConfig = config.progression[weekKey];
          const isCurrent = weekNum === summary.weekNumber;
          const label = weekConfig?.label ?? `Woche ${weekNum}`;

          let cls = 'meso-block';
          if (isCurrent) cls += ' meso-block--current';
          if (weekConfig && weekConfig.workMultiplier < 1) cls += ' meso-block--deload';
          if (weekConfig && weekConfig.workMultiplier > 1) cls += ' meso-block--intense';

          return (
            <div key={i} className={cls}>
              <span className="meso-block-week">W{weekNum}</span>
              <span className="meso-block-label">{label}</span>
            </div>
          );
        })}
      </div>

      <p className="meso-widget-status">
        Woche {summary.weekNumber} · <strong>{summary.weekLabel}</strong>
      </p>
    </div>
  );
}
