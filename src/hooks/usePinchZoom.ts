// src/hooks/usePinchZoom.ts
// Touch-based pinch-to-zoom and pan for the map SVG on mobile.

import { useCallback, useRef, useState } from "react";

interface ViewTransform {
    scale: number;
    translateX: number;
    translateY: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;

export function usePinchZoom() {
    const [transform, setTransform] = useState<ViewTransform>({
        scale: 1,
        translateX: 0,
        translateY: 0,
    });

    const gestureRef = useRef<{
        initialDistance: number;
        initialScale: number;
        initialMidX: number;
        initialMidY: number;
        initialTranslateX: number;
        initialTranslateY: number;
    } | null>(null);

    const panRef = useRef<{
        startX: number;
        startY: number;
        initialTranslateX: number;
        initialTranslateY: number;
    } | null>(null);

    const getDistance = (t1: React.Touch, t2: React.Touch) =>
        Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dist = getDistance(e.touches[0], e.touches[1]);
            gestureRef.current = {
                initialDistance: dist,
                initialScale: transform.scale,
                initialMidX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                initialMidY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
                initialTranslateX: transform.translateX,
                initialTranslateY: transform.translateY,
            };
            panRef.current = null;
        } else if (e.touches.length === 1 && transform.scale > 1) {
            panRef.current = {
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                initialTranslateX: transform.translateX,
                initialTranslateY: transform.translateY,
            };
        }
    }, [transform]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && gestureRef.current) {
            e.preventDefault();
            const g = gestureRef.current;
            const dist = getDistance(e.touches[0], e.touches[1]);
            const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, g.initialScale * (dist / g.initialDistance)));

            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const dx = midX - g.initialMidX;
            const dy = midY - g.initialMidY;

            setTransform({
                scale: newScale,
                translateX: g.initialTranslateX + dx,
                translateY: g.initialTranslateY + dy,
            });
        } else if (e.touches.length === 1 && panRef.current && transform.scale > 1) {
            const p = panRef.current;
            const dx = e.touches[0].clientX - p.startX;
            const dy = e.touches[0].clientY - p.startY;
            setTransform((prev) => ({
                ...prev,
                translateX: p.initialTranslateX + dx,
                translateY: p.initialTranslateY + dy,
            }));
        }
    }, [transform.scale]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (e.touches.length < 2) {
            gestureRef.current = null;
        }
        if (e.touches.length === 0) {
            panRef.current = null;
            // Snap back to 1x if close
            setTransform((prev) => {
                if (prev.scale < 1.1) {
                    return { scale: 1, translateX: 0, translateY: 0 };
                }
                return prev;
            });
        }
    }, []);

    const resetZoom = useCallback(() => {
        setTransform({ scale: 1, translateX: 0, translateY: 0 });
    }, []);

    const svgStyle: React.CSSProperties = transform.scale > 1
        ? {
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: "center center",
            touchAction: "none",
        }
        : { touchAction: "manipulation" };

    return {
        transform,
        svgStyle,
        isZoomed: transform.scale > 1,
        resetZoom,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
    };
}
