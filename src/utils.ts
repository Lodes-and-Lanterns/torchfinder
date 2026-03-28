export function debounce(
  fn: (...args: unknown[]) => void,
  ms: number,
): (...args: unknown[]) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return function (...args: unknown[]) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function escapeHtml(str: string | null | undefined): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function slugToLabel(slug: string | null | undefined): string {
  if (!slug) return "";

  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
  ja: "Japanese",
  it: "Italian",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  pl: "Polish",
  ko: "Korean",
  zh: "Chinese",
  ca: "Catalan",
  ru: "Russian",
};

export function langName(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

export function formatLevelRange(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min === max) return `Level ${min}`;
  if (min == null) return `Up to level ${max}`;
  if (max == null) return `Level ${min}+`;

  return `Levels ${min}\u2013${max}`;
}

export function formatPartySize(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min === max) return `${min} players`;
  if (min == null) return `Up to ${max} players`;
  if (max == null) return `${min}+ players`;

  return `${min}\u2013${max} players`;
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const parts = dateStr.split("-");
  if (parts.length === 1) return parts[0];

  return `${parseInt(parts[1], 10)}/${parts[0]}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const parts = dateStr.split("-");

  if (parts.length === 1) return parts[0];

  if (parts.length === 2) {
    const d = new Date(`${dateStr}-01T00:00:00Z`);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }

  const d = new Date(`${dateStr}T00:00:00Z`);

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function isUpcoming(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;

  const parts = dateStr.split("-");

  const full = parts.length === 1
    ? `${parts[0]}-01-01T00:00:00Z`
    : parts.length === 2
    ? `${parts[0]}-${parts[1]}-01T00:00:00Z`
    : `${dateStr}T00:00:00Z`;

  return new Date(full) > new Date();
}
