"use client";

import { usePersistentState } from "./usePersistentState";

/**
 * A saved assembly: a snapshot of the workspace inputs (whatever `T` is),
 * plus an id and a save timestamp. Stored per entity + document type so each
 * workspace keeps its own list of recent assemblies that can be reopened and
 * edited later.
 */
export interface SavedAssembly<T> {
  id: string;
  savedAt: number;
  data: T;
}

const MAX_ASSEMBLIES = 25;

export function useAssemblies<T>(entitySlug: string, docTypeSlug: string) {
  const [assemblies, setAssemblies] = usePersistentState<SavedAssembly<T>[]>(
    `${entitySlug}-${docTypeSlug}-assemblies`,
    [],
  );

  // Save a snapshot. When `id` matches an existing assembly it's updated in
  // place (editing); otherwise a new entry is created. Returns the entry's id.
  const saveAssembly = (data: T, id?: string | null): string => {
    const savedAt = Date.now();
    const exists = !!id && assemblies.some((a) => a.id === id);
    const newId = exists
      ? (id as string)
      : `${savedAt.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    setAssemblies((prev) =>
      exists
        ? prev.map((a) => (a.id === id ? { ...a, data, savedAt } : a))
        : [{ id: newId, savedAt, data }, ...prev].slice(0, MAX_ASSEMBLIES),
    );
    return newId;
  };

  const removeAssembly = (id: string) =>
    setAssemblies((prev) => prev.filter((a) => a.id !== id));

  // Most-recently-saved first, even after in-place updates.
  const sorted = [...assemblies].sort((a, b) => b.savedAt - a.savedAt);

  return { assemblies: sorted, saveAssembly, removeAssembly };
}
