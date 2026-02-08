// scripts/prepare-data.mjs
// Downloads Kommuner and Fylker TopoJSON from robhop/fylker-og-kommuner.
// Enriches each kommune with fylkesnummer and fylkenavn.
// Outputs:
//   src/data/kommuner.json  — TopoJSON with enriched properties
//   src/data/fylker.json    — TopoJSON for fylke boundaries (used for labels/borders)

import { writeFileSync, mkdirSync, existsSync } from "fs";

const BASE_URL = "https://raw.githubusercontent.com/robhop/fylker-og-kommuner/main";

const KOMMUNER_URL = `${BASE_URL}/Kommuner-M.topojson`;
const FYLKER_URL = `${BASE_URL}/Fylker-M.topojson`;

const OUTPUT_DIR = "src/data";

async function download(url) {
  console.log(`Downloading ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function findKey(obj, candidates) {
  return candidates.find((key) => obj[key] !== undefined);
}

/**
 * Build a map of fylkesnummer → fylkenavn from the Fylker TopoJSON.
 */
function buildFylkeMap(fylkerData) {
  const layerName = Object.keys(fylkerData.objects)[0];
  const geometries = fylkerData.objects[layerName].geometries;

  console.log(`\nFylker layer: "${layerName}" (${geometries.length} fylker)`);
  console.log(`Sample fylke properties:`, JSON.stringify(geometries[0].properties, null, 2));

  const props = geometries[0].properties;
  const nameKey = findKey(props, ["navn", "name", "fylkesnavn"]);
  const idKey = findKey(props, ["fylkesnummer", "id", "FYLKESNR"]);

  if (!nameKey || !idKey) {
    throw new Error(
      `Could not find fylke property keys. Found: ${Object.keys(props).join(", ")}`
    );
  }

  const fylkeMap = new Map();
  for (const g of geometries) {
    const id = String(g.properties[idKey]);
    const name = String(g.properties[nameKey]);
    fylkeMap.set(id, name);
  }

  console.log(`Fylke mapping (${fylkeMap.size} entries):`);
  for (const [id, name] of fylkeMap) {
    console.log(`  ${id} → ${name}`);
  }

  return { fylkeMap, nameKey, idKey, layerName };
}

/**
 * Normalize kommuner: set properties to {kommunenummer, navn, fylkesnummer, fylkenavn}
 */
function normalizeKommuner(kommunerData, fylkeMap) {
  const layerName = Object.keys(kommunerData.objects)[0];
  const geometries = kommunerData.objects[layerName].geometries;

  console.log(`\nKommuner layer: "${layerName}" (${geometries.length} kommuner)`);
  console.log(`Sample kommune properties:`, JSON.stringify(geometries[0].properties, null, 2));

  const props = geometries[0].properties;
  const nameKey = findKey(props, ["navn", "kommune", "kommunenavn", "name"]);
  const idKey = findKey(props, ["kommunenummer", "id", "KOMMUNENR"]);

  if (!nameKey || !idKey) {
    throw new Error(
      `Could not find kommune property keys. Found: ${Object.keys(props).join(", ")}`
    );
  }

  let enriched = 0;
  let missing = 0;

  for (const g of geometries) {
    const kommunenummer = String(g.properties[idKey]);
    const navn = String(g.properties[nameKey]);

    // First two digits of kommunenummer = fylkesnummer
    const fylkesnummer = kommunenummer.slice(0, 2);
    const fylkenavn = fylkeMap.get(fylkesnummer);

    if (fylkenavn) {
      enriched++;
    } else {
      missing++;
      console.warn(`  Warning: No fylke found for kommune ${kommunenummer} (${navn}), fylkesnummer=${fylkesnummer}`);
    }

    g.properties = {
      kommunenummer,
      navn,
      fylkesnummer,
      fylkenavn: fylkenavn ?? "Ukjent",
    };
  }

  console.log(`Enriched ${enriched} kommuner with fylke info (${missing} missing)`);

  // Normalize layer name
  kommunerData.objects["kommuner"] = kommunerData.objects[layerName];
  if (layerName !== "kommuner") {
    delete kommunerData.objects[layerName];
  }

  return kommunerData;
}

/**
 * Normalize fylker TopoJSON: set properties to {fylkesnummer, fylkenavn}
 */
function normalizeFylker(fylkerData, { nameKey, idKey, layerName }) {
  for (const g of fylkerData.objects[layerName].geometries) {
    g.properties = {
      fylkesnummer: String(g.properties[idKey]),
      fylkenavn: String(g.properties[nameKey]),
    };
  }

  fylkerData.objects["fylker"] = fylkerData.objects[layerName];
  if (layerName !== "fylker") {
    delete fylkerData.objects[layerName];
  }

  return fylkerData;
}

async function main() {
  const [kommunerData, fylkerData] = await Promise.all([
    download(KOMMUNER_URL),
    download(FYLKER_URL),
  ]);

  const fylkeInfo = buildFylkeMap(fylkerData);
  const normalizedKommuner = normalizeKommuner(kommunerData, fylkeInfo.fylkeMap);
  const normalizedFylker = normalizeFylker(fylkerData, fylkeInfo);

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Save kommuner
  const kommunerJson = JSON.stringify(normalizedKommuner);
  writeFileSync(`${OUTPUT_DIR}/kommuner.json`, kommunerJson);
  const kommunerMB = (Buffer.byteLength(kommunerJson) / 1024 / 1024).toFixed(2);
  console.log(`\nSaved ${OUTPUT_DIR}/kommuner.json (${kommunerMB} MB)`);

  // Save fylker
  const fylkerJson = JSON.stringify(normalizedFylker);
  writeFileSync(`${OUTPUT_DIR}/fylker.json`, fylkerJson);
  const fylkerMB = (Buffer.byteLength(fylkerJson) / 1024 / 1024).toFixed(2);
  console.log(`Saved ${OUTPUT_DIR}/fylker.json (${fylkerMB} MB)`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
