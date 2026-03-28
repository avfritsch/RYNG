import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { StationConfig, TimerConfig } from '../../types/timer.ts';
import type { Preset } from '../../types/database.ts';
import { useTimerStore } from '../../stores/timer-store.ts';
import { useSessionStore } from '../../stores/session-store.ts';
import { useSavePreset, presetToConfig } from '../../hooks/usePresets.ts';
import { useMesocycle } from '../../hooks/useMesocycle.ts';
import { applyProgression, getMesocycleSummary } from '../../lib/mesocycle.ts';
import { unlockAudio } from '../../lib/timer-engine.ts';
import { Stepper } from '../ui/Stepper.tsx';
import { StationRow } from './StationRow.tsx';
import { PresetBar } from './PresetBar.tsx';
import '../../styles/config-screen.css';

const defaultStation = (index: number): StationConfig => ({
  name: `Station ${index + 1}`,
  workSeconds: 45,
  pauseSeconds: 30,
  isWarmup: false,
  howto: '',
});

const defaultStations: StationConfig[] = [
  { name: 'Jumping Jacks', workSeconds: 30, pauseSeconds: 10, isWarmup: true, howto: '' },
  { name: 'Arm Circles', workSeconds: 30, pauseSeconds: 10, isWarmup: true, howto: '' },
  { name: 'Liegestütze', workSeconds: 45, pauseSeconds: 30, isWarmup: false, howto: '' },
  { name: 'Kniebeugen', workSeconds: 45, pauseSeconds: 30, isWarmup: false, howto: '' },
  { name: 'Plank', workSeconds: 45, pauseSeconds: 30, isWarmup: false, howto: '' },
  { name: 'Ausfallschritte', workSeconds: 45, pauseSeconds: 30, isWarmup: false, howto: '' },
];

let nextId = 1;
function generateId() {
  return `station-${nextId++}`;
}

function createIds(count: number): string[] {
  return Array.from({ length: count }, () => generateId());
}

