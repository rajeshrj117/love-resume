"use client";
import { useEffect } from "react";
import { ParsedResume, Template } from "@/types/builder";
import { A4_HEIGHT_PX } from "@/hooks/usePageFit";
import { useResumeStore } from "@/store/resumeStore";
import { RichText } from "@/components/builder/BulletEditor";

interface Props {
  resume: ParsedResume;
  template: Template;
  fitToPage?: boolean;
  maxPages?: 1 | 2;
  scaleOverride?: number;
  showPageBreaks?: boolean;
  forExport?: boolean;
}

export default function ResumePreview({
  resume,
  template,
  fitToPage = false,
  maxPages = 1,
  scaleOverride,
  showPageBreaks = true,
  forExport = false,
}: Props) {
  const sectionOrder = useResumeStore(s => s.sectionOrder);
  const profilePhoto = useResumeStore(s => s.profilePhoto);
  const { colors } = template;

  // Dynamically load Google Font whenever font changes
  useEffect(() => {
    const font = template.style?.font;
    if (!font || font === "sans-serif" || font === "serif") return;
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;900&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);


  const fitScale =
    fitToPage && scaleOverride !== undefined && scaleOverride < 1
      ? scaleOverride
      : 1;

  // Font size scaling: compact=0.9x, normal=1x, large=1.15x
  // Use transform:scale so all hardcoded px children scale proportionally.
  // html2canvas supports transform:scale unlike CSS zoom.
  const fontSizeStr = (template.style?.fontSize) ?? "10px";
  const fontScale = fontSizeStr === "9px" ? 0.9 : fontSizeStr === "12px" ? 1.15 : 1;
  const scale = fitScale;

  const wrapperStyle: React.CSSProperties =
    fitToPage && scale < 1
      ? {
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          width: `${100 / scale}%`,
          height: `${A4_HEIGHT_PX * (maxPages === 2 ? 2 : 1) * scale}px`,
          overflow: "hidden",
        }
      : {};

  // Font-size scale wrapper style (separate from fitToPage scale)
  // CSS transform:scale doesn't affect layout flow — the wrapper keeps its
  // pre-scale height and scaled content bleeds out the bottom with no spacing.
  // We compensate by adding paddingBottom = (fontScale - 1) × natural height.
  // Since we don't know natural height at render time we use a percentage trick:
  // a 1px-high child scaled by S overflows by (S-1)px, so for the full content
  // we add paddingBottom of (fontScale - 1) * 100% relative to the width —
  // but that's wrong for height. Instead we wrap in a div that sets its own
  // height via a post-scale inline style set by a ref, OR simplest: just use
  // `zoom` for non-export contexts (zoom DOES affect layout) and keep
  // transform:scale only for forExport (html2canvas).
  const fontScaleStyle: React.CSSProperties = fontScale !== 1
    ? forExport
      ? {
          // html2canvas path: transform (zoom not supported by html2canvas)
          transformOrigin: "top left",
          transform: `scale(${fontScale})`,
          width: `${100 / fontScale}%`,
        }
      : {
          // Browser preview path: zoom affects layout flow, no clipping
          zoom: fontScale,
        }
    : {};

  // ── Normalise AI output that sometimes returns objects instead of strings ──
  // The AI occasionally returns certifications/achievements as {name, date}
  // objects instead of plain strings. Coerce everything to a string here once
  // so no template component ever receives a non-string array element.
  function toStr(val: unknown): string {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") {
      const o = val as Record<string, unknown>;
      // {name, date} → "name (date)"  |  {name} → "name"  |  {title} → "title"
      const label = (o.name ?? o.title ?? o.label ?? o.text ?? "") as string;
      const extra = (o.date ?? o.issued ?? o.year ?? o.issuer ?? "") as string;
      return extra ? `${label} (${extra})` : label || JSON.stringify(val);
    }
    return String(val ?? "");
  }

  const safeResume: typeof resume = {
    ...resume,
    summary: resume.summary ?? "",
    experience:     (resume.experience     ?? []),
    education:      (resume.education      ?? []),
    projects:       (resume.projects       ?? []),
    certifications: (resume.certifications ?? []).map(toStr),
    achievements:   (resume.achievements   ?? []).map(toStr),
    keywords:       (resume.keywords       ?? []).map(toStr),
    languages:      (resume.languages      ?? []).map(toStr),
    skills: {
      technical:  (resume.skills?.technical  ?? []).map(toStr),
      frameworks: (resume.skills?.frameworks ?? []).map(toStr),
      tools:      (resume.skills?.tools      ?? []).map(toStr),
      cloud:      (resume.skills?.cloud      ?? []).map(toStr),
      soft:       (resume.skills?.soft       ?? []).map(toStr),
    },
  };

  const seen = new Set<string>();
  const allSkills = [
    ...safeResume.skills.technical,
    ...safeResume.skills.frameworks,
    ...safeResume.skills.tools,
    ...safeResume.skills.cloud,
  ].filter((sk) => {
    const key = sk.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const renderLayout = () => {
    switch (template.id) {
      case "template_1":  return <Template1  resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_2":  return <Template2  resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_4":  return <Template4  resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_6":  return <Template6  resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_7":  return <Template7  resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_10": return <Template10 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_13": return <Template13 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_14": return <Template14 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_15": return <Template15 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_16": return <Template16 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_17": return <Template17 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_18": return <Template18 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_19": return <Template19 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_20": return <Template20 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_21": return <Template21 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      case "template_22": return <Template22 resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
      default:            return <Template1  resume={safeResume} template={template} allSkills={allSkills} sectionOrder={sectionOrder} profilePhoto={profilePhoto} forExport={forExport} />;
    }
  };

  // When exporting, skip all scaling wrappers so html2canvas captures full content
  if (forExport) {
    return (
      <div
        style={{
          backgroundColor: colors.background,
          fontFamily: template.style?.font ? `"${template.style.font}", ${template.style.font.includes("serif") || template.style.font === "Merriweather" || template.style.font === "Georgia" ? "serif" : "sans-serif"}` : "sans-serif",
          lineHeight: "1.55",
          color: colors.secondary,
          fontSize: "10px",
          width: "100%",
          boxSizing: "border-box" as const,
          overflow: "visible",
        }}
      >
        {renderLayout()}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {showPageBreaks &&
        [1, 2].map((pageNum) => (
          <div
            key={pageNum}
            style={{
              position: "absolute",
              top: `${A4_HEIGHT_PX * pageNum * scale}px`,
              left: 0,
              right: 0,
              height: "2px",
              background:
                "repeating-linear-gradient(90deg,#ef4444 0,#ef4444 6px,transparent 6px,transparent 12px)",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                right: "6px",
                top: "-9px",
                fontSize: "8px",
                fontFamily: "monospace",
                color: "#ef4444",
                background: colors.background,
                padding: "0 3px",
                opacity: 0.85,
              }}
            >
              — page {pageNum} —
            </span>
          </div>
        ))}
      <div style={wrapperStyle}>
        <div style={fontScaleStyle}>
          <div
            id={showPageBreaks ? "resume-preview" : undefined}
            style={{
              backgroundColor: colors.background,
              fontFamily: template.style?.font ? `"${template.style.font}", ${template.style.font.includes("serif") || template.style.font === "Merriweather" || template.style.font === "Georgia" ? "serif" : "sans-serif"}` : "sans-serif",
              lineHeight: "1.55",
              color: colors.secondary,
              fontSize: "10px",
              width: "100%",
              
              boxSizing: "border-box",
            }}
          >
            {renderLayout()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color: string; bg?: string }) {
  return (
    <span style={{ display: "inline", fontSize: "8.5px", fontWeight: "500", color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function SectionHeading({ title, color, borderColor, forExport = false }: { title: string; color: string; borderColor?: string; forExport?: boolean }) {
  return (
    <div style={{ fontSize: "9px", fontWeight: "800", letterSpacing: "0.12em", color, borderBottom: `1.5px solid ${borderColor ?? color + "45"}`, paddingBottom: "3px", marginBottom: forExport ? "8px" : "7px", textTransform: "uppercase" as const }}>
      {title}
    </div>
  );
}

// ── Template 1 – Modern Sidebar (indigo left panel, avatar initial) ────────────
function Template1({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  // Dynamically load Google Font whenever font changes
  useEffect(() => {
    const font = template.style?.font;
    if (!font || font === "sans-serif" || font === "serif") return;
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;900&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);
  const p = resume.personal_info;
  const mainSections = sectionOrder.filter(id => ["summary", "experience", "education", "projects", "certifications"].includes(id));
  const allT1Skills = [
    ...(resume.skills?.technical  ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools      ?? []),
    ...(resume.skills?.cloud      ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div style={{ display: "flex", alignItems: "stretch", minHeight: "100%" }}>
      {/* Sidebar */}
      <div style={{ width: "30%", backgroundColor: colors.primary, color: "#fff", padding: "22px 14px", boxSizing: "border-box" }}>
        {/* Avatar */}
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold", marginBottom: "10px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.45)" }}>
          {profilePhoto
            ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (p.full_name?.charAt(0) ?? "?")}
        </div>
        <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "3px", lineHeight: "1.2" }}>{p.full_name}</div>
        <div style={{ fontSize: "8.5px", opacity: 0.78, marginBottom: "16px", lineHeight: "1.5" }}>{p.headline}</div>

        {/* Contact */}
        <SidebarBlock title="CONTACT">
          {p.email    && <SidebarItem>✉ {p.email}</SidebarItem>}
          {p.phone    && <SidebarItem>📞 {p.phone}</SidebarItem>}
          {p.location && <SidebarItem>📍 {p.location}</SidebarItem>}
          {p.linkedin && <SidebarItem>🔗 {p.linkedin}</SidebarItem>}
          {p.github   && <SidebarItem>🐙 {p.github}</SidebarItem>}
          {p.portfolio && <SidebarItem>🌐 {p.portfolio}</SidebarItem>}
        </SidebarBlock>

        {/* Technical Skills (all categories) */}
        {allT1Skills.length > 0 && (
          <SidebarBlock title="TECHNICAL SKILLS">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
              {allT1Skills.map((sk, i) => (
                <span key={i} style={{ display: "block", fontSize: "8px", color: "rgba(255,255,255,0.88)", paddingLeft: "2px", marginBottom: "2px", lineHeight: "1.5" }}>• {sk}</span>
              ))}
            </div>
          </SidebarBlock>
        )}

        {/* Soft Skills */}
        {(resume.skills?.soft ?? []).length > 0 && (
          <SidebarBlock title="SOFT SKILLS">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
              {(resume.skills?.soft ?? []).map((sk, i) => (
                <span key={i} style={{ display: "block", fontSize: "8px", color: "rgba(255,255,255,0.88)", paddingLeft: "2px", marginBottom: "2px", lineHeight: "1.5" }}>• {sk}</span>
              ))}
            </div>
          </SidebarBlock>
        )}

        {/* Certifications in sidebar */}
        {(resume.certifications ?? []).length > 0 && (
          <SidebarBlock title="CERTIFICATIONS">
            {(resume.certifications ?? []).map((c, i) => <SidebarItem key={i}>• {c}</SidebarItem>)}
          </SidebarBlock>
        )}

        {/* Languages in sidebar */}
        {(resume.languages ?? []).length > 0 && (
          <SidebarBlock title="LANGUAGES">
            {(resume.languages ?? []).map((lang, i) => <SidebarItem key={i}>• {lang}</SidebarItem>)}
          </SidebarBlock>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "22px 18px", boxSizing: "border-box" }}>
        {mainSections.map(id => {
          if (id === "summary" && resume.summary) return (
            <div key={id} style={{ marginBottom: "14px" }}>
              <SectionHeading title="PROFESSIONAL SUMMARY" color={colors.primary} forExport={forExport} />
              <p style={{ fontSize: "9.5px", lineHeight: "1.65", color: colors.secondary, margin: 0 }}>{resume.summary}</p>
            </div>
          );
          if (id === "experience" && (resume.experience ?? []).length > 0) return (
            <div key={id} style={{ marginBottom: "14px" }}>
              <SectionHeading title="WORK EXPERIENCE" color={colors.primary} forExport={forExport} />
              {(resume.experience ?? []).map((exp, i) => (
                <div key={i} style={{ marginBottom: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "10.5px", color: colors.secondary, lineHeight: "1.3" }}>{exp.title}</div>
                      <div style={{ fontSize: "9px", color: colors.primary, fontStyle: "italic", marginTop: "1px" }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
                    </div>
                    <div style={{ fontSize: "8.5px", color: colors.secondary, opacity: 0.6, whiteSpace: "nowrap", paddingLeft: "8px", paddingTop: "1px" }}>{exp.start_date} – {exp.is_current ? "Present" : exp.end_date}</div>
                  </div>
                  {(exp.responsibilities ?? []).slice(0, 3).map((r, j) => (
                    <div key={j} style={{ fontSize: "9px", marginTop: "4px", paddingLeft: "10px", display: "flex", gap: "5px", lineHeight: "1.55" }}>
                      <span style={{ flexShrink: 0, opacity: 0.7 }}>•</span><RichText text={r} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
          if (id === "education" && (resume.education ?? []).length > 0) return (
            <div key={id} style={{ marginBottom: "14px" }}>
              <SectionHeading title="EDUCATION" color={colors.primary} forExport={forExport} />
              {(resume.education ?? []).map((edu, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "10px", lineHeight: "1.3" }}>{edu.degree} {edu.field ? `in ${edu.field}` : ""}</div>
                    <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "1px" }}>{edu.institution}</div>
                  </div>
                  <div style={{ fontSize: "8.5px", opacity: 0.55, paddingLeft: "8px" }}>{edu.start_year}{edu.start_year && edu.end_year ? " - " : ""}{edu.end_year}</div>
                </div>
              ))}
            </div>
          );
          if (id === "projects" && (resume.projects ?? []).length > 0) return (
            <div key={id} style={{ marginBottom: "14px" }}>
              <SectionHeading title="PROJECTS" color={colors.primary} forExport={forExport} />
              {(resume.projects ?? []).map((proj, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ fontWeight: "700", fontSize: "10px", color: colors.primary, lineHeight: "1.3" }}>{proj.name}</div>
                  <div style={{ fontSize: "9px", opacity: 0.85, marginTop: "3px", lineHeight: "1.55" }}>{proj.description}</div>
                  {(proj.technologies ?? []).length > 0 && (
                    <div style={{ marginTop: "3px", fontSize: "7.5px", color: colors.primary, opacity: 0.8 }}>{(proj.technologies ?? []).join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          );
          return null;
        })}
      </div>
    </div>
  );
}

// ── Template 2 – ATS Classic (centered header, horizontal rule, 2-col bottom) ──
function Template2({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  // Dynamically load Google Font whenever font changes
  useEffect(() => {
    const font = template.style?.font;
    if (!font || font === "sans-serif" || font === "serif") return;
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;900&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);
  const p = resume.personal_info;

  return (
    <div style={{ padding: "22px 26px", boxSizing: "border-box" }}>
      {/* Header with optional photo */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", borderBottom: `2px solid ${colors.primary}`, paddingBottom: "10px", marginBottom: "14px" }}>
        {profilePhoto && (
          <div style={{ width: "62px", height: "62px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${colors.primary}` }}>
            <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ flex: 1, textAlign: profilePhoto ? "left" : "center" }}>
        <div style={{ fontSize: "19px", fontWeight: "800", color: colors.secondary, marginBottom: "3px", letterSpacing: "-0.01em" }}>{p.full_name}</div>
        <div style={{ fontSize: "11px", color: colors.primary, marginBottom: "7px", fontWeight: "500" }}>{p.headline}</div>
        <div style={{ display: "flex", justifyContent: profilePhoto ? "flex-start" : "center", gap: "18px", flexWrap: "wrap", fontSize: "8.5px", color: colors.secondary, opacity: 0.72 }}>
          {p.email    && <span>{p.email}</span>}
          {p.phone    && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
          {p.linkedin && <span>{p.linkedin}</span>}
          {p.github   && <span>{p.github}</span>}
          {p.portfolio && <span>{p.portfolio}</span>}
        </div>
        </div>
      </div>

      {/* Summary italic */}
      {resume.summary && (
        <p style={{ fontSize: "9.5px", lineHeight: "1.68", fontStyle: "italic", textAlign: "center", color: colors.secondary, opacity: 0.8, marginBottom: "16px", borderBottom: `1px solid ${colors.primary}30`, paddingBottom: "14px" }}>
          {resume.summary}
        </p>
      )}

      {/* Experience */}
      {(resume.experience ?? []).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <SectionHeading title="PROFESSIONAL EXPERIENCE" color={colors.primary} forExport={forExport} />
          {(resume.experience ?? []).map((exp, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: "700", fontSize: "10px", letterSpacing: "0.04em", color: colors.secondary, lineHeight: "1.3" }}>{exp.title.toUpperCase()}</div>
                <div style={{ fontSize: "8.5px", opacity: 0.6, paddingLeft: "8px", whiteSpace: "nowrap" }}>{exp.start_date} - {exp.is_current ? "Present" : exp.end_date}</div>
              </div>
              <div style={{ fontSize: "9px", color: colors.primary, fontStyle: "italic", marginBottom: "4px", marginTop: "1px", fontWeight: "500" }}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</div>
              {(exp.responsibilities ?? []).slice(0, 3).map((r, j) => (
                <div key={j} style={{ fontSize: "9px", paddingLeft: "10px", marginTop: "3px", display: "flex", gap: "5px", lineHeight: "1.55" }}>
                  <span style={{ flexShrink: 0, opacity: 0.6 }}>•</span><RichText text={r} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {(resume.education ?? []).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <SectionHeading title="EDUCATION" color={colors.primary} forExport={forExport} />
          {(resume.education ?? []).map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "10px", lineHeight: "1.3" }}>{edu.institution}</div>
                <div style={{ fontSize: "9px", fontStyle: "italic", opacity: 0.75, marginTop: "1px" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</div>
              </div>
              <div style={{ fontSize: "8.5px", opacity: 0.55, paddingLeft: "8px" }}>{edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}</div>
            </div>
          ))}
        </div>
      )}

      {/* 2-col bottom: Skills + Certifications */}
      <div style={{ display: "flex", gap: "28px" }}>
        {allSkills.length > 0 && (
          <div style={{ flex: 1 }}>
            <SectionHeading title="SKILLS" color={colors.primary} forExport={forExport} />
            <div style={{ fontSize: "9px", lineHeight: "1.75", color: colors.secondary }}>
              <div><strong>Technical Skills:</strong> {[...(resume.skills?.technical ?? []), ...(resume.skills?.frameworks ?? []), ...(resume.skills?.tools ?? [])].join(", ")}</div>
              {(resume.skills?.soft ?? []).length > 0 && <div><strong>Soft Skills:</strong> {(resume.skills?.soft ?? []).join(", ")}</div>}
            </div>
          </div>
        )}
        {(resume.certifications ?? []).length > 0 && (
          <div style={{ flex: 1 }}>
            <SectionHeading title="CERTIFICATIONS" color={colors.primary} forExport={forExport} />
            {(resume.certifications ?? []).map((c, i) => (
              <div key={i} style={{ fontSize: "9px", marginBottom: "4px", lineHeight: "1.5" }}>{c}</div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      {(resume.projects ?? []).length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <SectionHeading title="PROJECTS" color={colors.primary} forExport={forExport} />
          {(resume.projects ?? []).map((proj, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: "700", fontSize: "10px", color: colors.primary, lineHeight: "1.3" }}>{proj.name}</div>
                {proj.link && <div style={{ fontSize: "8px", opacity: 0.6, paddingLeft: "8px" }}>{proj.link}</div>}
              </div>
              <div style={{ fontSize: "9px", opacity: 0.85, marginTop: "3px", lineHeight: "1.55" }}>{proj.description}</div>
              {(proj.technologies ?? []).length > 0 && (
                <div style={{ marginTop: "3px", fontSize: "7.5px", color: colors.primary, opacity: 0.8 }}>{(proj.technologies ?? []).join(" · ")}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {(resume.languages ?? []).length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <SectionHeading title="LANGUAGES" color={colors.primary} forExport={forExport} />
          <div style={{ fontSize: "9px", color: colors.secondary, lineHeight: "1.75" }}>{(resume.languages ?? []).join(" · ")}</div>
        </div>
      )}
    </div>
  );
}

// ── Template 4 – Timeline Style (dates left, content right) ───────────────────
function Template4({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  // Dynamically load Google Font whenever font changes
  useEffect(() => {
    const font = template.style?.font;
    if (!font || font === "sans-serif" || font === "serif") return;
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;900&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);
  const p = resume.personal_info;

  return (
    <div style={{ padding: "20px 24px", boxSizing: "border-box" }}>
      {/* Header - all caps minimal */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "13px", borderBottom: `1px solid ${colors.primary}30`, paddingBottom: "10px" }}>
        {profilePhoto && (
          <div style={{ width: "58px", height: "58px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${colors.primary}` }}>
            <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
        <div style={{ fontSize: "19px", fontWeight: "800", letterSpacing: "0.05em", color: colors.secondary, marginBottom: "3px", lineHeight: "1.1" }}>{p.full_name?.toUpperCase()}</div>
        <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: colors.secondary, opacity: 0.6, marginBottom: "6px" }}>{p.headline?.toUpperCase()}</div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "9px", color: colors.secondary, opacity: 0.6 }}>
          {p.email    && <span>{p.email}</span>}
          {p.phone    && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
          {p.linkedin && <span>{p.linkedin}</span>}
          {p.github   && <span>{p.github}</span>}
          {p.portfolio && <span>{p.portfolio}</span>}
        </div>
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <p style={{ fontSize: "9.5px", lineHeight: "1.65", color: colors.secondary, opacity: 0.82, marginBottom: "18px", margin: "0 0 18px 0" }}>{resume.summary}</p>
      )}

      {/* Timeline section builder */}
      {(resume.experience ?? []).length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "8.5px", fontWeight: "800", letterSpacing: "0.14em", color: colors.primary, marginBottom: forExport ? "18px" : "8px", paddingBottom: "3px", borderBottom: `1.5px solid ${colors.primary}40` }}>EXPERIENCE</div>
          {(resume.experience ?? []).map((exp, i) => (
            <div key={i} style={{ display: "flex", gap: "18px", marginBottom: "14px" }}>
              {/* Date column */}
              <div style={{ width: "82px", flexShrink: 0, fontSize: "8.5px", color: colors.primary, fontWeight: "600", lineHeight: "1.5", textAlign: "right" }}>
                {exp.start_date}<br />–<br />{exp.is_current ? "Present" : exp.end_date}
              </div>
              {/* Divider */}
              <div style={{ width: "1.5px", backgroundColor: colors.primary + "45", flexShrink: 0 }} />
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "11px", color: colors.secondary, lineHeight: "1.25" }}>{exp.title}</div>
                <div style={{ fontSize: "9px", color: colors.secondary, opacity: 0.62, marginBottom: "4px", marginTop: "1px", fontStyle: "italic" }}>{exp.company}</div>
                {(exp.responsibilities ?? []).slice(0, 3).map((r, j) => (
                  <div key={j} style={{ fontSize: "9px", paddingLeft: "8px", marginTop: "3px", display: "flex", gap: "5px", lineHeight: "1.55" }}>
                    <span style={{ flexShrink: 0, opacity: 0.6 }}>•</span><RichText text={r} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(resume.education ?? []).length > 0 && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "8.5px", fontWeight: "800", letterSpacing: "0.14em", color: colors.primary, marginBottom: forExport ? "20px" : "8px", paddingBottom: "3px", borderBottom: `1.5px solid ${colors.primary}40` }}>EDUCATION</div>
          {(resume.education ?? []).map((edu, i) => (
            <div key={i} style={{ display: "flex", gap: "18px", marginBottom: "10px" }}>
              <div style={{ width: "82px", flexShrink: 0, fontSize: "8.5px", color: colors.primary, fontWeight: "600", textAlign: "right", lineHeight: "1.5" }}>
                {edu.start_year}{edu.end_year ? `\n–\n${edu.end_year}` : ""}
              </div>
              <div style={{ width: "1.5px", backgroundColor: colors.primary + "45", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "10px", lineHeight: "1.3" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</div>
                <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "1px" }}>{edu.institution}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills line */}
      {allSkills.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "8.5px", fontWeight: "800", letterSpacing: "0.14em", color: colors.primary, marginBottom: forExport ? "18px" : "6px", paddingBottom: "3px", borderBottom: `1.5px solid ${colors.primary}40` }}>SKILLS</div>
          <div style={{ fontSize: "9px", color: colors.secondary, opacity: 0.8, lineHeight: "1.65" }}>
            {[...(resume.skills?.technical ?? []), ...(resume.skills?.frameworks ?? []), ...(resume.skills?.tools ?? [])].join(" · ")}
          </div>
          {(resume.skills?.soft ?? []).length > 0 && (
            <div style={{ fontSize: "9px", color: colors.secondary, opacity: 0.7, marginTop: "3px", lineHeight: "1.65" }}>
              {(resume.skills?.soft ?? []).join(" · ")}
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      {(resume.projects ?? []).length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "8.5px", fontWeight: "800", letterSpacing: "0.14em", color: colors.primary, marginBottom: forExport ? "18px" : "6px", paddingBottom: "3px", borderBottom: `1.5px solid ${colors.primary}40` }}>PROJECTS</div>
          {(resume.projects ?? []).map((proj, i) => (
            <div key={i} style={{ display: "flex", gap: "18px", marginBottom: "10px" }}>
              <div style={{ width: "82px", flexShrink: 0 }} />
              <div style={{ width: "1.5px", backgroundColor: colors.primary + "45", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "10px", color: colors.secondary, lineHeight: "1.3" }}>{proj.name}</div>
                {(proj.technologies ?? []).length > 0 && <div style={{ fontSize: "8.5px", color: colors.primary, opacity: 0.8, marginBottom: "2px", marginTop: "1px" }}>{(proj.technologies ?? []).join(" · ")}</div>}
                <div style={{ fontSize: "9px", opacity: 0.8, lineHeight: "1.55" }}>{proj.description}</div>
                {proj.link && <div style={{ fontSize: "8px", opacity: 0.55, marginTop: "2px" }}>{proj.link}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {(resume.certifications ?? []).length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "8.5px", fontWeight: "800", letterSpacing: "0.14em", color: colors.primary, marginBottom: forExport ? "18px" : "6px", paddingBottom: "3px", borderBottom: `1.5px solid ${colors.primary}40` }}>CERTIFICATIONS</div>
          <div style={{ fontSize: "9px", color: colors.secondary, opacity: 0.8, lineHeight: "1.75" }}>
            {(resume.certifications ?? []).join(" · ")}
          </div>
        </div>
      )}

      {/* Languages */}
      {(resume.languages ?? []).length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "8.5px", fontWeight: "800", letterSpacing: "0.14em", color: colors.primary, marginBottom: forExport ? "18px" : "6px", paddingBottom: "3px", borderBottom: `1.5px solid ${colors.primary}40` }}>LANGUAGES</div>
          <div style={{ fontSize: "9px", color: colors.secondary, opacity: 0.8, lineHeight: "1.75" }}>
            {(resume.languages ?? []).join(" · ")}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Template 6 – Centered Avatar + 2-col skills grid ─────────────────────────
function Template6({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  // Dynamically load Google Font whenever font changes
  useEffect(() => {
    const font = template.style?.font;
    if (!font || font === "sans-serif" || font === "serif") return;
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;900&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);
  const p = resume.personal_info;

  return (
    <div style={{ padding: "20px 24px", boxSizing: "border-box" }}>
      {/* Centered avatar header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px", paddingBottom: "10px", borderBottom: `2px solid ${colors.primary}` }}>
        <div style={{ width: "54px", height: "54px", borderRadius: "50%", backgroundColor: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold", color: "#fff", marginBottom: "8px", overflow: "hidden", border: `2px solid ${colors.primary}` }}>
          {profilePhoto
            ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (p.full_name?.charAt(0) ?? "?")}
        </div>
        <div style={{ fontSize: "17px", fontWeight: "800", color: colors.secondary, marginBottom: "3px", letterSpacing: "-0.01em" }}>{p.full_name}</div>
        <div style={{ fontSize: "10px", color: colors.primary, marginBottom: "6px", fontWeight: "500" }}>{p.headline}</div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", fontSize: "8.5px", color: colors.secondary, opacity: 0.68 }}>
          {p.email    && <span>{p.email}</span>}
          {p.phone    && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
          {p.linkedin && <span>{p.linkedin}</span>}
          {p.github   && <span>{p.github}</span>}
          {p.portfolio && <span>{p.portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <div style={{ marginBottom: "16px" }}>
          <SectionHeading title="PROFESSIONAL SUMMARY" color={colors.primary} forExport={forExport} />
          <p style={{ fontSize: "9.5px", lineHeight: "1.65", color: colors.secondary, margin: 0 }}>{resume.summary}</p>
        </div>
      )}

      {/* Experience */}
      {(resume.experience ?? []).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <SectionHeading title="WORK EXPERIENCE" color={colors.primary} forExport={forExport} />
          {(resume.experience ?? []).map((exp, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: "700", fontSize: "10.5px", color: colors.secondary, lineHeight: "1.3" }}>{exp.title}</div>
                <div style={{ fontSize: "8.5px", opacity: 0.6, paddingLeft: "8px", paddingTop: "1px", whiteSpace: "nowrap" }}>{exp.start_date} - {exp.is_current ? "Present" : exp.end_date}</div>
              </div>
              <div style={{ fontSize: "9px", color: colors.primary, fontStyle: "italic", marginBottom: "3px", marginTop: "1px", fontWeight: "500" }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</div>
              {(exp.responsibilities ?? []).slice(0, 3).map((r, j) => (
                <div key={j} style={{ fontSize: "9px", paddingLeft: "10px", marginTop: "3px", display: "flex", gap: "5px", lineHeight: "1.55" }}>
                  <span style={{ flexShrink: 0, opacity: 0.6 }}>•</span><RichText text={r} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {(resume.education ?? []).length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <SectionHeading title="EDUCATION" color={colors.primary} forExport={forExport} />
          {(resume.education ?? []).map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "10px", lineHeight: "1.3" }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</div>
                <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "1px" }}>{edu.institution}</div>
              </div>
              <div style={{ fontSize: "8.5px", opacity: 0.55, paddingLeft: "8px" }}>{edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}</div>
            </div>
          ))}
        </div>
      )}

      {/* 2-col: Skills chips grid + Certifications */}
      <div style={{ display: "flex", gap: "28px" }}>
        {allSkills.length > 0 && (
          <div style={{ flex: 1.5 }}>
            <SectionHeading title="SKILLS" color={colors.primary} forExport={forExport} />
            <div style={{ marginBottom: "7px" }}>
              <div style={{ fontSize: "8px", fontWeight: "700", color: colors.secondary, opacity: 0.6, marginBottom: "5px", letterSpacing: "0.08em" }}>TECHNICAL SKILLS</div>
              <div style={{ fontSize: "8.5px", color: colors.secondary, lineHeight: "1.7" }}>{[...(resume.skills?.technical ?? []), ...(resume.skills?.frameworks ?? []), ...(resume.skills?.tools ?? [])].join(" · ")}</div>
            </div>
            {(resume.skills?.soft ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: "8px", fontWeight: "700", color: colors.secondary, opacity: 0.6, marginBottom: "5px", letterSpacing: "0.08em" }}>SOFT SKILLS</div>
                <div style={{ fontSize: "8.5px", color: colors.secondary, lineHeight: "1.7" }}>{(resume.skills?.soft ?? []).join(" · ")}</div>
              </div>
            )}
          </div>
        )}

        {((resume.projects ?? []).length > 0 || (resume.certifications ?? []).length > 0 || (resume.languages ?? []).length > 0) && (
          <div style={{ flex: 1 }}>
            {(resume.projects ?? []).length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <SectionHeading title="PROJECTS" color={colors.primary} forExport={forExport} />
                {(resume.projects ?? []).map((proj, i) => (
                  <div key={i} style={{ marginBottom: "8px", padding: "6px 8px", backgroundColor: colors.primary + "0a", borderRadius: "4px" }}>
                    <div style={{ fontWeight: "700", fontSize: "9px", color: colors.primary, lineHeight: "1.3" }}>{proj.name}</div>
                    <div style={{ fontSize: "8px", opacity: 0.75, marginTop: "2px", lineHeight: "1.5" }}>{proj.description}</div>
                    {(proj.technologies ?? []).length > 0 && (
                      <div style={{ fontSize: "7.5px", color: colors.primary, opacity: 0.65, marginTop: "3px" }}>{(proj.technologies ?? []).join(" · ")}</div>
                    )}
                    {proj.link && <div style={{ fontSize: "7.5px", opacity: 0.5, marginTop: "2px" }}>{proj.link}</div>}
                  </div>
                ))}
              </div>
            )}
            {(resume.certifications ?? []).length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <SectionHeading title="CERTIFICATIONS" color={colors.primary} forExport={forExport} />
                {(resume.certifications ?? []).map((c, i) => (
                  <div key={i} style={{ fontSize: "9px", marginBottom: "4px", lineHeight: "1.5" }}>• {c}</div>
                ))}
              </div>
            )}
            {(resume.languages ?? []).length > 0 && (
              <div>
                <SectionHeading title="LANGUAGES" color={colors.primary} forExport={forExport} />
                {(resume.languages ?? []).map((lang, i) => (
                  <div key={i} style={{ fontSize: "9px", marginBottom: "4px", lineHeight: "1.5" }}>• {lang}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Template 7 – Left-Aligned Clean (UX/Designer style, gray section bars) ────
function Template7({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = template.style?.font;
    if (!font || font === "sans-serif" || font === "serif") return;
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;900&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);

  const p = resume.personal_info;

  // Section heading: full-width gray bar like the reference image
  const GrayHeading = ({ title }: { title: string }) => (
    <div style={{
      backgroundColor: "#e5e5e5",
      padding: "3px 10px",
      fontSize: "8.5px",
      fontWeight: "800",
      letterSpacing: "0.14em",
      color: "#2a2a2a",
      marginBottom: forExport ? "20px" : "9px",
      marginTop: "2px",
    }}>
      {title}
    </div>
  );

  return (
    <div style={{ padding: "22px 26px 18px 26px", boxSizing: "border-box", backgroundColor: "#ffffff",  }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "13px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {profilePhoto && (
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${colors.primary}` }}>
              <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#1a1a1a", lineHeight: "1.1", letterSpacing: "-0.02em" }}>
              {p.full_name}
            </div>
            <div style={{ fontSize: "11px", fontWeight: "600", color: colors.primary, marginTop: "3px", letterSpacing: "0.03em" }}>
              {p.headline}
            </div>
          </div>
        </div>

        {/* Contact bar */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "4px 18px",
          fontSize: "8.5px", color: "#555", marginTop: "9px",
          paddingTop: "7px", borderTop: `1.5px solid ${colors.primary}30`,
        }}>
          {p.location  && <span>{p.location}</span>}
          {p.phone     && <span>{p.phone}</span>}
          {p.email     && <span>{p.email}</span>}
          {p.linkedin  && <span>{p.linkedin}</span>}
          {p.github    && <span>{p.github}</span>}
          {p.portfolio && <span>{p.portfolio}</span>}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && (
        <div style={{ marginBottom: "14px" }}>
          <p style={{
            fontSize: "9.5px", lineHeight: "1.65", color: "#333",
            borderLeft: `3px solid ${colors.primary}`,
            paddingLeft: "9px",
            margin: 0,
          }}>
            {resume.summary}
          </p>
        </div>
      )}

      {/* ── Two-column body: Skills left (30%) | Main right (70%) ── */}
      <div style={{ display: "flex", gap: "18px" }}>

        {/* LEFT COLUMN – Skills + Education + Additional */}
        <div style={{ width: "30%", flexShrink: 0 }}>

          {/* Technical Skills */}
          {allSkills.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <GrayHeading title="TECHNICAL SKILLS" />
              {[
                { label: "Prototyping Tools", items: (resume.skills?.tools ?? []) },
                { label: "User Research",     items: (resume.skills?.soft ?? []) },
                { label: "Visual Design",     items: (resume.skills?.technical ?? []) },
                { label: "Frameworks",        items: (resume.skills?.frameworks ?? []) },
                { label: "Cloud & Platform",  items: (resume.skills?.cloud ?? []) },
              ]
                .filter(g => g.items.length > 0)
                .map((g, gi) => (
                  <div key={gi} style={{ marginBottom: "7px" }}>
                    <div style={{ fontSize: "8px", fontWeight: "700", color: colors.primary, marginBottom: "3px", letterSpacing: "0.04em" }}>{g.label}</div>
                    {g.items.map((sk, si) => (
                      <div key={si} style={{ fontSize: "8.5px", color: "#444", paddingLeft: "6px", marginBottom: "2px", lineHeight: "1.45" }}>• {sk}</div>
                    ))}
                  </div>
                ))}
            </div>
          )}

          {/* Education */}
          {(resume.education ?? []).length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <GrayHeading title="EDUCATION" />
              {(resume.education ?? []).map((edu, i) => (
                <div key={i} style={{ marginBottom: "9px" }}>
                  <div style={{ fontSize: "8.5px", fontWeight: "700", color: "#1a1a1a", lineHeight: "1.3" }}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </div>
                  <div style={{ fontSize: "8px", color: "#555", marginTop: "2px" }}>{edu.institution}</div>
                  <div style={{ fontSize: "7.5px", color: "#888", marginTop: "2px" }}>
                    {edu.start_year}{edu.end_year ? ` – ${edu.end_year}` : ""}
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {(resume.certifications ?? []).length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <GrayHeading title="CERTIFICATIONS" />
              {(resume.certifications ?? []).map((c, i) => (
                <div key={i} style={{ fontSize: "8.5px", color: "#444", paddingLeft: "6px", marginBottom: "3px", lineHeight: "1.5" }}>• {c}</div>
              ))}
            </div>
          )}

          {/* Languages */}
          {(resume.languages ?? []).length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <GrayHeading title="LANGUAGES" />
              {(resume.languages ?? []).map((lang, i) => (
                <div key={i} style={{ fontSize: "8.5px", color: "#444", paddingLeft: "6px", marginBottom: "3px", lineHeight: "1.5" }}>• {lang}</div>
              ))}
            </div>
          )}

          {/* Projects short list */}
          {(resume.projects ?? []).length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <GrayHeading title="PROJECTS" />
              {(resume.projects ?? []).slice(0, 3).map((proj, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "8.5px", fontWeight: "700", color: colors.primary, lineHeight: "1.3" }}>{proj.name}</div>
                  {(proj.technologies ?? []).length > 0 && (
                    <div style={{ fontSize: "7.5px", color: "#666", marginTop: "2px" }}>{(proj.technologies ?? []).join(", ")}</div>
                  )}
                  {proj.description && (
                    <div style={{ fontSize: "8px", color: "#555", marginTop: "2px", lineHeight: "1.45" }}>{proj.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN – Experience */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {(resume.experience ?? []).length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <GrayHeading title="PROFESSIONAL EXPERIENCE" />
              {(resume.experience ?? []).map((exp, i) => (
                <div key={i} style={{ marginBottom: "13px" }}>
                  {/* Job title + company + dates */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "9.5px", fontWeight: "800", color: "#1a1a1a", lineHeight: "1.25" }}>{exp.title}</div>
                      <div style={{ fontSize: "8.5px", color: colors.primary, fontWeight: "600", marginTop: "1px" }}>
                        {exp.company}{exp.location ? `, ${exp.location}` : ""}
                      </div>
                    </div>
                    <div style={{
                      fontSize: "7.5px", color: "#666", whiteSpace: "nowrap",
                      textAlign: "right", paddingLeft: "6px", paddingTop: "1px",
                    }}>
                      {exp.start_date} – {exp.is_current ? "Present" : exp.end_date}
                    </div>
                  </div>

                  {/* Bullets */}
                  <div style={{ marginTop: "4px" }}>
                    {(exp.responsibilities ?? []).map((r, j) => (
                      <div key={j} style={{
                        display: "flex", gap: "5px", fontSize: "8.5px",
                        color: "#333", marginBottom: "3px", paddingLeft: "2px",
                        lineHeight: "1.55",
                      }}>
                        <span style={{ flexShrink: 0, color: colors.primary, fontWeight: "bold", marginTop: "0.5px" }}>•</span>
                        <RichText text={r} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── Template 10 – Blue Card (Poppins, rounded card, profile photo, 2-col bottom) ──
function Template10({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = template.style?.font ?? "Poppins";
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);

  const p = resume.personal_info;
  const primaryBlue = colors.primary ?? "#1d4ed8";

  // Section heading with horizontal rule like the reference design
  const BlueHeading = ({ title }: { title: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: forExport ? "20px" : "8px" }}>
      <span style={{ fontSize: "8.5px", fontWeight: "700", color: primaryBlue, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
        {title}
      </span>
      <div style={{ flex: 1, height: "1px", backgroundColor: primaryBlue + "40" }} />
    </div>
  );

  const allTechSkills = [...(resume.skills?.technical ?? []), ...(resume.skills?.frameworks ?? []), ...(resume.skills?.tools ?? []), ...(resume.skills?.cloud ?? [])]
    .filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div style={{ padding: "28px 32px", boxSizing: "border-box", backgroundColor: "#ffffff",  fontFamily: `"Poppins", sans-serif` }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
        {/* Profile photo circle */}
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", border: `3px solid ${primaryBlue}`, overflow: "hidden", flexShrink: 0, backgroundColor: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "bold", color: primaryBlue }}>
          {profilePhoto
            ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (p.full_name?.charAt(0) ?? "?")}
        </div>

        {/* Name + title + contact */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "20px", fontWeight: "700", color: primaryBlue, letterSpacing: "0.04em", marginBottom: "2px" }}>
            {p.full_name?.toUpperCase()}
          </div>
          <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: "300", marginBottom: "8px" }}>
            {p.headline}
          </div>
          {/* Contact row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px", fontSize: "8.5px", color: "#6b7280" }}>
            {p.email    && <span>✉️ {p.email}</span>}
            {p.phone    && <span>📞 {p.phone}</span>}
            {p.location && <span>📍 {p.location}</span>}
            {p.linkedin && <span>🔗 {p.linkedin}</span>}
            {p.github   && <span>🐙 {p.github}</span>}
            {p.portfolio && <span>🌐 {p.portfolio}</span>}
          </div>
        </div>
      </div>

      {/* ── Profile Summary ── */}
      {resume.summary && (
        <div style={{ marginBottom: "18px" }}>
          <BlueHeading title="Profile Summary" />
          <p style={{ fontSize: "9px", color: "#4b5563", lineHeight: "1.7", margin: 0 }}>
            {resume.summary}
          </p>
        </div>
      )}

      {/* ── Education ── */}
      {(resume.education ?? []).length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <BlueHeading title="Education" />
          {(resume.education ?? []).map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <div style={{ fontSize: "9.5px", fontWeight: "600", color: "#1f2937" }}>
                  {edu.institution}
                </div>
                <div style={{ fontSize: "8.5px", color: "#6b7280", marginTop: "1px" }}>
                  {edu.degree}{edu.field ? ` | ${edu.field}` : ""}
                </div>
              </div>
              <div style={{ fontSize: "8.5px", color: primaryBlue, fontWeight: "500", whiteSpace: "nowrap", paddingLeft: "8px", paddingTop: "1px" }}>
                {edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Work Experience ── */}
      {(resume.experience ?? []).length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <BlueHeading title="Work Experience" />
          {(resume.experience ?? []).map((exp, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ maxWidth: "78%" }}>
                <div style={{ fontSize: "9.5px", fontWeight: "600", color: "#1f2937" }}>
                  {exp.title} | {exp.company}
                </div>
                <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: "4px 0 0 0" }}>
                  {(exp.responsibilities ?? []).slice(0, 3).map((r, j) => (
                    <li key={j} style={{ fontSize: "8.5px", color: "#4b5563", marginBottom: "2px", lineHeight: "1.5" }}>
                      <RichText text={r} />
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ fontSize: "8.5px", color: primaryBlue, fontWeight: "500", whiteSpace: "nowrap", paddingLeft: "8px", paddingTop: "1px" }}>
                {exp.start_date} - {exp.is_current ? "PRESENT" : exp.end_date}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Projects ── */}
      {(resume.projects ?? []).length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <BlueHeading title="Projects" />
          {(resume.projects ?? []).map((proj, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "9.5px", fontWeight: "600", color: "#1f2937" }}>{proj.name}</div>
              {(proj.technologies ?? []).length > 0 && (
                <div style={{ fontSize: "8px", color: primaryBlue, marginTop: "1px", marginBottom: "2px" }}>{(proj.technologies ?? []).join(" · ")}</div>
              )}
              <div style={{ fontSize: "8.5px", color: "#4b5563", lineHeight: "1.55" }}>{proj.description}</div>
              {proj.link && <div style={{ fontSize: "8px", color: "#6b7280", marginTop: "2px" }}>{proj.link}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom 2-col: Skills + Languages/Certifications ── */}
      <div style={{ display: "flex", gap: "24px", marginTop: "4px" }}>

        {/* Skills */}
        {allTechSkills.length > 0 && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <BlueHeading title="Professional Skills" />
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {allTechSkills.map((sk, i) => (
                <li key={i} style={{ fontSize: "8.5px", color: "#4b5563", marginBottom: "5px" }}>• {sk}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Languages column — uses dedicated languages field, falls back to certifications */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {(resume.languages ?? []).length > 0 && (
            <>
              <BlueHeading title="Languages" />
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {(resume.languages ?? []).map((lang, i) => (
                  <li key={i} style={{ fontSize: "8.5px", color: "#4b5563", marginBottom: "5px" }}>• {lang}</li>
                ))}
              </ul>
            </>
          )}
          {(resume.certifications ?? []).length > 0 && (
            <div style={{ marginTop: (resume.languages ?? []).length > 0 ? "12px" : "0" }}>
              <BlueHeading title="Certifications" />
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {(resume.certifications ?? []).slice(0, 5).map((c, i) => (
                  <li key={i} style={{ fontSize: "8.5px", color: "#4b5563", marginBottom: "5px" }}>• {c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Template 13 – Steel Blue (light gray left, name + photo left, blue timeline right) ──
function Template13({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = template.style?.font ?? "Poppins";
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);

  const p = resume.personal_info;
  const blue      = colors.primary ?? "#4f78a8";
  const blueLine  = "#8eaac8";
  const darkText  = "#3d3d3d";
  const mutedText = "#6b7280";

  // Left sidebar heading with blue underline rule
  const LeftHeading = ({ title }: { title: string }) => (
    <div style={{ marginBottom: forExport ? "22px" : "10px" }}>
      <div style={{ fontSize: "11px", fontWeight: "500", color: darkText, marginBottom: "4px" }}>{title}</div>
      <div style={{ width: "100%", height: "1.5px", backgroundColor: blueLine }} />
    </div>
  );

  // Right section heading (no rule — plain medium weight)
  const RightHeading = ({ title }: { title: string }) => (
    <div style={{ fontSize: "12px", fontWeight: "500", color: darkText, marginBottom: forExport ? "22px" : "10px" }}>{title}</div>
  );

  // Timeline entry used on the right
  const TimelineEntry = ({
    title, sub, dates, bullets,
  }: { title: string; sub?: string; dates?: string; bullets?: string[] }) => (
    <div style={{ position: "relative", paddingLeft: "14px", borderLeft: `2px solid ${blueLine}`, marginBottom: "12px" }}>
      {/* Dot */}
      <div style={{ position: "absolute", left: "-5px", top: "3px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: blue }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
        <div>
          <div style={{ fontSize: "9.5px", fontWeight: "600", color: "#374151" }}>{title}</div>
          {sub && <div style={{ fontSize: "8.5px", fontWeight: "500", color: mutedText }}>{sub}</div>}
        </div>
        {dates && <div style={{ fontSize: "8px", color: mutedText, whiteSpace: "nowrap", paddingLeft: "8px", flexShrink: 0 }}>{dates}</div>}
      </div>
      {bullets && bullets.length > 0 && (
        <div style={{ marginTop: "3px" }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ fontSize: "8px", color: mutedText, lineHeight: "1.6", display: "flex", gap: "4px" }}>
              <span style={{ flexShrink: 0 }}>•</span><RichText text={b} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const allTechSkills = [
    ...(resume.skills?.technical ?? []), ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools ?? []), ...(resume.skills?.cloud ?? []), ...(resume.skills?.soft ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#fff", fontFamily: `"Poppins", sans-serif` }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: "35%", backgroundColor: "#f4f4f4", padding: "20px 20px", boxSizing: "border-box" }}>

        {/* Name block */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "20px", fontWeight: "300", color: blue, lineHeight: "1.1" }}>
            {p.full_name?.split(" ")[0] ?? ""}
          </div>
          <div style={{ fontSize: "20px", fontWeight: "500", color: blue, lineHeight: "1.1", marginBottom: "4px" }}>
            {p.full_name?.split(" ").slice(1).join(" ") ?? ""}
          </div>
          <div style={{ fontSize: "9px", color: mutedText, marginTop: "3px" }}>{p.headline}</div>
        </div>

        {/* Profile photo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", overflow: "hidden", backgroundColor: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "bold", color: blue }}>
            {profilePhoto
              ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (p.full_name?.charAt(0) ?? "?")}
          </div>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: "14px" }}>
          <LeftHeading title="Contact" />
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {p.phone && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: blue, fontSize: "9px", flexShrink: 0 }}>☎</span>
                <span style={{ fontSize: "8px", color: mutedText, wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.phone}</span>
              </div>
            )}
            {p.email && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: blue, fontSize: "9px", flexShrink: 0 }}>✉</span>
                <span style={{ fontSize: "8px", color: mutedText, wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.email}</span>
              </div>
            )}
            {p.location && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: blue, fontSize: "9px", flexShrink: 0 }}>📍</span>
                <span style={{ fontSize: "8px", color: mutedText, wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.location}</span>
              </div>
            )}
            {p.linkedin && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: blue, fontSize: "9px", flexShrink: 0 }}>🔗</span>
                <span style={{ fontSize: "8px", color: mutedText, wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.linkedin}</span>
              </div>
            )}
            {p.github && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: blue, fontSize: "9px", flexShrink: 0 }}>🐙</span>
                <span style={{ fontSize: "8px", color: mutedText, wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.github}</span>
              </div>
            )}
            {p.portfolio && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: blue, fontSize: "9px", flexShrink: 0 }}>🌐</span>
                <span style={{ fontSize: "8px", color: mutedText, wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.portfolio}</span>
              </div>
            )}
          </div>
        </div>

        {/* About Me */}
        {resume.summary && (
          <div style={{ marginBottom: "14px" }}>
            <LeftHeading title="About Me" />
            <p style={{ fontSize: "8px", color: mutedText, lineHeight: "1.7", margin: 0 }}>{resume.summary}</p>
          </div>
        )}

        {/* Skills */}
        {allTechSkills.length > 0 && (
          <div>
            <LeftHeading title="Skills" />
            <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
              {allTechSkills.map((sk, i) => (
                <li key={i} style={{ fontSize: "8px", color: mutedText, marginBottom: "4px" }}>{sk}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Certifications */}
        {(resume.certifications ?? []).length > 0 && (
          <div style={{ marginTop: "14px" }}>
            <LeftHeading title="Certifications" />
            <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
              {(resume.certifications ?? []).slice(0, 4).map((c, i) => (
                <li key={i} style={{ fontSize: "8px", color: mutedText, marginBottom: "4px" }}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Languages */}
        {(resume.languages ?? []).length > 0 && (
          <div style={{ marginTop: "14px" }}>
            <LeftHeading title="Languages" />
            <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
              {(resume.languages ?? []).map((lang, i) => (
                <li key={i} style={{ fontSize: "8px", color: mutedText, marginBottom: "4px" }}>{lang}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── RIGHT CONTENT ── */}
      <div style={{ width: "65%", backgroundColor: "#fff", padding: "20px 22px", boxSizing: "border-box" }}>

        {/* Education */}
        {(resume.education ?? []).length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <RightHeading title="Education" />
            {(resume.education ?? []).map((edu, i) => (
              <TimelineEntry
                key={i}
                title={`${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`}
                sub={edu.institution}
                dates={`${edu.start_year ?? ""}${edu.end_year ? ` - ${edu.end_year}` : ""}`}
                bullets={[]}
              />
            ))}
          </div>
        )}

        {/* Experience */}
        {(resume.experience ?? []).length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <RightHeading title="Experience" />
            {(resume.experience ?? []).map((exp, i) => (
              <TimelineEntry
                key={i}
                title={exp.title}
                sub={exp.company + (exp.location ? `, ${exp.location}` : "")}
                dates={`${exp.start_date} - ${exp.is_current ? "Present" : exp.end_date}`}
                bullets={(exp.responsibilities ?? []).slice(0, 2)}
              />
            ))}
          </div>
        )}

        {/* Projects */}
        {(resume.projects ?? []).length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <RightHeading title="Projects" />
            {(resume.projects ?? []).map((proj, i) => (
              <TimelineEntry
                key={i}
                title={proj.name}
                sub={(proj.technologies ?? []).length > 0 ? (proj.technologies ?? []).join(" · ") : undefined}
                bullets={proj.description ? [proj.description] : []}
              />
            ))}
          </div>
        )}

        {/* References — 2-col grid, shown when no projects or as footer */}
        {resume.achievements && (resume.achievements ?? []).length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "500", color: darkText, marginBottom: "4px" }}>Achievements</div>
            <div style={{ width: "100%", height: "1.5px", backgroundColor: blueLine, marginBottom: "10px" }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
              {(resume.achievements ?? []).map((ach, i) => (
                <div key={i} style={{ fontSize: "8px", color: mutedText, lineHeight: "1.5" }}>{ach}</div>
              ))}
            </div>
          </div>
        )}

        {/* References placeholder using certifications or static note */}
        <div>
          <div style={{ fontSize: "12px", fontWeight: "500", color: darkText, marginBottom: "4px" }}>References</div>
          <div style={{ width: "100%", height: "1.5px", backgroundColor: blueLine, marginBottom: "10px" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
            <div>
              <div style={{ fontSize: "8.5px", fontWeight: "600", color: "#374151" }}>Available upon request</div>
              <div style={{ fontSize: "8px", color: mutedText }}>Professional references</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template 14 – Minimal Montserrat (centered header, wide tracking, single-col experience, 2-col bottom) ──
function Template14({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = "Montserrat";
    const id = "gfont-Montserrat";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const p = resume.personal_info;
  const darkText  = "#222";
  const mutedText = "#6b7280";

  // Section heading: all-caps, wide tracked, extrabold — signature of this template
  const MinHeading = ({ title }: { title: string }) => (
    <div style={{ fontSize: "9px", fontWeight: "800", letterSpacing: "0.28em", textTransform: "uppercase", color: darkText, marginBottom: forExport ? "22px" : "10px" }}>
      {title}
    </div>
  );

  // Thin horizontal rule
  const Rule = () => (
    <div style={{ borderTop: "1px solid #d1d5db", margin: "14px 0" }} />
  );

  const allTechSkills = [
    ...(resume.skills?.technical ?? []), ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools ?? []), ...(resume.skills?.cloud ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const softSkills = (resume.skills?.soft ?? []).filter(Boolean);

  return (
    <div style={{
      padding: "28px 40px",
      boxSizing: "border-box",
      backgroundColor: "#f7f7f7",
      
      fontFamily: `"Montserrat", sans-serif`,
      color: darkText,
    }}>

      {/* ── Centered Header ── */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        {/* Optional profile photo — small, centered, above name */}
        {profilePhoto && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", overflow: "hidden", border: "2px solid #d1d5db" }}>
              <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        )}
        <div style={{ fontSize: "17px", letterSpacing: "0.3em", fontWeight: "800", textTransform: "uppercase", color: darkText }}>
          {p.full_name}
        </div>
        <div style={{ marginTop: "4px", fontSize: "10px", letterSpacing: "0.22em", fontWeight: "600", textTransform: "uppercase", color: darkText }}>
          {p.headline}
        </div>
        <div style={{ marginTop: "8px", fontSize: "8px", letterSpacing: "0.05em", color: mutedText, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 8px" }}>
          {p.phone    && <span>{p.phone}</span>}
          {p.phone    && p.email    && <span>/</span>}
          {p.email    && <span>{p.email}</span>}
          {p.email    && (p.linkedin || p.portfolio) && <span>/</span>}
          {(p.linkedin || p.portfolio) && <span>{p.linkedin || p.portfolio}</span>}
          {p.location && <><span>/</span><span>{p.location}</span></>}
        </div>
      </div>

      <Rule />

      {/* ── Profile / Summary ── */}
      {resume.summary && (
        <>
          <section style={{ marginBottom: "4px" }}>
            <MinHeading title="Profile" />
            <p style={{ fontSize: "8.5px", lineHeight: "1.8", color: "#374151", margin: 0 }}>
              {resume.summary}
            </p>
          </section>
          <Rule />
        </>
      )}

      {/* ── Work Experience ── */}
      {(resume.experience ?? []).length > 0 && (
        <>
          <section style={{ marginBottom: "4px" }}>
            <MinHeading title="Work Experience" />
            {(resume.experience ?? []).map((exp, i) => (
              <div key={i} style={{ marginBottom: i < (resume.experience ?? []).length - 1 ? "14px" : "0" }}>
                <div style={{ fontSize: "7.5px", textTransform: "uppercase", letterSpacing: "0.12em", color: mutedText, fontWeight: "600" }}>
                  {exp.title}
                </div>
                <div style={{ fontSize: "10px", fontWeight: "700", marginTop: "2px", color: darkText }}>
                  {exp.company}{exp.location ? `, ${exp.location}` : ""}
                </div>
                <div style={{ fontSize: "8px", fontStyle: "italic", color: mutedText, marginTop: "1px", marginBottom: "6px" }}>
                  {exp.start_date}{exp.start_date && (exp.end_date || exp.is_current) ? " - " : ""}{exp.is_current ? "Present" : exp.end_date}
                </div>
                {(exp.responsibilities ?? []).length > 0 && (
                  <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
                    {(exp.responsibilities ?? []).map((r, j) => (
                      <li key={j} style={{ fontSize: "8.5px", color: "#374151", marginBottom: "3px", lineHeight: "1.65" }}>
                        <RichText text={r} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
          <Rule />
        </>
      )}

      {/* ── Bottom 2-col: Left (Education + Certifications) | Right (Skills) ── */}
      <div style={{ display: "flex", gap: "0 48px" }}>

        {/* LEFT col */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Education */}
          {(resume.education ?? []).length > 0 && (
            <section style={{ marginBottom: "14px" }}>
              <MinHeading title="Education" />
              {(resume.education ?? []).map((edu, i) => (
                <div key={i} style={{ marginBottom: i < (resume.education ?? []).length - 1 ? "10px" : "0" }}>
                  <div style={{ fontSize: "9.5px", fontWeight: "700", color: darkText }}>
                    {edu.institution}
                  </div>
                  <div style={{ fontSize: "8px", color: mutedText, marginTop: "1px" }}>
                    {edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}
                  </div>
                  <div style={{ fontSize: "8.5px", color: "#374151", marginTop: "4px" }}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Certifications */}
          {(resume.certifications ?? []).length > 0 && (
            <section style={{ marginBottom: "14px" }}>
              <MinHeading title="Certifications" />
              <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
                {(resume.certifications ?? []).map((c, i) => (
                  <li key={i} style={{ fontSize: "8.5px", color: "#374151", marginBottom: "4px", lineHeight: "1.65" }}>{c}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Languages */}
          {(resume.languages ?? []).length > 0 && (
            <section>
              <MinHeading title="Languages" />
              <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
                {(resume.languages ?? []).map((lang, i) => (
                  <li key={i} style={{ fontSize: "8.5px", color: "#374151", marginBottom: "4px", lineHeight: "1.65" }}>{lang}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* RIGHT col */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Technical Skills */}
          {(allTechSkills.length > 0 || softSkills.length > 0) && (
            <section style={{ marginBottom: (resume.projects ?? []).length > 0 ? "14px" : "0" }}>
              <MinHeading title="Skills" />
              <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
                {[...allTechSkills, ...softSkills].map((sk, i) => (
                  <li key={i} style={{ fontSize: "8.5px", color: "#374151", marginBottom: "4px", lineHeight: "1.65" }}>{sk}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Projects */}
          {(resume.projects ?? []).length > 0 && (
            <section>
              <MinHeading title="Projects" />
              {(resume.projects ?? []).map((proj, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "9px", fontWeight: "700", color: darkText }}>{proj.name}</div>
                  {proj.description && (
                    <div style={{ fontSize: "8px", color: mutedText, marginTop: "1px", lineHeight: "1.5" }}>{proj.description}</div>
                  )}
                  {(proj.technologies ?? []).length > 0 && (
                    <div style={{ fontSize: "7.5px", color: mutedText, marginTop: "2px" }}>{(proj.technologies ?? []).join(", ")}</div>
                  )}
                  {proj.link && <div style={{ fontSize: "7.5px", color: mutedText, marginTop: "2px" }}>{proj.link}</div>}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Template 15 – Amber Marketing (photo header, 3-col left sidebar, amber accents) ──
function Template15({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = template.style?.font ?? "Inter";
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;600;700&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);

  const p = resume.personal_info;
  const amber = colors.primary ?? "#b45309";

  const allTechSkills = [
    ...(resume.skills?.technical ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools ?? []),
    ...(resume.skills?.cloud ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const allSkillsFlat = [...allTechSkills, ...(resume.skills?.soft ?? [])]
    .filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <div style={{ backgroundColor: "#e5e7eb",  boxSizing: "border-box", padding: "20px 16px", fontFamily: "inherit" }}>
      <div style={{ maxWidth: "100%", backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 22px", borderBottom: "1px solid #e5e7eb" }}>
          {/* Profile photo */}
          <div style={{ width: "72px", height: "72px", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
            {profilePhoto
              ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (
                <div style={{ width: "100%", height: "100%", backgroundColor: amber + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold", color: amber }}>
                  {p.full_name?.charAt(0) ?? "?"}
                </div>
              )}
          </div>

          {/* Name + headline */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "22px", fontWeight: "600", color: amber, marginBottom: "2px" }}>
              {p.full_name}
            </div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>
              {p.headline}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 16px", fontSize: "8.5px", color: "#6b7280", wordBreak: "break-all", overflowWrap: "anywhere" }}>
              {p.phone    && <div>📞 {p.phone}</div>}
              {p.location && <div>📍 {p.location}</div>}
              {p.email    && <div>✉️ {p.email}</div>}
              {(p.linkedin || p.portfolio) && <div>🌐 {p.portfolio ?? p.linkedin}</div>}
            </div>
          </div>
        </div>

        {/* ── Body: 3-col left sidebar + 2/3 main ── */}
        <div style={{ display: "flex", gap: "20px", padding: "18px 22px" }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "33%", flexShrink: 0, boxSizing: "border-box" }}>

            {/* Professional Summary */}
            {resume.summary && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: forExport ? "18px" : "6px" }}>
                  Professional Summary
                </div>
                <p style={{ fontSize: "8.5px", color: "#6b7280", lineHeight: "1.65", margin: 0 }}>
                  {resume.summary}
                </p>
              </div>
            )}

            {/* Education */}
            {(resume.education ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: forExport ? "20px" : "8px" }}>
                  Education
                </div>
                {(resume.education ?? []).map((edu, i) => (
                  <div key={i} style={{ marginBottom: i < (resume.education ?? []).length - 1 ? "8px" : "0" }}>
                    <div style={{ fontSize: "8.5px", fontWeight: "600", color: "#1f2937" }}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </div>
                    <div style={{ fontSize: "8px", color: "#6b7280" }}>{edu.institution}</div>
                    <div style={{ fontSize: "7.5px", color: "#9ca3af" }}>
                      {edu.end_year ? `Graduated: ${edu.end_year}` : edu.start_year ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {allSkillsFlat.length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: forExport ? "20px" : "8px" }}>
                  Skills
                </div>
                <ul style={{ listStyleType: "disc", paddingLeft: "13px", margin: 0 }}>
                  {allSkillsFlat.map((sk, i) => (
                    <li key={i} style={{ fontSize: "8.5px", color: "#6b7280", marginBottom: "3px" }}>{sk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, minWidth: 0 }}>

            {/* Professional Experience */}
            {(resume.experience ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: forExport ? "22px" : "10px" }}>
                  Professional Experience
                </div>
                {(resume.experience ?? []).map((exp, i) => (
                  <div key={i} style={{ marginBottom: i < (resume.experience ?? []).length - 1 ? "12px" : "0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "9.5px", fontWeight: "600", color: "#1f2937" }}>{exp.title}</div>
                        <div style={{ fontSize: "8.5px", color: "#9ca3af" }}>{exp.company}</div>
                      </div>
                      <div style={{ fontSize: "8px", color: "#9ca3af", whiteSpace: "nowrap", paddingLeft: "8px", flexShrink: 0 }}>
                        {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                      </div>
                    </div>
                    <p style={{ fontSize: "8.5px", color: "#6b7280", lineHeight: "1.6", marginTop: "4px", marginBottom: 0 }}>
                      {(exp.responsibilities ?? []).slice(0, 2).join(" ")}
                    </p>
                    {(exp.responsibilities ?? []).length > 2 && (
                      <div style={{ marginTop: "3px" }}>
                        {(exp.responsibilities ?? []).slice(2, 5).map((r, j) => (
                          <div key={j} style={{ fontSize: "8.5px", color: "#6b7280", display: "flex", gap: "4px", marginBottom: "2px" }}>
                            <span style={{ flexShrink: 0 }}>•</span><RichText text={r} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Certifications */}
            {(resume.certifications ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: forExport ? "20px" : "8px" }}>
                  Certification
                </div>
                <ul style={{ listStyleType: "disc", paddingLeft: "13px", margin: 0 }}>
                  {(resume.certifications ?? []).map((c, i) => (
                    <li key={i} style={{ fontSize: "8.5px", color: "#6b7280", marginBottom: "3px" }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages */}
            {(resume.languages ?? []).length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: forExport ? "20px" : "8px" }}>
                  Languages
                </div>
                <ul style={{ listStyleType: "disc", paddingLeft: "13px", margin: 0 }}>
                  {(resume.languages ?? []).map((lang, i) => (
                    <li key={i} style={{ fontSize: "8.5px", color: "#6b7280", marginBottom: "3px" }}>{lang}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Projects */}
            {(resume.projects ?? []).length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#1f2937", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px", marginBottom: forExport ? "20px" : "8px" }}>
                  Projects
                </div>
                {(resume.projects ?? []).map((proj, i) => (
                  <div key={i} style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "9px", fontWeight: "600", color: amber }}>{proj.name}</div>
                    {proj.description && (
                      <div style={{ fontSize: "8.5px", color: "#6b7280", marginTop: "2px", lineHeight: "1.5" }}>{proj.description}</div>
                    )}
                    {(proj.technologies ?? []).length > 0 && (
                      <div style={{ fontSize: "7.5px", color: "#9ca3af", marginTop: "2px" }}>{(proj.technologies ?? []).join(" · ")}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template 16 – Elegant Georgia (warm beige, framed photo, tracked uppercase headings, serif) ──
function Template16({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = "Georgia";
    // Georgia is a system font — no Google Fonts needed
    void font;
  }, []);

  const p = resume.personal_info;
  const warmBrown = colors.primary ?? "#9b7a57";

  const allTechSkills = [
    ...(resume.skills?.technical ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools ?? []),
    ...(resume.skills?.cloud ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  // Spaced uppercase label — signature element of this template
  const TrackedLabel = ({ title }: { title: string }) => (
    <div style={{
      fontSize: "8px",
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      color: "#9ca3af",
      marginBottom: forExport ? "22px" : "10px",
      fontFamily: "Georgia, serif",
    }}>
      {title}
    </div>
  );

  return (
    <div style={{
      backgroundColor: "#f6f2ee",
      
      boxSizing: "border-box",
      fontFamily: "Georgia, serif",
      display: "flex",
      alignItems: "stretch",
      minHeight: "100%",
    }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{ width: "220px", flexShrink: 0, padding: "28px 18px 20px 20px", boxSizing: "border-box" }}>

        {/* Framed profile photo */}
        <div style={{ marginBottom: "22px" }}>
          <div style={{ backgroundColor: "#fff", padding: "6px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb", display: "inline-block", width: "130px" }}>
            {profilePhoto
              ? <img src={profilePhoto} alt="Profile" style={{ width: "130px", height: "140px", objectFit: "cover", display: "block" }} />
              : (
                <div style={{ width: "130px", height: "140px", backgroundColor: warmBrown + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", fontWeight: "bold", color: warmBrown }}>
                  {p.full_name?.charAt(0) ?? "?"}
                </div>
              )}
          </div>
        </div>

        {/* Contact */}
        <div style={{ marginBottom: "20px" }}>
          <TrackedLabel title="Contact" />
          <div style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "8.5px", color: "#555", wordBreak: "break-all", overflowWrap: "anywhere" }}>
            {p.phone    && <div>📞 {p.phone}</div>}
            {p.email    && <div>✉️ {p.email}</div>}
            {(p.linkedin || p.portfolio) && <div>🌐 {p.portfolio ?? p.linkedin}</div>}
            {p.location && <div>📍 {p.location}</div>}
          </div>
        </div>

        {/* Technical Skills / Expertise */}
        {allTechSkills.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <TrackedLabel title="Expertise" />
            <ul style={{ listStyleType: "disc", paddingLeft: "13px", margin: 0 }}>
              {allTechSkills.map((sk, i) => (
                <li key={i} style={{ fontSize: "8.5px", color: "#555", marginBottom: "5px" }}>{sk}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Frameworks / Tools as Software Knowledge */}
        {(resume.skills?.frameworks ?? []).length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <TrackedLabel title="Software Knowledge" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[...(resume.skills?.frameworks ?? []), ...(resume.skills?.tools ?? [])].slice(0, 5).map((sk, i) => (
                <li key={i} style={{ fontSize: "8.5px", color: "#555", marginBottom: "5px" }}>{sk}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Soft Skills */}
        {(resume.skills?.soft ?? []).length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <TrackedLabel title="Personal Skills" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(resume.skills?.soft ?? []).map((sk, i) => (
                <li key={i} style={{ fontSize: "8.5px", color: "#555", marginBottom: "5px" }}>{sk}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Certifications */}
        {(resume.certifications ?? []).length > 0 && (
          <div>
            <TrackedLabel title="Certifications" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(resume.certifications ?? []).map((c, i) => (
                <li key={i} style={{ fontSize: "8.5px", color: "#555", marginBottom: "5px" }}>• {c}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Languages */}
        {(resume.languages ?? []).length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <TrackedLabel title="Languages" />
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(resume.languages ?? []).map((lang, i) => (
                <li key={i} style={{ fontSize: "8.5px", color: "#555", marginBottom: "5px" }}>• {lang}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* ── RIGHT CONTENT ── */}
      <main style={{ flex: 1, padding: "28px 24px 20px 16px", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ paddingBottom: "14px", borderBottom: "1px solid #d1d5db", marginBottom: "18px" }}>
          <div style={{ fontSize: "18px", letterSpacing: "0.22em", textTransform: "uppercase", color: warmBrown, fontWeight: "600", marginBottom: "4px" }}>
            {p.full_name}
          </div>
          <div style={{ fontSize: "10px", color: "#6b7280" }}>
            {p.headline}
          </div>
        </div>

        {/* Personal Profile / Summary */}
        {resume.summary && (
          <section style={{ marginBottom: "18px" }}>
            <TrackedLabel title="Personal Profile" />
            <p style={{ fontSize: "8.5px", color: "#555", lineHeight: "1.85", margin: 0 }}>
              {resume.summary}
            </p>
          </section>
        )}

        {/* Work Experience */}
        {(resume.experience ?? []).length > 0 && (
          <section style={{ marginBottom: "18px" }}>
            <TrackedLabel title="Work Experience" />
            {(resume.experience ?? []).map((exp, i) => (
              <div key={i} style={{ marginBottom: i < (resume.experience ?? []).length - 1 ? "14px" : "0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", color: "#1f2937" }}>
                    {exp.title}
                  </div>
                  <div style={{ fontSize: "8px", color: "#9ca3af", whiteSpace: "nowrap", paddingLeft: "8px", flexShrink: 0 }}>
                    {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                  </div>
                </div>
                <div style={{ fontSize: "8px", fontStyle: "italic", color: "#9ca3af", marginBottom: "5px" }}>
                  {exp.company}{exp.location ? `, ${exp.location}` : ""}
                </div>
                <ul style={{ listStyleType: "disc", paddingLeft: "13px", margin: 0 }}>
                  {(exp.responsibilities ?? []).slice(0, 3).map((r, j) => (
                    <li key={j} style={{ fontSize: "8.5px", color: "#555", marginBottom: "3px", lineHeight: "1.6" }}>
                      <RichText text={r} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {/* Education */}
        {(resume.education ?? []).length > 0 && (
          <section style={{ marginBottom: "18px" }}>
            <TrackedLabel title="Education" />
            {(resume.education ?? []).map((edu, i) => (
              <div key={i} style={{ marginBottom: i < (resume.education ?? []).length - 1 ? "12px" : "0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "600", color: "#1f2937" }}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </div>
                  <div style={{ fontSize: "8px", color: "#9ca3af", whiteSpace: "nowrap", paddingLeft: "8px", flexShrink: 0 }}>
                    {edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}
                  </div>
                </div>
                <div style={{ fontSize: "8px", fontStyle: "italic", color: "#9ca3af", marginTop: "2px" }}>
                  {edu.institution}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Projects */}
        {(resume.projects ?? []).length > 0 && (
          <section>
            <TrackedLabel title="Projects" />
            {(resume.projects ?? []).map((proj, i) => (
              <div key={i} style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "8.5px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "#1f2937" }}>{proj.name}</div>
                {proj.description && (
                  <div style={{ fontSize: "8.5px", color: "#555", marginTop: "2px", lineHeight: "1.55" }}>{proj.description}</div>
                )}
                {(proj.technologies ?? []).length > 0 && (
                  <div style={{ fontSize: "7.5px", color: "#9ca3af", marginTop: "2px", fontStyle: "italic" }}>{(proj.technologies ?? []).join(" · ")}</div>
                )}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

// ── Template 17 – Dark Navy (full-bleed photo left, dark sidebar, progress bar skills, bold section titles) ──
function Template17({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = template.style?.font ?? "Arial";
    if (!font || font === "Arial" || font === "sans-serif") return;
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);

  const p = resume.personal_info;
  const navy = colors.primary ?? "#243847";

  // Deterministic pseudo-random skill percentages
  const skillPcts = [85, 90, 80, 95, 75, 88, 82, 92];

  const allFlatSkills = [
    ...(resume.skills?.technical ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools ?? []),
    ...(resume.skills?.cloud ?? []),
    ...(resume.skills?.soft ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  // Progress bar skill row
  const SkillBar = ({ label, pct }: { label: string; pct: number }) => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "7.5px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#374151" }}>{label}</span>
        <span style={{ fontSize: "7.5px", color: "#9ca3af" }}>{pct}%</span>
      </div>
      <div style={{ width: "100%", backgroundColor: "#e5e7eb", height: "5px", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ backgroundColor: navy, height: "100%", width: `${pct}%` }} />
      </div>
    </div>
  );

  // Left-border timeline section
  const TimelineSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: navy, letterSpacing: "0.04em", marginBottom: forExport ? "22px" : "11px" }}>
        {title}
      </div>
      <div style={{ borderLeft: `2.5px solid #d1d5db`, paddingLeft: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </section>
  );

  return (
    <div style={{ backgroundColor: "#ffffff",  boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif" }}>

      {/* ── TOP HEADER BAND ── */}
      <div style={{ padding: "18px 24px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f1f3" }}>
        <div>
          <div style={{ fontSize: "23px", fontWeight: "800", letterSpacing: "-0.02em", textTransform: "uppercase", color: navy, lineHeight: "1.08" }}>
            {p.full_name}
          </div>
          <div style={{ fontSize: "8.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "#5f6f7b", marginTop: "4px", fontWeight: "600" }}>
            {p.headline}
          </div>
        </div>
        <div style={{ backgroundColor: navy, color: "#fff", padding: "5px 14px", fontSize: "7px", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: "600" }}>
          Resume
        </div>
      </div>

      {/* ── BODY: LEFT (dark) + RIGHT (white) ── */}
      <div style={{ display: "flex", flex: 1, alignItems: "stretch" }}>

        {/* LEFT DARK SIDEBAR */}
        <div style={{ width: "36%", backgroundColor: navy, color: "#fff", flexShrink: 0, display: "flex", flexDirection: "column" }}>

          {/* Full-bleed profile photo */}
          <div style={{ width: "100%", height: "190px", overflow: "hidden", flexShrink: 0 }}>
            {profilePhoto
              ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : (
                <div style={{ width: "100%", height: "100%", backgroundColor: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", fontWeight: "bold", color: "rgba(255,255,255,0.4)" }}>
                  {p.full_name?.charAt(0) ?? "?"}
                </div>
              )}
          </div>

          {/* Sidebar content */}
          <div style={{ padding: "18px 20px", flex: 1 }}>

            {/* About Me */}
            {resume.summary && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", marginBottom: "7px" }}>About Me</div>
                <p style={{ fontSize: "8px", lineHeight: "1.78", color: "rgba(255,255,255,0.74)", margin: 0 }}>
                  {resume.summary}
                </p>
              </div>
            )}

            {/* Contact */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", marginBottom: "11px" }}>Contact</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px", fontSize: "8px", color: "rgba(255,255,255,0.74)" }}>
                {p.location  && <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}><span style={{ flexShrink: 0 }}>📍</span><span style={{ wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.location}</span></div>}
                {p.phone     && <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}><span style={{ flexShrink: 0 }}>📞</span><span style={{ wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.phone}</span></div>}
                {p.email     && <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}><span style={{ flexShrink: 0 }}>✉️</span><span style={{ wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.email}</span></div>}
                {p.linkedin  && <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}><span style={{ flexShrink: 0 }}>🔗</span><span style={{ wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.linkedin}</span></div>}
                {p.github    && <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}><span style={{ flexShrink: 0 }}>🐙</span><span style={{ wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.github}</span></div>}
                {p.portfolio && <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}><span style={{ flexShrink: 0 }}>🌐</span><span style={{ wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{p.portfolio}</span></div>}
              </div>
            </div>

            {/* Certifications */}
            {(resume.certifications ?? []).length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", marginBottom: "9px" }}>Certifications</div>
                <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
                  {(resume.certifications ?? []).map((c, i) => (
                    <li key={i} style={{ fontSize: "8px", color: "rgba(255,255,255,0.74)", marginBottom: "5px", lineHeight: "1.55" }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages */}
            {(resume.languages ?? []).length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#fff", marginBottom: "9px" }}>Languages</div>
                <ul style={{ listStyleType: "disc", paddingLeft: "14px", margin: 0 }}>
                  {(resume.languages ?? []).map((lang, i) => (
                    <li key={i} style={{ fontSize: "8px", color: "rgba(255,255,255,0.74)", marginBottom: "5px", lineHeight: "1.55" }}>{lang}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT WHITE CONTENT */}
        <div style={{ flex: 1, padding: "18px 20px", boxSizing: "border-box", minWidth: 0 }}>

          {/* Education */}
          {(resume.education ?? []).length > 0 && (
            <TimelineSection title="Education">
              {(resume.education ?? []).map((edu, i) => (
                <div key={i} style={{ marginBottom: i < (resume.education ?? []).length - 1 ? "10px" : 0 }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: navy, lineHeight: "1.3" }}>
                    {edu.degree}{edu.field ? ` of ${edu.field}` : ""}
                  </div>
                  <div style={{ fontSize: "8px", color: "#9ca3af", marginTop: "3px" }}>
                    {edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}
                  </div>
                  <div style={{ fontSize: "8.5px", color: "#4b5563", marginTop: "3px" }}>
                    {edu.institution}
                  </div>
                </div>
              ))}
            </TimelineSection>
          )}

          {/* Experience */}
          {(resume.experience ?? []).length > 0 && (
            <TimelineSection title="Experience">
              {(resume.experience ?? []).map((exp, i) => (
                <div key={i} style={{ marginBottom: i < (resume.experience ?? []).length - 1 ? "12px" : 0 }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: navy, lineHeight: "1.3" }}>
                    {exp.title}{exp.company ? ` — ${exp.company}` : ""}
                  </div>
                  <div style={{ fontSize: "8px", color: "#9ca3af", marginTop: "3px" }}>
                    {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                  </div>
                  {(exp.responsibilities ?? []).length > 0 && (
                    <p style={{ fontSize: "8.5px", color: "#4b5563", lineHeight: "1.65", marginTop: "5px", marginBottom: 0 }}>
                      <RichText text={(exp.responsibilities ?? [])[0]} />
                    </p>
                  )}
                </div>
              ))}
            </TimelineSection>
          )}

          {/* Skills — 2-col progress bars */}
          {allFlatSkills.length > 0 && (
            <section style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", color: navy, letterSpacing: "0.04em", marginBottom: forExport ? "22px" : "12px" }}>
                Skills
              </div>
              {forExport ? (
                // Export mode: use explicit flex rows to avoid html2canvas CSS grid bug
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {Array.from({ length: Math.ceil(allFlatSkills.length / 2) }, (_, rowIdx) => (
                    <div key={rowIdx} style={{ display: "flex", gap: "22px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <SkillBar label={allFlatSkills[rowIdx * 2]} pct={skillPcts[(rowIdx * 2) % skillPcts.length]} />
                      </div>
                      {allFlatSkills[rowIdx * 2 + 1] !== undefined && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <SkillBar label={allFlatSkills[rowIdx * 2 + 1]} pct={skillPcts[(rowIdx * 2 + 1) % skillPcts.length]} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 22px" }}>
                  {allFlatSkills.map((sk, i) => (
                    <SkillBar key={i} label={sk} pct={skillPcts[i % skillPcts.length]} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Projects */}
          {(resume.projects ?? []).length > 0 && (
            <TimelineSection title="Projects">
              {(resume.projects ?? []).map((proj, i) => (
                <div key={i} style={{ marginBottom: i < (resume.projects ?? []).length - 1 ? "10px" : 0 }}>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: navy, lineHeight: "1.3" }}>{proj.name}</div>
                  {proj.description && (
                    <p style={{ fontSize: "8.5px", color: "#4b5563", lineHeight: "1.65", marginTop: "4px", marginBottom: 0 }}>{proj.description}</p>
                  )}
                  {(proj.technologies ?? []).length > 0 && (
                    <div style={{ fontSize: "7.5px", color: "#9ca3af", marginTop: "3px" }}>{(proj.technologies ?? []).join(" · ")}</div>
                  )}
                </div>
              ))}
            </TimelineSection>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Template 18 – Executive Classic (Playfair header, 3-col white card, serif accents) ──
function Template18({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = "Playfair Display";
    const id = "gfont-PlayfairDisplay";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Inter:wght@300;400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  const p = resume.personal_info;
  const accent = colors.primary ?? "#1a1a2e";

  const allT18Skills = [
    ...(resume.skills?.technical ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools ?? []),
    ...(resume.skills?.cloud ?? []),
    ...(resume.skills?.soft ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const SectionTitle = ({ title }: { title: string }) => (
    <div style={{
      fontSize: "8.5px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase",
      color: "#374151", borderBottom: "1px solid #d1d5db", paddingBottom: "4px", marginBottom: forExport ? "20px" : "8px",
    }}>{title}</div>
  );

  return (
    <div style={{ backgroundColor: "#e5e7eb", padding: "18px 14px", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ backgroundColor: "#ffffff", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", borderRadius: "10px", overflow: "hidden" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px 14px", borderBottom: "1px solid #e5e7eb" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: "700", fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.03em", color: "#111827", lineHeight: "1.15" }}>
              {p.full_name?.toUpperCase() ?? "YOUR NAME"}
            </div>
            <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "4px" }}>
              {p.headline}
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "8.5px", color: "#6b7280", display: "flex", flexDirection: "column", gap: "3px" }}>
            {p.phone    && <div>{p.phone}</div>}
            {p.email    && <div>{p.email}</div>}
            {p.location && <div>{p.location}</div>}
            {p.linkedin && <div>{p.linkedin}</div>}
          </div>
        </div>

        {/* ── BODY: left 1/3 sidebar + right 2/3 main ── */}
        <div style={{ display: "flex", gap: "0" }}>

          {/* LEFT SIDEBAR */}
          <div style={{ padding: "16px 16px 16px 22px", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: "16px", width: "33%", flexShrink: 0, boxSizing: "border-box" }}>

            {/* Education */}
            {(resume.education ?? []).length > 0 && (
              <div>
                <SectionTitle title="Education" />
                {(resume.education ?? []).map((edu, i) => (
                  <div key={i} style={{ marginBottom: i < (resume.education ?? []).length - 1 ? "10px" : 0 }}>
                    <div style={{ fontSize: "8.5px", fontWeight: "500", color: "#111827" }}>
                      {edu.institution}
                    </div>
                    <div style={{ fontSize: "8px", color: "#6b7280", marginTop: "2px" }}>
                      {edu.degree}{edu.field ? ` of ${edu.field}` : ""}
                    </div>
                    <div style={{ fontSize: "7.5px", color: "#9ca3af", marginTop: "1px" }}>
                      {edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {allT18Skills.length > 0 && (
              <div>
                <SectionTitle title="Skills" />
                <ul style={{ listStyleType: "disc", paddingLeft: "13px", margin: 0 }}>
                  {allT18Skills.map((sk, i) => (
                    <li key={i} style={{ fontSize: "8px", color: "#4b5563", marginBottom: "3px" }}>{sk}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Certifications */}
            {(resume.certifications ?? []).length > 0 && (
              <div>
                <SectionTitle title="Certifications" />
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {(resume.certifications ?? []).map((c, i) => (
                    <li key={i} style={{ fontSize: "8px", color: "#4b5563", marginBottom: "4px", lineHeight: "1.5" }}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Achievements */}
            {(resume.achievements ?? []).length > 0 && (
              <div>
                <SectionTitle title="Achievements" />
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {(resume.achievements ?? []).map((a, i) => (
                    <li key={i} style={{ fontSize: "8px", color: "#4b5563", marginBottom: "4px", lineHeight: "1.5" }}>• {a}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages */}
            {(resume.languages ?? []).length > 0 && (
              <div>
                <SectionTitle title="Languages" />
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {(resume.languages ?? []).map((lang, i) => (
                    <li key={i} style={{ fontSize: "8px", color: "#4b5563", marginBottom: "4px", lineHeight: "1.5" }}>• {lang}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT MAIN */}
          <div style={{ padding: "16px 22px 16px 18px", display: "flex", flexDirection: "column", gap: "16px", flex: 1, minWidth: 0 }}>

            {/* Summary */}
            {resume.summary && (
              <div>
                <SectionTitle title="Summary" />
                <p style={{ fontSize: "8.5px", color: "#6b7280", lineHeight: "1.7", margin: 0 }}>
                  {resume.summary}
                </p>
              </div>
            )}

            {/* Experience */}
            {(resume.experience ?? []).length > 0 && (
              <div>
                <SectionTitle title="Professional Experience" />
                {(resume.experience ?? []).map((exp, i) => (
                  <div key={i} style={{ marginBottom: i < (resume.experience ?? []).length - 1 ? "12px" : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontSize: "9px", fontWeight: "500", color: "#111827" }}>{exp.title}</div>
                      <div style={{ fontSize: "7.5px", color: "#9ca3af", whiteSpace: "nowrap", paddingLeft: "8px", flexShrink: 0 }}>
                        {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                      </div>
                    </div>
                    <div style={{ fontSize: "8px", color: "#9ca3af", marginBottom: "4px" }}>
                      {exp.company}{exp.location ? ` | ${exp.location}` : ""}
                    </div>
                    <ul style={{ listStyleType: "disc", paddingLeft: "13px", margin: 0 }}>
                      {(exp.responsibilities ?? []).slice(0, 4).map((r, j) => (
                        <li key={j} style={{ fontSize: "8.5px", color: "#6b7280", marginBottom: "2px", lineHeight: "1.6" }}>
                          <RichText text={r} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {(resume.projects ?? []).length > 0 && (
              <div>
                <SectionTitle title="Projects" />
                {(resume.projects ?? []).map((proj, i) => (
                  <div key={i} style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "9px", fontWeight: "500", color: "#111827" }}>{proj.name}</div>
                    {proj.description && (
                      <div style={{ fontSize: "8.5px", color: "#6b7280", marginTop: "2px", lineHeight: "1.55" }}>{proj.description}</div>
                    )}
                    {(proj.technologies ?? []).length > 0 && (
                      <div style={{ fontSize: "7.5px", color: "#9ca3af", marginTop: "2px" }}>{(proj.technologies ?? []).join(" · ")}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

// ── Template 20 – Gray Sidebar Classic (Lorna Alvarado: dark gray sidebar, round avatar, checkmark skills) ──
function Template20({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;

  useEffect(() => {
    const font = template.style?.font ?? "Inter";
    const id = "gfont-" + font.replace(/\s+/g, "-");
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap`;
    document.head.appendChild(link);
  }, [template.style?.font]);

  const p = resume.personal_info;
  const sidebarBg = colors.primary ?? "#1f2937";

  const allFlatSkills = [
    ...(resume.skills?.technical  ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools      ?? []),
    ...(resume.skills?.cloud      ?? []),
    ...(resume.skills?.soft       ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  // Languages — use dedicated field, fall back to soft skills if empty
  const languages = (resume.languages ?? []).length > 0
    ? (resume.languages ?? [])
    : (resume.skills?.soft ?? []).slice(0, 4);

  const SideLabel = ({ title }: { title: string }) => (
    <div style={{ fontSize: "7.5px", fontWeight: "600", letterSpacing: "0.08em", color: "rgba(255,255,255,0.55)", marginBottom: "6px", textTransform: "uppercase" as const }}>
      {title}
    </div>
  );

  const DotBullet = ({ text }: { text: string }) => (
    <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.82)", marginBottom: "3px", lineHeight: "1.5", display: "flex", gap: "5px" }}>
      <span style={{ flexShrink: 0, color: "rgba(255,255,255,0.5)" }}>✔</span> {text}
    </div>
  );

  const MainHeading = ({ title }: { title: string }) => (
    <div style={{ fontSize: "8px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: colors.secondary ?? "#1f2937", borderBottom: "1px solid #d1d5db", paddingBottom: "3px", marginBottom: forExport ? "20px" : "8px" }}>
      {title}
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "stretch", backgroundColor: "#f3f4f6", minHeight: "100%" }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: "33%", backgroundColor: sidebarBg, color: "#fff", padding: "20px 14px", boxSizing: "border-box", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Avatar */}
        <div style={{ width: "68px", height: "68px", borderRadius: "50%", border: "3px solid rgba(255,255,255,0.7)", overflow: "hidden", marginBottom: "14px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)", fontSize: "22px", fontWeight: "bold", color: "#fff" }}>
          {profilePhoto
            ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (p.full_name?.charAt(0) ?? "?")}
        </div>

        {/* About Me */}
        {resume.summary && (
          <div style={{ width: "100%", marginBottom: "14px" }}>
            <SideLabel title="About Me" />
            <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.75)", lineHeight: "1.65", margin: 0 }}>
              {resume.summary}
            </p>
          </div>
        )}

        {/* Contact */}
        <div style={{ width: "100%", marginBottom: "14px" }}>
          <SideLabel title="Contact" />
          <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.8)", lineHeight: "1.8", wordBreak: "break-all", overflowWrap: "anywhere" }}>
            {p.phone    && <div>📞 {p.phone}</div>}
            {p.email    && <div>✉ {p.email}</div>}
            {p.location && <div>📍 {p.location}</div>}
            {p.linkedin && <div>🔗 {p.linkedin}</div>}
            {p.github   && <div>🐙 {p.github}</div>}
            {p.portfolio && <div>🌐 {p.portfolio}</div>}
          </div>
        </div>

        {/* Skills */}
        {allFlatSkills.length > 0 && (
          <div style={{ width: "100%", marginBottom: "14px" }}>
            <SideLabel title="Skills" />
            {allFlatSkills.map((sk, i) => <DotBullet key={i} text={sk} />)}
          </div>
        )}

        {/* Certifications */}
        {(resume.certifications ?? []).length > 0 && (
          <div style={{ width: "100%", marginBottom: "14px" }}>
            <SideLabel title="Certifications" />
            {(resume.certifications ?? []).map((c, i) => <DotBullet key={i} text={c} />)}
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div style={{ width: "100%" }}>
            <SideLabel title="Language" />
            {languages.map((lang, i) => (
              <div key={i} style={{ fontSize: "8px", color: "rgba(255,255,255,0.82)", marginBottom: "3px" }}>{lang}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT CONTENT ── */}
      <div style={{ flex: 1, padding: "20px 18px", boxSizing: "border-box", backgroundColor: "#f9fafb" }}>

        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "19px", fontWeight: "700", letterSpacing: "0.04em", color: colors.secondary ?? "#111827", lineHeight: "1.15" }}>
            {p.full_name?.toUpperCase() ?? "YOUR NAME"}
          </div>
          {p.headline && (
            <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "3px" }}>{p.headline}</div>
          )}
        </div>

        {/* Education */}
        {(resume.education ?? []).length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <MainHeading title="Education" />
            {(resume.education ?? []).map((edu, i) => (
              <div key={i} style={{ paddingLeft: "10px", borderLeft: `2px solid ${sidebarBg}`, marginBottom: "10px", position: "relative" }}>
                <div style={{ position: "absolute", left: "-5px", top: "3px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: sidebarBg }} />
                <div style={{ fontSize: "7.5px", color: "#9ca3af" }}>
                  {edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}
                </div>
                <div style={{ fontSize: "9px", fontWeight: "600", color: "#1f2937", lineHeight: "1.3" }}>{edu.institution}</div>
                <div style={{ fontSize: "8px", color: "#6b7280", marginTop: "1px" }}>
                  {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Experience */}
        {(resume.experience ?? []).length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <MainHeading title="Professional Experience" />
            {(resume.experience ?? []).map((exp, i) => (
              <div key={i} style={{ paddingLeft: "10px", borderLeft: `2px solid ${sidebarBg}`, marginBottom: "12px", position: "relative" }}>
                <div style={{ position: "absolute", left: "-5px", top: "3px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: sidebarBg }} />
                <div style={{ fontSize: "7.5px", color: "#9ca3af" }}>
                  {exp.start_date} – {exp.is_current ? "Present" : exp.end_date}
                </div>
                <div style={{ fontSize: "9px", fontWeight: "600", color: "#1f2937", lineHeight: "1.3" }}>{exp.title}</div>
                <div style={{ fontSize: "8px", color: "#6b7280", marginBottom: "4px" }}>
                  {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                </div>
                {(exp.responsibilities ?? []).slice(0, 3).map((r, j) => (
                  <div key={j} style={{ fontSize: "8px", color: "#6b7280", lineHeight: "1.6", display: "flex", gap: "4px" }}>
                    <span style={{ flexShrink: 0 }}>•</span><RichText text={r} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {(resume.projects ?? []).length > 0 && (
          <div style={{ marginBottom: "14px" }}>
            <MainHeading title="Projects" />
            {(resume.projects ?? []).map((proj, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "9px", fontWeight: "600", color: "#1f2937" }}>{proj.name}</div>
                {proj.description && (
                  <div style={{ fontSize: "8px", color: "#6b7280", marginTop: "2px", lineHeight: "1.5" }}>{proj.description}</div>
                )}
                {(proj.technologies ?? []).length > 0 && (
                  <div style={{ fontSize: "7.5px", color: "#9ca3af", marginTop: "2px" }}>{(proj.technologies ?? []).join(" · ")}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Achievements */}
        {(resume.achievements ?? []).length > 0 && (
          <div>
            <MainHeading title="Achievements" />
            {(resume.achievements ?? []).map((a, i) => (
              <div key={i} style={{ fontSize: "8px", color: "#6b7280", marginBottom: "4px", lineHeight: "1.55", display: "flex", gap: "5px" }}>
                <span style={{ flexShrink: 0 }}>•</span> {a}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface LayoutProps {
  resume: ParsedResume;
  template: Template;
  allSkills: string[];
  sectionOrder: string[];
  profilePhoto?: string | null;
  forExport?: boolean;
}

function SidebarBlock({ title, children, light }: { title: string; children: React.ReactNode; light?: boolean }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "7.5px", fontWeight: "800", letterSpacing: "0.18em", opacity: light ? 0.5 : 0.55, marginBottom: "6px", borderBottom: light ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.2)", paddingBottom: "3px" }}>{title}</div>
      {children}
    </div>
  );
}

function SidebarItem({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "8.5px", marginBottom: "5px", opacity: 0.84, lineHeight: "1.5", wordBreak: "break-all", overflowWrap: "anywhere", minWidth: 0 }}>{children}</div>;
}

function Template19({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const p = resume.personal_info;

  const allT19Skills = [
    ...(resume.skills?.technical  ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools      ?? []),
    ...(resume.skills?.cloud      ?? []),
    ...(resume.skills?.soft       ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const SectionHeading = ({ title }: { title: string }) => (
    <div style={{
      fontSize: "8px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase",
      color: "#1f2937", borderBottom: "1px solid #9ca3af", paddingBottom: "3px", marginBottom: forExport ? "20px" : "8px",
    }}>{title}</div>
  );

  return (
    <div style={{ backgroundColor: "#e5e7eb", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "18px 14px", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ backgroundColor: "#f3f4f6", width: "100%", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", overflow: "hidden", display: "flex" }}>

        {/* LEFT SIDEBAR */}
        <div style={{ backgroundColor: "#e5e7eb", padding: "20px 14px", display: "flex", flexDirection: "column", gap: "14px", width: "33%", flexShrink: 0, boxSizing: "border-box" }}>

          {/* Avatar */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="profile" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
            )}
          </div>

          {/* About */}
          {resume.summary && (
            <div>
              <SectionHeading title="About Me" />
              <p style={{ fontSize: "8px", color: "#4b5563", lineHeight: "1.7", margin: 0 }}>{resume.summary}</p>
            </div>
          )}

          {/* Skills */}
          {allT19Skills.length > 0 && (
            <div>
              <SectionHeading title="Skills" />
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {allT19Skills.map((sk, i) => (
                  <li key={i} style={{ fontSize: "8px", color: "#374151", marginBottom: "4px" }}>{sk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements / Rewards */}
          {(resume.achievements ?? []).length > 0 && (
            <div>
              <SectionHeading title="Achievements" />
              {(resume.achievements ?? []).map((a, i) => (
                <p key={i} style={{ fontSize: "8px", color: "#4b5563", marginBottom: "4px", lineHeight: "1.55" }}>{a}</p>
              ))}
            </div>
          )}

          {/* Certifications */}
          {(resume.certifications ?? []).length > 0 && (
            <div>
              <SectionHeading title="Certifications" />
              {(resume.certifications ?? []).map((c, i) => (
                <p key={i} style={{ fontSize: "8px", color: "#4b5563", marginBottom: "4px", lineHeight: "1.55" }}>{c}</p>
              ))}
            </div>
          )}

          {/* Languages */}
          {(resume.languages ?? []).length > 0 && (
            <div>
              <SectionHeading title="Languages" />
              {(resume.languages ?? []).map((lang, i) => (
                <p key={i} style={{ fontSize: "8px", color: "#4b5563", marginBottom: "4px", lineHeight: "1.55" }}>{lang}</p>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT MAIN */}
        <div style={{ backgroundColor: "#f9fafb", padding: "20px 20px 20px 18px", display: "flex", flexDirection: "column", gap: "14px", flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: "4px" }}>
            <div style={{ fontSize: "20px", fontWeight: "600", letterSpacing: "0.06em", color: "#111827", lineHeight: "1.2" }}>
              {p.full_name?.toUpperCase() ?? "YOUR NAME"}
            </div>
            {p.headline && (
              <div style={{ fontSize: "8.5px", color: "#6b7280", marginTop: "3px" }}>{p.headline}</div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "6px" }}>
              {p.phone && <span style={{ fontSize: "8px", color: "#6b7280" }}><strong>Phone:</strong> {p.phone}</span>}
              {p.email && <span style={{ fontSize: "8px", color: "#6b7280" }}><strong>Email:</strong> {p.email}</span>}
              {p.location && <span style={{ fontSize: "8px", color: "#6b7280" }}><strong>Address:</strong> {p.location}</span>}
            </div>
          </div>

          {/* Experience */}
          {(resume.experience ?? []).length > 0 && (
            <div>
              <SectionHeading title="Experience" />
              {(resume.experience ?? []).map((exp, i) => (
                <div key={i} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "8.5px", fontWeight: "500", color: "#111827" }}>{exp.title}</div>
                    <div style={{ fontSize: "7.5px", color: "#9ca3af", whiteSpace: "nowrap", paddingLeft: "8px", flexShrink: 0 }}>
                      {exp.start_date} - {exp.is_current ? "Present" : exp.end_date}
                    </div>
                  </div>
                  <div style={{ fontSize: "8px", color: "#9ca3af", marginBottom: "3px" }}>
                    {exp.company}{exp.location ? `, ${exp.location}` : ""}
                  </div>
                  {(exp.responsibilities ?? []).slice(0, 3).map((r, j) => (
                    <div key={j} style={{ fontSize: "8px", color: "#6b7280", lineHeight: "1.6" }}>
                      <RichText text={r} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {(resume.education ?? []).length > 0 && (
            <div>
              <SectionHeading title="Education" />
              {(resume.education ?? []).map((edu, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "8.5px", fontWeight: "500", color: "#111827" }}>
                      {edu.degree}{edu.field ? ` of ${edu.field}` : ""}
                    </div>
                    <div style={{ fontSize: "7.5px", color: "#9ca3af", whiteSpace: "nowrap", paddingLeft: "8px", flexShrink: 0 }}>
                      {edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: "8px", color: "#9ca3af" }}>{edu.institution}</div>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {(resume.projects ?? []).length > 0 && (
            <div>
              <SectionHeading title="Projects" />
              {(resume.projects ?? []).map((proj, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "8.5px", fontWeight: "500", color: "#111827" }}>{proj.name}</div>
                  {proj.description && (
                    <div style={{ fontSize: "8px", color: "#6b7280", marginTop: "2px", lineHeight: "1.55" }}>{proj.description}</div>
                  )}
                  {(proj.technologies ?? []).length > 0 && (
                    <div style={{ fontSize: "7.5px", color: "#9ca3af", marginTop: "2px" }}>{(proj.technologies ?? []).join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 21 — "Playfair Executive" (3-column, Playfair Display header)
// Inspired by: Isabel Mercado clean secretary layout
// ─────────────────────────────────────────────────────────────────────────────
function Template21({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;
  const accent = colors.primary ?? "#1a1a2e";
  const p = resume.personal_info;

  const allFlatSkills = [
    ...(resume.skills?.technical  ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools      ?? []),
    ...(resume.skills?.cloud      ?? []),
    ...(resume.skills?.soft       ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const SectionLabel = ({ title }: { title: string }) => (
    <div style={{
      fontSize: "7px",
      fontWeight: "700",
      letterSpacing: "0.14em",
      textTransform: "uppercase" as const,
      color: accent,
      borderBottom: `1px solid ${accent}30`,
      paddingBottom: "3px",
      marginBottom: forExport ? "18px" : "7px",
    }}>
      {title}
    </div>
  );

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      backgroundColor: "#ffffff",
      padding: "28px 26px",
      boxSizing: "border-box",
      minHeight: "100%",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottom: `2px solid ${accent}`,
        paddingBottom: "10px",
        marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Profile photo or initials */}
          {profilePhoto ? (
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${accent}20` }}>
              <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : null}
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "19px",
              fontWeight: "700",
              letterSpacing: "0.06em",
              color: "#111827",
              lineHeight: "1.1",
            }}>
              {(p.full_name ?? "YOUR NAME").toUpperCase()}
            </div>
            {p.headline && (
              <div style={{ fontSize: "8.5px", color: "#6b7280", marginTop: "3px", letterSpacing: "0.02em" }}>
                {p.headline}
              </div>
            )}
          </div>
        </div>

        {/* Contact info top right */}
        <div style={{ textAlign: "right", fontSize: "8px", color: "#6b7280", lineHeight: "1.9" }}>
          {p.phone    && <div>{p.phone}</div>}
          {p.email    && <div>{p.email}</div>}
          {p.location && <div>{p.location}</div>}
          {p.linkedin && <div>{p.linkedin}</div>}
        </div>
      </div>

      {/* ── BODY — 3-column grid: left sidebar (1fr), divider, right content (2fr) ── */}
      <div style={{ display: "flex", gap: "0 14px" }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "calc(33.333% - 8px)", flexShrink: 0, boxSizing: "border-box" }}>

          {/* Education */}
          {(resume.education ?? []).length > 0 && (
            <div>
              <SectionLabel title="Education" />
              {(resume.education ?? []).map((edu, i) => (
                <div key={i} style={{ marginBottom: "8px" }}>
                  <div style={{ fontSize: "8.5px", fontWeight: "600", color: "#111827", lineHeight: "1.3" }}>
                    {edu.institution}
                  </div>
                  <div style={{ fontSize: "7.5px", color: "#6b7280", marginTop: "1px" }}>
                    {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                  </div>
                  <div style={{ fontSize: "7px", color: "#9ca3af", marginTop: "1px" }}>
                    {edu.start_year}{edu.end_year ? ` – ${edu.end_year}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {allFlatSkills.length > 0 && (
            <div>
              <SectionLabel title="Skills" />
              <ul style={{ margin: 0, paddingLeft: "10px", fontSize: "8px", color: "#374151", lineHeight: "1.8" }}>
                {allFlatSkills.map((sk, i) => (
                  <li key={i} style={{ marginBottom: "1px" }}>{sk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Certifications */}
          {(resume.certifications ?? []).length > 0 && (
            <div>
              <SectionLabel title="Certifications" />
              <ul style={{ margin: 0, paddingLeft: "0", listStyle: "none", fontSize: "8px", color: "#374151", lineHeight: "1.8" }}>
                {(resume.certifications ?? []).map((c, i) => (
                  <li key={i} style={{ marginBottom: "2px" }}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Languages */}
          {(resume.languages ?? []).length > 0 && (
            <div>
              <SectionLabel title="Languages" />
              <ul style={{ margin: 0, paddingLeft: "0", listStyle: "none", fontSize: "8px", color: "#374151", lineHeight: "1.8" }}>
                {(resume.languages ?? []).map((lang, i) => (
                  <li key={i} style={{ marginBottom: "2px" }}>{lang}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements */}
          {(resume.achievements ?? []).length > 0 && (
            <div>
              <SectionLabel title="Achievements" />
              <ul style={{ margin: 0, paddingLeft: "0", listStyle: "none", fontSize: "8px", color: "#374151", lineHeight: "1.8" }}>
                {(resume.achievements ?? []).map((a, i) => (
                  <li key={i} style={{ marginBottom: "2px", display: "flex", gap: "4px" }}>
                    <span style={{ flexShrink: 0, color: accent }}>▸</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Projects (sidebar, brief) */}
          {(resume.projects ?? []).length > 0 && (
            <div>
              <SectionLabel title="Projects" />
              {(resume.projects ?? []).map((proj, i) => (
                <div key={i} style={{ marginBottom: "6px" }}>
                  <div style={{ fontSize: "8px", fontWeight: "600", color: "#111827" }}>{proj.name}</div>
                  {proj.description && (
                    <div style={{ fontSize: "7.5px", color: "#6b7280", lineHeight: "1.5", marginTop: "1px" }}>
                      {proj.description}
                    </div>
                  )}
                  {(proj.technologies ?? []).length > 0 && (
                    <div style={{ fontSize: "7px", color: accent, marginTop: "1px" }}>
                      {(proj.technologies ?? []).join(" · ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ backgroundColor: `${accent}20`, borderRadius: "1px", width: "2px", flexShrink: 0 }} />

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minWidth: 0 }}>

          {/* Summary */}
          {resume.summary && (
            <div>
              <SectionLabel title="Summary" />
              <p style={{ fontSize: "8.5px", color: "#4b5563", lineHeight: "1.7", margin: 0 }}>
                {resume.summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {(resume.experience ?? []).length > 0 && (
            <div>
              <SectionLabel title="Professional Experience" />
              {(resume.experience ?? []).map((exp, i) => (
                <div key={i} style={{ marginBottom: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "9px", fontWeight: "600", color: "#111827" }}>{exp.title}</div>
                    <div style={{ fontSize: "7px", color: "#9ca3af", flexShrink: 0, marginLeft: "6px" }}>
                      {exp.start_date} – {exp.is_current ? "Present" : exp.end_date}
                    </div>
                  </div>
                  <div style={{ fontSize: "7.5px", color: accent, marginBottom: "3px" }}>
                    {exp.company}{exp.location ? ` · ${exp.location}` : ""}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "10px", fontSize: "8px", color: "#6b7280", lineHeight: "1.7" }}>
                    {(exp.responsibilities ?? []).slice(0, 4).map((r, j) => (
                      <li key={j}><RichText text={r} /></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 22 — "Diamond Split" (centered name, horizontal bars, 2-col with
//               center divider line and diamond accent points)
// Inspired by: Hannah Morales Customer Planning Manager layout
// ─────────────────────────────────────────────────────────────────────────────
function Template22({ resume, template, allSkills, sectionOrder, profilePhoto, forExport = false }: LayoutProps) {
  const { colors } = template;
  const accent = colors.primary ?? "#111827";
  const p = resume.personal_info;

  const allFlatSkills = [
    ...(resume.skills?.technical  ?? []),
    ...(resume.skills?.frameworks ?? []),
    ...(resume.skills?.tools      ?? []),
    ...(resume.skills?.cloud      ?? []),
    ...(resume.skills?.soft       ?? []),
  ].filter((v, i, a) => v && a.indexOf(v) === i);

  const SectionLabel = ({ title }: { title: string }) => (
    <div style={{
      fontSize: "6.5px",
      fontWeight: "700",
      letterSpacing: "0.18em",
      textTransform: "uppercase" as const,
      color: "#111827",
      marginBottom: forExport ? "16px" : "5px",
    }}>
      {title}
    </div>
  );

  // Diamond shape using a rotated square
  const Diamond = ({ top }: { top: string }) => (
    <div style={{
      position: "absolute",
      left: "50%",
      top,
      transform: "translate(-50%, -50%) rotate(45deg)",
      width: "9px",
      height: "9px",
      backgroundColor: accent,
      zIndex: 2,
    }} />
  );

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      backgroundColor: "#f3f4f6",
      padding: "24px 22px",
      boxSizing: "border-box",
      minHeight: "100%",
    }}>

      {/* ── HEADER: horizontal bars + centered name ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "18px",
        gap: "10px",
      }}>
        <div style={{ width: "54px", height: "3px", backgroundColor: "#9ca3af", borderRadius: "1px", flexShrink: 0 }} />
        <div style={{ textAlign: "center" }}>
          {/* Optional avatar */}
          {profilePhoto && (
            <div style={{ width: "46px", height: "46px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 6px", border: `2px solid ${accent}30` }}>
              <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{
            fontSize: "14px",
            fontWeight: "600",
            letterSpacing: "0.18em",
            color: "#111827",
            lineHeight: "1.1",
          }}>
            {(p.full_name ?? "YOUR NAME").toUpperCase()}
          </div>
          {p.headline && (
            <div style={{ fontSize: "7.5px", color: "#6b7280", marginTop: "3px", letterSpacing: "0.04em" }}>
              {p.headline}
            </div>
          )}
        </div>
        <div style={{ width: "54px", height: "3px", backgroundColor: "#9ca3af", borderRadius: "1px", flexShrink: 0 }} />
      </div>

      {/* ── BODY: 2-col with center divider + diamonds ── */}
      <div style={{ position: "relative" }}>

        {/* Center vertical line */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: "1px",
          backgroundColor: "#9ca3af",
          zIndex: 1,
        }} />

        {/* Diamond accents at 33% and 66% */}
        <Diamond top="33%" />
        <Diamond top="66%" />

        <div style={{ display: "flex", gap: "0" }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ paddingRight: "18px", display: "flex", flexDirection: "column", gap: "14px", width: "50%", flexShrink: 0, boxSizing: "border-box" }}>

            {/* Contact */}
            <div>
              <SectionLabel title="Contact" />
              {p.phone && (
                <div style={{ marginBottom: "5px" }}>
                  <div style={{ fontSize: "8px", fontWeight: "600", color: "#111827" }}>Phone</div>
                  <div style={{ fontSize: "8px", color: "#4b5563" }}>{p.phone}</div>
                </div>
              )}
              {p.email && (
                <div style={{ marginBottom: "5px" }}>
                  <div style={{ fontSize: "8px", fontWeight: "600", color: "#111827" }}>Email</div>
                  <div style={{ fontSize: "8px", color: "#4b5563", wordBreak: "break-all" }}>{p.email}</div>
                </div>
              )}
              {p.location && (
                <div style={{ marginBottom: "5px" }}>
                  <div style={{ fontSize: "8px", fontWeight: "600", color: "#111827" }}>Location</div>
                  <div style={{ fontSize: "8px", color: "#4b5563" }}>{p.location}</div>
                </div>
              )}
              {p.linkedin && (
                <div style={{ marginBottom: "5px" }}>
                  <div style={{ fontSize: "8px", fontWeight: "600", color: "#111827" }}>LinkedIn</div>
                  <div style={{ fontSize: "8px", color: "#4b5563", wordBreak: "break-all" }}>{p.linkedin}</div>
                </div>
              )}
              {p.portfolio && (
                <div>
                  <div style={{ fontSize: "8px", fontWeight: "600", color: "#111827" }}>Website</div>
                  <div style={{ fontSize: "8px", color: "#4b5563", wordBreak: "break-all" }}>{p.portfolio}</div>
                </div>
              )}
            </div>

            {/* Education */}
            {(resume.education ?? []).length > 0 && (
              <div>
                <SectionLabel title="Education" />
                {(resume.education ?? []).map((edu, i) => (
                  <div key={i} style={{ marginBottom: "8px" }}>
                    <div style={{ fontSize: "8.5px", fontWeight: "500", color: "#111827" }}>{edu.institution}</div>
                    <div style={{ fontSize: "7.5px", color: "#6b7280", marginTop: "1px" }}>
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                    </div>
                    <div style={{ fontSize: "7px", color: "#9ca3af", marginTop: "1px" }}>
                      {edu.start_year}{edu.end_year ? ` – ${edu.end_year}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {allFlatSkills.length > 0 && (
              <div>
                <SectionLabel title="Skills" />
                <ul style={{ margin: 0, paddingLeft: "11px", fontSize: "8px", color: "#4b5563", lineHeight: "1.9" }}>
                  {allFlatSkills.map((sk, i) => (
                    <li key={i}>{sk}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Certifications */}
            {(resume.certifications ?? []).length > 0 && (
              <div>
                <SectionLabel title="Certifications" />
                <ul style={{ margin: 0, paddingLeft: "11px", fontSize: "8px", color: "#4b5563", lineHeight: "1.9" }}>
                  {(resume.certifications ?? []).map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Languages */}
            {(resume.languages ?? []).length > 0 && (
              <div>
                <SectionLabel title="Languages" />
                <ul style={{ margin: 0, paddingLeft: "11px", fontSize: "8px", color: "#4b5563", lineHeight: "1.9" }}>
                  {(resume.languages ?? []).map((lang, i) => (
                    <li key={i}>{lang}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "14px", flex: 1, minWidth: 0 }}>

            {/* Personal Statement / Summary */}
            {resume.summary && (
              <div>
                <SectionLabel title="Personal Statement" />
                <p style={{ fontSize: "8px", color: "#4b5563", lineHeight: "1.75", margin: 0 }}>
                  {resume.summary}
                </p>
              </div>
            )}

            {/* Work Experience */}
            {(resume.experience ?? []).length > 0 && (
              <div>
                <SectionLabel title="Work Experience" />
                {(resume.experience ?? []).map((exp, i) => (
                  <div key={i} style={{ marginBottom: "11px" }}>
                    <div style={{ fontSize: "8.5px", fontWeight: "500", color: "#111827" }}>{exp.title}</div>
                    <div style={{ fontSize: "7.5px", color: "#9ca3af", marginBottom: "3px" }}>
                      {exp.company}{exp.location ? ` · ${exp.location}` : ""} | {exp.start_date} – {exp.is_current ? "Present" : exp.end_date}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "11px", fontSize: "8px", color: "#4b5563", lineHeight: "1.75" }}>
                      {(exp.responsibilities ?? []).slice(0, 4).map((r, j) => (
                        <li key={j}><RichText text={r} /></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {(resume.projects ?? []).length > 0 && (
              <div>
                <SectionLabel title="Projects" />
                {(resume.projects ?? []).map((proj, i) => (
                  <div key={i} style={{ marginBottom: "7px" }}>
                    <div style={{ fontSize: "8.5px", fontWeight: "500", color: "#111827" }}>{proj.name}</div>
                    {proj.description && (
                      <div style={{ fontSize: "8px", color: "#6b7280", marginTop: "1px", lineHeight: "1.55" }}>{proj.description}</div>
                    )}
                    {(proj.technologies ?? []).length > 0 && (
                      <div style={{ fontSize: "7px", color: accent, marginTop: "1px" }}>
                        {(proj.technologies ?? []).join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Achievements */}
            {(resume.achievements ?? []).length > 0 && (
              <div>
                <SectionLabel title="Achievements" />
                <ul style={{ margin: 0, paddingLeft: "11px", fontSize: "8px", color: "#4b5563", lineHeight: "1.9" }}>
                  {(resume.achievements ?? []).map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}