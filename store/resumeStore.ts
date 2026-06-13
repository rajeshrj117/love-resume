import { create } from "zustand";
import { BuildResult, ParsedResume, Template } from "@/types/builder";

export const DEFAULT_SECTION_ORDER = [
  "personal",
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
  "certifications",
  "achievements",
  "languages",
];

export const THEME_COLORS = [
  "#4F46E5","#1d4ed8","#dc2626","#059669","#0d9488","#7c3aed","#db2777","#ea580c",
  "#e91e8c","#0891b2","#1e293b","#374151","#16a34a","#65a30d","#ca8a04","#166534",
];

export const FONT_FAMILIES = [
  "Inter","Roboto","Open Sans","Lato","Montserrat","Poppins","Source Sans Pro","Raleway",
];

const STORAGE_KEY = "resumai_autosave_v1";

// ── Serialisable slice that gets written to localStorage ──────────────────────
interface PersistedState {
  buildResult: BuildResult;
  editedResume: ParsedResume;
  selectedTemplateId: string;
  sectionOrder: string[];
  themeColor: string;
  fontFamily: string;
  fontSize: "compact" | "normal" | "large";
  profilePhoto: string | null;
}

export function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // Basic shape validation — must have a resume with personal_info
    if (!parsed?.editedResume?.personal_info) return null;
    // Sanitise in case arrays are missing in older cached data
    parsed.editedResume = sanitiseResume(parsed.editedResume);
    if (parsed.buildResult?.cleaned) {
      parsed.buildResult.cleaned = sanitiseResume(parsed.buildResult.cleaned);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStorage(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

// ── Store interface ───────────────────────────────────────────────────────────
interface ResumeStore {
  buildResult: BuildResult | null;
  selectedTemplate: Template | null;
  activeSection: string;
  editedResume: ParsedResume | null;
  isLoading: boolean;
  loadingStep: number;
  error: string;
  sectionOrder: string[];
  themeColor: string;
  fontFamily: string;
  fontSize: "compact" | "normal" | "large";
  profilePhoto: string | null;
  // Auto-save
  lastSaved: Date | null;

  setBuildResult: (result: BuildResult) => void;
  setSelectedTemplate: (t: Template) => void;
  setActiveSection: (s: string) => void;
  updateResume: (data: Partial<ParsedResume>) => void;
  setLoading: (v: boolean) => void;
  setLoadingStep: (v: number) => void;
  setError: (e: string) => void;
  reset: () => void;
  setSectionOrder: (order: string[]) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  setThemeColor: (c: string) => void;
  setFontFamily: (f: string) => void;
  setFontSize: (s: "compact" | "normal" | "large") => void;
  setProfilePhoto: (p: string | null) => void;
  setLastSaved: (d: Date | null) => void;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  buildResult: null,
  selectedTemplate: null,
  activeSection: "personal",
  editedResume: null,
  isLoading: false,
  loadingStep: 0,
  error: "",
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  themeColor: "#4F46E5",
  fontFamily: "Inter",
  fontSize: "normal",
  profilePhoto: null,
  lastSaved: null,

  setBuildResult: (result) => set({
    buildResult: result,
    editedResume: sanitiseResume(result.cleaned),
    selectedTemplate: result.templates?.[0] ?? null,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    error: "",
  }),
  setSelectedTemplate: (t) => set({ selectedTemplate: t }),
  setActiveSection: (s) => set({ activeSection: s }),
  updateResume: (data) => set({ editedResume: sanitiseResume({ ...get().editedResume!, ...data }) }),
  setLoading: (v) => set({ isLoading: v }),
  setLoadingStep: (v) => set({ loadingStep: v }),
  setError: (e) => set({ error: e, isLoading: false }),
  reset: () => set({
    buildResult: null,
    editedResume: null,
    selectedTemplate: null,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    error: "",
    isLoading: false,
    profilePhoto: null,
    lastSaved: null,
  }),
  setSectionOrder: (order) => set({ sectionOrder: order }),
  reorderSections: (fromIndex, toIndex) => {
    const order = [...get().sectionOrder];
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);
    set({ sectionOrder: order });
  },
  setThemeColor: (c) => set({ themeColor: c }),
  setFontFamily: (f) => set({ fontFamily: f }),
  setFontSize: (s) => set({ fontSize: s }),
  setProfilePhoto: (p) => set({ profilePhoto: p }),
  setLastSaved: (d) => set({ lastSaved: d }),
}));

// ── Debounced auto-save subscriber ───────────────────────────────────────────
// Runs outside React — subscribes to the store directly and writes to
// localStorage 1.5 s after the last state change. Skips blank/loading states.
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

useResumeStore.subscribe((state) => {
  // Don't save while loading, don't save a blank slate
  if (state.isLoading) return;
  if (!state.buildResult || !state.editedResume) return;
  // Don't save if the resume has no meaningful content yet
  if (!state.editedResume.personal_info?.full_name &&
      !state.editedResume.summary &&
      state.editedResume.experience.length === 0) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const payload: PersistedState = {
        buildResult: state.buildResult!,
        editedResume: state.editedResume!,
        selectedTemplateId: state.selectedTemplate?.id ?? "",
        sectionOrder: state.sectionOrder,
        themeColor: state.themeColor,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        profilePhoto: state.profilePhoto,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      useResumeStore.getState().setLastSaved(new Date());
    } catch {
      // localStorage full or unavailable — fail silently
    }
  }, 1500);
});

// ── Resume sanitiser (exported for use in API routes and components) ──────────
// The AI sometimes returns certifications/achievements/skills as objects
// e.g. { name: "AWS SAA", date: "2023" } instead of plain strings.
// Call this at every AI→store boundary.
function toStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const o = val as Record<string, unknown>;
    const label = String(o.name ?? o.title ?? o.label ?? o.text ?? "");
    const extra  = String(o.date ?? o.issued ?? o.year  ?? o.issuer ?? "");
    return extra ? `${label} (${extra})` : label || JSON.stringify(val);
  }
  return String(val ?? "");
}

export function sanitiseResume(r: ParsedResume): ParsedResume {
  return {
    ...r,
    summary:        r.summary ?? "",
    experience:     r.experience     ?? [],
    education:      r.education      ?? [],
    projects:       r.projects       ?? [],
    certifications: (r.certifications ?? []).map(toStr),
    achievements:   (r.achievements   ?? []).map(toStr),
    keywords:       (r.keywords ?? []).map(toStr),
    languages:      (r.languages ?? []).map(toStr),
    skills: {
      technical:  (r.skills?.technical  ?? []).map(toStr),
      frameworks: (r.skills?.frameworks ?? []).map(toStr),
      tools:      (r.skills?.tools      ?? []).map(toStr),
      cloud:      (r.skills?.cloud      ?? []).map(toStr),
      soft:       (r.skills?.soft       ?? []).map(toStr),
    },
  };
}
