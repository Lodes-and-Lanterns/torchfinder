import { assert, assertEquals } from "@std/assert";
import { state } from "../src/state.ts";
import { setCoverConsent } from "../src/consent.ts";
import type { Entry } from "../src/types.ts";
import {
  buildExpandedHtml,
  collectDistinctValues,
  collectTopValues,
  computePageNumbers,
  FILTER_TOP_N,
  filterHiddenCount,
  PUBLISHER_AUTHOR_TOP_N,
  renderCardHtml,
  row,
} from "../src/render.ts";

// UTILITIES
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

function makeEntry(overrides: Partial<Entry> = {}): Entry {
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
    links: [],
    children: [],
    ...overrides,
  };
}

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

// ROW
//////

Deno.test("row: produces th with label and td with value", () => {
  const html = row("Publisher", "Iron Gate Games");
  assert(html.includes('<th scope="row">Publisher</th>'));
  assert(html.includes("<td>Iron Gate Games</td>"));
});

Deno.test("row: HTML-escapes the label", () => {
  const html = row("Author & Co", "value");
  assert(html.includes("Author &amp; Co"));
});

Deno.test("row: HTML-escapes the value", () => {
  const html = row("Title", '<script>alert("xss")</script>');
  assert(html.includes("&lt;script&gt;"));
  assert(!html.includes("<script>"));
});

Deno.test("row: wraps in a tr element", () => {
  const html = row("Label", "Value");
  assert(html.startsWith("<tr>"));
  assert(html.endsWith("</tr>"));
});

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

// RENDER_CARD_HTML
///////////////////

Deno.test("renderCardHtml: contains data-id attribute", () => {
  const html = renderCardHtml(makeEntry({ id: "the-tomb" }), false);
  assert(html.includes('data-id="the-tomb"'));
});

Deno.test("renderCardHtml: HTML-escapes id in data-id", () => {
  const html = renderCardHtml(makeEntry({ id: 'a"b' }), false);
  assert(html.includes('data-id="a&quot;b"'));
  assert(!html.includes('data-id="a"b"'));
});

Deno.test("renderCardHtml: contains entry title in h3", () => {
  const html = renderCardHtml(makeEntry({ title: "The Verdant Maze" }), false);
  assert(html.includes("The Verdant Maze"));
  assert(html.includes("card-title"));
});

Deno.test("renderCardHtml: HTML-escapes title", () => {
  const html = renderCardHtml(makeEntry({ title: "<b>Bold</b>" }), false);
  assert(html.includes("&lt;b&gt;Bold&lt;/b&gt;"));
  assert(!html.includes("<b>Bold</b>"));
});

Deno.test("renderCardHtml: contains author byline when authors present", () => {
  const html = renderCardHtml(
    makeEntry({ authors: ["S. R. Holloway"] }),
    false,
  );

  assert(html.includes("S. R. Holloway"));
  assert(html.includes("card-byline"));
});

Deno.test("renderCardHtml: no byline when authors is empty", () => {
  const html = renderCardHtml(makeEntry({ authors: [] }), false);
  assert(!html.includes("card-byline"));
});

Deno.test("renderCardHtml: multiple authors are joined with comma", () => {
  const html = renderCardHtml(makeEntry({ authors: ["Alice", "Bob"] }), false);
  assert(html.includes("Alice, Bob"));
});

Deno.test("renderCardHtml: description snippet shown when collapsed", () => {
  const html = renderCardHtml(makeEntry({ desc: "A spooky crypt." }), false);
  assert(html.includes("A spooky crypt."));
  assert(html.includes("card-description-snippet"));
});

Deno.test("renderCardHtml: description snippet visible even when expanded", () => {
  const html = renderCardHtml(makeEntry({ desc: "A spooky crypt." }), true);
  assert(html.includes("card-description-snippet"));
  assert(html.includes("A spooky crypt."));
});

