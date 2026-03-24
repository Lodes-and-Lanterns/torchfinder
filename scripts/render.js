import { state, PAGE_SIZE } from './state.js';
import { getCoverConsent } from './consent.js';
import {
  getLists, getList, saveList, deleteList, touchList,
  getRecentLists, generateListId, getListSavedState, listNameExists,
} from './lists.js';
import {
  escapeHtml,
  slugToLabel,
  langName,
  formatLevelRange,
  formatPartySize,
  formatDate,
  formatDateShort,
  isUpcoming,
} from './utils.js';
import { hasActiveFilters, applyFilters } from './filters.js';
import { updateUrl } from './url.js';

// FILTER SIDEBAR
/////////////////

export const FILTER_TOP_N = 8;
export const PUBLISHER_AUTHOR_TOP_N = 20;

const PILL_TOOLTIPS = {
  'Kelsey Dionne': 'Creator of Shadowdark',
  'The Arcane Library': 'Publisher of Shadowdark',
};

// Returns how many values are hidden behind the search input (total minus visible).
export function filterHiddenCount(totalCount, visibleCount) {
  return Math.max(0, totalCount - visibleCount);
}

export function collectDistinctValues(field, isArray) {
  const values = new Set();

  for (const entry of state.data) {
    if (isArray) {
      for (const v of entry[field] || []) values.add(v);
    } else if (entry[field] != null && entry[field] !== '') {
      values.add(entry[field]);
    }
  }

  return [...values].sort();
}

// Ties broken alphabetically.
export function collectTopValues(field, isArray, n) {
  const counts = new Map();

  for (const entry of state.data) {
    const vals = isArray
      ? entry[field] || []
      : entry[field] != null && entry[field] !== ''
        ? [entry[field]]
        : [];

    for (const v of vals) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([v]) => v);
}

// Returns topValues with any currently-selected values that didn't make the
// top-N appended at the end, so active filters are always visible.
function defaultVisibleValues(topValues, allValues, filterKey) {
  const selected = state.filters[filterKey] || [];
  const topSet = new Set(topValues);
  const extras = selected.filter((v) => !topSet.has(v) && allValues.includes(v));
  return [...topValues, ...extras];
}

function setMoreNote(container, count) {
  let note = container.nextElementSibling;
  if (!note || !note.classList.contains('filter-more-note')) {
    note = document.createElement('p');
    note.className = 'filter-more-note';
    container.insertAdjacentElement('afterend', note);
  }
  note.hidden = count <= 0;
  if (count > 0) note.textContent = `and ${count} more — search above`;
  container._hasOverflowNote = count > 0;
}

export function syncPillFade(container) {
  if (container._hasOverflowNote) return;
  const content = container.closest('.filter-group-content');
  if (!content) return;
  const hasOverflow = container.scrollHeight > container.clientHeight + 2;
  const atEnd = container.scrollHeight - container.scrollTop <= container.clientHeight + 2;
  content.classList.toggle('has-pill-overflow', hasOverflow && !atEnd);
}

export function buildPills(container, values, filterKey, labelFn) {
  container.innerHTML = '';
  const selected = state.filters[filterKey] || [];

  for (const val of values) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill' + (selected.includes(val) ? ' active' : '');
    btn.textContent = labelFn ? labelFn(val) : val;
    btn.dataset.value = val;
    btn.setAttribute('aria-pressed', selected.includes(val) ? 'true' : 'false');
    if (PILL_TOOLTIPS[val]) btn.title = PILL_TOOLTIPS[val];
    btn.addEventListener('click', () => onPillToggle(filterKey, val, btn));
    container.appendChild(btn);
  }

  if (!container._pillFadeListenerAttached) {
    container.addEventListener('scroll', () => syncPillFade(container));
    container._pillFadeListenerAttached = true;
  }
  if (container.clientHeight > 0) syncPillFade(container);
}

