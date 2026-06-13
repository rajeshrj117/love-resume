import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Builder – Create Your AI-Powered Resume",
  description:
    "Use LoveResume's AI resume builder to upload, parse, and enhance your resume. Get an ATS score, pick from professional templates, and export a perfect PDF in minutes.",
  alternates: {
    canonical: "https://loveresume.app/builder",
  },
  openGraph: {
    title: "Resume Builder – LoveResume",
    description:
      "Build an ATS-optimized resume with AI. Parse your existing resume, boost it with AI, and download a professional PDF.",
    url: "https://loveresume.app/builder",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
