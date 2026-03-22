/**
 * Torchfinder build script (Deno)
 *
 * Steps:
 *   1. Fetch torchfinder-dataset.json from torchfinder-data.
 *   2. Generate feed.xml (RSS 2.0) from the data.
 *   3. Cache-bust app.js and style.css (SHA-256, first 8 hex chars).
 *   4. Assemble the staging/ deploy payload.
 *
 * Exit code is nonzero on any failure; a bad build never writes partial output.
 */

const DATA_URL = "https://github.com/Lodes-and-Lanterns/torchfinder-data/releases/latest/download/torchfinder-dataset.jsonl";
const SITE_URL = "https://torchfinder.lodesandlanterns.com";
const FEED_ITEM_LIMIT = 50;

// UTILITIES
////////////

function xmlEscape(str: string): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function sha256hex(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// RSS FEED
///////////

interface Adventure {
  id: string;
  title?: string;
  desc?: string;
  authors?: string[];
  categories?: string[];
  date?: string;
  links?: { title: string; url: string; language: string; type?: string }[];
  [key: string]: unknown;
}

function generateFeed(adventures: Adventure[]): string {
  const sorted = [...adventures]
    .filter((a) => a.date)
    .sort((a, b) =>
      (b.date ?? "").localeCompare(a.date ?? "")
    )
    .slice(0, FEED_ITEM_LIMIT);

  const buildDate = new Date().toUTCString();

  const items = sorted.map((entry) => {
    const description =
      entry.desc ??
      [(entry.categories ?? []).join(", "), (entry.authors ?? []).join(", ")]
        .filter(Boolean)
        .join(" by ");

    const authorStr = (entry.authors ?? []).join(", ");
    const link = `${SITE_URL}/?id=${encodeURIComponent(entry.id)}`;
    const pubDate = entry.date
      ? new Date(entry.date + "T00:00:00Z").toUTCString()
      : "";

    return `    <item>
      <title>${xmlEscape(entry.title ?? "")}</title>
      <description>${xmlEscape(description)}</description>
      <author>${xmlEscape(authorStr)}</author>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Torchfinder</title>
    <description>Find official and third-party Shadowdark content, including adventures, supplements, and zines.</description>
    <link>${SITE_URL}</link>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/dist/feed.xml" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
${items.join("\n")}
  </channel>
</rss>
`;
}

// Rewrites relative JS import paths to include a cache-busting version hash.
// Matches: from './foo.js' or from '../foo.js', single-quoted, no existing ?v=
function versionImports(source: string, hash: string): string {
  return source.replace(/from '(\.[^'?]+\.js)'/g, `from '$1?v=${hash}'`);
}

// MAIN
///////

console.log("Torchfinder build starting...");

// Step 1: Fetch torchfinder-dataset.jsonl
console.log(`Fetching ${DATA_URL}`);
const dataResponse = await fetch(DATA_URL);
if (!dataResponse.ok) {
  console.error(`Failed to fetch torchfinder-dataset.jsonl: HTTP ${dataResponse.status}`);
  Deno.exit(1);
}
const datasetJsonl = await dataResponse.text();
const adventures: Adventure[] = datasetJsonl
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));
console.log(`Fetched ${adventures.length} entries.`);

// Step 1b: Fetch data release date from GitHub API (best-effort; failure is non-fatal)
let dataReleaseDate: string | null = null;
try {
  const releaseResp = await fetch(
    "https://api.github.com/repos/Lodes-and-Lanterns/torchfinder-data/releases/latest",
    { headers: { "Accept": "application/vnd.github+json" } },
  );
  if (releaseResp.ok) {
    const release = await releaseResp.json();
    dataReleaseDate = typeof release.published_at === "string"
      ? release.published_at.slice(0, 10)
      : null;
    console.log(`Data release date: ${dataReleaseDate ?? "unavailable"}`);
  } else {
    console.warn(`GitHub API returned HTTP ${releaseResp.status}; skipping data date.`);
  }
} catch (err) {
  console.warn(`Could not fetch data release date: ${err}; skipping.`);
}

// Step 2: Generate RSS feed
console.log("Generating RSS feed...");
const feedXml = generateFeed(adventures);

// Step 3: Cache-bust assets
console.log("Computing asset hashes...");

// Hash the dataset so its URL is versioned independently of JS/CSS
const dataHash = (await sha256hex(datasetJsonl)).slice(0, 8);
console.log(`dataset hash: ${dataHash}`);

// Hash app.js + all scripts/*.js together so any module change busts the cache
const appJs = await Deno.readTextFile("app.js");
const scriptFiles: string[] = [];
for await (const entry of Deno.readDir("scripts")) {
  if (entry.isFile && entry.name.endsWith(".js")) {
    scriptFiles.push(entry.name);
  }
}
scriptFiles.sort();
const scriptContents = await Promise.all(
  scriptFiles.map((f) => Deno.readTextFile(`scripts/${f}`)),
);
const workerJs = await Deno.readTextFile("worker.js");
const allJsContent = [appJs, workerJs, ...scriptContents].join("\n");
const appHash = (await sha256hex(allJsContent + dataHash)).slice(0, 8);

