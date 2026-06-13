import Groq from "groq-sdk";
import { BuildResult } from "@/types/builder";

// ── Local Template type (mirrors builder.ts Template) ───────────────────────
type TemplateLocal = {
  id: string;
  name: string;
  layout: { columns: number; header: boolean; sidebar: boolean };
  sections_order: string[];
  style: { font: string; spacing: string; density: string };
  colors: { primary: string; secondary: string; background: string };
  recommended_for: string;
};

// ── Hardcoded template definitions (injected after every AI call) ────────────
// The AI only generates 7 base templates. We inject ALL remaining templates
// here so every resume upload always sees the full gallery.

const TEMPLATE_7: TemplateLocal = {
  id: "template_7", name: "Left-Aligned Clean",
  layout: { columns: 2, header: true, sidebar: false },
  sections_order: ["personal","summary","skills","experience","education","certifications","projects"],
  style: { font: "Inter", spacing: "normal", density: "comfortable" },
  colors: { primary: "#2563eb", secondary: "#1a1a1a", background: "#ffffff" },
  recommended_for: "UX Designers & Creatives",
};
const TEMPLATE_15: TemplateLocal = {
  id: "template_15", name: "Amber Classic",
  layout: { columns: 2, header: true, sidebar: true },
  sections_order: ["personal","summary","experience","education","skills","certifications","projects"],
  style: { font: "Inter", spacing: "normal", density: "comfortable" },
  colors: { primary: "#b45309", secondary: "#1f2937", background: "#ffffff" },
  recommended_for: "Marketing & Communications Professionals",
};
const TEMPLATE_16: TemplateLocal = {
  id: "template_16", name: "Elegant Serif",
  layout: { columns: 2, header: true, sidebar: true },
  sections_order: ["personal","summary","experience","education","skills","certifications","projects"],
  style: { font: "Georgia", spacing: "normal", density: "comfortable" },
  colors: { primary: "#9b7a57", secondary: "#1f2937", background: "#f6f2ee" },
  recommended_for: "Creative & Design Professionals",
};
const TEMPLATE_17: TemplateLocal = {
  id: "template_17", name: "Dark Navy",
  layout: { columns: 2, header: true, sidebar: true },
  sections_order: ["personal","summary","experience","education","skills","certifications","projects"],
  style: { font: "Arial", spacing: "normal", density: "comfortable" },
  colors: { primary: "#243847", secondary: "#1f2937", background: "#ffffff" },
  recommended_for: "Designers & Bold Creative Roles",
};
const TEMPLATE_18: TemplateLocal = {
  id: "template_18", name: "Executive Classic",
  layout: { columns: 2, header: true, sidebar: true },
  sections_order: ["personal","summary","experience","education","skills","certifications","achievements","projects"],
  style: { font: "Playfair Display", spacing: "normal", density: "comfortable" },
  colors: { primary: "#1a1a2e", secondary: "#374151", background: "#e5e7eb" },
  recommended_for: "Executives & Senior Professionals",
};
const TEMPLATE_19: TemplateLocal = {
  id: "template_19", name: "Sidebar Modern",
  layout: { columns: 2, header: true, sidebar: true },
  sections_order: ["personal","summary","skills","experience","education","certifications","achievements","projects"],
  style: { font: "Inter", spacing: "normal", density: "comfortable" },
  colors: { primary: "#374151", secondary: "#1f2937", background: "#e5e7eb" },
  recommended_for: "Marketing & Creative Professionals",
};
const TEMPLATE_20: TemplateLocal = {
  id: "template_20", name: "Gray Sidebar",
  layout: { columns: 2, header: true, sidebar: true },
  sections_order: ["personal","summary","skills","experience","education","certifications","projects"],
  style: { font: "Inter", spacing: "normal", density: "comfortable" },
  colors: { primary: "#1f2937", secondary: "#374151", background: "#f3f4f6" },
  recommended_for: "Sales & Business Professionals",
};
const TEMPLATE_21: TemplateLocal = {
  id: "template_21", name: "Playfair Executive",
  layout: { columns: 3, header: true, sidebar: false },
  sections_order: ["personal","summary","experience","education","skills","certifications","achievements","projects"],
  style: { font: "Playfair Display", spacing: "normal", density: "comfortable" },
  colors: { primary: "#1a1a2e", secondary: "#374151", background: "#ffffff" },
  recommended_for: "Executives & Administrative Professionals",
};
const TEMPLATE_22: TemplateLocal = {
  id: "template_22", name: "Diamond Split",
  layout: { columns: 2, header: true, sidebar: false },
  sections_order: ["personal","summary","experience","education","skills","certifications","achievements","projects"],
  style: { font: "Inter", spacing: "normal", density: "comfortable" },
  colors: { primary: "#111827", secondary: "#374151", background: "#f3f4f6" },
  recommended_for: "Operations & Planning Professionals",
};

