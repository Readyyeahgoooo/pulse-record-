import type { AIDiagnosisResponse, ProgressEvaluation, StudentData, StudentProfile } from '../types';
import { buildDemoDiagnosis, buildDemoProgress } from './demoData';

export async function diagnoseStudentPerformance(
  data: StudentData,
  profile: StudentProfile,
): Promise<AIDiagnosisResponse> {
  try {
    return await postJson<AIDiagnosisResponse>('/api/diagnose', {
      studentData: data,
      profile,
    });
  } catch {
    return buildDemoDiagnosis(data, profile);
  }
}

export async function evaluateProgress(
  previousWeaknesses: string[],
  newResults: StudentData,
): Promise<ProgressEvaluation> {
  try {
    return await postJson<ProgressEvaluation>('/api/progress', {
      previousWeaknesses,
      newResults,
    });
  } catch {
    return buildDemoProgress(previousWeaknesses, newResults);
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.');
  }

  return payload as T;
}
