// src/types/facts.ts
// Per-kommune facts scraped by scripts/fetch-facts.mjs (Wikidata/Wikipedia/SNL)
// and enriched by scripts/generate-vaapen-context.mjs (Claude).
// Every field except navn is optional — the dataset is regenerated out-of-band
// and entries may be partial.

export interface KommuneFacts {
    navn: string;
    fylkenavn?: string | null;
    /** Population (latest known figure) */
    innbyggertall?: number | null;
    /** Year the population figure refers to */
    innbyggertallAar?: number | null;
    /** Official area in km² */
    arealKm2?: number | null;
    /** Administrative centre */
    adminsenter?: string | null;
    wikipediaUrl?: string | null;
    wikipediaUtdrag?: string | null;
    snlUrl?: string | null;
    snlSammendrag?: string | null;
    /** AI-generated explanation of the coat of arms symbolism */
    vaapenForklaring?: string | null;
    /** Bookkeeping: when fetch-facts.mjs last completed this entry */
    hentetAt?: string;
    /** Bookkeeping: SNL has been looked up (even if no article exists) */
    snlChecked?: boolean;
}

export interface KommuneFactsFile {
    generatedAt: string | null;
    sources: Record<string, string>;
    kommuner: Record<string, KommuneFacts>;
}
