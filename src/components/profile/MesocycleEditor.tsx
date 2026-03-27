import { useState } from 'react';
import { useMesocycle, useUpdateMesocycle, useDeleteMesocycle } from '../../hooks/useMesocycle.ts';
import { DebouncedInput } from '../ui/DebouncedInput.tsx';
import { Icon } from '../ui/Icon.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import '../../styles/mesocycle-editor.css';

interface MesocycleEditorProps {
  onClose: () => void;
}

export function MesocycleEditor({ onClose }: MesocycleEditorProps) {
  const { data: config } = useMesocycle();
  const updateMesocycle = useUpdateMesocycle();
  const deleteMesocycle = useDeleteMesocycle();
  const [deleting, setDeleting] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  if (!config) return null;

  function handleUpdateWeek(weekKey: string, field: 'workMultiplier' | 'pauseMultiplier' | 'label', value: string) {
    if (!config) return;
    const updated = { ...config.progression };
    updated[weekKey] = {
      ...updated[weekKey],
      [field]: field === 'label' ? value : parseFloat(value) || 1,
    };
    updateMesocycle.mutate({ id: config.id, progression: updated });
  }

  function handleResetWeek() {
    if (!config) return;
    updateMesocycle.mutate({
      id: config.id,
      current_week: 1,
      cycle_start: new Date().toISOString().slice(0, 10),
    });
  }

  function handleAdvanceWeek() {
    if (!config) return;
    const next = config.current_week >= config.cycle_length ? 1 : config.current_week + 1;
    updateMesocycle.mutate({ id: config.id, current_week: next });
  }

  async function handleDelete() {
    if (!config) return;
    setShowDeactivateConfirm(true);
  }

  async function confirmDelete() {
    if (!config) return;
    setShowDeactivateConfirm(false);
    setDeleting(true);
    await deleteMesocycle.mutateAsync(config.id);
    onClose();
  }

  const weeks = Array.from({ length: config.cycle_length }, (_, i) => `week${i + 1}`);

  return (
    <div className="meso-editor">
      <div className="meso-editor-header">
        <h3>Mesozyklus konfigurieren</h3>
        <button className="meso-editor-close" onClick={onClose}><Icon name="x-close" size={18} /></button>
      </div>

      <div className="meso-editor-current">
        Aktuelle Woche: <strong>{config.current_week}</strong> / {config.cycle_length}
        <div className="meso-editor-week-btns">
          <button onClick={handleResetWeek}>Reset auf W1</button>
          <button onClick={handleAdvanceWeek}>Nächste Woche</button>
        </div>
      </div>

      <div className="meso-editor-weeks">
        {weeks.map((weekKey) => {
          const wc = config.progression[weekKey];
          if (!wc) return null;
          const weekNum = parseInt(weekKey.replace('week', ''));

          return (
            <div key={weekKey} className={`meso-editor-week ${config.current_week === weekNum ? 'meso-editor-week--current' : ''}`}>
              <span className="meso-editor-week-label">Woche {weekNum}</span>
              <div className="meso-editor-week-fields">
                <label>
                  <span>Label</span>
                  <DebouncedInput
                    value={wc.label}
                    onCommit={(v) => handleUpdateWeek(weekKey, 'label', v)}
                  />
                </label>
                <label>
                  <span>Work &times;</span>
                  <DebouncedInput
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="2.0"
                    value={wc.workMultiplier}
                    onCommit={(v) => handleUpdateWeek(weekKey, 'workMultiplier', v)}
                  />
                </label>
                <label>
                  <span>Pause &times;</span>
                  <DebouncedInput
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="2.0"
                    value={wc.pauseMultiplier}
                    onCommit={(v) => handleUpdateWeek(weekKey, 'pauseMultiplier', v)}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="meso-editor-delete"
        onClick={handleDelete}
        disabled={deleting}
      >
        {deleting ? 'Wird deaktiviert...' : 'Mesozyklus deaktivieren'}
      </button>

      {showDeactivateConfirm && (
        <ConfirmModal
          title="Mesozyklus deaktivieren"
          message="Der Mesozyklus wird deaktiviert und alle Progressionsdaten gehen verloren."
          confirmLabel="Deaktivieren"
          danger
          onCancel={() => setShowDeactivateConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
