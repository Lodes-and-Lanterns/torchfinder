import { state } from "./state.ts";
import { getCoverConsent } from "./consent.ts";
import { getLists } from "./lists.ts";
import type { Entry } from "./types.ts";
import {
  escapeHtml,
  formatDate,
  formatDateShort,
  formatLevelRange,
  formatPartySize,
  isUpcoming,
  langName,
} from "./utils.ts";

// CARD UTILITIES
/////////////////

export function renderCardHtml(entry: Entry, expanded: boolean): string {
  const levelStr = formatLevelRange(entry.lmin, entry.lmax);
  const partyStr = formatPartySize(entry.pmin, entry.pmax);
  const upcoming = isUpcoming(entry.date);
  const authorStr = (entry.authors || []).join(", ");

  const tags: string[] = [];

  for (const cat of entry.categories || []) {
    tags.push(`<span class="card-tag">${escapeHtml(cat)}</span>`);
  }

  if ((entry.pricings || []).includes("free")) {
    tags.push(`<span class="card-tag card-tag-free">Free</span>`);
  }

  if ((entry.pricings || []).includes("pwyw")) {
    tags.push(
      `<span class="card-tag card-tag-pwyw" data-tip="Pay What You Want" tabindex="0">PWYW</span>`,
    );
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

  const coverHtml = entry.cover && getCoverConsent() === "granted"
    ? `<div class="card-cover-wrap"><img class="card-cover" src="${
      escapeHtml(entry.cover)
    }" alt="" loading="lazy" onerror="this.closest('.card-cover-wrap').remove()"></div>`
    : "";

  return `
<article class="result-card${expanded ? " expanded" : ""}" data-id="${
    escapeHtml(entry.id)
  }" aria-expanded="${expanded}">
  <div class="card-header" role="button" tabindex="0" aria-label="${
    escapeHtml(entry.title)
  }, ${expanded ? "collapse" : "expand"}">
    ${coverHtml}
    <div class="card-header-main">
      <h3 class="card-title">${
    state.directId === entry.id
      ? `<span class="card-title-link">${escapeHtml(entry.title)}</span>`
      : `<a class="card-title-link" href="?id=${
        encodeURIComponent(entry.id)
      }">${escapeHtml(entry.title)}</a>`
  }${
    entry.date
      ? `<span class="card-title-date"> (${
        escapeHtml(formatDateShort(entry.date))
      })</span>`
      : ""
  }<button type="button" class="add-to-list-btn outline secondary" data-id="${
    escapeHtml(entry.id)
  }" aria-label="Add ${
    escapeHtml(entry.title)
  } to a list">+ List</button><button type="button" class="copy-entry-link-btn outline secondary" data-id="${
    escapeHtml(entry.id)
  }" aria-label="Copy link to ${
    escapeHtml(entry.title)
  }">Copy link</button></h3>
      ${
    authorStr ? `<div class="card-byline">${escapeHtml(authorStr)}</div>` : ""
  }
      ${
    entry.desc
      ? `<div class="card-description-snippet">${escapeHtml(entry.desc)}</div>`
      : ""
  }
    </div>
    <div class="card-tags">${tags.join("")}</div>
    <span class="card-expand-icon" aria-hidden="true">\u25b6</span>
  </div>
  ${buildExpandedHtml(entry, upcoming)}
