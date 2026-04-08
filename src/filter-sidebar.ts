import { state } from "./state.ts";
import { applyFilters, hasActiveFilters } from "./filters.ts";
import { langName, slugToLabel } from "./utils.ts";
import type { MonthPickerInstance } from "./types.ts";
import type { PillContainer } from "./filter-sidebar-utilities.ts";
import {
  collectDistinctValues,
  collectTopValues,
  FILTER_TOP_N,
  filterHiddenCount,
  PUBLISHER_AUTHOR_TOP_N,
} from "./filter-sidebar-utilities.ts";
import { renderResults } from "./render.ts";

// FILTER SIDEBAR
/////////////////

const PILL_TOOLTIPS: Record<string, string> = {
  "Kelsey Dionne": "Creator of Shadowdark",
  "The Arcane Library": "Publisher of Shadowdark",
};

// Returns topValues with any currently-selected values that didn't make the
// top-N appended at the end, so active filters are always visible.
function defaultVisibleValues(
  topValues: string[],
  allValues: string[],
  filterKey: string,
): string[] {
  const selected =
    (state.filters as unknown as Record<string, string[]>)[filterKey] || [];

  const topSet = new Set(topValues);

  const extras = selected.filter((v) =>
    !topSet.has(v) && allValues.includes(v)
  );

  return [...topValues, ...extras];
}

function setMoreNote(container: PillContainer, count: number): void {
  let note = container.nextElementSibling as HTMLElement | null;

  if (!note || !note.classList.contains("filter-more-note")) {
    note = document.createElement("p");
    note.className = "filter-more-note";
    container.insertAdjacentElement("afterend", note);
  }

  note.hidden = count <= 0;

  if (count > 0) note.textContent = `and ${count} more \u2014 search above`;

  container._hasOverflowNote = count > 0;
}

export function syncPillFade(container: PillContainer): void {
  if (container._hasOverflowNote) return;

  const content = container.closest(".filter-group-content");
  if (!content) return;

  const hasOverflow = container.scrollHeight > container.clientHeight + 2;
  const atEnd =
    container.scrollHeight - container.scrollTop <= container.clientHeight + 2;

  content.classList.toggle("has-pill-overflow", hasOverflow && !atEnd);
}

export function buildPills(
  container: PillContainer,
  values: string[],
  filterKey: string | undefined,
  labelFn: ((v: string) => string) | null | undefined,
): void {
  container.innerHTML = "";

  const selected = filterKey
    ? (state.filters as unknown as Record<string, string[]>)[filterKey] || []
    : [];

  for (const val of values) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill" + (selected.includes(val) ? " active" : "");
    btn.textContent = labelFn ? labelFn(val) : val;
    btn.dataset.value = val;
    btn.setAttribute("aria-pressed", selected.includes(val) ? "true" : "false");

    if (PILL_TOOLTIPS[val]) btn.title = PILL_TOOLTIPS[val];

    btn.addEventListener(
      "click",
      () => onPillToggle(filterKey || "", val, btn),
    );

    container.appendChild(btn);
  }

  if (!container._pillFadeListenerAttached) {
    container.addEventListener("scroll", () => syncPillFade(container));
    container._pillFadeListenerAttached = true;
  }

  if (container.clientHeight > 0) syncPillFade(container);
}

