"use client";
import { ATSScore } from "@/types/builder";
import { useResumeStore } from "@/store/resumeStore";
import { useState, useRef, useEffect } from "react";

// ── API helpers ───────────────────────────────────────────────────────────────

function sanitiseScore<T extends ATSScore>(s: T): T {
  return {
    ...s,
    missing_keywords: Array.isArray(s.missing_keywords) ? s.missing_keywords : [],
    strengths:        Array.isArray(s.strengths)        ? s.strengths        : [],
    improvements:     Array.isArray(s.improvements)     ? s.improvements     : [],
    breakdown:        s.breakdown && typeof s.breakdown === "object" ? s.breakdown : {},
  };
}

async function boostResumeWithAI(
  resume: any,
  score: ATSScore
): Promise<{ updatedResume: any; newScore: ATSScore }> {
  const response = await fetch("/api/boost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, score }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || "Boost request failed");
  const result = data.data;
  if (result?.newScore) result.newScore = sanitiseScore(result.newScore);
  return result;
}

async function rescoreAgainstJD(
  resume: any,
  jobDescription: string
): Promise<{ ats_score: ATSScore & { matched_keywords?: string[] }; job_match: any }> {
  const response = await fetch("/api/rescore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, jobDescription }),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || "Rescore failed");
  const result = data.data;
  if (result?.ats_score) result.ats_score = sanitiseScore(result.ats_score);
  return result;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreRing({ total, color, size = 80 }: { total: number; color: string; size?: number }) {
  const r = size * 0.41;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (total / 100) * circumference;
  const cx = size / 2;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size * 0.091} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={size * 0.091}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-gray-800" style={{ fontSize: size * 0.27, lineHeight: 1 }}>{total}</span>
        <span className="text-gray-400" style={{ fontSize: size * 0.13 }}>/ 100</span>
      </div>
    </div>
  );
}

function KeywordPill({ label, matched }: { label: string; matched: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={matched
        ? { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }
        : { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }
      }>
      {matched
        ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
        : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      }
      {label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ATSScorePanel({ score }: { score: ATSScore }) {
  const { themeColor, editedResume, updateResume, buildResult, setBuildResult } = useResumeStore();

  // Generic score panel state
  const [expanded, setExpanded] = useState(false);
  const [boosting, setBoosting]   = useState(false);
  const [boostDone, setBoostDone] = useState(false);
  const [boostError, setBoostError] = useState("");

  // JD tailor state
  const [jdOpen, setJdOpen]           = useState(false);
  const [jdText, setJdText]           = useState("");
  const [rescoring, setRescoring]     = useState(false);
  const [rescoreError, setRescoreError] = useState("");
  const [jdScore, setJdScore]         = useState<(ATSScore & { matched_keywords?: string[] }) | null>(null);
  const [jobMatch, setJobMatch]       = useState<{ score: number; matched_skills: string[]; missing_skills: string[] } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when JD panel opens
  useEffect(() => {
    if (jdOpen) setTimeout(() => textareaRef.current?.focus(), 50);
  }, [jdOpen]);

  // Which score to display — JD-specific if available, else original
  const activeScore: ATSScore & { matched_keywords?: string[] } = jdScore ?? score;
  const total = activeScore.total ?? 0;
  const getColor = (v: number) => v >= 80 ? "#22c55e" : v >= 60 ? "#f59e0b" : "#ef4444";
  const scoreColor = getColor(total);

  const handleBoost = async () => {
    if (!editedResume) return;
    setBoosting(true);
    setBoostError("");
    try {
      const { updatedResume, newScore } = await boostResumeWithAI(editedResume, activeScore);
      updateResume(updatedResume);
      if (buildResult) setBuildResult({ ...buildResult, cleaned: updatedResume, ats_score: newScore });
      setBoostDone(true);
      setExpanded(true);
      setJdScore(null); // reset back to base score after boost
    } catch {
      setBoostError("Boost failed. Please try again.");
    } finally {
      setBoosting(false);
    }
  };

  const handleRescore = async () => {
    if (!editedResume || !jdText.trim()) return;
    setRescoring(true);
    setRescoreError("");
    try {
      const { ats_score, job_match } = await rescoreAgainstJD(editedResume, jdText);
      setJdScore(ats_score);
      setJobMatch(job_match);
      setExpanded(true);
      setBoostDone(false); // allow re-boosting against new JD score
    } catch {
      setRescoreError("Scoring failed. Please try again.");
    } finally {
      setRescoring(false);
    }
  };

  const handleClearJD = () => {
    setJdText("");
    setJdScore(null);
    setJobMatch(null);
    setRescoreError("");
    setJdOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ATS Score</p>
          {jdScore && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: themeColor + "15", color: themeColor }}>
              vs JD
            </span>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          {expanded ? "Less" : "Details"}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* ── Score ring + breakdown ── */}
      <div className="flex items-center gap-4 mb-3">
        <ScoreRing total={total} color={scoreColor} />
        <div className="flex-1 space-y-1.5">
          {Object.entries(activeScore.breakdown ?? {}).slice(0, 4).map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-500 capitalize">{key}</span>
                <span className="text-gray-700 font-medium">{val}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(val, 100)}%`, backgroundColor: getColor(val) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── JD Tailor Mode button ── */}
      {!jdOpen && (
        <button
          onClick={() => setJdOpen(true)}
          className="w-full mb-2 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5"
          style={{ borderColor: themeColor + "40", color: themeColor, backgroundColor: themeColor + "08" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {jdScore ? "Edit Job Description" : "Score vs Job Description"}
        </button>
      )}

      {/* ── JD textarea panel ── */}
      {jdOpen && (
        <div className="mb-3 rounded-xl border overflow-hidden" style={{ borderColor: themeColor + "30" }}>
          <div className="flex items-center justify-between px-3 py-2 border-b"
            style={{ backgroundColor: themeColor + "08", borderColor: themeColor + "20" }}>
            <span className="text-xs font-semibold" style={{ color: themeColor }}>Paste Job Description</span>
            <button onClick={handleClearJD} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here — responsibilities, requirements, skills…"
            className="w-full text-xs text-gray-700 placeholder-gray-400 resize-none outline-none p-3 bg-white"
            style={{ minHeight: "110px", lineHeight: "1.6" }}
          />
          <div className="px-3 py-2 border-t flex items-center justify-between gap-2"
            style={{ backgroundColor: "#fafafa", borderColor: "#f0f0f0" }}>
            <span className="text-[10px] text-gray-400">
              {jdText.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <button
              onClick={handleRescore}
              disabled={rescoring || jdText.trim().length < 30}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5"
              style={rescoring || jdText.trim().length < 30
                ? { backgroundColor: "#d1d5db", cursor: "not-allowed" }
                : { backgroundColor: themeColor, boxShadow: `0 2px 8px ${themeColor}40` }
              }
            >
              {rescoring ? (
                <>
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Scoring…
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                  </svg>
                  Re-score
                </>
              )}
            </button>
          </div>
          {rescoreError && (
            <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{rescoreError}</div>
          )}
        </div>
      )}

      {/* ── JD keyword match summary (shown when JD score exists) ── */}
      {jdScore && (
        <div className="mb-3 rounded-xl p-3 border" style={{ backgroundColor: themeColor + "05", borderColor: themeColor + "20" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Keyword Match</p>
            {jobMatch && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: getColor(jobMatch.score) + "20", color: getColor(jobMatch.score) }}>
                {jobMatch.score}% match
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(jdScore.matched_keywords ?? []).slice(0, 6).map((kw, i) => (
              <KeywordPill key={`m${i}`} label={kw} matched={true} />
            ))}
            {(jdScore.missing_keywords ?? []).slice(0, 6).map((kw, i) => (
              <KeywordPill key={`x${i}`} label={kw} matched={false} />
            ))}
          </div>
        </div>
      )}

      {/* ── Auto-Boost button ── */}
      {total < 100 && !boostDone && (
        <button
          onClick={handleBoost}
          disabled={boosting}
          className="w-full mt-1 mb-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2"
          style={boosting
            ? { backgroundColor: "#9ca3af", cursor: "not-allowed" }
            : { background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`, boxShadow: `0 4px 14px ${themeColor}40` }
          }
        >
          {boosting ? (
            <>
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              {jdScore ? "Tailoring to this JD…" : "Boosting your resume…"}
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {jdScore ? "Auto-Tailor to this JD ✨" : "Auto-Boost to 100 ✨"}
            </>
          )}
        </button>
      )}

      {boostDone && (
        <div className="w-full mb-2 py-2 px-3 rounded-xl text-xs font-semibold text-green-700 bg-green-50 border border-green-200 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {jdScore ? "Resume tailored to JD! Re-score to see your new match." : "Resume boosted! Check your updated score above."}
        </div>
      )}

      {boostError && (
        <div className="w-full mb-2 py-2 px-3 rounded-xl text-xs text-red-600 bg-red-50 border border-red-200">
          {boostError}
        </div>
      )}

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 pt-3">
          {activeScore.strengths?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">✅ Strengths</p>
              <div className="space-y-1">
                {(activeScore.strengths ?? []).slice(0, 3).map((s, i) => (
                  <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>{s}
                  </p>
                ))}
              </div>
            </div>
          )}
          {activeScore.improvements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">⚡ Improvements</p>
              <div className="space-y-1">
                {(activeScore.improvements ?? []).slice(0, 3).map((s, i) => (
                  <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>{s}
                  </p>
                ))}
              </div>
            </div>
          )}
          {!jdScore && activeScore.missing_keywords?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">🔍 Missing Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {(activeScore.missing_keywords ?? []).slice(0, 8).map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: themeColor + "10", color: themeColor }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {jobMatch && (jobMatch.matched_skills.length > 0 || jobMatch.missing_skills.length > 0) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">🎯 Skills Gap</p>
              <div className="flex flex-wrap gap-1.5">
                {(jobMatch.matched_skills ?? []).slice(0, 5).map((s: string, i: number) => (
                  <KeywordPill key={`ms${i}`} label={s} matched={true} />
                ))}
                {(jobMatch.missing_skills ?? []).slice(0, 5).map((s: string, i: number) => (
                  <KeywordPill key={`xs${i}`} label={s} matched={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
