import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileDown,
  GraduationCap,
  History,
  LineChart,
  Plus,
  Send,
  ShieldCheck,
  Target,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { diagnoseStudentPerformance, evaluateProgress } from './services/geminiService';
import {
  buildChecklist,
  exportFundingReportJson,
  exportLogsAsCsv,
  loadLogs,
  loadReports,
  LOGS_STORAGE_KEY,
  REPORTS_STORAGE_KEY,
  saveLogs,
  saveReports,
} from './services/complianceService';
import { anonymizeStudentData, containsUnsafeContent } from './services/privacyService';
import {
  AIDiagnosisResponse,
  ComplianceLogEntry,
  DiagnosisReport,
  EDBChecklistStatus,
  PrivacySettings,
  ProgressEvaluation,
  StudentData,
  StudentProfile,
  UserRole,
} from './types';

const INITIAL_STUDENT_DATA: StudentData = {
  subject: 'Mathematics (Secondary 3)',
  topic: 'Algebra and Equations',
  score: 58,
  studentIdentifier: 'S3A-01',
  strengths: ['Basic equation solving', 'Substitution'],
  weaknesses: ['Word problems involving equations', 'Translating sentences into algebra', 'Multi-step problem solving'],
  commonMistakes: ['Misinterpreting keywords ("more than", "difference")', 'Setting up wrong equations', 'Losing marks in final steps'],
};

const INITIAL_PROFILE: StudentProfile = {
  learningStyle: 'Visual learning',
  englishComprehension: 'Weak',
  attentionSpan: 'Short',
};

const INITIAL_PRIVACY: PrivacySettings = {
  anonymizeBeforeAI: true,
  localOnlyStorage: true,
};

type TabKey = 'input' | 'diagnosis' | 'plan' | 'practice' | 'teacher' | 'progress' | 'governance';

