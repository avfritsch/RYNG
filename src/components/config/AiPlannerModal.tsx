import { useState } from 'react';
import { generatePlan } from '../../lib/ai-planner.ts';
import type { GeneratedPlan } from '../../lib/ai-planner.ts';
import { EQUIPMENT_OPTIONS } from '../../types/exercise-library.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/ai-planner.css';

interface AiPlannerModalProps {
  onApply: (plan: GeneratedPlan) => void;
  onClose: () => void;
}

const FOCUS_OPTIONS = [
  'Ganzkörper',
  'Oberkörper',
  'Unterkörper',
  'Push',
  'Pull',
  'Push/Pull',
  'Core',
  'Cardio & Kraft',
];

export function AiPlannerModal({ onApply, onClose }: AiPlannerModalProps) {
  const [focus, setFocus] = useState('Ganzkörper');
  const [equipment, setEquipment] = useState<string[]>(['Bodyweight']);
  const [duration, setDuration] = useState(20);
  const [rounds, setRounds] = useState(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleEquipment(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const plan = await generatePlan({
        focus,
        equipment,
        durationMinutes: duration,
        rounds,
        notes,
      });
      onApply(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-planner-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ai-planner-modal">
        <div className="ai-planner-header">
          <h3 className="ai-planner-title">Plan mit KI erstellen</h3>
          <button className="ai-planner-close" onClick={onClose}>
            <Icon name="x-close" size={20} />
          </button>
        </div>

        <div className="ai-planner-body">
          <div className="ai-planner-field">
            <label className="ai-planner-label">Fokus</label>
            <div className="ai-planner-chips">
              {FOCUS_OPTIONS.map((f) => (
                <button
                  key={f}
                  className={`ai-planner-chip ${focus === f ? 'ai-planner-chip--active' : ''}`}
                  onClick={() => setFocus(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-planner-field">
            <label className="ai-planner-label">Equipment</label>
            <div className="ai-planner-chips">
              {EQUIPMENT_OPTIONS.map((e) => (
                <button
                  key={e}
                  className={`ai-planner-chip ${equipment.includes(e) ? 'ai-planner-chip--active' : ''}`}
                  onClick={() => toggleEquipment(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-planner-row">
            <div className="ai-planner-field">
              <label className="ai-planner-label">Dauer (Min)</label>
              <input
                type="number"
                className="ai-planner-input"
                min={10}
                max={60}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <div className="ai-planner-field">
              <label className="ai-planner-label">Runden</label>
              <input
                type="number"
                className="ai-planner-input"
                min={1}
                max={10}
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="ai-planner-field">
            <label className="ai-planner-label">Zusätzliche Wünsche</label>
            <textarea
              className="ai-planner-textarea"
              placeholder="z.B. Knieschonendes Training, Fokus auf Schultern, nur 15 Minuten..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <div className="ai-planner-error">{error}</div>
          )}
        </div>

        <div className="ai-planner-footer">
          <button
            className="ai-planner-generate-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generiere Plan...' : 'Plan generieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