export function renderFilterSidebar() {
  const PRICING_LABELS = { free: 'Free', paid: 'Paid', pwyw: 'Pay What You Want' };
  const pricingLabel = (v) => PRICING_LABELS[v] || slugToLabel(v);

  const fields = [
    { id: 'filter-category', key: 'categories', isArray: true },
    { id: 'filter-pricing', key: 'pricings', isArray: true, fn: pricingLabel },
    { id: 'filter-system', key: 'systems', isArray: true, pinTop: ['Shadowdark', 'System-Agnostic'] },
    { id: 'filter-environment', key: 'envs', isArray: true },
    { id: 'filter-themes', key: 'themes', isArray: true },
    { id: 'filter-languages', key: 'languages', isArray: true, fn: langName },
  ];

  for (const { id, key, isArray, fn, pinTop } of fields) {
    const container = document.getElementById(id);
    if (!container) continue;

    let allValues = collectDistinctValues(key, isArray);

    if (pinTop) {
      allValues = [...pinTop.filter((v) => allValues.includes(v)), ...allValues.filter((v) => !pinTop.includes(v))];
    }

    let topValues = collectTopValues(key, isArray, FILTER_TOP_N);

    if (pinTop) {
      topValues = [...pinTop.filter((v) => topValues.includes(v)), ...topValues.filter((v) => !pinTop.includes(v))];
    }

    buildPills(container, allValues, key, fn);

    container._allValues = allValues;
    container._topValues = topValues;
    container._filterKey = key;
    container._labelFn = fn;

    const searchInput = document.querySelector(`.filter-search-within[data-target="${id}"]`);

    if (searchInput) searchInput.hidden = allValues.length <= FILTER_TOP_N;
  }

  // Searchable groups (capped at PUBLISHER_AUTHOR_TOP_N; note shown for overflow)
  const settingVals = collectDistinctValues('settings', true);
  const settingTop = collectTopValues('settings', true, PUBLISHER_AUTHOR_TOP_N);
  const SETTING_PIN = ['Setting-Agnostic', 'Western Reaches'];
  const settingValsOrdered = [...SETTING_PIN.filter((v) => settingVals.includes(v)), ...settingVals.filter((v) => !SETTING_PIN.includes(v))];
  const settingTopOrdered = [...SETTING_PIN.filter((v) => settingTop.includes(v)), ...settingTop.filter((v) => !SETTING_PIN.includes(v))];

  const settingContainer = document.getElementById('filter-setting');
  if (settingContainer) {
    const settingVisible = defaultVisibleValues(settingTopOrdered, settingValsOrdered, 'settings');
    buildPills(settingContainer, settingVisible, 'settings', null);
    setMoreNote(settingContainer, filterHiddenCount(settingValsOrdered.length, settingVisible.length));

    settingContainer._allValues = settingValsOrdered;
    settingContainer._topValues = settingTopOrdered;
    settingContainer._filterKey = 'settings';
    settingContainer._labelFn = null;
    settingContainer._hasTopNCap = true;

    const settingSearch = document.querySelector('.filter-search-within[data-target="filter-setting"]');
    if (settingSearch) settingSearch.hidden = settingValsOrdered.length <= PUBLISHER_AUTHOR_TOP_N;
  }

  const publisherVals = collectDistinctValues('pub', false);
  const publisherTop = collectTopValues('pub', false, PUBLISHER_AUTHOR_TOP_N);
  const authorVals = collectDistinctValues('authors', true);
  const authorTop = collectTopValues('authors', true, PUBLISHER_AUTHOR_TOP_N);

  const pubContainer = document.getElementById('filter-publisher');
  if (pubContainer) {
    const pubVisible = defaultVisibleValues(publisherTop, publisherVals, 'pub');
    buildPills(pubContainer, pubVisible, 'pub', (v) => v);
    setMoreNote(pubContainer, filterHiddenCount(publisherVals.length, pubVisible.length));

    pubContainer._allValues = publisherVals;
    pubContainer._topValues = publisherTop;
    pubContainer._filterKey = 'pub';
    pubContainer._labelFn = (v) => v;
    pubContainer._hasTopNCap = true;

    const pubSearch = document.querySelector('.filter-search-within[data-target="filter-publisher"]');
    if (pubSearch) pubSearch.hidden = publisherVals.length <= PUBLISHER_AUTHOR_TOP_N;
  }

  const authorContainer = document.getElementById('filter-authors');

  if (authorContainer) {
    const authorVisible = defaultVisibleValues(authorTop, authorVals, 'authors');
    buildPills(authorContainer, authorVisible, 'authors', (v) => v);
    setMoreNote(authorContainer, filterHiddenCount(authorVals.length, authorVisible.length));

    authorContainer._allValues = authorVals;
    authorContainer._topValues = authorTop;
    authorContainer._filterKey = 'authors';
    authorContainer._labelFn = (v) => v;
    authorContainer._hasTopNCap = true;

    const authorSearch = document.querySelector('.filter-search-within[data-target="filter-authors"]');
    if (authorSearch) authorSearch.hidden = authorVals.length <= PUBLISHER_AUTHOR_TOP_N;
  }

  const classVals = collectDistinctValues('character_options', true);
  const classTop = collectTopValues('character_options', true, PUBLISHER_AUTHOR_TOP_N);

  const classContainer = document.getElementById('filter-character-options');

  if (classContainer) {
    const classVisible = defaultVisibleValues(classTop, classVals, 'character_options');
    buildPills(classContainer, classVisible, 'character_options', (v) => v);
    setMoreNote(classContainer, filterHiddenCount(classVals.length, classVisible.length));

    classContainer._allValues = classVals;
    classContainer._topValues = classTop;
    classContainer._filterKey = 'character_options';
    classContainer._labelFn = (v) => v;
    classContainer._hasTopNCap = true;

    const classSearch = document.querySelector('.filter-search-within[data-target="filter-character-options"]');
    if (classSearch) classSearch.hidden = classVals.length <= PUBLISHER_AUTHOR_TOP_N;
  }

  syncFilterControlStates();
}

export function syncFilterControlStates() {
  const f = state.filters;

  document.getElementById('has-character-options').checked = f.hasCharacterOptions;
  document.getElementById('toggle-official').checked = f.official;
  document.getElementById('toggle-upcoming').checked = f.upcoming;
  document.getElementById('exclude-unspecified-level').checked = f.excludeUnspecifiedLevel;
  document.getElementById('exclude-unspecified-party').checked = f.excludeUnspecifiedParty;
  document.getElementById('level-min').value = f.lmin !== null ? f.lmin : '';
  document.getElementById('level-max').value = f.lmax !== null ? f.lmax : '';
  document.getElementById('party-min').value = f.pmin !== null ? f.pmin : '';
  document.getElementById('party-max').value = f.pmax !== null ? f.pmax : '';
  const fromInput = document.getElementById('date-from');
  if (fromInput && fromInput._monthPicker) {
    fromInput._monthPicker.setValue(f.dmin);
  }
  const toInput = document.getElementById('date-to');
  if (toInput && toInput._monthPicker) {
    toInput._monthPicker.setValue(f.dmax);
  }
  document.getElementById('search-input').value = state.query;
  document.getElementById('sort-select').value = state.sort;

  const sortReverseBtn = document.getElementById('sort-reverse');
  if (sortReverseBtn) {
    sortReverseBtn.textContent = state.sortReverse ? '↓' : '↑';
    sortReverseBtn.setAttribute('aria-pressed', String(state.sortReverse));
  }

  const reshuffleBtn = document.getElementById('sort-reshuffle');
  if (reshuffleBtn) {
    reshuffleBtn.hidden = state.sort !== 'shuffle';
  }
}

export function updateClearButton() {
  const btn = document.getElementById('clear-filters');
  if (btn) btn.disabled = !hasActiveFilters();
  syncFilterGroupIndicators();
}

