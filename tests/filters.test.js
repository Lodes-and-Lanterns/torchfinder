import { assertEquals } from "@std/assert";
import { state } from "../scripts/state.js";
import {
  applyFilters,
  clearShuffleCache,
  hasActiveFilters,
  matchesText,
  rangesOverlap,
  sortFiltered,
} from "../scripts/filters.js";

// Utilities
////////////

function resetState() {
  state.data = null;
  state.filtered = [];
  state.query = "";
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
  state.sort = "title";
  state.sortReverse = false;
  state.page = 1;
  state.directId = null;
  state.expandedCardId = null;
}

function makeEntry(overrides = {}) {
  return {
    id: "test-entry",
    title: "Test Entry",
    desc: "A test adventure.",
    authors: ["Test Author"],
    pub: "Test Publisher",
    categories: ["Adventure"],
    systems: ["Shadowdark"],
    settings: ["Western Reaches"],
    envs: ["Dungeon"],
    themes: ["Horror"],
    languages: ["en"],
    pricings: ["paid"],
    date: "2024-01-01",
    lmin: 1,
    lmax: 3,
    pmin: 3,
    pmax: 5,
    children: [],
    ...overrides,
  };
}

// HAS_ACTIVE_FILTERS
///////////////////

Deno.test("hasActiveFilters: clean state returns false", () => {
  resetState();
  assertEquals(hasActiveFilters(), false);
});

Deno.test("hasActiveFilters: non-empty query returns true", () => {
  resetState();
  state.query = "shadowdark";
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: category filter set returns true", () => {
  resetState();
  state.filters.categories = ["Adventure"];
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: pricing filter returns true", () => {
  resetState();
  state.filters.pricings = ["free"];
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: character_options filter returns true", () => {
  resetState();
  state.filters.character_options = ["Witch"];
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: hasCharacterOptions toggle returns true", () => {
  resetState();
  state.filters.hasCharacterOptions = true;
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: official toggle returns true", () => {
  resetState();
  state.filters.official = true;
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: upcoming toggle returns true", () => {
  resetState();
  state.filters.upcoming = true;
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: lmin set returns true", () => {
  resetState();
  state.filters.lmin = 1;
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: lmax set returns true", () => {
  resetState();
  state.filters.lmax = 5;
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: pmin set returns true", () => {
  resetState();
  state.filters.pmin = 2;
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: excludeUnspecifiedLevel returns true", () => {
  resetState();
  state.filters.excludeUnspecifiedLevel = true;
  assertEquals(hasActiveFilters(), true);
});

// MATCHES_TEXT
//////////////

const sampleEntry = {
  title: "The Tomb of Ash",
  desc: "Something refuses to stay dead.",
  authors: ["Mara Thornfield"],
  pub: "Lantern & Quill Press",
};

Deno.test("matchesText: matches by title", () => {
  assertEquals(matchesText(sampleEntry, "tomb"), true);
});

Deno.test("matchesText: title match is case-insensitive", () => {
  assertEquals(matchesText(sampleEntry, "TOMB"), true);
});

Deno.test("matchesText: matches by desc", () => {
  assertEquals(matchesText(sampleEntry, "refuses"), true);
});

Deno.test("matchesText: matches by author", () => {
  assertEquals(matchesText(sampleEntry, "thornfield"), true);
});

Deno.test("matchesText: matches by publisher", () => {
  assertEquals(matchesText(sampleEntry, "lantern"), true);
});

Deno.test("matchesText: no match returns false", () => {
  assertEquals(matchesText(sampleEntry, "dragons"), false);
});

Deno.test("matchesText: partial word match works", () => {
  assertEquals(matchesText(sampleEntry, "ash"), true);
});

Deno.test("matchesText: matches by character option name", () => {
  assertEquals(
    matchesText(
      { ...sampleEntry, character_options: ["Witch", "Warlock"] },
      "witch",
    ),
    true,
  );
});

Deno.test("matchesText: no match when character option absent", () => {
  assertEquals(
    matchesText({ ...sampleEntry, character_options: ["Fighter"] }, "wizard"),
    false,
  );
});

// RANGES_OVERLAP
////////////////

