"use client";

import { useCallback, useState } from "react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export default function DropZone({ onFileSelect, isLoading }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const validateAndSelect = (file: File) => {
    setError("");
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext || "")) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  return (
    <div className="w-full">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative group border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer
          ${isDragging
            ? "border-amber-400 bg-amber-950/20 scale-[1.01]"
            : "border-stone-600 hover:border-amber-500/60 bg-stone-900/40"
          }
          ${isLoading ? "opacity-60 pointer-events-none" : ""}
        `}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={onInputChange}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
          {/* Icon */}
          <div className={`
            w-16 h-16 mb-5 rounded-xl flex items-center justify-center transition-all duration-300
            ${isDragging ? "bg-amber-500/20 text-amber-400" : "bg-stone-800 text-stone-400 group-hover:bg-amber-950/40 group-hover:text-amber-500"}
          `}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>

          {selectedFile ? (
            <>
              <p className="text-amber-400 font-semibold text-lg font-mono">
                {selectedFile.name}
              </p>
              <p className="text-stone-500 text-sm mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
              </p>
            </>
          ) : (
            <>
              <p className="text-stone-200 font-semibold text-lg mb-1">
                Drop your resume here
              </p>
              <p className="text-stone-500 text-sm">
                or <span className="text-amber-500 underline underline-offset-2">browse files</span>
              </p>
              <div className="flex gap-3 mt-4">
                {["PDF", "DOCX"].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-3 py-1 bg-stone-800 text-stone-400 text-xs font-mono rounded-full border border-stone-700"
                  >
                    .{fmt.toLowerCase()}
                  </span>
                ))}
              </div>
              <p className="text-stone-600 text-xs mt-3">Max 10MB</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-red-400 text-sm flex items-center gap-2">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