export function renderFilterSidebar(): void {
  const PRICING_LABELS: Record<string, string> = {
    free: "Free",
    paid: "Paid",
    pwyw: "Pay What You Want",
  };

  const pricingLabel = (v: string) => PRICING_LABELS[v] || slugToLabel(v);

  const fields: Array<{
    id: string;
    key: string;
    isArray: boolean;
    fn?: (v: string) => string;
    pinTop?: string[];
  }> = [
    { id: "filter-category", key: "categories", isArray: true },
    { id: "filter-pricing", key: "pricings", isArray: true, fn: pricingLabel },
    {
      id: "filter-system",
      key: "systems",
      isArray: true,
      pinTop: ["Shadowdark", "System-Agnostic"],
    },
    { id: "filter-environment", key: "envs", isArray: true },
    { id: "filter-themes", key: "themes", isArray: true },
    { id: "filter-languages", key: "languages", isArray: true, fn: langName },
  ];

  for (const { id, key, isArray, fn, pinTop } of fields) {
    const container = document.getElementById(id) as PillContainer | null;
    if (!container) continue;

    let allValues = collectDistinctValues(key, isArray);

    if (pinTop) {
      allValues = [
        ...pinTop.filter((v) => allValues.includes(v)),
        ...allValues.filter((v) => !pinTop.includes(v)),
      ];
    }

    let topValues = collectTopValues(key, isArray, FILTER_TOP_N);

    if (pinTop) {
      topValues = [
        ...pinTop.filter((v) => topValues.includes(v)),
        ...topValues.filter((v) => !pinTop.includes(v)),
      ];
    }

    buildPills(container, allValues, key, fn);

    container._allValues = allValues;
    container._topValues = topValues;
    container._filterKey = key;
    container._labelFn = fn;

    const searchInput = document.querySelector<HTMLElement>(
      `.filter-search-within[data-target="${id}"]`,
    );

    if (searchInput) searchInput.hidden = allValues.length <= FILTER_TOP_N;
  }

  // Searchable groups (capped at PUBLISHER_AUTHOR_TOP_N; note shown for overflow)
  const settingVals = collectDistinctValues("settings", true);
  const settingTop = collectTopValues("settings", true, PUBLISHER_AUTHOR_TOP_N);
  const SETTING_PIN = ["Setting-Agnostic", "Western Reaches"];
  const settingValsOrdered = [
    ...SETTING_PIN.filter((v) => settingVals.includes(v)),
    ...settingVals.filter((v) => !SETTING_PIN.includes(v)),
  ];
  const settingTopOrdered = [
    ...SETTING_PIN.filter((v) => settingTop.includes(v)),
    ...settingTop.filter((v) => !SETTING_PIN.includes(v)),
  ];

  const settingContainer = document.getElementById(
    "filter-setting",
  ) as PillContainer | null;
  if (settingContainer) {
    const settingVisible = defaultVisibleValues(
      settingTopOrdered,
      settingValsOrdered,
      "settings",
    );

    buildPills(settingContainer, settingVisible, "settings", null);

    setMoreNote(
      settingContainer,
      filterHiddenCount(settingValsOrdered.length, settingVisible.length),
    );

    settingContainer._allValues = settingValsOrdered;
    settingContainer._topValues = settingTopOrdered;
    settingContainer._filterKey = "settings";
    settingContainer._labelFn = null;
    settingContainer._hasTopNCap = true;

    const settingSearch = document.querySelector<HTMLElement>(
      '.filter-search-within[data-target="filter-setting"]',
    );

    if (settingSearch) {
      settingSearch.hidden =
        settingValsOrdered.length <= PUBLISHER_AUTHOR_TOP_N;
    }
  }

  const publisherVals = collectDistinctValues("pub", false);
  const publisherTop = collectTopValues("pub", false, PUBLISHER_AUTHOR_TOP_N);
  const authorVals = collectDistinctValues("authors", true);
  const authorTop = collectTopValues("authors", true, PUBLISHER_AUTHOR_TOP_N);

  const pubContainer = document.getElementById(
    "filter-publisher",
  ) as PillContainer | null;
  if (pubContainer) {
    const pubVisible = defaultVisibleValues(publisherTop, publisherVals, "pub");

    buildPills(pubContainer, pubVisible, "pub", (v) => v);

    setMoreNote(
      pubContainer,
      filterHiddenCount(publisherVals.length, pubVisible.length),
    );

    pubContainer._allValues = publisherVals;
    pubContainer._topValues = publisherTop;
    pubContainer._filterKey = "pub";
    pubContainer._labelFn = (v) => v;
    pubContainer._hasTopNCap = true;

    const pubSearch = document.querySelector<HTMLElement>(
      '.filter-search-within[data-target="filter-publisher"]',
    );

    if (pubSearch) {
      pubSearch.hidden = publisherVals.length <= PUBLISHER_AUTHOR_TOP_N;
    }
  }

  const authorContainer = document.getElementById(
    "filter-authors",
  ) as PillContainer | null;

  if (authorContainer) {
    const authorVisible = defaultVisibleValues(
      authorTop,
      authorVals,
      "authors",
    );

    buildPills(authorContainer, authorVisible, "authors", (v) => v);

    setMoreNote(
      authorContainer,
      filterHiddenCount(authorVals.length, authorVisible.length),
    );

    authorContainer._allValues = authorVals;
    authorContainer._topValues = authorTop;
    authorContainer._filterKey = "authors";
    authorContainer._labelFn = (v) => v;
    authorContainer._hasTopNCap = true;

    const authorSearch = document.querySelector<HTMLElement>(
      '.filter-search-within[data-target="filter-authors"]',
    );

    if (authorSearch) {
      authorSearch.hidden = authorVals.length <= PUBLISHER_AUTHOR_TOP_N;
    }
  }

  const charOptVals = collectDistinctValues("character_options", true);
  const charOptTop = collectTopValues(
    "character_options",
    true,
    PUBLISHER_AUTHOR_TOP_N,
  );

  const charOptContainer = document.getElementById(
    "filter-character-options",
  ) as PillContainer | null;

  if (charOptContainer) {
    const charOptVisible = defaultVisibleValues(
      charOptTop,
      charOptVals,
      "character_options",
    );

    buildPills(charOptContainer, charOptVisible, "character_options", (v) => v);

    setMoreNote(
      charOptContainer,
      filterHiddenCount(charOptVals.length, charOptVisible.length),
    );

    charOptContainer._allValues = charOptVals;
    charOptContainer._topValues = charOptTop;
    charOptContainer._filterKey = "character_options";
    charOptContainer._labelFn = (v) => v;
    charOptContainer._hasTopNCap = true;

    const charOptSearch = document.querySelector<HTMLElement>(
      '.filter-search-within[data-target="filter-character-options"]',
    );

    if (charOptSearch) {
      charOptSearch.hidden = charOptVals.length <= PUBLISHER_AUTHOR_TOP_N;
    }
  }

  syncFilterControlStates();
}

