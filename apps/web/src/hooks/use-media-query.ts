import { useSyncExternalStore } from 'react';

/** Subscribes to a CSS media query (e.g. "(max-width: 767px)"). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Phones (< 768 px, UI.md §7). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