// Hash all styles/*.css + common-web/*.css combined
const styleFiles: string[] = [];
for await (const entry of Deno.readDir("styles")) {
  if (entry.isFile && entry.name.endsWith(".css")) styleFiles.push(entry.name);
}
styleFiles.sort();
const styleContents = await Promise.all(styleFiles.map((f) => Deno.readTextFile(`styles/${f}`)));
const commonWebFiles: string[] = [];
for await (const entry of Deno.readDir("common-web")) {
  if (entry.isFile && entry.name.endsWith(".css")) commonWebFiles.push(entry.name);
}
commonWebFiles.sort();
const commonWebContents = await Promise.all(commonWebFiles.map((f) => Deno.readTextFile(`common-web/${f}`)));
const styleHash = (await sha256hex([...commonWebContents, ...styleContents].join("\n"))).slice(0, 8);
console.log(`app.js hash: ${appHash}, styles/ hash: ${styleHash}`);

let indexHtml = await Deno.readTextFile("index.html");
// Replace href/src references; match quoted filenames without a ?v= already present
// Note: script tag uses type="module" so the pattern allows any attributes before src
indexHtml = indexHtml.replace(
  /(<script\b[^>]*\bsrc=")app\.js(")/g,
  `$1app.js?v=${appHash}$2`,
);
indexHtml = indexHtml.replace(
  /(<link\b[^>]*\bhref=")styles\/([^"?]+\.css)(")/g,
  `$1styles/$2?v=${styleHash}$3`,
);
indexHtml = indexHtml.replace(
  /(<link\b[^>]*\bhref=")common-web\/([^"?]+\.css)(")/g,
  `$1common-web/$2?v=${styleHash}$3`,
);
const appDate = new Date().toISOString().slice(0, 10);
const appLink = `<a href="https://github.com/Lodes-and-Lanterns/torchfinder" target="_blank" rel="noopener">app</a>`;
const dataLink = `<a href="https://github.com/Lodes-and-Lanterns/torchfinder-data" target="_blank" rel="noopener">data</a>`;
const timestampText = dataReleaseDate
  ? `Last updated ${appLink} on ${appDate}, ${dataLink} on ${dataReleaseDate}`
  : `Last updated ${appLink} on ${appDate}`;
indexHtml = indexHtml.replace(
  /<p id="footer-timestamps"><\/p>/,
  `<p id="footer-timestamps">${timestampText}</p>`,
);

// Step 4: Assemble staging/
console.log("Assembling staging/ directory...");
await Deno.mkdir("staging/dist", { recursive: true });
await Deno.mkdir("staging/scripts", { recursive: true });

await Deno.writeTextFile("staging/index.html", indexHtml);
let appJsOut = appJs;
appJsOut = appJsOut.replace(
  /new Worker\('worker\.js',\s*\{\s*type:\s*'module'\s*\}\)/g,
  `new Worker('worker.js?v=${appHash}', { type: 'module' })`,
);
appJsOut = versionImports(appJsOut, appHash);
await Deno.writeTextFile("staging/app.js", appJsOut);
const workerJsOut = versionImports(await Deno.readTextFile("worker.js"), appHash);
await Deno.writeTextFile("staging/worker.js", workerJsOut);
// Copy styles/ to staging/styles/
await Deno.mkdir("staging/styles", { recursive: true });
for (const name of styleFiles) {
  let src = await Deno.readTextFile(`styles/${name}`);
  // Version the common-web @import so tokens.css cache busts with style hash
  src = src.replace(
    /@import '(\.\.\/common-web\/[^'?]+\.css)'/g,
    `@import '$1?v=${styleHash}'`,
  );
  await Deno.writeTextFile(`staging/styles/${name}`, src);
}

// Copy common-web/ to staging/common-web/
await Deno.mkdir("staging/common-web", { recursive: true });
for (const name of commonWebFiles) {
  await Deno.copyFile(`common-web/${name}`, `staging/common-web/${name}`);
}
await Deno.copyFile("common-web/theme.js", "staging/common-web/theme.js");
await Deno.copyFile("common-web/favicon.png", "staging/common-web/favicon.png");
await Deno.copyFile("common-web/apple-touch-icon.png", "staging/common-web/apple-touch-icon.png");
console.log("Copied common-web assets.");

// Write scripts/ modules: version all relative imports + inject data hash into state.js
for (const name of scriptFiles) {
  let src = await Deno.readTextFile(`scripts/${name}`);
  if (name === "state.js") {
    src = src.replace(
      /export const DATA_URL = '(dist\/torchfinder-dataset\.jsonl)';/,
      `export const DATA_URL = '$1?v=${dataHash}';`,
    );
  }
  await Deno.writeTextFile(`staging/scripts/${name}`, versionImports(src, appHash));
}
console.log(`Copied ${scriptFiles.length} script modules.`);
await Deno.writeTextFile("staging/dist/torchfinder-dataset.jsonl", datasetJsonl);
await Deno.writeTextFile("staging/dist/feed.xml", feedXml);

// Copy dependencies/
await Deno.mkdir("staging/dependencies", { recursive: true });
for await (const entry of Deno.readDir("dependencies")) {
  if (entry.isFile) {
    await Deno.copyFile(`dependencies/${entry.name}`, `staging/dependencies/${entry.name}`);
  }
}
console.log("Copied dependencies/.");

// Copy robots.txt
await Deno.copyFile("robots.txt", "staging/robots.txt");
console.log("Copied robots.txt.");

// Copy CNAME if present
try {
  await Deno.copyFile("CNAME", "staging/CNAME");
  console.log("Copied CNAME.");
} catch {
  // No CNAME file; that's fine
}

console.log("Build complete. Output in staging/");
