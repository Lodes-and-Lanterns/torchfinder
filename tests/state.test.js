import { assert, assertEquals } from "@std/assert";
import {
  state,
  DATA_URL,
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  SITE_URL,
} from "../scripts/state.js";

// CONSTANTS
////////////

Deno.test("DATA_URL points to dist/torchfinder-dataset.jsonl", () => {
  assertEquals(DATA_URL, "dist/torchfinder-dataset.jsonl");
});

Deno.test("PAGE_SIZE is 25", () => {
  assertEquals(PAGE_SIZE, 25);
});

Deno.test("SEARCH_DEBOUNCE_MS is 200", () => {
  assertEquals(SEARCH_DEBOUNCE_MS, 200);
});

Deno.test("SITE_URL is an https URL", () => {
  assert(SITE_URL.startsWith("https://"), `Expected https URL, got: ${SITE_URL}`);
});

// STATE SHAPE
//////////////
// These tests only check key presence, not mutable default values, so they are
// stable regardless of which order test files run.

Deno.test("state has expected top-level keys", () => {
  for (const key of [
    "data",
    "filtered",
    "query",
    "filters",
    "sort",
    "sortReverse",
    "page",
    "directId",
    "expandedCardId",
    "listMode",
    "listId",
    "listName",
    "listDescription",
    "listEntries",
    "listSynced",
  ]) {
    assert(key in state, `Missing key: ${key}`);
  }
});

Deno.test("state.filters has all expected filter keys", () => {
  const expected = [
    "categories",
    "systems",
    "settings",
    "envs",
    "themes",
    "languages",
    "pub",
    "authors",
    "pricings",
    "character_options",
    "upcoming",
    "excludeUnspecifiedLevel",
    "excludeUnspecifiedParty",
    "lmin",
    "lmax",
    "pmin",
    "pmax",
  ];
  for (const key of expected) {
    assert(key in state.filters, `Missing state.filters key: ${key}`);
  }
});
