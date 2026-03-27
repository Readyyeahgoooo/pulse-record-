import { AIDiagnosisResponse, StudentData } from '../types';

const BLOCKED_TERMS = [
  'self-harm',
  'suicide',
  'kill',
  'porn',
  'sexual',
  'hate speech',
  'terrorist',
];

const BLOCKED_PATTERNS = BLOCKED_TERMS.map((term) => {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (term.includes(' ')) {
    return new RegExp(`\\b${escaped}\\b`, 'i');
  }
  return new RegExp(`\\b${escaped}\\b`, 'i');
});

function maskIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'STUDENT-ANON';
  const suffix = Math.abs(
    Array.from(trimmed).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000,
  )
    .toString()
    .padStart(4, '0');
  return `STUDENT-${suffix}`;
}

export function anonymizeStudentData(data: StudentData): StudentData {
  return {
    ...data,
    studentIdentifier: maskIdentifier(data.studentIdentifier || ''),
  };
}

function hasBlockedTerms(value: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(value));
}

export function containsUnsafeContent(response: AIDiagnosisResponse): boolean {
  const textParts: string[] = [
    response.diagnosis,
    ...response.root_causes,
    ...response.improvement_plan.week_1,
    ...response.improvement_plan.week_2,
    ...response.practice_questions.map((item) => item.question),
    ...response.practice_questions.map((item) => item.reason),
    ...response.teacher_summary.key_concerns,
    ...response.teacher_summary.actionable_strategies,
  ];
  return textParts.some(hasBlockedTerms);
}