// All templates to always inject (in display order)
const EXTRA_TEMPLATES: TemplateLocal[] = [
  TEMPLATE_7,
  TEMPLATE_15,
  TEMPLATE_16,
  TEMPLATE_17,
  TEMPLATE_18,
  TEMPLATE_19,
  TEMPLATE_20,
  TEMPLATE_21,
  TEMPLATE_22,
];

const SYSTEM_PROMPT = `You are a Universal Resume Builder AI.

Your job is to:
1. Parse any resume text into structured JSON
2. Clean and normalize the data
3. Calculate ATS score
4. Generate builder-ready data
5. Provide 9 resume templates
6. Return editable structure for UI rendering

STRICT RULES:
- Output ONLY valid JSON
- No markdown, no explanation, no backticks, no extra text
- Missing values must be "" or []
- Remove duplicate skills
- Normalize all dates → "Mon YYYY – Mon YYYY" or "Mon YYYY – Present"

Parse ALL details including personal_info (full_name, headline, email, phone, location, linkedin, github, portfolio), summary, skills (technical, soft, tools, frameworks, cloud), experience (title, company, location, start_date, end_date, is_current, responsibilities, achievements, technologies), education (degree, field, institution, start_year, end_year), projects (name, description, technologies, link), certifications, achievements, languages, keywords.

Calculate ATS score (0-100) based on: keywords(25), experience(20), skills(20), projects(15), education(10), format(5), readability(5). Include breakdown, missing_keywords, strengths, improvements.

Generate exactly 7 templates with these exact IDs and names:
1. id: template_1, name: Modern Sidebar, layout.sidebar: true
2. id: template_2, name: ATS Classic, layout.sidebar: false
3. id: template_4, name: Timeline Style, layout.sidebar: false
4. id: template_6, name: Centered Avatar, layout.sidebar: false
5. id: template_10, name: Blue Card, layout.sidebar: false
6. id: template_13, name: Steel Blue, layout.sidebar: true
7. id: template_15, name: Amber Classic, layout.sidebar: true

Each template needs: id, name, layout (columns, header, sidebar), sections_order array, style (font, spacing, density), colors (primary, secondary, background as hex), recommended_for string.

Use these colors:
- template_1: primary #4F46E5, secondary #1e1b4b, background #ffffff, recommended_for: Software Engineers & Developers
- template_2: primary #5046e4, secondary #374151, background #ffffff, recommended_for: ATS-Optimised & Corporate Roles
- template_4: primary #6366f1, secondary #374151, background #ffffff, recommended_for: Career Progression & Academia
- template_6: primary #4F46E5, secondary #374151, background #ffffff, recommended_for: Product Managers & Generalists
- template_10: primary #1d4ed8, secondary #1f2937, background #ffffff, recommended_for: Marketing & Business Professionals
- template_13: primary #4f78a8, secondary #3d3d3d, background #ffffff, recommended_for: Managers & Corporate Professionals
- template_15: primary #b45309, secondary #1f2937, background #ffffff, recommended_for: Marketing & Communications Professionals

Return this exact JSON structure:
{
  "parsed": { "personal_info": {}, "summary": "", "skills": {}, "experience": [], "education": [], "projects": [], "certifications": [], "achievements": [], "languages": [], "keywords": [] },
  "cleaned": { "personal_info": {}, "summary": "", "skills": {}, "experience": [], "education": [], "projects": [], "certifications": [], "achievements": [], "languages": [], "keywords": [] },
  "ats_score": { "total": 0, "breakdown": {}, "missing_keywords": [], "strengths": [], "improvements": [] },
  "builder": { "sections": [], "editable": true, "draggable": true },
  "job_match": { "score": 0, "matched_skills": [], "missing_skills": [] },
  "templates": []
}`;

