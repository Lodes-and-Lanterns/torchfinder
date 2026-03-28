export interface Link {
  title: string;
  url: string;
  language: string;
  type?: string;
  pricing?: string;
}

export interface Entry {
  id: string;
  title?: string;
  desc?: string;
  authors?: string[];
  categories?: string[];
  systems?: string[];
  settings?: string[];
  envs?: string[];
  themes?: string[];
  languages?: string[];
  pub?: string | null;
  pricings?: string[];
  character_options?: string[];
  lmin?: number | null;
  lmax?: number | null;
  pmin?: number | null;
  pmax?: number | null;
  pages?: number | null;
  date?: string | null;
  official?: boolean;
  cover?: string | null;
  links?: Link[];
  included_in?: string[];
  children?: string[];
}

export interface Filters {
  categories: string[];
  systems: string[];
  settings: string[];
  envs: string[];
  themes: string[];
  languages: string[];
  pub: string[];
  authors: string[];
  pricings: string[];
  character_options: string[];
  hasCharacterOptions: boolean;
  official: boolean;
  upcoming: boolean;
  excludeUnspecifiedLevel: boolean;
  excludeUnspecifiedParty: boolean;
  lmin: number | null;
  lmax: number | null;
  pmin: number | null;
  pmax: number | null;
  dmin: string | null;
  dmax: string | null;
}

export interface AppState {
  data: Entry[] | null;
  filtered: Entry[];
  query: string;
  filters: Filters;
  sort: string;
  sortReverse: boolean;
  page: number;
  directId: string | null;
  expandedCardId: string | null;
  listMode: boolean;
  listId: string | null;
  listName: string;
  listDescription: string;
  listEntries: string[];
  listSynced: boolean;
}

export interface SavedList {
  id: string;
  name?: string;
  description?: string;
  entries: string[];
  createdAt?: string;
  updatedAt?: string;
  lastAccessedAt?: string;
}

export interface YearMonth {
  year: number;
  month: number;
}

export interface MonthPickerInstance {
  setValue(str: string | null): void;
  clear(): void;
  destroy(): void;
}

export interface MonthPickerOptions {
  isStart: boolean;
  getOtherValue: () => string | null;
  onSelect: (value: string) => void;
}
