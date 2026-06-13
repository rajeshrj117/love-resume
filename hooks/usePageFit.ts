"use client";
import { useEffect, useRef, useState, useCallback } from "react";

// A4 at 96 dpi = 794 × 1122 px
export const A4_HEIGHT_PX = 1122;
export const A4_WIDTH_PX = 794;

export interface PageFitState {
  pageCount: number;       // actual pages the content would span
  overflowPct: number;     // how far over 1 page (0 = fits, 0.5 = 50% over, etc.)
  contentHeight: number;   // raw px height of resume content
  scaleTo1Page: number;    // CSS scale factor to shrink content into exactly 1 A4 page
  scaleTo2Page: number;    // CSS scale factor to shrink content into exactly 2 A4 pages
}

/**
 * Observes the element at `targetId` and returns live page-fit metrics.
 * Re-runs whenever `deps` change (e.g. resume data or template).
 */
export function usePageFit(targetId: string, deps: unknown[]): PageFitState {
  const [state, setState] = useState<PageFitState>({
    pageCount: 1,
    overflowPct: 0,
    contentHeight: 0,
    scaleTo1Page: 1,
    scaleTo2Page: 1,
  });

  const observerRef = useRef<ResizeObserver | null>(null);

  const measure = useCallback(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const h = el.scrollHeight;
    const pages = Math.ceil(h / A4_HEIGHT_PX);
    const overflowPct = Math.max(0, (h - A4_HEIGHT_PX) / A4_HEIGHT_PX);
    setState({
      pageCount: pages,
      overflowPct,
      contentHeight: h,
      scaleTo1Page: Math.min(1, A4_HEIGHT_PX / Math.max(h, 1)),
      scaleTo2Page: Math.min(1, (A4_HEIGHT_PX * 2) / Math.max(h, 1)),
    });
  }, [targetId]);

  useEffect(() => {
    // Small delay so DOM has painted after data/template change
    const t = setTimeout(measure, 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    observerRef.current = new ResizeObserver(measure);
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, [targetId, measure]);

  return state;
}
