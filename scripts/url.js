import { state } from './state.js';
import { encodeListPayload, decodeListPayload } from './lists.js';

export function parseUrlParams(params = new URLSearchParams(window.location.search)) {
  const listPayload = params.get('list');
  const directId = params.get('id') || null;

  if (listPayload !== null) {
    state.listMode = true;
    state.listEntries = decodeListPayload(listPayload);
    state.listName = params.get('list-name') || 'Untitled list';
    state.listDescription = params.get('list-description') || '';
    state.listId = params.get('list-id') || null;
    state.directId = directId; // Also restore direct ID context if present (entry viewed from within a list).
    return;
  }

  state.listMode = false;
  state.listEntries = [];
  state.listName = '';
  state.listDescription = '';
  state.listId = null;

  state.directId = directId;
  state.query = params.get('q') || '';
  state.sort = params.get('sort') || 'title';
  state.sortReverse = params.get('reverse') === 'true';
  const parsedPage = parseInt(params.get('page') || '1', 10);
  state.page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);

  function parseArray(key) {
    const val = params.get(key);
    return val ? val.split(',').filter(Boolean) : [];
  }

  state.filters.categories = parseArray('category');
  if (params.has('systems')) state.filters.systems = parseArray('systems');
  state.filters.settings = parseArray('settings');
  state.filters.envs = parseArray('envs');
  state.filters.themes = parseArray('themes');
  state.filters.languages = parseArray('languages');
  state.filters.pub = parseArray('pub');
  state.filters.authors = parseArray('authors');

  state.filters.pricings = parseArray('pricings');
  state.filters.character_options = parseArray('character_options');
  state.filters.hasCharacterOptions = params.get('has_character_options') === 'true';
  state.filters.official = params.get('official') === 'true';
  state.filters.upcoming = params.get('upcoming') === 'true';
  state.filters.excludeUnspecifiedLevel = params.get('exclude_level') === 'true';
  state.filters.excludeUnspecifiedParty = params.get('exclude_party') === 'true';

  function parseIntParam(key) {
    const s = params.get(key);
    if (s === null || s === '') return null;
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  }

  state.filters.lmin = parseIntParam('lmin');
  state.filters.lmax = parseIntParam('lmax');
  state.filters.pmin = parseIntParam('pmin');
  state.filters.pmax = parseIntParam('pmax');

  function parseYearMonth(key) {
    const s = params.get(key);
    return s && /^\d{4}-\d{2}$/.test(s) ? s : null;
  }

  state.filters.dmin = parseYearMonth('dmin');
  state.filters.dmax = parseYearMonth('dmax');
}

export function buildUrlParams() {
  const params = new URLSearchParams();

  if (state.directId) {
    params.set('id', state.directId);

    // If we're also in list mode, include list context so refreshing restores it.
    if (state.listMode) {
      params.set('list', encodeListPayload(state.listEntries));
      if (state.listName) params.set('list-name', state.listName);
      if (state.listDescription) params.set('list-description', state.listDescription);
      if (state.listId) params.set('list-id', state.listId);
    }

    return params;
  }

  // List mode only: emit list params, no filter params.
  if (state.listMode) {
    params.set('list', encodeListPayload(state.listEntries));
    if (state.listName) params.set('list-name', state.listName);
    if (state.listDescription) params.set('list-description', state.listDescription);
    if (state.listId) params.set('list-id', state.listId);
    return params;
  }

  if (state.query) params.set('q', state.query);
  if (state.sort && state.sort !== 'title') params.set('sort', state.sort);
  if (state.sortReverse) params.set('reverse', 'true');
  if (state.page > 1) params.set('page', String(state.page));

  function setArray(key, arr) {
    if (arr.length) params.set(key, arr.join(','));
  }

  setArray('category', state.filters.categories);
  setArray('systems', state.filters.systems);
  setArray('settings', state.filters.settings);
  setArray('envs', state.filters.envs);
  setArray('themes', state.filters.themes);
  setArray('languages', state.filters.languages);
  setArray('pub', state.filters.pub);
  setArray('authors', state.filters.authors);
  setArray('pricings', state.filters.pricings);
  setArray('character_options', state.filters.character_options);

  if (state.filters.hasCharacterOptions) params.set('has_character_options', 'true');
  if (state.filters.official) params.set('official', 'true');
  if (state.filters.upcoming) params.set('upcoming', 'true');
  if (state.filters.excludeUnspecifiedLevel) params.set('exclude_level', 'true');
  if (state.filters.excludeUnspecifiedParty) params.set('exclude_party', 'true');

  if (state.filters.lmin !== null) params.set('lmin', String(state.filters.lmin));
  if (state.filters.lmax !== null) params.set('lmax', String(state.filters.lmax));
  if (state.filters.pmin !== null) params.set('pmin', String(state.filters.pmin));
  if (state.filters.pmax !== null) params.set('pmax', String(state.filters.pmax));
  if (state.filters.dmin !== null) params.set('dmin', state.filters.dmin);
  if (state.filters.dmax !== null) params.set('dmax', state.filters.dmax);

  return params;
}

export function updateUrl() {
  const params = buildUrlParams();
  const qs = params.toString();
  const newUrl = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  history.replaceState(null, '', newUrl);
}