function syncFilterGroupIndicators() {
  const f = state.filters;

  // pill-based groups: show a numeric count when > 0
  // range/checkbox groups: show a dot when any control is active
  const groups = [
    { key: 'category',    active: f.categories.length > 0,  count: f.categories.length },
    { key: 'pricing',     active: f.pricings.length > 0,    count: f.pricings.length },
    { key: 'systems',     active: f.systems.length > 0,     count: f.systems.length },
    { key: 'settings',    active: f.settings.length > 0,    count: f.settings.length },
    { key: 'envs',        active: f.envs.length > 0,        count: f.envs.length },
    { key: 'themes',      active: f.themes.length > 0,      count: f.themes.length },
    { key: 'pub',         active: f.pub.length > 0,         count: f.pub.length },
    { key: 'authors',     active: f.authors.length > 0,     count: f.authors.length },
    { key: 'character_options', active: f.character_options.length > 0 || f.hasCharacterOptions, count: f.character_options.length + (f.hasCharacterOptions ? 1 : 0) },
    { key: 'languages',   active: f.languages.length > 0,   count: f.languages.length },
    { key: 'level', active: f.lmin !== null || f.lmax !== null || f.excludeUnspecifiedLevel, count: (f.lmin !== null ? 1 : 0) + (f.lmax !== null ? 1 : 0) + (f.excludeUnspecifiedLevel ? 1 : 0) },
    { key: 'party', active: f.pmin !== null || f.pmax !== null || f.excludeUnspecifiedParty, count: (f.pmin !== null ? 1 : 0) + (f.pmax !== null ? 1 : 0) + (f.excludeUnspecifiedParty ? 1 : 0) },
    { key: 'date',  active: f.dmin !== null || f.dmax !== null, count: (f.dmin !== null ? 1 : 0) + (f.dmax !== null ? 1 : 0) },
  ];

  let totalActive = 0;

  for (const { key, active, count } of groups) {
    if (active) ++totalActive;

    const btn = document.querySelector(`.filter-group-toggle[data-filter-key="${key}"]`);

    if (!btn) continue;

    let badge = btn.querySelector('.filter-active-badge');

    if (active) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'filter-active-badge';
        badge.setAttribute('aria-hidden', 'true');
        btn.insertBefore(badge, btn.querySelector('.filter-group-chevron'));
      }

      badge.textContent = count !== null ? String(count) : '•';
    } else if (badge) {
      badge.remove();
    }
  }

  // Update mobile filter toggle button
  const mobileBtn = document.getElementById('mobile-filter-toggle');

  if (mobileBtn) {
    let mobileBadge = mobileBtn.querySelector('.filter-active-badge');

    if (totalActive > 0) {
      if (!mobileBadge) {
        mobileBadge = document.createElement('span');
        mobileBadge.className = 'filter-active-badge';
        mobileBadge.setAttribute('aria-hidden', 'true');
        mobileBtn.appendChild(mobileBadge);
      }
      mobileBadge.textContent = String(totalActive);
    } else if (mobileBadge) {
      mobileBadge.remove();
    }
  }
}

// RESULTS
//////////

export function renderResults() {
  const list = document.getElementById('results-list');
  const summary = document.getElementById('result-summary');
  const backBtn = document.getElementById('back-to-all');
  const backToListBtn = document.getElementById('back-to-list');
  const paginationEl = document.getElementById('pagination');

  updateClearButton();

  // Direct ID mode: show only that entry.
  // Takes priority over list mode so clicking an entry from a list works correctly.
  if (state.directId) {
    const entry = state.data ? state.data.find((e) => e.id === state.directId) : null;
    document.getElementById('search-sort-bar').hidden = true;
    document.getElementById('mobile-filter-toggle').hidden = true;
    backBtn.hidden = false;
    backToListBtn.hidden = !state.listMode;
    paginationEl.innerHTML = '';

    if (entry) {
      document.title = `${entry.title} — Torchfinder`;
      summary.textContent = '';
      list.innerHTML = renderCardHtml(entry, true);
      attachCardListeners(list);
      const heading = list.querySelector('.card-title');
      if (heading) requestAnimationFrame(() => heading.focus());
    } else {
      document.title = 'Torchfinder';
      summary.textContent = '';
      list.innerHTML = '<div class="empty-state"><p>Entry not found.</p></div>';
    }

    updateUrl();

    return;
  }

  backToListBtn.hidden = true;

  // List mode: show list view
  if (state.listMode) {
    document.title = `${state.listName || 'Untitled list'} — Torchfinder`;

    document.getElementById('search-sort-bar').hidden = true;
    document.getElementById('mobile-filter-toggle').hidden = true;

    backBtn.hidden = false;

    paginationEl.innerHTML = '';

    const isDeletable = !!(state.listId && getList(state.listId));
    const unsaved = !isDeletable && getListSavedState(state.listId, state.listEntries) !== 'saved';

    summary.innerHTML = `<div class="list-view-title-row">
  <span class="list-view-name" id="list-view-name">${escapeHtml(state.listName || 'Untitled list')}</span>
  ${unsaved ? '<span class="list-saved-badge list-saved-badge--unsaved">Unsaved</span>' : ''}
  ${isDeletable ? '<button type="button" class="list-rename-btn btn-delete outline secondary" id="list-delete-btn" aria-label="Delete list">Delete</button>' : ''}
  <button type="button" class="list-rename-btn outline secondary" id="list-rename-btn" aria-label="Rename list">Rename</button>
  <button type="button" class="list-rename-btn outline secondary" id="list-copy-url-btn">Share list</button>
</div>
<p class="list-view-bookmark-hint">Lists are automatically saved browser-side. Bookmarking backs up the <b>current</b> snapshot of the list.</p>`;

    document.getElementById('list-delete-btn')?.addEventListener('click', () => {
      if (confirm(`Delete "${state.listName || 'Untitled list'}"?`)) {
        deleteList(state.listId);

        state.listMode = false;
        state.listId = null;
        state.listName = '';
        state.listDescription = '';
        state.listEntries = [];
        state.listSynced = false;
        renderResults();
      }
    });

    document.getElementById('list-rename-btn').addEventListener('click', onStartRenameList);
    document.getElementById('list-copy-url-btn').addEventListener('click', onCopyListUrl);

    if (state.data) renderListView();

    updateUrl();

    return;
  }

  document.getElementById('search-sort-bar').hidden = false;
  document.getElementById('mobile-filter-toggle').hidden = false;

  document.title = 'Torchfinder';

  backBtn.hidden = true;

  if (!state.data) return;

  const total = state.data.length;
  const count = state.filtered.length;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (state.page > totalPages) state.page = totalPages;

  const start = (state.page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, count);
  const pageEntries = state.filtered.slice(start, end);

  if (count === 0) {
    summary.textContent = 'No results found. Try broadening your filters.';
    list.innerHTML =
      '<div class="empty-state"><p>No results found. Try broadening your filters.</p></div>';
    paginationEl.innerHTML = '';
  } else {
    const range = count > 1 ? `${start + 1}–${end} of ` : '';
    const label = count === 1 ? 'entry' : 'entries';
    const filtered = count !== total ? ` (filtered from ${total})` : '';
    summary.textContent = `Showing ${range}${count} ${label}${filtered}`;
    list.innerHTML = pageEntries
      .map((entry) => renderCardHtml(entry, entry.id === state.expandedCardId))
      .join('');
    attachCardListeners(list);
    renderPagination(totalPages);
  }

  updateUrl();
}

