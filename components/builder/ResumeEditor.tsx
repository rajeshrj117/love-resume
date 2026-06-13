"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { useResumeStore } from "@/store/resumeStore";
import { ParsedResume } from "@/types/builder";
import BulletEditor from "@/components/builder/BulletEditor";

const SECTION_META: Record<string, { label: string; icon: string }> = {
  personal:       { label: "Personal",     icon: "👤" },
  experience:     { label: "Experience",   icon: "💼" },
  education:      { label: "Education",    icon: "🎓" },
  skills:         { label: "Skills",       icon: "⚡" },
  projects:       { label: "Projects",     icon: "🛠" },
  certifications: { label: "Certs",        icon: "📜" },
  achievements:   { label: "Achievements", icon: "🏆" },
  languages:      { label: "Languages",    icon: "🌐" },
};

function DragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-gray-400 flex-shrink-0">
      <circle cx="4"  cy="3"  r="1.2" fill="currentColor"/>
      <circle cx="4"  cy="7"  r="1.2" fill="currentColor"/>
      <circle cx="4"  cy="11" r="1.2" fill="currentColor"/>
      <circle cx="10" cy="3"  r="1.2" fill="currentColor"/>
      <circle cx="10" cy="7"  r="1.2" fill="currentColor"/>
      <circle cx="10" cy="11" r="1.2" fill="currentColor"/>
    </svg>
  );
}

/* ── Inline ATS badge (tab bar right side) ─────────────────────────────── */
function ATSInline({ score, themeColor }: { score: { total: number }; themeColor: string }) {
  const total = score.total ?? 0;
  const color = total >= 80 ? "#22c55e" : total >= 60 ? "#f59e0b" : "#ef4444";
  const label = total >= 80 ? "Great" : total >= 60 ? "Good" : "Needs Work";
  const C = 2 * Math.PI * 16;
  const offset = C - (total / 100) * C;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2  mx-1 flex-shrink-0 cursor-default"
      style={{ borderColor: color + "40", backgroundColor: color + "08" }}
      title={`ATS Score: ${total}/100 — ${label}`}
    >
      <svg width="36" height="36" viewBox="0 0 40 40" className="-rotate-90 flex-shrink-0">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" strokeWidth="4"/>
        <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}/>
      </svg>
      <div className="leading-none">
        <div className="text-base font-black" style={{ color }}>{total}</div>
        <div className="text-[10px] text-gray-400 font-medium">ATS</div>
      </div>
      <div className="hidden sm:block leading-none">
        <div className="text-[10px] font-semibold" style={{ color }}>{label}</div>
        <div className="text-[10px] text-gray-400">/ 100</div>
      </div>
    </div>
  );
}

/* ── Add-entry button ──────────────────────────────────────────────────── */
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 text-sm font-medium transition-all flex items-center justify-center gap-2"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      {label}
    </button>
  );
}

