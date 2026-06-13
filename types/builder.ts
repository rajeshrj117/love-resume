export interface PersonalInfo {
  full_name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface Skills {
  technical: string[];
  soft: string[];
  tools: string[];
  frameworks: string[];
  cloud: string[];
}

export interface Experience {
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  start_year: string;
  end_year: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  link: string;
}

export interface ATSScore {
  total: number;
  breakdown: Record<string, number>;
  missing_keywords: string[];
  strengths: string[];
  improvements: string[];
}

export interface TemplateStyle {
  font: string;
  spacing: string;
  density: string;
  fontSize?: string;
}

export interface TemplateColors {
  primary: string;
  secondary: string;
  background: string;
}

export interface Template {
  id: string;
  name: string;
  layout: { columns: number; header: boolean; sidebar: boolean };
  sections_order: string[];
  style: TemplateStyle;
  colors: TemplateColors;
  recommended_for: string;
}

export interface BuilderField {
  id: string;
  label: string;
  type: string;
  value: string | string[];
}

export interface BuilderSection {
  id: string;
  title: string;
  fields: BuilderField[];
}

export interface ParsedResume {
  personal_info: PersonalInfo;
  summary: string;
  skills: Skills;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: string[];
  achievements: string[];
  keywords: string[];
  languages: string[];
}

export interface BuildResult {
  parsed: ParsedResume;
  cleaned: ParsedResume;
  ats_score: ATSScore;
  builder: { sections: BuilderSection[]; editable: boolean; draggable: boolean };
  job_match: { score: number; matched_skills: string[]; missing_skills: string[] };
  templates: Template[];
}
