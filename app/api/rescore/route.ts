import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst. Given a resume and a job description, you will score the resume's match against that specific job, identify matched and missing keywords, and give actionable improvements. Return ONLY valid JSON — no markdown, no backticks, no explanation.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, jobDescription } = body;

    if (!resume || !jobDescription?.trim()) {
      return NextResponse.json(
        { success: false, error: "resume and jobDescription are required." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, error: "GROQ_API_KEY missing in .env.local" },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const userPrompt = `Score this resume against the job description below.

RESUME:
Name: ${resume.personal_info?.full_name}
Headline: ${resume.personal_info?.headline}
Summary: ${resume.summary}
Skills: ${[
  ...(resume.skills?.technical ?? []),
  ...(resume.skills?.frameworks ?? []),
  ...(resume.skills?.tools ?? []),
  ...(resume.skills?.cloud ?? []),
].join(", ")}
Experience titles: ${(resume.experience ?? []).map((e: { title: string; company: string }) => `${e.title} at ${e.company}`).join("; ")}
Experience bullets: ${(resume.experience ?? []).flatMap((e: { responsibilities: string[] }) => e.responsibilities.slice(0, 2)).join("; ")}
Certifications: ${(resume.certifications ?? []).join(", ")}
Projects: ${(resume.projects ?? []).map((p: { name: string; technologies: string[] }) => `${p.name} (${p.technologies.join(", ")})`).join("; ")}

JOB DESCRIPTION:
${jobDescription}

Return JSON in exactly this shape:
{
  "ats_score": {
    "total": <0-100 integer>,
    "breakdown": {
      "keywords": <0-30 score out of 30>,
      "experience": <0-30 score out of 30>,
      "skills": <0-25 score out of 25>,
      "projects": <0-15 score out of 15>
    },
    "missing_keywords": [<up to 10 specific keywords/phrases from the JD missing from the resume>],
    "matched_keywords": [<up to 10 specific keywords/phrases from the JD found in the resume>],
    "strengths": [<3 specific strengths relevant to this JD>],
    "improvements": [<3 specific, actionable improvements to better match this JD>]
  },
  "job_match": {
    "score": <0-100 integer, same as total>,
    "matched_skills": [<skills from JD the resume has>],
    "missing_skills": [<skills from JD the resume lacks>]
  }
}

Scoring rules:
- keywords (30pts): count how many important JD keywords/phrases appear in the resume
- experience (30pts): relevance of job titles, responsibilities, and years to the JD requirements  
- skills (25pts): overlap between resume skills and JD required/preferred skills
- projects (15pts): how well projects demonstrate the tech and scope the JD needs
- total must equal the sum of the four breakdown scores
- Be realistic — a generic resume against a specific JD should score 40-70, not 90+`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 1500,
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

    if (!parsed.ats_score || !parsed.job_match) {
      throw new Error("AI response missing required fields");
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    console.error("[/api/rescore] Error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
