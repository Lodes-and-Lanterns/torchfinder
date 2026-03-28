import { assertEquals } from "@std/assert";
import { state } from "../src/state.ts";
import { buildUrlParams, parseUrlParams } from "../src/url.ts";
import { encodeListPayload } from "../src/lists.ts";

// Utilities
////////////

function resetState() {
  state.directId = null;
  state.listMode = false;
  state.listId = null;
  state.listName = "";
  state.listDescription = "";
  state.listEntries = [];
  state.listSynced = false;
  state.query = "";
  state.sort = "title";
  state.sortReverse = false;
  state.page = 1;
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
}

function p(search: string) {
  return new URLSearchParams(search);
}

// BUILD_URL_PARAMS
///////////////////

Deno.test("buildUrlParams: default state produces empty params", () => {
  resetState();
  const params = buildUrlParams();
  assertEquals(params.toString(), "");
});

Deno.test("buildUrlParams: query string is encoded", () => {
  resetState();
  state.query = "shadowdark";
  const params = buildUrlParams();
  assertEquals(params.get("q"), "shadowdark");
});

Deno.test("buildUrlParams: default sort (title) is omitted", () => {
  resetState();
  state.sort = "title";
  assertEquals(buildUrlParams().has("sort"), false);
});

Deno.test("buildUrlParams: non-default sort is included", () => {
  resetState();
  state.sort = "date";
  assertEquals(buildUrlParams().get("sort"), "date");
});

Deno.test("buildUrlParams: shuffle sort is included", () => {
  resetState();
  state.sort = "shuffle";
  assertEquals(buildUrlParams().get("sort"), "shuffle");
});

Deno.test("buildUrlParams: sortReverse=false is omitted", () => {
  resetState();
  state.sortReverse = false;
  assertEquals(buildUrlParams().has("reverse"), false);
});

Deno.test("buildUrlParams: sortReverse=true is included", () => {
  resetState();
  state.sortReverse = true;
  assertEquals(buildUrlParams().get("reverse"), "true");
});

Deno.test("buildUrlParams: page=1 is omitted", () => {
  resetState();
  state.page = 1;
  assertEquals(buildUrlParams().has("page"), false);
});

Deno.test("buildUrlParams: page>1 is included", () => {
  resetState();
  state.page = 3;
  assertEquals(buildUrlParams().get("page"), "3");
});

Deno.test("buildUrlParams: single category filter encoded", () => {
  resetState();
  state.filters.categories = ["Adventure"];
  assertEquals(buildUrlParams().get("category"), "Adventure");
});

Deno.test("buildUrlParams: multiple filter values joined with comma", () => {
  resetState();
  state.filters.systems = ["Shadowdark", "Soulblight"];
  assertEquals(buildUrlParams().get("systems"), "Shadowdark,Soulblight");
});

Deno.test("buildUrlParams: empty filter array is omitted", () => {
  resetState();
  state.filters.categories = [];
  assertEquals(buildUrlParams().has("category"), false);
});

Deno.test("buildUrlParams: all array filter keys encoded", () => {
  resetState();

  state.filters.categories = ["Adventure"];
  state.filters.systems = ["Shadowdark"];
  state.filters.settings = ["Western Reaches"];
  state.filters.envs = ["Dungeon"];
  state.filters.themes = ["Horror"];
  state.filters.languages = ["en"];
  state.filters.pub = ["Iron Gate"];
  state.filters.authors = ["Alice"];
  state.filters.pricings = ["free"];
  state.filters.character_options = ["Witch"];

  const params = buildUrlParams();

  assertEquals(params.get("category"), "Adventure");
  assertEquals(params.get("systems"), "Shadowdark");
  assertEquals(params.get("settings"), "Western Reaches");
  assertEquals(params.get("envs"), "Dungeon");
  assertEquals(params.get("themes"), "Horror");
  assertEquals(params.get("languages"), "en");
  assertEquals(params.get("pub"), "Iron Gate");
  assertEquals(params.get("authors"), "Alice");
  assertEquals(params.get("pricings"), "free");
  assertEquals(params.get("character_options"), "Witch");
});

Deno.test("buildUrlParams: hasCharacterOptions=false is omitted", () => {
  resetState();
  assertEquals(buildUrlParams().has("has_character_options"), false);
});

