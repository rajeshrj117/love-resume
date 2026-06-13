"use client";
import { Template } from "@/types/builder";
import { useResumeStore } from "@/store/resumeStore";
import ResumePreview from "@/components/templates/ResumePreview";
import ScaledPreview from "@/components/builder/ScaledPreview";

const TEMPLATE_LABELS: Record<string, { label: string; sub: string }> = {
  template_1:  { label: "Modern",      sub: "Professional"  },
  template_2:  { label: "Classic",     sub: "ATS-Friendly"  },
  template_4:  { label: "Timeline",    sub: "Simple"        },
  template_6:  { label: "Centered",    sub: "Modern"        },
  template_7:  { label: "Left",        sub: "Clean"         },
  template_10: { label: "Blue",        sub: "Professional"  },
  template_13: { label: "Steel Blue",  sub: "Corporate"     },
  template_15: { label: "Amber",       sub: "Marketing"     },
  template_16: { label: "Serif",       sub: "Creative"      },
  template_17: { label: "Dark Navy",   sub: "Bold"          },
  template_18: { label: "Executive",   sub: "Classic"      },
  template_19: { label: "Sidebar",     sub: "Modern"       },
  template_20: { label: "Gray Sidebar", sub: "Sales"       },
  template_21: { label: "Playfair",     sub: "Executive"   },
  template_22: { label: "Diamond Split", sub: "Operations" },
};

// Rich stub — identical to the one used in the preview tab so thumbnails
// always look fully populated regardless of whether the user has a resume.
const STUB_RESUME: import("@/types/builder").ParsedResume = {
  personal_info: {
    full_name:  "Alexandra Morgan",
    headline:   "Senior Software Engineer · Full-Stack",
    email:      "alex.morgan@email.com",
    phone:      "+1 (555) 234-5678",
    location:   "San Francisco, CA",
    linkedin:   "linkedin.com/in/alexmorgan",
    github:     "github.com/alexmorgan",
    portfolio:  "alexmorgan.dev",
  },
  summary:
    "Results-driven Senior Software Engineer with 7+ years building scalable web applications and distributed systems. Led cross-functional teams delivering products used by 2M+ users. Deep expertise in React, Node.js, and cloud-native architecture.",
  skills: {
    technical:  ["TypeScript", "Python", "Java", "SQL", "GraphQL", "REST APIs"],
    frameworks: ["React", "Next.js", "Node.js", "Express", "FastAPI", "Spring Boot"],
    tools:      ["Git", "Docker", "Kubernetes", "Terraform", "Figma", "Jira"],
    cloud:      ["AWS (EC2, S3, Lambda)", "GCP", "Vercel", "CI/CD Pipelines"],
    soft:       ["Technical Leadership", "Agile / Scrum", "Mentoring"],
  },
  experience: [
    {
      title:       "Senior Software Engineer",
      company:     "Stripe",
      location:    "San Francisco, CA",
      start_date:  "Jan 2021",
      end_date:    "Present",
      is_current:  true,
      responsibilities: [
        "Architected real-time payment reconciliation dashboard reducing manual ops by 60%.",
        "Led migration of legacy monolith to microservices (Node.js + Kubernetes).",
        "Drove TypeScript adoption across 3 squads, cutting runtime errors by 40%.",
      ],
      achievements: ["Promoted Mid → Senior in 14 months", "Tech lead for Stripe Billing v3"],
      technologies: ["TypeScript", "React", "Node.js", "Kubernetes", "PostgreSQL"],
    },
    {
      title:       "Software Engineer",
      company:     "Airbnb",
      location:    "San Francisco, CA",
      start_date:  "Jun 2018",
      end_date:    "Dec 2020",
      is_current:  false,
      responsibilities: [
        "Built core search ranking pipeline processing 500K+ queries/day in Python.",
        "Improved page load time by 35% via code-splitting and CDN optimisation.",
        "Redesigned listing page increasing bookings by 12%.",
      ],
      achievements: ["Won internal hackathon 2019", "3× Peer Bonus recipient"],
      technologies: ["Python", "React", "Django", "Redis", "Elasticsearch", "AWS"],
    },
  ],
  education: [
    {
      degree:      "Bachelor of Science",
      field:       "Computer Science",
      institution: "UC Berkeley",
      start_year:  "2014",
      end_year:    "2018",
    },
  ],
  projects: [
    {
      name:         "OpenMetrics Dashboard",
      description:  "Open-source real-time analytics dashboard with WebSocket streaming. 1.2K GitHub stars.",
      technologies: ["Next.js", "TypeScript", "D3.js", "WebSockets"],
      link:         "github.com/alexmorgan/openmetrics",
    },
    {
      name:         "AI Code Reviewer",
      description:  "VS Code extension using GPT-4 for inline code reviews. 800+ Marketplace installs.",
      technologies: ["TypeScript", "OpenAI API", "VS Code API"],
      link:         "marketplace.visualstudio.com/alexmorgan",
    },
  ],
  certifications: [
    "AWS Certified Solutions Architect – Associate (2023)",
    "Google Cloud Professional Data Engineer (2022)",
  ],
  achievements: [
    "Speaker at ReactConf 2023 — 'Scaling React at Stripe'",
    "12 merged PRs to the Next.js open-source project",
  ],
  keywords: ["Full-Stack", "React", "Node.js", "TypeScript", "AWS", "Team Lead"],
};