function attachCardListeners(container) {
  container.querySelectorAll('.result-card').forEach((card) => {
    const id = card.dataset.id;

    const header = card.querySelector('.card-header');

    if (!header) return;

    header.addEventListener('click', () => onCardClick(id));
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCardClick(id);
      }
    });

    const titleLink = card.querySelector('.card-title-link');

    if (titleLink) titleLink.addEventListener('click', (e) => e.stopPropagation());

    card.querySelectorAll('.add-to-list-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openAddToListModal(btn.dataset.id);
      });
    });

    card.querySelectorAll('.card-list-link').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenList(a.dataset.listId);
      });
    });

    card.querySelectorAll('.copy-entry-id-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.id).then(() => {
          const prev = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = prev; }, 1500);
        }).catch(() => {});
      });
    });

    card.querySelectorAll('.copy-entry-link-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = `${globalThis.location.origin}${globalThis.location.pathname}?id=${encodeURIComponent(btn.dataset.id)}`;
        navigator.clipboard.writeText(url).then(() => {
          const prev = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = prev; }, 1500);
        }).catch(() => {});
      });
    });
  });
}

export function renderCardHtml(entry, expanded) {
  const levelStr = formatLevelRange(entry.lmin, entry.lmax);
  const partyStr = formatPartySize(entry.pmin, entry.pmax);
  const upcoming = isUpcoming(entry.date);
  const authorStr = (entry.authors || []).join(', ');

  const tags = [];

  for (const cat of entry.categories || []) {
    tags.push(`<span class="card-tag">${escapeHtml(cat)}</span>`);
  }

  if ((entry.pricings || []).includes('free')) {
    tags.push(`<span class="card-tag card-tag-free">Free</span>`);
  }
  if ((entry.pricings || []).includes('pwyw')) {
    tags.push(`<span class="card-tag card-tag-pwyw" data-tip="Pay What You Want" tabindex="0">PWYW</span>`);
  }

  if (entry.official) {
    tags.push(`<span class="card-tag card-tag-official">Official</span>`);
  } else {
    tags.push(`<span class="card-tag card-tag-third-party">Third-Party</span>`);
  }

  if (upcoming) {
    tags.push(`<span class="card-tag card-tag-upcoming">Upcoming</span>`);
  }

  if (levelStr) {
    tags.push(`<span class="card-tag">${escapeHtml(levelStr)}</span>`);
  }

  if (partyStr) {
    tags.push(`<span class="card-tag">${escapeHtml(partyStr)}</span>`);
  }

  const coverHtml = entry.cover && getCoverConsent() === 'granted'
    ? `<div class="card-cover-wrap"><img class="card-cover" src="${escapeHtml(entry.cover)}" alt="" loading="lazy" onerror="this.closest('.card-cover-wrap').remove()"></div>`
    : '';

  return `
<article class="result-card${expanded ? ' expanded' : ''}" data-id="${escapeHtml(entry.id)}" aria-expanded="${expanded}">
  <div class="card-header" role="button" tabindex="0" aria-label="${escapeHtml(entry.title)}, ${expanded ? 'collapse' : 'expand'}">
    ${coverHtml}
    <div class="card-header-main">
      <h3 class="card-title">${state.directId === entry.id ? `<span class="card-title-link">${escapeHtml(entry.title)}</span>` : `<a class="card-title-link" href="?id=${encodeURIComponent(entry.id)}">${escapeHtml(entry.title)}</a>`}${entry.date ? `<span class="card-title-date"> (${escapeHtml(formatDateShort(entry.date))})</span>` : ''}<button type="button" class="add-to-list-btn outline secondary" data-id="${escapeHtml(entry.id)}" aria-label="Add ${escapeHtml(entry.title)} to a list">+ List</button><button type="button" class="copy-entry-link-btn outline secondary" data-id="${escapeHtml(entry.id)}" aria-label="Copy link to ${escapeHtml(entry.title)}">Copy link</button></h3>
      ${authorStr ? `<div class="card-byline">${escapeHtml(authorStr)}</div>` : ''}
      ${entry.desc ? `<div class="card-description-snippet">${escapeHtml(entry.desc)}</div>` : ''}
    </div>
    <div class="card-tags">${tags.join('')}</div>
    <span class="card-expand-icon" aria-hidden="true">▶</span>
  </div>
  ${buildExpandedHtml(entry, upcoming)}
</article>`;
}

