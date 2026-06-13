import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/extractText";
import { parseResumeWithClaude } from "@/lib/parseWithAI";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? ""))
      return NextResponse.json({ success: false, error: `Only PDF and DOCX supported.` }, { status: 400 });
    if (file.size > 20 * 1024 * 1024)
      return NextResponse.json({ success: false, error: "File too large. Max 20MB." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    let rawText: string;
    try {
      rawText = await extractText(buffer, file.type, file.name);
    } catch (err) {
      return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 422 });
    }

    if (!rawText || rawText.trim().length < 30)
      return NextResponse.json({ success: false, error: "Could not extract text. Try saving as DOCX." }, { status: 422 });

    if (!process.env.GROQ_API_KEY)
      return NextResponse.json({ success: false, error: "GROQ_API_KEY missing. Add it to .env.local and restart." }, { status: 500 });

    let data;
    try {
      data = await parseResumeWithClaude(rawText);
    } catch (err) {
      return NextResponse.json({ success: false, error: `AI parsing failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: `Server error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