export default function TemplateGallery({ templates }: { templates: Template[] }) {
  const { selectedTemplate, setSelectedTemplate, themeColor, editedResume } = useResumeStore();

  // Use the user's real resume if available, otherwise fall back to the rich stub
  const previewResume = editedResume?.personal_info?.full_name ? editedResume : STUB_RESUME;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Select Template
      </p>

      <div className="grid grid-cols-2 gap-3">
        {templates.filter(tpl => !["template_8", "template_12"].includes(tpl.id)).map((tpl) => {
          const isSelected = selectedTemplate?.id === tpl.id;
          const meta = TEMPLATE_LABELS[tpl.id] ?? { label: tpl.name, sub: tpl.recommended_for };
          const tplWithTheme = {
            ...tpl,
            colors: { ...tpl.colors, primary: isSelected ? themeColor : tpl.colors.primary },
          };

          return (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl)}
              className="relative rounded-xl text-left transition-all duration-200 border group overflow-hidden"
              style={
                isSelected
                  ? { borderColor: themeColor, boxShadow: `0 0 0 2px ${themeColor}` }
                  : { borderColor: "#e5e7eb" }
              }
            >
              {/* Thumbnail — natural height (no fixed aspect ratio), ScaledPreview sizes to content */}
              <div
                className="w-full overflow-hidden relative"
                style={{ backgroundColor: tpl.colors.background }}
              >
                <ScaledPreview>
                  <ResumePreview
                    resume={previewResume}
                    template={tplWithTheme}
                    fitToPage={false}
                    showPageBreaks={false}
                    forExport={false}
                  />
                </ScaledPreview>

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
                >
                  <span
                    className="text-white font-bold px-3 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", fontSize: "10px" }}
                  >
                    Use This
                  </span>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <div
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
                    style={{ backgroundColor: themeColor }}
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Label row */}
              <div
                className="px-2.5 py-2"
                style={{ backgroundColor: isSelected ? themeColor + "08" : "#fafafa" }}
              >
                <p
                  className="text-[11px] font-bold leading-tight truncate"
                  style={{ color: isSelected ? themeColor : "#374151" }}
                >
                  {meta.label}
                </p>
                <p
                  className="text-[9px] truncate mt-0.5"
                  style={{ color: isSelected ? themeColor + "aa" : "#9ca3af" }}
                >
                  {meta.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