Deno.test("rangesOverlap: no filter (both null) always passes", () => {
  assertEquals(rangesOverlap(1, 3, null, null, false), true);
});

Deno.test("rangesOverlap: no filter passes when entry has no range either", () => {
  assertEquals(rangesOverlap(null, null, null, null, false), true);
});

Deno.test("rangesOverlap: unspecified entry, excludeUnspecified false -> passes", () => {
  assertEquals(rangesOverlap(null, null, 1, 5, false), true);
});

Deno.test("rangesOverlap: unspecified entry, excludeUnspecified true -> fails", () => {
  assertEquals(rangesOverlap(null, null, 1, 5, true), false);
});

Deno.test("rangesOverlap: fully overlapping ranges pass", () => {
  assertEquals(rangesOverlap(1, 5, 2, 4, false), true);
});

Deno.test("rangesOverlap: partially overlapping ranges pass", () => {
  assertEquals(rangesOverlap(1, 3, 2, 5, false), true);
});

Deno.test("rangesOverlap: non-overlapping ranges fail", () => {
  assertEquals(rangesOverlap(1, 2, 5, 8, false), false);
});

Deno.test("rangesOverlap: ranges touching exactly at boundary pass", () => {
  assertEquals(rangesOverlap(1, 3, 3, 5, false), true);
});

Deno.test("rangesOverlap: null entry max treated as Infinity", () => {
  // entry covers 5+, filter covers 10-20 - overlap
  assertEquals(rangesOverlap(5, null, 10, 20, false), true);
});

Deno.test("rangesOverlap: null filter max treated as Infinity", () => {
  // entry covers 10-20, filter covers 5+ - overlap
  assertEquals(rangesOverlap(10, 20, 5, null, false), true);
});

Deno.test("rangesOverlap: null entry min treated as 0", () => {
  // entry covers up to 3, filter covers 1-5 - overlap
  assertEquals(rangesOverlap(null, 3, 1, 5, false), true);
});

Deno.test("rangesOverlap: entry max below filter min fails", () => {
  assertEquals(rangesOverlap(1, 2, 5, null, false), false);
});

// APPLY_FILTERS
///////////////

Deno.test("applyFilters: null data yields empty filtered", () => {
  resetState();
  applyFilters();
  assertEquals(state.filtered, []);
});

Deno.test("applyFilters: no filters passes all entries", () => {
  resetState();
  state.data = [makeEntry({ id: "a" }), makeEntry({ id: "b" })];
  applyFilters();
  assertEquals(state.filtered.length, 2);
});

Deno.test("applyFilters: text search filters by title", () => {
  resetState();

  state.data = [
    makeEntry({ id: "match", title: "The Lost Dungeon" }),
    makeEntry({ id: "no-match", title: "Sea of Fire" }),
  ];

  state.query = "lost";

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "match");
});

Deno.test("applyFilters: text search filters by author", () => {
  resetState();

  state.data = [
    makeEntry({ id: "match", authors: ["S. R. Holloway"] }),
    makeEntry({ id: "no-match", authors: ["Dorian Kessler"] }),
  ];

  state.query = "holloway";

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "match");
});

Deno.test("applyFilters: category filter (array field)", () => {
  resetState();

  state.data = [
    makeEntry({ id: "adv", categories: ["Adventure"] }),
    makeEntry({ id: "sup", categories: ["Supplement"] }),
  ];

  state.filters.categories = ["Adventure"];

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "adv");
});

Deno.test("applyFilters: systems filter (array field)", () => {
  resetState();

  state.data = [
    makeEntry({ id: "sd", systems: ["Shadowdark"] }),
    makeEntry({ id: "ds", systems: ["Soulblight"] }),
  ];

  state.filters.systems = ["Shadowdark"];

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "sd");
});

Deno.test("applyFilters: OR logic within same field", () => {
  resetState();

  state.data = [
    makeEntry({ id: "sd", systems: ["Shadowdark"] }),
    makeEntry({ id: "ds", systems: ["Soulblight"] }),
    makeEntry({ id: "ag", systems: ["System-Agnostic"] }),
  ];

  state.filters.systems = ["Shadowdark", "Soulblight"];

  applyFilters();

  assertEquals(state.filtered.length, 2);
});