export function buildExpandedHtml(entry, upcoming) {
  const issueId = encodeURIComponent(entry.id);
  const updateUrl = `https://github.com/Lodes-and-Lanterns/torchfinder-data/issues/new?template=update-entry.yml&title=Update+entry%3A+${issueId}&labels=update-entry`;
  const removeUrl = `https://github.com/Lodes-and-Lanterns/torchfinder-data/issues/new?template=remove-entry.yml&title=Remove+entry%3A+${issueId}&labels=remove-entry`;

  const rows = [];

  if (entry.pub) rows.push(row('Publisher', entry.pub));

  const sys = (entry.systems || []).join(', ');
  if (sys) rows.push(row('System', sys));

  const set = (entry.settings || []).join(', ');
  if (set) rows.push(row('Setting', set));

  const env = (entry.envs || []).join(', ');
  if (env) rows.push(row('Environment', env));

  const thm = (entry.themes || []).join(', ');
  if (thm) rows.push(row('Themes', thm));


  const levelStr = formatLevelRange(entry.lmin, entry.lmax);
  if (levelStr) rows.push(row('Level range', levelStr));

  const partyStr = formatPartySize(entry.pmin, entry.pmax);
  if (partyStr) rows.push(row('Party size', partyStr));

  const cls = (entry.character_options || []).join(', ');
  if (cls) rows.push(row('Character Options', cls));

  if (entry.pages != null) rows.push(row('Pages', String(entry.pages)));

  if (entry.date) {
    const dateLabel =
      formatDate(entry.date) +
      (upcoming ? ' <span class="badge upcoming">Upcoming</span>' : '');
    rows.push(`<tr><th scope="row">Published</th><td>${dateLabel}</td></tr>`);
  }

  const LINK_TYPE_LABELS = { ebook: 'eBook', 'ebook-and-print': 'eBook & Print', print: 'Print', vtt: 'VTT', web: 'Web' };
  const LINK_PRICING_LABELS = { free: 'Free', paid: 'Paid', pwyw: 'PWYW' };

  const linksHtml = (entry.links || [])
    .map((link) => {
      const typeLabel = link.type && LINK_TYPE_LABELS[link.type]
        ? ` <span class="link-type-desc">${LINK_TYPE_LABELS[link.type]}</span>`
        : '';
      const pricingLabel = link.pricing && LINK_PRICING_LABELS[link.pricing]
        ? ` <span class="link-pricing-badge">${LINK_PRICING_LABELS[link.pricing]}</span>`
        : '';
      const langLabel =
        link.language && link.language !== 'en'
          ? ` <span class="lang-badge">${escapeHtml(langName(link.language))}</span>`
          : '';
      return `<li><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.title)}</a>${typeLabel}${pricingLabel}${langLabel}</li>`;
    }).join('');

  let parentHtml = '';

  if (entry.included_in && entry.included_in.length > 0) {
    const items = entry.included_in
      .map((pid) => {
        const parent = state.data ? state.data.find((e) => e.id === pid) : null;
        const label = parent ? parent.title : pid;
        return `<li><a href="?id=${encodeURIComponent(pid)}">${escapeHtml(label)}</a></li>`;
      }).join('');

    parentHtml = `<div class="card-section"><h4>Included in</h4><ul>${items}</ul></div>`;
  }

  let childrenHtml = '';

  if (entry.children && entry.children.length > 0) {
    const items = entry.children
      .map((cid) => {
        const child = state.data ? state.data.find((e) => e.id === cid) : null;
        const label = child ? child.title : cid;
        return `<li><a href="?id=${encodeURIComponent(cid)}">${escapeHtml(label)}</a></li>`;
      }).join('');

    childrenHtml = `<div class="card-section"><h4>Includes</h4><ul>${items}</ul></div>`;
  }

  const containingLists = getLists().filter((l) => (l.entries || []).includes(entry.id));
  const listsHtml = containingLists.length
    ? `<div class="card-section"><h4>Lists</h4><ul>${containingLists
        .map((l) => `<li><a href="#" class="card-list-link" data-list-id="${escapeHtml(l.id)}">${escapeHtml(l.name || 'Untitled list')}</a></li>`)
        .join('')}</ul></div>`
    : '';

  return `
<div class="card-expanded">
  ${entry.desc ? `<p class="card-expanded-desc">${escapeHtml(entry.desc)}</p>` : ''}
  ${rows.length ? `<table class="card-meta-table"><tbody>${rows.join('')}</tbody></table>` : ''}
  ${parentHtml}
  ${childrenHtml}
  ${linksHtml ? `<div class="card-section"><h4>Links</h4><ul class="card-links">${linksHtml}</ul></div>` : ''}
  ${listsHtml}
  <div class="card-footer-actions">
    <a href="${escapeHtml(updateUrl)}" target="_blank" rel="noopener" class="report-issue-link update-entry">Update or correct this entry</a>
    <a href="${escapeHtml(removeUrl)}" target="_blank" rel="noopener" class="report-issue-link remove-entry">Request removal of this entry</a>
    <button type="button" class="copy-entry-id-btn outline" data-id="${escapeHtml(entry.id)}">Copy ID</button>
  </div>
</div>`;
}

export function row(label, value) {
  return `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

// PAGINATION
/////////////

function renderPagination(totalPages) {
  const nav = document.getElementById('pagination');
  if (!nav) return;

  if (totalPages <= 1) {
    nav.innerHTML = '';
    return;
  }

  const current = state.page;
  const pages = computePageNumbers(current, totalPages);
  const items = [];

  items.push(
    `<li><a href="#" class="pagination-btn${current <= 1 ? ' disabled' : ''}" data-page="${current - 1}" aria-label="Previous page"${current <= 1 ? ' aria-disabled="true" tabindex="-1"' : ''}>&#x2190;</a></li>`,
  );

  for (const p of pages) {
    if (p === '...') {
      items.push(
        `<li><span class="pagination-ellipsis" aria-hidden="true">&#x2026;</span></li>`,
      );
    } else {
      const isCurrent = p === current;
      items.push(
        `<li><a href="#" class="pagination-btn${isCurrent ? ' current' : ''}" data-page="${p}" aria-label="Page ${p}"${isCurrent ? ' aria-current="page"' : ''}>${p}</a></li>`,
      );
    }
  }

  items.push(
    `<li><a href="#" class="pagination-btn${current >= totalPages ? ' disabled' : ''}" data-page="${current + 1}" aria-label="Next page"${current >= totalPages ? ' aria-disabled="true" tabindex="-1"' : ''}>&#x2192;</a></li>`,
  );

  nav.innerHTML = `<ul class="pagination-list">${items.join('')}</ul>`;

  nav.querySelectorAll('.pagination-btn:not(.disabled)').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(btn.dataset.page, 10);
      if (page >= 1 && page <= totalPages) onPageChange(page);
    });
  });
}

export function computePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];

  if (current > 3) pages.push('...');

  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); ++i) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}

// LOADING / ERROR STATES
/////////////////////////

export function showLoading() {
  const list = document.getElementById('results-list');
  const summary = document.getElementById('result-summary');
  list.innerHTML = `
<div class="loading-skeleton" aria-label="Loading results" aria-busy="true">
  ${Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join('')}
</div>`;
  summary.textContent = 'Loading…';
}

export function showError() {
  const list = document.getElementById('results-list');
  const summary = document.getElementById('result-summary');
  list.innerHTML =
    '<div class="error-state" role="alert"><p>Failed to load adventure data. Please try refreshing the page.</p></div>';
  summary.textContent = '';
}

export function enableControls() {
  document.querySelectorAll(
    '#filter-controls input, #filter-controls select, #filter-controls button, #search-input, #sort-select, #sort-reverse, #sort-reshuffle',
  ).forEach((el) => {
    el.disabled = false;
  });
  document.querySelectorAll('#random-content-btn, #random-content-btn-mobile').forEach((btn) => {
    btn.disabled = false;
  });
}

// PILL / CARD / PAGE INTERACTIONS
//////////////////////////////////

// Kept here (rather than handlers.js) to avoid circular imports: render
// functions call these, and these call render functions.

export function onPillToggle(key, value, btn) {
  const arr = state.filters[key];
  const idx = arr.indexOf(value);
  if (idx === -1) arr.push(value);
  else arr.splice(idx, 1);

  const isActive = arr.includes(value);
  btn.classList.toggle('active', isActive);
  btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

  state.page = 1;
  state.expandedCardId = null;
  applyFilters();
  renderResults();
  updateClearButton();
}

