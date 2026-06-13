import { Buffer } from "buffer";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const rawMod = require("pdf-parse");
  const pdfParse =
    typeof rawMod === "function" ? rawMod :
    typeof rawMod?.default === "function" ? rawMod.default :
    typeof rawMod?.default?.default === "function" ? rawMod.default.default :
    null;
  if (!pdfParse) throw new Error("pdf-parse not callable");

  const result = await pdfParse(buffer);
  const text = (result.text as string) ?? "";

  if (text.trim().length >= 50) return text;

  throw new Error(
    "This PDF appears to be image-based (scanned). Please export your resume as a text-based PDF or upload it as a DOCX file instead."
  );
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "pdf" || mimeType === "application/pdf") {
    return extractTextFromPDF(buffer);
  } else if (
    ext === "docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDOCX(buffer);
  } else {
    throw new Error(`Unsupported file type ".${ext}". Upload a PDF or DOCX.`);
  }
}
