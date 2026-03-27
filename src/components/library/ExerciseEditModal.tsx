import { useState } from 'react';
import { useUpdateLibraryExercise, useCreateLibraryExercise } from '../../hooks/useExerciseLibrary.ts';
import { CATEGORY_LABELS, EQUIPMENT_OPTIONS, MUSCLE_GROUP_OPTIONS, type ExerciseCategory } from '../../types/exercise-library.ts';
import type { LibraryExercise } from '../../types/exercise-library.ts';
import { Icon } from '../ui/Icon.tsx';
import { toast } from '../../stores/toast-store.ts';
import '../../styles/exercise-edit-modal.css';

interface ExerciseEditModalProps {
  exercise?: LibraryExercise | null; // null = create mode
  onClose: () => void;
}

export function ExerciseEditModal({ exercise, onClose }: ExerciseEditModalProps) {
  const isCreate = !exercise;
  const isSystem = exercise?.created_by === null;

  const [name, setName] = useState(exercise?.name ?? '');
  const [detail, setDetail] = useState(exercise?.detail ?? '');
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscle_group ?? '');
  const [category, setCategory] = useState<ExerciseCategory>(exercise?.category ?? 'strength');
  const [howto, setHowto] = useState(exercise?.howto ?? '');
  const [equipment, setEquipment] = useState<string[]>(exercise?.equipment ?? []);
  const [isPublic, setIsPublic] = useState(exercise?.is_public ?? false);
  const [error, setError] = useState('');
  const updateExercise = useUpdateLibraryExercise();
  const createExercise = useCreateLibraryExercise();

  function handleSave() {
    setError('');
    const data = {
      name,
      detail: detail || undefined,
      muscle_group: muscleGroup || undefined,
      category,
      howto: howto || undefined,
      equipment,
    };

    if (isCreate || isSystem) {
      createExercise.mutate({ ...data, is_public: isPublic }, {
        onSuccess: () => {
          toast.success(isSystem ? 'Persönliche Kopie erstellt' : 'Übung erstellt');
          onClose();
        },
        onError: (err) => setError(err instanceof Error ? err.message : 'Fehler'),
      });
    } else {
      updateExercise.mutate({ id: exercise.id, ...data, is_public: isPublic }, {
        onSuccess: onClose,
        onError: (err) => setError(err instanceof Error ? err.message : 'Fehler'),
      });
    }
  }

  function toggleEquipment(eq: string) {
    setEquipment((prev) => prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]);
  }

  const title = isCreate ? 'Neue Übung' : isSystem ? 'Übung kopieren' : 'Übung bearbeiten';
  const saveLabel = isCreate ? 'Erstellen' : isSystem ? 'Als Kopie speichern' : 'Speichern';
  const isPending = updateExercise.isPending || createExercise.isPending;

  return (
    <div className="edit-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-header">
          <h3>{title}</h3>
          <button className="edit-close" onClick={onClose} aria-label="Schließen">
            <Icon name="x-close" size={18} />
          </button>
        </div>

        {isSystem && (
          <p className="edit-system-hint">
            System-Übung — Änderungen werden als persönliche Kopie gespeichert.
          </p>
        )}

        <div className="edit-form">
          <label className="edit-field">
            <span>Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="edit-field">
            <span>Beschreibung</span>
            <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Kurzbeschreibung" />
          </label>

          <label className="edit-field">
            <span>Kategorie</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as ExerciseCategory)}>
              {(Object.entries(CATEGORY_LABELS) as [ExerciseCategory, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>

          <label className="edit-field">
            <span>Muskelgruppe</span>
            <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
              <option value="">Keine</option>
              {MUSCLE_GROUP_OPTIONS.map((mg) => (
                <option key={mg} value={mg}>{mg}</option>
              ))}
            </select>
          </label>

          <div className="edit-field">
            <span>Equipment</span>
            <div className="edit-equipment-chips">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  className={`edit-eq-chip ${equipment.includes(eq) ? 'edit-eq-chip--active' : ''}`}
                  onClick={() => toggleEquipment(eq)}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <label className="edit-field">
            <span>Anleitung</span>
            <textarea value={howto} onChange={(e) => setHowto(e.target.value)} rows={4} placeholder="Ausführungshinweise..." />
          </label>

          {!isSystem && (
            <label className="edit-public-toggle">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Öffentlich sichtbar für andere User</span>
            </label>
          )}
        </div>

        {error && <p className="edit-error" role="alert">{error}</p>}

        <div className="edit-actions">
          <button className="edit-cancel" onClick={onClose}>Abbrechen</button>
          <button className="edit-save" onClick={handleSave} disabled={!name.trim() || isPending}>
            {isPending ? 'Speichern...' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
