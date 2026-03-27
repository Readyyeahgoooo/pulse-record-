import { ComplianceLogEntry, DiagnosisReport, EDBChecklistStatus } from '../types';

export const REPORTS_STORAGE_KEY = 'eduPulse.reports.v1';
export const LOGS_STORAGE_KEY = 'eduPulse.logs.v1';

export function buildChecklist(reports: DiagnosisReport[]): EDBChecklistStatus {
  const coveredSubjects = new Set(reports.map((report) => report.subject.trim()).filter(Boolean)).size;

  const generatedTeachingCases = reports.filter((report) => report.status === 'approved').length;
  const hasTeacherApprovalFlow = reports.some((report) => report.status === 'approved');
  const hasPrivacyNotice = true;
  const requiredSubjects = 3;
  const requiredTeachingCases = 2;
  const readyForFundingDraft =
    coveredSubjects >= requiredSubjects &&
    generatedTeachingCases >= requiredTeachingCases &&
    hasTeacherApprovalFlow &&
    hasPrivacyNotice;

  return {
    requiredSubjects,
    coveredSubjects,
    requiredTeachingCases,
    generatedTeachingCases,
    hasTeacherApprovalFlow,
    hasPrivacyNotice,
    readyForFundingDraft,
  };
}

export function saveReports(reports: DiagnosisReport[]): void {
  localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
}

export function saveLogs(logs: ComplianceLogEntry[]): void {
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
}

export function loadReports(): DiagnosisReport[] {
  try {
    const value = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!value) return [];
    return JSON.parse(value) as DiagnosisReport[];
  } catch {
    return [];
  }
}

export function loadLogs(): ComplianceLogEntry[] {
  try {
    const value = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!value) return [];
    return JSON.parse(value) as ComplianceLogEntry[];
  } catch {
    return [];
  }
}

export function exportLogsAsCsv(logs: ComplianceLogEntry[]): string {
  const header = ['timestamp', 'actor', 'action', 'anonymized', 'subject', 'details'];
  const rows = logs.map((log) => [
    log.timestamp,
    log.actor,
    log.action,
    String(log.anonymized),
    escapeCsv(log.subject),
    escapeCsv(log.details),
  ]);
  return [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function exportFundingReportJson(params: {
  schoolName: string;
  reports: DiagnosisReport[];
  logs: ComplianceLogEntry[];
  generatedAt: string;
}): string {
  const approvedReports = params.reports.filter((report) => report.status === 'approved');
  const payload = {
    schoolName: params.schoolName,
    generatedAt: params.generatedAt,
    reportingPeriod: '2026-2028',
    teachingExamples: approvedReports.map((report) => ({
      reportId: report.id,
      studentIdentifier: report.studentIdentifier,
      keyConcerns: report.diagnosis.teacher_summary.key_concerns,
      strategies: report.diagnosis.teacher_summary.actionable_strategies,
      teacherNotes: report.teacherNotes,
      createdAt: report.createdAt,
    })),
    safetyAndGovernance: {
      teacherApprovalFlowEnabled: true,
      anonymizationEnabledByDefault: true,
      aiInteractionsLogged: params.logs.length,
    },
    aiUsageSummary: summarizeUsage(params.logs),
  };
  return JSON.stringify(payload, null, 2);
}

function summarizeUsage(logs: ComplianceLogEntry[]) {
  return {
    diagnosisRequested: logs.filter((log) => log.action === 'diagnosis_requested').length,
    diagnosisGenerated: logs.filter((log) => log.action === 'diagnosis_generated').length,
    diagnosisBlocked: logs.filter((log) => log.action === 'diagnosis_blocked').length,
    reportApproved: logs.filter((log) => log.action === 'report_approved').length,
    progressEvaluated: logs.filter((log) => log.action === 'progress_evaluated').length,
  };
}

function escapeCsv(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}
