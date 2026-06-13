import Groq from "groq-sdk";
import { ResumeData } from "@/types/resume";

const SYSTEM_PROMPT = `You are a Universal Resume Builder AI.

Your job is to:
1. Parse any resume text into structured JSON
2. Clean and normalize the data
3. Calculate ATS score
4. Generate builder-ready data
5. Provide 20 resume templates
6. Return editable structure for UI rendering

STRICT RULES:
- Output ONLY valid JSON
- No markdown, no explanation, no backticks, no extra text
- Missing values must be "" or []
- Remove duplicate skills
- Normalize all dates to "Mon YYYY – Mon YYYY" or "Mon YYYY – Present"

STEP 1: PARSE RESUME - Extract ALL possible details into this structure:
parsed: { personal_info: { full_name, headline, email, phone, location, linkedin, github, portfolio }, summary, skills: { technical[], soft[], tools[], frameworks[], cloud[] }, experience: [{ title, company, location, start_date, end_date, is_current, responsibilities[], achievements[], technologies[] }], education: [{ degree, field, institution, start_year, end_year }], projects: [{ name, description, technologies[], link }], certifications[], achievements[], languages[], keywords[] }

STEP 2: CLEAN + NORMALIZE into "cleaned" - same shape as parsed but:
- Fix grammar issues
- Standardize job titles ("React dev" → "Frontend Developer")
- Expand abbreviations (AWS → Amazon Web Services)
- Deduplicate skills
- Infer missing skills from experience descriptions

STEP 3: ATS SCORE - Calculate score 0-100 with weights: keywords=25, experience=20, skills=20, projects=15, education=10, format=5, readability=5
ats_score: { total, breakdown: { keywords, experience, skills, projects, education, format, readability }, missing_keywords[], strengths[], improvements[] }

STEP 4: BUILDER STRUCTURE
builder: { sections: [{ id, title, fields: [{ id, label, type, value }] }], editable: true, draggable: true }
Include sections: personal, summary, skills, experience, education, projects

STEP 5: JOB MATCH (use empty since no job description)
job_match: { score: 0, matched_skills: [], missing_skills: [] }

STEP 6: Generate exactly 6 templates (template_1 through template_6). Each template:
{ id: "template_N", name, layout: { columns, header, sidebar }, sections_order[], style: { font, spacing, density }, colors: { primary, secondary, background }, recommended_for }

Templates to generate (in order):
1. Modern Minimal - clean single column, lots of whitespace
2. ATS Classic - plain, no graphics, maximum ATS compatibility
3. Tech Developer - dark header, tech-focused layout
4. Creative Designer - bold colors, two-column with sidebar
5. Executive Pro - formal, serif fonts, conservative
6. Fresher Clean - entry-level friendly, education first
7. Startup Style - modern, colorful, bold typography
8. Compact One Page - dense, small margins, fits everything
9. Academic CV - long form, publications section
10. Freelance Portfolio - project-first layout
11. Data Scientist - skills matrix, technical focus
12. Product Manager - metrics-focused, achievements prominent
13. UI/UX Designer - visual, portfolio link prominent
14. DevOps Engineer - tools and cloud skills featured
15. Backend Engineer - technical depth, system design
16. Frontend Engineer - frameworks and UI tools featured
17. Full Stack - balanced technical and soft skills
18. Career Switcher - transferable skills highlighted
19. International Jobs - global format, languages section
20. Government Jobs - formal, compliance-friendly format

FINAL OUTPUT — return exactly this JSON shape and nothing else:
{
  "parsed": { ... },
  "cleaned": { ... },
  "ats_score": { ... },
  "builder": { ... },
  "job_match": { ... },
  "templates": [ ... 20 items ... ]
}`;

export async function parseResumeWithClaude(resumeText: string): Promise<ResumeData> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing. Add it to .env.local and restart.");


  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    max_tokens: 8000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Parse this resume and return the full JSON output:\n\n${resumeText}` },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";

  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  // Extract JSON if there's any surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object found in AI response");

  let parsed: ResumeData;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Invalid JSON from AI: ${cleaned.slice(0, 300)}`);
  }

  return parsed;
}
