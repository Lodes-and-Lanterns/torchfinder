import { state, SEARCH_DEBOUNCE_MS } from './state.js';
import { debounce } from './utils.js';
import { applyFilters, sortFiltered } from './filters.js';
import { renderResults, renderFilterSidebar, renderListPanel, buildPills, syncFilterControlStates } from './render.js';

export const debouncedSearch = debounce((value) => {
  state.query = value;
  state.page = 1;
  state.expandedCardId = null;
  applyFilters();
  renderResults();
}, SEARCH_DEBOUNCE_MS);

export function onSortChange(value) {
  state.sort = value;
  state.sortReverse = false;
  sortFiltered();
  state.page = 1;
  syncFilterControlStates();
  renderResults();

  if (value === 'shuffle') {
    const btn = document.getElementById('sort-reshuffle');
    if (btn) {
      btn.classList.remove('pulsing');
      requestAnimationFrame(() => {
        btn.classList.add('pulsing');
        btn.addEventListener('animationend', () => btn.classList.remove('pulsing'), { once: true });
      });
    }
  }
}

export function onRangeChange() {
  const levelMin = document.getElementById('level-min');
  const levelMax = document.getElementById('level-max');
  const partyMin = document.getElementById('party-min');
  const partyMax = document.getElementById('party-max');
  const levelRangeWarning = document.getElementById('level-range-warning');
  const partyRangeWarning = document.getElementById('party-range-warning');

  state.filters.lmin = levelMin.value !== '' ? parseInt(levelMin.value, 10) : null;
  state.filters.lmax = levelMax.value !== '' ? parseInt(levelMax.value, 10) : null;
  state.filters.pmin = partyMin.value !== '' ? parseInt(partyMin.value, 10) : null;
  state.filters.pmax = partyMax.value !== '' ? parseInt(partyMax.value, 10) : null;

  const levelInvalid =
    state.filters.lmin !== null &&
    state.filters.lmax !== null &&
    state.filters.lmin > state.filters.lmax;

  const partyInvalid =
    state.filters.pmin !== null &&
    state.filters.pmax !== null &&
    state.filters.pmin > state.filters.pmax;

  levelRangeWarning.hidden = !levelInvalid;
  partyRangeWarning.hidden = !partyInvalid;

  state.page = 1;
  applyFilters();
  renderResults();
}

export function onClearFilters() {
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

  state.query = '';
  state.page = 1;
  state.expandedCardId = null;

  // Reset search-within inputs
  document.querySelectorAll('.filter-search-within').forEach((input) => {
    input.value = '';
    const targetId = input.dataset.target;
    const container = document.getElementById(targetId);

    if (container && container._topValues) {
      buildPills(container, container._topValues, container._filterKey, container._labelFn);
    }
  });

  renderFilterSidebar();
  applyFilters();
  renderResults();
}

export function openFilterPanel() {
  const sidebar = document.getElementById('filter-sidebar');
  const overlay = document.getElementById('filter-overlay');
  const toggle = document.getElementById('mobile-filter-toggle');

  sidebar.classList.add('open');
  sidebar.removeAttribute('aria-hidden');
  overlay.classList.add('active');
  toggle.setAttribute('aria-expanded', 'true');

  const first = sidebar.querySelector('button:not([disabled]), input:not([disabled])');
  if (first) first.focus();

  sidebar.addEventListener('keydown', trapFocus);
}

export function closeFilterPanel() {
  const sidebar = document.getElementById('filter-sidebar');
  const overlay = document.getElementById('filter-overlay');
  const toggle = document.getElementById('mobile-filter-toggle');

  sidebar.classList.remove('open');
  sidebar.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('active');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.focus();

  sidebar.removeEventListener('keydown', trapFocus);
}

export function openListPanel() {
  const panel = document.getElementById('list-panel');
  const overlay = document.getElementById('list-overlay');
  const toggle = document.getElementById('mobile-list-toggle');

  renderListPanel();
  panel.classList.add('open');
  panel.removeAttribute('aria-hidden');
  overlay.classList.add('active');
  if (toggle) toggle.setAttribute('aria-expanded', 'true');

  const first = panel.querySelector('button:not([disabled]), input:not([disabled])');
  if (first) first.focus();
}

export function closeListPanel() {
  const panel = document.getElementById('list-panel');
  const overlay = document.getElementById('list-overlay');
  const toggle = document.getElementById('mobile-list-toggle');

  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('active');

  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus({ preventScroll: true });
  }
}

export function trapFocus(e) {
  if (e.key !== 'Tab') return;

  const sidebar = document.getElementById('filter-sidebar');
  const focusable = sidebar.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
  }
}
