"use client";

import { useCallback, useEffect, useState } from "react";
import { HOSPITALS, type Hospital } from "@/data/hospitals";

const STORAGE_KEY = "bc-medicals-hospitals";

/**
 * Returns the seed hospitals merged with any added through the UI
 * (persisted per-browser in localStorage), plus an `addHospital` helper.
 */
export function useHospitals() {
  const [custom, setCustom] = useState<Hospital[]>([]);

  // Load saved hospitals after mount (avoids SSR/hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCustom(JSON.parse(raw));
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  const addHospital = useCallback((name: string, address: string): Hospital => {
    const entry: Hospital = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
    };
    setCustom((prev) => {
      const next = [...prev, entry];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore unwritable storage */
      }
      return next;
    });
    return entry;
  }, []);

  return { hospitals: [...HOSPITALS, ...custom], addHospital };
}
