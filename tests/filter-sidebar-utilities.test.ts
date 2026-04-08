import { assertEquals } from "@std/assert";
import { state } from "../src/state.ts";
import {
  collectDistinctValues,
  collectTopValues,
  FILTER_TOP_N,
  filterHiddenCount,
  PUBLISHER_AUTHOR_TOP_N,
} from "../src/filter-sidebar-utilities.ts";
import { makeEntry, resetState } from "./fixtures.ts";

// FILTER_HIDDEN_COUNT
//////////////////////

Deno.test("filterHiddenCount: returns 0 when total equals visible", () => {
  assertEquals(filterHiddenCount(8, 8), 0);
});

Deno.test("filterHiddenCount: returns 0 when total is less than visible", () => {
  assertEquals(filterHiddenCount(5, 20), 0);
});

Deno.test("filterHiddenCount: returns difference when total exceeds visible", () => {
  assertEquals(filterHiddenCount(35, 20), 15);
});

Deno.test("filterHiddenCount: accounts for extra visible selected values", () => {
  // 35 total, 22 visible (top 20 + 2 selected extras not in top set)
  assertEquals(filterHiddenCount(35, 22), 13);
});

Deno.test("filterHiddenCount: returns 0 when both are zero", () => {
  assertEquals(filterHiddenCount(0, 0), 0);
});

Deno.test("PUBLISHER_AUTHOR_TOP_N is 20", () => {
  assertEquals(PUBLISHER_AUTHOR_TOP_N, 20);
});

// COLLECT_DISTINCT_VALUES
//////////////////////////

Deno.test("collectDistinctValues: non-array field returns sorted unique values", () => {
  resetState();

  state.data = [
    makeEntry({ pub: "Lantern Press" }),
    makeEntry({ pub: "Iron Gate" }),
    makeEntry({ pub: "Lantern Press" }), // duplicate
  ];

  const vals = collectDistinctValues("pub", false);

  assertEquals(vals, ["Iron Gate", "Lantern Press"]);
});

Deno.test("collectDistinctValues: non-array field skips null", () => {
  resetState();

  state.data = [
    makeEntry({ pub: "Lantern Press" }),
    makeEntry({ pub: null }),
  ];

  const vals = collectDistinctValues("pub", false);

  assertEquals(vals, ["Lantern Press"]);
});

Deno.test("collectDistinctValues: array field flattens and deduplicates", () => {
  resetState();

  state.data = [
    makeEntry({ systems: ["Shadowdark", "Soulblight"] }),
    makeEntry({ systems: ["Soulblight"] }),
    makeEntry({ systems: ["System-Agnostic"] }),
  ];

  const vals = collectDistinctValues("systems", true);

  assertEquals(vals, ["Shadowdark", "Soulblight", "System-Agnostic"]);
});

Deno.test("collectDistinctValues: returns values sorted alphabetically", () => {
  resetState();

  state.data = [
    makeEntry({ themes: ["Survival", "Horror", "Exploration"] }),
  ];

  const vals = collectDistinctValues("themes", true);

  assertEquals(vals, ["Exploration", "Horror", "Survival"]);
});

Deno.test("collectDistinctValues: empty array field yields no values", () => {
  resetState();

  state.data = [
    makeEntry({ envs: [] }),
    makeEntry({ envs: [] }),
  ];

  const vals = collectDistinctValues("envs", true);

  assertEquals(vals, []);
});

// COLLECT_TOP_VALUES
/////////////////////

Deno.test("collectTopValues: FILTER_TOP_N is 8", () => {
  assertEquals(FILTER_TOP_N, 8);
});

Deno.test("collectTopValues: returns most frequent non-array values", () => {
  resetState();

  state.data = [
    makeEntry({ pub: "A" }),
    makeEntry({ pub: "B" }),
    makeEntry({ pub: "A" }),
    makeEntry({ pub: "C" }),
    makeEntry({ pub: "A" }),
    makeEntry({ pub: "B" }),
  ];

  const top = collectTopValues("pub", false, 2);

  assertEquals(top, ["A", "B"]);
});

Deno.test("collectTopValues: returns most frequent array values", () => {
  resetState();

  state.data = [
    makeEntry({ themes: ["Horror", "Exploration"] }),
    makeEntry({ themes: ["Horror", "Survival"] }),
    makeEntry({ themes: ["Exploration"] }),
  ];

  // Horror: 2, Exploration: 2, Survival: 1
  // ties broken alphabetically: Exploration < Horror
  const top = collectTopValues("themes", true, 2);

  assertEquals(top, ["Exploration", "Horror"]);
});

Deno.test("collectTopValues: ties broken alphabetically", () => {
  resetState();

  state.data = [
    makeEntry({ themes: ["zebra", "apple", "mango"] }),
  ];

  // all tied at 1; alphabetical order: apple, mango, zebra
  const top = collectTopValues("themes", true, 2);

  assertEquals(top, ["apple", "mango"]);
});

Deno.test("collectTopValues: fewer distinct values than n returns all", () => {
  resetState();

  state.data = [
    makeEntry({ categories: ["Adventure"] }),
    makeEntry({ categories: ["Supplement"] }),
    makeEntry({ categories: ["Adventure"] }),
  ];

  const top = collectTopValues("categories", true, 8);

  assertEquals(top.length, 2);
  assertEquals(top[0], "Adventure"); // higher frequency first
  assertEquals(top[1], "Supplement");
});

Deno.test("collectTopValues: respects n limit", () => {
  resetState();

  state.data = [
    makeEntry({ themes: ["a", "b", "c", "d", "e"] }),
    makeEntry({ themes: ["a", "b", "c", "d"] }),
    makeEntry({ themes: ["a", "b", "c"] }),
  ];

  const top = collectTopValues("themes", true, 3);

  assertEquals(top.length, 3);
});

Deno.test("collectTopValues: skips null and empty non-array values", () => {
  resetState();

  state.data = [
    makeEntry({ pub: "Real Publisher" }),
    makeEntry({ pub: null }),
    makeEntry({ pub: "" }),
  ];

  const top = collectTopValues("pub", false, 5);

  assertEquals(top, ["Real Publisher"]);
});

Deno.test("collectTopValues: empty data returns empty array", () => {
  resetState();
  state.data = [];
  const top = collectTopValues("themes", true, 8);
  assertEquals(top, []);
});
