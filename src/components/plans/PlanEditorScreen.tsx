import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  usePlan, usePlanDays, usePlanExercises,
  useCreatePlan, useUpdatePlan,
  useCreatePlanDay, useUpdatePlanDay, useDeletePlanDay,
  useCreatePlanExercise, useUpdatePlanExercise, useDeletePlanExercise,
} from '../../hooks/usePlans.ts';
import { DebouncedInput } from '../ui/DebouncedInput.tsx';
import { Icon } from '../ui/Icon.tsx';
import { ExerciseSortable } from './ExerciseSortable.tsx';
import { PlanForm } from './PlanForm.tsx';
import { DayTabs } from './DayTabs.tsx';
import { DayEditor } from './DayEditor.tsx';
import type { Plan, PlanDay, PlanExercise } from '../../types/plan.ts';
import { LibraryPicker } from './LibraryPicker.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';
import '../../styles/plan-editor.css';

export function PlanEditorScreen() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const isNew = !planId || planId === 'new';

  // For existing plans: fetch directly by ID
  const { data: fetchedPlan, isLoading: planLoading } = usePlan(isNew ? undefined : planId);

  // After creating a new plan, we store it here so we don't depend on cache
  const [createdPlan, setCreatedPlan] = useState<Plan | null>(null);
  const plan = createdPlan ?? fetchedPlan ?? null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState<'warmup' | 'kraft' | null>(null);
  const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState(false);
  const [error, setError] = useState('');

  const { data: days } = usePlanDays(plan?.id);
  const selectedDay = days?.[selectedDayIndex];
  const { data: exercises } = usePlanExercises(selectedDay?.id);

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const createDay = useCreatePlanDay();
  const updateDay = useUpdatePlanDay();
  const deleteDay = useDeletePlanDay();
  const createExercise = useCreatePlanExercise();
  const updateExercise = useUpdatePlanExercise();
  const deleteExercise = useDeletePlanExercise();

  useEffect(() => {
    if (fetchedPlan) {
      setName(fetchedPlan.name);
      setDescription(fetchedPlan.description ?? '');
    }
  }, [fetchedPlan]);

  async function handleCreatePlan() {
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const newPlan = await createPlan.mutateAsync({ name, description });
      setCreatedPlan(newPlan);
      setName(newPlan.name);
      setDescription(newPlan.description ?? '');
      // Create a default day
      await createDay.mutateAsync({
        plan_id: newPlan.id,
        label: 'Tag A',
        sort_order: 0,
      });
      // Update URL without re-mounting
      window.history.replaceState(null, '', `/plans/${newPlan.id}/edit`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('Plan create error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePlan() {
    if (!plan || !name.trim()) return;
    try {
      await updatePlan.mutateAsync({ id: plan.id, name, description });
    } catch (err) {
      console.error('Plan update error:', err);
    }
  }

  async function handleAddDay() {
    if (!plan) return;
    const nextIndex = days?.length ?? 0;
    const label = `Tag ${String.fromCharCode(65 + nextIndex)}`;
    await createDay.mutateAsync({
      plan_id: plan.id,
      label,
      sort_order: nextIndex,
    });
  }

  async function handleDeleteDay() {
    if (!plan || !selectedDay) return;
    setShowDeleteDayConfirm(true);
  }

  async function confirmDeleteDay() {
    if (!plan || !selectedDay) return;
    setShowDeleteDayConfirm(false);
    await deleteDay.mutateAsync({ id: selectedDay.id, plan_id: plan.id });
    setSelectedDayIndex(Math.max(0, selectedDayIndex - 1));
  }

  async function handleUpdateDay(field: keyof Pick<PlanDay, 'label' | 'focus' | 'rounds' | 'round_pause'>, value: string | number) {
    if (!selectedDay || !plan) return;
    await updateDay.mutateAsync({ id: selectedDay.id, plan_id: plan.id, [field]: value });
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !exercises || !selectedDay) return;

    const oldIndex = exercises.findIndex((e) => e.id === active.id);
    const newIndex = exercises.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Update sort_order for moved items
    const reordered = [...exercises];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Batch update sort_orders
    for (let i = Math.min(oldIndex, newIndex); i <= Math.max(oldIndex, newIndex); i++) {
      const ex = reordered[i];
      if (ex.sort_order !== i) {
        updateExercise.mutate({ id: ex.id, day_id: selectedDay.id, sort_order: i });
      }
    }
  }, [exercises, selectedDay, updateExercise]);

  async function handleAddExercise(isWarmup: boolean) {
    if (!selectedDay) return;
    const nextOrder = exercises?.length ?? 0;
    await createExercise.mutateAsync({
      day_id: selectedDay.id,
      name: 'Neue Übung',
      work_seconds: isWarmup ? 30 : 45,
      pause_seconds: isWarmup ? 10 : 30,
      is_warmup: isWarmup,
      sort_order: nextOrder,
    });
  }

  async function handleUpdateExercise(id: string, field: keyof Pick<PlanExercise, 'name' | 'muscle_groups' | 'work_seconds' | 'pause_seconds'>, value: unknown) {
    if (!selectedDay) return;
    await updateExercise.mutateAsync({ id, day_id: selectedDay.id, [field]: value });
  }

  async function handleDeleteExercise(id: string) {
    if (!selectedDay) return;
    await deleteExercise.mutateAsync({ id, day_id: selectedDay.id });
  }

  // --- NEW PLAN FORM ---
  if (isNew && !createdPlan) {
    return (
      <div className="plan-editor">
        <div className="plan-editor-header">
          <button className="plan-editor-back" onClick={() => navigate('/plans')}>
            &larr; Zurück
          </button>
          <h2 className="plan-editor-title">Neuer Plan</h2>
        </div>
        <div className="plan-editor-form">
          <input
            className="plan-editor-input"
            placeholder="Plan-Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="plan-editor-textarea"
            placeholder="Beschreibung (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          {error && <p style={{ color: 'var(--color-rest)', fontSize: '0.875rem' }}>{error}</p>}
          <button
            className="plan-editor-save"
            onClick={handleCreatePlan}
            disabled={!name.trim() || saving}
          >
            {saving ? 'Erstelle...' : 'Plan erstellen'}
          </button>
        </div>
      </div>
    );
  }

  // --- LOADING ---
  if (!isNew && planLoading) {
    return (
      <div className="plan-editor">
        <p style={{ padding: 24, color: 'var(--text-secondary)' }}>Plan laden...</p>
      </div>
    );
  }

  // --- PLAN NOT FOUND ---
  if (!plan) {
    return (
      <div className="plan-editor">
        <div className="plan-editor-header">
          <button className="plan-editor-back" onClick={() => navigate('/plans')}>
            &larr; Zurück
          </button>
          <h2 className="plan-editor-title">Plan nicht gefunden</h2>
        </div>
      </div>
    );
  }

  // --- EDIT PLAN ---
  const warmupExercises = exercises?.filter((e) => e.is_warmup) ?? [];
  const kraftExercises = exercises?.filter((e) => !e.is_warmup) ?? [];

  return (
    <div className="plan-editor">
      <div className="plan-editor-header">
        <button className="plan-editor-back" onClick={() => navigate(`/plans/${plan.id}`)}>
          &larr; Zurück
        </button>
        <h2 className="plan-editor-title">Plan bearbeiten</h2>
      </div>

      <PlanForm
        name={name}
        description={description}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onSave={handleUpdatePlan}
      />

      {/* Day Tabs */}
      {days && (
        <DayTabs
          days={days}
          selectedIndex={selectedDayIndex}
          onSelect={setSelectedDayIndex}
          onAdd={handleAddDay}
        />
      )}

      {selectedDay && (
        <>
          <DayEditor
            day={selectedDay}
            planId={plan.id}
            onUpdateDay={handleUpdateDay}
            onDeleteDay={handleDeleteDay}
          />

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {/* Warmup Exercises */}
            <section className="plan-editor-section">
              <h3 className="plan-editor-section-label">Aufwärmen</h3>
              <SortableContext items={warmupExercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                {warmupExercises.map((ex) => (
                  <ExerciseSortable key={ex.id} id={ex.id}>
                    <ExerciseFields ex={ex} onUpdate={handleUpdateExercise} onDelete={handleDeleteExercise} />
                  </ExerciseSortable>
                ))}
              </SortableContext>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="plan-editor-add-exercise" style={{ flex: 1 }} onClick={() => handleAddExercise(true)}>
                  + Neue Übung
                </button>
                <button className="plan-editor-add-exercise" style={{ flex: 1 }} onClick={() => setShowPicker('warmup')}>
                  Aus Bibliothek
                </button>
              </div>
            </section>

            {/* Kraft Exercises */}
            <section className="plan-editor-section">
              <h3 className="plan-editor-section-label">Kraft</h3>
              <SortableContext items={kraftExercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                {kraftExercises.map((ex) => (
                  <ExerciseSortable key={ex.id} id={ex.id}>
                    <ExerciseFields ex={ex} onUpdate={handleUpdateExercise} onDelete={handleDeleteExercise} />
                  </ExerciseSortable>
                ))}
              </SortableContext>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="plan-editor-add-exercise" style={{ flex: 1 }} onClick={() => handleAddExercise(false)}>
                  + Neue Übung
                </button>
                <button className="plan-editor-add-exercise" style={{ flex: 1 }} onClick={() => setShowPicker('kraft')}>
                  Aus Bibliothek
                </button>
              </div>
            </section>
          </DndContext>
        </>
      )}

      {showPicker && selectedDay && (
        <LibraryPicker
          dayId={selectedDay.id}
          currentCount={exercises?.length ?? 0}
          isWarmup={showPicker === 'warmup'}
          onClose={() => setShowPicker(null)}
        />
      )}

      {showDeleteDayConfirm && selectedDay && (
        <ConfirmModal
          title="Tag löschen"
          message={`"${selectedDay.label}" und alle zugehörigen Übungen werden gelöscht.`}
          confirmLabel="Löschen"
          danger
          onCancel={() => setShowDeleteDayConfirm(false)}
          onConfirm={confirmDeleteDay}
        />
      )}
    </div>
  );
}

type ExerciseField = keyof Pick<PlanExercise, 'name' | 'muscle_groups' | 'work_seconds' | 'pause_seconds'>;

function ExerciseFields({ ex, onUpdate, onDelete }: {
  ex: PlanExercise;
  onUpdate: (id: string, field: ExerciseField, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="plan-editor-exercise">
      <div className="plan-editor-ex-row">
        <DebouncedInput
          className="plan-editor-ex-name"
          value={ex.name}
          onCommit={(v) => onUpdate(ex.id, 'name', v)}
        />
        <button className="plan-editor-ex-delete" onClick={() => onDelete(ex.id)}><Icon name="x-close" size={14} /></button>
      </div>
      <div className="plan-editor-ex-row">
        <label>
          Work <DebouncedInput type="number" value={ex.work_seconds} onCommit={(v) => onUpdate(ex.id, 'work_seconds', Number(v))} />s
        </label>
        <label>
          Pause <DebouncedInput type="number" value={ex.pause_seconds} onCommit={(v) => onUpdate(ex.id, 'pause_seconds', Number(v))} />s
        </label>
        <DebouncedInput
          className="plan-editor-ex-detail"
          value={ex.muscle_groups?.join(', ') ?? ''}
          onCommit={(v) => onUpdate(ex.id, 'muscle_groups', v ? v.split(',').map(s => s.trim()) : [])}
          placeholder="Muskel"
        />
      </div>
    </div>
  );
}
