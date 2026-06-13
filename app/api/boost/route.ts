import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── Inline sanitiser (mirrors store/resumeStore.ts sanitiseResume) ────────────
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

function sanitiseResume(r: any): any {
  if (!r || typeof r !== "object") return r;
  return {
    ...r,
    certifications: (r.certifications ?? []).map(toStr),
    achievements:   (r.achievements   ?? []).map(toStr),
    keywords:       (r.keywords        ?? []).map(toStr),
    skills: r.skills ? {
      ...r.skills,
      technical:  (r.skills.technical  ?? []).map(toStr),
      frameworks: (r.skills.frameworks ?? []).map(toStr),
      tools:      (r.skills.tools      ?? []).map(toStr),
      cloud:      (r.skills.cloud      ?? []).map(toStr),
      soft:       (r.skills.soft       ?? []).map(toStr),
    } : r.skills,
  };
}

const SYSTEM_PROMPT = `You are an expert ATS resume optimizer. Given a resume JSON and ATS analysis, you will intelligently enhance the resume to address missing keywords, improvements, and gaps — while keeping all existing real data intact. Only add plausible, professional content that naturally fits the person's background. Return ONLY valid JSON, no markdown, no explanation, no backticks.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, score } = body;

    if (!resume || !score) {
      return NextResponse.json(
        { success: false, error: "resume and score are required." },
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

    const userPrompt = `Here is the current resume data:
${JSON.stringify(resume, null, 2)}

ATS Analysis:
- Missing keywords: ${score.missing_keywords?.join(", ") || "none"}
- Improvements needed: ${score.improvements?.join("; ") || "none"}
- Current score: ${score.total}/100

Please return a JSON object with exactly this shape:
{
  "updatedResume": { ...full updated ParsedResume object... },
  "newScore": {
    "total": <number close to 100>,
    "breakdown": { "keywords": <n>, "experience": <n>, "skills": <n>, "projects": <n> },
    "missing_keywords": [],
    "strengths": [...updated strengths...],
    "improvements": []
  }
}

Rules:
1. Add missing keywords naturally into skills.technical, skills.tools, or skills.frameworks arrays — these must be plain strings, never objects
2. certifications must be an array of plain strings like ["AWS Certified Developer (2023)"] — never objects like {name, date}
3. achievements must be an array of plain strings — never objects
4. Enhance the summary to mention leadership and AI/ML experience if those were missing
5. Add or enrich 1-2 project descriptions to mention complex, impactful work
6. Keep all personal info, dates, company names, and real details exactly as-is
7. The new total ATS score should reflect the improvements (aim for 95-100)
8. Output ONLY valid JSON — no markdown, no backticks, no extra text`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 4000,
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

    if (!parsed.updatedResume || !parsed.newScore) {
      throw new Error("AI response missing required fields");
    }

    // Sanitise at the API boundary — coerce any {name,date} objects to strings
    parsed.updatedResume = sanitiseResume(parsed.updatedResume);

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    console.error("[/api/boost] Error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
