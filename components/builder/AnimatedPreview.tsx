"use client";
import { useEffect, useRef, useState, ReactNode } from "react";
import { useResumeStore } from "@/store/resumeStore";

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps the live resume preview.
 * When the user types (editedResume changes), it:
 *  1. Shows a pulsing "Updating…" pill
 *  2. Dims the preview slightly (opacity 0.6)
 *  3. After 400 ms debounce, fades back in smoothly
 */
export default function AnimatedPreview({ children, className = "" }: Props) {
  const editedResume = useResumeStore(s => s.editedResume);
  const themeColor   = useResumeStore(s => s.themeColor);

  const [isUpdating, setIsUpdating]   = useState(false);
  const [showPill,   setShowPill]     = useState(false);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst      = useRef(true);

  useEffect(() => {
    // Skip the very first mount
    if (isFirst.current) { isFirst.current = false; return; }

    // User changed something → dim + show pill
    setIsUpdating(true);
    setShowPill(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsUpdating(false);
      // Pill lingers 600 ms after fade-in completes
      setTimeout(() => setShowPill(false), 600);
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [editedResume]);

  return (
    <div className={`relative ${className}`}>
      {/* ── Updating pill ── */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        style={{
          transition: "opacity 0.25s ease, transform 0.25s ease",
          opacity: showPill ? 1 : 0,
          transform: showPill ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.92)",
        }}
      >
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg text-white text-[11px] font-semibold"
          style={{ backgroundColor: themeColor }}
        >
          {/* Animated dots */}
          <span className="flex gap-0.5 items-end h-3">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="inline-block w-1 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.85)",
                  height: isUpdating ? "8px" : "3px",
                  transition: `height 0.3s ease ${i * 0.1}s`,
                }}
              />
            ))}
          </span>
          <span>{isUpdating ? "Updating…" : "✓ Updated"}</span>
        </div>
      </div>

      {/* ── Preview content wrapper ── */}
      <div
        style={{
          transition: "opacity 0.35s ease, filter 0.35s ease",
          opacity: isUpdating ? 0.55 : 1,
          filter: isUpdating ? "blur(0.6px)" : "blur(0px)",
          willChange: "opacity, filter",
        }}
      >
        {children}
      </div>
    </div>
  );
}