Deno.test("applyFilters: AND logic across different fields", () => {
  resetState();

  state.data = [
    makeEntry({ id: "both", categories: ["Adventure"], pricings: ["free"] }),
    makeEntry({
      id: "cat-only",
      categories: ["Adventure"],
      pricings: ["paid"],
    }),
    makeEntry({
      id: "free-only",
      categories: ["Supplement"],
      pricings: ["free"],
    }),
  ];

  state.filters.categories = ["Adventure"];
  state.filters.pricings = ["free"];

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "both");
});

Deno.test("applyFilters: pricing filter keeps only matching entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "free-entry", pricings: ["free"] }),
    makeEntry({ id: "paid-entry", pricings: ["paid"] }),
    makeEntry({ id: "pwyw-entry", pricings: ["pwyw"] }),
  ];

  state.filters.pricings = ["free"];

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "free-entry");
});

Deno.test("applyFilters: pricing filter OR logic allows multiple values", () => {
  resetState();

  state.data = [
    makeEntry({ id: "free-entry", pricings: ["free"] }),
    makeEntry({ id: "paid-entry", pricings: ["paid"] }),
    makeEntry({ id: "pwyw-entry", pricings: ["pwyw"] }),
  ];

  state.filters.pricings = ["free", "pwyw"];

  applyFilters();

  assertEquals(state.filtered.length, 2);
});

Deno.test("applyFilters: character_options filter keeps only matching entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "witch-entry", character_options: ["Witch", "Warlock"] }),
    makeEntry({ id: "fighter-entry", character_options: ["Fighter"] }),
    makeEntry({ id: "no-options", character_options: [] }),
  ];

  state.filters.character_options = ["Witch"];

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "witch-entry");
});

Deno.test("applyFilters: hasCharacterOptions filter only passes entries with character options", () => {
  resetState();

  state.data = [
    makeEntry({ id: "has-options", character_options: ["Witch"] }),
    makeEntry({ id: "empty-options", character_options: [] }),
    makeEntry({ id: "no-field" }), // character_options absent
  ];

  state.filters.hasCharacterOptions = true;

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "has-options");
});

Deno.test("applyFilters: hasCharacterOptions filter off passes all entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "has-options", character_options: ["Witch"] }),
    makeEntry({ id: "no-options", character_options: [] }),
  ];

  state.filters.hasCharacterOptions = false;

  applyFilters();

  assertEquals(state.filtered.length, 2);
});

Deno.test("applyFilters: hasCharacterOptions combined with character_options filter", () => {
  resetState();

  state.data = [
    makeEntry({ id: "witch", character_options: ["Witch"] }),
    makeEntry({ id: "fighter", character_options: ["Fighter"] }),
    makeEntry({ id: "none", character_options: [] }),
  ];

  state.filters.hasCharacterOptions = true;
  state.filters.character_options = ["Witch"];

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "witch");
});

Deno.test("applyFilters: official filter only passes official entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "official", official: true }),
    makeEntry({ id: "third-party" }), // no official field
    makeEntry({ id: "explicit-false", official: false }),
  ];

  state.filters.official = true;

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "official");
});

Deno.test("applyFilters: official filter off passes all entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "official", official: true }),
    makeEntry({ id: "third-party" }),
  ];

  state.filters.official = false;

  applyFilters();

  assertEquals(state.filtered.length, 2);
});

Deno.test("applyFilters: upcoming filter only passes future entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "past", date: "2020-01-01" }),
    makeEntry({ id: "future", date: "2099-01-01" }),
  ];

  state.filters.upcoming = true;

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "future");
});

Deno.test("applyFilters: level range filter keeps overlapping entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "low", lmin: 1, lmax: 3 }),
    makeEntry({ id: "high", lmin: 7, lmax: 10 }),
  ];

  state.filters.lmin = 2;
  state.filters.lmax = 5;

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "low");
});

Deno.test("applyFilters: excludeUnspecifiedLevel removes null-level entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "specified", lmin: 1, lmax: 3 }),
    makeEntry({ id: "unspecified", lmin: null, lmax: null }),
  ];

  state.filters.lmin = 1;
  state.filters.excludeUnspecifiedLevel = true;

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "specified");
});

