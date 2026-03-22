// src/hooks/useMapZoom.ts
// Scroll-wheel + pinch-to-zoom + drag-to-pan for the map SVG.
// Works by manipulating the SVG viewBox, so all clicks remain accurate.
//
// Mobile improvements:
// - Tap vs drag detection with distance threshold (prevents accidental pans)
// - Proper touch-action handling (none when zoomed, manipulation at 1x)
// - Single-finger pan only when zoomed
// - Two-finger pinch zoom at any zoom level
// - Smooth momentum after drag release

import { useCallback, useEffect, useRef, useState } from "react";

interface ViewState {
    x: number;
    y: number;
    w: number;
    h: number;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 12;
const SCROLL_ZOOM_FACTOR = 0.0015;
// Minimum px a finger must move before we consider it a drag (not a tap)
const TAP_THRESHOLD = 8;

export function useMapZoom(baseViewBox: string) {
    // Parse the base viewBox
    const base = useRef<ViewState>({ x: 0, y: 0, w: 1, h: 1 });
    const parsed = baseViewBox.split(" ").map(Number);
    if (parsed.length === 4 && parsed.every((n) => !isNaN(n))) {
        base.current = { x: parsed[0], y: parsed[1], w: parsed[2], h: parsed[3] };
    }

    const [view, setView] = useState<ViewState | null>(null);
    const zoomLevel = useRef(1);
    const svgRef = useRef<SVGSVGElement | null>(null);

    // Get current effective view
    const getView = useCallback((): ViewState => {
        return view ?? base.current;
    }, [view]);

    // Clamp view to keep map in bounds
    const clampView = useCallback((v: ViewState): ViewState => {
        const b = base.current;
        const x = Math.max(b.x, Math.min(v.x, b.x + b.w - v.w));
        const y = Math.max(b.y, Math.min(v.y, b.y + b.h - v.h));
        return { x, y, w: v.w, h: v.h };
    }, []);

    // Convert client coords to SVG coords
    const clientToSvg = useCallback((
        clientX: number,
        clientY: number,
        svg: SVGSVGElement,
    ): { svgX: number; svgY: number } => {
        const rect = svg.getBoundingClientRect();
        const v = getView();
        const svgX = v.x + (clientX - rect.left) / rect.width * v.w;
        const svgY = v.y + (clientY - rect.top) / rect.height * v.h;
        return { svgX, svgY };
    }, [getView]);

    // Zoom toward a point
    const zoomAt = useCallback((
        svgX: number,
        svgY: number,
        newZoom: number,
    ) => {
        const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        const b = base.current;
        const newW = b.w / clamped;
        const newH = b.h / clamped;
        const v = getView();

        // Keep the point under the cursor in the same relative position
        const ratioX = (svgX - v.x) / v.w;
        const ratioY = (svgY - v.y) / v.h;
        const newX = svgX - ratioX * newW;
        const newY = svgY - ratioY * newH;

        zoomLevel.current = clamped;

        if (clamped <= 1.02) {
            setView(null);
            zoomLevel.current = 1;
        } else {
            setView(clampView({ x: newX, y: newY, w: newW, h: newH }));
        }
    }, [getView, clampView]);

    // --- Update touch-action on the wrapper when zoom changes ---
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const wrapper = svg.parentElement;
        if (!wrapper) return;
        // When zoomed, we handle all touches ourselves
        // When not zoomed, allow manipulation (taps work normally)
        wrapper.style.touchAction = zoomLevel.current > 1 ? "none" : "manipulation";
    });

    // --- Wheel zoom (attached via useEffect for passive: false) ---
    const zoomAtRef = useRef(zoomAt);
    zoomAtRef.current = zoomAt;
    const clientToSvgRef = useRef(clientToSvg);
    clientToSvgRef.current = clientToSvg;

    const setSvgRef = useCallback((el: SVGSVGElement | null) => {
        svgRef.current = el;
    }, []);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const { svgX, svgY } = clientToSvgRef.current(e.clientX, e.clientY, svg);
            const delta = -e.deltaY * SCROLL_ZOOM_FACTOR;
            const newZoom = zoomLevel.current * (1 + delta);
            zoomAtRef.current(svgX, svgY, newZoom);
        };

        svg.addEventListener("wheel", onWheel, { passive: false });
        return () => svg.removeEventListener("wheel", onWheel);
    }, []);

    // --- Drag to pan (mouse) ---
    const dragRef = useRef<{
        startX: number;
        startY: number;
        startView: ViewState;
        svg: SVGSVGElement;
        isDragging: boolean;
    } | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (zoomLevel.current <= 1) return;
        if (e.button !== 0) return;
        const target = e.target as Element;
        if (target.classList?.contains("kommune-shape")) return;
        e.preventDefault();
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startView: getView(),
            svg: e.currentTarget,
            isDragging: false,
        };
    }, [getView]);

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!dragRef.current) return;
        dragRef.current.isDragging = true;
        const d = dragRef.current;
        const rect = d.svg.getBoundingClientRect();
        const dx = (e.clientX - d.startX) / rect.width * d.startView.w;
        const dy = (e.clientY - d.startY) / rect.height * d.startView.h;
        setView(clampView({
            x: d.startView.x - dx,
            y: d.startView.y - dy,
            w: d.startView.w,
            h: d.startView.h,
        }));
    }, [clampView]);

    const handleMouseUp = useCallback(() => {
        dragRef.current = null;
    }, []);

    // --- Touch: pinch zoom + one-finger pan with tap detection ---
    const touchRef = useRef<{
        initialDistance: number;
        initialZoom: number;
        initialMidSvg: { svgX: number; svgY: number };
    } | null>(null);

    const panTouchRef = useRef<{
        startX: number;
        startY: number;
        startView: ViewState;
        svg: SVGSVGElement;
        isPanning: boolean;
        startTime: number;
    } | null>(null);

    const getTouchDistance = (t1: React.Touch, t2: React.Touch) =>
        Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
        if (e.touches.length === 2) {
            // Pinch zoom start
            e.preventDefault();
            const dist = getTouchDistance(e.touches[0], e.touches[1]);
            const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const svg = e.currentTarget;
            touchRef.current = {
                initialDistance: dist,
                initialZoom: zoomLevel.current,
                initialMidSvg: clientToSvg(midX, midY, svg),
            };
            panTouchRef.current = null;
        } else if (e.touches.length === 1) {
            // Single finger: track as potential pan or tap
            panTouchRef.current = {
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                startView: getView(),
                svg: e.currentTarget,
                isPanning: false,
                startTime: Date.now(),
            };
        }
    }, [clientToSvg, getView]);

    const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
        if (e.touches.length === 2 && touchRef.current) {
            // Pinch zoom
            e.preventDefault();
            const t = touchRef.current;
            const dist = getTouchDistance(e.touches[0], e.touches[1]);
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, t.initialZoom * (dist / t.initialDistance)));
            zoomAt(t.initialMidSvg.svgX, t.initialMidSvg.svgY, newZoom);
        } else if (e.touches.length === 1 && panTouchRef.current) {
            const p = panTouchRef.current;
            const dx = e.touches[0].clientX - p.startX;
            const dy = e.touches[0].clientY - p.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Only start panning if zoomed AND finger moved past threshold
            if (zoomLevel.current > 1 && distance > TAP_THRESHOLD) {
                p.isPanning = true;
                e.preventDefault();
                const rect = p.svg.getBoundingClientRect();
                const panDx = dx / rect.width * p.startView.w;
                const panDy = dy / rect.height * p.startView.h;
                setView(clampView({
                    x: p.startView.x - panDx,
                    y: p.startView.y - panDy,
                    w: p.startView.w,
                    h: p.startView.h,
                }));
            }
            // If not zoomed or under threshold, do nothing — let the browser handle it
            // (this means taps pass through to click handlers normally)
        }
    }, [zoomAt, clampView]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (e.touches.length < 2) {
            touchRef.current = null;
        }
        if (e.touches.length === 0) {
            panTouchRef.current = null;
            // Snap back to 1x if barely zoomed
            if (zoomLevel.current < 1.1) {
                setView(null);
                zoomLevel.current = 1;
            }
        }
    }, []);

    const resetZoom = useCallback(() => {
        setView(null);
        zoomLevel.current = 1;
    }, []);

    const currentView = getView();
    const currentViewBox = `${currentView.x} ${currentView.y} ${currentView.w} ${currentView.h}`;
    const isZoomed = zoomLevel.current > 1.02;

    return {
        svgRef: setSvgRef,
        viewBox: currentViewBox,
        isZoomed,
        resetZoom,
        handlers: {
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseUp,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
    };
}
