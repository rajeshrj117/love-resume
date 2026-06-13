"use client";
import { useState, useRef, useCallback } from "react";
import { useResumeStore } from "@/store/resumeStore";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CoverLetterParagraph {
  id: string;
  label: string;
  text: string;
}

interface CoverLetterData {
  subject_line: string;
  salutation: string;
  paragraphs: CoverLetterParagraph[];
  sign_off: string;
  metadata: {
    word_count: number;
    tone: string;
    top_keywords_used: string[];
    customization_score: number;
  };
}

// ─── Tone options ─────────────────────────────────────────────────────────────
const TONES = [
  { id: "Professional",  icon: "👔", desc: "Formal, polished" },
  { id: "Enthusiastic",  icon: "🚀", desc: "Energetic, passionate" },
  { id: "Concise",       icon: "⚡", desc: "Direct, to the point" },
  { id: "Storytelling",  icon: "📖", desc: "Narrative, engaging" },
  { id: "Executive",     icon: "🏛️",  desc: "Senior, strategic" },
  { id: "Creative",      icon: "🎨", desc: "Bold, distinctive" },
];

// ─── Paragraph editor row ─────────────────────────────────────────────────────
function ParagraphRow({
  para,
  onChange,
}: {
  para: CoverLetterParagraph;
  onChange: (text: string) => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  const resize = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, []);

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${focused ? "border-blue-400 shadow-md shadow-blue-100" : "border-gray-200"}`}>
      {/* Label bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-mono font-semibold text-blue-600">{para.label}</span>
        <span className="text-[10px] text-gray-400 font-mono">
          {para.text.split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
      <textarea
        ref={taRef}
        value={para.text}
        rows={4}
        onChange={e => { onChange(e.target.value); resize(); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-white px-4 py-3 text-gray-700 text-sm leading-relaxed resize-none focus:outline-none placeholder-gray-300"
        style={{ minHeight: "96px" }}
      />
    </div>
  );
}

// ─── Preview modal ────────────────────────────────────────────────────────────
function LetterPreview({
  letter,
  name,
  onClose,
}: {
  letter: CoverLetterData;
  name: string;
  onClose: () => void;
}) {
  const full = [
    letter.salutation,
    "",
    ...letter.paragraphs.map(p => p.text),
    "",
    letter.sign_off,
    name,
  ].join("\n");

  const copyAll = async () => {
    await navigator.clipboard.writeText(full);
  };

  const downloadTxt = () => {
    const blob = new Blob([full], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover_letter_${name.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-gray-800 font-bold text-sm">Cover Letter Preview</h3>
            <p className="text-gray-400 text-xs font-mono mt-0.5">{letter.subject_line}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyAll}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 transition-all">
              Copy
            </button>
            <button onClick={downloadTxt}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all">
              ↓ .txt
            </button>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all flex items-center justify-center text-sm">
              ✕
            </button>
          </div>
        </div>

        {/* Letter body */}
        <div className="overflow-y-auto flex-1 p-6 bg-gray-50">
          {/* A4-style card */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="text-gray-800 font-serif" style={{ fontFamily: "Georgia, serif" }}>
              <p className="text-sm font-semibold text-gray-400 mb-4 font-sans" style={{ fontFamily: "sans-serif" }}>
                {letter.subject_line}
              </p>
              <p className="text-sm mb-4">{letter.salutation}</p>
              {letter.paragraphs.map(p => (
                <p key={p.id} className="text-sm leading-relaxed mb-4 text-gray-700">{p.text}</p>
              ))}
              <p className="text-sm mt-6 mb-1">{letter.sign_off}</p>
              <p className="text-sm font-semibold">{name}</p>
            </div>
          </div>

          {/* Metadata strip */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm">
              <div className="text-lg font-bold text-blue-600">{letter.metadata.word_count}</div>
              <div className="text-xs text-gray-400 font-mono">words</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm">
              <div className="text-lg font-bold text-green-600">{letter.metadata.customization_score}<span className="text-xs text-gray-400">/10</span></div>
              <div className="text-xs text-gray-400 font-mono">customization</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-gray-200 shadow-sm">
              <div className="text-sm font-bold text-blue-600">{letter.metadata.tone}</div>
              <div className="text-xs text-gray-400 font-mono">tone</div>
            </div>
          </div>

          {letter.metadata.top_keywords_used?.length > 0 && (
            <div className="mt-3 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-400 font-mono mb-2">Keywords used:</p>
              <div className="flex flex-wrap gap-1.5">
                {letter.metadata.top_keywords_used.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 text-xs rounded-full font-mono">{kw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main CoverLetterPanel ────────────────────────────────────────────────────
export default function CoverLetterPanel() {
  const { editedResume, buildResult } = useResumeStore();

  // Form state
  const [tone, setTone]                     = useState("Professional");
  const [companyName, setCompanyName]       = useState("");
  const [roleName, setRoleName]             = useState("");
  const [jobDescription, setJobDescription] = useState(buildResult?.job_match ? "" : "");
  const [customInstructions, setCustomInstructions] = useState("");

  // Generation state
  const [generating, setGenerating]         = useState(false);
  const [error, setError]                   = useState("");
  const [letter, setLetter]                 = useState<CoverLetterData | null>(null);
  const [showPreview, setShowPreview]       = useState(false);
  const [copied, setCopied]                 = useState(false);

  const name = editedResume?.personal_info?.full_name || "Candidate";

  const generate = async () => {
    if (!editedResume) return;
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: editedResume,
          tone,
          companyName,
          roleName,
          jobDescription,
          customInstructions,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Generation failed");
      setLetter(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const updateParagraph = (id: string, text: string) => {
    if (!letter) return;
    setLetter({
      ...letter,
      paragraphs: letter.paragraphs.map(p => p.id === id ? { ...p, text } : p),
    });
  };

  const fullText = letter
    ? [
        letter.salutation,
        "",
        ...letter.paragraphs.map(p => p.text),
        "",
        letter.sign_off,
        name,
      ].join("\n")
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover_letter_${name.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!editedResume) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Load a resume first to generate a cover letter.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showPreview && letter && (
        <LetterPreview letter={letter} name={name} onClose={() => setShowPreview(false)} />
      )}

      {/* ── Config card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
          <span className="text-lg">✍️</span>
          <div>
            <h3 className="text-gray-800 font-bold text-sm">Cover Letter Generator</h3>
            <p className="text-gray-400 text-xs">AI-tailored to your resume · Fully editable</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Tone selector */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">Tone & Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setTone(t.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    tone === t.id
                      ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}>
                  <span className="text-base flex-shrink-0">{t.icon}</span>
                  <div>
                    <div className="text-xs font-semibold leading-tight">{t.id}</div>
                    <div className="text-[10px] opacity-70 leading-tight">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Company Name</label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Notion..."
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder-gray-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Role / Position</label>
              <input
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                placeholder="e.g. Senior Engineer..."
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder-gray-300"
              />
            </div>
          </div>

          {/* Job description */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              Job Description <span className="text-gray-300">(optional — improves keyword matching)</span>
            </label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job posting here for a highly tailored letter..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all resize-none placeholder-gray-300"
            />
          </div>

          {/* Custom instructions */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">
              Special Instructions <span className="text-gray-300">(optional)</span>
            </label>
            <input
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder="e.g. Emphasize leadership, mention relocation, keep under 300 words..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all placeholder-gray-300"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 ${
              generating
                ? "bg-blue-400 text-white cursor-wait"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:-translate-y-0.5"
            }`}>
            {generating ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Writing your cover letter…
              </>
            ) : (
              <>
                <span>✍️</span>
                {letter ? "Regenerate Cover Letter" : "Generate Cover Letter"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Generated letter editor ── */}
      {letter && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-800 font-bold text-sm">Your Cover Letter</span>
              <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-mono">
                {letter.metadata.word_count}w
              </span>
              <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full font-mono">
                {letter.metadata.tone}
              </span>
              {letter.metadata.customization_score >= 7 && (
                <span className="text-xs bg-blue-100 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
                  ⚡ {letter.metadata.customization_score}/10 match
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  copied ? "border-green-400 text-green-600 bg-green-50" : "border-gray-200 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50"
                }`}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button onClick={handleDownload}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                ↓ .txt
              </button>
              <button onClick={() => setShowPreview(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all">
                Preview →
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Subject line */}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Subject Line</label>
              <input
                value={letter.subject_line}
                onChange={e => setLetter({ ...letter, subject_line: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all font-semibold"
              />
            </div>

            {/* Salutation */}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Salutation</label>
              <input
                value={letter.salutation}
                onChange={e => setLetter({ ...letter, salutation: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>

            {/* Paragraphs */}
            <div className="space-y-3">
              {letter.paragraphs.map(para => (
                <ParagraphRow
                  key={para.id}
                  para={para}
                  onChange={text => updateParagraph(para.id, text)}
                />
              ))}
            </div>

            {/* Sign-off + name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Sign-off</label>
                <input
                  value={letter.sign_off}
                  onChange={e => setLetter({ ...letter, sign_off: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Your Name</label>
                <input
                  value={name}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                  title="Edit your name in the Personal section"
                />
              </div>
            </div>

            {/* Keywords used */}
            {letter.metadata.top_keywords_used?.length > 0 && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-[10px] text-green-600 font-mono mb-2">✓ Keywords woven in:</p>
                <div className="flex flex-wrap gap-1.5">
                  {letter.metadata.top_keywords_used.map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white text-green-700 border border-green-200 text-[10px] rounded-full font-mono">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Tip strip */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="text-blue-500 text-sm flex-shrink-0">💡</span>
              <p className="text-[11px] text-blue-600 leading-relaxed">
                Each paragraph is editable above. Click <strong>Preview →</strong> to see the formatted letter, or <strong>Copy</strong> to paste directly into your email or application portal.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