const JD_REWRITE_PROMPT = `You are an expert resume writer and career coach.

A user has uploaded their resume AND provided a target Job Description. Your task is to:

1. PARSE the resume fully (all fields)
2. REWRITE the resume content to TARGET the job description:
   - Rewrite the "summary" (headline + professional summary) to match the JD role, responsibilities, and tone
   - Update the "headline" in personal_info to reflect the target job title
   - Add/reorder skills from the JD that the candidate plausibly has given their background
   - Rewrite experience "responsibilities" bullets to use JD keywords and emphasize relevant achievements
   - If the JD mentions specific tools/technologies the candidate hasn't listed but their background supports, add them to skills
   - Rewrite or enhance project descriptions to highlight aspects relevant to the JD
3. KEEP all real facts intact — company names, dates, actual job titles, education, certifications — never fabricate employment history
4. Calculate ATS score against the JD (aim for high match)
5. Generate 9 templates
6. Return job_match with score, matched_skills, missing_skills based on JD alignment

STRICT RULES:
- Output ONLY valid JSON — no markdown, no backticks, no explanation
- Missing values must be "" or []
- Remove duplicate skills
- Normalize all dates → "Mon YYYY" or "Mon YYYY – Present"
- The "cleaned" object is the JD-tailored version; "parsed" is the original as-is

Generate exactly 7 templates (same IDs and colors as always):
template_1(#4F46E5), template_2(#5046e4), template_4(#6366f1), template_6(#4F46E5), template_10(#1d4ed8), template_13(#4f78a8), template_15(#b45309)

Return this exact JSON structure:
{
  "parsed": { "personal_info": {}, "summary": "", "skills": {}, "experience": [], "education": [], "projects": [], "certifications": [], "achievements": [], "languages": [], "keywords": [] },
  "cleaned": { "personal_info": {}, "summary": "", "skills": {}, "experience": [], "education": [], "projects": [], "certifications": [], "achievements": [], "languages": [], "keywords": [] },
  "ats_score": { "total": 0, "breakdown": {}, "missing_keywords": [], "strengths": [], "improvements": [] },
  "builder": { "sections": [], "editable": true, "draggable": true },
  "job_match": { "score": 0, "matched_skills": [], "missing_skills": [] },
  "templates": []
}`;

export async function buildResumeWithAI(resumeText: string, jobDescription?: string): Promise<BuildResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing in .env.local");

  const groq = new Groq({ apiKey });

  const hasJD = jobDescription && jobDescription.trim().length > 20;

  const systemPrompt = hasJD ? JD_REWRITE_PROMPT : SYSTEM_PROMPT;

  const userContent = hasJD
    ? `RESUME:\n${resumeText}\n\n---\n\nJOB DESCRIPTION (rewrite the resume to target this role):\n${jobDescription}`
    : `Parse this resume:\n\n${resumeText}`;


  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: hasJD ? 0.3 : 0,
    max_tokens: 8000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  const cleanedText = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  let parsed: BuildResult;
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error(`Invalid JSON from AI: ${cleanedText.slice(0, 300)}`);
      }
    } else {
      throw new Error(`No JSON found in AI response: ${cleanedText.slice(0, 300)}`);
    }
  }

  if (!Array.isArray(parsed.templates)) parsed.templates = [];

  // Inject all extra templates that the AI didn't generate
  for (const tpl of EXTRA_TEMPLATES) {
    if (!parsed.templates.some((t: { id: string }) => t.id === tpl.id)) {
      parsed.templates.push(tpl as BuildResult["templates"][number]);
    }
  }

  return parsed;
}
