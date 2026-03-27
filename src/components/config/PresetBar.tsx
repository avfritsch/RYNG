import { usePresets, useDeletePreset } from '../../hooks/usePresets.ts';
import type { Preset } from '../../types/database.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/preset-bar.css';

interface PresetBarProps {
  onSelect: (preset: Preset) => void;
}

export function PresetBar({ onSelect }: PresetBarProps) {
  const { data: presets, isLoading, error } = usePresets();
  const deletePreset = useDeletePreset();

  if (error) {
    console.error('PresetBar error:', error);
    return null;
  }
  if (isLoading || !presets || presets.length === 0) return null;

  return (
    <div className="preset-bar">
      <span className="preset-bar-label">Presets</span>
      <div className="preset-chips">
        {presets.map((preset) => (
          <div key={preset.id} className="preset-chip-wrapper">
            <button className="preset-chip" onClick={() => onSelect(preset)}>
              {preset.name}
            </button>
            <button
              className="preset-chip-delete"
              onClick={(e) => {
                e.stopPropagation();
                deletePreset.mutate(preset.id);
              }}
            >
              <Icon name="x-close" size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
