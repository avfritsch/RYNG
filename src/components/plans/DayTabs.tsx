import type { PlanDay } from '../../types/plan.ts';

interface DayTabsProps {
  days: PlanDay[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
}

export function DayTabs({ days, selectedIndex, onSelect, onAdd }: DayTabsProps) {
  return (
    <div className="plan-editor-day-tabs">
      {days.map((day, i) => (
        <button
          key={day.id}
          className={`plan-day-tab ${i === selectedIndex ? 'plan-day-tab--active' : ''}`}
          onClick={() => onSelect(i)}
        >
          {day.label}
        </button>
      ))}
      <button className="plan-day-tab plan-day-tab--add" onClick={onAdd}>
        +
      </button>
    </div>
  );
}
