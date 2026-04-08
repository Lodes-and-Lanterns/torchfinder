import { state } from "../src/state.ts";
import type { Entry } from "../src/types.ts";

export function resetState(): void {
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

export function makeEntry(overrides: Partial<Entry> = {}): Entry {
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
