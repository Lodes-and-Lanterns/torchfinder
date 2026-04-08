import { SEARCH_DEBOUNCE_MS, state } from "./state.ts";
import { debounce } from "./utils.ts";
import { applyFilters, sortFiltered } from "./filters.ts";
import type { PillContainer } from "./filter-sidebar-utilities.ts";
import {
  buildPills,
  renderFilterSidebar,
  syncFilterControlStates,
} from "./filter-sidebar.ts";
import { renderListPanel } from "./list-view.ts";
import { renderResults } from "./render.ts";

export const debouncedSearch = debounce((value) => {
  state.query = value as string;
  state.page = 1;
  state.expandedCardId = null;
  applyFilters();
  renderResults();
}, SEARCH_DEBOUNCE_MS);

export function onSortChange(value: string): void {
  state.sort = value;
  state.sortReverse = false;
  sortFiltered();
  state.page = 1;
  syncFilterControlStates();
  renderResults();

  if (value === "shuffle") {
    const btn = document.getElementById("sort-reshuffle");

    if (btn) {
      btn.classList.remove("pulsing");

      requestAnimationFrame(() => {
        btn.classList.add("pulsing");

        btn.addEventListener(
          "animationend",
          () => btn.classList.remove("pulsing"),
          { once: true },
        );
      });
    }
  }
}

export function onRangeChange(): void {
  const levelMin = document.getElementById("level-min") as HTMLInputElement;
  const levelMax = document.getElementById("level-max") as HTMLInputElement;
  const partyMin = document.getElementById("party-min") as HTMLInputElement;
  const partyMax = document.getElementById("party-max") as HTMLInputElement;
  const levelRangeWarning = document.getElementById(
    "level-range-warning",
  ) as HTMLElement;
  const partyRangeWarning = document.getElementById(
    "party-range-warning",
  ) as HTMLElement;

  state.filters.lmin = levelMin.value !== ""
    ? parseInt(levelMin.value, 10)
    : null;

  state.filters.lmax = levelMax.value !== ""
    ? parseInt(levelMax.value, 10)
    : null;

  state.filters.pmin = partyMin.value !== ""
    ? parseInt(partyMin.value, 10)
    : null;

  state.filters.pmax = partyMax.value !== ""
    ? parseInt(partyMax.value, 10)
    : null;

  const levelInvalid = state.filters.lmin !== null &&
    state.filters.lmax !== null &&
    state.filters.lmin > state.filters.lmax;

  const partyInvalid = state.filters.pmin !== null &&
    state.filters.pmax !== null &&
    state.filters.pmin > state.filters.pmax;

  levelRangeWarning.hidden = !levelInvalid;
  partyRangeWarning.hidden = !partyInvalid;

  state.page = 1;

  applyFilters();
  renderResults();
}

export function onClearFilters(): void {
  state.filters = {
    categories: [],
    systems: [],
    settings: [],
    envs: [],
    themes: [],
    languages: [],
    pub: [],
    authors: [],
    pricings: [],
    character_options: [],
    hasCharacterOptions: false,
    official: false,
    upcoming: false,
    excludeUnspecifiedLevel: false,
    excludeUnspecifiedParty: false,
    lmin: null,
    lmax: null,
    pmin: null,
    pmax: null,
    dmin: null,
    dmax: null,
  };

  state.query = "";
  state.page = 1;
  state.expandedCardId = null;

  // Reset search-within inputs
  document.querySelectorAll<HTMLInputElement>(".filter-search-within").forEach(
    (input) => {
      input.value = "";

      const targetId = input.dataset.target;
      const container = targetId
        ? document.getElementById(targetId) as PillContainer | null
        : null;

      if (container && container._topValues) {
        buildPills(
          container,
          container._topValues,
          container._filterKey,
          container._labelFn,
        );
      }
    },
  );

  renderFilterSidebar();
  applyFilters();
  renderResults();
}

export function openFilterPanel(): void {
  const sidebar = document.getElementById("filter-sidebar")!;
  const overlay = document.getElementById("filter-overlay")!;
  const toggle = document.getElementById("mobile-filter-toggle")!;

  sidebar.classList.add("open");
  sidebar.removeAttribute("aria-hidden");
  overlay.classList.add("active");
  toggle.setAttribute("aria-expanded", "true");

  const first = sidebar.querySelector<HTMLElement>(
    "button:not([disabled]), input:not([disabled])",
  );

  if (first) first.focus();

  sidebar.addEventListener("keydown", trapFocus);
}

export function closeFilterPanel(): void {
  const sidebar = document.getElementById("filter-sidebar")!;
  const overlay = document.getElementById("filter-overlay")!;
  const toggle = document.getElementById("mobile-filter-toggle")!;

  sidebar.classList.remove("open");
  sidebar.setAttribute("aria-hidden", "true");
  overlay.classList.remove("active");
  toggle.setAttribute("aria-expanded", "false");
  toggle.focus();

  sidebar.removeEventListener("keydown", trapFocus);
}

export function openListPanel(): void {
  const panel = document.getElementById("list-panel")!;
  const overlay = document.getElementById("list-overlay")!;
  const toggle = document.getElementById("mobile-list-toggle");

  renderListPanel();

  panel.classList.add("open");
  panel.removeAttribute("aria-hidden");
  overlay.classList.add("active");

  if (toggle) toggle.setAttribute("aria-expanded", "true");

  const first = panel.querySelector<HTMLElement>(
    "button:not([disabled]), input:not([disabled])",
  );

  if (first) first.focus();
}

export function closeListPanel(): void {
  const panel = document.getElementById("list-panel")!;
  const overlay = document.getElementById("list-overlay")!;
  const toggle = document.getElementById("mobile-list-toggle");

  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  overlay.classList.remove("active");

  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus({ preventScroll: true });
  }
}

export function trapFocus(e: KeyboardEvent): void {
  if (e.key !== "Tab") return;

  const sidebar = document.getElementById("filter-sidebar")!;

  const focusable = sidebar.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
