import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon.tsx';

interface ExerciseSortableProps {
  id: string;
  children: ReactNode;
}

export function ExerciseSortable({ id, children }: ExerciseSortableProps) {
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
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          left: -4,
          top: 0,
          bottom: 0,
          width: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
          touchAction: 'none',
        }}
      >
        <Icon name="grip-vertical" size={16} />
      </div>
      <div style={{ marginLeft: 16 }}>
        {children}
      </div>
    </div>
  );
}