Deno.test("buildUrlParams: hasCharacterOptions=true is included", () => {
  resetState();
  state.filters.hasCharacterOptions = true;
  assertEquals(buildUrlParams().get("has_character_options"), "true");
});

Deno.test("parseUrlParams: has_character_options=true sets flag", () => {
  resetState();
  parseUrlParams(p("has_character_options=true"));
  assertEquals(state.filters.hasCharacterOptions, true);
});

Deno.test("parseUrlParams: has_character_options absent leaves flag false", () => {
  resetState();
  parseUrlParams(p(""));
  assertEquals(state.filters.hasCharacterOptions, false);
});

Deno.test("buildUrlParams: official=false is omitted", () => {
  resetState();
  assertEquals(buildUrlParams().has("official"), false);
});

Deno.test("buildUrlParams: official=true is included", () => {
  resetState();
  state.filters.official = true;
  assertEquals(buildUrlParams().get("official"), "true");
});

Deno.test("buildUrlParams: upcoming=false is omitted", () => {
  resetState();
  assertEquals(buildUrlParams().has("upcoming"), false);
});

Deno.test("buildUrlParams: upcoming=true is included", () => {
  resetState();
  state.filters.upcoming = true;
  assertEquals(buildUrlParams().get("upcoming"), "true");
});

Deno.test("buildUrlParams: excludeUnspecifiedLevel=true is included", () => {
  resetState();
  state.filters.excludeUnspecifiedLevel = true;
  assertEquals(buildUrlParams().get("exclude_level"), "true");
});

Deno.test("buildUrlParams: excludeUnspecifiedParty=true is included", () => {
  resetState();
  state.filters.excludeUnspecifiedParty = true;
  assertEquals(buildUrlParams().get("exclude_party"), "true");
});

Deno.test("buildUrlParams: null lmin is omitted", () => {
  resetState();
  assertEquals(buildUrlParams().has("lmin"), false);
});

Deno.test("buildUrlParams: lmin/lmax encoded as strings", () => {
  resetState();

  state.filters.lmin = 2;
  state.filters.lmax = 5;

  const params = buildUrlParams();

  assertEquals(params.get("lmin"), "2");
  assertEquals(params.get("lmax"), "5");
});

Deno.test("buildUrlParams: pmin/pmax encoded as strings", () => {
  resetState();

  state.filters.pmin = 3;
  state.filters.pmax = 6;

  const params = buildUrlParams();

  assertEquals(params.get("pmin"), "3");
  assertEquals(params.get("pmax"), "6");
});

Deno.test("buildUrlParams: null dmin is omitted", () => {
  resetState();
  assertEquals(buildUrlParams().has("dmin"), false);
});

Deno.test("buildUrlParams: null dmax is omitted", () => {
  resetState();
  assertEquals(buildUrlParams().has("dmax"), false);
});

Deno.test("buildUrlParams: dmin/dmax encoded as YYYY-MM strings", () => {
  resetState();

  state.filters.dmin = "2023-06";
  state.filters.dmax = "2024-12";

  const params = buildUrlParams();

  assertEquals(params.get("dmin"), "2023-06");
  assertEquals(params.get("dmax"), "2024-12");
});

Deno.test("parseUrlParams: dmin and dmax parsed as strings", () => {
  resetState();
  parseUrlParams(p("dmin=2023-06&dmax=2024-12"));
  assertEquals(state.filters.dmin, "2023-06");
  assertEquals(state.filters.dmax, "2024-12");
});

Deno.test("parseUrlParams: absent dmin/dmax leaves nulls", () => {
  resetState();
  parseUrlParams(p(""));
  assertEquals(state.filters.dmin, null);
  assertEquals(state.filters.dmax, null);
});

Deno.test("parseUrlParams: invalid dmin/dmax format is treated as null", () => {
  resetState();
  parseUrlParams(p("dmin=not-valid&dmax=2024-1"));
  assertEquals(state.filters.dmin, null);
  assertEquals(state.filters.dmax, null);
});

Deno.test("buildUrlParams: directId mode emits only id param", () => {
  resetState();

  state.directId = "some-adventure";

  const params = buildUrlParams();

  assertEquals(params.get("id"), "some-adventure");
  assertEquals(params.has("q"), false);
  assertEquals(params.has("list"), false);
  assertEquals(params.has("sort"), false);
});

