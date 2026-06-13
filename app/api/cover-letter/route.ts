import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert cover letter writer. Generate professional, compelling cover letters.

RULES:
- Output ONLY valid JSON, no markdown, no backticks, no extra text
- Write in first person, confident and specific
- Reference concrete achievements and numbers from the resume
- Tailor every paragraph to the job description if provided
- Length: 3-4 paragraphs, 250-380 words
- Tone must match the requested style exactly

Return this exact JSON structure:
{
  "subject_line": "Application for [Role] – [Name]",
  "salutation": "Dear Hiring Manager,",
  "paragraphs": [
    { "id": "opening",      "label": "Opening Hook",         "text": "..." },
    { "id": "experience",   "label": "Relevant Experience",  "text": "..." },
    { "id": "skills_fit",   "label": "Skills & Cultural Fit","text": "..." },
    { "id": "closing",      "label": "Call to Action",       "text": "..." }
  ],
  "sign_off": "Best regards,",
  "metadata": {
    "word_count": 0,
    "tone": "",
    "top_keywords_used": [],
    "customization_score": 0
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, jobDescription, tone, companyName, roleName, customInstructions } = body;

    if (!resume) {
      return NextResponse.json({ success: false, error: "Resume data required." }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY missing in .env.local" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const userPrompt = `
Generate a cover letter for:

CANDIDATE RESUME DATA:
Name: ${resume.personal_info?.full_name || "Candidate"}
Headline: ${resume.personal_info?.headline || ""}
Summary: ${resume.summary || ""}
Key Skills: ${[
  ...(resume.skills?.technical || []),
  ...(resume.skills?.frameworks || []),
].slice(0, 12).join(", ")}
Top Experience:
${(resume.experience || []).slice(0, 3).map((e: { title: string; company: string; start_date: string; end_date: string; is_current: boolean; responsibilities: string[] }) =>
  `- ${e.title} at ${e.company} (${e.start_date} – ${e.is_current ? "Present" : e.end_date})\n  ${e.responsibilities.slice(0, 2).join("; ")}`
).join("\n")}
Education: ${(resume.education || []).slice(0, 1).map((e: { degree: string; field: string; institution: string }) => `${e.degree} in ${e.field} from ${e.institution}`).join(", ")}
Certifications: ${(resume.certifications || []).slice(0, 3).join(", ")}

TONE: ${tone || "Professional"}
${companyName ? `COMPANY: ${companyName}` : ""}
${roleName ? `ROLE APPLYING FOR: ${roleName}` : ""}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : ""}
${customInstructions ? `SPECIAL INSTRUCTIONS: ${customInstructions}` : ""}

Write a tailored, impactful cover letter. Use specific achievements and numbers where visible in the resume. Output only valid JSON.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON from AI");
      }
    }

    // Compute word count
    const allText = parsed.paragraphs?.map((p: { text: string }) => p.text).join(" ") ?? "";
    if (parsed.metadata) {
      parsed.metadata.word_count = allText.split(/\s+/).filter(Boolean).length;
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    console.error("[/api/cover-letter] Error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
