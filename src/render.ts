import { PAGE_SIZE, state } from "./state.ts";
import { updateUrl } from "./url.ts";
import { deleteList, getList, getListSavedState } from "./lists.ts";
import { escapeHtml } from "./utils.ts";
import { renderCardHtml } from "./card-utilities.ts";
import { updateClearButton } from "./filter-sidebar.ts";
import {
  onCopyListUrl,
  onOpenList,
  onStartRenameList,
  openAddToListModal,
  renderListView,
} from "./list-view.ts";

// RESULTS
//////////

export function renderResults(): void {
  const list = document.getElementById("results-list")!;
  const summary = document.getElementById("result-summary")!;
  const backBtn = document.getElementById("back-to-all")!;
  const backToListBtn = document.getElementById("back-to-list")!;
  const paginationEl = document.getElementById("pagination")!;

  updateClearButton();

  // Direct ID mode: show only that entry.
  // Takes priority over list mode so clicking an entry from a list works correctly.
  if (state.directId) {
    const entry = state.data
      ? state.data.find((e) => e.id === state.directId)
      : null;

    document.getElementById("search-sort-bar")!.hidden = true;
    document.getElementById("mobile-filter-toggle")!.hidden = true;

    backBtn.hidden = false;
    backToListBtn.hidden = !state.listMode;
    paginationEl.innerHTML = "";

    if (entry) {
      document.title =
        `${entry.title} \u2014 Torchfinder \u2014 Lodes & Lanterns`;
      summary.textContent = "";
      list.innerHTML = renderCardHtml(entry, true);

      attachCardListeners(list);

      const heading = list.querySelector<HTMLElement>(".card-title");
      if (heading) requestAnimationFrame(() => heading.focus());
    } else {
      document.title = "Torchfinder \u2014 Lodes & Lanterns";
      summary.textContent = "";
      list.innerHTML = '<div class="empty-state"><p>Entry not found.</p></div>';
    }

    updateUrl();

    return;
  }

  backToListBtn.hidden = true;

  // List mode: show list view
  if (state.listMode) {
    document.title = `${
      state.listName || "Untitled list"
    } \u2014 Torchfinder \u2014 Lodes & Lanterns`;

    document.getElementById("search-sort-bar")!.hidden = true;
    document.getElementById("mobile-filter-toggle")!.hidden = true;

    backBtn.hidden = false;

    paginationEl.innerHTML = "";

    const isDeletable = !!(state.listId && getList(state.listId));
    const unsaved = !isDeletable &&
      getListSavedState(state.listId, state.listEntries) !== "saved";

    summary.innerHTML = `<div class="list-view-title-row">
  <span class="list-view-name" id="list-view-name">${
      escapeHtml(state.listName || "Untitled list")
    }</span>
  ${
      unsaved
        ? '<span class="list-saved-badge list-saved-badge--unsaved">Unsaved</span>'
        : ""
    }
  ${
      isDeletable
        ? '<button type="button" class="list-rename-btn btn-delete outline secondary" id="list-delete-btn" aria-label="Delete list">Delete</button>'
        : ""
    }
  <button type="button" class="list-rename-btn outline secondary" id="list-rename-btn" aria-label="Rename list">Rename</button>
  <button type="button" class="list-rename-btn outline secondary" id="list-copy-url-btn">Share list</button>
</div>
<p class="list-view-bookmark-hint">Lists are automatically saved browser-side. Bookmarking backs up the <b>current</b> snapshot of the list.</p>`;

    document.getElementById("list-delete-btn")?.addEventListener(
      "click",
      () => {
        if (confirm(`Delete "${state.listName || "Untitled list"}"?`)) {
          deleteList(state.listId);

          state.listMode = false;
          state.listId = null;
          state.listName = "";
          state.listDescription = "";
          state.listEntries = [];
          state.listSynced = false;

          renderResults();
        }
      },
    );

    document.getElementById("list-rename-btn")!.addEventListener(
      "click",
      onStartRenameList,
    );

    document.getElementById("list-copy-url-btn")!.addEventListener(
      "click",
      onCopyListUrl,
    );

    if (state.data) renderListView();

    updateUrl();

    return;
  }

  document.getElementById("search-sort-bar")!.hidden = false;
  document.getElementById("mobile-filter-toggle")!.hidden = false;

  document.title = "Torchfinder \u2014 Lodes & Lanterns";

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
    summary.textContent = "No results found. Try broadening your filters.";

    list.innerHTML =
      '<div class="empty-state"><p>No results found. Try broadening your filters.</p></div>';

    paginationEl.innerHTML = "";
  } else {
    const range = count > 1 ? `${start + 1}\u2013${end} of ` : "";
    const label = count === 1 ? "entry" : "entries";
    const filtered = count !== total ? ` (filtered from ${total})` : "";

    summary.textContent = `Showing ${range}${count} ${label}${filtered}`;

    list.innerHTML = pageEntries
      .map((entry) => renderCardHtml(entry, entry.id === state.expandedCardId))
      .join("");

    attachCardListeners(list);
    renderPagination(totalPages);
  }

  updateUrl();
}