Deno.test("buildUrlParams: directId + listMode emits id and list params", () => {
  resetState();

  state.directId = "entry-123";
  state.listMode = true;
  state.listEntries = ["a", "b"];
  state.listName = "My List";
  state.listDescription = "A cool list";
  state.listId = "abc12345";

  const params = buildUrlParams();

  assertEquals(params.get("id"), "entry-123");
  assertEquals(params.has("list"), true);
  assertEquals(params.get("list-name"), "My List");
  assertEquals(params.get("list-description"), "A cool list");
  assertEquals(params.get("list-id"), "abc12345");

  // Filter params must NOT appear in directId mode
  assertEquals(params.has("q"), false);
  assertEquals(params.has("category"), false);
});

Deno.test("buildUrlParams: list mode emits list params and no filter params", () => {
  resetState();

  state.listMode = true;
  state.listEntries = ["entry-1", "entry-2"];
  state.listName = "Cool Adventures";
  state.listDescription = "My picks";
  state.listId = "zzz99999";
  state.query = "ignored"; // should NOT appear
  state.filters.categories = ["Adventure"]; // should NOT appear

  const params = buildUrlParams();

  assertEquals(params.has("list"), true);
  assertEquals(params.get("list-name"), "Cool Adventures");
  assertEquals(params.get("list-description"), "My picks");
  assertEquals(params.get("list-id"), "zzz99999");
  assertEquals(params.has("q"), false);
  assertEquals(params.has("category"), false);
});

Deno.test("buildUrlParams: list mode without name/description/id omits those keys", () => {
  resetState();

  state.listMode = true;
  state.listEntries = ["x"];

  const params = buildUrlParams();

  assertEquals(params.has("list"), true);
  assertEquals(params.has("list-name"), false);
  assertEquals(params.has("list-description"), false);
  assertEquals(params.has("list-id"), false);
});

// PARSE_URL_PARAMS
///////////////////

Deno.test("parseUrlParams: empty params resets to default state", () => {
  resetState();

  parseUrlParams(p(""));

  assertEquals(state.listMode, false);
  assertEquals(state.directId, null);
  assertEquals(state.query, "");
  assertEquals(state.sort, "title");
  assertEquals(state.sortReverse, false);
  assertEquals(state.page, 1);
  assertEquals(state.filters.categories, []);
  assertEquals(state.filters.lmin, null);
});

Deno.test("parseUrlParams: q restores query", () => {
  resetState();
  parseUrlParams(p("q=dungeon"));
  assertEquals(state.query, "dungeon");
});

Deno.test("parseUrlParams: sort restores sort", () => {
  resetState();
  parseUrlParams(p("sort=date"));
  assertEquals(state.sort, "date");
});

Deno.test("parseUrlParams: missing sort defaults to title", () => {
  resetState();
  parseUrlParams(p(""));
  assertEquals(state.sort, "title");
});

Deno.test("parseUrlParams: reverse=true sets sortReverse", () => {
  resetState();
  parseUrlParams(p("reverse=true"));
  assertEquals(state.sortReverse, true);
});

Deno.test("parseUrlParams: reverse absent leaves sortReverse false", () => {
  resetState();
  parseUrlParams(p(""));
  assertEquals(state.sortReverse, false);
});

Deno.test("parseUrlParams: page restores page number", () => {
  resetState();
  parseUrlParams(p("page=4"));
  assertEquals(state.page, 4);
});

Deno.test("parseUrlParams: missing page defaults to 1", () => {
  resetState();
  parseUrlParams(p(""));
  assertEquals(state.page, 1);
});

Deno.test("parseUrlParams: invalid page value defaults to 1", () => {
  resetState();
  parseUrlParams(p("page=banana"));
  assertEquals(state.page, 1);
});

Deno.test("parseUrlParams: single category value parsed", () => {
  resetState();
  parseUrlParams(p("category=Adventure"));
  assertEquals(state.filters.categories, ["Adventure"]);
});

Deno.test("parseUrlParams: multiple comma-separated values parsed", () => {
  resetState();
  parseUrlParams(p("systems=Shadowdark,Soulblight"));
  assertEquals(state.filters.systems, ["Shadowdark", "Soulblight"]);
});

