"use client";
import { useRef } from "react";
import { useResumeStore, THEME_COLORS, FONT_FAMILIES } from "@/store/resumeStore";

const AI_ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "Product Manager",
  "UX Designer", "Marketing Manager", "Business Analyst", "Project Manager",
  "Data Analyst", "Cloud Architect", "Cybersecurity Engineer", "Mobile Developer",
  "QA Engineer", "Technical Writer", "Sales Manager", "HR Manager",
  "Financial Analyst", "Operations Manager", "Content Strategist", "Graphic Designer",
  "Research Scientist", "Consultant", "Accountant", "Customer Success Manager",
  "Legal Counsel", "Executive / C-Suite",
];

const ROLE_TEMPLATES: Record<string, Partial<{ summary: string; skills: { technical: string[]; frameworks: string[]; tools: string[]; cloud: string[]; soft: string[] } }>> = {
  "Software Engineer": { summary: "Experienced software engineer with expertise in building scalable applications. Passionate about clean code, system design, and delivering high-impact solutions.", skills: { technical: ["Python","JavaScript","TypeScript","Java","C++","SQL","Data Structures","Algorithms"], frameworks: ["React","Node.js","Django","Spring Boot","FastAPI"], tools: ["Git","Docker","Kubernetes","CI/CD","JIRA"], cloud: ["AWS","GCP","Azure"], soft: ["Problem Solving","Team Collaboration","Communication","Agile"] } },
  "Frontend Developer": { summary: "Creative frontend developer specializing in building responsive, accessible, and performant web applications with modern JavaScript frameworks.", skills: { technical: ["HTML5","CSS3","JavaScript","TypeScript","Responsive Design","Web Performance"], frameworks: ["React","Vue.js","Next.js","Tailwind CSS","SASS"], tools: ["Webpack","Vite","Figma","Chrome DevTools","Git"], cloud: ["Vercel","Netlify","AWS S3","Cloudflare"], soft: ["Attention to Detail","Creativity","User Empathy","Communication"] } },
  "Backend Developer": { summary: "Backend developer with deep expertise in building reliable, scalable server-side systems, REST APIs, and microservices architectures.", skills: { technical: ["Python","Java","Go","Node.js","SQL","NoSQL","REST APIs","Microservices"], frameworks: ["Spring Boot","Django","FastAPI","Express.js","gRPC"], tools: ["Docker","Kubernetes","Git","Postman","Redis"], cloud: ["AWS","GCP","Azure","Heroku"], soft: ["Problem Solving","System Design","Documentation","Collaboration"] } },
  "Full Stack Developer": { summary: "Full stack developer comfortable across the entire web stack, from crafting polished UIs to architecting robust backend services and databases.", skills: { technical: ["JavaScript","TypeScript","Python","SQL","REST APIs","GraphQL"], frameworks: ["React","Node.js","Next.js","Express.js","PostgreSQL"], tools: ["Git","Docker","Figma","CI/CD","JIRA"], cloud: ["AWS","Vercel","Firebase"], soft: ["Versatility","Communication","Problem Solving","Agile"] } },
  "Data Scientist": { summary: "Data scientist with strong background in machine learning, statistical analysis, and transforming complex datasets into actionable business insights.", skills: { technical: ["Python","R","SQL","Machine Learning","Deep Learning","Statistics","NLP"], frameworks: ["TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy"], tools: ["Jupyter","Tableau","Power BI","Git","Airflow"], cloud: ["AWS SageMaker","GCP BigQuery","Azure ML"], soft: ["Analytical Thinking","Storytelling","Business Acumen"] } },
  "Machine Learning Engineer": { summary: "Machine learning engineer specializing in designing, training, and deploying production-grade ML models and intelligent data pipelines at scale.", skills: { technical: ["Python","Machine Learning","Deep Learning","Computer Vision","NLP","MLOps"], frameworks: ["TensorFlow","PyTorch","Keras","Scikit-learn","Hugging Face"], tools: ["MLflow","Kubeflow","Docker","Git","Jupyter"], cloud: ["AWS SageMaker","GCP Vertex AI","Azure ML"], soft: ["Research Mindset","Experimentation","Communication","Collaboration"] } },
  "DevOps Engineer": { summary: "DevOps engineer passionate about automating infrastructure, streamlining CI/CD pipelines, and ensuring high availability of production systems.", skills: { technical: ["Linux","Bash","Python","Infrastructure as Code","CI/CD","Monitoring"], frameworks: ["Terraform","Ansible","Helm","ArgoCD"], tools: ["Docker","Kubernetes","Jenkins","Git","Prometheus","Grafana"], cloud: ["AWS","GCP","Azure"], soft: ["Problem Solving","Reliability Mindset","Collaboration","Documentation"] } },
  "Product Manager": { summary: "Results-driven product manager with experience leading cross-functional teams to define product vision, roadmap, and deliver customer-centric features.", skills: { technical: ["Product Roadmapping","A/B Testing","User Research","Market Analysis","KPI Definition"], frameworks: ["Agile","Scrum","OKRs","JTBD","Design Thinking"], tools: ["JIRA","Confluence","Figma","Mixpanel","SQL"], cloud: [], soft: ["Leadership","Stakeholder Management","Strategic Thinking","Communication"] } },
  "UX Designer": { summary: "UX designer dedicated to crafting intuitive, accessible digital experiences through user research, prototyping, and data-driven design iteration.", skills: { technical: ["User Research","Wireframing","Prototyping","Usability Testing","Information Architecture","Accessibility"], frameworks: ["Design Thinking","Double Diamond","Atomic Design"], tools: ["Figma","Adobe XD","Sketch","Maze","Hotjar","Miro"], cloud: ["Zeplin","InVision","Loom"], soft: ["Empathy","Creativity","Communication","Collaboration"] } },
  "Marketing Manager": { summary: "Marketing manager with a track record of growing brand awareness, driving demand generation, and leading integrated campaigns.", skills: { technical: ["SEO/SEM","Content Marketing","Email Marketing","Paid Ads","Analytics","CRM"], frameworks: ["Inbound Marketing","Growth Hacking","AIDA"], tools: ["HubSpot","Google Analytics","Mailchimp","Salesforce","Canva"], cloud: ["Google Ads","Meta Ads","LinkedIn Ads"], soft: ["Creativity","Data-Driven Thinking","Leadership","Communication"] } },
  "Business Analyst": { summary: "Business analyst skilled in bridging the gap between business stakeholders and technical teams through requirements gathering, process modelling, and data analysis.", skills: { technical: ["Requirements Analysis","Process Mapping","SQL","Data Analysis","Business Intelligence"], frameworks: ["Agile","Waterfall","BPMN","UML"], tools: ["JIRA","Confluence","Tableau","Power BI","Excel"], cloud: ["Salesforce","SAP"], soft: ["Critical Thinking","Communication","Stakeholder Management","Problem Solving"] } },
  "Project Manager": { summary: "Certified project manager with a proven ability to deliver complex initiatives on time and within budget while managing scope, risk, and stakeholder expectations.", skills: { technical: ["Project Planning","Risk Management","Scope Management","Budget Control","Reporting"], frameworks: ["PMP","Agile","Scrum","PRINCE2","Waterfall"], tools: ["MS Project","JIRA","Asana","Confluence","Smartsheet"], cloud: [], soft: ["Leadership","Communication","Negotiation","Problem Solving"] } },
  "Data Analyst": { summary: "Data analyst who transforms raw data into clear, compelling insights that support strategic business decisions using SQL, Python, and BI tools.", skills: { technical: ["SQL","Python","Excel","Data Visualisation","Statistical Analysis","ETL"], frameworks: ["Pandas","NumPy","dbt"], tools: ["Tableau","Power BI","Google Data Studio","Looker","Jupyter"], cloud: ["BigQuery","Redshift","Snowflake"], soft: ["Attention to Detail","Storytelling","Curiosity","Communication"] } },
  "Cloud Architect": { summary: "Cloud architect with extensive experience designing scalable, secure, and cost-optimised cloud infrastructure across multi-cloud environments.", skills: { technical: ["Cloud Architecture","Infrastructure as Code","Security","Networking","Cost Optimisation"], frameworks: ["Well-Architected Framework","TOGAF","Serverless"], tools: ["Terraform","CloudFormation","Ansible","Docker","Kubernetes"], cloud: ["AWS","GCP","Azure","Multi-Cloud"], soft: ["Strategic Thinking","Leadership","Documentation","Collaboration"] } },
  "Cybersecurity Engineer": { summary: "Cybersecurity engineer protecting organisations from threats through vulnerability assessments, penetration testing, incident response, and security architecture.", skills: { technical: ["Penetration Testing","Vulnerability Assessment","SIEM","Incident Response","Cryptography","Network Security"], frameworks: ["NIST","ISO 27001","OWASP","Zero Trust"], tools: ["Burp Suite","Wireshark","Metasploit","Splunk","Nessus"], cloud: ["AWS Security","Azure Sentinel","GCP Security Command Center"], soft: ["Analytical Thinking","Ethics","Attention to Detail","Communication"] } },
  "Mobile Developer": { summary: "Mobile developer crafting performant, user-friendly iOS and Android applications with a focus on clean architecture and great user experience.", skills: { technical: ["Swift","Kotlin","Dart","REST APIs","Mobile UI Design","App Store Deployment"], frameworks: ["Flutter","React Native","SwiftUI","Jetpack Compose"], tools: ["Xcode","Android Studio","Git","Figma","Firebase"], cloud: ["AWS Amplify","Firebase","App Store Connect","Google Play Console"], soft: ["Attention to Detail","User Empathy","Problem Solving","Agile"] } },
  "QA Engineer": { summary: "QA engineer ensuring product quality through comprehensive manual and automated testing strategies, bug tracking, and continuous improvement of testing processes.", skills: { technical: ["Manual Testing","Test Automation","API Testing","Performance Testing","Test Planning"], frameworks: ["Selenium","Cypress","Playwright","TestNG","JUnit"], tools: ["JIRA","Postman","Jenkins","Git","BrowserStack"], cloud: ["Sauce Labs","AWS Device Farm"], soft: ["Attention to Detail","Critical Thinking","Communication","Collaboration"] } },
  "Technical Writer": { summary: "Technical writer translating complex technical concepts into clear, accurate documentation for developers, end-users, and stakeholders.", skills: { technical: ["Technical Documentation","API Documentation","Style Guides","Content Strategy","Docs-as-Code"], frameworks: ["Docs-as-Code","DITA","Darwin"], tools: ["Confluence","Notion","GitHub","Swagger","Markdown"], cloud: ["ReadMe","GitBook"], soft: ["Clarity","Attention to Detail","Research","Collaboration"] } },
  "Sales Manager": { summary: "Sales manager with a strong record of exceeding targets, building high-performing teams, and developing strategic client relationships.", skills: { technical: ["Sales Strategy","Pipeline Management","Forecasting","Account Management","Contract Negotiation"], frameworks: ["MEDDIC","Challenger Sale","SPIN Selling"], tools: ["Salesforce","HubSpot","Outreach","LinkedIn Sales Navigator","Gong"], cloud: [], soft: ["Leadership","Persuasion","Resilience","Communication"] } },
  "HR Manager": { summary: "HR manager driving talent acquisition, employee engagement, and organisational development initiatives that align people strategy with business objectives.", skills: { technical: ["Talent Acquisition","Performance Management","Employee Relations","Compensation & Benefits","HR Analytics"], frameworks: ["OKRs","Agile HR","70-20-10 Learning Model"], tools: ["Workday","BambooHR","LinkedIn Recruiter","Greenhouse","MS Office"], cloud: [], soft: ["Empathy","Communication","Confidentiality","Leadership"] } },
  "Financial Analyst": { summary: "Financial analyst delivering accurate financial modelling, forecasting, and reporting that guide executive decision-making and investor relations.", skills: { technical: ["Financial Modelling","Valuation","Budgeting","Forecasting","Financial Reporting","SQL"], frameworks: ["DCF","Comparable Company Analysis","LBO Modelling"], tools: ["Excel","Bloomberg","Tableau","Power BI","Python"], cloud: ["Adaptive Insights","Anaplan"], soft: ["Analytical Thinking","Attention to Detail","Communication","Integrity"] } },
  "Operations Manager": { summary: "Operations manager driving efficiency, process excellence, and cross-functional alignment to deliver business results at scale.", skills: { technical: ["Operations Management","Process Optimisation","Supply Chain","KPI Tracking","Vendor Management"], frameworks: ["Lean","Six Sigma","Kaizen"], tools: ["ERP","Tableau","MS Office","Asana","Slack"], cloud: [], soft: ["Leadership","Problem Solving","Communication","Adaptability"] } },
  "Content Strategist": { summary: "Content strategist developing and executing content programmes that build brand authority, engage audiences, and drive measurable business outcomes.", skills: { technical: ["Content Strategy","SEO","Editorial Planning","Audience Research","Analytics"], frameworks: ["Content Marketing","Inbound","Storytelling"], tools: ["HubSpot","WordPress","Google Analytics","Ahrefs","Notion"], cloud: [], soft: ["Creativity","Writing","Analytical Thinking","Collaboration"] } },
  "Graphic Designer": { summary: "Graphic designer creating visually compelling brand identities, marketing materials, and digital assets that communicate clearly and leave a lasting impression.", skills: { technical: ["Brand Identity","Typography","Layout Design","Illustration","Print & Digital Design"], frameworks: ["Design Thinking","Brand Guidelines"], tools: ["Adobe Illustrator","Photoshop","InDesign","Figma","Canva"], cloud: ["Creative Cloud","Zeplin"], soft: ["Creativity","Attention to Detail","Client Communication","Time Management"] } },
  "Research Scientist": { summary: "Research scientist with deep expertise in experimental design, data analysis, and translating scientific findings into impactful innovations.", skills: { technical: ["Experimental Design","Statistical Analysis","Data Collection","Scientific Writing","Literature Review"], frameworks: ["Hypothesis Testing","Peer Review","R&D Lifecycle"], tools: ["Python","R","MATLAB","Jupyter","LaTeX"], cloud: ["AWS","Google Colab","HPC Clusters"], soft: ["Critical Thinking","Curiosity","Collaboration","Communication"] } },
  "Consultant": { summary: "Management consultant specialising in strategy, operations, and transformation initiatives that drive growth and competitive advantage for clients.", skills: { technical: ["Strategic Analysis","Business Case Development","Stakeholder Management","Process Improvement","Data Analysis"], frameworks: ["McKinsey 7S","SWOT","MECE","Agile"], tools: ["PowerPoint","Excel","JIRA","Tableau","Miro"], cloud: [], soft: ["Problem Solving","Communication","Leadership","Adaptability"] } },
  "Accountant": { summary: "Accountant with expertise in financial reporting, tax compliance, and audit management, ensuring accuracy and regulatory adherence across business functions.", skills: { technical: ["Financial Reporting","Tax Compliance","Auditing","Bookkeeping","Budgeting"], frameworks: ["GAAP","IFRS","SOX"], tools: ["QuickBooks","SAP","Oracle","Excel","Xero"], cloud: ["Sage Intacct","NetSuite"], soft: ["Attention to Detail","Integrity","Analytical Thinking","Communication"] } },
  "Customer Success Manager": { summary: "Customer success manager dedicated to driving product adoption, reducing churn, and building long-term partnerships that expand customer value.", skills: { technical: ["Customer Onboarding","Account Management","Churn Analysis","QBR Facilitation","NPS/CSAT"], frameworks: ["Customer Journey Mapping","Health Scoring","VOC"], tools: ["Salesforce","Gainsight","Zendesk","HubSpot","Mixpanel"], cloud: [], soft: ["Empathy","Communication","Problem Solving","Relationship Building"] } },
  "Legal Counsel": { summary: "Legal counsel providing strategic advice on corporate governance, contracts, regulatory compliance, and risk management to protect organisational interests.", skills: { technical: ["Contract Drafting","Corporate Law","Regulatory Compliance","Risk Management","Litigation Support"], frameworks: ["GDPR","SOX","Legal Risk Framework"], tools: ["Westlaw","LexisNexis","DocuSign","MS Office","Contract Management Systems"], cloud: [], soft: ["Analytical Thinking","Integrity","Communication","Negotiation"] } },
  "Executive / C-Suite": { summary: "Visionary executive with a track record of driving organisational growth, building high-performing cultures, and delivering shareholder value across global markets.", skills: { technical: ["Strategic Planning","P&L Management","M&A","Fundraising","Board Reporting","Stakeholder Management"], frameworks: ["OKRs","Balanced Scorecard","Agile Transformation"], tools: ["Salesforce","PowerPoint","Tableau","Financial Modelling","ERP Systems"], cloud: [], soft: ["Leadership","Vision","Communication","Decisiveness","Executive Presence"] } },
};