Deno.test("applyFilters: excludeUnspecifiedLevel passes null-level entries when flag off", () => {
  resetState();

  state.data = [
    makeEntry({ id: "specified", lmin: 1, lmax: 3 }),
    makeEntry({ id: "unspecified", lmin: null, lmax: null }),
  ];

  state.filters.lmin = 1;
  state.filters.excludeUnspecifiedLevel = false;

  applyFilters();

  assertEquals(state.filtered.length, 2);
});

Deno.test("applyFilters: party size range filter", () => {
  resetState();

  state.data = [
    makeEntry({ id: "small", pmin: 1, pmax: 2 }),
    makeEntry({ id: "large", pmin: 4, pmax: 6 }),
  ];

  state.filters.pmin = 3;
  state.filters.pmax = 5;

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "large");
});

Deno.test("applyFilters: authors filter (array field, OR within)", () => {
  resetState();

  state.data = [
    makeEntry({ id: "alice", authors: ["Alice", "Bob"] }),
    makeEntry({ id: "charlie", authors: ["Charlie"] }),
  ];

  state.filters.authors = ["Alice"];

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "alice");
});

Deno.test("applyFilters: pub filter (non-array field)", () => {
  resetState();

  state.data = [
    makeEntry({ id: "lq", pub: "Lantern & Quill Press" }),
    makeEntry({ id: "ig", pub: "Iron Gate Games" }),
  ];

  state.filters.pub = ["Lantern & Quill Press"];

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "lq");
});

Deno.test("hasActiveFilters: dmin set returns true", () => {
  resetState();
  state.filters.dmin = "2024-01";
  assertEquals(hasActiveFilters(), true);
});

Deno.test("hasActiveFilters: dmax set returns true", () => {
  resetState();
  state.filters.dmax = "2024-12";
  assertEquals(hasActiveFilters(), true);
});

Deno.test("applyFilters: dmin excludes entries published before it", () => {
  resetState();

  state.data = [
    makeEntry({ id: "before", date: "2023-06-01" }),
    makeEntry({ id: "after", date: "2024-03-01" }),
  ];

  state.filters.dmin = "2024-01";

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "after");
});

Deno.test("applyFilters: dmax excludes entries published after it", () => {
  resetState();

  state.data = [
    makeEntry({ id: "before", date: "2023-06-01" }),
    makeEntry({ id: "after", date: "2025-03-01" }),
  ];

  state.filters.dmax = "2024-12";

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "before");
});

Deno.test("applyFilters: dmin + dmax keeps entries within range", () => {
  resetState();

  state.data = [
    makeEntry({ id: "too-early", date: "2022-12-01" }),
    makeEntry({ id: "in-range", date: "2023-06-15" }),
    makeEntry({ id: "too-late", date: "2024-02-01" }),
  ];

  state.filters.dmin = "2023-01";
  state.filters.dmax = "2023-12";

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "in-range");
});

Deno.test("applyFilters: date filter includes entry on exact boundary", () => {
  resetState();

  state.data = [
    makeEntry({ id: "exact-min", date: "2023-01-15" }),
    makeEntry({ id: "exact-max", date: "2024-12-20" }),
  ];

  state.filters.dmin = "2023-01";
  state.filters.dmax = "2024-12";

  applyFilters();

  assertEquals(state.filtered.length, 2);
});

Deno.test("applyFilters: date filter excludes entry with no date", () => {
  resetState();

  state.data = [
    makeEntry({ id: "no-date", date: null }),
    makeEntry({ id: "has-date", date: "2024-06-01" }),
  ];

  state.filters.dmin = "2024-01";

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "has-date");
});

Deno.test("applyFilters: year-only date normalised to YYYY-01 for comparison", () => {
  resetState();

  state.data = [
    makeEntry({ id: "year-only", date: "2024" }),
  ];

  state.filters.dmin = "2024-01";
  state.filters.dmax = "2024-01";

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "year-only");
});

Deno.test("applyFilters: year-only date excluded when dmin is later in same year", () => {
  resetState();

  state.data = [
    makeEntry({ id: "year-only", date: "2024" }),
  ];

  state.filters.dmin = "2024-06";

  applyFilters();

  assertEquals(state.filtered.length, 0);
});

