/**
 * Torchfinder build script (Deno)
 *
 * Steps:
 *   0. Bundle src/app.ts + src/worker.ts -> staging/js/ via esbuild.
 *   1. Fetch torchfinder-dataset.jsonl from torchfinder-data.
 *   2. Generate feed.xml (RSS 2.0) from the data.
 *   3. Cache-bust assets (SHA-256, first 8 hex chars).
 *   4. Assemble the staging/ deploy payload.
 *
 * Exit code is nonzero on any failure; a bad build never writes partial output.
 */

import * as esbuild from "esbuild";
import { denoPlugins } from "@luca/esbuild-deno-loader";

const DATA_RELEASE_URL =
  "https://github.com/Lodes-and-Lanterns/torchfinder-data/releases/latest/download/torchfinder-dataset.jsonl";

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

async function sha256hex(content: string | Uint8Array): Promise<string> {
  const data = typeof content === "string"
    ? new TextEncoder().encode(content)
    : content;

  const buf = await crypto.subtle.digest("SHA-256", data as BufferSource);

  return Array.from(new Uint8Array(buf)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function readDir(dir: string, ext: string): Promise<string[]> {
  const names: string[] = [];

  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(ext)) names.push(entry.name);
  }

  return names.sort();
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
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, FEED_ITEM_LIMIT);

  const buildDate = new Date().toUTCString();

  const items = sorted.map((entry) => {
    const description = entry.desc ??
      [(entry.categories ?? []).join(", "), (entry.authors ?? []).join(", ")]
        .filter(Boolean)
        .join(" by ");

    const authorStr = (entry.authors ?? []).join(", ");
    const link = `${SITE_URL}/?id=${encodeURIComponent(entry.id)}`;
    const pubDate = entry.date
      ? new Date(entry.date + "T00:00:00Z").toUTCString()
      : "";

    return `    <item>
      <title>${xmlEscape(entry.title ?? "")} -- Lodes &amp; Lanterns</title>
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
    <title>Torchfinder -- Lodes &amp; Lanterns</title>
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

// MAIN
///////

console.log("Torchfinder build starting...");

// STEP 0: BUNDLE
/////////////////

console.log("Bundling src/app.ts + src/worker.ts -> staging/js/...");

await Deno.mkdir("staging/js", { recursive: true });

await esbuild.build({
  entryPoints: ["src/app.ts", "src/worker.ts"],
  bundle: true,
  plugins: [...denoPlugins()],
  outdir: "staging/js",
  format: "esm",
  platform: "browser",
  target: "es2022",
  sourcemap: false,
  minify: false,
});

await esbuild.stop();

console.log("Bundle complete.");

// STEP 1: FETCH DATASET
////////////////////////

console.log(`Fetching ${DATA_RELEASE_URL}`);

const dataResponse = await fetch(DATA_RELEASE_URL);
if (!dataResponse.ok) {
  console.error(
    `Failed to fetch torchfinder-dataset.jsonl: HTTP ${dataResponse.status}`,
  );
  Deno.exit(1);
}

const datasetJsonl = await dataResponse.text();

const adventures: Adventure[] = datasetJsonl
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));

console.log(`Fetched ${adventures.length} entries.`);

// STEP 1(b): FETCH DATASET RELEASE DATE
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
    console.warn(
      `GitHub API returned HTTP ${releaseResp.status}; skipping data date.`,
    );
  }
} catch (err) {
  console.warn(`Could not fetch data release date: ${err}; skipping.`);
}

// STEP 2: GENERATE RSS FEED
////////////////////////////

console.log("Generating RSS feed...");
const feedXml = generateFeed(adventures);

// STEP 3: COMPUTE ASSET HASHES
///////////////////////////////

console.log("Computing asset hashes...");

// Hash the dataset so its URL is versioned independently of JS/CSS
const dataHash = (await sha256hex(datasetJsonl)).slice(0, 8);
console.log(`dataset hash: ${dataHash}`);

// Hash bundle outputs combined with dataHash
const jsFiles = await readDir("staging/js", ".js");
const jsContents = await Promise.all(
  jsFiles.map((f) => Deno.readTextFile(`staging/js/${f}`)),
);
const appHash = (await sha256hex(jsContents.join("\n") + dataHash)).slice(
  0,
  8,
);
console.log(`staging/js/ hash: ${appHash}`);

// Post-process bundle: inject versioned dataset URL and worker URL
let appJs = await Deno.readTextFile("staging/js/app.js");

appJs = appJs.replace(
  /"\/dist\/torchfinder-dataset\.jsonl"/g,
  `"/dist/torchfinder-dataset.jsonl?v=${dataHash}"`,
);

appJs = appJs.replace(
  /new URL\("worker\.js",\s*import\.meta\.url\)/g,
  `new URL("worker.js?v=${appHash}", import.meta.url)`,
);

await Deno.writeTextFile("staging/js/app.js", appJs);

// Hash CSS
const styleFiles = await readDir("styles", ".css");
const styleContents = await Promise.all(
  styleFiles.map((f) => Deno.readTextFile(`styles/${f}`)),
);

const commonWebCssFiles = await readDir("common-web", ".css");
const commonWebCssContents = await Promise.all(
  commonWebCssFiles.map((f) => Deno.readTextFile(`common-web/${f}`)),
);

const styleHash = (await sha256hex(
  [...commonWebCssContents, ...styleContents].join("\n"),
)).slice(0, 8);

console.log(`styles/ hash: ${styleHash}`);

// Rewrite index.html
let indexHtml = await Deno.readTextFile("index.html");

indexHtml = indexHtml.replace(
  /(<script\b[^>]*\bsrc=")js\/([^"?]+\.js)(")/g,
  `$1js/$2?v=${appHash}$3`,
);

indexHtml = indexHtml.replace(
  /(<link\b[^>]*\bhref=")styles\/([^"?]+\.css)(")/g,
  `$1styles/$2?v=${styleHash}$3`,
);

indexHtml = indexHtml.replace(
  /(<link\b[^>]*\bhref=")common-web\/([^"?]+\.css)(")/g,
  `$1common-web/$2?v=${styleHash}$3`,
);

let appDate = new Date().toISOString().slice(0, 10);
try {
  const appCommitResp = await fetch(
    "https://api.github.com/repos/Lodes-and-Lanterns/torchfinder/commits/main",
    { headers: { "Accept": "application/vnd.github+json" } },
  );

  if (appCommitResp.ok) {
    const appCommit = await appCommitResp.json();
    const commitDate = appCommit?.commit?.committer?.date;

    if (typeof commitDate === "string") {
      appDate = commitDate.slice(0, 10);
      console.log(`App commit date: ${appDate}`);
    } else {
      console.warn("App commit date unavailable; using build date.");
    }
  } else {
    console.warn(
      `GitHub API returned HTTP ${appCommitResp.status}; using build date for app.`,
    );
  }
} catch (err) {
  console.warn(`Could not fetch app commit date: ${err}; using build date.`);
}

const appLink =
  `<a href="https://github.com/Lodes-and-Lanterns/torchfinder" target="_blank" rel="noopener">app</a>`;

const dataLink =
  `<a href="https://github.com/Lodes-and-Lanterns/torchfinder-data" target="_blank" rel="noopener">data</a>`;

const timestampText = dataReleaseDate
  ? `Last updated ${appLink} on ${appDate}, ${dataLink} on ${dataReleaseDate}`
  : `Last updated ${appLink} on ${appDate}`;

indexHtml = indexHtml.replace(
  /<p id="footer-timestamps"><\/p>/,
  `<p id="footer-timestamps">${timestampText}</p>`,
);

// STEP 4: ASSEMBLE staging/
////////////////////////////

console.log("Assembling staging/ directory...");

await Deno.writeTextFile("staging/index.html", indexHtml);

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

console.log(`Copied ${styleFiles.length} CSS files.`);

// Copy common-web/ to staging/common-web/
await Deno.mkdir("staging/common-web", { recursive: true });
for (const name of commonWebCssFiles) {
  await Deno.copyFile(`common-web/${name}`, `staging/common-web/${name}`);
}

for (const name of ["theme.js", "favicon.png", "apple-touch-icon.png"]) {
  try {
    await Deno.copyFile(`common-web/${name}`, `staging/common-web/${name}`);
  } catch {
    console.warn(`common-web/${name} not found, skipping.`);
  }
}

console.log("Copied common-web assets.");

// Write dataset and feed to staging/dist/
await Deno.mkdir("staging/dist", { recursive: true });
await Deno.writeTextFile(
  "staging/dist/torchfinder-dataset.jsonl",
  datasetJsonl,
);
await Deno.writeTextFile("staging/dist/feed.xml", feedXml);

console.log("Wrote dataset and feed.");

// Copy robots.txt
try {
  await Deno.copyFile("robots.txt", "staging/robots.txt");
  console.log("Copied robots.txt.");
} catch { /* optional */ }

// Copy CNAME if present
try {
  await Deno.copyFile("CNAME", "staging/CNAME");
  console.log("Copied CNAME.");
} catch { /* optional */ }

console.log("Build complete. Output in staging/");
