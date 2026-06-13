"use client";

const steps = [
  { label: "Reading file", detail: "Extracting raw text from document..." },
  { label: "Detecting PDF type", detail: "Text-layer or image-based?" },
  { label: "Running OCR if needed", detail: "Claude Vision scanning pages..." },
  { label: "Structuring with AI", detail: "Building clean JSON schema..." },
  { label: "Finalizing", detail: "Almost there..." },
];

export default function ParsingLoader({ step = 0 }: { step?: number }) {
  const currentStep = step % steps.length;

  return (
    <div className="flex flex-col items-center py-12 px-8">
      {/* Animated orb */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center animate-pulse">
            <div className="w-6 h-6 rounded-full bg-amber-500/60 animate-ping" />
          </div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
          <div className="w-3 h-3 rounded-full bg-amber-400 absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-lg shadow-amber-500/50" />
        </div>
      </div>

      <h3 className="text-stone-200 font-semibold text-lg mb-1">Parsing Resume</h3>
      <p className="text-stone-500 text-sm mb-2 text-center">
        Claude AI is reading and structuring your resume
      </p>
      <p className="text-stone-600 text-xs mb-8 text-center">
        Image-based PDFs may take up to 30 seconds
      </p>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-3">
        {steps.map((s, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                isActive
                  ? "bg-amber-950/30 border border-amber-700/40"
                  : isDone
                  ? "opacity-40"
                  : "opacity-20"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                isActive ? "border-amber-400 bg-amber-950"
                : isDone ? "border-green-500 bg-green-950"
                : "border-stone-600"
              }`}>
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                ) : null}
              </div>
              <div>
                <p className={`text-sm font-medium ${isActive ? "text-stone-200" : "text-stone-500"}`}>
                  {s.label}
                </p>
                {isActive && <p className="text-stone-600 text-xs">{s.detail}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