export default function SettingsPanel() {
  const {
    themeColor, setThemeColor,
    fontFamily, setFontFamily,
    fontSize, setFontSize,
    profilePhoto, setProfilePhoto,
    editedResume, updateResume,
  } = useResumeStore();

  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfilePhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAIPrefill = (role: string) => {
    if (!role || !editedResume) return;
    const tpl = ROLE_TEMPLATES[role];
    if (!tpl) return;
    updateResume({
      summary: tpl.summary ?? editedResume.summary,
      skills: { ...editedResume.skills, ...tpl.skills },
    });
  };

  return (
    <div className="space-y-4">
      {/* Instant AI Pre-Fill */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: themeColor + "20" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-800">AI Pre-Fill</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: themeColor }}>
            {AI_ROLES.length} Roles
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">Pick a role to instantly populate your resume with industry-specific content.</p>
        <div className="relative">
          <select
            onChange={e => handleAIPrefill(e.target.value)}
            defaultValue=""
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer pr-8"
            style={{ "--tw-ring-color": themeColor } as React.CSSProperties}
          >
            <option value="">— Select Your Target Job Role —</option>
            {AI_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Profile Photo */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-sm font-semibold text-gray-800">Profile Photo</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            )}
          </div>
          <div className="flex-1">
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors font-medium"
            >
              {profilePhoto ? "Change Photo" : "Upload Photo"}
            </button>
            {profilePhoto && (
              <button onClick={() => setProfilePhoto(null)} className="mt-1.5 text-xs text-red-400 hover:text-red-500 w-full text-center">
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Theme Color */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2">
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-800">Theme Color</span>
          </div>
          <span className="text-xs text-gray-400 font-mono">{themeColor}</span>
        </div>
        {/* Larger touch targets for mobile */}
        <div className="flex flex-wrap gap-2.5">
          {THEME_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setThemeColor(color)}
              className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center"
              style={{
                backgroundColor: color,
                borderColor: themeColor === color ? "#1f2937" : "transparent",
                boxShadow: themeColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none",
              }}
              title={color}
            >
              {themeColor === color && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
          <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden relative" title="Custom color">
            <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="absolute opacity-0 w-9 h-9 cursor-pointer" />
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </label>
        </div>
      </div>

      {/* Font Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
          <span className="text-sm font-semibold text-gray-800">Font Settings</span>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-500 font-medium mb-1.5 block uppercase tracking-wide">Font Family</label>
          <div className="relative">
            <select
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none transition-all appearance-none pr-8"
            >
              {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-medium mb-1.5 block uppercase tracking-wide">Font Size</label>
          <div className="grid grid-cols-3 gap-2">
            {(["compact", "normal", "large"] as const).map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className="py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border"
                style={fontSize === size ? {
                  backgroundColor: themeColor,
                  color: "white",
                  borderColor: themeColor,
                } : {
                  backgroundColor: "white",
                  color: "#6b7280",
                  borderColor: "#e5e7eb",
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
