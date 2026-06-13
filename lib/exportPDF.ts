import { ParsedResume, Template } from "@/types/builder";

/**
 * Exports the resume to PDF using html2canvas-pro (v2.0.4) + jsPDF (v4.2.1).
 */
export async function exportResumePDF(
  resume: ParsedResume,
  template: Template,
  options?: { fitToPage?: boolean; maxPages?: 1 | 2; scaleFactor?: number },
  previewElement?: HTMLElement
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  // ── 1. Find source node ──────────────────────────────────────────────────────
  const liveNode =
    document.getElementById("resume-preview") ??
    previewElement ??
    null;

  // ── 2. Build clone ───────────────────────────────────────────────────────────
  const clone = document.createElement("div");

  if (liveNode) {
    const inner = liveNode.cloneNode(true) as HTMLElement;

    inner.style.cssText = [
      "width:794px",
      "min-height:unset",
      "height:auto",
      "transform:none",
      "transform-origin:unset",
      "overflow:visible",
      "position:static",
      "zoom:1",
    ].join(" !important;") + " !important;";

    inner.querySelectorAll<HTMLElement>("*").forEach(el => {
      if (el.style.transform && el.style.transform !== "none") {
        el.style.transform = "none";
        el.style.transformOrigin = "";
      }
      if (el.style.zoom && el.style.zoom !== "1" && el.style.zoom !== "") {
        el.style.zoom = "1";
      }

      // ── Grid → flex conversion ───────────────────────────────────────────
      if (el.style.display === "grid") {
        const cols = el.style.gridTemplateColumns;
        if (cols && cols !== "" && cols !== "none") {
          const parts = cols.trim().split(/\s+/);
          const allFr = parts.every(p => /^[\d.]+fr$/.test(p));

          if (allFr && parts.length >= 2) {
            const total    = parts.reduce((s, p) => s + parseFloat(p), 0);
            const fracs    = parts.map(p => parseFloat(p) / total);

            // Extract column gap from gap shorthand ("10px 22px" → 22px) or columnGap
            const rawGap   = el.style.columnGap || el.style.gap || "";
            // gap shorthand: "row-gap col-gap" — take last token
            const gapPx    = rawGap ? rawGap.trim().split(/\s+/).pop()! : "0px";
            const gapNum   = parseFloat(gapPx) || 0;
            const colCount = parts.length;

            // Each column width = its fraction of (100% minus all gaps)
            // expressed as calc() so it's exact when rendered
            const totalGapPx = (colCount - 1) * gapNum;
            const widths = fracs.map(f =>
              totalGapPx > 0
                ? `calc(${(f * 100).toFixed(6)}% - ${(f * totalGapPx).toFixed(6)}px)`
                : `${(f * 100).toFixed(6)}%`
            );

            el.style.display             = "flex";
            el.style.flexWrap            = "nowrap";
            el.style.alignItems          = "flex-start";
            el.style.gridTemplateColumns = "";
            el.style.gap                 = "";
            el.style.columnGap           = "";

            (Array.from(el.children) as HTMLElement[]).forEach((child, i) => {
              child.style.width      = widths[i % widths.length];
              child.style.minWidth   = widths[i % widths.length];
              child.style.flexShrink = "0";
              child.style.boxSizing  = "border-box";
              // Use marginLeft for gap (not paddingLeft — padding adds to width with border-box)
              if (i > 0 && gapNum > 0) child.style.marginLeft = gapPx;
            });

          } else if (parts.length === 3 && parts[1] === "2px") {
            // Special case: "1fr 2px 2fr" divider layout — treat middle as fixed divider
            const gapNum   = 0;
            const leftFrac = parseFloat(parts[0]);
            const rightFrac = parseFloat(parts[2]);
            const total    = leftFrac + rightFrac;
            el.style.display             = "flex";
            el.style.flexWrap            = "nowrap";
            el.style.alignItems          = "flex-start";
            el.style.gridTemplateColumns = "";
            el.style.gap                 = "";
            const children = Array.from(el.children) as HTMLElement[];
            if (children[0]) { children[0].style.width = `${(leftFrac/total*100).toFixed(4)}%`; children[0].style.flexShrink = "0"; children[0].style.boxSizing = "border-box"; }
            if (children[1]) { children[1].style.width = "2px"; children[1].style.flexShrink = "0"; }
            if (children[2]) { children[2].style.width = `${(rightFrac/total*100).toFixed(4)}%`; children[2].style.flexShrink = "0"; children[2].style.boxSizing = "border-box"; }

          } else {
            el.style.display             = "flex";
            el.style.flexWrap            = "wrap";
            el.style.gridTemplateColumns = "";
            el.style.gap                 = "";
          }
        }
      }

      // ── Overflow: open all except images, avatar circles, and thin bars ───
      if (el.style.overflow === "hidden" || el.style.overflowX === "hidden" || el.style.overflowY === "hidden") {
        const hasImg    = el.querySelector("img") !== null || el.tagName === "IMG";
        // Avatar: square element with border-radius (circle)
        const w         = parseInt(el.style.width  || "0");
        const h         = parseInt(el.style.height || "0");
        const hasBR     = !!(el.style.borderRadius);
        const isCircle  = w > 0 && h > 0 && hasBR && Math.abs(w - h) <= 4;
        // Thin bar: height ≤ 8px inline (progress bars, dividers)
        const inlineH   = el.style.height ? parseInt(el.style.height) : Infinity;
        const isThinBar = inlineH <= 8;
        if (!hasImg && !isCircle && !isThinBar) {
          el.style.overflow  = "visible";
          el.style.overflowX = "visible";
          el.style.overflowY = "visible";
        }
      }

      if (el.style.position === "fixed") el.style.position = "static";
    });

    clone.appendChild(inner);
  } else {
    clone.innerHTML = buildFallbackHTML(resume, template);
  }

  // ── 3. Off-screen DOM ───────────────────────────────────────────────────────
  // Use position:absolute with a large negative left so it's off-screen but
  // still in normal flow — this ensures scrollHeight is computed correctly.
  const wrapper = document.createElement("div");
  Object.assign(wrapper.style, {
    position:   "absolute",
    top:        "0px",
    left:       "-9999px",
    width:      "794px",
    background: template.colors.background || "#ffffff",
    boxSizing:  "border-box",
    overflow:   "visible",
  });
  wrapper.appendChild(clone);

  // Anchor: position:absolute (NOT fixed width:0) so the wrapper gets a real
  // layout context and scrollHeight is computed correctly
  const anchor = document.createElement("div");
  Object.assign(anchor.style, {
    position:   "absolute",
    top:        "0px",
    left:       "0px",
    width:      "794px",
    height:     "0px",
    overflow:   "visible",
    zIndex:     "-1",
    pointerEvents: "none",
  });
  anchor.appendChild(wrapper);
  document.body.appendChild(anchor);

  // ── 4. Layout settle ─────────────────────────────────────────────────────────
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => setTimeout(r, 300));

  const imgs = Array.from(wrapper.querySelectorAll<HTMLImageElement>("img"));
  if (imgs.length) {
    await Promise.all(imgs.map(img =>
      img.complete ? Promise.resolve() :
        new Promise<void>(res => { img.onload = img.onerror = () => res(); })
    ));
    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 100));
  }

  try {
    // ── 5. Measure exact content height ──────────────────────────────────────
    // Gather heights from multiple sources and take the maximum
    const innerEl = clone.firstElementChild as HTMLElement ?? clone;

    // Force a reflow by reading offsetHeight
    void wrapper.offsetHeight;
    void innerEl.offsetHeight;

    const naturalH = Math.max(
      innerEl.scrollHeight      || 0,
      innerEl.offsetHeight      || 0,
      clone.scrollHeight        || 0,
      clone.offsetHeight        || 0,
      wrapper.scrollHeight      || 0,
      wrapper.offsetHeight      || 0,
      500 // minimum sanity floor
    );

    // Set wrapper height to full content height so html2canvas captures everything
    wrapper.style.height    = `${naturalH}px`;
    wrapper.style.minHeight = `${naturalH}px`;

    await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 80));

    // ── 6. Capture ────────────────────────────────────────────────────────────
    const canvas = await html2canvas(wrapper, {
      scale:           2,
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: template.colors.background || "#ffffff",
      logging:         false,
      windowWidth:     794,
      width:           794,
      height:          naturalH,
      windowHeight:    naturalH,
      scrollX:         0,
      scrollY:         0,
      x:               0,
      y:               0,
    });

    const pdf  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();   // 210 mm
    const pdfH = pdf.internal.pageSize.getHeight();  // 297 mm
    const imgW = canvas.width;
    let   imgH = canvas.height;

    // ── 7. Trim trailing blank rows ──────────────────────────────────────────
    // Scan pixel-by-pixel from the bottom to find the last row with content.
    // Sample every 4px (not 16px) to avoid missing thin skill bars.
    {
      const ctx = canvas.getContext("2d")!;

      const parseBg = (hex: string): [number,number,number] => {
        const h = (hex||"ffffff").replace("#","").padEnd(6,"0");
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
      };

      const bgSet: [number,number,number][] = [
        parseBg(template.colors.background||"#ffffff"),
        [255,255,255],[248,248,248],[245,245,245],[250,250,250],[243,244,246],[229,231,235],
      ];
      // Sample bottom corners to detect actual background colour
      [[0.1,0.97],[0.5,0.97],[0.9,0.97]].forEach(([fx,fy]) => {
        const d = ctx.getImageData(Math.floor(imgW*fx), Math.floor(imgH*fy), 4, 4).data;
        for (let i = 0; i < d.length; i += 4) bgSet.push([d[i], d[i+1], d[i+2]]);
      });

      const TOL = 18;
      const isBg = (r:number, g:number, b:number) =>
        bgSet.some(([br,bg,bb]) =>
          Math.abs(r-br)<=TOL && Math.abs(g-bg)<=TOL && Math.abs(b-bb)<=TOL);

      // Walk rows from bottom — scan from row 10 minimum (not 40% floor)
      // This prevents trimming skills/projects that appear in the lower portion
      let trimY = imgH;
      for (let row = imgH - 1; row >= 10; row--) {
        const d = ctx.getImageData(0, row, imgW, 1).data;
        let hasContent = false;
        // Sample every 4px for accuracy (catches thin progress bars)
        for (let x = 0; x < d.length; x += 16) {
          if (d[x+3] > 20 && !isBg(d[x], d[x+1], d[x+2])) { hasContent = true; break; }
        }
        if (hasContent) { trimY = row + 1; break; }
      }
      // Add a small bottom margin (20px @ 2x scale = 10px on page)
      imgH = Math.min(trimY + 40, canvas.height);
    }

    // ── 8. Slice into pages ──────────────────────────────────────────────────
    const mmPerPx      = pdfW / imgW;
    const pageHeightPx = Math.round(pdfH / mmPerPx); // ~2245px at scale 2

    let yOffset = 0;
    let pageCount = 0;

    while (yOffset < imgH) {
      const remaining = imgH - yOffset;

      // Skip trailing sliver < 60px (blank bottom padding artifact)
      if (remaining < 60 && pageCount > 0) break;

      if (pageCount > 0) pdf.addPage();

      const sliceH = Math.min(pageHeightPx, remaining);

      const sc = document.createElement("canvas");
      sc.width  = imgW;
      sc.height = sliceH;
      sc.getContext("2d")!.drawImage(
        canvas, 0, yOffset, imgW, sliceH,
        0, 0, imgW, sliceH
      );
      pdf.addImage(sc.toDataURL("image/png"), "PNG", 0, 0, pdfW, sliceH * mmPerPx);

      yOffset += sliceH;
      pageCount++;
    }

    const name = resume.personal_info.full_name?.replace(/\s+/g, "_") || "resume";
    pdf.save(`${name}_${template.name.replace(/\s+/g, "_")}.pdf`);

  } finally {
    document.body.removeChild(anchor);
  }
}

