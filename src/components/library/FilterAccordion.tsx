import { Icon } from '../ui/Icon.tsx';

interface FilterAccordionProps {
  label: string;
  options: readonly string[];
  selected: string[];
  open: boolean;
  onToggleOpen: () => void;
  onToggle: (value: string) => void;
  onReset: () => void;
}

/** Collapsible multi-select chip filter (muscle groups, equipment, …). */
export function FilterAccordion({
  label,
  options,
  selected,
  open,
  onToggleOpen,
  onToggle,
  onReset,
}: FilterAccordionProps) {
  const count = selected.length;
  return (
    <>
      <button className="library-filter-header" onClick={onToggleOpen} aria-expanded={open}>
        <span>
          {label}
          {count > 0 ? ` (${count})` : ''}
        </span>
        {count > 0 && <span className="library-filter-count">{count} aktiv</span>}
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>
      {open && (
        <div className="library-chip-wrap">
          {count > 0 && (
            <button className="library-chip library-chip--reset" onClick={onReset}>
              Zurücksetzen
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              className={`library-chip ${selected.includes(opt) ? 'library-chip--active' : ''}`}
              onClick={() => onToggle(opt)}
              aria-pressed={selected.includes(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