export function onCardClick(id) {
  const wasExpanded = state.expandedCardId === id;

  // Collapse the previously expanded card if it's a different one
  if (state.expandedCardId && state.expandedCardId !== id) {
    const prev = document.querySelector(`.result-card[data-id="${CSS.escape(state.expandedCardId)}"]`);
    if (prev) {
      prev.classList.remove('expanded');
      prev.setAttribute('aria-expanded', 'false');
      const prevContent = prev.querySelector('.card-expanded');
      if (prevContent) prevContent.style.display = 'none';
    }
  }

  state.expandedCardId = wasExpanded ? null : id;

  const card = document.querySelector(`.result-card[data-id="${CSS.escape(id)}"]`);
  if (!card) return;

  const expanding = !wasExpanded;
  card.classList.toggle('expanded', expanding);
  card.setAttribute('aria-expanded', String(expanding));

  const content = card.querySelector('.card-expanded');
  if (content) content.style.display = expanding ? 'block' : 'none';

  if (expanding) {
    const heading = card.querySelector('.card-title');
    if (heading) heading.focus({ preventScroll: true });
  }

  updateUrl();
}

export function onPageChange(page) {
  const distanceFromBottom = document.documentElement.scrollHeight - globalThis.scrollY - globalThis.innerHeight;
  state.page = page;
  renderResults();
  requestAnimationFrame(() => {
    const newScrollY = document.documentElement.scrollHeight - distanceFromBottom - globalThis.innerHeight;
    globalThis.scrollTo({ top: Math.max(0, newScrollY), behavior: 'instant' });
  });
}

// LIST VIEW
////////////

function renderListView() {
  const list = document.getElementById('results-list');
  const unsaved = !getList(state.listId) && getListSavedState(state.listId, state.listEntries) !== 'saved';

  const headerHtml = unsaved
    ? '<div class="list-view-actions"><button type="button" class="outline secondary" id="list-save-btn">Save</button></div>'
    : '';

  let rowsHtml;
  if (state.listEntries.length === 0) {
    rowsHtml = '<div class="empty-state"><p>This list is empty. Browse and expand entries to add them.</p></div>';
  } else {
    const total = state.listEntries.length;
    rowsHtml = state.listEntries
      .map((entryId, idx) => {
        const entry = state.data ? state.data.find((e) => e.id === entryId) : null;
        const upDisabled = idx === 0 ? ' disabled' : '';
        const downDisabled = idx === total - 1 ? ' disabled' : '';
        if (entry) {
          const byline = entry.authors && entry.authors.length
            ? `<div class="list-entry-byline">${escapeHtml(entry.authors.join(', '))}</div>`
            : '';
          return `
<div class="list-entry-row" draggable="true" data-idx="${idx}" data-id="${escapeHtml(entry.id)}">
  <span class="list-drag-handle" aria-hidden="true">⠿</span>
  <div class="list-entry-num">${idx + 1}</div>
  <div class="list-entry-info">
    <a href="?id=${encodeURIComponent(entry.id)}" class="list-entry-title">${escapeHtml(entry.title)}</a>
    ${byline}
  </div>
  <div class="list-entry-controls">
    <button type="button" class="list-move-btn" data-dir="up" aria-label="Move up"${upDisabled}>&#x2191;</button>
    <button type="button" class="list-move-btn" data-dir="down" aria-label="Move down"${downDisabled}>&#x2193;</button>
    <button type="button" class="list-remove-btn" aria-label="Remove from list">&#x2715;</button>
  </div>
</div>`;
        } else {
          return `
<div class="list-entry-row list-entry-stale" draggable="true" data-idx="${idx}" data-id="${escapeHtml(entryId)}">
  <span class="list-drag-handle" aria-hidden="true">⠿</span>
  <div class="list-entry-num">${idx + 1}</div>
  <div class="list-entry-info">
    <span class="list-entry-title list-entry-title--stale">Unknown entry</span>
    <div class="list-entry-byline list-entry-stale-note">ID: ${escapeHtml(entryId)}</div>
  </div>
  <div class="list-entry-controls">
    <button type="button" class="list-move-btn" data-dir="up" aria-label="Move up"${upDisabled}>&#x2191;</button>
    <button type="button" class="list-move-btn" data-dir="down" aria-label="Move down"${downDisabled}>&#x2193;</button>
    <button type="button" class="list-remove-btn" aria-label="Remove from list">&#x2715;</button>
  </div>
</div>`;
        }
      }).join('');
  }

  const descriptionHtml = `<textarea
    class="list-view-description"
    id="list-view-description"
    placeholder="Add a description…"
    rows="1"
    aria-label="List description"
  >${escapeHtml(state.listDescription || '')}</textarea>`;

  list.innerHTML = descriptionHtml + headerHtml + rowsHtml;

  const descEl = document.getElementById('list-view-description');

  function autoResize() {
    descEl.style.height = 'auto';
    descEl.style.height = descEl.scrollHeight + 'px';
  }

  autoResize();

  descEl.addEventListener('input', autoResize);

  descEl.addEventListener('blur', () => {
    state.listDescription = descEl.value.trim();
    autoSave();
    updateUrl();
  });

  document.getElementById('list-save-btn')?.addEventListener('click', onSaveList);

  list.querySelectorAll('.list-remove-btn').forEach((btn) => {
    const row = btn.closest('.list-entry-row');
    btn.addEventListener('click', () => onListEntryRemove(parseInt(row.dataset.idx, 10)));
  });

  list.querySelectorAll('.list-move-btn').forEach((btn) => {
    const row = btn.closest('.list-entry-row');
    btn.addEventListener('click', () =>
      onListEntryMove(parseInt(row.dataset.idx, 10), btn.dataset.dir),
    );
  });

  // Intercept title link clicks so navigating to an entry keeps list state in memory.
  list.querySelectorAll('.list-entry-title[href]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const params = new URLSearchParams(new URL(link.href, globalThis.location.href).search);
      state.directId = params.get('id');
      renderResults();
    });
  });

  setupListDragDrop(list);
}