Deno.test("applyFilters: year-month date normalised correctly", () => {
  resetState();

  state.data = [
    makeEntry({ id: "year-month", date: "2024-06" }),
  ];

  state.filters.dmin = "2024-06";
  state.filters.dmax = "2024-06";

  applyFilters();

  assertEquals(state.filtered.length, 1);
});

Deno.test("applyFilters: no date filter passes all entries regardless of date", () => {
  resetState();

  state.data = [
    makeEntry({ id: "a", date: "2020-01-01" }),
    makeEntry({ id: "b", date: "2099-01-01" }),
    makeEntry({ id: "c", date: null }),
  ];

  applyFilters();

  assertEquals(state.filtered.length, 3);
});

// SORT_FILTERED
///////////////

Deno.test("sortFiltered: title sorts alphabetically ascending", () => {
  resetState();

  state.filtered = [
    makeEntry({ id: "z", title: "Zephyr Keep" }),
    makeEntry({ id: "a", title: "Apple Dungeon" }),
    makeEntry({ id: "m", title: "Mango Maze" }),
  ];

  state.sort = "title";

  sortFiltered();

  assertEquals(
    state.filtered.map((e) => e.id),
    ["a", "m", "z"],
  );
});

Deno.test("sortFiltered: date sorts oldest first (ascending)", () => {
  resetState();

  state.filtered = [
    makeEntry({ id: "new", date: "2024-06-01" }),
    makeEntry({ id: "old", date: "2022-01-01" }),
    makeEntry({ id: "mid", date: "2023-03-15" }),
  ];

  state.sort = "date";

  sortFiltered();

  assertEquals(
    state.filtered.map((e) => e.id),
    ["old", "mid", "new"],
  );
});

Deno.test("sortFiltered: date with sortReverse sorts newest first (descending)", () => {
  resetState();

  state.filtered = [
    makeEntry({ id: "new", date: "2024-06-01" }),
    makeEntry({ id: "old", date: "2022-01-01" }),
    makeEntry({ id: "mid", date: "2023-03-15" }),
  ];

  state.sort = "date";
  state.sortReverse = true;

  sortFiltered();

  assertEquals(
    state.filtered.map((e) => e.id),
    ["new", "mid", "old"],
  );
});

Deno.test("sortFiltered: sortReverse reverses title sort", () => {
  resetState();

  state.filtered = [
    makeEntry({ id: "z", title: "Zephyr Keep" }),
    makeEntry({ id: "a", title: "Apple Dungeon" }),
    makeEntry({ id: "m", title: "Mango Maze" }),
  ];

  state.sort = "title";
  state.sortReverse = true;

  sortFiltered();

  assertEquals(
    state.filtered.map((e) => e.id),
    ["z", "m", "a"],
  );
});

Deno.test("sortFiltered: pages sorts ascending, null pages sorts last", () => {
  resetState();

  state.filtered = [
    makeEntry({ id: "unknown", pages: null }),
    makeEntry({ id: "big", pages: 48 }),
    makeEntry({ id: "small", pages: 8 }),
  ];

  state.sort = "pages";

  sortFiltered();

  assertEquals(
    state.filtered.map((e) => e.id),
    ["small", "big", "unknown"],
  );
});

Deno.test("sortFiltered: level sorts ascending by lmin, null sorts last", () => {
  resetState();

  state.filtered = [
    makeEntry({ id: "high", lmin: 7 }),
    makeEntry({ id: "none", lmin: null }),
    makeEntry({ id: "low", lmin: 1 }),
    makeEntry({ id: "mid", lmin: 4 }),
  ];

  state.sort = "level";

  sortFiltered();

  assertEquals(
    state.filtered.map((e) => e.id),
    ["low", "mid", "high", "none"],
  );
});

// RANGES_OVERLAP: REGRESSION FOR EXCLUDE_UNSPECIFIED WITHOUT A RANGE FILTER
//////////////////////////////////////////////////////////////////////////

Deno.test("rangesOverlap: no range filter, excludeUnspecified true, no entry data -> fails", () => {
  assertEquals(rangesOverlap(null, null, null, null, true), false);
});

Deno.test("rangesOverlap: no range filter, excludeUnspecified false, no entry data -> passes", () => {
  assertEquals(rangesOverlap(null, null, null, null, false), true);
});