export function ConfigScreen() {
  const [rounds, setRounds] = useState(3);
  const [roundPause, setRoundPause] = useState(90);
  const [stations, setStations] = useState<StationConfig[]>(defaultStations);
  const [stationIds, setStationIds] = useState<string[]>(() => createIds(defaultStations.length));
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const loadConfig = useTimerStore((s) => s.loadConfig);
  const start = useTimerStore((s) => s.start);
  const timerPhase = useTimerStore((s) => s.state.phase);
  const savePreset = useSavePreset();
  const { data: mesocycle, isLoading: mesoLoading } = useMesocycle();

  const mesoSummary = mesocycle ? getMesocycleSummary(mesocycle) : null;

  // Track whether stations came from a plan (so we can apply mesocycle)
  const [fromPlan, setFromPlan] = useState(false);

  // Load config from sessionStorage (when coming from PlanDetailScreen)
  useEffect(() => {
    const saved = sessionStorage.getItem('ryng_loaded_config');
    if (saved) {
      sessionStorage.removeItem('ryng_loaded_config');
      try {
        const config: TimerConfig = JSON.parse(saved);
        setStations(config.stations);
        setStationIds(createIds(config.stations.length));
        setRounds(config.rounds);
        setRoundPause(config.roundPause);
        setFromPlan(true);
      } catch {
        // ignore invalid data
      }
    }
  }, []);

  // Apply mesocycle progression reactively when data arrives and stations came from a plan
  useEffect(() => {
    if (!fromPlan || mesoLoading || !mesocycle) return;
    setStations((prev) =>
      prev.map((s) => {
        const { work, pause } = applyProgression(
          s.workSeconds, s.pauseSeconds, mesocycle.current_week, mesocycle,
        );
        return { ...s, workSeconds: work, pauseSeconds: pause };
      }),
    );
    setFromPlan(false); // only apply once
  }, [fromPlan, mesocycle, mesoLoading]);

  function applyConfigFromPlan(config: TimerConfig) {
    setRounds(config.rounds);
    setRoundPause(config.roundPause);

    if (mesocycle) {
      setStations(config.stations.map((s) => {
        const { work, pause } = applyProgression(
          s.workSeconds, s.pauseSeconds, mesocycle.current_week, mesocycle,
        );
        return { ...s, workSeconds: work, pauseSeconds: pause };
      }));
    } else {
      setStations(config.stations);
    }
    setStationIds(createIds(config.stations.length));
  }

  function handlePresetSelect(preset: Preset) {
    applyConfigFromPlan(presetToConfig(preset));
  }

  function handleSavePreset() {
    if (!presetName.trim()) return;
    const config: TimerConfig = { stations, rounds, roundPause };
    savePreset.mutate({ name: presetName.trim(), config }, {
      onSuccess: () => {
        setShowSavePreset(false);
        setPresetName('');
      },
    });
  }

  function updateStation(index: number, station: StationConfig) {
    setStations((prev) => prev.map((s, i) => (i === index ? station : s)));
  }

  function removeStation(index: number) {
    setStations((prev) => prev.filter((_, i) => i !== index));
    setStationIds((prev) => prev.filter((_, i) => i !== index));
  }

  function addStation() {
    setStations((prev) => [...prev, defaultStation(prev.length)]);
    setStationIds((prev) => [...prev, generateId()]);
  }

  // Drag & Drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stationIds.indexOf(String(active.id));
    const newIndex = stationIds.indexOf(String(over.id));

    setStations((prev) => arrayMove(prev, oldIndex, newIndex));
    setStationIds((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function getEstimatedDuration(): string {
    const warmupStations = stations.filter((s) => s.isWarmup);
    const kraftStations = stations.filter((s) => !s.isWarmup);

    let totalSec = 0;
    for (const s of warmupStations) {
      totalSec += s.workSeconds + s.pauseSeconds;
    }
    for (let r = 0; r < rounds; r++) {
      for (const s of kraftStations) {
        totalSec += s.workSeconds + s.pauseSeconds;
      }
      if (r < rounds - 1) totalSec += roundPause;
    }

    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  const startSession = useSessionStore((s) => s.start);

  function handleStart() {
    if (stations.length === 0) return;
    unlockAudio();
    const config: TimerConfig = { stations, rounds, roundPause };
    loadConfig(config);
    startSession();
    start();
  }

  if (timerPhase !== 'idle' && timerPhase !== 'done') return null;

  const warmupCount = stations.filter((s) => s.isWarmup).length;
  const kraftCount = stations.filter((s) => !s.isWarmup).length;

  return (
    <div className="config-screen">
      <h2 className="config-title">Timer konfigurieren</h2>

      {mesoSummary && (
        <div className="config-meso-badge">
          Woche {mesoSummary.weekNumber} · <strong>{mesoSummary.weekLabel}</strong>
          {mesoSummary.isDeload && <span className="config-meso-deload"> (Deload)</span>}
        </div>
      )}

      <PresetBar onSelect={handlePresetSelect} />

      <div className="config-section">
        <Stepper label="Runden" value={rounds} min={1} max={20} onChange={setRounds} />
        <Stepper label="Rundenpause" value={roundPause} min={0} max={300} step={5} unit="s" onChange={setRoundPause} />
      </div>

      <div className="config-section">
        <div className="config-section-header">
          <h3>Stationen</h3>
          <span className="config-station-count">
            {warmupCount > 0 && <span className="config-badge config-badge--warmup">{warmupCount} Warmup</span>}
            <span className="config-badge config-badge--kraft">{kraftCount} Kraft</span>
          </span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stationIds} strategy={verticalListSortingStrategy}>
            <div className="config-stations">
              {stations.map((station, i) => (
                <StationRow
                  key={stationIds[i]}
                  id={stationIds[i]}
                  index={i}
                  station={station}
                  onChange={(s) => updateStation(i, s)}
                  onRemove={() => removeStation(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button className="config-add-btn" onClick={addStation}>
          + Station hinzufügen
        </button>
      </div>

      {/* Save as Preset */}
      <div className="config-section">
        {showSavePreset ? (
          <div className="config-save-preset">
            <input
              className="config-preset-input"
              placeholder="Preset-Name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              autoFocus
            />
            <button
              className="config-preset-save-btn"
              onClick={handleSavePreset}
              disabled={!presetName.trim() || savePreset.isPending}
            >
              {savePreset.isPending ? '...' : 'Speichern'}
            </button>
            <button
              className="config-preset-cancel-btn"
              onClick={() => { setShowSavePreset(false); setPresetName(''); }}
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            className="config-save-preset-btn"
            onClick={() => setShowSavePreset(true)}
          >
            Als Preset speichern
          </button>
        )}
      </div>

      <div className="config-footer">
        <div className="config-duration">
          Geschätzte Dauer: <strong>{getEstimatedDuration()}</strong>
        </div>
        <button
          className="config-start-btn"
          onClick={handleStart}
          disabled={stations.length === 0}
        >
          STARTEN
        </button>
      </div>
    </div>
  );
}
