import type { AIDiagnosisResponse, ProgressEvaluation, StudentData, StudentProfile } from '../types';

export function buildDemoDiagnosis(data: StudentData, profile: StudentProfile): AIDiagnosisResponse {
  const primaryWeakness = data.weaknesses[0] || 'concept application';
  const secondaryWeakness = data.weaknesses[1] || 'multi-step reasoning';
  const languageFactor =
    profile.englishComprehension === 'Weak' || profile.englishComprehension === 'Moderate'
      ? 'Language load is likely slowing comprehension of problem statements.'
      : 'Language comprehension appears less likely to be the core blocker.';

  return {
    diagnosis: `${data.studentIdentifier || 'This student'} shows partial mastery in ${data.topic} but is still losing marks when tasks require translation, sequencing, or sustained reasoning. Performance suggests the learner can complete familiar procedures yet becomes unstable when questions demand interpretation or multi-step setup.`,
    root_causes: [
      `Knowledge gap around ${primaryWeakness}.`,
      `Inconsistent accuracy when handling ${secondaryWeakness}.`,
      languageFactor,
    ],
    improvement_plan: {
      week_1: [
        `Re-teach ${primaryWeakness} using worked examples and one-step checks.`,
        `Use short daily drills to convert verbal statements into mathematical expressions.`,
        `Finish each practice set with teacher review on the final line of working.`,
      ],
      week_2: [
        `Move to mixed ${data.topic} questions with explicit planning before solving.`,
        `Introduce one timed practice set focused on reducing careless final-step errors.`,
        `Review common mistakes and create a personal checklist before submission.`,
      ],
    },
    practice_questions: [
      {
        question: `Solve a direct ${data.topic.toLowerCase()} question that requires one algebraic step and show the working clearly.`,
        skill_targeted: 'Foundational procedure',
        reason: 'Builds confidence and checks whether the student can execute the base method accurately.',
      },
      {
        question: `Translate a short word statement into an equation, then solve it.`,
        skill_targeted: 'Sentence-to-equation translation',
        reason: 'Targets the common breakdown between reading and mathematical setup.',
      },
      {
        question: `Complete a two-step problem where the unknown must be isolated after simplification.`,
        skill_targeted: 'Multi-step reasoning',
        reason: 'Strengthens sequencing and reduces skipped steps.',
      },
      {
        question: `Compare two possible equation setups for the same scenario and explain which one is correct.`,
        skill_targeted: 'Error analysis',
        reason: 'Helps the student detect wrong setup patterns before solving.',
      },
      {
        question: `Solve a realistic word problem on ${data.topic.toLowerCase()} and explain the meaning of the answer in context.`,
        skill_targeted: 'Application and interpretation',
        reason: 'Bridges procedural skill with exam-style application.',
      },
    ],
    teacher_summary: {
      key_concerns: [
        `Student is not yet secure in ${primaryWeakness}.`,
        'Accuracy drops when tasks become verbal or multi-step.',
        'Final-step checking habits are weak and lead to preventable mark loss.',
      ],
      actionable_strategies: [
        'Model question decomposition before solving.',
        'Use short intervention tasks with immediate feedback.',
        'Require a written self-check routine before answer submission.',
      ],
    },
  };
}

export function buildDemoProgress(previousWeaknesses: string[], newResults: StudentData): ProgressEvaluation {
  const improvedScore = newResults.score >= 60;
  const status: ProgressEvaluation['status'] = improvedScore ? 'improved' : 'stagnant';

  return {
    comparison: `Compared with the earlier weakness profile (${previousWeaknesses.join(', ') || 'baseline skills'}), the student now shows ${improvedScore ? 'more stable' : 'still inconsistent'} performance in ${newResults.topic}. The latest score and strengths suggest some procedural growth, but targeted reinforcement is still needed before performance can be considered secure.`,
    status,
    adjusted_plan: improvedScore
      ? [
          'Increase mixed-question difficulty while keeping a short error-check routine.',
          'Shift one practice block each week toward exam-style timed application.',
          'Track whether gains remain stable across different topic variations.',
        ]
      : [
          'Return to teacher-guided worked examples for the weakest concept.',
          'Reduce task length and focus on accuracy before speed.',
          'Use targeted correction practice on the top two recurring error types.',
        ],
  };
}