Deno.test("rangesOverlap: no range filter, excludeUnspecified true, entry has data -> passes", () => {
  // Entry has level data, so it should pass through even with no range filter.
  assertEquals(rangesOverlap(1, 3, null, null, true), true);
});

// APPLY_FILTERS: EXCLUDE_UNSPECIFIED STANDALONE (NO RANGE SET)
/////////////////////////////////////////////////////////////

Deno.test("applyFilters: excludeUnspecifiedLevel alone removes null-level entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "specified", lmin: 1, lmax: 3 }),
    makeEntry({ id: "unspecified", lmin: null, lmax: null }),
  ];

  state.filters.excludeUnspecifiedLevel = true;

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "specified");
});

Deno.test("applyFilters: excludeUnspecifiedParty alone removes null-party entries", () => {
  resetState();

  state.data = [
    makeEntry({ id: "specified", pmin: 3, pmax: 5 }),
    makeEntry({ id: "unspecified", pmin: null, pmax: null }),
  ];

  state.filters.excludeUnspecifiedParty = true;

  applyFilters();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "specified");
});

// SORT_FILTERED: SHUFFLE
////////////////////////

Deno.test("sortFiltered: shuffle produces a valid permutation", () => {
  resetState();
  clearShuffleCache();

  const ids = ["a", "b", "c", "d", "e"];

  state.filtered = ids.map((id) => makeEntry({ id }));
  state.sort = "shuffle";

  sortFiltered();

  assertEquals(state.filtered.length, ids.length);
  assertEquals(
    [...state.filtered.map((e) => e.id)].sort(),
    [...ids].sort(),
  );
});

Deno.test("sortFiltered: shuffle cache preserved; second sort gives same order", () => {
  resetState();
  clearShuffleCache();

  const ids = ["a", "b", "c", "d", "e", "f"];

  state.filtered = ids.map((id) => makeEntry({ id }));
  state.sort = "shuffle";

  sortFiltered();

  const firstOrder = state.filtered.map((e) => e.id);

  state.filtered = ids.map((id) => makeEntry({ id }));

  sortFiltered();

  const secondOrder = state.filtered.map((e) => e.id);

  assertEquals(firstOrder, secondOrder);
});

Deno.test("sortFiltered: shuffle + sortReverse uses cached order reversed", () => {
  resetState();
  clearShuffleCache();

  const ids = ["a", "b", "c", "d", "e", "f"];

  state.filtered = ids.map((id) => makeEntry({ id }));
  state.sort = "shuffle";

  sortFiltered();

  const forwardOrder = state.filtered.map((e) => e.id);

  state.filtered = ids.map((id) => makeEntry({ id }));
  state.sortReverse = true;

  sortFiltered();

  const reverseOrder = state.filtered.map((e) => e.id);

  assertEquals(reverseOrder, [...forwardOrder].reverse());
});

Deno.test("sortFiltered: shuffle with empty array stays empty", () => {
  resetState();
  clearShuffleCache();

  state.filtered = [];
  state.sort = "shuffle";

  sortFiltered();

  assertEquals(state.filtered, []);
});

Deno.test("sortFiltered: shuffle with single item stays unchanged", () => {
  resetState();
  clearShuffleCache();

  const entry = makeEntry({ id: "solo" });

  state.filtered = [entry];
  state.sort = "shuffle";

  sortFiltered();

  assertEquals(state.filtered.length, 1);
  assertEquals(state.filtered[0].id, "solo");
});

Deno.test("clearShuffleCache: cleared cache allows new shuffle on next sort", () => {
  resetState();
  clearShuffleCache();

  const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];

  state.filtered = ids.map((id) => makeEntry({ id }));
  state.sort = "shuffle";

  sortFiltered();

  const firstOrder = state.filtered.map((e) => e.id);

  clearShuffleCache();

  state.filtered = ids.map((id) => makeEntry({ id }));

  sortFiltered();

  const secondOrder = state.filtered.map((e) => e.id);

  assertEquals([...firstOrder].sort(), [...ids].sort());
  assertEquals([...secondOrder].sort(), [...ids].sort());
  assertEquals(firstOrder.join(",") === secondOrder.join(","), false);
});
