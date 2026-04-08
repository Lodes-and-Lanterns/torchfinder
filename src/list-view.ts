import { state } from "./state.ts";
import { escapeHtml } from "./utils.ts";
import {
  deleteList,
  generateListId,
  getList,
  getLists,
  getListSavedState,
  listNameExists,
  saveList,
  touchList,
} from "./lists.ts";
import { updateUrl } from "./url.ts";
import { renderResults } from "./render.ts";

// LIST VIEW
////////////

export function renderListView(): void {
  const list = document.getElementById("results-list")!;
  const unsaved = !getList(state.listId) &&
    getListSavedState(state.listId, state.listEntries) !== "saved";

  const headerHtml = unsaved
    ? '<div class="list-view-actions"><button type="button" class="outline secondary" id="list-save-btn">Save</button></div>'
    : "";

  let rowsHtml: string;
  if (state.listEntries.length === 0) {
    rowsHtml =
      '<div class="empty-state"><p>This list is empty. Browse and expand entries to add them.</p></div>';
  } else {
    const total = state.listEntries.length;

    rowsHtml = state.listEntries
      .map((entryId, idx) => {
        const entry = state.data
          ? state.data.find((e) => e.id === entryId)
          : null;

        const upDisabled = idx === 0 ? " disabled" : "";

        const downDisabled = idx === total - 1 ? " disabled" : "";

        if (entry) {
          const byline = entry.authors && entry.authors.length
            ? `<div class="list-entry-byline">${
              escapeHtml(entry.authors.join(", "))
            }</div>`
            : "";

          return `
<div class="list-entry-row" draggable="true" data-idx="${idx}" data-id="${
            escapeHtml(entry.id)
          }">
  <span class="list-drag-handle" aria-hidden="true">\u2807</span>
  <div class="list-entry-num">${idx + 1}</div>
  <div class="list-entry-info">
    <a href="?id=${encodeURIComponent(entry.id)}" class="list-entry-title">${
            escapeHtml(entry.title)
          }</a>
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
<div class="list-entry-row list-entry-stale" draggable="true" data-idx="${idx}" data-id="${
            escapeHtml(entryId)
          }">
  <span class="list-drag-handle" aria-hidden="true">\u2807</span>
  <div class="list-entry-num">${idx + 1}</div>
  <div class="list-entry-info">
    <span class="list-entry-title list-entry-title--stale">Unknown entry</span>
    <div class="list-entry-byline list-entry-stale-note">ID: ${
            escapeHtml(entryId)
          }</div>
  </div>
  <div class="list-entry-controls">
    <button type="button" class="list-move-btn" data-dir="up" aria-label="Move up"${upDisabled}>&#x2191;</button>
    <button type="button" class="list-move-btn" data-dir="down" aria-label="Move down"${downDisabled}>&#x2193;</button>
    <button type="button" class="list-remove-btn" aria-label="Remove from list">&#x2715;</button>
  </div>
</div>`;
        }
      }).join("");
  }

  const descriptionHtml = `<textarea
    class="list-view-description"
    id="list-view-description"
    placeholder="Add a description\u2026"
    rows="1"
    aria-label="List description"
  >${escapeHtml(state.listDescription || "")}</textarea>`;

  list.innerHTML = descriptionHtml + headerHtml + rowsHtml;

  const descEl = document.getElementById(
    "list-view-description",
  ) as HTMLTextAreaElement;

  function autoResize(): void {
    descEl.style.height = "auto";
    descEl.style.height = descEl.scrollHeight + "px";
  }

  autoResize();

  descEl.addEventListener("input", autoResize);

  descEl.addEventListener("blur", () => {
    state.listDescription = descEl.value.trim();
    autoSave();
    updateUrl();
  });

  document.getElementById("list-save-btn")?.addEventListener(
    "click",
    onSaveList,
  );

  list.querySelectorAll<HTMLElement>(".list-remove-btn").forEach((btn) => {
    const row = btn.closest<HTMLElement>(".list-entry-row")!;
    btn.addEventListener(
      "click",
      () => onListEntryRemove(parseInt(row.dataset.idx!, 10)),
    );
  });

  list.querySelectorAll<HTMLElement>(".list-move-btn").forEach((btn) => {
    const row = btn.closest<HTMLElement>(".list-entry-row")!;

    btn.addEventListener(
      "click",
      () => onListEntryMove(parseInt(row.dataset.idx!, 10), btn.dataset.dir!),
    );
  });

  // Intercept title link clicks so navigating to an entry keeps list state in memory.
  list.querySelectorAll<HTMLAnchorElement>(".list-entry-title[href]").forEach(
    (link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();

        const params = new URLSearchParams(
          new URL(link.href, globalThis.location.href).search,
        );

        state.directId = params.get("id");

        renderResults();
      });
    },
  );

  setupListDragDrop(list);
}

