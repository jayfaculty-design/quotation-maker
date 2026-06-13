"use client";

import { useEffect, useState } from "react";

/**
 * Drop-in replacement for useState that persists to localStorage.
 *
 * SSR-safe: the first render always uses `initial` (matching the server),
 * then the stored value is loaded after mount. Saving is gated behind a
 * `loaded` flag so the initial default never overwrites a saved value.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore unreadable/corrupt storage */
    }
    setLoaded(true);
  }, [key]);

  // Save on every change, but only after the initial load has happened.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore unwritable storage */
    }
  }, [key, state, loaded]);

  return [state, setState] as const;
}
