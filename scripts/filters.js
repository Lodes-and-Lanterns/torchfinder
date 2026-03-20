import { state } from './state.js?v=3b3e6c26';
import { isUpcoming } from './utils.js?v=3b3e6c26';

export function hasActiveFilters() {
  const f = state.filters;

  return (
    state.query !== '' ||
    f.categories.length > 0 ||
    f.systems.length > 0 ||
    f.settings.length > 0 ||
    f.envs.length > 0 ||
    f.themes.length > 0 ||
    f.languages.length > 0 ||
    f.pub.length > 0 ||
    f.authors.length > 0 ||
    f.pricings.length > 0 ||
    f.character_options.length > 0 ||
    f.hasCharacterOptions ||
    f.official ||
    f.upcoming ||
    f.excludeUnspecifiedLevel ||
    f.excludeUnspecifiedParty ||
    f.lmin !== null ||
    f.lmax !== null ||
    f.pmin !== null ||
    f.pmax !== null ||
    f.dmin !== null ||
    f.dmax !== null
  );
}

export function matchesText(entry, query) {
  const q = query.toLowerCase();

  return (
    (entry.title || '').toLowerCase().includes(q) ||
    (entry.desc || '').toLowerCase().includes(q) ||
    (entry.authors || []).some((a) => a.toLowerCase().includes(q)) ||
    (entry.pub || '').toLowerCase().includes(q) ||
    (entry.character_options || []).some((c) => c.toLowerCase().includes(q))
  );
}

// Normalises a date string (YYYY-MM-DD, YYYY-MM, or YYYY) to YYYY-MM for comparison.
function normDateToMonth(d) {
  if (!d) return null;
  const parts = d.split('-');
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : `${parts[0]}-01`;
}

// Returns true if the entry's range overlaps with the filter range.
// If either endpoint is null on the entry, treat as unspecified.
// If no filter is active, always return true.
export function rangesOverlap(entryMin, entryMax, filterMin, filterMax, excludeUnspecified) {
  const hasEntry = entryMin !== null || entryMax !== null;

  // Entry has no range data: exclude if requested, otherwise include.
  if (!hasEntry) return !excludeUnspecified;

  // Entry has range data; if no range filter is active, include it.
  const hasFilter = filterMin !== null || filterMax !== null;
  if (!hasFilter) return true;

  const eMin = entryMin !== null ? entryMin : 0;
  const eMax = entryMax !== null ? entryMax : Infinity;
  const fMin = filterMin !== null ? filterMin : 0;
  const fMax = filterMax !== null ? filterMax : Infinity;

  return eMin <= fMax && eMax >= fMin;
}

// Cached shuffle order, cleared whenever the filtered set changes so that
// toggling sort-reverse reuses the same shuffle rather than generating a new one.
let _shuffledOrder = null;

export function clearShuffleCache() {
  _shuffledOrder = null;
}

export function applyFilters() {
  if (!state.data) {
    state.filtered = [];
    return;
  }

  const f = state.filters;

  const arrayFilterDefs = [
    { key: 'categories', isArray: true },
    { key: 'pricings', isArray: true },
    { key: 'systems', isArray: true },
    { key: 'settings', isArray: true },
    { key: 'envs', isArray: true },
    { key: 'themes', isArray: true },
    { key: 'languages', isArray: true },
    { key: 'pub', isArray: false },
    { key: 'authors', isArray: true },
    { key: 'character_options', isArray: true },
  ];

  state.filtered = state.data.filter((entry) => {
    // Text search
    if (state.query && !matchesText(entry, state.query)) return false;

    // Taxonomy array filters: OR within field
    for (const { key, isArray } of arrayFilterDefs) {
      const selected = f[key];
      if (!selected.length) continue;
      const entryVals = isArray
        ? entry[key] || []
        : entry[key] != null
          ? [entry[key]]
          : [];
      if (!selected.some((v) => entryVals.includes(v))) return false;
    }

    // Has character options toggle
    if (f.hasCharacterOptions && !(entry.character_options || []).length) return false;

    // Official-only toggle
    if (f.official && !entry.official) return false;

    // Upcoming toggle
    if (f.upcoming && !isUpcoming(entry.date)) return false;

    // Level range
    if (
      !rangesOverlap(
        entry.lmin,
        entry.lmax,
        f.lmin,
        f.lmax,
        f.excludeUnspecifiedLevel,
      )
    ) return false;

    // Party size range
    if (
      !rangesOverlap(
        entry.pmin,
        entry.pmax,
        f.pmin,
        f.pmax,
        f.excludeUnspecifiedParty,
      )
    ) return false;

    // Publication date range
    if (f.dmin !== null || f.dmax !== null) {
      const entryMonth = normDateToMonth(entry.date);
      if (
        entryMonth === null ||
        (f.dmin !== null && entryMonth < f.dmin) ||
        (f.dmax !== null && entryMonth > f.dmax)
      ) return false;
    }

    return true;
  });

  _shuffledOrder = null;
  sortFiltered();
}

export function sortFiltered() {
  const arr = state.filtered;

  switch (state.sort) {
    case 'title':
      _shuffledOrder = null;
      arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;

    case 'date':
      _shuffledOrder = null;
      arr.sort((a, b) =>
        (a.date || '').localeCompare(b.date || ''),
      );
      break;

    case 'pages':
      _shuffledOrder = null;
      arr.sort((a, b) => {
        const pa = a.pages != null ? a.pages : Infinity;
        const pb = b.pages != null ? b.pages : Infinity;
        return pa - pb;
      });
      break;

    case 'level':
      _shuffledOrder = null;
      arr.sort((a, b) => {
        const la = a.lmin != null ? a.lmin : Infinity;
        const lb = b.lmin != null ? b.lmin : Infinity;
        return la - lb;
      });
      break;

    case 'shuffle':
      if (!_shuffledOrder) {
        _shuffledOrder = [...arr];
        for (let i = _shuffledOrder.length - 1; i > 0; --i) {
          const j = Math.floor(Math.random() * (i + 1));
          [_shuffledOrder[i], _shuffledOrder[j]] = [_shuffledOrder[j], _shuffledOrder[i]];
        }
      }
      arr.splice(0, arr.length, ..._shuffledOrder);
      break;
  }
  if (state.sortReverse) arr.reverse();
}