Deno.test("renderCardHtml: category tag present", () => {
  const html = renderCardHtml(makeEntry({ categories: ["Adventure"] }), false);
  assert(html.includes("card-tag"));
  assert(html.includes("Adventure"));
});

Deno.test("renderCardHtml: Free tag present for free entries", () => {
  const html = renderCardHtml(makeEntry({ pricings: ["free"] }), false);
  assert(html.includes("card-tag-free"));
  assert(html.includes("Free"));
});

Deno.test("renderCardHtml: Free tag absent for paid entries", () => {
  const html = renderCardHtml(makeEntry({ pricings: ["paid"] }), false);
  assert(!html.includes("card-tag-free"));
});

Deno.test("renderCardHtml: PWYW tag present for pwyw entries", () => {
  const html = renderCardHtml(makeEntry({ pricings: ["pwyw"] }), false);
  assert(html.includes("card-tag-pwyw"));
  assert(html.includes("PWYW"));
});

Deno.test("renderCardHtml: Upcoming tag present for future entries", () => {
  const html = renderCardHtml(
    makeEntry({ date: "2099-01-01" }),
    false,
  );

  assert(html.includes("card-tag-upcoming"));
  assert(html.includes("Upcoming"));
});

Deno.test("renderCardHtml: Upcoming tag absent for past entries", () => {
  const html = renderCardHtml(
    makeEntry({ date: "2020-01-01" }),
    false,
  );

  assert(!html.includes("card-tag-upcoming"));
});

Deno.test("renderCardHtml: level range tag present", () => {
  const html = renderCardHtml(makeEntry({ lmin: 1, lmax: 3 }), false);
  assert(html.includes("Levels 1"));
});

Deno.test("renderCardHtml: party size tag present", () => {
  const html = renderCardHtml(makeEntry({ pmin: 3, pmax: 5 }), false);
  assert(html.includes("players"));
});

Deno.test("renderCardHtml: collapsed card has aria-expanded=false", () => {
  const html = renderCardHtml(makeEntry(), false);
  assert(html.includes('aria-expanded="false"'));
});

Deno.test("renderCardHtml: expanded card has aria-expanded=true and expanded class", () => {
  const html = renderCardHtml(makeEntry(), true);
  assert(html.includes('aria-expanded="true"'));
  assert(html.includes("result-card expanded"));
});

Deno.test("renderCardHtml: collapsed card has expand icon \u25b6", () => {
  const html = renderCardHtml(makeEntry(), false);
  assert(html.includes("\u25b6"));
});

Deno.test("renderCardHtml: expanded card has icon \u25b6 (CSS rotates it)", () => {
  const html = renderCardHtml(makeEntry(), true);
  assert(html.includes("\u25b6"));
});

Deno.test("renderCardHtml: expanded card contains card-expanded div", () => {
  const html = renderCardHtml(makeEntry(), true);
  assert(html.includes("card-expanded"));
});

Deno.test("renderCardHtml: card-expanded div always present (shown/hidden via CSS)", () => {
  const html = renderCardHtml(makeEntry(), false);
  assert(html.includes("card-expanded"));
});

// BUILD_EXPANDED_HTML
//////////////////////

// desc renders in renderCardHtml (.card-description-snippet), not here.
Deno.test("buildExpandedHtml: does not render description (handled in renderCardHtml)", () => {
  const html = buildExpandedHtml(
    makeEntry({ desc: "Forty undead creatures." }),
    false,
  );

  assert(!html.includes("card-description-full"));
  assert(!html.includes("card-description-snippet"));
});

Deno.test("buildExpandedHtml: publisher row present", () => {
  const html = buildExpandedHtml(makeEntry({ pub: "Lantern Press" }), false);
  assert(html.includes("Publisher"));
  assert(html.includes("Lantern Press"));
});

Deno.test("buildExpandedHtml: publisher row absent when null", () => {
  const html = buildExpandedHtml(makeEntry({ pub: null }), false);
  assert(!html.includes("Publisher"));
});

