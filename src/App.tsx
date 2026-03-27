import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  BrainCircuit, 
  ClipboardCheck, 
  GraduationCap, 
  LineChart, 
  Plus, 
  Send, 
  User, 
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Target,
  Users,
  Lightbulb,
  TrendingUp,
  History,
  ArrowRight
} from 'lucide-react';
import { diagnoseStudentPerformance, evaluateProgress } from './services/geminiService';
import { StudentData, StudentProfile, AIDiagnosisResponse, ProgressEvaluation } from './types';

const INITIAL_STUDENT_DATA: StudentData = {
  subject: 'Mathematics (Secondary 3)',
  topic: 'Algebra and Equations',
  score: 58,
  strengths: ['Basic equation solving', 'Substitution'],
  weaknesses: ['Word problems involving equations', 'Translating sentences into algebra', 'Multi-step problem solving'],
  commonMistakes: ['Misinterpreting keywords ("more than", "difference")', 'Setting up wrong equations', 'Losing marks in final steps']
};

const INITIAL_PROFILE: StudentProfile = {
  learningStyle: 'Visual learning',
  englishComprehension: 'Weak',
  attentionSpan: 'Short'
};

export default function App() {
  const [studentData, setStudentData] = useState<StudentData>(INITIAL_STUDENT_DATA);
  const [profile, setProfile] = useState<StudentProfile>(INITIAL_PROFILE);
  const [diagnosis, setDiagnosis] = useState<AIDiagnosisResponse | null>(null);
  const [progress, setProgress] = useState<ProgressEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'diagnosis' | 'plan' | 'practice' | 'teacher' | 'progress'>('input');

  // For demo purposes, we'll store the "previous" weaknesses when diagnosis is generated
  const [prevWeaknesses, setPrevWeaknesses] = useState<string[]>([]);

  const handleDiagnose = async () => {
    setLoading(true);
    try {
      const result = await diagnoseStudentPerformance(studentData, profile);
      setDiagnosis(result);
      setPrevWeaknesses(studentData.weaknesses);
      setActiveTab('diagnosis');
    } catch (error) {
      console.error("Diagnosis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateProgress = async () => {
    if (!prevWeaknesses.length) return;
    setLoading(true);
    try {
      const result = await evaluateProgress(prevWeaknesses, studentData);
      setProgress(result);
      setActiveTab('progress');
    } catch (error) {
      console.error("Progress evaluation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const addField = (field: keyof Pick<StudentData, 'strengths' | 'weaknesses' | 'commonMistakes'>) => {
    setStudentData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateField = (field: keyof Pick<StudentData, 'strengths' | 'weaknesses' | 'commonMistakes'>, index: number, value: string) => {
    const newList = [...studentData[field]];
    newList[index] = value;
    setStudentData(prev => ({
      ...prev,
      [field]: newList
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">EduPulse <span className="text-indigo-600 font-medium">Intelligence</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">Documentation</button>
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-1">
            <NavButton 
              active={activeTab === 'input'} 
              onClick={() => setActiveTab('input')} 
              icon={<ClipboardCheck className="w-4 h-4" />} 
              label="Student Input" 
            />
            <NavButton 
              active={activeTab === 'diagnosis'} 
              disabled={!diagnosis}
              onClick={() => setActiveTab('diagnosis')} 
              icon={<LineChart className="w-4 h-4" />} 
              label="AI Diagnosis" 
            />
            <NavButton 
              active={activeTab === 'plan'} 
              disabled={!diagnosis}
              onClick={() => setActiveTab('plan')} 
              icon={<Target className="w-4 h-4" />} 
              label="Improvement Plan" 
            />
            <NavButton 
              active={activeTab === 'practice'} 
              disabled={!diagnosis}
              onClick={() => setActiveTab('practice')} 
              icon={<BookOpen className="w-4 h-4" />} 
              label="Practice Questions" 
            />
            <NavButton 
              active={activeTab === 'teacher'} 
              disabled={!diagnosis}
              onClick={() => setActiveTab('teacher')} 
              icon={<Users className="w-4 h-4" />} 
              label="Teacher Summary" 
            />
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold uppercase text-gray-400 tracking-widest">Analytics</div>
            <NavButton 
              active={activeTab === 'progress'} 
              disabled={!diagnosis}
              onClick={() => setActiveTab('progress')} 
              icon={<TrendingUp className="w-4 h-4" />} 
              label="Progress Tracking" 
            />
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeTab === 'input' && (
                <motion.div 
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      Exam Performance Data
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Subject</label>
                        <input 
                          type="text" 
                          value={studentData.subject}
                          onChange={e => setStudentData({...studentData, subject: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Topic</label>
                        <input 
                          type="text" 
                          value={studentData.topic}
                          onChange={e => setStudentData({...studentData, topic: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Score (%)</label>
                        <input 
                          type="number" 
                          value={studentData.score}
                          onChange={e => setStudentData({...studentData, score: parseInt(e.target.value)})}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <ListInput 
                        label="Strengths" 
                        items={studentData.strengths} 
                        onAdd={() => addField('strengths')} 
                        onUpdate={(i, v) => updateField('strengths', i, v)} 
                      />
                      <ListInput 
                        label="Weaknesses" 
                        items={studentData.weaknesses} 
                        onAdd={() => addField('weaknesses')} 
                        onUpdate={(i, v) => updateField('weaknesses', i, v)} 
                      />
                      <ListInput 
                        label="Common Mistakes" 
                        items={studentData.commonMistakes} 
                        onAdd={() => addField('commonMistakes')} 
                        onUpdate={(i, v) => updateField('commonMistakes', i, v)} 
                      />
                    </div>
                  </section>

                  <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      Student Profile
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Learning Style</label>
                        <select 
                          value={profile.learningStyle}
                          onChange={e => setProfile({...profile, learningStyle: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option>Visual learning</option>
                          <option>Auditory learning</option>
                          <option>Kinesthetic learning</option>
                          <option>Reading/Writing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">English Level</label>
                        <select 
                          value={profile.englishComprehension}
                          onChange={e => setProfile({...profile, englishComprehension: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option>Native</option>
                          <option>Strong</option>
                          <option>Moderate</option>
                          <option>Weak</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Attention Span</label>
                        <select 
                          value={profile.attentionSpan}
                          onChange={e => setProfile({...profile, attentionSpan: e.target.value})}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option>Long</option>
                          <option>Moderate</option>
                          <option>Short</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  <div className="flex justify-end gap-4">
                    {diagnosis && (
                      <button 
                        onClick={handleEvaluateProgress}
                        disabled={loading}
                        className="bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all transform active:scale-95"
                      >
                        {loading ? 'Evaluating...' : 'Evaluate Progress'}
                      </button>
                    )}
                    <button 
                      onClick={handleDiagnose}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all transform active:scale-95"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing Performance...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Generate Intelligence Report
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'diagnosis' && diagnosis && (
                <motion.div 
                  key="diagnosis"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl">
                    <h2 className="text-3xl font-bold mb-2">Performance Diagnosis</h2>
                    <p className="text-indigo-100 leading-relaxed text-lg">
                      {diagnosis.diagnosis}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Root Causes of Mistakes
                      </h3>
                      <ul className="space-y-3">
                        {diagnosis.root_causes.map((cause, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-700">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Current Strengths
                      </h3>
                      <ul className="space-y-3">
                        {studentData.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-3 text-gray-700">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'plan' && diagnosis && (
                <motion.div 
                  key="plan"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Target className="text-indigo-600 w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">2-Week Improvement Plan</h2>
                      <p className="text-gray-500">Structured roadmap to bridge knowledge gaps</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PlanCard week="Week 1: Foundation & Concepts" steps={diagnosis.improvement_plan.week_1} />
                    <PlanCard week="Week 2: Application & Mastery" steps={diagnosis.improvement_plan.week_2} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'practice' && diagnosis && (
                <motion.div 
                  key="practice"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold mb-6">Targeted Practice Questions</h2>
                  <div className="space-y-4">
                    {diagnosis.practice_questions.map((q, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:border-indigo-300 transition-colors">
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Question {i + 1}</span>
                            <span className="text-xs font-medium text-gray-400">{q.skill_targeted}</span>
                          </div>
                          <p className="text-lg font-medium text-gray-800 mb-6">{q.question}</p>
                          <div className="bg-gray-50 -mx-6 -mb-6 p-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600 italic flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="font-semibold text-gray-700">Why this helps:</span> {q.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'teacher' && diagnosis && (
                <motion.div 
                  key="teacher"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-xl">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      <Users className="w-6 h-6 text-indigo-400" />
                      Teacher Summary & Strategy
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">Key Concerns</h3>
                        <ul className="space-y-4">
                          {diagnosis.teacher_summary.key_concerns.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="mt-1 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-indigo-400">{i + 1}</span>
                              </div>
                              <span className="text-gray-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">Actionable Teaching Strategies</h3>
                        <ul className="space-y-4">
                          {diagnosis.teacher_summary.actionable_strategies.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="mt-1 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                              </div>
                              <span className="text-gray-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'progress' && progress && (
                <motion.div 
                  key="progress"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <TrendingUp className="text-indigo-600 w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Progress Analytics</h2>
                      <p className="text-gray-500">Evaluating growth and adjusting trajectory</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        progress.status === 'improved' ? 'bg-green-100 text-green-700' : 
                        progress.status === 'stagnant' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {progress.status}
                      </div>
                      <div className="h-px flex-1 bg-gray-100" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Performance Comparison
                          </h3>
                          <p className="text-gray-700 leading-relaxed">
                            {progress.comparison}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" />
                            Adjusted Learning Plan
                          </h3>
                          <ul className="space-y-4">
                            {progress.adjusted_plan.map((step, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <div className="mt-1 w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-bold text-indigo-600">{i + 1}</span>
                                </div>
                                <span className="text-gray-700 text-sm">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
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

function NavButton({ active, disabled, onClick, icon, label }: { active: boolean, disabled?: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
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

function ListInput({ label, items, onAdd, onUpdate }: { label: string, items: string[], onAdd: () => void, onUpdate: (i: number, v: string) => void }) {
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
            onChange={e => onUpdate(i, e.target.value)}
            placeholder={`Add ${label.toLowerCase()}...`}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ week, steps }: { week: string, steps: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">{week}</h3>
      <div className="space-y-6 relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
        {steps.map((step, i) => (
          <div key={i} className="relative pl-10">
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center z-10">
              <span className="text-[10px] font-bold text-indigo-600">{i + 1}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
