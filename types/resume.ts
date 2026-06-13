// Original parser types (used by simple parser route)
export interface ResumeData {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  skills: string[];
  experience: Array<{ company: string; role: string; duration: string; description: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
  projects: Array<{ name: string; description: string; tech_stack: string[] }>;
}

export interface ParseResponse {
  success: boolean;
  data?: ResumeData;
  error?: string;
  rawText?: string;
}