function attachCardListeners(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>(".result-card").forEach((card) => {
    const id = card.dataset.id!;

    const header = card.querySelector<HTMLElement>(".card-header");

    if (!header) return;

    header.addEventListener("click", () => onCardClick(id));
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCardClick(id);
      }
    });

    const titleLink = card.querySelector(".card-title-link");

    if (titleLink) {
      titleLink.addEventListener("click", (e) => e.stopPropagation());
    }

    card.querySelectorAll<HTMLElement>(".add-to-list-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openAddToListModal(btn.dataset.id!);
      });
    });

    card.querySelectorAll<HTMLElement>(".card-list-link").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenList(a.dataset.listId!);
      });
    });

    card.querySelectorAll<HTMLElement>(".copy-entry-id-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.id!).then(() => {
          const prev = btn.textContent;
          btn.textContent = "Copied!";
          setTimeout(() => {
            btn.textContent = prev;
          }, 1500);
        }).catch(() => {});
      });
    });

    card.querySelectorAll<HTMLElement>(".copy-entry-link-btn").forEach(
      (btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();

          const url =
            `${globalThis.location.origin}${globalThis.location.pathname}?id=${
              encodeURIComponent(btn.dataset.id!)
            }`;

          navigator.clipboard.writeText(url).then(() => {
            const prev = btn.textContent;

            btn.textContent = "Copied!";

            setTimeout(() => {
              btn.textContent = prev;
            }, 1500);
          }).catch(() => {});
        });
      },
    );
  });
}

// PAGINATION
/////////////

function renderPagination(totalPages: number): void {
  const nav = document.getElementById("pagination");
  if (!nav) return;

  if (totalPages <= 1) {
    nav.innerHTML = "";
    return;
  }

  const current = state.page;
  const pages = computePageNumbers(current, totalPages);
  const items: string[] = [];

  items.push(
    `<li><a href="#" class="pagination-btn${
      current <= 1 ? " disabled" : ""
    }" data-page="${current - 1}" aria-label="Previous page"${
      current <= 1 ? ' aria-disabled="true" tabindex="-1"' : ""
    }>&#x2190;</a></li>`,
  );

  for (const p of pages) {
    if (p === "...") {
      items.push(
        `<li><span class="pagination-ellipsis" aria-hidden="true">&#x2026;</span></li>`,
      );
    } else {
      const isCurrent = p === current;

      items.push(
        `<li><a href="#" class="pagination-btn${
          isCurrent ? " current" : ""
        }" data-page="${p}" aria-label="Page ${p}"${
          isCurrent ? ' aria-current="page"' : ""
        }>${p}</a></li>`,
      );
    }
  }

  items.push(
    `<li><a href="#" class="pagination-btn${
      current >= totalPages ? " disabled" : ""
    }" data-page="${current + 1}" aria-label="Next page"${
      current >= totalPages ? ' aria-disabled="true" tabindex="-1"' : ""
    }>&#x2192;</a></li>`,
  );

  nav.innerHTML = `<ul class="pagination-list">${items.join("")}</ul>`;

  nav.querySelectorAll<HTMLElement>(".pagination-btn:not(.disabled)").forEach(
    (btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const page = parseInt(btn.dataset.page!, 10);
        if (page >= 1 && page <= totalPages) onPageChange(page);
      });
    },
  );
}