Deno.test("buildExpandedHtml: system row present", () => {
  const html = buildExpandedHtml(makeEntry({ systems: ["Shadowdark"] }), false);
  assert(html.includes("System"));
  assert(html.includes("Shadowdark"));
});

Deno.test("buildExpandedHtml: level range row present", () => {
  const html = buildExpandedHtml(makeEntry({ lmin: 1, lmax: 3 }), false);
  assert(html.includes("Level range"));
  assert(html.includes("Levels 1"));
});

Deno.test("buildExpandedHtml: level range row absent when null", () => {
  const html = buildExpandedHtml(
    makeEntry({ lmin: null, lmax: null }),
    false,
  );

  assert(!html.includes("Level range"));
});

Deno.test("buildExpandedHtml: page count row present", () => {
  const html = buildExpandedHtml(makeEntry({ pages: 32 }), false);
  assert(html.includes("Pages"));
  assert(html.includes("32"));
});

Deno.test("buildExpandedHtml: page count row absent when null", () => {
  const html = buildExpandedHtml(makeEntry({ pages: null }), false);
  assert(!html.includes("Pages"));
});

Deno.test("buildExpandedHtml: upcoming badge present for future dates", () => {
  const html = buildExpandedHtml(
    makeEntry({ date: "2099-01-01" }),
    true, // upcoming=true passed in
  );

  assert(html.includes("badge upcoming"));
});

Deno.test("buildExpandedHtml: no upcoming badge for past dates", () => {
  const html = buildExpandedHtml(
    makeEntry({ date: "2020-01-01" }),
    false,
  );

  assert(!html.includes("badge upcoming"));
});

Deno.test("buildExpandedHtml: links section present when links provided", () => {
  const entry = makeEntry({
    links: [{
      title: "Buy on DriveThru",
      url: "https://example.com",
      language: "en",
    }],
  });

  const html = buildExpandedHtml(entry, false);

  assert(html.includes("Links"));
  assert(html.includes("Buy on DriveThru"));
  assert(html.includes("https://example.com"));
});

Deno.test("buildExpandedHtml: links section absent when no links", () => {
  const html = buildExpandedHtml(makeEntry({ links: [] }), false);
  assert(!html.includes("card-links"));
});

Deno.test("buildExpandedHtml: non-English link gets language badge", () => {
  const entry = makeEntry({
    links: [{
      title: "Descargar",
      url: "https://example.com/es",
      language: "es",
    }],
  });

  const html = buildExpandedHtml(entry, false);

  assert(html.includes("lang-badge"));
  assert(html.includes("Spanish"));
});

Deno.test("buildExpandedHtml: English link does not get language badge", () => {
  const entry = makeEntry({
    links: [{
      title: "Download",
      url: "https://example.com/en",
      language: "en",
    }],
  });

  const html = buildExpandedHtml(entry, false);

  assert(!html.includes("lang-badge"));
});

Deno.test("buildExpandedHtml: link type description shown with stylized type", () => {
  const entry = makeEntry({
    links: [{
      title: "Buy it",
      url: "https://example.com",
      language: "en",
      type: "ebook",
    }],
  });

  const html = buildExpandedHtml(entry, false);

  assert(html.includes("link-type-desc"));
  assert(html.includes("eBook"));
});

Deno.test("buildExpandedHtml: link type description absent when type is absent", () => {
  const entry = makeEntry({
    links: [{ title: "Buy it", url: "https://example.com", language: "en" }],
  });

  const html = buildExpandedHtml(entry, false);

  assert(!html.includes("link-type-desc"));
  assert(!html.includes("eBook"));
});

Deno.test("buildExpandedHtml: link pricing badge shown for each link", () => {
  const entry = makeEntry({
    links: [{
      title: "Get it",
      url: "https://example.com",
      language: "en",
      type: "ebook",
      pricing: "free",
    }],
  });

  const html = buildExpandedHtml(entry, false);

  assert(html.includes("link-pricing-badge"));
  assert(html.includes("Free"));
});

