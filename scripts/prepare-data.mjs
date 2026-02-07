// scripts/prepare-data.mjs

import { writeFileSync, mkdirSync, existsSync } from "fs";

const SOURCE_URL =
  "https://raw.githubusercontent.com/robhop/fylker-og-kommuner/main/Kommuner-M.topojson";

const FALLBACK_URL =
  "https://raw.githubusercontent.com/robhop/fylker-og-kommuner/main/Kommuner-S.topojson";

// Kartverket source (if the above repo ever disappears):
// https://kartkatalog.geonorge.no/metadata/administrative-enheter-kommuner/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b

const OUTPUT_DIR = "src/data";
const OUTPUT_PATH = `${OUTPUT_DIR}/kommuner.json`;

async function download(url) {
  console.log(`Downloading from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function validate(topojson) {
  const objectKeys = Object.keys(topojson.objects);
  if (objectKeys.length === 0) {
    throw new Error("No objects found in TopoJSON");
  }

  const layerName = objectKeys[0];
  const geometries = topojson.objects[layerName].geometries;

  console.log(`Layer name: "${layerName}"`);
  console.log(`Total geometries: ${geometries.length}`);
  console.log(`Sample properties:`, JSON.stringify(geometries[0].properties, null, 2));

  const props = geometries[0].properties;
  const nameKey = findKey(props, ["navn", "kommune", "kommunenavn", "name"]);
  const idKey = findKey(props, ["kommunenummer", "id", "KOMMUNENR"]);

  if (!nameKey || !idKey) {
    console.warn("Property keys found:", Object.keys(props));
    throw new Error(
      `Could not find required properties. Found: ${Object.keys(props).join(", ")}. ` +
        `Need a name field (looked for: navn, kommune, kommunenavn) and an id field (looked for: kommunenummer, id).`
    );
  }

  console.log(`Using "${nameKey}" as name field and "${idKey}" as id field`);

  const names = geometries.map((g) => g.properties[nameKey]).filter(Boolean);
  const ids = geometries.map((g) => g.properties[idKey]).filter(Boolean);
  const uniqueIds = new Set(ids);

  console.log(`Kommuner with names: ${names.length}`);
  console.log(`Unique IDs: ${uniqueIds.size}`);
  console.log(`First 5:`, names.slice(0, 5).join(", "));

  if (uniqueIds.size < 300) {
    console.warn(`Warning: Only ${uniqueIds.size} unique kommuner found, expected ~356`);
  }

  return { layerName, nameKey, idKey };
}

function findKey(obj, candidates) {
  return candidates.find((key) => obj[key] !== undefined);
}

function normalize(topojson, { layerName, nameKey, idKey }) {
  const geometries = topojson.objects[layerName].geometries;

  for (const geometry of geometries) {
    const { [nameKey]: name, [idKey]: id, ...rest } = geometry.properties;
    geometry.properties = { kommunenummer: String(id), navn: String(name) };
  }

  const normalizedLayerName = "kommuner";
  topojson.objects[normalizedLayerName] = topojson.objects[layerName];
  if (layerName !== normalizedLayerName) {
    delete topojson.objects[layerName];
  }

  return topojson;
}

async function main() {
  let data;
  try {
    data = await download(SOURCE_URL);
  } catch (err) {
    console.warn(`Primary source failed: ${err.message}`);
    console.log("Trying fallback...");
    data = await download(FALLBACK_URL);
  }

  const mapping = validate(data);
  const normalized = normalize(data, mapping);

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const json = JSON.stringify(normalized);
  writeFileSync(OUTPUT_PATH, json);

  const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
  console.log(`\nSaved to ${OUTPUT_PATH} (${sizeMB} MB)`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