function setupListDragDrop(container: HTMLElement): void {
  let dragSrcIdx: number | null = null;

  function clearIndicators(): void {
    container.querySelectorAll(".drag-over-top, .drag-over-bottom").forEach(
      (el) => {
        el.classList.remove("drag-over-top", "drag-over-bottom");
      },
    );
  }

  container.querySelectorAll<HTMLElement>(".list-entry-row").forEach((row) => {
    row.addEventListener("dragstart", (e) => {
      dragSrcIdx = parseInt(row.dataset.idx!, 10);

      e.dataTransfer!.effectAllowed = "move";
      e.dataTransfer!.setData("text/plain", ""); // required by Firefox

      requestAnimationFrame(() => row.classList.add("drag-dragging"));
    });

    row.addEventListener("dragend", () => {
      row.classList.remove("drag-dragging");
      clearIndicators();
      dragSrcIdx = null;
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();

      if (
        dragSrcIdx === null || parseInt(row.dataset.idx!, 10) === dragSrcIdx
      ) {
        return;
      }

      e.dataTransfer!.dropEffect = "move";

      clearIndicators();

      const rect = row.getBoundingClientRect();

      row.classList.add(
        e.clientY < rect.top + rect.height / 2
          ? "drag-over-top"
          : "drag-over-bottom",
      );
    });

    row.addEventListener("dragleave", (e) => {
      if (!row.contains(e.relatedTarget as Node)) {
        row.classList.remove("drag-over-top", "drag-over-bottom");
      }
    });

    row.addEventListener("drop", (e) => {
      e.preventDefault();

      if (dragSrcIdx === null) return;
      const targetIdx = parseInt(row.dataset.idx!, 10);
      if (targetIdx === dragSrcIdx) return;

      const rect = row.getBoundingClientRect();
      let insertAt = e.clientY < rect.top + rect.height / 2
        ? targetIdx
        : targetIdx + 1;
      if (dragSrcIdx < insertAt) --insertAt;

      const [moved] = state.listEntries.splice(dragSrcIdx, 1);
      state.listEntries.splice(insertAt, 0, moved);

      autoSave();
      updateUrl();
      renderResults();

      requestAnimationFrame(() => {
        const movedRow = document.querySelector<HTMLElement>(
          `.list-entry-row[data-id="${CSS.escape(moved)}"]`,
        );

        if (movedRow) {
          movedRow.classList.add("list-entry-moved");
          setTimeout(() => movedRow.classList.remove("list-entry-moved"), 700);
        }
      });
    });
  });
}