Deno.test("buildExpandedHtml: link pricing badge shows Paid label", () => {
  const entry = makeEntry({
    links: [{
      title: "Buy it",
      url: "https://example.com",
      language: "en",
      type: "ebook",
      pricing: "paid",
    }],
  });

  const html = buildExpandedHtml(entry, false);

  assert(html.includes("link-pricing-badge"));
  assert(html.includes("Paid"));
});

Deno.test("buildExpandedHtml: link pricing badge shows PWYW label", () => {
  const entry = makeEntry({
    links: [{
      title: "Download",
      url: "https://example.com",
      language: "en",
      type: "ebook",
      pricing: "pwyw",
    }],
  });

  const html = buildExpandedHtml(entry, false);

  assert(html.includes("link-pricing-badge"));
  assert(html.includes("PWYW"));
});

Deno.test("buildExpandedHtml: different links show different pricing badges", () => {
  const entry = makeEntry({
    links: [
      {
        title: "Free PDF",
        url: "https://example.com/free",
        language: "en",
        type: "ebook",
        pricing: "free",
      },
      {
        title: "Buy Print",
        url: "https://example.com/print",
        language: "en",
        type: "print",
        pricing: "paid",
      },
    ],
  });

  const html = buildExpandedHtml(entry, false);

  assert(html.includes("Free"));
  assert(html.includes("Paid"));
});

Deno.test("buildExpandedHtml: character_options row present when set", () => {
  const html = buildExpandedHtml(
    makeEntry({ character_options: ["Witch", "Warlock"] }),
    false,
  );

  assert(html.includes("Character Options"));
  assert(html.includes("Witch"));
  assert(html.includes("Warlock"));
});

Deno.test("buildExpandedHtml: character_options row absent when empty or absent", () => {
  const html = buildExpandedHtml(makeEntry({ character_options: [] }), false);
  assert(!html.includes("Character Options"));
});

Deno.test("buildExpandedHtml: included_in section uses id as label when state.data is null", () => {
  resetState(); // state.data = null
  const entry = makeEntry({ included_in: ["shadows-and-steel-zine-1"] });
  const html = buildExpandedHtml(entry, false);
  assert(html.includes("Included in"));
  assert(html.includes("shadows-and-steel-zine-1"));
});

Deno.test("buildExpandedHtml: included_in section resolves title from state.data", () => {
  resetState();

  state.data = [{
    id: "shadows-and-steel-zine-1",
    title: "Shadows & Steel #1",
  } as Entry];

  const entry = makeEntry({ included_in: ["shadows-and-steel-zine-1"] });
  const html = buildExpandedHtml(entry, false);

  assert(html.includes("Included in"));
  assert(html.includes("Shadows &amp; Steel #1"));
});

Deno.test("buildExpandedHtml: no included_in section when field absent", () => {
  const html = buildExpandedHtml(makeEntry(), false);
  assert(!html.includes("Included in"));
});

Deno.test("buildExpandedHtml: children section resolves title from state.data", () => {
  resetState();
  state.data = [
    { id: "the-sunken-chapel", title: "The Sunken Chapel" } as Entry,
  ];
  const entry = makeEntry({ children: ["the-sunken-chapel"] });
  const html = buildExpandedHtml(entry, false);
  assert(html.includes("Includes"));
  assert(html.includes("The Sunken Chapel"));
});

Deno.test("buildExpandedHtml: no children section when children is empty", () => {
  const html = buildExpandedHtml(makeEntry({ children: [] }), false);
  assert(!html.includes("Contents"));
});

Deno.test("buildExpandedHtml: always contains report-issue link", () => {
  const html = buildExpandedHtml(makeEntry(), false);
  assert(html.includes("report-issue-link"));
  assert(html.includes("torchfinder-data/issues/new"));
});

