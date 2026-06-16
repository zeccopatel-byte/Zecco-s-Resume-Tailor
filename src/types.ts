export interface TailorRequest {
  resumeText: string;
  jobDescription: string;
}

export interface DocumentState {
  resume: string;
  coverLetter: string;
  coldEmail: string;
  atsReport: string;
}

export interface KeywordMatch {
  keyword: string;
  status: 'matched' | 'unmatched';
  reason?: string;
}

export interface TailorResult {
  id: string;
  timestamp: string;
  jobTitle: string;
  companyName: string;
  resumeOutput: string;
  coverLetterOutput: string;
  coldEmailOutput: string;
  atsReportOutput: string;
  originalResume: string;
  originalJobDesc: string;
  matchScore: number;
}

export interface DemoProfile {
  id: string;
  role: string;
  icon: string;
  name: string;
  resumeText: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}
