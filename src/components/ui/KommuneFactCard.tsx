// src/components/ui/KommuneFactCard.tsx
// Compact fact card for one kommune: shield, key numbers from the generated
// facts dataset, the AI-generated coat-of-arms explanation, and source links.
// Renders nothing when no facts exist for the kommune.

import { KommuneShield } from "./KommuneShield";
import { getKommuneFacts } from "../../utils/facts";

interface KommuneFactCardProps {
    kommunenummer: string;
}

export function KommuneFactCard({ kommunenummer }: KommuneFactCardProps) {
    const facts = getKommuneFacts(kommunenummer);
    if (!facts) return null;

    const numberFacts: string[] = [];
    if (facts.innbyggertall != null) {
        const year = facts.innbyggertallAar ? ` (${facts.innbyggertallAar})` : "";
        numberFacts.push(`${facts.innbyggertall.toLocaleString("nb-NO")} innbyggere${year}`);
    }
    if (facts.arealKm2 != null) {
        numberFacts.push(`${facts.arealKm2.toLocaleString("nb-NO")} km²`);
    }
    if (facts.adminsenter) {
        numberFacts.push(facts.adminsenter);
    }

    return (
        <div className="fact-card">
            <div className="fact-card-header">
                <KommuneShield kommunenummer={kommunenummer} size={36} />
                <div className="fact-card-title">
                    <strong className="fact-card-name">{facts.navn}</strong>
                    {facts.fylkenavn && <span className="fact-card-fylke">{facts.fylkenavn}</span>}
                </div>
            </div>
            {numberFacts.length > 0 && (
                <div className="fact-card-numbers">{numberFacts.join(" · ")}</div>
            )}
            {facts.vaapenForklaring && (
                <p className="fact-card-vaapen">{facts.vaapenForklaring}</p>
            )}
            {(facts.snlUrl || facts.wikipediaUrl) && (
                <div className="fact-card-sources">
                    {facts.snlUrl && (
                        <a href={facts.snlUrl} target="_blank" rel="noopener noreferrer">SNL</a>
                    )}
                    {facts.wikipediaUrl && (
                        <a href={facts.wikipediaUrl} target="_blank" rel="noopener noreferrer">Wikipedia</a>
                    )}
                </div>
            )}
        </div>
    );
}
