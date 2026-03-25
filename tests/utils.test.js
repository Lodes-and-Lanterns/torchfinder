import { assert, assertEquals } from "@std/assert";

import {
  debounce,
  escapeHtml,
  formatDate,
  formatDateShort,
  formatLevelRange,
  formatPartySize,
  isUpcoming,
  langName,
  LANGUAGE_NAMES,
  slugToLabel,
} from "../scripts/utils.js";

// ESCAPE_HTML
/////////////

Deno.test("escapeHtml: escapes &", () => {
  assertEquals(escapeHtml("a & b"), "a &amp; b");
});

Deno.test("escapeHtml: escapes < and >", () => {
  assertEquals(escapeHtml("<tag>"), "&lt;tag&gt;");
});

Deno.test("escapeHtml: escapes double quotes", () => {
  assertEquals(escapeHtml('"quoted"'), "&quot;quoted&quot;");
});

Deno.test("escapeHtml: null produces empty string", () => {
  assertEquals(escapeHtml(null), "");
});

Deno.test("escapeHtml: undefined produces empty string", () => {
  assertEquals(escapeHtml(undefined), "");
});

Deno.test("escapeHtml: plain text is unchanged", () => {
  assertEquals(escapeHtml("hello world"), "hello world");
});

Deno.test("escapeHtml: multiple special chars in one string", () => {
  assertEquals(
    escapeHtml('<a href="x&y">'),
    "&lt;a href=&quot;x&amp;y&quot;&gt;",
  );
});

// SLUG_TO_LABEL
//////////////

Deno.test("slugToLabel: single word capitalizes", () => {
  assertEquals(slugToLabel("adventure"), "Adventure");
});

Deno.test("slugToLabel: hyphenated slug splits on dash", () => {
  assertEquals(slugToLabel("pay-what-you-want"), "Pay What You Want");
});

Deno.test("slugToLabel: multi-word slug", () => {
  assertEquals(slugToLabel("system-agnostic"), "System Agnostic");
});

Deno.test("slugToLabel: empty string returns empty string", () => {
  assertEquals(slugToLabel(""), "");
});

Deno.test("slugToLabel: null returns empty string", () => {
  assertEquals(slugToLabel(null), "");
});

// LANG_NAME
///////////

Deno.test("langName: en returns English", () => {
  assertEquals(langName("en"), "English");
});

Deno.test("langName: es returns Spanish", () => {
  assertEquals(langName("es"), "Spanish");
});

Deno.test("langName: fr returns French", () => {
  assertEquals(langName("fr"), "French");
});

Deno.test("langName: unknown code returns uppercased code", () => {
  assertEquals(langName("xx"), "XX");
});

Deno.test("langName: all LANGUAGE_NAMES keys resolve without error", () => {
  for (const code of Object.keys(LANGUAGE_NAMES)) {
    const result = langName(code);
    assert(result.length > 0, `langName("${code}") returned empty string`);
  }
});

// FORMAT_LEVEL_RANGE
///////////////////

Deno.test("formatLevelRange: null/null returns null", () => {
  assertEquals(formatLevelRange(null, null), null);
});

Deno.test("formatLevelRange: equal min and max", () => {
  assertEquals(formatLevelRange(3, 3), "Level 3");
});

Deno.test("formatLevelRange: level 0 funnel (equal at 0)", () => {
  assertEquals(formatLevelRange(0, 0), "Level 0");
});

Deno.test("formatLevelRange: null min shows upper bound only", () => {
  assertEquals(formatLevelRange(null, 4), "Up to level 4");
});

Deno.test("formatLevelRange: null max shows open-ended range", () => {
  assertEquals(formatLevelRange(5, null), "Level 5+");
});

Deno.test("formatLevelRange: min/max range", () => {
  assertEquals(formatLevelRange(1, 3), "Levels 1–3");
});

// FORMAT_PARTY_SIZE
//////////////////

Deno.test("formatPartySize: null/null returns null", () => {
  assertEquals(formatPartySize(null, null), null);
});

Deno.test("formatPartySize: equal min and max", () => {
  assertEquals(formatPartySize(4, 4), "4 players");
});

