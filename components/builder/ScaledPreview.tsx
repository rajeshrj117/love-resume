"use client";
/**
 * ScaledPreview
 * Wraps any ResumePreview and scales it to fill its container width at all times.
 * Works on every device from 320px phones to 4K monitors — no hardcoded values.
 *
 * Usage:
 *   <ScaledPreview maxHeight={700}>
 *     <ResumePreview resume={...} template={...} ... />
 *   </ScaledPreview>
 */
import { useRef, useEffect, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Natural (unscaled) width of the content. Defaults to 794 (A4 px at 96 dpi). */
  contentWidth?: number;
  /** Clamp the outer container to this height in px (optional). */
  maxHeight?: number;
  /**
   * When true the outer container's height is controlled externally (e.g. via
   * `style={{ position:"absolute", inset:0, height:"100%" }}`) and ScaledPreview
   * should NOT overwrite it.  The inner content is scaled to fit the available
   * width; any overflow is hidden by the parent's `overflow:hidden`.
   */
  fillContainer?: boolean;
  className?: string;
  /** Extra style on the outer wrapper */
  style?: React.CSSProperties;
}

export default function ScaledPreview({
  children,
  contentWidth = 794,
  maxHeight,
  fillContainer = false,
  className = "",
  style = {},
}: Props) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const recalc = () => {
      const w = outer.getBoundingClientRect().width;
      if (!w) return;
      const scale = Math.min(1, w / contentWidth);

      inner.style.transform       = `scale(${scale})`;
      inner.style.transformOrigin = "top left";
      inner.style.width           = `${contentWidth}px`;

      // Only manage outer height when we own it
      if (!fillContainer) {
        const scaledH = inner.getBoundingClientRect().height;
        outer.style.height = maxHeight
          ? `${Math.min(scaledH, maxHeight)}px`
          : `${scaledH}px`;
      }
    };

    // Watch outer container width (panel resize / orientation change)
    const outerObs = new ResizeObserver(recalc);
    outerObs.observe(outer);

    // Watch inner content height (fonts load, content added)
    const innerObs = new ResizeObserver(recalc);
    innerObs.observe(inner);

    // Defer initial measurement two frames so first paint settles
    const raf = requestAnimationFrame(() => requestAnimationFrame(recalc));

    return () => {
      outerObs.disconnect();
      innerObs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [contentWidth, maxHeight]);

  return (
    <div
      ref={outerRef}
      className={className}
      style={{ position: "relative", overflow: "hidden", width: "100%", ...style }}
    >
      <div ref={innerRef} style={{ pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
    </div>
  );
}
