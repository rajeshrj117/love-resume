"use client";
import { useRef, useCallback, useEffect } from "react";

// ─── Rich text inline renderer ──────────────────────────────────────────────
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const parts: Array<{ type: "text" | "bold" | "italic"; content: string }> = [];
  const re = /(\*\*(.+?)\*\*)|(\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: text.slice(last, m.index) });
    if (m[1]) parts.push({ type: "bold",   content: m[2] });
    else       parts.push({ type: "italic", content: m[4] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", content: text.slice(last) });

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.type === "bold"   ? <strong key={i}>{p.content}</strong> :
        p.type === "italic" ? <em key={i}>{p.content}</em> :
        <span key={i}>{p.content}</span>
      )}
    </span>
  );
}

// Strips markdown markers for plain export
export function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}

// ─── Single bullet row ──────────────────────────────────────────────────────
interface BulletRowProps {
  index: number;
  value: string;
  total: number;
  onChange: (v: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddBelow: () => void;
}

function BulletRow({
  index, value, total,
  onChange, onRemove, onMoveUp, onMoveDown, onAddBelow,
}: BulletRowProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, []);

  useEffect(() => { resize(); }, [value, resize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAddBelow();
    }
    if (e.key === "Backspace" && value === "" && total > 1) {
      e.preventDefault();
      onRemove();
    }
  };

  return (
    <div className="group flex gap-2 items-start rounded-xl border border-stone-700/60 bg-stone-800/30 hover:border-stone-600 transition-all duration-150 px-2 py-2">
      {/* Reorder handle */}
      <div className="flex flex-col gap-0.5 pt-1.5 flex-shrink-0">
        <button onClick={onMoveUp} disabled={index === 0}
          className="text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors leading-none text-xs px-0.5"
          title="Move up">▲</button>
        <div className="text-stone-600 text-xs text-center font-mono leading-none mt-0.5">⠿</div>
        <button onClick={onMoveDown} disabled={index === total - 1}
          className="text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors leading-none text-xs px-0.5 mt-0.5"
          title="Move down">▼</button>
      </div>

      {/* Bullet dot */}
      <span className="text-stone-400 text-sm mt-2 flex-shrink-0 select-none">•</span>

      {/* Textarea */}
      <textarea
        ref={taRef}
        value={value}
        rows={1}
        onChange={e => { onChange(e.target.value); resize(); }}
        onKeyDown={handleKeyDown}
        placeholder="Describe a responsibility or achievement..."
        className="flex-1 min-w-0 bg-transparent text-stone-200 text-sm resize-none focus:outline-none placeholder-stone-600 leading-relaxed mt-1.5"
        style={{ minHeight: "24px" }}
      />

      {/* Actions */}
      <div className="flex flex-col gap-1 flex-shrink-0 pt-1.5">
        <button onClick={onAddBelow} title="Add below"
          className="w-5 h-5 rounded-full bg-stone-700 hover:bg-stone-500 text-stone-300 hover:text-white text-xs flex items-center justify-center transition-colors leading-none">+</button>
        <button onClick={onRemove} disabled={total <= 1} title="Remove"
          className="w-5 h-5 rounded-full bg-stone-700 hover:bg-red-800 text-stone-400 hover:text-red-200 text-xs flex items-center justify-center transition-colors disabled:opacity-20 leading-none">×</button>
      </div>
    </div>
  );
}

// ─── Full bullet editor ──────────────────────────────────────────────────────
interface BulletEditorProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
  label?: string;
}

export default function BulletEditor({ bullets, onChange, label = "Responsibilities & Achievements" }: BulletEditorProps) {
  const update = (i: number, val: string) => {
    const next = [...bullets];
    next[i] = val;
    onChange(next);
  };

  const remove = (i: number) => {
    if (bullets.length <= 1) return;
    onChange(bullets.filter((_, idx) => idx !== i));
  };

  const addBelow = (i: number) => {
    const next = [...bullets];
    next.splice(i + 1, 0, "");
    onChange(next);
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...bullets];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };

  const moveDown = (i: number) => {
    if (i === bullets.length - 1) return;
    const next = [...bullets];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  return (
    <div>
      {/* Label + add button */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-stone-500 font-mono">{label}</label>
        <button
          onClick={() => onChange([...bullets, ""])}
          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700 hover:text-stone-200 transition-all">
          + Add bullet
        </button>
      </div>

      {/* Bullet rows */}
      <div className="space-y-2">
        {bullets.map((b, i) => (
          <BulletRow
            key={i}
            index={i}
            value={b}
            total={bullets.length}
            onChange={v => update(i, v)}
            onRemove={() => remove(i)}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
            onAddBelow={() => addBelow(i)}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-stone-600 font-mono">
          {bullets.filter(b => b.trim()).length} bullet{bullets.filter(b => b.trim()).length !== 1 ? "s" : ""} · Enter to add · Backspace on empty to delete
        </span>
        {bullets.some(b => b.match(/\d+%|\d+x|\$\d+/)) && (
          <span className="text-[10px] text-green-500 font-mono">✓ Quantified impact detected</span>
        )}
      </div>
    </div>
  );
}
