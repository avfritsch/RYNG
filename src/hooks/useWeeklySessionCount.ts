import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase.ts';
import { queryKeys } from '../lib/query-keys.ts';

function getMondayOfCurrentWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useWeeklySessionCount(): number {
  const monday = getMondayOfCurrentWeek();

  const { data } = useQuery({
    queryKey: [...queryKeys.sessions('weekly-goal'), monday],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', monday);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return data ?? 0;
}
