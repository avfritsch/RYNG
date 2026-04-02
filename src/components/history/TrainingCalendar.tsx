import { useState, useMemo } from 'react';
import type { Session } from '../../types/session.ts';
import { Icon } from '../ui/Icon.tsx';
import '../../styles/training-calendar.css';

interface TrainingCalendarProps {
  sessions: Session[];
  onDayClick?: (date: string) => void;
}

const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}


export function TrainingCalendar({ sessions, onDayClick }: TrainingCalendarProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Build session map: dateKey → session count + total duration
  const sessionMap = useMemo(() => {
    const map = new Map<string, { count: number; totalMin: number; sessions: Session[] }>();
    for (const s of sessions) {
      const key = toDateKey(new Date(s.started_at));
      const existing = map.get(key) ?? { count: 0, totalMin: 0, sessions: [] };
      existing.count++;
      existing.totalMin += Math.round(s.duration_sec / 60);
      existing.sessions.push(s);
      map.set(key, existing);
    }
    return map;
  }, [sessions]);

  // Monthly stats
  const monthStats = useMemo(() => {
    let workouts = 0;
    let totalMin = 0;
    for (const [key, val] of sessionMap) {
      const d = new Date(key);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        workouts += val.count;
        totalMin += val.totalMin;
      }
    }
    return { workouts, totalMin };
  }, [sessionMap, viewMonth, viewYear]);

  const days = getMonthDays(viewYear, viewMonth);
  // Offset for first day (Monday = 0)
  const firstDayOffset = (days[0].getDay() + 6) % 7;
  const todayKey = toDateKey(today);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function goToday() {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  }

  return (
    <div className="cal">
      {/* Header */}
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth} aria-label="Vorheriger Monat">
          <Icon name="chevron-left" size={18} />
        </button>
        <button className="cal-title" onClick={goToday}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </button>
        <button className="cal-nav" onClick={nextMonth} aria-label="Nächster Monat">
          <Icon name="chevron-right" size={18} />
        </button>
      </div>

      {/* Monthly stats */}
      <div className="cal-stats">
        <span>{monthStats.workouts} Workouts</span>
        <span>{monthStats.totalMin} Min</span>
      </div>

      {/* Day labels */}
      <div className="cal-grid" role="group" aria-label="Trainingskalender">
        {DAY_LABELS.map((l) => (
          <div key={l} className="cal-day-label">{l}</div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOffset }, (_, i) => (
          <div key={`empty-${i}`} className="cal-cell cal-cell--empty" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const key = toDateKey(day);
          const data = sessionMap.get(key);
          const isToday = key === todayKey;
          const hasWorkout = !!data;

          let cls = 'cal-cell';
          if (isToday) cls += ' cal-cell--today';
          if (hasWorkout) cls += ' cal-cell--active';

          return (
            <button
              key={key}
              className={cls}
              onClick={() => onDayClick?.(key)}
              aria-label={`${day.getDate()}. ${MONTH_NAMES[viewMonth]}${hasWorkout ? `, ${data.count} Workout(s)` : ''}`}
            >
              <span className="cal-day-num">{day.getDate()}</span>
              {hasWorkout && (
                <div className="cal-dots">
                  {Array.from({ length: Math.min(data.count, 3) }, (_, i) => (
                    <span key={i} className="cal-dot" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
