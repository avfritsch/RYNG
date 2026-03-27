import { DebouncedInput } from '../ui/DebouncedInput.tsx';
import type { PlanDay } from '../../types/plan.ts';

interface DayEditorProps {
  day: PlanDay;
  planId: string;
  onUpdateDay: (field: keyof Pick<PlanDay, 'label' | 'focus' | 'rounds' | 'round_pause'>, value: string | number) => void;
  onDeleteDay: () => void;
}

export function DayEditor({ day, onUpdateDay, onDeleteDay }: DayEditorProps) {
  return (
    <div className="plan-editor-day-config">
      <label className="plan-editor-field">
        <span>Label</span>
        <DebouncedInput
          value={day.label}
          onCommit={(v) => onUpdateDay('label', v)}
        />
      </label>
      <label className="plan-editor-field">
        <span>Fokus</span>
        <DebouncedInput
          value={day.focus ?? ''}
          onCommit={(v) => onUpdateDay('focus', v)}
          placeholder="z.B. Push"
        />
      </label>
      <label className="plan-editor-field">
        <span>Runden</span>
        <DebouncedInput
          type="number"
          min={1}
          max={20}
          value={day.rounds}
          onCommit={(v) => onUpdateDay('rounds', Number(v))}
        />
      </label>
      <label className="plan-editor-field">
        <span>Rundenpause (s)</span>
        <DebouncedInput
          type="number"
          min={0}
          max={300}
          value={day.round_pause}
          onCommit={(v) => onUpdateDay('round_pause', Number(v))}
        />
      </label>
      <button className="plan-editor-delete-day" onClick={onDeleteDay}>
        Tag löschen
      </button>
    </div>
  );
}
