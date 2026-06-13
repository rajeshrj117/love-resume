"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useResumeStore, loadFromStorage, clearStorage } from "@/store/resumeStore";
import { exportResumePDF } from "@/lib/exportPDF";
import ResumePreview from "@/components/templates/ResumePreview";
import ScaledPreview from "@/components/builder/ScaledPreview";
import AnimatedPreview from "@/components/builder/AnimatedPreview";

const ATSScorePanel = dynamic(() => import("@/components/builder/ATSScorePanel"), { ssr: false });
const TemplateGallery = dynamic(() => import("@/components/builder/TemplateGallery"), { ssr: false });
const ResumeEditor = dynamic(() => import("@/components/builder/ResumeEditor"), { ssr: false });
const CoverLetterPanel = dynamic(() => import("@/components/builder/CoverLetterPanel"), { ssr: false });
const SettingsPanel = dynamic(() => import("@/components/builder/SettingsPanel"), { ssr: false });

const UPLOAD_LOADING_STEPS = [
  "Uploading resume...",
  "Extracting text content...",
  "AI parsing all sections...",
  "Tailoring to job description...",
  "Calculating ATS score...",
  "Building editor structure...",
];

const BLANK_RESULT = {
  parsed: {
    personal_info: { full_name: "", headline: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "" },
    summary: "", skills: { technical: [], soft: [], tools: [], frameworks: [], cloud: [] },
    experience: [], education: [], projects: [], certifications: [], achievements: [], keywords: [], languages: [],
  },
  cleaned: {
    personal_info: { full_name: "", headline: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "" },
    summary: "", skills: { technical: [], soft: [], tools: [], frameworks: [], cloud: [] },
    experience: [], education: [], projects: [], certifications: [], achievements: [], keywords: [], languages: [],
  },
  ats_score: { total: 0, breakdown: {}, missing_keywords: [], strengths: [], improvements: ["Complete your resume to get an ATS score"] },
  builder: { sections: [], editable: true, draggable: true },
  job_match: { score: 0, matched_skills: [], missing_skills: [] },
  templates: [
    { id: "template_1",  name: "Modern Sidebar",     layout: { columns: 2, header: true, sidebar: true  }, sections_order: ["personal","summary","experience","education","skills","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#4F46E5", secondary: "#1e1b4b", background: "#ffffff" }, recommended_for: "Software Engineers & Developers" },
    { id: "template_2",  name: "ATS Classic",        layout: { columns: 1, header: true, sidebar: false }, sections_order: ["personal","summary","experience","education","skills","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#5046e4", secondary: "#374151", background: "#ffffff" }, recommended_for: "ATS-Optimised & Corporate Roles" },
    { id: "template_4",  name: "Timeline Style",     layout: { columns: 1, header: true, sidebar: false }, sections_order: ["personal","summary","experience","education","skills","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#6366f1", secondary: "#374151", background: "#ffffff" }, recommended_for: "Career Progression & Academia" },
    { id: "template_6",  name: "Centered Avatar",    layout: { columns: 1, header: true, sidebar: false }, sections_order: ["personal","summary","experience","education","skills","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#4F46E5", secondary: "#374151", background: "#ffffff" }, recommended_for: "Product Managers & Generalists" },
    { id: "template_7",  name: "Left-Aligned Clean", layout: { columns: 2, header: true, sidebar: false }, sections_order: ["personal","summary","skills","experience","education","certifications","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#2563eb", secondary: "#1a1a1a", background: "#ffffff" }, recommended_for: "UX Designers & Creatives" },
    { id: "template_10", name: "Blue Card",          layout: { columns: 1, header: true, sidebar: false }, sections_order: ["personal","summary","education","experience","skills","projects"], style: { font: "Poppins", spacing: "normal", density: "comfortable" }, colors: { primary: "#1d4ed8", secondary: "#1f2937", background: "#ffffff" }, recommended_for: "Marketing & Business Professionals" },
    { id: "template_13", name: "Steel Blue",         layout: { columns: 2, header: true, sidebar: true  }, sections_order: ["personal","summary","education","experience","skills","projects"], style: { font: "Poppins", spacing: "normal", density: "comfortable" }, colors: { primary: "#4f78a8", secondary: "#3d3d3d", background: "#ffffff" }, recommended_for: "Managers & Corporate Professionals" },
    { id: "template_15", name: "Amber Classic",      layout: { columns: 2, header: true, sidebar: true  }, sections_order: ["personal","summary","experience","education","skills","certifications","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#b45309", secondary: "#1f2937", background: "#ffffff" }, recommended_for: "Marketing & Communications Professionals" },
    { id: "template_16", name: "Elegant Serif",      layout: { columns: 2, header: true, sidebar: true  }, sections_order: ["personal","summary","experience","education","skills","certifications","projects"], style: { font: "Georgia", spacing: "normal", density: "comfortable" }, colors: { primary: "#9b7a57", secondary: "#1f2937", background: "#f6f2ee" }, recommended_for: "Creative & Design Professionals" },
    { id: "template_17", name: "Dark Navy",          layout: { columns: 2, header: true, sidebar: true  }, sections_order: ["personal","summary","experience","education","skills","certifications","projects"], style: { font: "Arial", spacing: "normal", density: "comfortable" }, colors: { primary: "#243847", secondary: "#1f2937", background: "#ffffff" }, recommended_for: "Designers & Bold Creative Roles" },
    { id: "template_18", name: "Executive Classic",  layout: { columns: 2, header: true, sidebar: true  }, sections_order: ["personal","summary","experience","education","skills","certifications","achievements","projects"], style: { font: "Playfair Display", spacing: "normal", density: "comfortable" }, colors: { primary: "#1a1a2e", secondary: "#374151", background: "#e5e7eb" }, recommended_for: "Executives & Senior Professionals" },
    { id: "template_19", name: "Sidebar Modern",     layout: { columns: 2, header: true, sidebar: true  }, sections_order: ["personal","summary","skills","experience","education","certifications","achievements","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#374151", secondary: "#1f2937", background: "#e5e7eb" }, recommended_for: "Marketing & Creative Professionals" },
    { id: "template_20", name: "Gray Sidebar",       layout: { columns: 2, header: true, sidebar: true  }, sections_order: ["personal","summary","skills","experience","education","certifications","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#1f2937", secondary: "#374151", background: "#f3f4f6" }, recommended_for: "Sales & Business Professionals" },
    { id: "template_22", name: "Diamond Split",      layout: { columns: 2, header: true, sidebar: false }, sections_order: ["personal","summary","experience","education","skills","certifications","achievements","projects"], style: { font: "Inter", spacing: "normal", density: "comfortable" }, colors: { primary: "#111827", secondary: "#374151", background: "#f3f4f6" }, recommended_for: "Operations & Planning Professionals" },
    { id: "template_21", name: "Playfair Executive", layout: { columns: 3, header: true, sidebar: false }, sections_order: ["personal","summary","experience","education","skills","certifications","achievements","projects"], style: { font: "Playfair Display", spacing: "normal", density: "comfortable" }, colors: { primary: "#1a1a2e", secondary: "#374151", background: "#ffffff" }, recommended_for: "Executives & Administrative Professionals" },
  ],
};

