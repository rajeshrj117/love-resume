import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/extractText";
import { buildResumeWithAI } from "@/lib/buildWithAI";

export const runtime = "nodejs";
// NOTE: Vercel Hobby plan caps this at 60s; Pro allows 300s.
// If you are on Hobby and seeing timeouts, upgrade or reduce max_tokens in buildWithAI.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    const jobDescription = formData.get("job_description") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) {
      return NextResponse.json({ success: false, error: "Only PDF and DOCX supported." }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY missing in .env.local" }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractText(buffer, file.type, file.name);

    if (!rawText || rawText.trim().length < 30) {
      return NextResponse.json({ success: false, error: "Could not extract text. Use a text-based PDF or DOCX." }, { status: 422 });
    }

    const result = await buildResumeWithAI(rawText, jobDescription ?? undefined);
    return NextResponse.json({ success: true, data: result });

  } catch (err) {
    console.error("[/api/build] Error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
