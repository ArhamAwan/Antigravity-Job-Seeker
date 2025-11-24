export interface CVAnalysis {
  hardSkills: string[];
  softSkills: string[];
  experienceLevel: string;
  suggestedRoles: string[];
  adjacentIndustries: string[];
  antigravityBooleanStrings: {
    label: string;
    query: string;
    explanation: string;
  }[];
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  reasoning: string;
  applicationUrl?: string; // From grounding
  isSimulated?: boolean; // If purely generated based on logic vs found via search
}

export enum AppPhase {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEW_ANALYSIS = 'REVIEW_ANALYSIS',
  SEARCHING = 'SEARCHING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}
