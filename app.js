// =============================================================================
// TORCHFINDER: app.js
// Entry point. Imports modules from scripts/, wires up the DOM, and boots.
// =============================================================================

import { state, DATA_URL } from './scripts/state.js';
import { parseUrlParams } from './scripts/url.js';
import { applyFilters, sortFiltered, clearShuffleCache } from './scripts/filters.js';
import {
  showLoading,
  showError,
  enableControls,
  renderFilterSidebar,
  syncFilterControlStates,
  renderResults,
  renderListPanel,
  buildPills,
  syncPillFade,
  closeAddToListModal,
} from './scripts/render.js';
import { getLists, importLists, clearAllLists } from './scripts/lists.js';
import { createMonthPicker } from './scripts/month-picker.js';
import { getCoverConsent, setCoverConsent } from './scripts/consent.js';
import {
  debouncedSearch,
  onSortChange,
  onClearFilters,
  onRangeChange,
  openFilterPanel,
  closeFilterPanel,
  openListPanel,
  closeListPanel,
  trapFocus,
} from './scripts/handlers.js';

async function init() {
  parseUrlParams();

  const sidebar = document.getElementById('filter-sidebar');
  const isDesktop = () => globalThis.matchMedia('(min-width: 801px)').matches;

  if (isDesktop()) {
    sidebar.removeAttribute('aria-hidden');
  } else {
    sidebar.setAttribute('aria-hidden', 'true');
  }

  // Bind: mobile filter toggle
  document.getElementById('mobile-filter-toggle').addEventListener('click', () => {
    const expanded =
      document.getElementById('mobile-filter-toggle').getAttribute('aria-expanded') === 'true';
    if (expanded) closeFilterPanel();
    else openFilterPanel();
  });

  // Bind: close filter panel button
  const closeBtn = document.getElementById('close-filter-panel');
  if (closeBtn) closeBtn.addEventListener('click', closeFilterPanel);

  // Bind: filter overlay click closes filter panel
  document.getElementById('filter-overlay').addEventListener('click', closeFilterPanel);

  // Bind: list panel toggles
  function isListPanelOpen() {
    return document.getElementById('list-panel').classList.contains('open');
  }

  document.getElementById('mobile-list-toggle').addEventListener('click', () => {
    if (isListPanelOpen()) closeListPanel();
    else openListPanel();
  });

  document.getElementById('list-panel-toggle-mobile').addEventListener('click', () => {
    if (isListPanelOpen()) closeListPanel();
    else {
      closeFilterPanel();
      openListPanel();
    }
  });

  // Bind: close list panel button
  document.getElementById('close-list-panel').addEventListener('click', closeListPanel);

  // Bind: export all lists
  document.getElementById('export-lists-btn').addEventListener('click', async () => {
    const data = getLists();
    const json = JSON.stringify(data, null, 2);
    const btn = document.getElementById('export-lists-btn');
    const prev = btn.textContent;

    try {
      if ('showSaveFilePicker' in window) {
        const handle = await globalThis.showSaveFilePicker({
          suggestedName: 'torchfinder-lists.json',
          types: [{ description: 'JSON file', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(json);
        await writable.close();
      } else {
        // Fallback for Firefox: silent download to default downloads folder
        const a = document.createElement('a');
        a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
        a.download = 'torchfinder-lists.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        btn.textContent = 'Saved to default download folder!';
        setTimeout(() => { btn.textContent = prev; }, 2500);
        return;
      }
      btn.textContent = 'Exported!';
      setTimeout(() => { btn.textContent = prev; }, 2000);
    } catch (e) {
      if (e.name !== 'AbortError') {
        alert('Export failed.');
      }
    }
  });

  // Bind: import lists
  document.getElementById('import-lists-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) throw new Error('not an array');
          const count = importLists(data);
          renderListPanel();
          const btn = document.getElementById('import-lists-btn');
          const prev = btn.textContent;
          btn.textContent = `Imported ${count}`;
          setTimeout(() => { btn.textContent = prev; }, 2000);
        } catch {
          alert('Import failed: the file format is not valid.');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  });

  // Bind: delete all lists
  document.getElementById('delete-all-lists-btn').addEventListener('click', () => {
    if (confirm('Delete all saved lists? This cannot be undone (without an exported backup).')) {
      clearAllLists();
      renderListPanel();
    }
  });

  // Bind: list overlay click closes list panel
  document.getElementById('list-overlay').addEventListener('click', closeListPanel);

  // Bind: modal close button and backdrop
  document.getElementById('close-add-to-list-modal').addEventListener('click', closeAddToListModal);
  document.querySelector('#add-to-list-modal .list-modal-backdrop').addEventListener('click', closeAddToListModal);

  // Floating tooltip for tags with data-tooltip
  const cardTooltip = document.createElement('div');
  cardTooltip.id = 'card-tooltip';
  cardTooltip.hidden = true;
  document.body.appendChild(cardTooltip);

  function showCardTooltip(tag) {
    cardTooltip.textContent = tag.dataset.tip;
    cardTooltip.hidden = false;
    const rect = tag.getBoundingClientRect();
    const tRect = cardTooltip.getBoundingClientRect();
    const left = Math.max(8, Math.min(
      rect.left + globalThis.scrollX + rect.width / 2 - tRect.width / 2,
      globalThis.scrollX + globalThis.innerWidth - tRect.width - 8,
    ));
    const top = rect.top + globalThis.scrollY - tRect.height - 6;
    cardTooltip.style.left = left + 'px';
    cardTooltip.style.top = top + 'px';
  }

  function hideCardTooltip() {
    cardTooltip.hidden = true;
  }

  document.addEventListener('mouseover', (e) => {
    const tag = e.target.closest('.card-tag[data-tip]');
    if (tag) showCardTooltip(tag);
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.card-tag[data-tip]')) hideCardTooltip();
  });

  document.addEventListener('focusin', (e) => {
    const tag = e.target.closest('.card-tag[data-tip]');
    if (tag) showCardTooltip(tag);
  });

  document.addEventListener('focusout', (e) => {
    if (e.target.closest('.card-tag[data-tip]')) hideCardTooltip();
  });

  document.addEventListener('click', (e) => {
    const tag = e.target.closest('.card-tag[data-tip]');
    if (tag) {
      cardTooltip.hidden ? showCardTooltip(tag) : hideCardTooltip();
    } else {
      hideCardTooltip();
    }
  });

  // Bind: Escape key closes panels and modal
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('add-to-list-modal');
    const listPanel = document.getElementById('list-panel');
    if (modal && !modal.hidden) {
      closeAddToListModal();
    } else if (listPanel && listPanel.classList.contains('open')) {
      closeListPanel();
    } else if (sidebar.classList.contains('open')) {
      closeFilterPanel();
    }
  });

  // Bind: filter group toggles
  document.querySelectorAll('.filter-group-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const open = !expanded;
      btn.setAttribute('aria-expanded', String(open));
      const content = btn.nextElementSibling;
      content.removeAttribute('hidden');
      content.style.display = open ? 'block' : 'none';
      if (open) {
        const pillGroup = content.querySelector('.pill-group');
        if (pillGroup) syncPillFade(pillGroup);
      }
    });
  });

  // Bind: clear filters
  document.getElementById('clear-filters').addEventListener('click', onClearFilters);

  function resetToHome(e) {
    e.preventDefault();
    state.directId = null;
    state.listMode = false;
    state.listId = null;
    state.listName = '';
    state.listDescription = '';
    state.listEntries = [];
    state.listSynced = false;
    renderResults();
  }

  // Bind: back-to-list button (exits entry view, returns to current list)
  document.getElementById('back-to-list').addEventListener('click', (e) => {
    e.preventDefault();
    state.directId = null;
    renderResults();
  });

  // Bind: back-to-all button (exits direct-ID mode and list mode)
  document.getElementById('back-to-all').addEventListener('click', resetToHome);

  // Bind: random content button
  function onRandomContent() {
    if (!state.data || state.data.length === 0) return;
    const entry = state.data[Math.floor(Math.random() * state.data.length)];
    state.directId = entry.id;
    state.listMode = false;
    state.listId = null;
    state.listName = '';
    state.listDescription = '';
    state.listEntries = [];
    state.listSynced = false;
    renderResults();
  }

  document.getElementById('random-content-btn').addEventListener('click', onRandomContent);
  document.getElementById('random-content-btn-mobile').addEventListener('click', onRandomContent);

  // Bind: Torchfinder title link (clear all filters + exit list/direct-ID mode)
  document.getElementById('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    state.directId = null;
    state.listMode = false;
    state.listId = null;
    state.listName = '';
    state.listDescription = '';
    state.listEntries = [];
    state.listSynced = false;
    onClearFilters();
  });

  // Bind: search input + clear button
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  function updateSearchClear() {
    searchClear.hidden = !searchInput.value;
  }

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
    updateSearchClear();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    debouncedSearch('');
    updateSearchClear();
    searchInput.focus();
  });

  // Bind: sort select
  document.getElementById('sort-select').addEventListener('change', (e) =>
    onSortChange(e.target.value),
  );

  // Bind: sort reverse
  document.getElementById('sort-reverse').addEventListener('click', () => {
    state.sortReverse = !state.sortReverse;
    syncFilterControlStates();
    sortFiltered();
    state.page = 1;
    renderResults();
  });

  // Bind: reshuffle button (shuffle sort only)
  document.getElementById('sort-reshuffle').addEventListener('click', () => {
    clearShuffleCache();
    state.sortReverse = false;
    state.page = 1;
    sortFiltered();
    syncFilterControlStates();
    renderResults();
  });

  // Bind: official-only toggle
  document.getElementById('toggle-official').addEventListener('change', (e) => {
    state.filters.official = e.target.checked;
    state.page = 1;
    applyFilters();
    renderResults();
  });

  // Bind: upcoming toggle
  document.getElementById('toggle-upcoming').addEventListener('change', (e) => {
    state.filters.upcoming = e.target.checked;
    state.page = 1;
    applyFilters();
    renderResults();
  });

  // Bind: has-character-options checkbox
  document.getElementById('has-character-options').addEventListener('change', (e) => {
    state.filters.hasCharacterOptions = e.target.checked;
    state.page = 1;
    applyFilters();
    renderResults();
  });

  // Bind: exclude-unspecified checkboxes
  document.getElementById('exclude-unspecified-level').addEventListener('change', (e) => {
    state.filters.excludeUnspecifiedLevel = e.target.checked;
    state.page = 1;
    applyFilters();
    renderResults();
  });

  document.getElementById('exclude-unspecified-party').addEventListener('change', (e) => {
    state.filters.excludeUnspecifiedParty = e.target.checked;
    state.page = 1;
    applyFilters();
    renderResults();
  });

  // Bind: level / party size range inputs
  ['level-min', 'level-max', 'party-min', 'party-max'].forEach((id) => {
    document.getElementById(id).addEventListener('change', onRangeChange);
  });

  // Init: publication date range pickers (custom month+year picker)
  let toPicker;
  const fromPicker = createMonthPicker(document.getElementById('date-from'), {
    isStart: true,
    getOtherValue: () => state.filters.dmax,
    onSelect(value) {
      state.filters.dmin = value;
      // If the end is now before the new start, clear the end
      if (state.filters.dmax && state.filters.dmax < value) {
        state.filters.dmax = null;
        if (toPicker) toPicker.clear();
      }
      state.page = 1;
      applyFilters();
      renderResults();
    },
  });

  toPicker = createMonthPicker(document.getElementById('date-to'), {
    isStart: false,
    getOtherValue: () => state.filters.dmin,
    onSelect(value) {
      state.filters.dmax = value;
      state.page = 1;
      applyFilters();
      renderResults();
    },
  });

  // Bind: search-within filter inputs
  document.querySelectorAll('.filter-search-within').forEach((input) => {
    input.addEventListener('input', (e) => {
      const targetId = input.dataset.target;
      const container = document.getElementById(targetId);
      if (!container || !container._allValues) return;
      const q = e.target.value.toLowerCase();
      let visible;
      if (q === '') {
        if (container._hasTopNCap && container._topValues) {
          const selected = state.filters[container._filterKey] || [];
          const topSet = new Set(container._topValues);
          const extras = selected.filter((v) => !topSet.has(v) && container._allValues.includes(v));
          visible = [...container._topValues, ...extras];
        } else {
          visible = container._allValues;
        }
      } else {
        // Show all values matching the query
        visible = container._allValues.filter((v) => {
          const label = container._labelFn ? container._labelFn(v) : v;
          return label.toLowerCase().includes(q) || v.toLowerCase().includes(q);
        });
      }
      buildPills(container, visible, container._filterKey, container._labelFn);
    });
  });

  // Responsive: sync sidebar visibility on resize
  const mq = globalThis.matchMedia('(min-width: 801px)');
  mq.addEventListener('change', (e) => {
    if (e.matches) {
      // Desktop: always show, remove mobile state
      sidebar.classList.remove('open');
      sidebar.removeAttribute('aria-hidden');
      document.getElementById('filter-overlay').classList.remove('active');
      document.getElementById('mobile-filter-toggle').setAttribute('aria-expanded', 'false');
      sidebar.removeEventListener('keydown', trapFocus);
    } else {
      // Mobile: hide sidebar
      sidebar.setAttribute('aria-hidden', 'true');
    }
  });

  // Cover image consent
  function syncConsentUI() {
    const consent = getCoverConsent();
    const banner = document.getElementById('cover-consent-banner');
    const statusEl = document.getElementById('footer-thumbnail-status');
    const changeBtn = document.getElementById('footer-thumbnail-change');
    if (consent === null) {
      banner.hidden = false;
      statusEl.textContent = '';
      changeBtn.hidden = true;
    } else {
      banner.hidden = true;
      statusEl.textContent = consent === 'granted' ? 'enabled' : 'disabled';
      changeBtn.hidden = false;
    }
  }

  document.getElementById('cover-consent-allow').addEventListener('click', () => {
    setCoverConsent('granted');
    syncConsentUI();
    renderResults();
  });

  document.getElementById('cover-consent-deny').addEventListener('click', () => {
    setCoverConsent('denied');
    syncConsentUI();
  });

  document.getElementById('footer-thumbnail-change').addEventListener('click', () => {
    document.getElementById('cover-consent-banner').hidden = false;
    document.getElementById('cover-consent-banner').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  syncConsentUI();

  // Show loading placeholder
  showLoading();
  state.data = [];
  const worker = new Worker('worker.js', { type: 'module' });
  worker.postMessage({ url: DATA_URL });
  let firstBatch = true;
  worker.onmessage = ({ data }) => {
    if (data.type === 'batch') {
      state.data.push(...data.entries);
      if (firstBatch) {
        firstBatch = false;
        enableControls();
        renderFilterSidebar();
        syncFilterControlStates();
        updateSearchClear();
      }
      applyFilters();
      renderResults();
    } else if (data.type === 'done') {
      renderFilterSidebar(); // rebuild with complete dataset
      applyFilters();
      renderResults();
      worker.terminate();
    } else if (data.type === 'error') {
      console.error('Torchfinder: failed to load data:', data.message);
      showError();
      worker.terminate();
    }
  };
}

document.addEventListener('DOMContentLoaded', init);