// ── Fallback HTML renderer ───────────────────────────────────────────────────
function buildFallbackHTML(resume: ParsedResume, template: Template): string {
  const { colors } = template;
  const p = resume.personal_info;
  const seen = new Set<string>();
  const allSkills = [
    ...resume.skills.technical, ...resume.skills.frameworks,
    ...resume.skills.tools,     ...resume.skills.cloud,
  ].filter(sk => {
    const k = sk.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k); return true;
  });

  const sec = (title: string, body: string) => `
    <div style="margin-bottom:14px;">
      <div style="font-size:10px;font-weight:900;letter-spacing:.1em;color:${colors.primary};
        border-bottom:1px solid ${colors.primary}40;padding-bottom:3px;margin-bottom:6px;">${title}</div>
      ${body}
    </div>`;

  return `
    <div style="background:${colors.background};color:${colors.secondary};font-family:sans-serif;
      font-size:11px;line-height:1.4;padding:32px;box-sizing:border-box;width:794px;">
      <div style="border-bottom:2px solid ${colors.primary};padding-bottom:12px;margin-bottom:16px;">
        <div style="font-size:22px;font-weight:900;color:${colors.primary};">${p.full_name}</div>
        <div style="font-size:9px;color:${colors.secondary};display:flex;gap:16px;flex-wrap:wrap;margin-top:4px;">
          ${p.email    ? `<span>✉ ${p.email}</span>`    : ""}
          ${p.phone    ? `<span>📞 ${p.phone}</span>`   : ""}
          ${p.location ? `<span>📍 ${p.location}</span>` : ""}
          ${p.linkedin ? `<span>🔗 ${p.linkedin}</span>` : ""}
        </div>
      </div>
      ${resume.summary ? sec("SUMMARY", `<p style="font-size:10px;line-height:1.5;color:${colors.secondary};">${resume.summary}</p>`) : ""}
      ${resume.experience.length ? sec("EXPERIENCE", resume.experience.map(e => `
        <div style="margin-bottom:10px;">
          <div style="font-weight:bold;font-size:11px;color:${colors.primary};">${e.title} @ ${e.company}</div>
          ${e.responsibilities.slice(0,4).map(r => `<div style="font-size:9px;padding-left:10px;">• ${r}</div>`).join("")}
        </div>`).join("")) : ""}
      ${resume.education.length ? sec("EDUCATION", resume.education.map(e => `
        <div style="margin-bottom:6px;">
          <div style="font-weight:bold;font-size:10px;color:${colors.primary};">${e.institution}</div>
          <div style="font-size:9px;">${e.degree}</div>
        </div>`).join("")) : ""}
      ${resume.projects.length ? sec("PROJECTS", resume.projects.map(pr => `
        <div style="margin-bottom:8px;">
          <div style="font-weight:bold;font-size:10px;color:${colors.primary};">${pr.name}</div>
          <div style="font-size:9px;">${pr.description}</div>
        </div>`).join("")) : ""}
      ${allSkills.length ? sec("SKILLS", `
        <div style="display:flex;flex-wrap:wrap;gap:5px;">
          ${allSkills.map(sk => `
            <span style="font-size:9px;padding:2px 8px;background:${colors.primary}15;
              color:${colors.primary};border-radius:20px;">${sk}</span>`).join("")}
        </div>`) : ""}
    </div>`;
}