Deno.test("formatPartySize: null min shows upper bound only", () => {
  assertEquals(formatPartySize(null, 5), "Up to 5 players");
});

Deno.test("formatPartySize: null max shows open-ended range", () => {
  assertEquals(formatPartySize(3, null), "3+ players");
});

Deno.test("formatPartySize: min/max range", () => {
  assertEquals(formatPartySize(3, 5), "3–5 players");
});

// FORMAT_DATE
/////////////

Deno.test("formatDate: empty string returns empty string", () => {
  assertEquals(formatDate(""), "");
});

Deno.test("formatDate: null returns empty string", () => {
  assertEquals(formatDate(null), "");
});

Deno.test("formatDate: full date includes year and day", () => {
  const result = formatDate("2024-03-12");
  assert(result.includes("2024"));
  assert(result.includes("12"));
});

Deno.test("formatDate: year-month omits day", () => {
  const result = formatDate("2024-03");
  assert(result.includes("2024"));
  assert(result.includes("Mar"));
  assert(!result.includes("1"), "should not show a fabricated day");
});

Deno.test("formatDate: year-only returns the year string", () => {
  assertEquals(formatDate("2024"), "2024");
});

// FORMAT_DATE_SHORT
//////////////////

Deno.test("formatDateShort: empty string returns empty string", () => {
  assertEquals(formatDateShort(""), "");
});

Deno.test("formatDateShort: null returns empty string", () => {
  assertEquals(formatDateShort(null), "");
});

Deno.test("formatDateShort: full date returns M/YYYY", () => {
  assertEquals(formatDateShort("2024-03-12"), "3/2024");
});

Deno.test("formatDateShort: year-month returns M/YYYY", () => {
  assertEquals(formatDateShort("2024-03"), "3/2024");
});

Deno.test("formatDateShort: year-only returns the year string", () => {
  assertEquals(formatDateShort("2024"), "2024");
});

Deno.test("formatDateShort: January is month 1", () => {
  assertEquals(formatDateShort("2023-01-01"), "1/2023");
});

Deno.test("formatDateShort: December is month 12", () => {
  assertEquals(formatDateShort("2022-12-31"), "12/2022");
});

// IS_UPCOMING
/////////////

Deno.test("isUpcoming: null returns false", () => {
  assertEquals(isUpcoming(null), false);
});

Deno.test("isUpcoming: empty string returns false", () => {
  assertEquals(isUpcoming(""), false);
});

Deno.test("isUpcoming: clearly past date returns false", () => {
  assertEquals(isUpcoming("2020-01-01"), false);
});

Deno.test("isUpcoming: far future date returns true", () => {
  assertEquals(isUpcoming("2099-12-31"), true);
});

// DEBOUNCE
///////////

Deno.test("debounce: returns a function", () => {
  const fn = debounce(() => {}, 50);
  assertEquals(typeof fn, "function");
});

Deno.test({
  name: "debounce: does not call fn synchronously and calls once after delay",
  sanitizeOps: false,
  async fn() {
    let count = 0;

    const fn = debounce(() => {
      ++count;
    }, 30);

    fn();

    assertEquals(count, 0, "should not fire synchronously");

    await new Promise((r) => setTimeout(r, 70));

    assertEquals(count, 1, "should fire exactly once after the delay");
  },
});

Deno.test({
  name: "debounce: multiple rapid calls result in exactly one invocation",
  sanitizeOps: false,
  async fn() {
    let count = 0;

    const fn = debounce(() => {
      ++count;
    }, 40);

    fn();
    fn();
    fn();

    await new Promise((r) => setTimeout(r, 90));

    assertEquals(count, 1);
  },
});

Deno.test({
  name: "debounce: uses arguments from the last call",
  sanitizeOps: false,
  async fn() {
    let lastArg = null;

    const fn = debounce((v) => {
      lastArg = v;
    }, 40);

    fn("first");
    fn("second");
    fn("third");

    await new Promise((r) => setTimeout(r, 90));

    assertEquals(lastArg, "third");
  },
});
