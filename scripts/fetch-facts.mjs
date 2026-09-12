// scripts/fetch-facts.mjs
// Fetches per-kommune facts from Wikidata, Wikipedia (no.wikipedia.org) and
// Store norske leksikon (snl.no) and writes them to data/facts.json.
//
// Facts fetched:
//   - innbyggertall + år      (Wikidata P1082, latest point-in-time)
//   - arealKm2                (Wikidata P2046, normalized)
//   - adminsenter             (Wikidata P36)
//   - wikipediaUrl + utdrag   (no.wikipedia REST summary)
//   - snlUrl + snlSammendrag  (SNL API v1 — attribution required, links kept)
//
// Usage:
//   node scripts/fetch-facts.mjs               # fetch everything
//   node scripts/fetch-facts.mjs --start 1133  # resume from kommunenummer 1133
//   node scripts/fetch-facts.mjs --limit 10    # only N kommuner (for testing)
//   node scripts/fetch-facts.mjs --skip-snl    # skip SNL lookups
//   node scripts/fetch-facts.mjs --skip-wikipedia
//
// The script is resumable: existing entries in data/facts.json are kept and
// only re-fetched when --force is passed. vaapenForklaring entries written by
// generate-vaapen-context.mjs are always preserved.

import { readFileSync, writeFileSync, existsSync } from "fs";

const KOMMUNER_FILE = "data/kommuner.json";
const OUTPUT_FILE = "data/facts.json";
const DELAY_MS = 400;          // politeness delay between per-kommune requests
const RETRY_DELAY_MS = 10000;  // wait on 429 before retrying
const MAX_RETRIES = 3;
const USER_AGENT = "KommuneQuiz/1.0 (educational project; github.com/ArneeMe/kommune-quiz)";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

// --- CLI args ---------------------------------------------------------------
const argv = process.argv.slice(2);
const argValue = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const START_FROM = argValue("--start");
const LIMIT = argValue("--limit") ? Number(argValue("--limit")) : Infinity;
const SKIP_SNL = argv.includes("--skip-snl");
const SKIP_WIKIPEDIA = argv.includes("--skip-wikipedia");
const FORCE = argv.includes("--force");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, { headers = {}, label = url } = {}) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
    });
    if (res.status === 429) {
      console.warn(`  429 from ${label}, waiting ${RETRY_DELAY_MS / 1000}s (attempt ${attempt}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY_MS);
      continue;
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${label}: ${res.status} ${res.statusText}`);
    return res.json();
  }
  throw new Error(`${label}: rate-limited after ${MAX_RETRIES} retries`);
}

// --- Kommune list -----------------------------------------------------------
function loadKommuner() {
  const topo = JSON.parse(readFileSync(KOMMUNER_FILE, "utf8"));
  const layer = Object.keys(topo.objects)[0];
  return topo.objects[layer].geometries
    .map((g) => g.properties)
    .sort((a, b) => a.kommunenummer.localeCompare(b.kommunenummer));
}

// --- Wikidata ---------------------------------------------------------------
// One query for all kommuner: population statements (with point-in-time),
// area (normalized to km² via the P2046 statement value), admin centre and
// the no.wikipedia sitelink. Multiple rows per kommune; aggregated in JS.
const SPARQL = `
SELECT ?kommunenummer ?population ?populationDate ?areaKm2 ?adminLabel ?article WHERE {
  ?item wdt:P31 wd:Q755707 .
  ?item wdt:P2504 ?kommunenummer .
  OPTIONAL {
    ?item p:P1082 ?popStmt .
    ?popStmt ps:P1082 ?population .
    OPTIONAL { ?popStmt pq:P585 ?populationDate . }
  }
  OPTIONAL {
    ?item p:P2046/psn:P2046 ?areaNode .
    ?areaNode wikibase:quantityAmount ?areaM2 .
    BIND(?areaM2 / 1000000 AS ?areaKm2)
  }
  OPTIONAL {
    ?item wdt:P36 ?admin .
    ?admin rdfs:label ?adminLabel . FILTER(LANG(?adminLabel) = "nb")
  }
  OPTIONAL {
    ?article schema:about ?item ;
             schema:isPartOf <https://no.wikipedia.org/> .
  }
}
`;

async function fetchWikidata() {
  console.log("Querying Wikidata SPARQL (population, area, admin centre, wiki links)...");
  const url = `${WIKIDATA_ENDPOINT}?format=json&query=${encodeURIComponent(SPARQL)}`;
  const data = await fetchJson(url, { label: "Wikidata SPARQL" });
  const rows = data.results.bindings;
  console.log(`  ${rows.length} rows`);

  const byKommune = new Map();
  for (const row of rows) {
    const nr = row.kommunenummer?.value;
    if (!nr) continue;
    if (!byKommune.has(nr)) byKommune.set(nr, { populations: [] });
    const entry = byKommune.get(nr);

    if (row.population?.value) {
      entry.populations.push({
        value: Number(row.population.value),
        date: row.populationDate?.value ?? null,
      });
    }
    if (row.areaKm2?.value) entry.arealKm2 = Math.round(Number(row.areaKm2.value) * 10) / 10;
    if (row.adminLabel?.value) entry.adminsenter = row.adminLabel.value;
    if (row.article?.value) entry.wikipediaUrl = row.article.value;
  }

  // Reduce population statements to the most recent one
  for (const entry of byKommune.values()) {
    const dated = entry.populations.filter((p) => p.date);
    const best = dated.length > 0
      ? dated.reduce((a, b) => (a.date > b.date ? a : b))
      : entry.populations[0] ?? null;
    if (best) {
      entry.innbyggertall = best.value;
      entry.innbyggertallAar = best.date ? Number(best.date.slice(0, 4)) : null;
    }
    delete entry.populations;
  }
  return byKommune;
}

