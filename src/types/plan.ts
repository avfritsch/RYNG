export interface Plan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_public: boolean;
  vote_count: number;
  copy_count: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface PlanDay {
  id: string;
  plan_id: string;
  label: string;
  focus: string | null;
  sort_order: number;
  rounds: number;
  round_pause: number;
  warmup_pause: number;
  created_at: string;
}

export interface PlanExercise {
  id: string;
  day_id: string;
  name: string;
  muscle_groups: string[];
  howto: string | null;
  animation_key: string | null;
  is_warmup: boolean;
  work_seconds: number;
  pause_seconds: number;
  sort_order: number;
  created_at: string;
}
