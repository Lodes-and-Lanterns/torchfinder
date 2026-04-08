import { state } from "./state.ts";

// PILL_CONTAINER
/////////////////

export interface PillContainer extends HTMLElement {
  _allValues?: string[];
  _topValues?: string[];
  _filterKey?: string;
  _labelFn?: ((v: string) => string) | null;
  _pillFadeListenerAttached?: boolean;
  _hasTopNCap?: boolean;
  _hasOverflowNote?: boolean;
}

// FILTER SIDEBAR UTILITIES
///////////////////////////

export const FILTER_TOP_N = 8;
export const PUBLISHER_AUTHOR_TOP_N = 20;

/** Returns how many values are hidden behind the search input (total minus visible). */
export function filterHiddenCount(
  totalCount: number,
  visibleCount: number,
): number {
  return Math.max(0, totalCount - visibleCount);
}

export function collectDistinctValues(
  field: string,
  isArray: boolean,
): string[] {
  const values = new Set<string>();

  for (const entry of state.data!) {
    const raw = (entry as unknown as Record<string, unknown>)[field];
    if (isArray) {
      for (const v of (raw as string[] | undefined) || []) values.add(v);
    } else if (raw != null && raw !== "") {
      values.add(raw as string);
    }
  }

  return [...values].sort();
}

// Ties broken alphabetically.
export function collectTopValues(
  field: string,
  isArray: boolean,
  n: number,
): string[] {
  const counts = new Map<string, number>();

  for (const entry of state.data!) {
    const raw = (entry as unknown as Record<string, unknown>)[field];
    const vals = isArray
      ? (raw as string[] | undefined) || []
      : raw != null && raw !== ""
      ? [raw as string]
      : [];

    for (const v of vals) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([v]) => v);
}