// Mobile-specific sidebar drawer component
function MobileSidebar({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto">
            <div className="p-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
              <span className="font-semibold text-gray-800 text-sm">Settings & Templates</span>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

function BuilderInner() {
  const {
    buildResult, selectedTemplate, editedResume, isLoading, loadingStep, error,
    setBuildResult, setLoading, setLoadingStep, setError, reset,
    themeColor, fontFamily, fontSize, lastSaved,
  } = useResumeStore();

  const searchParams = useSearchParams();

  // Mobile: separate nav with bottom tabs
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "cover-letter" | "settings">("editor");
  const [pdfExporting, setPdfExporting] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalDragging, setModalDragging] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalLoadingStep, setModalLoadingStep] = useState(0);
  const [modalError, setModalError] = useState("");
  const [modalJobDescription, setModalJobDescription] = useState("");
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const themedTemplate = selectedTemplate ? {
    ...selectedTemplate,
    colors: { ...selectedTemplate.colors, primary: themeColor },
    style: {
      ...selectedTemplate.style,
      font: fontFamily,
      fontSize: fontSize === "compact" ? "9px" : fontSize === "large" ? "12px" : "10px",
    },
  } : null;

  useEffect(() => {
    if (buildResult) return; // already hydrated (e.g. from share param)

    // ── Version gate: clear stale cache from before template_8/12 removal ──
    const CACHE_VERSION = "v3";
    const cacheVersionKey = "resumai_cache_version";
    if (typeof window !== "undefined" && localStorage.getItem(cacheVersionKey) !== CACHE_VERSION) {
      clearStorage();
      localStorage.setItem(cacheVersionKey, CACHE_VERSION);
    }

    const saved = loadFromStorage();
    if (saved) {
      setBuildResult(saved.buildResult);
      // Restore UI preferences and the exact template the user had selected
      const store = useResumeStore.getState();
      store.setThemeColor(saved.themeColor);
      store.setFontFamily(saved.fontFamily);
      store.setFontSize(saved.fontSize);
      store.setProfilePhoto(saved.profilePhoto);
      store.setSectionOrder(saved.sectionOrder);
      // Restore selected template by id — fall back to first template if not found
      const REMOVED_TEMPLATES = ["template_8", "template_12", "template_23"];
      const resolvedId = REMOVED_TEMPLATES.includes(saved.selectedTemplateId) ? "template_1" : saved.selectedTemplateId;
      const tpl = saved.buildResult.templates?.find(t => t.id === resolvedId)
        ?? saved.buildResult.templates?.find(t => !REMOVED_TEMPLATES.includes(t.id))
        ?? null;
      if (tpl) store.setSelectedTemplate(tpl);
      // Restore the exact edited state (user's in-progress edits, not just cleaned)
      store.updateResume(saved.editedResume);
    } else {
      setBuildResult(BLANK_RESULT as Parameters<typeof setBuildResult>[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const shareParam = searchParams.get("share");
    if (!shareParam) return;
    try {
      const json = decodeURIComponent(atob(shareParam));
      const payload = JSON.parse(json);
      if (payload.buildResult) {
        setBuildResult(payload.buildResult);
        if (payload.templateId && payload.buildResult.templates) {
          const tpl = payload.buildResult.templates.find((t: { id: string }) => t.id === payload.templateId);
          if (tpl) useResumeStore.getState().setSelectedTemplate(tpl);
        }
      }
    } catch (e) { console.error("Failed to load shared resume", e); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!modalLoading) return;
    const iv = setInterval(() => setModalLoadingStep(s => s + 1), 1800);
    return () => clearInterval(iv);
  }, [modalLoading]);

  const handleModalFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) {
      setModalError("Only PDF and DOCX files are supported.");
      return;
    }
    setModalFile(f);
    setModalError("");
  };

  const handleModalBuild = async () => {
    if (!modalFile) return;
    setModalLoading(true);
    setModalLoadingStep(0);
    setModalError("");
    try {
      const fd = new FormData();
      fd.append("resume", modalFile);
      if (modalJobDescription.trim()) {
        fd.append("job_description", modalJobDescription.trim());
      }
      const res = await fetch("/api/build", { method: "POST", body: fd });

      // Guard: parse JSON safely
      let json: { success: boolean; error?: string; data?: unknown };
      try {
        json = await res.json();
      } catch {
        const text = await res.text().catch(() => "(no body)");
        setModalError(`Server returned invalid response (HTTP ${res.status}): ${text.slice(0, 200)}`);
        setModalLoading(false);
        return;
      }

      if (!json.success) {
        setModalError(json.error ?? `Build failed (HTTP ${res.status}). Please try again.`);
        setModalLoading(false);
      } else {
        setBuildResult(json.data as Parameters<typeof setBuildResult>[0]);
        setShowUploadModal(false);
        setModalFile(null);
        setModalLoading(false);
        setModalLoadingStep(0);
      }
    } catch (err) {
      // True network error (fetch itself failed — CORS, no connection, etc.)
      setModalError(`Request failed: ${err instanceof Error ? err.message : String(err)}`);
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    if (modalLoading) return;
    setShowUploadModal(false);
    setModalFile(null);
    setModalError("");
    setModalLoading(false);
    setModalLoadingStep(0);
    setModalJobDescription("");
  };

  const handleExportPDF = async () => {
    if (!editedResume || !themedTemplate || pdfExporting) return;
    setPdfExporting(true);
    try {
      await exportResumePDF(editedResume, themedTemplate, {}, previewRef.current ?? undefined);
    } finally { setPdfExporting(false); }
  };

  if (!buildResult || !editedResume || !selectedTemplate || !themedTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-gray-400 text-sm">Loading editor…</p>
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <SettingsPanel />
      {buildResult.templates?.length > 0 && <TemplateGallery templates={buildResult.templates} />}
      {buildResult.ats_score?.total > 0 && <ATSScorePanel score={buildResult.ats_score} />}
    </>
  );

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* Visually hidden H1 for SEO — screen readers and crawlers see this */}
      <h1 className="sr-only">LoveResume – Free AI Resume Builder with ATS Score &amp; Professional Templates</h1>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Logo + Name */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile: sidebar toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 flex-shrink-0"
              aria-label="Open settings"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <img src="/logo.png" alt="LoveResume Logo" className="w-7 h-7 object-contain" />
              <span className="font-bold text-sm text-gray-800">
                Love<span style={{ color: themeColor }}>Resume</span>
              </span>
            </div>

            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="font-medium text-xs text-gray-600 truncate max-w-[100px] sm:max-w-[180px] hidden sm:block">
              {editedResume.personal_info.full_name || "Untitled Resume"}
            </span>
            {buildResult.ats_score?.total > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold flex-shrink-0 hidden sm:inline" style={{ backgroundColor: themeColor + "15", color: themeColor }}>
                ATS: {buildResult.ats_score.total}
              </span>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved
              </span>
            )}
          </div>

          {/* Desktop Tab bar (hidden on mobile - shown via bottom nav) */}
          <div className="hidden md:flex items-center gap-1">
            {(["editor", "cover-letter", "preview"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={activeTab === tab ? { backgroundColor: themeColor, color: "white" } : { color: "#6b7280" }}>
                {tab === "cover-letter" ? "Cover Letter ✍️" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Upload - mobile shows icon only */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span className="hidden sm:inline">Upload</span>
            </button>

            {/* Reset - desktop only */}
            <button
              onClick={() => { clearStorage(); reset(); setBuildResult(BLANK_RESULT as Parameters<typeof setBuildResult>[0]); }}
              className="hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all items-center gap-1"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              Reset
            </button>

            {/* Download PDF */}
            <button onClick={handleExportPDF} disabled={pdfExporting}
              className="px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5 whitespace-nowrap"
              style={{ backgroundColor: pdfExporting ? themeColor + "80" : themeColor }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span className="hidden sm:inline">{pdfExporting ? "Exporting…" : "Download PDF"}</span>
              <span className="sm:hidden">{pdfExporting ? "…" : "PDF"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────────── */}
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)}>
        {sidebarContent}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <button
            onClick={() => { clearStorage(); reset(); setBuildResult(BLANK_RESULT as Parameters<typeof setBuildResult>[0]); setMobileSidebarOpen(false); }}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
            Reset Resume
          </button>
        </div>
      </MobileSidebar>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      {/* Desktop: 3-column grid; Mobile: single column with bottom nav */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-4 pb-24 lg:pb-4 lg:overflow-hidden">

        {/* Desktop: Editor tab shows full 3-col */}
        {activeTab === "editor" && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:items-start">
            {/* Left sidebar - desktop: fixed height, independently scrollable */}
            <div
              className="hidden lg:block lg:col-span-3 space-y-4 overflow-y-auto pr-1"
              style={{ position: "sticky", top: "60px", maxHeight: "calc(100vh - 72px)" }}
            >
              {sidebarContent}
            </div>

            {/* Middle: Editor - sticky & independently scrollable on desktop */}
            <div
              className="lg:col-span-5 overflow-y-auto"
              style={{ position: "sticky", top: "60px", maxHeight: "calc(100vh - 72px)" }}
            >
              <ResumeEditor />
            </div>

            {/* Right: Live Preview - desktop only */}
            <div
              className="hidden lg:block lg:col-span-4 overflow-y-auto"
              style={{ position: "sticky", top: "60px", maxHeight: "calc(100vh - 72px)" }}
            >
              <div className="space-y-3">
                <p className="text-xs text-gray-500 flex items-center justify-between">
                  <span className="font-medium">Live Preview · {selectedTemplate.name}</span>
                  <span className="text-gray-400">{selectedTemplate.style.font}</span>
                </p>
                <AnimatedPreview className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                  <ScaledPreview>
                    <ResumePreview
                      resume={editedResume} template={themedTemplate} fitToPage={false}
                      maxPages={2} showPageBreaks={false}
                    />
                  </ScaledPreview>
                </AnimatedPreview>
              </div>
            </div>

            {/* Mobile: compact preview card below editor */}
            <div className="lg:hidden">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-600">Live Preview</p>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className="text-xs font-medium px-3 py-1 rounded-lg"
                    style={{ backgroundColor: themeColor + "15", color: themeColor }}
                  >
                    Full Preview →
                  </button>
                </div>
                <AnimatedPreview className="rounded-xl overflow-hidden border border-gray-100">
                  <ScaledPreview maxHeight={260}>
                    <ResumePreview
                      resume={editedResume} template={themedTemplate} fitToPage={false}
                      maxPages={2} showPageBreaks={false}
                    />
                  </ScaledPreview>
                </AnimatedPreview>
              </div>
            </div>
          </div>
        )}

        {/* Settings tab (mobile only - same as sidebar) */}
        {activeTab === "settings" && (
          <div className="space-y-4 lg:hidden">
            {sidebarContent}
            <button
              onClick={() => { clearStorage(); reset(); setBuildResult(BLANK_RESULT as Parameters<typeof setBuildResult>[0]); }}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              Reset Resume
            </button>
          </div>
        )}

        {activeTab === "cover-letter" && (
          <div className="max-w-3xl mx-auto"><CoverLetterPanel /></div>
        )}

        {activeTab === "preview" && (() => {
          // A4 constants for real scaled thumbnails

          // Rich dummy data — every template thumbnail looks fully populated
          // regardless of whether the user has uploaded a resume yet.
          const THUMBNAIL_STUB: import("@/types/builder").ParsedResume = {
            personal_info: {
              full_name:  "Alexandra Morgan",
              headline:   "Senior Software Engineer · Full-Stack",
              email:      "alex.morgan@email.com",
              phone:      "+1 (555) 234-5678",
              location:   "San Francisco, CA",
              linkedin:   "linkedin.com/in/alexmorgan",
              github:     "github.com/alexmorgan",
              portfolio:  "alexmorgan.dev",
            },
            summary:
              "Results-driven Senior Software Engineer with 7+ years building scalable web applications and distributed systems. Led cross-functional teams delivering products used by 2M+ users. Deep expertise in React, Node.js, and cloud-native architecture. Passionate about clean code, performance optimisation, and mentoring junior engineers.",
            skills: {
              technical:  ["TypeScript", "Python", "Java", "SQL", "GraphQL", "REST APIs", "System Design"],
              frameworks: ["React", "Next.js", "Node.js", "Express", "FastAPI", "Spring Boot", "Redux"],
              tools:      ["Git", "Docker", "Kubernetes", "Terraform", "Figma", "Jira", "Postman"],
              cloud:      ["AWS (EC2, S3, Lambda, RDS)", "GCP", "Vercel", "CI/CD Pipelines"],
              soft:       ["Technical Leadership", "Agile / Scrum", "Cross-team Collaboration", "Mentoring"],
            },
            experience: [
              {
                title:       "Senior Software Engineer",
                company:     "Stripe",
                location:    "San Francisco, CA",
                start_date:  "Jan 2021",
                end_date:    "Present",
                is_current:  true,
                responsibilities: [
                  "Architected and shipped a real-time payment reconciliation dashboard reducing manual ops work by 60%.",
                  "Led a team of 5 engineers to migrate legacy PHP monolith to microservices (Node.js + Kubernetes).",
                  "Drove adoption of TypeScript across 3 product squads, cutting runtime errors by 40%.",
                  "Designed GraphQL federation layer serving 15,000 RPS with p99 latency under 80 ms.",
                ],
                achievements: ["Promoted from Mid to Senior in 14 months", "Tech lead for Stripe Billing v3"],
                technologies: ["TypeScript", "React", "Node.js", "Kubernetes", "PostgreSQL", "GraphQL"],
              },
              {
                title:       "Software Engineer",
                company:     "Airbnb",
                location:    "San Francisco, CA",
                start_date:  "Jun 2018",
                end_date:    "Dec 2020",
                is_current:  false,
                responsibilities: [
                  "Built and maintained core search ranking pipeline processing 500K+ queries/day in Python.",
                  "Improved page load time by 35% through code-splitting, lazy loading, and CDN optimisation.",
                  "Collaborated with Design to deliver a redesigned listing page increasing bookings by 12%.",
                  "Wrote comprehensive unit and integration tests, raising coverage from 62% to 89%.",
                ],
                achievements: ["Won internal hackathon 2019 — Instant Book feature", "3× Peer Bonus recipient"],
                technologies: ["Python", "React", "Django", "Redis", "Elasticsearch", "AWS"],
              },
            ],
            education: [
              {
                degree:      "Bachelor of Science",
                field:       "Computer Science",
                institution: "UC Berkeley",
                start_year:  "2014",
                end_year:    "2018",
              },
            ],
            projects: [
              {
                name:         "OpenMetrics Dashboard",
                description:  "Open-source real-time analytics dashboard with WebSocket streaming, built with Next.js and D3.js. 1.2K GitHub stars.",
                technologies: ["Next.js", "TypeScript", "D3.js", "WebSockets", "PostgreSQL"],
                link:         "github.com/alexmorgan/openmetrics",
              },
              {
                name:         "AI Code Reviewer",
                description:  "VS Code extension using GPT-4 to perform inline code reviews and suggest refactors. 800+ installs on Marketplace.",
                technologies: ["TypeScript", "OpenAI API", "VS Code API"],
                link:         "marketplace.visualstudio.com/alexmorgan",
              },
              {
                name:         "QuickDeploy CLI",
                description:  "CLI tool to scaffold and deploy full-stack apps to AWS in under 2 minutes using Terraform and GitHub Actions.",
                technologies: ["Go", "Terraform", "AWS", "GitHub Actions"],
                link:         "github.com/alexmorgan/quickdeploy",
              },
            ],
            certifications: [
              "AWS Certified Solutions Architect – Associate (2023)",
              "Google Cloud Professional Data Engineer (2022)",
              "Certified Kubernetes Administrator – CKA (2021)",
            ],
            achievements: [
              "Speaker at ReactConf 2023 — 'Scaling React at Stripe'",
              "Contributed 12 merged PRs to the Next.js open-source project",
            ],
            keywords: ["Full-Stack", "React", "Node.js", "TypeScript", "AWS", "System Design", "Team Lead"],
            languages: ["English (Native)", "Spanish (Conversational)"],
          };

          // Use user's real resume for thumbnails if available, otherwise use the rich stub
          const previewStub = (editedResume?.personal_info?.full_name) ? editedResume : THUMBNAIL_STUB;

          const PREVIEW_LABELS: Record<string, { label: string; sub: string }> = {
            template_1:  { label: "Modern",     sub: "Professional" },
            template_2:  { label: "Classic",    sub: "ATS-Friendly" },
            template_4:  { label: "Timeline",   sub: "Simple"       },
            template_6:  { label: "Centered",   sub: "Modern"       },
            template_7:  { label: "Left",       sub: "Clean"        },
            template_10: { label: "Blue",       sub: "Professional" },
            template_13: { label: "Steel Blue", sub: "Corporate"    },
            template_15: { label: "Amber",      sub: "Marketing"    },
            template_16: { label: "Serif",      sub: "Creative"     },
            template_17: { label: "Dark Navy",  sub: "Bold"         },
            template_18: { label: "Executive",  sub: "Classic"      },
            template_19: { label: "Sidebar",    sub: "Modern"       },
            template_20: { label: "Gray Sidebar", sub: "Sales"      },
            template_21: { label: "Playfair", sub: "Executive" },
            template_22: { label: "Diamond Split", sub: "Operations" },
          };

          return (
            <div className="flex flex-col lg:flex-row gap-5 max-w-screen-xl mx-auto">

              {/* ── LEFT PANEL: Template picker — 2-col large thumbnails ── */}
              <div className="lg:w-[380px] xl:w-[420px] flex-shrink-0">
                <div className="sticky top-20">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-800">Choose Template</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{buildResult.templates?.length ?? 0} designs available</p>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                        style={{ backgroundColor: themeColor + "15", color: themeColor }}>
                        {selectedTemplate.name.split(" ")[0]}
                      </span>
                    </div>

                    {/* 2-col large-thumbnail grid */}
                    <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[75vh] pr-0.5">
                      {buildResult.templates?.filter(tpl => !["template_8", "template_12"].includes(tpl.id)).map((tpl, idx) => {
                        const isSelected = selectedTemplate.id === tpl.id;
                        const meta = PREVIEW_LABELS[tpl.id] ?? { label: tpl.name.split(" ")[0], sub: "" };
                        const tplWithTheme = { ...tpl, colors: { ...tpl.colors, primary: isSelected ? themeColor : tpl.colors.primary } };

                        return (
                          <button
                            key={tpl.id}
                            onClick={() => useResumeStore.getState().setSelectedTemplate(tpl)}
                            className="relative rounded-xl text-left border transition-all duration-200 group overflow-hidden"
                            style={isSelected
                              ? { borderColor: themeColor, boxShadow: `0 0 0 2px ${themeColor}` }
                              : { borderColor: "#e5e7eb" }}
                          >
                            {/* Thumbnail — natural height, ScaledPreview sizes to content */}
                            <div className="w-full overflow-hidden relative"
                              style={{ backgroundColor: tpl.colors.background }}>
                              <ScaledPreview>
                                <ResumePreview
                                  resume={previewStub}
                                  template={tplWithTheme}
                                  fitToPage={false}
                                  showPageBreaks={false}
                                  forExport={false}
                                />
                              </ScaledPreview>

                              {/* Hover overlay */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center"
                                style={{ backgroundColor: "rgba(0,0,0,0.18)" }}>
                                <span className="text-white text-[10px] font-bold px-3 py-1 rounded-full"
                                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>Use This</span>
                              </div>

                              {/* Selected checkmark */}
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
                                  style={{ backgroundColor: themeColor }}>
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              )}

                              {/* Number badge — bottom-left */}
                              <div className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center text-white font-black shadow"
                                style={{ fontSize: "9px", backgroundColor: isSelected ? themeColor : "rgba(0,0,0,0.45)" }}>
                                {idx + 1}
                              </div>
                            </div>

                            {/* Label row */}
                            <div className="px-2.5 py-2" style={{ backgroundColor: isSelected ? themeColor + "08" : "#fafafa" }}>
                              <p className="text-[11px] font-bold leading-tight truncate"
                                style={{ color: isSelected ? themeColor : "#374151" }}>{meta.label}</p>
                              <p className="text-[9px] truncate mt-0.5"
                                style={{ color: isSelected ? themeColor + "aa" : "#9ca3af" }}>{meta.sub}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT PANEL: Full live resume preview ── */}
              <div className="flex-1 min-w-0">
                <div className="lg:sticky lg:top-20">
                  {/* Info bar */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {selectedTemplate.name}
                        <span className="ml-2 text-xs font-normal text-gray-400">· {selectedTemplate.style.font}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Live preview · Download using the button above</p>
                    </div>
                    {buildResult.ats_score?.total > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ backgroundColor: themeColor + "15", color: themeColor }}>
                          ATS {buildResult.ats_score.total}/100
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resume preview card — scales A4 content to fit the panel width */}
                  <AnimatedPreview className="rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white">
                    <ScaledPreview>
                      <div ref={previewRef}>
                        <ResumePreview
                          resume={editedResume}
                          template={themedTemplate}
                          fitToPage={false}
                          showPageBreaks={true}
                        />
                      </div>
                    </ScaledPreview>
                  </AnimatedPreview>
                </div>
              </div>

            </div>
          );
        })()}
      </div>

      {/* ── Hidden export-ready preview (always mounted, off-screen) ────────
           exportResumePDF clones #resume-preview to generate the PDF.
           By keeping this permanently in the DOM we guarantee the correct
           template is captured regardless of which tab the user is on.        */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", top: "-99999px", left: "-99999px", pointerEvents: "none", zIndex: -1, width: "794px" }}
      >
        <div id="resume-preview">
          <ResumePreview
            resume={editedResume}
            template={themedTemplate}
            fitToPage={false}
            showPageBreaks={false}
            forExport={true}
          />
        </div>
      </div>

      {/* ── Mobile Bottom Navigation ──────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {([
            { id: "editor", icon: "✏️", label: "Editor" },
            { id: "settings", icon: "⚙️", label: "Settings" },
            { id: "preview", icon: "👁", label: "Preview" },
            { id: "cover-letter", icon: "✍️", label: "Cover" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[60px]"
              style={activeTab === tab.id ? { backgroundColor: themeColor + "12" } : {}}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[10px] font-medium" style={activeTab === tab.id ? { color: themeColor } : { color: "#9ca3af" }}>
                {tab.label}
              </span>
            </button>
          ))}

          {/* PDF download */}
          <button
            onClick={handleExportPDF}
            disabled={pdfExporting}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[60px]"
          >
            <span className="text-lg leading-none">📥</span>
            <span className="text-[10px] font-medium text-gray-400">{pdfExporting ? "…" : "PDF"}</span>
          </button>
        </div>
      </div>

      {/* ── Upload Modal ─────────────────────────────────────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          {/* Sheet on mobile, centered modal on desktop */}
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
            {/* Handle bar on mobile */}
            <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

            {/* ── Loading state ── */}
            {modalLoading ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5">
                  <div className="w-full h-full rounded-full flex items-center justify-center"
                    style={{ backgroundColor: themeColor + "15", border: `2px solid ${themeColor}30` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: themeColor + "25" }}>
                      <div className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor + "90" }} />
                    </div>
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2s" }}>
                    <div className="w-2.5 h-2.5 rounded-full absolute -top-1 left-1/2 -translate-x-1/2"
                      style={{ backgroundColor: themeColor }} />
                  </div>
                </div>

                <h3 className="text-gray-800 font-bold text-base sm:text-lg mb-1">Processing Resume</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-5">AI is parsing and building your editor</p>

                <div className="space-y-2 text-left">
                  {UPLOAD_LOADING_STEPS.map((step, i) => {
                    const cur = modalLoadingStep % UPLOAD_LOADING_STEPS.length;
                    const isActive = i === cur;
                    const isDone = i < cur;
                    return (
                      <div key={i}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${isActive ? "bg-gray-50 border" : isDone ? "opacity-40" : "opacity-15"}`}
                        style={isActive ? { borderColor: themeColor + "40" } : {}}>
                        <div className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center"
                          style={isActive ? { borderColor: themeColor } : isDone ? { borderColor: "#22c55e", backgroundColor: "#f0fdf4" } : { borderColor: "#d1d5db" }}>
                          {isDone
                            ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            : isActive ? <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} /> : null}
                        </div>
                        <span className={`text-xs ${isActive ? "text-gray-700 font-medium" : "text-gray-400"}`}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-5 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-gray-800 font-bold text-base">Upload Resume</h3>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {modalJobDescription.trim().length > 20
                        ? "AI will tailor your resume to the job description"
                        : "AI will parse and populate your editor"}
                    </p>
                  </div>
                  <button onClick={closeModal}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all text-gray-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <div className="p-5 sm:p-6">
                  <div
                    onDragOver={e => { e.preventDefault(); setModalDragging(true); }}
                    onDragLeave={() => setModalDragging(false)}
                    onDrop={e => { e.preventDefault(); setModalDragging(false); const f = e.dataTransfer.files[0]; if (f) handleModalFile(f); }}
                    onClick={() => modalFileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-7 sm:p-8 text-center cursor-pointer transition-all duration-200"
                    style={modalDragging
                      ? { borderColor: themeColor, backgroundColor: themeColor + "08" }
                      : modalFile
                        ? { borderColor: "#22c55e", backgroundColor: "#f0fdf4" }
                        : { borderColor: "#e5e7eb", backgroundColor: "#fafafa" }}
                  >
                    <input
                      ref={modalFileInputRef} type="file" accept=".pdf,.docx" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleModalFile(f); }}
                    />

                    {modalFile ? (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                        <p className="text-green-600 font-semibold text-sm">{modalFile.name}</p>
                        <p className="text-gray-400 text-xs mt-1">{(modalFile.size / 1024).toFixed(0)} KB · Tap to change</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                          style={{ backgroundColor: themeColor + "15" }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                        </div>
                        <p className="text-gray-700 font-semibold text-sm">Drop or tap to select</p>
                        <p className="text-gray-400 text-xs mt-1">
                          <span className="underline" style={{ color: themeColor }}>Browse files</span>
                        </p>
                        <div className="flex justify-center gap-2 mt-3">
                          {[".pdf", ".docx"].map(ext => (
                            <span key={ext} className="px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-gray-500 text-xs font-mono">{ext}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── Job Description (optional) ── */}
                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                      <span style={{ color: themeColor }}>✦</span>
                      Job Description
                      <span className="font-normal text-gray-400">(optional — AI will tailor your resume to this role)</span>
                    </label>
                    <textarea
                      value={modalJobDescription}
                      onChange={e => setModalJobDescription(e.target.value)}
                      placeholder="Paste the job description here — role, responsibilities, required skills…&#10;&#10;e.g. 'We are looking for a Video Editor with experience in Reels, Shorts, Adobe Premiere Pro, storytelling and social media content creation...'"
                      rows={5}
                      className="w-full rounded-xl border text-xs text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 transition-all"
                      style={{
                        padding: "10px 12px",
                        borderColor: modalJobDescription.trim() ? themeColor + "60" : "#e5e7eb",
                        backgroundColor: modalJobDescription.trim() ? themeColor + "04" : "#fafafa",
                        lineHeight: "1.6",
                        ["--tw-ring-color" as string]: themeColor + "40",
                      } as React.CSSProperties}
                    />
                    {modalJobDescription.trim().length > 20 && (
                      <p className="mt-1.5 text-[10px] flex items-center gap-1" style={{ color: themeColor }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        AI will rewrite your resume summary, skills & bullets to target this role
                      </p>
                    )}
                  </div>

                  {modalError && (
                    <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
                      <span className="flex-shrink-0">⚠</span><span>{modalError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button onClick={closeModal}
                      className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                      Cancel
                    </button>
                    <button
                      onClick={handleModalBuild}
                      disabled={!modalFile}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                      style={modalFile ? { backgroundColor: themeColor, boxShadow: `0 4px 14px ${themeColor}40` } : { backgroundColor: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                      {modalJobDescription.trim().length > 20 ? "Tailor Resume to JD" : "Build with AI"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-gray-400 text-sm">Loading editor…</p>
          </div>
        </div>
      }
    >
      <BuilderInner />
    </Suspense>
  );
}
