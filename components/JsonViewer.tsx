"use client";

import { useState } from "react";
import { ResumeData } from "@/types/resume";

interface JsonViewerProps {
  data: ResumeData;
}

export default function JsonViewer({ data }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"formatted" | "raw">("formatted");

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-${data.personal_info.name.replace(/\s+/g, "_") || "parsed"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-stone-700 bg-stone-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-700 bg-stone-800/60">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("formatted")}
            className={`px-4 py-1.5 text-xs font-mono rounded-lg transition-all ${
              activeTab === "formatted"
                ? "bg-amber-500 text-stone-900 font-bold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Formatted
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-4 py-1.5 text-xs font-mono rounded-lg transition-all ${
              activeTab === "raw"
                ? "bg-amber-500 text-stone-900 font-bold"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Raw JSON
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 border ${
              copied
                ? "bg-green-900/40 border-green-600 text-green-400"
                : "bg-stone-700/60 border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-white"
            }`}
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-500 text-stone-900 hover:bg-amber-400 transition-all duration-200 font-bold"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "raw" ? (
        <pre className="p-5 text-xs font-mono text-stone-300 overflow-auto max-h-[600px] leading-relaxed">
          <SyntaxHighlight json={jsonString} />
        </pre>
      ) : (
        <div className="p-5 space-y-6 max-h-[600px] overflow-auto">
          <FormattedView data={data} />
        </div>
      )}
    </div>
  );
}

function SyntaxHighlight({ json }: { json: string }) {
  const highlighted = json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = "text-amber-300";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = "text-sky-400";
        else cls = "text-green-300";
      } else if (/true|false/.test(match)) cls = "text-purple-400";
      else if (/null/.test(match)) cls = "text-red-400";
      return `<span class="${cls}">${match}</span>`;
    });
  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

function FormattedView({ data }: { data: ResumeData }) {
  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <Section title="Personal Info" icon="👤">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(data.personal_info).map(([k, v]) => (
            <div key={k} className="bg-stone-800/60 rounded-xl p-3">
              <p className="text-stone-500 text-xs font-mono mb-1">{k}</p>
              <p className="text-stone-200 text-sm">{v || <em className="text-stone-600">—</em>}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Skills */}
      {data.skills.length > 0 && (
        <Section title="Skills" icon="⚡">
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-amber-950/40 text-amber-300 text-xs font-mono rounded-full border border-amber-800/50">
                {skill}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <Section title="Experience" icon="💼">
          <div className="space-y-3">
            {data.experience.map((exp, i) => (
              <div key={i} className="bg-stone-800/60 rounded-xl p-4 border-l-2 border-amber-600/40">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <p className="text-stone-200 font-semibold text-sm">{exp.role}</p>
                    <p className="text-amber-500/80 text-xs font-mono">{exp.company}</p>
                  </div>
                  <span className="text-stone-500 text-xs font-mono bg-stone-900 px-2 py-1 rounded-lg">{exp.duration}</span>
                </div>
                {exp.description && (
                  <p className="text-stone-400 text-xs leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <Section title="Education" icon="🎓">
          <div className="space-y-3">
            {data.education.map((edu, i) => (
              <div key={i} className="bg-stone-800/60 rounded-xl p-4 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <p className="text-stone-200 font-semibold text-sm">{edu.degree}</p>
                  <p className="text-stone-400 text-xs">{edu.institution}</p>
                </div>
                <span className="text-stone-500 text-xs font-mono bg-stone-900 px-2 py-1 rounded-lg">{edu.year}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <Section title="Projects" icon="🛠">
          <div className="space-y-3">
            {data.projects.map((proj, i) => (
              <div key={i} className="bg-stone-800/60 rounded-xl p-4">
                <p className="text-stone-200 font-semibold text-sm mb-1">{proj.name}</p>
                {proj.description && (
                  <p className="text-stone-400 text-xs leading-relaxed mb-3">{proj.description}</p>
                )}
                {proj.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {proj.tech_stack.map((tech, j) => (
                      <span key={j} className="px-2 py-0.5 bg-sky-950/50 text-sky-400 text-xs font-mono rounded border border-sky-800/40">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <h3 className="text-stone-300 font-semibold text-sm tracking-wide uppercase font-mono">{title}</h3>
      </div>
      {children}
    </div>
  );
}