export function computePageNumbers(
  current: number,
  total: number,
): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push("...");

  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    ++i
  ) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}

// LOADING / ERROR STATES
/////////////////////////

export function showLoading(): void {
  const list = document.getElementById("results-list")!;
  const summary = document.getElementById("result-summary")!;

  list.innerHTML = `
<div class="loading-skeleton" aria-label="Loading results" aria-busy="true">
  ${
    Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join(
      "",
    )
  }
</div>`;

  summary.textContent = "Loading\u2026";
}

export function showError(): void {
  const list = document.getElementById("results-list")!;
  const summary = document.getElementById("result-summary")!;

  list.innerHTML =
    '<div class="error-state" role="alert"><p>Failed to load adventure data. Please try refreshing the page.</p></div>';

  summary.textContent = "";
}

export function enableControls(): void {
  document.querySelectorAll<HTMLElement>(
    "#filter-controls input, #filter-controls select, #filter-controls button, #search-input, #sort-select, #sort-reverse, #sort-reshuffle",
  ).forEach((el) => {
    (el as HTMLInputElement | HTMLSelectElement | HTMLButtonElement).disabled =
      false;
  });

  document.querySelectorAll<HTMLButtonElement>(
    "#random-content-btn, #random-content-btn-mobile",
  )
    .forEach((btn) => {
      btn.disabled = false;
    });
}

// CARD / PAGE INTERACTIONS
///////////////////////////
// Kept here (rather than handlers.ts) to avoid circular imports: render
// functions call these, and these call render functions.

export function onCardClick(id: string): void {
  const wasExpanded = state.expandedCardId === id;

  // Collapse the previously expanded card if it's a different one
  if (state.expandedCardId && state.expandedCardId !== id) {
    const prev = document.querySelector<HTMLElement>(
      `.result-card[data-id="${CSS.escape(state.expandedCardId)}"]`,
    );

    if (prev) {
      prev.classList.remove("expanded");
      prev.setAttribute("aria-expanded", "false");

      const prevContent = prev.querySelector<HTMLElement>(".card-expanded");
      if (prevContent) prevContent.style.display = "none";
    }
  }

  state.expandedCardId = wasExpanded ? null : id;

  const card = document.querySelector<HTMLElement>(
    `.result-card[data-id="${CSS.escape(id)}"]`,
  );

  if (!card) return;

  const expanding = !wasExpanded;
  card.classList.toggle("expanded", expanding);
  card.setAttribute("aria-expanded", String(expanding));

  const content = card.querySelector<HTMLElement>(".card-expanded");
  if (content) content.style.display = expanding ? "block" : "none";

  if (expanding) {
    const heading = card.querySelector<HTMLElement>(".card-title");
    if (heading) heading.focus({ preventScroll: true });
  }

  updateUrl();
}

export function onPageChange(page: number): void {
  const distanceFromBottom = document.documentElement.scrollHeight -
    globalThis.scrollY - globalThis.innerHeight;

  state.page = page;

  renderResults();

  requestAnimationFrame(() => {
    const newScrollY = document.documentElement.scrollHeight -
      distanceFromBottom - globalThis.innerHeight;

    globalThis.scrollTo({ top: Math.max(0, newScrollY), behavior: "instant" });
  });
}
