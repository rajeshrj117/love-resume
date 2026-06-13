import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = "https://loveresume.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Core ─────────────────────────────────────────────────────────────────
  title: {
    default: "LoveResume – Free AI Resume Builder | ATS-Optimized Templates",
    template: "%s | LoveResume",
  },
  description:
    "Build a stunning, ATS-optimized resume in minutes with LoveResume. Upload your existing resume, let AI parse and enhance it, pick a professional template, and download a perfect PDF — free.",
  keywords: [
    "AI resume builder",
    "free resume builder",
    "ATS resume",
    "resume maker",
    "professional resume templates",
    "resume parser",
    "AI CV builder",
    "resume generator",
    "job application",
    "ATS score",
    "resume PDF download",
    "online resume builder",
    "LoveResume",
  ],
  authors: [{ name: "LoveResume", url: BASE_URL }],
  creator: "LoveResume",
  publisher: "LoveResume",
  category: "Productivity",

  // ── Canonical & alternates ────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "LoveResume",
    title: "LoveResume – Free AI Resume Builder | ATS-Optimized",
    description:
      "Upload your resume, let AI enhance it, choose a pro template, download a perfect PDF. Free, fast, and ATS-ready.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LoveResume – AI-Powered Resume Builder",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "LoveResume – Free AI Resume Builder",
    description:
      "Upload your resume, let AI enhance it, choose a pro template, download a perfect PDF. Free & ATS-ready.",
    images: ["/opengraph-image"],
    creator: "@loveresume",
    site: "@loveresume",
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/logo.png",
  },

  // ── App / manifest ────────────────────────────────────────────────────────
  manifest: "/manifest.json",
  applicationName: "LoveResume",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LoveResume",
  },

  // ── Crawling ──────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Verification (add your own tokens when deploying) ────────────────────
  // verification: {
  //   google: "YOUR_GOOGLE_SEARCH_CONSOLE_TOKEN",
  //   yandex: "YOUR_YANDEX_TOKEN",
  // },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4F46E5" },
    { media: "(prefers-color-scheme: dark)", color: "#4F46E5" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Structured data — WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "LoveResume",
              url: BASE_URL,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript",
              description:
                "Free AI-powered resume builder. Upload your resume, let AI parse and enhance it, choose professional ATS-ready templates, and download a perfect PDF.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "AI resume parsing",
                "ATS score checker",
                "Professional resume templates",
                "PDF export",
                "Cover letter generator",
                "Job description tailoring",
              ],
              screenshot: `${BASE_URL}/opengraph-image`,
              creator: {
                "@type": "Organization",
                name: "LoveResume",
                url: BASE_URL,
              },
            }),
          }}
        />
        {/* Structured data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "LoveResume",
              url: BASE_URL,
              logo: `${BASE_URL}/logo.png`,
              sameAs: [],
            }),
          }}
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>{children}</body>
    </html>
  );
}
