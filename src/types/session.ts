export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  finished_at: string;
  duration_sec: number;
  rounds: number;
  station_count: number;
  plan_day_id: string | null;
  mesocycle_week: number | null;
  created_at: string;
}

export interface SessionEntry {
  id: string;
  session_id: string;
  station_index: number;
  station_name: string;
  is_warmup: boolean;
  work_seconds: number;
  actual_seconds: number | null;
  weight_kg: number | null;
  reps: number | null;
  notes: string | null;
  round_number: number;
}
