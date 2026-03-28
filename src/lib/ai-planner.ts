import { supabase } from './supabase.ts';
import type { StationConfig } from '../types/timer.ts';

export interface PlanRequest {
  focus: string;
  equipment: string[];
  durationMinutes: number;
  rounds: number;
  notes: string;
}

export interface GeneratedPlan {
  name: string;
  description: string;
  stations: StationConfig[];
  rounds: number;
  roundPause: number;
}

export async function generatePlan(request: PlanRequest): Promise<GeneratedPlan> {
  const { data, error } = await supabase.functions.invoke('generate-plan', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Fehler bei der Plan-Generierung');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // Validate the response structure
  if (!data.stations || !Array.isArray(data.stations)) {
    throw new Error('Ungültiger Plan vom KI-Service');
  }

  // Ensure all stations have required fields
  const stations: StationConfig[] = data.stations.map((s: Record<string, unknown>) => ({
    name: String(s.name || 'Übung'),
    workSeconds: Number(s.workSeconds) || 45,
    pauseSeconds: Number(s.pauseSeconds) || 30,
    isWarmup: Boolean(s.isWarmup),
    howto: String(s.howto || ''),
  }));

  return {
    name: String(data.name || 'KI-Plan'),
    description: String(data.description || ''),
    stations,
    rounds: Number(data.rounds) || 3,
    roundPause: Number(data.roundPause) || 90,
  };
}
