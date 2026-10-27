// scripts/generate-vaapen-context.mjs
// Uses the Claude API to generate a short Norwegian explanation of each
// kommunevåpen (coat of arms): what the motif is and what it symbolizes.
//
// Reads:  data/facts.json (run scripts/fetch-facts.mjs first) and
//         public/shields/{kommunenummer}.png (run scripts/download-shields.mjs first)
// Writes: vaapenForklaring back into data/facts.json
//
// Auth:   uses the Anthropic SDK's standard credential resolution —
//         ANTHROPIC_API_KEY, or an `ant auth login` profile.
//
// Usage:
//   node scripts/generate-vaapen-context.mjs               # all missing
//   node scripts/generate-vaapen-context.mjs --limit 5     # test on a few first
//   node scripts/generate-vaapen-context.mjs --start 1133  # resume from nr
//   node scripts/generate-vaapen-context.mjs --force       # regenerate existing
//
// The script is resumable: entries that already have vaapenForklaring are
// skipped unless --force is passed, and progress is saved every 5 kommuner.

import { readFileSync, writeFileSync, existsSync } from "fs";
import Anthropic from "@anthropic-ai/sdk";

const FACTS_FILE = "data/facts.json";
const SHIELDS_DIR = "public/shields";
const MODEL = "claude-opus-5";
const DELAY_MS = 500;

const argv = process.argv.slice(2);
const argValue = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const LIMIT = argValue("--limit") ? Number(argValue("--limit")) : Infinity;
const START_FROM = argValue("--start");
const FORCE = argv.includes("--force");

const SYSTEM_PROMPT = `Du er ekspert på norsk heraldikk og kommunevåpen.
Du får bildet av et norsk kommunevåpen sammen med fakta om kommunen.
Forklar kort hva motivet er og hva det symboliserer eller henviser til
(natur, historie, næring, sagn osv.).

Regler:
- Svar på norsk bokmål, 2–3 setninger, uten overskrift eller punktliste.
- Ikke gjenta kommunenavnet i første setning på formen "X kommunes våpen..." —
  gå rett på motivet, f.eks. "Våpenet viser tre sølv sikler på blå bunn ...".
- Er du usikker på den offisielle symbolikken, beskriv motivet nøkternt og
  marker tolkningen med "trolig" — ikke dikt opp en offisiell begrunnelse.`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildUserContent(kommunenummer, entry) {
  const imagePath = `${SHIELDS_DIR}/${kommunenummer}.png`;
  if (!existsSync(imagePath)) return null;
  const imageData = readFileSync(imagePath).toString("base64");

  const facts = [
    `Kommune: ${entry.navn} (${kommunenummer}) i ${entry.fylkenavn ?? "ukjent fylke"}`,
    entry.adminsenter ? `Administrasjonssenter: ${entry.adminsenter}` : null,
    entry.snlSammendrag ? `Fra Store norske leksikon: ${entry.snlSammendrag}` : null,
    entry.wikipediaUtdrag ? `Fra Wikipedia: ${entry.wikipediaUtdrag}` : null,
  ].filter(Boolean).join("\n");

  return [
    {
      type: "image",
      source: { type: "base64", media_type: "image/png", data: imageData },
    },
    { type: "text", text: `${facts}\n\nForklar kommunevåpenet.` },
  ];
}

async function main() {
  if (!existsSync(FACTS_FILE)) {
    console.error(`${FACTS_FILE} not found — run scripts/fetch-facts.mjs first.`);
    process.exit(1);
  }
  const facts = JSON.parse(readFileSync(FACTS_FILE, "utf8"));
  facts.kommuner ??= {};

  const client = new Anthropic();
  const numbers = Object.keys(facts.kommuner).sort();

  let done = 0;
  let skippedNoShield = 0;

  for (const nr of numbers) {
    if (START_FROM && nr < START_FROM) continue;
    if (done >= LIMIT) break;

    const entry = facts.kommuner[nr];
    if (entry.vaapenForklaring && !FORCE) continue;

    const content = buildUserContent(nr, entry);
    if (!content) {
      skippedNoShield++;
      continue;
    }

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      });
      if (response.stop_reason === "refusal") {
        console.warn(`✗ ${nr} ${entry.navn}: model declined (${response.stop_details?.category ?? "?"})`);
        continue;
      }
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      if (!text) {
        console.warn(`✗ ${nr} ${entry.navn}: empty response`);
        continue;
      }
      entry.vaapenForklaring = text;
      done++;
      console.log(`✓ ${nr} ${entry.navn}: ${text.slice(0, 80)}…`);
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) {
        console.warn(`  rate limited at ${nr}, waiting 30s…`);
        await sleep(30000);
        continue; // entry is retried on the next run
      }
      console.warn(`✗ ${nr} ${entry.navn}: ${err.message}`);
    }

    if (done % 5 === 0) save(facts);
    await sleep(DELAY_MS);
  }

  save(facts);
  console.log(`\nDone: ${done} explanations generated` +
    (skippedNoShield ? `, ${skippedNoShield} skipped (no shield image)` : ""));
}

function save(data) {
  writeFileSync(FACTS_FILE, JSON.stringify(data, null, 2) + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
