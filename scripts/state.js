export const DATA_URL = "dist/torchfinder-dataset.jsonl";
export const PAGE_SIZE = 25;
export const SEARCH_DEBOUNCE_MS = 200;
export const SITE_URL = "https://torchfinder.lodesandlanterns.com";

export const state = {
  data: null,
  filtered: [],
  query: "",
  filters: {
    categories: [],
    systems: ["Shadowdark"],
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
  },
  sort: "title",
  sortReverse: false,
  page: 1,
  directId: null,
  expandedCardId: null,
  listMode: false,
  listId: null,
  listName: "",
  listDescription: "",
  listEntries: [],
  listSynced: false,
};
