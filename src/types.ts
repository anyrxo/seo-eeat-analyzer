export interface EEATScore {
  experience: number; // 0-100
  expertise: number; // 0-100
  authoritativeness: number; // 0-100
  trustworthiness: number; // 0-100
  overall: number; // 0-100
}

export interface EEATIssue {
  category: 'experience' | 'expertise' | 'authoritativeness' | 'trustworthiness';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  element?: string;
  fix: string;
}

export interface StructuredDataIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix: string;
}

export interface AnalysisResult {
  url: string;
  eatScore: EEATScore;
  issues: EEATIssue[];
  structuredData: {
    found: string[];
    missing: string[];
    issues: StructuredDataIssue[];
  };
  recommendations: string[];
  aeoReadiness: {
    chatgpt: number; // 0-100
    perplexity: number; // 0-100
    googleAI: number; // 0-100
  };
}
