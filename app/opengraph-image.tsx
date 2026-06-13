import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LoveResume - AI-Powered Resume Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)",
          display: "flex",
        }} />

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.95)",
          borderRadius: "24px",
          padding: "60px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
          maxWidth: "900px",
          width: "100%",
        }}>
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "72px", height: "72px",
              background: "linear-gradient(135deg, #667eea, #f093fb)",
              borderRadius: "20px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px",
            }}>❤️</div>
            <div style={{
              fontSize: "52px", fontWeight: "800", letterSpacing: "-2px",
              background: "linear-gradient(135deg, #4F46E5, #ec4899)",
              backgroundClip: "text",
              color: "transparent",
            }}>
              LoveResume
            </div>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: "28px", color: "#374151", fontWeight: "500",
            textAlign: "center", lineHeight: 1.4,
          }}>
            AI-Powered Resume Builder that gets you hired
          </div>

          {/* Features */}
          <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
            {["✨ AI Parsing", "📊 ATS Score", "🎨 Pro Templates", "⚡ PDF Export"].map(f => (
              <div key={f} style={{
                background: "linear-gradient(135deg, #f0f0ff, #fdf2f8)",
                border: "1px solid #e5e7eb",
                borderRadius: "100px",
                padding: "10px 20px",
                fontSize: "18px", fontWeight: "600", color: "#4F46E5",
              }}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