/* ── Empty-state placeholder ───────────────────────────────────────────── */
function EmptyState({ icon, message, onAdd, addLabel }: { icon: string; message: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-gray-400 text-sm text-center">{message}</p>
      <button
        onClick={onAdd}
        className="mt-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-all flex items-center gap-1.5"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {addLabel}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN EDITOR
═══════════════════════════════════════════════════════════════════════════ */
export default function ResumeEditor() {
  const {
    editedResume, activeSection, setActiveSection, updateResume,
    sectionOrder, reorderSections, themeColor, buildResult,
  } = useResumeStore();

  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex]   = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  /* ── Tab scroll state ────────────────────────────────────────────────── */
  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, [updateScrollState]);

  const scrollTabs = (dir: "left" | "right") =>
    tabScrollRef.current?.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });

  const scrollActiveIntoView = (id: string) => {
    const el  = tabScrollRef.current;
    if (!el) return;
    const btn = el.querySelector(`[data-tab="${id}"]`) as HTMLElement | null;
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  };

  if (!editedResume) return null;

  /* ── Drag-to-reorder ─────────────────────────────────────────────────── */
  const onDragStart = (e: React.DragEvent, idx: number) => {
    dragIndex.current = idx;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:fixed;top:-9999px;opacity:0;width:1px;height:1px;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverIndex(idx);
  };
  const onDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIndex.current !== null && dragIndex.current !== toIdx)
      reorderSections(dragIndex.current, toIdx);
    dragIndex.current = null; setOverIndex(null); setIsDragging(false);
  };
  const onDragEnd = () => { dragIndex.current = null; setOverIndex(null); setIsDragging(false); };

  const sections  = sectionOrder.filter(id => SECTION_META[id]);
  const hasAts    = (buildResult?.ats_score?.total ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-gray-50/80">
        <div className="flex items-center">

          {/* Left arrow */}
          <button onClick={() => scrollTabs("left")} aria-label="Scroll left"
            className={`flex-shrink-0 w-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ minHeight: 44 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          {/* Scrollable tabs */}
          <div ref={tabScrollRef}
            className="flex flex-1 overflow-x-auto scroll-smooth min-w-0"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
            {sections.map((id, idx) => {
              const meta         = SECTION_META[id];
              const isActive     = activeSection === id;
              const isDragOver   = overIndex === idx;
              const isBeingDragged = isDragging && dragIndex.current === idx;
              return (
                <div key={id} data-tab={id} draggable
                  onDragStart={e => onDragStart(e, idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={onDragEnd}
                  className={`group relative flex items-center gap-1 px-3 py-3 select-none transition-all duration-150 cursor-pointer border-b-2 flex-shrink-0
                    ${isActive ? "bg-white text-gray-800" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/60"}
                    ${isDragOver && !isBeingDragged ? "bg-indigo-50" : ""}
                    ${isBeingDragged ? "opacity-40" : "opacity-100"}`}
                  style={isActive ? { borderBottomColor: themeColor } : {}}>
                  <span className={`hidden sm:flex flex-shrink-0 transition-opacity ${isBeingDragged ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}>
                    <DragHandle />
                  </span>
                  <button
                    onClick={() => { setActiveSection(id); scrollActiveIntoView(id); }}
                    className="text-xs font-semibold whitespace-nowrap focus:outline-none flex items-center gap-1"
                    onMouseDown={e => e.stopPropagation()}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right arrow */}
          <button onClick={() => scrollTabs("right")} aria-label="Scroll right"
            className={`flex-shrink-0 w-7 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            style={{ minHeight: 44 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* ATS badge */}
          {hasAts && (
            <div className="flex-shrink-0 border-l border-gray-200 pl-1">
              <ATSInline score={buildResult!.ats_score} themeColor={themeColor} />
            </div>
          )}
        </div>
      </div>

      {/* ── Section content ───────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5">
        {activeSection === "personal"       && <PersonalSection       data={editedResume} onChange={updateResume} themeColor={themeColor} />}
        {activeSection === "skills"         && <SkillsSection         data={editedResume} onChange={updateResume} themeColor={themeColor} />}
        {activeSection === "experience"     && <ExperienceSection     data={editedResume} onChange={updateResume} themeColor={themeColor} />}
        {activeSection === "education"      && <EducationSection      data={editedResume} onChange={updateResume} themeColor={themeColor} />}
        {activeSection === "projects"       && <ProjectsSection       data={editedResume} onChange={updateResume} themeColor={themeColor} />}
        {activeSection === "certifications" && <CertSection           data={editedResume} onChange={updateResume} themeColor={themeColor} />}
        {activeSection === "achievements"   && <AchievementsSection   data={editedResume} onChange={updateResume} themeColor={themeColor} />}
        {activeSection === "languages"      && <LanguagesSection      data={editedResume} onChange={updateResume} themeColor={themeColor} />}
      </div>
    </div>
  );
}

/* ─── Shared Field ─────────────────────────────────────────────────────── */
function Field({
  label, value, onChange, multiline = false, placeholder = "", hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; hint?: string;
}) {
  const cls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder-gray-400";
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium mb-1.5 block">
        {label}
        {hint && <span className="ml-1 text-gray-400 font-normal">{hint}</span>}
      </label>
      {multiline
        ? <textarea rows={3} className={cls} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        : <input   className={cls} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  );
}

/* ─── Section: Personal ────────────────────────────────────────────────── */
function PersonalSection({ data, onChange, themeColor }: { data: ParsedResume; onChange: (d: Partial<ParsedResume>) => void; themeColor: string }) {
  const p = data.personal_info;
  const u = (key: string, val: string) => onChange({ personal_info: { ...p, [key]: val } });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <Field label="Full Name"           value={p.full_name}  onChange={v => u("full_name", v)}  placeholder="John Doe" />
      <Field label="Desired Job Title"   value={p.headline}   onChange={v => u("headline", v)}   placeholder="Software Engineer" />
      <Field label="Email"               value={p.email}      onChange={v => u("email", v)}      placeholder="john@example.com" />
      <Field label="Phone"               value={p.phone}      onChange={v => u("phone", v)}      placeholder="+1 234 567 8900" />
      <Field label="Location"            value={p.location}   onChange={v => u("location", v)}   placeholder="San Francisco, CA" />
      <Field label="LinkedIn"            value={p.linkedin}   onChange={v => u("linkedin", v)}   placeholder="linkedin.com/in/johndoe" />
      <Field label="GitHub"              value={p.github}     onChange={v => u("github", v)}     placeholder="github.com/johndoe" />
      <Field label="Website / Portfolio" value={p.portfolio}  onChange={v => u("portfolio", v)}  placeholder="johndoe.com" />
      <div className="sm:col-span-2">
        <Field label="Professional Summary" value={data.summary ?? ""} onChange={v => onChange({ summary: v })}
          multiline placeholder="Brief professional summary highlighting your key strengths and career goals..." />
      </div>
    </div>
  );
}

/* ─── Section: Skills ──────────────────────────────────────────────────── */
const SKILL_CATEGORIES = [
  { key: "technical",  label: "Technical Skills",       placeholder: "Python, TypeScript, SQL" },
  { key: "frameworks", label: "Frameworks & Libraries", placeholder: "React, Next.js, FastAPI" },
  { key: "tools",      label: "Tools & Platforms",      placeholder: "Git, Docker, Figma" },
  { key: "cloud",      label: "Cloud & DevOps",         placeholder: "AWS, GCP, Kubernetes" },
  { key: "soft",       label: "Soft Skills",            placeholder: "Communication, Leadership" },
] as const;

function SkillsSection({ data, onChange, themeColor }: { data: ParsedResume; onChange: (d: Partial<ParsedResume>) => void; themeColor: string }) {
  const s = data.skills;

  // local holds the raw comma-string the user is typing into each field
  const [local, setLocal] = useState<Record<string, string>>(() =>
    Object.fromEntries(SKILL_CATEGORIES.map(c => [c.key, (s[c.key as keyof typeof s] as string[]).join(", ")]))
  );

  // Track which field is currently focused so we never clobber it mid-type
  const focusedKey = useRef<string | null>(null);

  // When the store's skills change from outside (e.g. AI pre-fill / upload),
  // sync only the fields that are NOT currently being edited.
  const prevSkillsRef = useRef(s);
  useEffect(() => {
    if (prevSkillsRef.current === s) return;
    prevSkillsRef.current = s;
    setLocal(prev => {
      const next = { ...prev };
      SKILL_CATEGORIES.forEach(c => {
        if (focusedKey.current !== c.key) {
          next[c.key] = (s[c.key as keyof typeof s] as string[]).join(", ");
        }
      });
      return next;
    });
  }, [s]);

  const handleChange = (key: string, raw: string) => {
    setLocal(prev => ({ ...prev, [key]: raw }));
    // Only commit non-empty trimmed tokens to the store
    onChange({
      skills: {
        ...s,
        [key]: raw.split(",").map(x => x.trim()).filter(Boolean),
      },
    });
  };

  // On blur: normalise the displayed string (strip trailing comma/spaces)
  const handleBlur = (key: string) => {
    focusedKey.current = null;
    const arr = local[key].split(",").map(x => x.trim()).filter(Boolean);
    setLocal(prev => ({ ...prev, [key]: arr.join(", ") }));
  };

  return (
    <div className="space-y-4">
      {SKILL_CATEGORIES.map(cat => {
        const chips = (s[cat.key as keyof typeof s] as string[]) ?? [];
        return (
          <div key={cat.key}>
            <label className="text-xs text-gray-500 font-medium mb-1.5 block">
              {cat.label} <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              value={local[cat.key] ?? ""}
              onChange={e => handleChange(cat.key, e.target.value)}
              onFocus={() => { focusedKey.current = cat.key; }}
              onBlur={() => handleBlur(cat.key)}
              placeholder={`e.g. ${cat.placeholder}`}
            />
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {chips.map((sk, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded-full font-medium"
                    style={{ backgroundColor: themeColor + "15", color: themeColor }}>
                    {sk}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Section: Experience ──────────────────────────────────────────────── */
function ExperienceSection({ data, onChange, themeColor }: { data: ParsedResume; onChange: (d: Partial<ParsedResume>) => void; themeColor: string }) {
  const exps = data.experience ?? [];
  const [expanded, setExpanded] = useState<number | null>(exps.length > 0 ? 0 : null);

  const update = (i: number, key: string, val: string | boolean | string[]) =>
    onChange({ experience: exps.map((e, idx) => idx === i ? { ...e, [key]: val } : e) });

  const add = () => {
    const idx = exps.length;
    onChange({ experience: [...exps, { title: "", company: "", location: "", start_date: "", end_date: "", is_current: false, responsibilities: [""], achievements: [], technologies: [] }] });
    setExpanded(idx);
  };
  const remove = (i: number) => {
    onChange({ experience: exps.filter((_, idx) => idx !== i) });
    if (expanded === i) setExpanded(null);
  };

  if (exps.length === 0) {
    return <EmptyState icon="💼" message="No work experience added yet.\nAdd your first role to get started." onAdd={add} addLabel="Add Experience" />;
  }

  return (
    <div className="space-y-3">
      {exps.map((exp, i) => (
        <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
          <div
            role="button"
            tabIndex={0}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 text-left transition-colors cursor-pointer"
            onClick={() => setExpanded(expanded === i ? null : i)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(expanded === i ? null : i); } }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: themeColor }}>#{i + 1}</span>
              <span className="text-gray-700 text-xs font-semibold truncate">
                {exp.title ? `${exp.title}${exp.company ? ` · ${exp.company}` : ""}` : "New Entry"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exp.is_current ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {exp.is_current ? "Current" : "Past"}
              </span>
              <button onClick={e => { e.stopPropagation(); remove(i); }}
                className="text-gray-400 hover:text-red-400 transition-colors text-xs px-1.5 py-0.5 rounded hover:bg-red-50">✕</button>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${expanded === i ? "rotate-180" : ""} text-gray-400`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
          {expanded === i && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Job Title"   value={exp.title}      onChange={v => update(i, "title", v)}      placeholder="Software Engineer" />
                <Field label="Company"     value={exp.company}    onChange={v => update(i, "company", v)}    placeholder="Acme Corp" />
                <Field label="Location"    value={exp.location}   onChange={v => update(i, "location", v)}   placeholder="San Francisco, CA / Remote" />
                <Field label="Start Date"  value={exp.start_date} onChange={v => update(i, "start_date", v)} placeholder="Jan 2022" />
                <div className="sm:col-span-1">
                  <label className="text-xs text-gray-500 font-medium mb-1.5 block">End Date</label>
                  <div className="flex gap-2 items-center">
                    <input disabled={exp.is_current}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all disabled:opacity-40"
                      value={exp.is_current ? "Present" : exp.end_date}
                      onChange={e => update(i, "end_date", e.target.value)}
                      placeholder="Dec 2024" />
                    <button onClick={() => update(i, "is_current", !exp.is_current)}
                      className={`flex-shrink-0 px-2.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${exp.is_current ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                      {exp.is_current ? "✓ Now" : "Now?"}
                    </button>
                  </div>
                </div>
              </div>
              <BulletEditor
                bullets={exp.responsibilities.length > 0 ? exp.responsibilities : [""]}
                onChange={bullets => update(i, "responsibilities", bullets)}
                label="Responsibilities & Achievements"
              />
            </div>
          )}
        </div>
      ))}
      <AddButton label="Add Experience Entry" onClick={add} />
    </div>
  );
}

/* ─── Section: Education ───────────────────────────────────────────────── */
function EducationSection({ data, onChange, themeColor }: { data: ParsedResume; onChange: (d: Partial<ParsedResume>) => void; themeColor: string }) {
  const edus = data.education ?? [];
  const [expanded, setExpanded] = useState<number | null>(edus.length > 0 ? 0 : null);

  const update = (i: number, key: string, val: string) =>
    onChange({ education: edus.map((e, idx) => idx === i ? { ...e, [key]: val } : e) });

  const add = () => {
    const idx = edus.length;
    onChange({ education: [...edus, { degree: "", field: "", institution: "", start_year: "", end_year: "" }] });
    setExpanded(idx);
  };

  const remove = (i: number) => {
    onChange({ education: edus.filter((_, idx) => idx !== i) });
    if (expanded === i) setExpanded(null);
  };

  if (edus.length === 0) {
    return <EmptyState icon="🎓" message="No education entries yet.\nAdd your degree or course to get started." onAdd={add} addLabel="Add Education" />;
  }

  return (
    <div className="space-y-3">
      {edus.map((edu, i) => (
        <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
          {/* Collapsible header */}
          <div
            role="button"
            tabIndex={0}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 text-left transition-colors cursor-pointer"
            onClick={() => setExpanded(expanded === i ? null : i)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(expanded === i ? null : i); } }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: themeColor }}>#{i + 1}</span>
              <span className="text-gray-700 text-xs font-semibold truncate">
                {edu.degree
                  ? `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}${edu.institution ? ` · ${edu.institution}` : ""}`
                  : "New Entry"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {edu.end_year && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                  {edu.end_year}
                </span>
              )}
              <button onClick={e => { e.stopPropagation(); remove(i); }}
                className="text-gray-400 hover:text-red-400 transition-colors text-xs px-1.5 py-0.5 rounded hover:bg-red-50">✕</button>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${expanded === i ? "rotate-180" : ""} text-gray-400`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {expanded === i && (
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Degree / Certificate" value={edu.degree}      onChange={v => update(i, "degree", v)}      placeholder="Bachelor of Engineering" />
                <Field label="Field of Study"        value={edu.field}       onChange={v => update(i, "field", v)}       placeholder="Computer Science" />
                <Field label="Institution / College" value={edu.institution} onChange={v => update(i, "institution", v)} placeholder="MIT / Anna University" />
                <Field label="Start Year"            value={edu.start_year}  onChange={v => update(i, "start_year", v)}  placeholder="2019" />
                <Field label="End Year / Expected"   value={edu.end_year}    onChange={v => update(i, "end_year", v)}    placeholder="2023" />
              </div>
            </div>
          )}
        </div>
      ))}
      <AddButton label="Add Education Entry" onClick={add} />
    </div>
  );
}