Deno.test("buildExpandedHtml: report link encodes entry id in URL", () => {
  const html = buildExpandedHtml(makeEntry({ id: "the-tomb-of-ash" }), false);
  assert(html.includes("the-tomb-of-ash"));
});

// RENDER_CARD_HTML: COVER IMAGE CONSENT
////////////////////////////////////////

Deno.test("renderCardHtml: cover not rendered without consent", () => {
  localStorage.removeItem("tf-cover-consent");

  const html = renderCardHtml(
    makeEntry({ cover: "https://example.com/cover.jpg" }),
    false,
  );

  assert(!html.includes("card-cover"));
  assert(!html.includes("example.com/cover.jpg"));
});

Deno.test("renderCardHtml: cover not rendered when consent is denied", () => {
  setCoverConsent("denied");

  const html = renderCardHtml(
    makeEntry({ cover: "https://example.com/cover.jpg" }),
    false,
  );

  assert(!html.includes("card-cover"));

  localStorage.removeItem("tf-cover-consent");
});

Deno.test("renderCardHtml: cover rendered when consent is granted", () => {
  setCoverConsent("granted");

  const html = renderCardHtml(
    makeEntry({ cover: "https://example.com/cover.jpg" }),
    false,
  );

  assert(html.includes("card-cover"));
  assert(html.includes("example.com/cover.jpg"));

  localStorage.removeItem("tf-cover-consent");
});

Deno.test("renderCardHtml: no cover rendered when consent granted but cover is null", () => {
  setCoverConsent("granted");
  const html = renderCardHtml(makeEntry({ cover: null }), false);
  assert(!html.includes("card-cover"));
  localStorage.removeItem("tf-cover-consent");
});

// RENDER_CARD_HTML: DIRECT_ID TITLE RENDERING
//////////////////////////////////////////////

Deno.test("renderCardHtml: title is an anchor when state.directId does not match entry", () => {
  resetState();
  state.directId = "some-other-id";
  const html = renderCardHtml(makeEntry({ id: "test-entry" }), false);
  assert(html.includes('<a class="card-title-link"'));
  assert(!html.includes('<span class="card-title-link"'));
});

Deno.test("renderCardHtml: title is a span (not anchor) when state.directId matches entry", () => {
  resetState();
  state.directId = "test-entry";
  const html = renderCardHtml(makeEntry({ id: "test-entry" }), true);
  assert(html.includes('<span class="card-title-link"'));
  assert(!html.includes('<a class="card-title-link"'));
});

Deno.test("renderCardHtml: + List button is present", () => {
  const html = renderCardHtml(makeEntry({ id: "test-entry" }), false);
  assert(html.includes("add-to-list-btn"));
  assert(html.includes("+ List"));
});

Deno.test("renderCardHtml: Copy link button is present", () => {
  const html = renderCardHtml(makeEntry({ id: "test-entry" }), false);
  assert(html.includes("copy-entry-link-btn"));
  assert(html.includes("Copy link"));
});

// BUILD_EXPANDED_HTML: INCLUDES / SECTION ORDERING
///////////////////////////////////////////////////

Deno.test("buildExpandedHtml: children section label is 'Includes'", () => {
  resetState();
  state.data = [{ id: "child-1", title: "Child Entry" } as Entry];
  const html = buildExpandedHtml(makeEntry({ children: ["child-1"] }), false);
  assert(html.includes("Includes"));
  assert(!html.includes("Contents"));
});

Deno.test("buildExpandedHtml: Links section appears after Includes section", () => {
  resetState();

  state.data = [{ id: "child-1", title: "Child" } as Entry];

  const entry = makeEntry({
    children: ["child-1"],
    links: [{ title: "Buy it", url: "https://example.com", language: "en" }],
  });

  const html = buildExpandedHtml(entry, false);
  const includesIdx = html.indexOf("Includes");
  const linksIdx = html.indexOf("Links");

  assert(includesIdx !== -1);
  assert(linksIdx !== -1);
  assert(linksIdx > includesIdx);
});
