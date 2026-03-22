// src/components/ui/NameInput.tsx
// Autocomplete text input for typing kommune names.
// Shared by shield and reverse modes.

import { useState, useRef, useEffect, useMemo } from "react";

interface NameInputProps {
    names: string[];
    onSubmit: (name: string) => void;
    disabled?: boolean;
    feedbackState?: "correct" | "wrong" | null;
}

export function NameInput({ names, onSubmit, disabled, feedbackState }: NameInputProps) {
    const [value, setValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount and when disabled changes
    useEffect(() => {
        if (!disabled) inputRef.current?.focus();
    }, [disabled]);

    const suggestions = useMemo(() => {
        if (value.length < 1) return [];
        const lower = value.toLowerCase();
        return names
            .filter((n) => n.toLowerCase().startsWith(lower))
            .slice(0, 6);
    }, [value, names]);

    const submit = (name: string) => {
        onSubmit(name);
        setValue("");
        setShowSuggestions(false);
        setSelectedIndex(0);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions.length > 0) {
                submit(suggestions[selectedIndex]);
            } else if (value.trim()) {
                submit(value.trim());
            }
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        setShowSuggestions(true);
        setSelectedIndex(0);
    };

    const containerClass = [
        "name-input-container",
        feedbackState === "wrong" ? "input-shake" : "",
        feedbackState === "correct" ? "input-correct" : "",
    ].filter(Boolean).join(" ");

    return (
        <div className={containerClass}>
            <input
                ref={inputRef}
                type="text"
                className="name-input"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Skriv kommunenavn..."
                disabled={disabled}
                autoComplete="off"
                spellCheck={false}
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="name-suggestions">
                    {suggestions.map((name, i) => (
                        <li
                            key={name}
                            className={`name-suggestion ${i === selectedIndex ? "name-suggestion-active" : ""}`}
                            onMouseDown={() => submit(name)}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