interface MonthPickerInput extends HTMLInputElement {
  _monthPicker?: MonthPickerInstance;
}

export function syncFilterControlStates(): void {
  const f = state.filters;

  (document.getElementById("has-character-options") as HTMLInputElement)
    .checked = f.hasCharacterOptions;
  (document.getElementById("toggle-official") as HTMLInputElement).checked =
    f.official;
  (document.getElementById("toggle-upcoming") as HTMLInputElement).checked =
    f.upcoming;
  (document.getElementById(
    "exclude-unspecified-level",
  ) as HTMLInputElement).checked = f.excludeUnspecifiedLevel;
  (document.getElementById(
    "exclude-unspecified-party",
  ) as HTMLInputElement).checked = f.excludeUnspecifiedParty;
  (document.getElementById("level-min") as HTMLInputElement).value =
    f.lmin !== null ? String(f.lmin) : "";
  (document.getElementById("level-max") as HTMLInputElement).value =
    f.lmax !== null ? String(f.lmax) : "";
  (document.getElementById("party-min") as HTMLInputElement).value =
    f.pmin !== null ? String(f.pmin) : "";
  (document.getElementById("party-max") as HTMLInputElement).value =
    f.pmax !== null ? String(f.pmax) : "";

  const fromInput = document.getElementById("date-from") as
    | MonthPickerInput
    | null;
  if (fromInput && fromInput._monthPicker) {
    fromInput._monthPicker.setValue(f.dmin);
  }

  const toInput = document.getElementById("date-to") as
    | MonthPickerInput
    | null;
  if (toInput && toInput._monthPicker) {
    toInput._monthPicker.setValue(f.dmax);
  }

  (document.getElementById("search-input") as HTMLInputElement).value =
    state.query;
  (document.getElementById("sort-select") as HTMLSelectElement).value =
    state.sort;

  const sortReverseBtn = document.getElementById("sort-reverse");
  if (sortReverseBtn) {
    sortReverseBtn.textContent = state.sortReverse ? "\u2193" : "\u2191";
    sortReverseBtn.setAttribute("aria-pressed", String(state.sortReverse));
  }

  const reshuffleBtn = document.getElementById("sort-reshuffle");
  if (reshuffleBtn) {
    reshuffleBtn.hidden = state.sort !== "shuffle";
  }
}

