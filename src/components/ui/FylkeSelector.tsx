// src/components/ui/FylkeSelector.tsx
// Dropdown to select a fylke to play, or "Hele Norge" for all kommuner.

interface FylkeSelectorProps {
    fylker: { fylkesnummer: string; fylkenavn: string }[];
    selected: string | null;
    onChange: (fylkesnummer: string | null) => void;
}

export function FylkeSelector({ fylker, selected, onChange }: FylkeSelectorProps) {
    return (
        <select
            className="fylke-selector"
            value={selected ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
        >
            <option value="">Hele Norge</option>
            {fylker.map(({ fylkesnummer, fylkenavn }) => (
                <option key={fylkesnummer} value={fylkesnummer}>
                    {fylkenavn}
                </option>
            ))}
        </select>
    );
}