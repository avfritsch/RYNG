interface PlanFormProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
}

export function PlanForm({ name, description, onNameChange, onDescriptionChange, onSave }: PlanFormProps) {
  return (
    <div className="plan-editor-form">
      <input
        className="plan-editor-input"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onBlur={onSave}
        placeholder="Plan-Name"
      />
      <textarea
        className="plan-editor-textarea"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        onBlur={onSave}
        placeholder="Beschreibung"
        rows={2}
      />
    </div>
  );
}
