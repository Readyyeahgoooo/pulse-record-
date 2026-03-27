export interface StudentData {
  subject: string;
  topic: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  commonMistakes: string[];
}

export interface StudentProfile {
  learningStyle: string;
  englishComprehension: string;
  attentionSpan: string;
}

export interface PracticeQuestion {
  question: string;
  skill_targeted: string;
  reason: string;
}

export interface ImprovementPlan {
  week_1: string[];
  week_2: string[];
}

export interface TeacherSummary {
  key_concerns: string[];
  actionable_strategies: string[];
}

export interface AIDiagnosisResponse {
  diagnosis: string;
  root_causes: string[];
  improvement_plan: ImprovementPlan;
  practice_questions: PracticeQuestion[];
  teacher_summary: TeacherSummary;
}

export interface ProgressEvaluation {
  comparison: string;
  status: 'improved' | 'stagnant' | 'declined';
  adjusted_plan: string[];
}
