import { Icon } from './Icon.tsx';
import '../../styles/stepper.css';

interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, min = 1, max = 99, step = 1, unit, onChange }: StepperProps) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          aria-label={`${label} verringern`}
        >
          <Icon name="minus" size={16} />
        </button>
        <span className="stepper-value" aria-live="polite">
          {value}{unit && <span className="stepper-unit">{unit}</span>}
        </span>
        <button
          className="stepper-btn"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          aria-label={`${label} erhöhen`}
        >
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  );
}
