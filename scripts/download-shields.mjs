// scripts/download-shields.mjs
// Downloads coat of arms (kommunevåpen) for all Norwegian municipalities
// from Wikidata → Wikimedia Commons.
//
// Usage:
//   node scripts/download-shields.mjs              # download all
//   node scripts/download-shields.mjs --start 1133 # resume from kommunenummer 1133
//
// Output: public/shields/{kommunenummer}.png

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import path from "path";

const OUTPUT_DIR = "public/shields";
const THUMB_WIDTH = 120;
const DELAY_MS = 1500;         // delay between downloads
const RETRY_DELAY_MS = 10000; // wait on 429 before retrying
const MAX_RETRIES = 3;

// Parse --start argument
const startArg = process.argv.find((_, i, arr) => arr[i - 1] === "--start");
const START_FROM = startArg ?? null;

if (START_FROM) {
  console.log(`Resuming from kommunenummer >= ${START_FROM}\n`);
}

const SPARQL = `
SELECT ?item ?kommunenummer ?image WHERE {
  ?item wdt:P31 wd:Q755707 .
  ?item wdt:P2504 ?kommunenummer .
  ?item wdt:P94 ?image .
}
ORDER BY ?kommunenummer
`;

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

async function querySparql() {
  console.log("Querying Wikidata SPARQL...");
  const url = `${WIKIDATA_ENDPOINT}?format=json&query=${encodeURIComponent(SPARQL)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "KommuneQuiz/1.0 (educational project)" },
  });
  if (!res.ok) throw new Error(`SPARQL query failed: ${res.status}`);
  const data = await res.json();
  return data.results.bindings;
}

function getThumbUrl(commonsUrl, width) {
  return `${commonsUrl}?width=${width}`;
}

function getFilename(commonsUrl) {
  const parts = commonsUrl.split("/");
  return decodeURIComponent(parts[parts.length - 1]);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadImage(url, filepath) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "KommuneQuiz/1.0 (educational project)" },
    });

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(filepath, buffer);
      return true;
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS;
      console.warn(`  ⚠ 429 rate limited, waiting ${Math.ceil(waitMs / 1000)}s (attempt ${attempt}/${MAX_RETRIES})...`);
      await sleep(waitMs);
      continue;
    }

    console.warn(`  ⚠ Failed: ${res.status} ${url}`);
    return false;
  }

  console.warn(`  ⚠ Gave up after ${MAX_RETRIES} retries`);
  return false;
}

async function main() {
  const results = await querySparql();
  console.log(`Found ${results.length} municipalities with coat of arms.`);

  // Filter to only those >= START_FROM
  const filtered = START_FROM
    ? results.filter((r) => r.kommunenummer.value >= START_FROM)
    : results;

  console.log(`Will process ${filtered.length} shields.\n`);

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load existing manifest if resuming
  const manifestPath = `${OUTPUT_DIR}/manifest.json`;
  let mapping = {};
  if (existsSync(manifestPath)) {
    try {
      mapping = JSON.parse(readFileSync(manifestPath, "utf-8"));
      console.log(`Loaded existing manifest with ${Object.keys(mapping).length} entries.\n`);
    } catch {
      // ignore parse errors, start fresh mapping
    }
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < filtered.length; i++) {
    const row = filtered[i];
    const kommunenummer = row.kommunenummer.value;
    const imageUrl = row.image.value;
    const filename = getFilename(imageUrl);

    const thumbUrl = getThumbUrl(imageUrl, THUMB_WIDTH);
    const outPath = `${OUTPUT_DIR}/${kommunenummer}.png`;

    // Skip if file already exists on disk
    if (existsSync(outPath)) {
      mapping[kommunenummer] = true;
      skipped++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${filtered.length}] ${kommunenummer} (${filename})... `);

    const ok = await downloadImage(thumbUrl, outPath);
    if (ok) {
      downloaded++;
      mapping[kommunenummer] = true;
      console.log("✓");
    } else {
      failed++;
      console.log("✗");
    }

    // Save manifest periodically so progress isn't lost on crash
    if (downloaded % 10 === 0) {
      writeFileSync(manifestPath, JSON.stringify(mapping, null, 2));
    }

    await sleep(DELAY_MS);
  }

  // Final manifest save
  writeFileSync(manifestPath, JSON.stringify(mapping, null, 2));

  console.log(`\nDone! Downloaded ${downloaded}, skipped ${skipped} (already exist), failed ${failed}.`);
  console.log(`Manifest: ${Object.keys(mapping).length} total entries saved to ${manifestPath}`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
