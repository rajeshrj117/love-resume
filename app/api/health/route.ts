import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    env: {
      GROQ_API_KEY: process.env.GROQ_API_KEY ? "set ✓" : "MISSING ✗",
    },
    node: process.version,
    platform: process.platform,
  });
}
