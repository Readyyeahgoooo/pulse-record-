export interface StudentData {
  subject: string;
  topic: string;
  score: number;
  studentIdentifier?: string;
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

export type UserRole = 'teacher' | 'student' | 'admin';

export type ReportStatus = 'draft' | 'approved';

export interface PrivacySettings {
  anonymizeBeforeAI: boolean;
  localOnlyStorage: boolean;
}

export interface DiagnosisReport {
  id: string;
  createdAt: string;
  createdBy: UserRole;
  subject: string;
  topic: string;
  studentIdentifier: string;
  anonymized: boolean;
  status: ReportStatus;
  teacherNotes: string;
  diagnosis: AIDiagnosisResponse;
}

export interface ComplianceLogEntry {
  id: string;
  timestamp: string;
  actor: UserRole;
  action:
    | 'diagnosis_requested'
    | 'diagnosis_generated'
    | 'diagnosis_blocked'
    | 'report_approved'
    | 'progress_evaluated'
    | 'report_exported';
  anonymized: boolean;
  subject: string;
  details: string;
}

export interface EDBChecklistStatus {
  requiredSubjects: number;
  coveredSubjects: number;
  requiredTeachingCases: number;
  generatedTeachingCases: number;
  hasTeacherApprovalFlow: boolean;
  hasPrivacyNotice: boolean;
  readyForFundingDraft: boolean;
}