function setupListDragDrop(container) {
  let dragSrcIdx = null;

  function clearIndicators() {
    container.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach((el) => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  container.querySelectorAll('.list-entry-row').forEach((row) => {
    row.addEventListener('dragstart', (e) => {
      dragSrcIdx = parseInt(row.dataset.idx, 10);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', ''); // required by Firefox
      requestAnimationFrame(() => row.classList.add('drag-dragging'));
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('drag-dragging');
      clearIndicators();
      dragSrcIdx = null;
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dragSrcIdx === null || parseInt(row.dataset.idx, 10) === dragSrcIdx) return;
      e.dataTransfer.dropEffect = 'move';
      clearIndicators();
      const rect = row.getBoundingClientRect();
      row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drag-over-top' : 'drag-over-bottom');
    });

    row.addEventListener('dragleave', (e) => {
      if (!row.contains(e.relatedTarget)) {
        row.classList.remove('drag-over-top', 'drag-over-bottom');
      }
    });

    row.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragSrcIdx === null) return;
      const targetIdx = parseInt(row.dataset.idx, 10);
      if (targetIdx === dragSrcIdx) return;

      const rect = row.getBoundingClientRect();
      let insertAt = e.clientY < rect.top + rect.height / 2 ? targetIdx : targetIdx + 1;
      if (dragSrcIdx < insertAt) --insertAt;

      const [moved] = state.listEntries.splice(dragSrcIdx, 1);
      state.listEntries.splice(insertAt, 0, moved);

      autoSave();
      updateUrl();
      renderResults();
      requestAnimationFrame(() => {
        const row = document.querySelector(`.list-entry-row[data-id="${CSS.escape(moved)}"]`);
        if (row) {
          row.classList.add('list-entry-moved');
          setTimeout(() => row.classList.remove('list-entry-moved'), 700);
        }
      });
    });
  });
}

export function renderListPanel() {
  const content = document.getElementById('list-panel-content');
  if (!content) return;

  const lists = getLists().sort((a, b) =>
    (b.lastAccessedAt || '').localeCompare(a.lastAccessedAt || ''),
  );

  if (lists.length === 0) {
    content.innerHTML = '<p class="list-panel-empty">No saved lists yet.</p>';
    return;
  }

  content.innerHTML = lists
    .map(
      (l) => `
<div class="list-panel-item" data-id="${escapeHtml(l.id)}">
  <div class="list-panel-item-info">
    <a class="list-panel-item-name" data-id="${escapeHtml(l.id)}" href="#">${escapeHtml(l.name || 'Untitled list')}</a>
    <span class="list-panel-item-count">${(l.entries || []).length} ${(l.entries || []).length === 1 ? 'entry' : 'entries'}</span>
  </div>
  <div class="list-panel-item-actions">
    <button type="button" class="list-panel-delete-btn btn-delete outline secondary" data-id="${escapeHtml(l.id)}" aria-label="Delete ${escapeHtml(l.name || 'Untitled list')}">&#x2715;</button>
  </div>
</div>`,
    ).join('');

  content.querySelectorAll('.list-panel-item-name').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); onOpenList(a.dataset.id); });
  });

  content.querySelectorAll('.list-panel-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const l = getList(btn.dataset.id);
      if (l && confirm(`Delete "${l.name || 'Untitled list'}"?`)) {
        deleteList(btn.dataset.id);
        renderListPanel();
      }
    });
  });
}

let _modalOpener = null;
let _modalKeydownHandler = null;

export function openAddToListModal(entryId) {
  const modal = document.getElementById('add-to-list-modal');
  const body = document.getElementById('list-modal-body');
  if (!modal || !body) return;
  _modalOpener = document.activeElement;

  const allLists = getLists().sort((a, b) =>
    (b.lastAccessedAt || '').localeCompare(a.lastAccessedAt || ''),
  );

  const recentLists = allLists.slice(0, 5);

  const hasLists = allLists.length > 0;

  function renderListButtons(lists, label) {
    const container = document.getElementById('list-modal-lists');
    const labelEl = document.getElementById('list-modal-lists-label');

    if (!container) return;

    if (labelEl) labelEl.innerHTML = label === 'Recent lists'
      ? `Recent lists <span class="list-modal-max-note">(Shows 5 max)</span>`
      : escapeHtml(label);
    if (!lists.length) {
      container.innerHTML = '<p class="list-modal-no-recent">No matching lists.</p>';
      return;
    }

    container.innerHTML = lists
      .map(
        (l) =>
          `<div class="list-modal-item-row">
  <span class="list-modal-item-name">${escapeHtml(l.name || 'Untitled list')} <span class="list-item-count">(${(l.entries || []).length})</span></span>
  <button type="button" class="add-to-existing-list-btn outline secondary" data-list-id="${escapeHtml(l.id)}" aria-label="Add to ${escapeHtml(l.name || 'Untitled list')}">+</button>
  <button type="button" class="list-modal-goto-btn outline secondary" data-list-id="${escapeHtml(l.id)}" aria-label="Go to ${escapeHtml(l.name || 'Untitled list')}">&#x2192;</button>
</div>`,
      ).join('');

    container.querySelectorAll('.add-to-existing-list-btn').forEach((btn) => {
      btn.addEventListener('click', () => onAddToExistingList(entryId, btn.dataset.listId, btn));
    });

    container.querySelectorAll('.list-modal-goto-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeAddToListModal();
        onOpenList(btn.dataset.listId);
      });
    });
  }

  body.innerHTML = `${hasLists ? `
<input type="search" id="list-modal-search" class="list-modal-search" placeholder="Search lists…" aria-label="Search lists" />
<h4 class="list-modal-section-label" id="list-modal-lists-label">Recent lists <span class="list-modal-max-note">(Shows 5 max)</span></h4>
<div id="list-modal-lists" class="list-modal-recent"></div>` : ''}
<h4 class="list-modal-section-label">New list <span class="list-modal-max-note">(+)</span></h4>
<div class="list-modal-create">
  <input type="text" id="new-list-name-input" placeholder="List name…" aria-label="New list name" />
  <button type="button" id="create-and-add-btn" class="outline secondary">Create &amp; add</button>
</div>
<p id="new-list-name-error" class="list-name-error" hidden></p>`;

  if (hasLists) {
    renderListButtons(recentLists, 'Recent lists');

    document.getElementById('list-modal-search').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();

      if (q) {
        renderListButtons(
          allLists.filter((l) => (l.name || 'Untitled list').toLowerCase().includes(q)),
          'Matching lists',
        );
      } else {
        renderListButtons(recentLists, 'Recent lists');
      }
    });
  }

  modal.removeAttribute('hidden');
  modal.removeAttribute('aria-hidden');

  const createBtn = document.getElementById('create-and-add-btn');
  const nameInput = document.getElementById('new-list-name-input');

  createBtn?.addEventListener('click', () => {
    onCreateAndAddToList(entryId, nameInput?.value.trim() || 'Untitled list');
  });

  nameInput?.addEventListener('input', () => {
    const errEl = document.getElementById('new-list-name-error');
    if (errEl) errEl.hidden = true;
  });

  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onCreateAndAddToList(entryId, nameInput.value.trim() || 'Untitled list');
    if (e.key === 'Escape') closeAddToListModal();
  });

  requestAnimationFrame(() => {
    const first = modal.querySelector('input, button:not([disabled])');
    if (first) first.focus();
  });

  _modalKeydownHandler = (e) => {
    if (e.key === 'Escape') { closeAddToListModal(); return; }
    if (e.key !== 'Tab') return;
    const focusable = modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  modal.addEventListener('keydown', _modalKeydownHandler);
}