export function renderListPanel(): void {
  const content = document.getElementById("list-panel-content");
  if (!content) return;

  const lists = getLists().sort((a, b) =>
    (b.lastAccessedAt || "").localeCompare(a.lastAccessedAt || "")
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
    <a class="list-panel-item-name" data-id="${escapeHtml(l.id)}" href="#">${
        escapeHtml(l.name || "Untitled list")
      }</a>
    <span class="list-panel-item-count">${(l.entries || []).length} ${
        (l.entries || []).length === 1 ? "entry" : "entries"
      }</span>
  </div>
  <div class="list-panel-item-actions">
    <button type="button" class="list-panel-delete-btn btn-delete outline secondary" data-id="${
        escapeHtml(l.id)
      }" aria-label="Delete ${
        escapeHtml(l.name || "Untitled list")
      }">&#x2715;</button>
  </div>
</div>`,
    ).join("");

  content.querySelectorAll<HTMLElement>(".list-panel-item-name").forEach(
    (a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        onOpenList(a.dataset.id!);
      });
    },
  );

  content.querySelectorAll<HTMLElement>(".list-panel-delete-btn").forEach(
    (btn) => {
      btn.addEventListener("click", () => {
        const l = getList(btn.dataset.id);

        if (l && confirm(`Delete "${l.name || "Untitled list"}"?`)) {
          deleteList(btn.dataset.id);
          renderListPanel();
        }
      });
    },
  );
}

let modalOpener: Element | null = null;
let modalKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

export function openAddToListModal(entryId: string): void {
  const modal = document.getElementById("add-to-list-modal");
  const body = document.getElementById("list-modal-body");
  if (!modal || !body) return;

  modalOpener = document.activeElement;

  const allLists = getLists().sort((a, b) =>
    (b.lastAccessedAt || "").localeCompare(a.lastAccessedAt || "")
  );

  const recentLists = allLists.slice(0, 5);

  const hasLists = allLists.length > 0;

  function renderListButtons(
    lists: typeof allLists,
    label: string,
  ): void {
    const container = document.getElementById("list-modal-lists");
    const labelEl = document.getElementById("list-modal-lists-label");

    if (!container) return;

    if (labelEl) {
      labelEl.innerHTML = label === "Recent lists"
        ? `Recent lists <span class="list-modal-max-note">(Shows 5 max)</span>`
        : escapeHtml(label);
    }

    if (!lists.length) {
      container.innerHTML =
        '<p class="list-modal-no-recent">No matching lists.</p>';
      return;
    }

    container.innerHTML = lists
      .map(
        (l) =>
          `<div class="list-modal-item-row">
  <span class="list-modal-item-name">${
            escapeHtml(l.name || "Untitled list")
          } <span class="list-item-count">(${
            (l.entries || []).length
          })</span></span>
  <button type="button" class="add-to-existing-list-btn outline secondary" data-list-id="${
            escapeHtml(l.id)
          }" aria-label="Add to ${
            escapeHtml(l.name || "Untitled list")
          }">+</button>
  <button type="button" class="list-modal-goto-btn outline secondary" data-list-id="${
            escapeHtml(l.id)
          }" aria-label="Go to ${
            escapeHtml(l.name || "Untitled list")
          }">&#x2192;</button>
</div>`,
      ).join("");

    container.querySelectorAll<HTMLElement>(".add-to-existing-list-btn")
      .forEach((btn) => {
        btn.addEventListener(
          "click",
          () => onAddToExistingList(entryId, btn.dataset.listId!, btn),
        );
      });

    container.querySelectorAll<HTMLElement>(".list-modal-goto-btn").forEach(
      (btn) => {
        btn.addEventListener("click", () => {
          closeAddToListModal();
          onOpenList(btn.dataset.listId!);
        });
      },
    );
  }

  body.innerHTML = `${
    hasLists
      ? `
<input type="search" id="list-modal-search" class="list-modal-search" placeholder="Search lists\u2026" aria-label="Search lists" />
<h4 class="list-modal-section-label" id="list-modal-lists-label">Recent lists <span class="list-modal-max-note">(Shows 5 max)</span></h4>
<div id="list-modal-lists" class="list-modal-recent"></div>`
      : ""
  }
<h4 class="list-modal-section-label">New list <span class="list-modal-max-note">(+)</span></h4>
<div class="list-modal-create">
  <input type="text" id="new-list-name-input" placeholder="List name\u2026" aria-label="New list name" />
  <button type="button" id="create-and-add-btn" class="outline secondary">Create &amp; add</button>
