// src/components/ui/Confetti.tsx
// Lightweight CSS-only confetti burst for completion celebrations.

import { useMemo } from "react";

const PARTICLE_COUNT = 40;
const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ef4444", "#8b5cf6", "#ec4899", "#eab308"];

interface Particle {
    id: number;
    color: string;
    left: number;
    delay: number;
    duration: number;
    angle: number;
    distance: number;
    size: number;
    rotation: number;
}

export function Confetti() {
    const particles = useMemo<Particle[]>(() =>
        Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
            id: i,
            color: COLORS[i % COLORS.length],
            left: 40 + Math.random() * 20,
            delay: Math.random() * 0.3,
            duration: 0.8 + Math.random() * 0.6,
            angle: (Math.random() * 360),
            distance: 120 + Math.random() * 200,
            size: 4 + Math.random() * 4,
            rotation: Math.random() * 720 - 360,
        })), []
    );

    return (
        <div className="confetti-container" aria-hidden="true">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="confetti-particle"
                    style={{
                        left: `${p.left}%`,
                        backgroundColor: p.color,
                        width: `${p.size}px`,
                        height: `${p.size * 0.6}px`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        ["--confetti-x" as string]: `${Math.cos(p.angle * Math.PI / 180) * p.distance}px`,
                        ["--confetti-y" as string]: `${-Math.abs(Math.sin(p.angle * Math.PI / 180) * p.distance)}px`,
                        ["--confetti-r" as string]: `${p.rotation}deg`,
                    }}
                />
            ))}
        </div>
    );
}
