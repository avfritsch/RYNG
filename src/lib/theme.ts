const STORAGE_KEY = 'ryng_theme';

export type Theme = 'dark' | 'light';

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  // Update theme-color meta tag for browser chrome
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'light' ? '#F5F5F5' : '#0A0A0A');
  }
}