</div>
<p id="new-list-name-error" class="list-name-error" hidden></p>`;

  if (hasLists) {
    renderListButtons(recentLists, "Recent lists");

    document.getElementById("list-modal-search")!.addEventListener(
      "input",
      (e) => {
        const q = (e.target as HTMLInputElement).value.trim().toLowerCase();

        if (q) {
          renderListButtons(
            allLists.filter((l) =>
              (l.name || "Untitled list").toLowerCase().includes(q)
            ),
            "Matching lists",
          );
        } else {
          renderListButtons(recentLists, "Recent lists");
        }
      },
    );
  }

  modal.removeAttribute("hidden");
  modal.removeAttribute("aria-hidden");

  const createBtn = document.getElementById("create-and-add-btn");
  const nameInput = document.getElementById(
    "new-list-name-input",
  ) as HTMLInputElement | null;

  createBtn?.addEventListener("click", () => {
    onCreateAndAddToList(entryId, nameInput?.value.trim() || "Untitled list");
  });

  nameInput?.addEventListener("input", () => {
    const errEl = document.getElementById("new-list-name-error");
    if (errEl) errEl.hidden = true;
  });

  nameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      onCreateAndAddToList(
        entryId,
        nameInput!.value.trim() || "Untitled list",
      );
    }

    if (e.key === "Escape") closeAddToListModal();
  });

  requestAnimationFrame(() => {
    const first = modal.querySelector<HTMLElement>(
      "input, button:not([disabled])",
    );
    if (first) first.focus();
  });

  modalKeydownHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeAddToListModal();
      return;
    }

    if (e.key !== "Tab") return;

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );

    const first = focusable[0];
    if (!first) return;

    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  modal.addEventListener("keydown", modalKeydownHandler);
}

export function closeAddToListModal(): void {
  const modal = document.getElementById("add-to-list-modal");

  if (modal) {
    modal.setAttribute("hidden", "");
    modal.setAttribute("aria-hidden", "true");

    if (modalKeydownHandler) {
      modal.removeEventListener("keydown", modalKeydownHandler);
      modalKeydownHandler = null;
    }
  }

  if (modalOpener) {
    (modalOpener as HTMLElement).focus();
    modalOpener = null;
  }
}

function onSaveList(): void {
  if (!state.listId) state.listId = generateListId();

  state.listSynced = true;

  saveList({
    id: state.listId,
    name: state.listName || "Untitled list",
    description: state.listDescription,
    entries: state.listEntries,
  });

  updateUrl();
  renderResults();
}

export function onCopyListUrl(): void {
  navigator.clipboard.writeText(globalThis.location.href).then(() => {
    const btn = document.getElementById("list-copy-url-btn");

    if (btn) {
      const prev = btn.textContent;

      btn.textContent = "Copied list data as shareable link!";

      setTimeout(() => {
        btn.textContent = prev;
      }, 2000);
    }
  }).catch(() => {});
}

function autoSave(): void {
  if (state.listId && (state.listSynced || !!getList(state.listId))) {
    state.listSynced = true;
    saveList({
      id: state.listId,
      name: state.listName || "Untitled list",
      description: state.listDescription,
      entries: state.listEntries,
    });
  }
}

function onListEntryRemove(idx: number): void {
  state.listEntries.splice(idx, 1);

  autoSave();
  updateUrl();
  renderResults();
}

function onListEntryMove(idx: number, dir: string): void {
  const entries = state.listEntries;
  const movedId = entries[idx];

  if (dir === "up" && idx > 0) {
    [entries[idx], entries[idx - 1]] = [entries[idx - 1], entries[idx]];
  } else if (dir === "down" && idx < entries.length - 1) {
    [entries[idx], entries[idx + 1]] = [entries[idx + 1], entries[idx]];
  } else {
    return;
  }

  autoSave();
  updateUrl();
  renderResults();

  requestAnimationFrame(() => {
    const movedRow = document.querySelector<HTMLElement>(
      `.list-entry-row[data-id="${CSS.escape(movedId)}"]`,
    );

    if (movedRow) {
      movedRow.classList.add("list-entry-moved");
      setTimeout(() => movedRow.classList.remove("list-entry-moved"), 700);
    }
  });
}

export function onStartRenameList(): void {
  const nameEl = document.getElementById("list-view-name");
  if (!nameEl) return;

  const current = state.listName || "Untitled list";
  const input = document.createElement("input");

  input.type = "text";
  input.value = current;
  input.className = "list-rename-input";
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  function commit(): void {
    const newName = input.value.trim() || "Untitled list";

    if (listNameExists(newName, state.listId)) {
      let errEl = input.nextElementSibling as HTMLElement | null;

      if (!errEl || !errEl.classList.contains("list-name-error")) {
        errEl = document.createElement("p");
        errEl.className = "list-name-error";
        input.after(errEl);
      }

      errEl.textContent = `A list named "${newName}" already exists.`;

      input.focus();

      return;
    }

    state.listName = newName;
    if (state.listId && state.listSynced) {
      saveList({
        id: state.listId,
        name: newName,
        description: state.listDescription,
        entries: state.listEntries,
      });
    }

    updateUrl();

    renderResults();
  }

  input.addEventListener("blur", commit);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();

    if (e.key === "Escape") {
      input.removeEventListener("blur", commit);
      renderResults();
    }
  });
}

export function onOpenList(id: string): void {
  const l = getList(id);
  if (!l) return;

  state.directId = null;
  state.listMode = true;
  state.listId = id;
  state.listName = l.name || "Untitled list";
  state.listDescription = l.description || "";
  state.listEntries = [...l.entries];
  state.listSynced = true;

  touchList(id);
  closeListPanelInternal();
  renderResults();
}

function onAddToExistingList(
  entryId: string,
  listId: string,
  btn: HTMLElement,
): void {
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
    const row = btn.closest<HTMLElement>(".list-modal-item-row");
    const countEl = row && row.querySelector<HTMLElement>(".list-item-count");

    if (alreadyIn) {
      if (row) row.style.animation = "list-row-flash-red 0.35s ease-in-out 2";
      if (countEl) countEl.textContent = `(${count}) - already in list`;
    } else {
      if (countEl) countEl.textContent = `(${count})`;
    }

    btn.textContent = alreadyIn ? "!" : "\u2713";
    (btn as HTMLButtonElement).disabled = true;

    setTimeout(() => {
      btn.textContent = "+";
      (btn as HTMLButtonElement).disabled = false;

      if (countEl) countEl.textContent = `(${count})`;
      if (row) row.style.animation = "";
    }, 1500);
  }
}

function onCreateAndAddToList(entryId: string, name: string): void {
  const resolvedName = name || "Untitled list";

  if (listNameExists(resolvedName)) {
    const errEl = document.getElementById("new-list-name-error");

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
    const newBtn = document.querySelector<HTMLButtonElement>(
      `.add-to-existing-list-btn[data-list-id="${id}"]`,
    );

    if (newBtn) {
      const row = newBtn.closest<HTMLElement>(".list-modal-item-row");

      if (row) row.style.animation = "list-row-flash 0.35s ease-in-out 2";

      newBtn.textContent = "\u2713";
      newBtn.disabled = true;

      setTimeout(() => {
        newBtn.textContent = "+";
        newBtn.disabled = false;

        if (row) row.style.animation = "";
      }, 1500);
    }
  });
}

function closeListPanelInternal(): void {
  const panel = document.getElementById("list-panel");

  if (panel) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  const overlay = document.getElementById("list-overlay");
  if (overlay) overlay.classList.remove("active");

  const toggle = document.getElementById("mobile-list-toggle");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}