export default function App() {
  const [studentData, setStudentData] = useState<StudentData>(INITIAL_STUDENT_DATA);
  const [profile, setProfile] = useState<StudentProfile>(INITIAL_PROFILE);
  const [privacy, setPrivacy] = useState<PrivacySettings>(INITIAL_PRIVACY);
  const [role, setRole] = useState<UserRole>('teacher');
  const [schoolName, setSchoolName] = useState('Demo Secondary School');

  const [diagnosis, setDiagnosis] = useState<AIDiagnosisResponse | null>(null);
  const [progress, setProgress] = useState<ProgressEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [reports, setReports] = useState<DiagnosisReport[]>(() => loadReports());
  const [logs, setLogs] = useState<ComplianceLogEntry[]>(() => loadLogs());
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [teacherNotes, setTeacherNotes] = useState('');
  const [prevWeaknesses, setPrevWeaknesses] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>('input');

  const checklist: EDBChecklistStatus = useMemo(() => buildChecklist(reports), [reports]);
  const approvedReports = useMemo(() => reports.filter((item) => item.status === 'approved'), [reports]);
  const currentReport = useMemo(
    () => reports.find((report) => report.id === currentReportId) || null,
    [reports, currentReportId],
  );

  useEffect(() => {
    if (privacy.localOnlyStorage) {
      saveReports(reports);
      return;
    }
    localStorage.removeItem(REPORTS_STORAGE_KEY);
  }, [privacy.localOnlyStorage, reports]);

  useEffect(() => {
    if (privacy.localOnlyStorage) {
      saveLogs(logs);
      return;
    }
    localStorage.removeItem(LOGS_STORAGE_KEY);
  }, [privacy.localOnlyStorage, logs]);

  useEffect(() => {
    if (role === 'student') {
      setActiveTab('diagnosis');
      const latestApproved = approvedReports[0];
      if (latestApproved) {
        setDiagnosis(latestApproved.diagnosis);
      } else {
        setDiagnosis(null);
      }
      return;
    }

    if (currentReport) {
      setDiagnosis(currentReport.diagnosis);
      return;
    }

    const latestReport = reports[0];
    if (latestReport) {
      setCurrentReportId(latestReport.id);
      setDiagnosis(latestReport.diagnosis);
    } else {
      setDiagnosis(null);
    }
  }, [approvedReports, currentReport, reports, role]);

  const addLog = (
    action: ComplianceLogEntry['action'],
    details: string,
    anonymized = privacy.anonymizeBeforeAI,
    subject = studentData.subject,
  ) => {
    const entry: ComplianceLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actor: role,
      action,
      anonymized,
      subject,
      details,
    };
    setLogs((prev) => [entry, ...prev]);
  };

  const handleDiagnose = async () => {
    if (role === 'student') {
      setErrorMessage('Student role cannot generate diagnostics directly. Wait for teacher-approved reports.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    addLog('diagnosis_requested', 'Teacher started AI diagnosis run.');

    try {
      const inputData = privacy.anonymizeBeforeAI ? anonymizeStudentData(studentData) : studentData;
      const result = await diagnoseStudentPerformance(inputData, profile);

      if (containsUnsafeContent(result)) {
        addLog('diagnosis_blocked', 'Output blocked by content safety policy.');
        setErrorMessage('Generated output failed content safety checks and was blocked.');
        return;
      }

      const report: DiagnosisReport = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        createdBy: role,
        subject: studentData.subject,
        topic: studentData.topic,
        studentIdentifier: inputData.studentIdentifier || 'STUDENT-ANON',
        anonymized: privacy.anonymizeBeforeAI,
        status: 'draft',
        teacherNotes: '',
        diagnosis: result,
      };

      setDiagnosis(result);
      setPrevWeaknesses(studentData.weaknesses);
      setReports((prev) => [report, ...prev]);
      setCurrentReportId(report.id);
      setTeacherNotes('');
      addLog('diagnosis_generated', `Draft report created for ${report.studentIdentifier}.`);
      setActiveTab('diagnosis');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Diagnosis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = () => {
    if (!currentReportId) return;
    setReports((prev) =>
      prev.map((report) =>
        report.id === currentReportId
          ? {
              ...report,
              status: 'approved',
              teacherNotes: teacherNotes.trim(),
            }
          : report,
      ),
    );
    addLog('report_approved', 'Teacher approved AI report for student release.', true, currentReport?.subject || studentData.subject);
  };

  const handleEvaluateProgress = async () => {
    const baselineWeaknesses = prevWeaknesses.length ? prevWeaknesses : studentData.weaknesses;
    if (!baselineWeaknesses.length) {
      setErrorMessage('Run diagnosis first before evaluating progress.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      const result = await evaluateProgress(baselineWeaknesses, studentData);
      setProgress(result);
      addLog('progress_evaluated', 'Progress evaluation generated.');
      setActiveTab('progress');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Progress evaluation failed.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLogs = () => {
    const csv = exportLogsAsCsv(logs);
    downloadFile('compliance_logs.csv', csv, 'text/csv;charset=utf-8;');
    addLog('report_exported', 'Compliance logs exported as CSV.', false, 'All Subjects');
  };

  const handleExportFundingReport = () => {
    const report = exportFundingReportJson({
      schoolName,
      reports,
      logs,
      generatedAt: new Date().toISOString(),
    });
    downloadFile('edb_funding_report.json', report, 'application/json;charset=utf-8;');
    addLog('report_exported', 'Funding report exported as JSON.', false, 'All Subjects');
  };

  const addField = (field: keyof Pick<StudentData, 'strengths' | 'weaknesses' | 'commonMistakes'>) => {
    setStudentData((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const updateField = (
    field: keyof Pick<StudentData, 'strengths' | 'weaknesses' | 'commonMistakes'>,
    index: number,
    value: string,
  ) => {
    const newList = [...studentData[field]];
    newList[index] = value;
    setStudentData((prev) => ({ ...prev, [field]: newList }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              EduPulse <span className="text-indigo-600 font-medium">Safe AI Classroom</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={schoolName}
              onChange={(event) => setSchoolName(event.target.value)}
              className="hidden md:block px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              placeholder="School name"
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-1">
            <NavButton active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={<ClipboardCheck className="w-4 h-4" />} label="Student Input" />
            <NavButton active={activeTab === 'diagnosis'} onClick={() => setActiveTab('diagnosis')} icon={<LineChart className="w-4 h-4" />} label="AI Diagnosis" />
            <NavButton active={activeTab === 'plan'} disabled={!diagnosis} onClick={() => setActiveTab('plan')} icon={<Target className="w-4 h-4" />} label="Improvement Plan" />
            <NavButton active={activeTab === 'practice'} disabled={!diagnosis} onClick={() => setActiveTab('practice')} icon={<BookOpen className="w-4 h-4" />} label="Practice Questions" />
            <NavButton active={activeTab === 'teacher'} disabled={!diagnosis} onClick={() => setActiveTab('teacher')} icon={<Users className="w-4 h-4" />} label="Teacher Summary" />
            <NavButton active={activeTab === 'progress'} disabled={!progress} onClick={() => setActiveTab('progress')} icon={<TrendingUp className="w-4 h-4" />} label="Progress Tracking" />
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Funding readiness</div>
            <NavButton active={activeTab === 'governance'} onClick={() => setActiveTab('governance')} icon={<ShieldCheck className="w-4 h-4" />} label="EDB Governance" />
          </aside>

          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'input' && (
                <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      Student Performance Input
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <InputField label="Student ID" value={studentData.studentIdentifier || ''} onChange={(value) => setStudentData({ ...studentData, studentIdentifier: value })} />
                      <InputField label="Subject" value={studentData.subject} onChange={(value) => setStudentData({ ...studentData, subject: value })} />
                      <InputField label="Topic" value={studentData.topic} onChange={(value) => setStudentData({ ...studentData, topic: value })} />
                      <InputField
                        label="Score (%)"
                        type="number"
                        value={String(studentData.score)}
                        onChange={(value) => setStudentData({ ...studentData, score: Number(value) || 0 })}
                      />
                    </div>

                    <div className="space-y-4">
                      <ListInput label="Strengths" items={studentData.strengths} onAdd={() => addField('strengths')} onUpdate={(i, v) => updateField('strengths', i, v)} />
                      <ListInput label="Weaknesses" items={studentData.weaknesses} onAdd={() => addField('weaknesses')} onUpdate={(i, v) => updateField('weaknesses', i, v)} />
                      <ListInput label="Common Mistakes" items={studentData.commonMistakes} onAdd={() => addField('commonMistakes')} onUpdate={(i, v) => updateField('commonMistakes', i, v)} />
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4">Student Profile + Privacy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <SelectField
                        label="Learning Style"
                        value={profile.learningStyle}
                        options={['Visual learning', 'Auditory learning', 'Kinesthetic learning', 'Reading/Writing']}
                        onChange={(value) => setProfile({ ...profile, learningStyle: value })}
                      />
                      <SelectField
                        label="English Level"
                        value={profile.englishComprehension}
                        options={['Native', 'Strong', 'Moderate', 'Weak']}
                        onChange={(value) => setProfile({ ...profile, englishComprehension: value })}
                      />
                      <SelectField
                        label="Attention Span"
                        value={profile.attentionSpan}
                        options={['Long', 'Moderate', 'Short']}
                        onChange={(value) => setProfile({ ...profile, attentionSpan: value })}
                      />
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900 space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={privacy.anonymizeBeforeAI}
                          onChange={(event) => setPrivacy((prev) => ({ ...prev, anonymizeBeforeAI: event.target.checked }))}
                        />
                        Anonymize student identifier before AI processing
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={privacy.localOnlyStorage}
                          onChange={(event) => setPrivacy((prev) => ({ ...prev, localOnlyStorage: event.target.checked }))}
                        />
                        Keep records in local browser storage only
                      </label>
                    </div>
                  </section>

                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handleEvaluateProgress}
                      disabled={loading}
                      className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-semibold"
                    >
                      {loading ? 'Evaluating...' : 'Evaluate Progress'}
                    </button>
                    <button
                      onClick={handleDiagnose}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? 'Generating...' : 'Generate AI Draft'}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'diagnosis' && (
                <motion.div key="diagnosis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  {!diagnosis && (
                    <EmptyState title="No diagnosis available" body="Generate a draft (teacher/admin) or wait for an approved report (student)." />
                  )}

                  {diagnosis && (
                    <>
                      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                        <h2 className="text-3xl font-bold mb-2">Performance Diagnosis</h2>
                        <p className="text-indigo-100 leading-relaxed text-lg">{diagnosis.diagnosis}</p>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          Root Causes of Mistakes
                        </h3>
                        <ul className="space-y-3">
                          {diagnosis.root_causes.map((cause, i) => (
                            <li key={i} className="text-gray-700">{cause}</li>
                          ))}
                        </ul>
                      </div>

                      {(role === 'teacher' || role === 'admin') && currentReport?.status === 'draft' && (
                        <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
                          <h3 className="text-base font-semibold text-amber-900 mb-3">Teacher Approval Required</h3>
                          <p className="text-sm text-amber-800 mb-4">
                            This draft is not visible to students until approved. Add optional notes, then approve.
                          </p>
                          <textarea
                            value={teacherNotes}
                            onChange={(event) => setTeacherNotes(event.target.value)}
                            placeholder="Teacher notes before student release..."
                            className="w-full min-h-28 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <div className="mt-4 flex justify-end">
                            <button onClick={handleApproveReport} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium">
                              Approve & Release
                            </button>
                          </div>
                        </div>
                      )}

                      {currentReport?.status === 'approved' && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Approved report is ready for student view.
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'plan' && diagnosis && (
                <motion.div key="plan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-2xl font-bold">2-Week Improvement Plan</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PlanCard week="Week 1" steps={diagnosis.improvement_plan.week_1} />
                    <PlanCard week="Week 2" steps={diagnosis.improvement_plan.week_2} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'practice' && diagnosis && (
                <motion.div key="practice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="text-2xl font-bold">Targeted Practice Questions</h2>
                  {diagnosis.practice_questions.map((q, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                      <p className="text-xs font-bold uppercase text-indigo-600 mb-2">Question {i + 1}</p>
                      <p className="font-medium text-gray-900 mb-3">{q.question}</p>
                      <p className="text-sm text-gray-500 mb-1">Skill: {q.skill_targeted}</p>
                      <p className="text-sm text-gray-700">{q.reason}</p>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'teacher' && diagnosis && (
                <motion.div key="teacher" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-xl">
                    <h2 className="text-2xl font-bold mb-6">Teacher Summary & Strategy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">Key Concerns</h3>
                        <ul className="space-y-3">
                          {diagnosis.teacher_summary.key_concerns.map((item, i) => (
                            <li key={i} className="text-gray-300">{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">Actionable Teaching Strategies</h3>
                        <ul className="space-y-3">
                          {diagnosis.teacher_summary.actionable_strategies.map((item, i) => (
                            <li key={i} className="text-gray-300">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'progress' && (
                <motion.div key="progress" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  {!progress && <EmptyState title="No progress record yet" body="Run diagnosis first, then evaluate progress after data updates." />}
                  {progress && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <History className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Progress Status</span>
                      </div>
                      <div className="mb-6 inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">{progress.status}</div>
                      <p className="text-gray-700 mb-6">{progress.comparison}</p>
                      <h3 className="text-sm font-bold uppercase text-gray-400 mb-4">Adjusted Plan</h3>
                      <ul className="space-y-2">
                        {progress.adjusted_plan.map((step, i) => (
                          <li key={i} className="text-gray-700 text-sm">{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'governance' && (
                <motion.div key="governance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      EDB Funding Checklist
                    </h2>
                    <ul className="space-y-3 text-sm text-gray-700">
                      <li>Subjects covered: {checklist.coveredSubjects} / {checklist.requiredSubjects}</li>
                      <li>Approved teaching cases: {checklist.generatedTeachingCases} / {checklist.requiredTeachingCases}</li>
                      <li>Teacher approval flow: {checklist.hasTeacherApprovalFlow ? 'Enabled' : 'Pending'}</li>
                      <li>Privacy notice and anonymization options: {checklist.hasPrivacyNotice ? 'Enabled' : 'Pending'}</li>
                    </ul>
                    <div
                      className={`mt-4 px-3 py-2 rounded-lg text-sm font-medium ${
                        checklist.readyForFundingDraft ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {checklist.readyForFundingDraft
                        ? 'Ready to draft funding submission package.'
                        : 'Not funding-ready yet. Complete missing checklist items.'}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Compliance Reporting</h3>
                    <div className="flex flex-wrap gap-3 mb-6">
                      <button
                        onClick={handleExportLogs}
                        className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        Export Logs (CSV)
                      </button>
                      <button
                        onClick={handleExportFundingReport}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        Export Funding Report (JSON)
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 font-semibold text-gray-500">Time</th>
                            <th className="px-3 py-2 font-semibold text-gray-500">Actor</th>
                            <th className="px-3 py-2 font-semibold text-gray-500">Action</th>
                            <th className="px-3 py-2 font-semibold text-gray-500">Subject</th>
                            <th className="px-3 py-2 font-semibold text-gray-500">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.slice(0, 20).map((entry) => (
                            <tr key={entry.id} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-500">{new Date(entry.timestamp).toLocaleString()}</td>
                              <td className="px-3 py-2 text-gray-700">{entry.actor}</td>
                              <td className="px-3 py-2 text-gray-700">{entry.action}</td>
                              <td className="px-3 py-2 text-gray-700">{entry.subject}</td>
                              <td className="px-3 py-2 text-gray-700">{entry.details}</td>
                            </tr>
                          ))}
                          {logs.length === 0 && (
                            <tr>
                              <td className="px-3 py-4 text-gray-400" colSpan={5}>
                                No compliance logs yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-600">
      <p className="font-semibold text-gray-900 mb-2">{title}</p>
      <p className="text-sm">{body}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function NavButton({
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
          : 'text-gray-500 hover:bg-white/50 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed'
      }`}
    >
      {icon}
      {label}
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function ListInput({
  label,
  items,
  onAdd,
  onUpdate,
}: {
  label: string;
  items: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold uppercase text-gray-400">{label}</label>
        <button onClick={onAdd} className="text-indigo-600 hover:text-indigo-700 p-1">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <input
            key={i}
            type="text"
            value={item}
            onChange={(event) => onUpdate(i, event.target.value)}
            placeholder={`Add ${label.toLowerCase()}...`}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ week, steps }: { week: string; steps: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">{week}</h3>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-indigo-600">{i + 1}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