Deno.test("parseUrlParams: absent systems param leaves systems unchanged", () => {
  resetState();
  state.filters.systems = ["Shadowdark"]; // simulates the real state default
  parseUrlParams(p("q=dungeon"));
  assertEquals(state.filters.systems, ["Shadowdark"]);
});

Deno.test("parseUrlParams: all array filter keys parsed", () => {
  resetState();

  parseUrlParams(p(
    "category=Adventure&systems=Shadowdark&settings=Western+Reaches" +
      "&envs=Dungeon&themes=Horror" +
      "&languages=en&pub=Iron+Gate&authors=Alice&pricings=free&character_options=Witch",
  ));

  assertEquals(state.filters.categories, ["Adventure"]);
  assertEquals(state.filters.systems, ["Shadowdark"]);
  assertEquals(state.filters.settings, ["Western Reaches"]);
  assertEquals(state.filters.envs, ["Dungeon"]);
  assertEquals(state.filters.themes, ["Horror"]);
  assertEquals(state.filters.languages, ["en"]);
  assertEquals(state.filters.pub, ["Iron Gate"]);
  assertEquals(state.filters.authors, ["Alice"]);
  assertEquals(state.filters.pricings, ["free"]);
  assertEquals(state.filters.character_options, ["Witch"]);
});

Deno.test("parseUrlParams: official=true sets flag", () => {
  resetState();
  parseUrlParams(p("official=true"));
  assertEquals(state.filters.official, true);
});

Deno.test("parseUrlParams: official absent leaves flag false", () => {
  resetState();
  parseUrlParams(p(""));
  assertEquals(state.filters.official, false);
});

Deno.test("parseUrlParams: upcoming=true sets flag", () => {
  resetState();
  parseUrlParams(p("upcoming=true"));
  assertEquals(state.filters.upcoming, true);
});

Deno.test("parseUrlParams: upcoming absent leaves flag false", () => {
  resetState();
  parseUrlParams(p(""));
  assertEquals(state.filters.upcoming, false);
});

Deno.test("parseUrlParams: exclude_level=true sets excludeUnspecifiedLevel", () => {
  resetState();
  parseUrlParams(p("exclude_level=true"));
  assertEquals(state.filters.excludeUnspecifiedLevel, true);
});

Deno.test("parseUrlParams: exclude_party=true sets excludeUnspecifiedParty", () => {
  resetState();
  parseUrlParams(p("exclude_party=true"));
  assertEquals(state.filters.excludeUnspecifiedParty, true);
});

Deno.test("parseUrlParams: lmin and lmax parsed as integers", () => {
  resetState();
  parseUrlParams(p("lmin=2&lmax=5"));
  assertEquals(state.filters.lmin, 2);
  assertEquals(state.filters.lmax, 5);
});

Deno.test("parseUrlParams: non-numeric range params default to null", () => {
  resetState();
  parseUrlParams(p("lmin=abc&lmax=xyz&pmin=foo&pmax=bar"));
  assertEquals(state.filters.lmin, null);
  assertEquals(state.filters.lmax, null);
  assertEquals(state.filters.pmin, null);
  assertEquals(state.filters.pmax, null);
});

Deno.test("parseUrlParams: absent level params leave nulls", () => {
  resetState();
  parseUrlParams(p(""));
  assertEquals(state.filters.lmin, null);
  assertEquals(state.filters.lmax, null);
});

Deno.test("parseUrlParams: pmin and pmax parsed as integers", () => {
  resetState();
  parseUrlParams(p("pmin=3&pmax=6"));
  assertEquals(state.filters.pmin, 3);
  assertEquals(state.filters.pmax, 6);
});

Deno.test("parseUrlParams: id param sets directId", () => {
  resetState();
  parseUrlParams(p("id=some-adventure"));
  assertEquals(state.directId, "some-adventure");
});

Deno.test("parseUrlParams: list param triggers list mode", () => {
  resetState();

  const encoded = encodeListPayload(["entry-1", "entry-2"]);

  parseUrlParams(
    p(`list=${encoded}&list-name=My+List&list-description=Cool&list-id=abc12345`),
  );

  assertEquals(state.listMode, true);
  assertEquals(state.listEntries, ["entry-1", "entry-2"]);
  assertEquals(state.listName, "My List");
  assertEquals(state.listDescription, "Cool");
  assertEquals(state.listId, "abc12345");
});

