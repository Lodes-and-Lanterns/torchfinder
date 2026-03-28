// MONTH_PICKER: Custom month+year range picker.
// Exports pure (testable) utilities and createMonthPicker() factory.

import type {
  MonthPickerInstance,
  MonthPickerOptions,
  YearMonth,
} from "./types.ts";

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// UTILITIES
////////////

// Parse a YYYY-MM string into { year, month } (month is 0-indexed).
// Returns null if the string is invalid.
export function parseYearMonth(str: unknown): YearMonth | null {
  if (!str || typeof str !== "string") return null;

  const m = str.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;

  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;

  if (month < 0 || month > 11) return null;

  return { year, month };
}

// Format year + 0-indexed month into a YYYY-MM string.
export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// Format year + 0-indexed month into a human-readable string, e.g. "Jan 2024".
export function formatDisplay(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`;
}

// Return true if the cell at (year, month) should be disabled given the other
// picker's value and whether this is the start picker.
export function isMonthDisabled(
  year: number,
  month: number,
  otherValue: string | null | undefined,
  isStart: boolean,
): boolean {
  if (!otherValue) return false;

  const other = parseYearMonth(otherValue);
  if (!other) return false;

  const thisVal = formatYearMonth(year, month);
  const otherVal = formatYearMonth(other.year, other.month);

  return isStart ? thisVal > otherVal : thisVal < otherVal;
}

// CREATE_MONTH_PICKER
//////////////////////
// Attaches a custom month/year popover to an <input>.
//
// opts:
//   isStart       {boolean}   true = "from" picker (constrains upper bound)
//   getOtherValue {function}  returns the other picker's YYYY-MM string or null
//   onSelect      {function}  called with YYYY-MM string when a month is picked
//
// Returns an instance with setValue(str), clear(), and destroy().
// The instance is also stored on inputEl._monthPicker for external access.
export function createMonthPicker(
  inputEl: HTMLInputElement,
  { isStart, getOtherValue, onSelect }: MonthPickerOptions,
): MonthPickerInstance {
  let isOpen = false;
  let viewYear = new Date().getFullYear();
  let focusedIdx = 0; // 0-11 cell index

  let popoverEl: HTMLElement | null = null;
  let yearLabelEl: HTMLElement | null = null;
  let gridEl: HTMLElement | null = null;

  // INTERNAL UTILITIES
  /////////////////////

  function getStoredValue(): string | null {
    return inputEl.dataset.value || null;
  }

  function buildPopover(): void {
    popoverEl = document.createElement("div");
    popoverEl.className = "month-picker-popover";
    popoverEl.setAttribute("role", "dialog");
    popoverEl.setAttribute("aria-modal", "false");
    popoverEl.setAttribute(
      "aria-label",
      isStart ? "Select start month" : "Select end month",
    );
    popoverEl.hidden = true;

    // Year navigation row
    const yearNav = document.createElement("div");
    yearNav.className = "month-picker-year-nav";

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "month-picker-year-btn";
    prevBtn.setAttribute("aria-label", "Previous year");
    prevBtn.textContent = "\u25c0";
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      --viewYear;
      refreshGrid();
    });

    yearLabelEl = document.createElement("span");
    yearLabelEl.className = "month-picker-year-label";
    yearLabelEl.setAttribute("aria-live", "polite");
    yearLabelEl.setAttribute("aria-atomic", "true");

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "month-picker-year-btn";
    nextBtn.setAttribute("aria-label", "Next year");
    nextBtn.textContent = "\u25b6";
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      ++viewYear;
      refreshGrid();
    });

    yearNav.appendChild(prevBtn);
    yearNav.appendChild(yearLabelEl);
    yearNav.appendChild(nextBtn);

    // Month grid
    gridEl = document.createElement("div");
    gridEl.className = "month-picker-grid";
    gridEl.setAttribute("role", "grid");
    gridEl.setAttribute("aria-label", "Months");

    for (let i = 0; i < 12; ++i) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "month-picker-cell";
      cell.dataset.monthIdx = String(i);
      cell.setAttribute("role", "gridcell");
      cell.textContent = MONTH_NAMES[i];
      cell.tabIndex = -1;

      const idx = i; // closure
      cell.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!cell.disabled) selectMonth(idx);
      });

      gridEl.appendChild(cell);
    }

    popoverEl.appendChild(yearNav);
    popoverEl.appendChild(gridEl);
    popoverEl.addEventListener("keydown", onPopoverKeyDown);
    popoverEl.addEventListener("focusout", onPopoverFocusOut);

    document.body.appendChild(popoverEl);
  }

  function refreshGrid(): void {
    if (!popoverEl || !gridEl || !yearLabelEl) return;
    yearLabelEl.textContent = String(viewYear);

    const stored = parseYearMonth(getStoredValue());
    const otherVal = getOtherValue ? getOtherValue() : null;
    const cells = gridEl.querySelectorAll<HTMLButtonElement>(
      ".month-picker-cell",
    );

    cells.forEach((cell, i) => {
      const isSelected = stored && stored.year === viewYear &&
        stored.month === i;
      const disabled = isMonthDisabled(viewYear, i, otherVal, isStart);
      const isFocused = i === focusedIdx;

      cell.classList.toggle("selected", !!isSelected);
      cell.disabled = disabled;
      cell.setAttribute("aria-disabled", disabled ? "true" : "false");
      cell.setAttribute("aria-selected", isSelected ? "true" : "false");
      cell.tabIndex = isFocused ? 0 : -1;
    });
  }

  function moveFocus(idx: number): void {
    if (!gridEl) return;
    focusedIdx = ((idx % 12) + 12) % 12;

    const cells = gridEl.querySelectorAll<HTMLButtonElement>(
      ".month-picker-cell",
    );

    cells.forEach((cell, i) => {
      cell.tabIndex = i === focusedIdx ? 0 : -1;
    });

    if (cells[focusedIdx]) cells[focusedIdx].focus();
  }

  function selectMonth(monthIdx: number): void {
    const value = formatYearMonth(viewYear, monthIdx);

    inputEl.dataset.value = value;
    inputEl.value = formatDisplay(viewYear, monthIdx);

    close();
    onSelect(value);
  }

  function clearInput(): void {
    inputEl.dataset.value = "";
    inputEl.value = "";
  }

  function positionPopover(): void {
    if (!popoverEl) return;
    const rect = inputEl.getBoundingClientRect();

    popoverEl.style.top = (rect.bottom + 4) + "px";
    popoverEl.style.left = rect.left + "px";

    // Adjust for overflow
    requestAnimationFrame(() => {
      if (!popoverEl) return;
      const pRect = popoverEl.getBoundingClientRect();

      if (pRect.right > globalThis.innerWidth - 8) {
        popoverEl.style.left =
          Math.max(8, globalThis.innerWidth - pRect.width - 8) + "px";
      }
    });
  }

  // OPEN / CLOSE
  ///////////////

  function open(): void {
    if (!popoverEl) buildPopover();

    const stored = parseYearMonth(getStoredValue());

    viewYear = stored ? stored.year : new Date().getFullYear();
    focusedIdx = stored ? stored.month : 0;

    refreshGrid();
    positionPopover();

    popoverEl!.hidden = false;
    isOpen = true;

    inputEl.setAttribute("aria-expanded", "true");

    const cells = gridEl!.querySelectorAll<HTMLButtonElement>(
      ".month-picker-cell",
    );
    if (cells[focusedIdx]) cells[focusedIdx].focus();

    // Defer so the current click doesn't immediately close it
    setTimeout(() => {
      document.addEventListener("click", onOutsideClick, { capture: true });
    }, 0);
  }

  function close(): void {
    if (!isOpen || !popoverEl) return;

    popoverEl.hidden = true;
    isOpen = false;

    inputEl.setAttribute("aria-expanded", "false");

    document.removeEventListener("click", onOutsideClick, { capture: true });

    inputEl.focus();
  }

  // EVENT HANDLERS
  /////////////////

  function onPopoverFocusOut(e: FocusEvent): void { // Close when focus moves completely outside the popover (and not to the trigger input).
    const target = e.relatedTarget as Node | null;

    if (!target || (!popoverEl!.contains(target) && target !== inputEl)) {
      close();
    }
  }

  function onOutsideClick(e: MouseEvent): void {
    if (!popoverEl!.contains(e.target as Node) && e.target !== inputEl) {
      close();
    }
  }

  function onPopoverKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        moveFocus(focusedIdx + 1);
        break;

      case "ArrowLeft":
        e.preventDefault();
        moveFocus(focusedIdx - 1);
        break;

      case "ArrowDown":
        e.preventDefault();
        moveFocus(focusedIdx + 3);
        break;

      case "ArrowUp":
        e.preventDefault();
        moveFocus(focusedIdx - 3);
        break;

      case "Enter":
      case " ": {
        e.preventDefault();

        const cells = gridEl!.querySelectorAll<HTMLButtonElement>(
          ".month-picker-cell",
        );

        if (cells[focusedIdx] && !cells[focusedIdx].disabled) {
          selectMonth(focusedIdx);
        }

        break;
      }

      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
    }
  }

  // WIRE INPUT
  /////////////

  inputEl.setAttribute("aria-expanded", "false");
  inputEl.setAttribute("aria-haspopup", "dialog");

  inputEl.addEventListener("click", () => {
    if (isOpen) close();
    else open();
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen) close();
      else open();
    } else if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  });

  // PUBLIC API
  /////////////

  const instance: MonthPickerInstance = {
    setValue(str: string | null) {
      const parsed = parseYearMonth(str);

      if (parsed) {
        inputEl.dataset.value = str!;
        inputEl.value = formatDisplay(parsed.year, parsed.month);
      } else {
        clearInput();
      }

      if (isOpen) refreshGrid();
    },
    clear() {
      clearInput();
      if (isOpen) refreshGrid();
    },
    destroy() {
      document.removeEventListener("click", onOutsideClick, { capture: true });

      if (popoverEl) {
        popoverEl.remove();
        popoverEl = null;
      }
    },
  };

  (inputEl as HTMLInputElement & { _monthPicker: MonthPickerInstance })
    ._monthPicker = instance;

  return instance;
}
