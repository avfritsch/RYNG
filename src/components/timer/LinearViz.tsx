import { memo } from 'react';

interface LinearVizProps {
  total: number;
  current: number; // 1-based station index
  phase: string;
}

export const LinearViz = memo(function LinearViz({ total, current, phase }: LinearVizProps) {
  const phaseColor: Record<string, string> = {
    work: 'var(--color-work)',
    warmup: 'var(--color-prepare)',
    pause: 'var(--color-rest)',
    roundPause: 'var(--color-info)',
  };

  const activeColor = phaseColor[phase] ?? 'var(--color-work)';

  return (
    <div className="linear-viz" style={{ display: 'flex', gap: 2, height: 6, padding: '0 16px' }}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i + 1 === current;
        const isDone = i + 1 < current;

        let bg = 'var(--bg-elevated)';
        if (isDone) bg = 'var(--border-default)';
        if (isActive) bg = activeColor;

        return (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 3,
              background: bg,
              height: isActive ? 8 : 6,
              transition: 'background 0.3s, height 0.2s',
              alignSelf: 'center',
            }}
          />
        );
      })}
    </div>
  );
});
