const KEY = 'ryng_weekly_goal';

export function getWeeklyGoal(): number | null {
  const v = localStorage.getItem(KEY);
  return v ? Number(v) : null;
}

export function setWeeklyGoal(n: number | null): void {
  if (n === null) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, String(n));
}