/* ─── TechTagInput ──────────────────────────────────────────────────────── */
function TechTagInput({ technologies, onChange, themeColor }: {
  technologies: string[];
  onChange: (techs: string[]) => void;
  themeColor: string;
}) {
  const [inputVal, setInputVal] = useState("");

  const commit = (raw: string) => {
    const newTags = raw.split(",").map(t => t.trim()).filter(Boolean);
    if (newTags.length === 0) return;
    const merged = [...technologies, ...newTags.filter(t => !technologies.includes(t))];
    onChange(merged);
    setInputVal("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      commit(inputVal);
    } else if (e.key === "Backspace" && inputVal === "" && technologies.length > 0) {
      onChange(technologies.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="text-xs text-gray-500 font-medium mb-1.5 block">
        Technologies Used <span className="text-gray-400">(type & press comma or Enter)</span>
      </label>
      <div className="w-full min-h-[42px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-400 transition-all">
        {technologies.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium"
            style={{ backgroundColor: themeColor + "18", color: themeColor }}>
            {t}
            <button
              type="button"
              onClick={() => onChange(technologies.filter((_, idx) => idx !== i))}
              className="hover:opacity-70 transition-opacity leading-none"
              style={{ color: themeColor }}
            >×</button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[120px] bg-transparent text-gray-800 text-sm focus:outline-none placeholder-gray-400"
          value={inputVal}
          onChange={e => {
            const v = e.target.value;
            if (v.includes(",")) { commit(v); } else { setInputVal(v); }
          }}
          onKeyDown={handleKey}
          onBlur={() => { if (inputVal.trim()) commit(inputVal); }}
          placeholder={technologies.length === 0 ? "React, Node.js, AWS…" : "Add more…"}
        />
      </div>
    </div>
  );
}

/* ─── Section: Projects ────────────────────────────────────────────────── */
function ProjectsSection({ data, onChange, themeColor }: { data: ParsedResume; onChange: (d: Partial<ParsedResume>) => void; themeColor: string }) {
  const projects = data.projects ?? [];
  const [expanded, setExpanded] = useState<number | null>(projects.length > 0 ? 0 : null);

  const update = (i: number, key: string, val: string | string[]) =>
    onChange({ projects: projects.map((p, idx) => idx === i ? { ...p, [key]: val } : p) });

  const add = () => {
    const idx = projects.length;
    onChange({ projects: [...projects, { name: "", description: "", technologies: [], link: "" }] });
    setExpanded(idx);
  };

  const remove = (i: number) => {
    onChange({ projects: projects.filter((_, idx) => idx !== i) });
    if (expanded === i) setExpanded(null);
  };

  if (projects.length === 0) {
    return <EmptyState icon="🛠" message="No projects added yet.\nShowcase your work by adding a project." onAdd={add} addLabel="Add Project" />;
  }

  return (
    <div className="space-y-3">
      {projects.map((proj, i) => (
        <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
          {/* Collapsible header */}
          <div
            role="button"
            tabIndex={0}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 text-left transition-colors cursor-pointer"
            onClick={() => setExpanded(expanded === i ? null : i)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(expanded === i ? null : i); } }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: themeColor }}>#{i + 1}</span>
              <span className="text-gray-700 text-xs font-semibold truncate">
                {proj.name || "New Project"}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {proj.technologies.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600 hidden sm:inline">
                  {proj.technologies.slice(0, 2).join(", ")}{proj.technologies.length > 2 ? ` +${proj.technologies.length - 2}` : ""}
                </span>
              )}
              <button onClick={e => { e.stopPropagation(); remove(i); }}
                className="text-gray-400 hover:text-red-400 transition-colors text-xs px-1.5 py-0.5 rounded hover:bg-red-50">✕</button>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${expanded === i ? "rotate-180" : ""} text-gray-400`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {expanded === i && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Project Name" value={proj.name} onChange={v => update(i, "name", v)} placeholder="My Awesome App" />
                <Field label="Live Link / GitHub URL" value={proj.link} onChange={v => update(i, "link", v)} placeholder="https://github.com/you/project" />
              </div>
              <Field label="Description" value={proj.description} onChange={v => update(i, "description", v)}
                multiline placeholder="Briefly describe what this project does, your role, and its impact..." />
              <TechTagInput
                technologies={proj.technologies}
                onChange={techs => update(i, "technologies", techs)}
                themeColor={themeColor}
              />
            </div>
          )}
        </div>
      ))}
      <AddButton label="Add Project" onClick={add} />
    </div>
  );
}

/* ─── Section: Certifications ──────────────────────────────────────────── */
function CertSection({ data, onChange, themeColor }: { data: ParsedResume; onChange: (d: Partial<ParsedResume>) => void; themeColor: string }) {
  const certs = data.certifications ?? [];

  const add = () => onChange({ certifications: [...certs, ""] });
  const update = (i: number, val: string) =>
    onChange({ certifications: certs.map((c, idx) => idx === i ? val : c) });
  const remove = (i: number) =>
    onChange({ certifications: certs.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {certs.length === 0 && (
        <EmptyState icon="📜" message="No certifications added yet.\nAdd AWS, Google, or any professional certifications." onAdd={add} addLabel="Add Certification" />
      )}
      {certs.map((cert, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-lg flex-shrink-0">🏅</span>
          <input
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            value={cert}
            onChange={e => update(i, e.target.value)}
            placeholder="e.g. AWS Certified Solutions Architect – 2024"
          />
          <button onClick={() => remove(i)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all text-sm">
            ✕
          </button>
        </div>
      ))}
      {certs.length > 0 && <AddButton label="Add Certification" onClick={add} />}
    </div>
  );
}

/* ─── Section: Achievements ─────────────────────────────────────────────── */
function AchievementsSection({ data, onChange, themeColor }: { data: ParsedResume; onChange: (d: Partial<ParsedResume>) => void; themeColor: string }) {
  const achievements = data.achievements ?? [];

  const add = () => onChange({ achievements: [...achievements, ""] });
  const update = (i: number, val: string) =>
    onChange({ achievements: achievements.map((a, idx) => idx === i ? val : a) });
  const remove = (i: number) =>
    onChange({ achievements: achievements.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {achievements.length === 0 && (
        <EmptyState icon="🏆" message={"No achievements added yet.\nAdd awards, recognition, or notable accomplishments."} onAdd={add} addLabel="Add Achievement" />
      )}
      {achievements.map((ach, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-lg flex-shrink-0">🏆</span>
          <input
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            value={ach}
            onChange={e => update(i, e.target.value)}
            placeholder='e.g. Speaker at ReactConf 2024 – "Scaling React at Scale"'
          />
          <button onClick={() => remove(i)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all text-sm">
            ✕
          </button>
        </div>
      ))}
      {achievements.length > 0 && <AddButton label="Add Achievement" onClick={add} />}
    </div>
  );
}

/* ─── Section: Languages ─────────────────────────────────────────────────── */
function LanguagesSection({ data, onChange }: { data: ParsedResume; onChange: (d: Partial<ParsedResume>) => void; themeColor: string }) {
  const languages = data.languages ?? [];

  const add = () => onChange({ languages: [...languages, ""] });
  const update = (i: number, val: string) =>
    onChange({ languages: languages.map((l, idx) => idx === i ? val : l) });
  const remove = (i: number) =>
    onChange({ languages: languages.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {languages.length === 0 && (
        <EmptyState icon="🌐" message={"No languages added yet.\nAdd spoken languages, e.g. English (Fluent), Tamil (Native)."} onAdd={add} addLabel="Add Language" />
      )}
      {languages.map((lang, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-lg flex-shrink-0">🌐</span>
          <input
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            value={lang}
            onChange={e => update(i, e.target.value)}
            placeholder="e.g. English (Fluent), Tamil (Native), French (Conversational)"
          />
          <button onClick={() => remove(i)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all text-sm">
            ✕
          </button>
        </div>
      ))}
      {languages.length > 0 && <AddButton label="Add Language" onClick={add} />}
    </div>
  );
}
