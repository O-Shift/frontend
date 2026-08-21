'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
});

/**
 * The initial <html data-theme> and the DOM at first paint are set by the
 * inline script in src/app/layout.tsx, which runs while the browser is still
 * parsing <head>. This provider must NOT gate rendering on a mount effect —
 * it used to return null until one had run, which made the server render an
 * empty <body> and left every page blank until the bundle hydrated, ahead of
 * any loading.tsx skeleton. Instead the effect below re-reads the same storage
 * (it can't assume the inline script ran — e.g. the script runs only on hard
 * loads, and localStorage can throw) and keeps React's state in sync with the
 * attribute it set. The server-rendered theme ('dark', matching :root) may
 * differ from the resolved one for a light-mode user; the only visible effect
 * is the two small toggle controls (icon + switch) re-rendering after
 * hydration, which is the trade the guide's inline-script pattern prescribes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('oshift-theme') as Theme | null;
    const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const resolved = stored ?? preferred;
    // Intentional hydration sync matching the inline pre-paint script pattern in layout.tsx:
    // React state must re-read localStorage after mount so the toggle controls render the resolved theme.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  const toggle = () => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('oshift-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