export function updateClearButton(): void {
  const btn = document.getElementById("clear-filters");
  if (btn) (btn as HTMLButtonElement).disabled = !hasActiveFilters();
  syncFilterGroupIndicators();
}

function syncFilterGroupIndicators(): void {
  const f = state.filters;

  // pill-based groups: show a numeric count when > 0
  // range/checkbox groups: show a dot when any control is active
  const groups: Array<{ key: string; active: boolean; count: number }> = [
    {
      key: "category",
      active: f.categories.length > 0,
      count: f.categories.length,
    },
    { key: "pricing", active: f.pricings.length > 0, count: f.pricings.length },
    { key: "systems", active: f.systems.length > 0, count: f.systems.length },
    {
      key: "settings",
      active: f.settings.length > 0,
      count: f.settings.length,
    },
    { key: "envs", active: f.envs.length > 0, count: f.envs.length },
    { key: "themes", active: f.themes.length > 0, count: f.themes.length },
    { key: "pub", active: f.pub.length > 0, count: f.pub.length },
    { key: "authors", active: f.authors.length > 0, count: f.authors.length },
    {
      key: "character_options",
      active: f.character_options.length > 0 || f.hasCharacterOptions,
      count: f.character_options.length + (f.hasCharacterOptions ? 1 : 0),
    },
    {
      key: "languages",
      active: f.languages.length > 0,
      count: f.languages.length,
    },
    {
      key: "level",
      active: f.lmin !== null || f.lmax !== null || f.excludeUnspecifiedLevel,
      count: (f.lmin !== null ? 1 : 0) + (f.lmax !== null ? 1 : 0) +
        (f.excludeUnspecifiedLevel ? 1 : 0),
    },
    {
      key: "party",
      active: f.pmin !== null || f.pmax !== null || f.excludeUnspecifiedParty,
      count: (f.pmin !== null ? 1 : 0) + (f.pmax !== null ? 1 : 0) +
        (f.excludeUnspecifiedParty ? 1 : 0),
    },
    {
      key: "date",
      active: f.dmin !== null || f.dmax !== null,
      count: (f.dmin !== null ? 1 : 0) + (f.dmax !== null ? 1 : 0),
    },
  ];

  let totalActive = 0;

  for (const { key, active, count } of groups) {
    if (active) ++totalActive;

    const btn = document.querySelector<HTMLElement>(
      `.filter-group-toggle[data-filter-key="${key}"]`,
    );

    if (!btn) continue;

    let badge = btn.querySelector<HTMLElement>(".filter-active-badge");

    if (active) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "filter-active-badge";
        badge.setAttribute("aria-hidden", "true");
        btn.insertBefore(badge, btn.querySelector(".filter-group-chevron"));
      }

      badge.textContent = String(count);
    } else if (badge) {
      badge.remove();
    }
  }

  // Update mobile filter toggle button
  const mobileBtn = document.getElementById("mobile-filter-toggle");

  if (mobileBtn) {
    let mobileBadge = mobileBtn.querySelector<HTMLElement>(
      ".filter-active-badge",
    );

    if (totalActive > 0) {
      if (!mobileBadge) {
        mobileBadge = document.createElement("span");
        mobileBadge.className = "filter-active-badge";
        mobileBadge.setAttribute("aria-hidden", "true");
        mobileBtn.appendChild(mobileBadge);
      }
      mobileBadge.textContent = String(totalActive);
    } else if (mobileBadge) {
      mobileBadge.remove();
    }
  }
}

function onPillToggle(
  key: string,
  value: string,
  btn: HTMLElement,
): void {
  const arr = (state.filters as unknown as Record<string, string[]>)[key];
  const idx = arr.indexOf(value);

  if (idx === -1) arr.push(value);
  else arr.splice(idx, 1);

  const isActive = arr.includes(value);
  btn.classList.toggle("active", isActive);
  btn.setAttribute("aria-pressed", isActive ? "true" : "false");

  state.page = 1;
  state.expandedCardId = null;

  applyFilters();
  renderResults();
  updateClearButton();
}
