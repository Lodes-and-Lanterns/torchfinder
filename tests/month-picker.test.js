import { assertEquals } from "@std/assert";

import {
  formatDisplay,
  formatYearMonth,
  isMonthDisabled,
  MONTH_NAMES,
  parseYearMonth,
} from "../scripts/month-picker.js";

// PARSE_YEAR_MONTH
//////////////////

Deno.test("parseYearMonth: valid YYYY-MM string", () => {
  assertEquals(parseYearMonth("2024-01"), { year: 2024, month: 0 });
  assertEquals(parseYearMonth("2024-12"), { year: 2024, month: 11 });
  assertEquals(parseYearMonth("1999-06"), { year: 1999, month: 5 });
});

Deno.test("parseYearMonth: null / empty / non-string returns null", () => {
  assertEquals(parseYearMonth(null), null);
  assertEquals(parseYearMonth(""), null);
  assertEquals(parseYearMonth(undefined), null);
  assertEquals(parseYearMonth(42), null);
});

Deno.test("parseYearMonth: invalid formats return null", () => {
  assertEquals(parseYearMonth("2024"), null); // year only
  assertEquals(parseYearMonth("2024-1"), null); // single-digit month
  assertEquals(parseYearMonth("2024-00"), null); // month 0 is invalid
  assertEquals(parseYearMonth("2024-13"), null); // month > 12 invalid
  assertEquals(parseYearMonth("24-01"), null); // 2-digit year
  assertEquals(parseYearMonth("2024-01-15"), null); // full date string
  assertEquals(parseYearMonth("not-a-date"), null);
});

// FORMAT_YEAR_MONTH
//////////////////

Deno.test("formatYearMonth: pads month to two digits", () => {
  assertEquals(formatYearMonth(2024, 0), "2024-01");
  assertEquals(formatYearMonth(2024, 11), "2024-12");
  assertEquals(formatYearMonth(2000, 5), "2000-06");
});

// FORMAT_DISPLAY
/////////////////

Deno.test("formatDisplay: returns human-readable string", () => {
  assertEquals(formatDisplay(2024, 0), "Jan 2024");
  assertEquals(formatDisplay(2024, 11), "Dec 2024");
  assertEquals(formatDisplay(1999, 6), "Jul 1999");
});

Deno.test("formatDisplay: uses correct MONTH_NAMES", () => {
  for (let i = 0; i < 12; i++) {
    const result = formatDisplay(2000, i);
    assertEquals(result, `${MONTH_NAMES[i]} 2000`);
  }
});

// IS_MONTH_DISABLED
//////////////////

Deno.test("isMonthDisabled: no otherValue => never disabled", () => {
  assertEquals(isMonthDisabled(2024, 5, null, true), false);
  assertEquals(isMonthDisabled(2024, 5, null, false), false);
  assertEquals(isMonthDisabled(2024, 5, "", true), false);
});

Deno.test("isMonthDisabled: invalid otherValue => never disabled", () => {
  assertEquals(isMonthDisabled(2024, 5, "not-valid", true), false);
  assertEquals(isMonthDisabled(2024, 5, "2024", false), false);
});

Deno.test("isMonthDisabled: start picker - disables months after end value", () => {
  // end is "2024-06" = June (0-indexed month 5), start picker
  assertEquals(isMonthDisabled(2024, 5, "2024-06", true), false); // June == June => allowed
  assertEquals(isMonthDisabled(2024, 6, "2024-06", true), true); // July > June => disabled
  assertEquals(isMonthDisabled(2024, 4, "2024-06", true), false); // May < June => allowed
  assertEquals(isMonthDisabled(2025, 0, "2024-06", true), true); // Jan 2025 > Jun 2024 => disabled
});

Deno.test("isMonthDisabled: end picker - disables months before start value", () => {
  // start is "2024-06" = June (0-indexed month 5), end picker
  assertEquals(isMonthDisabled(2024, 5, "2024-06", false), false); // June == June => allowed
  assertEquals(isMonthDisabled(2024, 4, "2024-06", false), true); // May < June => disabled
  assertEquals(isMonthDisabled(2024, 6, "2024-06", false), false); // July > June => allowed
  assertEquals(isMonthDisabled(2023, 11, "2024-06", false), true); // Dec 2023 < Jun 2024 => disabled
});

Deno.test("isMonthDisabled: cross-year boundary", () => {
  // start picker, end is 2023-01
  assertEquals(isMonthDisabled(2024, 0, "2023-01", true), true); // 2024-01 > 2023-01
  assertEquals(isMonthDisabled(2022, 11, "2023-01", true), false); // 2022-12 < 2023-01

  // end picker, start is 2023-01
  assertEquals(isMonthDisabled(2022, 11, "2023-01", false), true); // 2022-12 < 2023-01
  assertEquals(isMonthDisabled(2024, 0, "2023-01", false), false); // 2024-01 > 2023-01
});

// Round-trip: parseYearMonth <-> formatYearMonth
//////////////////////////////////////////////////

Deno.test("round-trip: formatYearMonth output parses back correctly", () => {
  for (let month = 0; month < 12; month++) {
    const str = formatYearMonth(2024, month);
    const parsed = parseYearMonth(str);
    assertEquals(parsed, { year: 2024, month });
  }
});
