export type ResumeStatus = 'IDLE' | 'LOADING' | 'ANALYZED' | 'ERROR';

export interface QuickFix {
  type: 'bullet_fix' | 'skill_fix';
  section: string;
  original: string;
  suggested: string;
}

export interface JdMatch {
  score: number;
  jd_match_score: number; // Alias for score
  match_label: string;
  benchmark_range?: string;
  matched_keywords: string[];
  missing_keywords: string[];
  matched_with_labels?: { keyword: string; label: string }[];
  missing_with_labels?: { keyword: string; label: string }[];
  tech_matched_count: number;
  tech_required_count: number;
  action_insights?: { skill: string; type: string; message: string }[];
  suggested_bullets?: string[];
  semantic_score?: number;
  keyword_score?: number; // Alias for keyword_overlap_score
  section_score?: number;
  insights: string[]; 
  quick_fixes?: QuickFix[];
}

export interface ResumeAnalysis {
  full_text: string;
  inferred_role: string;
  confirmed_role?: string;
  skills: string[];
  education: { degree: string; institution: string; year: string }[];
  experience: { title: string; company: string; duration: string; impact: string }[];
  projects: { name: string; tech_stack: string[]; description: string }[];
  sections?: string[];
  ats_score: number;
  strength_score: number;
  industry_readiness: string;
  skill_gap: string[];
  keyword_suggestions: string[];
  improvement_checklist: { task: string; priority: string }[];
  experience_impact_score: number;
  readiness_score?: number;
  target_role?: string;
  jd_match?: JdMatch | null;
  semantic_score?: number;
  ats_breakdown?: Record<string, number>; // Added for compatibility
  micro_feedback?: string;
  debug?: {
    length: number;
    parser_used: string;
    keywords_detected: number;
    semantic_score?: number;
  };
}
