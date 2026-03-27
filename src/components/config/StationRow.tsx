import type { StationConfig } from '../../types/timer.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/station-row.css';

interface StationRowProps {
  index: number;
  station: StationConfig;
  onChange: (station: StationConfig) => void;
  onRemove: () => void;
}

export function StationRow({ index, station, onChange, onRemove }: StationRowProps) {
  return (
    <div className={`card station-row ${station.isWarmup ? 'station-row--warmup' : ''}`}>
      <div className="station-row-header">
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