// --- Wikipedia summary ------------------------------------------------------
async function fetchWikipediaSummary(wikipediaUrl) {
  if (!wikipediaUrl) return null;
  const title = decodeURIComponent(wikipediaUrl.split("/wiki/")[1] ?? "");
  if (!title) return null;
  const url = `https://no.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const data = await fetchJson(url, { label: `wikipedia:${title}` });
  return data?.extract ?? null;
}

// --- SNL --------------------------------------------------------------------
// SNL's public API: search first, then fetch the article JSON. Fields are
// matched defensively since the API is not versioned per-field.
async function fetchSnl(navn) {
  const searchUrl = `https://snl.no/api/v1/search?query=${encodeURIComponent(navn)}&limit=5`;
  const results = await fetchJson(searchUrl, { label: `snl-search:${navn}` });
  if (!Array.isArray(results) || results.length === 0) return null;

  const norm = (s) => (s ?? "").toLowerCase().trim();
  // Prefer an exact title match, then a "<navn> (kommune)"-style title.
  const match =
    results.find((r) => norm(r.title) === norm(navn)) ??
    results.find((r) => norm(r.title).startsWith(`${norm(navn)} (`)) ??
    null;
  if (!match) return null;

  const articleUrl = match.article_url ?? match.permalink ?? null;
  if (!articleUrl) return null;

  const jsonUrl = match.article_url_json ?? `${articleUrl}.json`;
  const article = await fetchJson(jsonUrl, { label: `snl-article:${navn}` });
  if (!article) return { snlUrl: articleUrl, snlSammendrag: null };

  // Prefer the article's own summary; fall back to the first paragraph.
  let summary = null;
  if (typeof article.summary === "string") summary = article.summary;
  else if (article.summary?.text) summary = article.summary.text;
  else if (article.xhtml_body) {
    const m = article.xhtml_body.match(/<p>(.*?)<\/p>/s);
    if (m) summary = m[1].replace(/<[^>]+>/g, "").trim();
  }

  return { snlUrl: articleUrl, snlSammendrag: summary || null };
}

// --- Main -------------------------------------------------------------------
async function main() {
  const kommuner = loadKommuner();
  console.log(`${kommuner.length} kommuner\n`);

  const existing = existsSync(OUTPUT_FILE)
    ? JSON.parse(readFileSync(OUTPUT_FILE, "utf8"))
    : { kommuner: {} };
  existing.kommuner ??= {};

  const wikidata = await fetchWikidata();

  let done = 0;
  let failed = 0;

  for (const { kommunenummer, navn, fylkenavn } of kommuner) {
    if (START_FROM && kommunenummer < START_FROM) continue;
    if (done >= LIMIT) break;

    const prev = existing.kommuner[kommunenummer] ?? {};
    if (!FORCE && prev.innbyggertall != null && (SKIP_SNL || prev.snlUrl)) {
      continue; // already fetched
    }

    const wd = wikidata.get(kommunenummer) ?? {};
    const entry = {
      ...prev,
      navn,
      fylkenavn,
      innbyggertall: wd.innbyggertall ?? prev.innbyggertall ?? null,
      innbyggertallAar: wd.innbyggertallAar ?? prev.innbyggertallAar ?? null,
      arealKm2: wd.arealKm2 ?? prev.arealKm2 ?? null,
      adminsenter: wd.adminsenter ?? prev.adminsenter ?? null,
      wikipediaUrl: wd.wikipediaUrl ?? prev.wikipediaUrl ?? null,
    };

    try {
      if (!SKIP_WIKIPEDIA && !entry.wikipediaUtdrag) {
        entry.wikipediaUtdrag = await fetchWikipediaSummary(entry.wikipediaUrl);
      }
      if (!SKIP_SNL && !entry.snlUrl) {
        const snl = await fetchSnl(navn);
        entry.snlUrl = snl?.snlUrl ?? null;
        entry.snlSammendrag = snl?.snlSammendrag ?? null;
      }
      console.log(
        `✓ ${kommunenummer} ${navn}: ${entry.innbyggertall ?? "?"} innb. (${entry.innbyggertallAar ?? "?"}), ` +
        `${entry.arealKm2 ?? "?"} km²${entry.snlUrl ? ", SNL" : ""}`
      );
    } catch (err) {
      failed++;
      console.warn(`✗ ${kommunenummer} ${navn}: ${err.message}`);
    }

    existing.kommuner[kommunenummer] = entry;
    done++;

    // Save progress incrementally so interruptions lose nothing
    if (done % 10 === 0) save(existing);
    await sleep(DELAY_MS);
  }

  save(existing);
  console.log(`\nDone: ${done} fetched, ${failed} failed. Output: ${OUTPUT_FILE}`);
  if (failed > 0) {
    console.log("Re-run the script to retry failed entries (existing data is kept).");
  }
}

function save(data) {
  data.generatedAt = new Date().toISOString();
  data.sources = {
    wikidata: "https://www.wikidata.org — CC0",
    wikipedia: "https://no.wikipedia.org — CC BY-SA 4.0",
    snl: "https://snl.no — fri gjenbruk med kildehenvisning",
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2) + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