</article>`;
}

export function buildExpandedHtml(entry: Entry, upcoming: boolean): string {
  const issueId = encodeURIComponent(entry.id);
  const updateUrl =
    `https://github.com/Lodes-and-Lanterns/torchfinder-data/issues/new?template=update-entry.yml&title=Update+entry%3A+${issueId}&labels=update-entry`;
  const removeUrl =
    `https://github.com/Lodes-and-Lanterns/torchfinder-data/issues/new?template=remove-entry.yml&title=Remove+entry%3A+${issueId}&labels=remove-entry`;

  const rows: string[] = [];

  if (entry.pub) rows.push(row("Publisher", entry.pub));

  const sys = (entry.systems || []).join(", ");
  if (sys) rows.push(row("System", sys));

  const set = (entry.settings || []).join(", ");
  if (set) rows.push(row("Setting", set));

  const env = (entry.envs || []).join(", ");
  if (env) rows.push(row("Environment", env));

  const thm = (entry.themes || []).join(", ");
  if (thm) rows.push(row("Themes", thm));

  const levelStr = formatLevelRange(entry.lmin, entry.lmax);
  if (levelStr) rows.push(row("Level range", levelStr));

  const partyStr = formatPartySize(entry.pmin, entry.pmax);
  if (partyStr) rows.push(row("Party size", partyStr));

  const cls = (entry.character_options || []).join(", ");
  if (cls) rows.push(row("Character Options", cls));

  if (entry.pages != null) rows.push(row("Pages", String(entry.pages)));

  if (entry.date) {
    const dateLabel = formatDate(entry.date) +
      (upcoming ? ' <span class="badge upcoming">Upcoming</span>' : "");
    rows.push(`<tr><th scope="row">Published</th><td>${dateLabel}</td></tr>`);
  }

  const LINK_TYPE_LABELS: Record<string, string> = {
    ebook: "eBook",
    "ebook-and-print": "eBook & Print",
    print: "Print",
    vtt: "VTT",
    web: "Web",
  };

  const LINK_PRICING_LABELS: Record<string, string> = {
    free: "Free",
    paid: "Paid",
    pwyw: "PWYW",
  };

  const crowdfundingPlatforms = new Set(["kickstarter", "backerkit"]);

  const linksHtml = (entry.links || [])
    .map((link) => {
      const typeLabel = link.type && LINK_TYPE_LABELS[link.type]
        ? ` <span class="link-type-desc">${LINK_TYPE_LABELS[link.type]}</span>`
        : "";

      const pricingLabel = link.pricing && LINK_PRICING_LABELS[link.pricing]
        ? ` <span class="link-pricing-badge">${
          LINK_PRICING_LABELS[link.pricing]
        }</span>`
        : "";

      const langLabel = link.language && link.language !== "en"
        ? ` <span class="lang-badge">${
          escapeHtml(langName(link.language))
        }</span>`
        : "";

      const isCrowdfunding = crowdfundingPlatforms.has(
        link.title.toLowerCase().replace(/\s+/g, ""),
      );

      const campaignEndedLabel = isCrowdfunding && entry.date && !upcoming
        ? ` <span class="badge campaign-ended">Campaign Ended</span>`
        : "";

      return `<li><a href="${
        escapeHtml(link.url)
      }" target="_blank" rel="noopener">${
        escapeHtml(link.title)
      }</a>${typeLabel}${pricingLabel}${langLabel}${campaignEndedLabel}</li>`;
    }).join("");

  let parentHtml = "";

  if (entry.included_in && entry.included_in.length > 0) {
    const items = entry.included_in
      .map((pid) => {
        const parent = state.data ? state.data.find((e) => e.id === pid) : null;
        const label = parent ? parent.title : pid;
        return `<li><a href="?id=${encodeURIComponent(pid)}">${
          escapeHtml(label)
        }</a></li>`;
      }).join("");

    parentHtml =
      `<div class="card-section"><h4>Included in</h4><ul>${items}</ul></div>`;
  }

  let childrenHtml = "";

  if (entry.children && entry.children.length > 0) {
    const items = entry.children
      .map((cid) => {
        const child = state.data ? state.data.find((e) => e.id === cid) : null;
        const label = child ? child.title : cid;
        return `<li><a href="?id=${encodeURIComponent(cid)}">${
          escapeHtml(label)
        }</a></li>`;
      }).join("");

    childrenHtml =
      `<div class="card-section"><h4>Includes</h4><ul>${items}</ul></div>`;
  }

  const containingLists = getLists().filter((l) =>
    (l.entries || []).includes(entry.id)
  );

  const listsHtml = containingLists.length
    ? `<div class="card-section"><h4>Lists</h4><ul>${
      containingLists
        .map((l) =>
          `<li><a href="#" class="card-list-link" data-list-id="${
            escapeHtml(l.id)
          }">${escapeHtml(l.name || "Untitled list")}</a></li>`
        )
        .join("")
    }</ul></div>`
    : "";

  return `
<div class="card-expanded">
  ${
    entry.desc
      ? `<p class="card-expanded-desc">${escapeHtml(entry.desc)}</p>`
      : ""
  }
  ${
    rows.length
      ? `<table class="card-meta-table"><tbody>${rows.join("")}</tbody></table>`
      : ""
  }
  ${parentHtml}
  ${childrenHtml}
  ${
    linksHtml
      ? `<div class="card-section"><h4>Links</h4><ul class="card-links">${linksHtml}</ul></div>`
      : ""
  }
  ${listsHtml}
  <div class="card-footer-actions">
    <a href="${
    escapeHtml(updateUrl)
  }" target="_blank" rel="noopener" class="report-issue-link update-entry">Update or correct this entry</a>
    <a href="${
    escapeHtml(removeUrl)
  }" target="_blank" rel="noopener" class="report-issue-link remove-entry">Request removal of this entry</a>
    <button type="button" class="copy-entry-id-btn outline" data-id="${
    escapeHtml(entry.id)
  }">Copy ID</button>
  </div>
</div>`;
}

export function row(label: string, value: string): string {
  return `<tr><th scope="row">${escapeHtml(label)}</th><td>${
    escapeHtml(value)
  }</td></tr>`;
}