Deno.test("parseUrlParams: list mode without name/id uses defaults", () => {
  resetState();

  const encoded = encodeListPayload([]);

  parseUrlParams(p(`list=${encoded}`));

  assertEquals(state.listMode, true);
  assertEquals(state.listName, "Untitled list");
  assertEquals(state.listDescription, "");
  assertEquals(state.listId, null);
});

Deno.test("parseUrlParams: list mode + id restores directId too", () => {
  resetState();
  const encoded = encodeListPayload(["a", "b"]);
  parseUrlParams(p(`list=${encoded}&list-name=Test&id=entry-x`));
  assertEquals(state.listMode, true);
  assertEquals(state.directId, "entry-x");
});

// BUILD_URL_PARAMS / PARSE_URL_PARAMS ROUND-TRIPS
//////////////////////////////////////////////////

Deno.test("round-trip: filter-mode state survives encode-decode", () => {
  resetState();

  state.query = "dungeon";
  state.sort = "date";
  state.sortReverse = true;
  state.page = 2;
  state.filters.categories = ["Adventure"];
  state.filters.systems = ["Shadowdark", "Soulblight"];
  state.filters.pricings = ["free", "pwyw"];
  state.filters.official = true;
  state.filters.upcoming = true;
  state.filters.excludeUnspecifiedLevel = true;
  state.filters.lmin = 1;
  state.filters.lmax = 4;
  state.filters.pmin = 3;
  state.filters.pmax = 5;
  state.filters.dmin = "2023-01";
  state.filters.dmax = "2024-12";

  const params = buildUrlParams();

  // Wipe state, then restore via parseUrlParams
  resetState();

  parseUrlParams(params);

  assertEquals(state.query, "dungeon");
  assertEquals(state.sort, "date");
  assertEquals(state.sortReverse, true);
  assertEquals(state.page, 2);
  assertEquals(state.filters.categories, ["Adventure"]);
  assertEquals(state.filters.systems, ["Shadowdark", "Soulblight"]);
  assertEquals(state.filters.pricings, ["free", "pwyw"]);
  assertEquals(state.filters.official, true);
  assertEquals(state.filters.upcoming, true);
  assertEquals(state.filters.excludeUnspecifiedLevel, true);
  assertEquals(state.filters.lmin, 1);
  assertEquals(state.filters.lmax, 4);
  assertEquals(state.filters.pmin, 3);
  assertEquals(state.filters.pmax, 5);
  assertEquals(state.filters.dmin, "2023-01");
  assertEquals(state.filters.dmax, "2024-12");
});

Deno.test("round-trip: list mode state survives encode-decode", () => {
  resetState();

  state.listMode = true;
  state.listEntries = ["adv-001", "zine-99"];
  state.listName = "My Picks";
  state.listDescription = "The best ones";
  state.listId = "ff00ff00";

  const params = buildUrlParams();
  resetState();
  parseUrlParams(params);

  assertEquals(state.listMode, true);
  assertEquals(state.listEntries, ["adv-001", "zine-99"]);
  assertEquals(state.listName, "My Picks");
  assertEquals(state.listDescription, "The best ones");
  assertEquals(state.listId, "ff00ff00");
});

Deno.test("round-trip: directId mode state survives encode-decode", () => {
  resetState();

  state.directId = "target-entry";

  const params = buildUrlParams();
  resetState();
  parseUrlParams(params);

  assertEquals(state.directId, "target-entry");
  assertEquals(state.listMode, false);
});

Deno.test("round-trip: directId + list mode state survives encode-decode", () => {
  resetState();

  state.directId = "entry-x";
  state.listMode = true;
  state.listEntries = ["a", "b", "c"];
  state.listName = "Stack";
  state.listId = "aabbccdd";

  const params = buildUrlParams();
  resetState();
  parseUrlParams(params);

  assertEquals(state.directId, "entry-x");
  assertEquals(state.listMode, true);
  assertEquals(state.listEntries, ["a", "b", "c"]);
  assertEquals(state.listName, "Stack");
  assertEquals(state.listId, "aabbccdd");
});
