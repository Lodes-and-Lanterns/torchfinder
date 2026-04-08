import { assert, assertEquals } from "@std/assert";
import { computePageNumbers } from "../src/render.ts";

// COMPUTE_PAGE_NUMBERS
///////////////////////

Deno.test("computePageNumbers: total=1 returns [1]", () => {
  assertEquals(computePageNumbers(1, 1), [1]);
});

Deno.test("computePageNumbers: total<=7 returns all pages without ellipsis", () => {
  assertEquals(computePageNumbers(4, 7), [1, 2, 3, 4, 5, 6, 7]);
});

Deno.test("computePageNumbers: total=7 boundary returns all pages", () => {
  assertEquals(computePageNumbers(1, 7), [1, 2, 3, 4, 5, 6, 7]);
});

Deno.test("computePageNumbers: current=1 of 10, only trailing ellipsis", () => {
  assertEquals(computePageNumbers(1, 10), [1, 2, "...", 10]);
});

Deno.test("computePageNumbers: current=2 of 10, no leading ellipsis", () => {
  assertEquals(computePageNumbers(2, 10), [1, 2, 3, "...", 10]);
});

Deno.test("computePageNumbers: current=3 of 10, no leading ellipsis", () => {
  assertEquals(computePageNumbers(3, 10), [1, 2, 3, 4, "...", 10]);
});

Deno.test("computePageNumbers: current=4 of 10, both ellipses", () => {
  assertEquals(computePageNumbers(4, 10), [1, "...", 3, 4, 5, "...", 10]);
});

Deno.test("computePageNumbers: current=5 of 10 (middle), both ellipses", () => {
  assertEquals(computePageNumbers(5, 10), [1, "...", 4, 5, 6, "...", 10]);
});

Deno.test("computePageNumbers: current=8 of 10, no trailing ellipsis", () => {
  // current < total - 2: 8 < 8 is false, so no trailing ellipsis
  assertEquals(computePageNumbers(8, 10), [1, "...", 7, 8, 9, 10]);
});

Deno.test("computePageNumbers: current=9 of 10, no trailing ellipsis", () => {
  assertEquals(computePageNumbers(9, 10), [1, "...", 8, 9, 10]);
});

Deno.test("computePageNumbers: current=10 of 10 (last), no trailing ellipsis", () => {
  assertEquals(computePageNumbers(10, 10), [1, "...", 9, 10]);
});

Deno.test("computePageNumbers: always includes 1 and total for large sets", () => {
  const pages = computePageNumbers(50, 100);
  assertEquals(pages[0], 1);
  assertEquals(pages[pages.length - 1], 100);
});

Deno.test("computePageNumbers: window around current is correct", () => {
  // current=6, total=20: should include 5, 6, 7 in window
  const pages = computePageNumbers(6, 20);
  assert(pages.includes(5));
  assert(pages.includes(6));
  assert(pages.includes(7));
});