export function closeAddToListModal() {
  const modal = document.getElementById('add-to-list-modal');
  if (modal) {
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
    if (_modalKeydownHandler) {
      modal.removeEventListener('keydown', _modalKeydownHandler);
      _modalKeydownHandler = null;
    }
  }
  if (_modalOpener) {
    _modalOpener.focus();
    _modalOpener = null;
  }
}

function onSaveList() {
  if (!state.listId) state.listId = generateListId();
  state.listSynced = true;
  saveList({ id: state.listId, name: state.listName || 'Untitled list', description: state.listDescription, entries: state.listEntries });
  updateUrl();
  renderResults();
}

function onCopyListUrl() {
  navigator.clipboard.writeText(globalThis.location.href).then(() => {
    const btn = document.getElementById('list-copy-url-btn');
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = 'Copied list data as shareable link!';
      setTimeout(() => {
        btn.textContent = prev;
      }, 2000);
    }
  }).catch(() => {});
}

function autoSave() {
  if (state.listId && (state.listSynced || !!getList(state.listId))) {
    state.listSynced = true;
    saveList({ id: state.listId, name: state.listName || 'Untitled list', description: state.listDescription, entries: state.listEntries });
  }
}

function onListEntryRemove(idx) {
  state.listEntries.splice(idx, 1);
  autoSave();
  updateUrl();
  renderResults();
}

function onListEntryMove(idx, dir) {
  const entries = state.listEntries;
  const movedId = entries[idx];

  if (dir === 'up' && idx > 0) {
    [entries[idx], entries[idx - 1]] = [entries[idx - 1], entries[idx]];
  } else if (dir === 'down' && idx < entries.length - 1) {
    [entries[idx], entries[idx + 1]] = [entries[idx + 1], entries[idx]];
  } else {
    return;
  }

  autoSave();
  updateUrl();
  renderResults();

  requestAnimationFrame(() => {
    const row = document.querySelector(`.list-entry-row[data-id="${CSS.escape(movedId)}"]`);
    if (row) {
      row.classList.add('list-entry-moved');
      setTimeout(() => row.classList.remove('list-entry-moved'), 700);
    }
  });
}

function onStartRenameList() {
  const nameEl = document.getElementById('list-view-name');
  if (!nameEl) return;

  const current = state.listName || 'Untitled list';
  const input = document.createElement('input');

  input.type = 'text';
  input.value = current;
  input.className = 'list-rename-input';
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const newName = input.value.trim() || 'Untitled list';
    if (listNameExists(newName, state.listId)) {
      let errEl = input.nextElementSibling;
      if (!errEl || !errEl.classList.contains('list-name-error')) {
        errEl = document.createElement('p');
        errEl.className = 'list-name-error';
        input.after(errEl);
      }

      errEl.textContent = `A list named "${newName}" already exists.`;

      input.focus();

      return;
    }

    state.listName = newName;
    if (state.listId && state.listSynced) {
      saveList({ id: state.listId, name: newName, description: state.listDescription, entries: state.listEntries });
    }

    updateUrl();

    renderResults();
  }

  input.addEventListener('blur', commit);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();

    if (e.key === 'Escape') {
      input.removeEventListener('blur', commit);
      renderResults();
    }
  });
}

function onOpenList(id) {
  const l = getList(id);
  if (!l) return;
  state.directId = null;
  state.listMode = true;
  state.listId = id;
  state.listName = l.name || 'Untitled list';
  state.listDescription = l.description || '';
  state.listEntries = [...l.entries];
  state.listSynced = true;
  touchList(id);
  closeListPanelInternal();
  renderResults();
}

function onAddToExistingList(entryId, listId, btn) {
  const l = getList(listId);
  if (!l) return;

  const alreadyIn = l.entries.includes(entryId);
  if (!alreadyIn) {
    l.entries.push(entryId);
    saveList(l);
  } else {
    touchList(listId);
  }

  if (btn) {
    const count = l.entries.length;
    const row = btn.closest('.list-modal-item-row');
    const countEl = row && row.querySelector('.list-item-count');

    if (alreadyIn) {
      if (row) row.style.animation = 'list-row-flash-red 0.35s ease-in-out 2';
      if (countEl) countEl.textContent = `(${count}) - already in list`;
    } else {
      if (countEl) countEl.textContent = `(${count})`;
    }

    btn.textContent = alreadyIn ? '!' : '✓';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = '+';
      btn.disabled = false;
      if (countEl) countEl.textContent = `(${count})`;
      if (row) row.style.animation = '';
    }, 1500);
  }
}

function onCreateAndAddToList(entryId, name) {
  const resolvedName = name || 'Untitled list';
  if (listNameExists(resolvedName)) {
    const errEl = document.getElementById('new-list-name-error');

    if (errEl) {
      errEl.textContent = `A list named "${resolvedName}" already exists.`;
      errEl.hidden = false;
    }

    return;
  }

  const id = generateListId();
  saveList({ id, name: resolvedName, entries: [entryId] });

  // Re-render the modal so the new list appears in the recent lists section.
  openAddToListModal(entryId);

  // After the DOM has updated, find the new list's button and show feedback.
  requestAnimationFrame(() => {
    const newBtn = document.querySelector(`.add-to-existing-list-btn[data-list-id="${id}"]`);
    if (newBtn) {
      const row = newBtn.closest('.list-modal-item-row');

      if (row) row.style.animation = 'list-row-flash 0.35s ease-in-out 2';

      newBtn.textContent = '✓';
      newBtn.disabled = true;

      setTimeout(() => {
        newBtn.textContent = '+';
        newBtn.disabled = false;
        if (row) row.style.animation = '';
      }, 1500);
    }
  });
}

function closeListPanelInternal() {
  const panel = document.getElementById('list-panel');
  const overlay = document.getElementById('list-overlay');
  const toggle = document.getElementById('mobile-list-toggle');
  if (panel) {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }
  if (overlay) overlay.classList.remove('active');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}
