import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { StationConfig } from '../../types/timer.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/station-row.css';

interface StationRowProps {
  id: string;
  index: number;
  station: StationConfig;
  onChange: (station: StationConfig) => void;
  onRemove: () => void;
}

export function StationRow({ id, index, station, onChange, onRemove }: StationRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card station-row ${station.isWarmup ? 'station-row--warmup' : ''}`}
    >
      <div className="station-row-header">
        <button
          className="station-row-drag"
          {...attributes}
          {...listeners}
          aria-label="Station verschieben"
        >
          <Icon name="grip-vertical" size={16} />
        </button>
        <span className="station-row-index">{index + 1}</span>
        <input
          className="station-row-name"
          value={station.name}
          onChange={(e) => onChange({ ...station, name: e.target.value })}
          placeholder="Stationsname"
        />
        <button className="station-row-remove" onClick={onRemove} title="Entfernen">
          <Icon name="x-close" size={16} />
        </button>
      </div>
      <div className="station-row-times">
        <label className="station-row-time">
          <span>Work</span>
          <input
            type="number"
            min={5}
            max={300}
            value={station.workSeconds}
            onChange={(e) => onChange({ ...station, workSeconds: Number(e.target.value) })}
          />
          <span className="station-row-unit">s</span>
        </label>
        <label className="station-row-time">
          <span>Pause</span>
          <input
            type="number"
            min={0}
            max={300}
            value={station.pauseSeconds}
            onChange={(e) => onChange({ ...station, pauseSeconds: Number(e.target.value) })}
          />
          <span className="station-row-unit">s</span>
        </label>
        <label className="station-row-warmup-toggle">
          <input
            type="checkbox"
            checked={station.isWarmup}
            onChange={(e) => onChange({ ...station, isWarmup: e.target.checked })}
          />
          <span>Warmup</span>
        </label>
      </div>
    </div>
  );
}
