import type { AIDiagnosisResponse, ProgressEvaluation, StudentData, StudentProfile } from '../../src/types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_INSTRUCTION = `You are an AI educational diagnostic engine designed for secondary school students.

Your job is NOT to simply answer questions.

Your job is to:
1. Analyze student performance data
2. Identify knowledge gaps and misconceptions
3. Explain root causes of mistakes
4. Generate structured improvement plans
5. Generate targeted practice questions

You must always:
- Think like a teacher, not a chatbot
- Focus on learning progression
- Avoid generic feedback
- Provide structured outputs
- Use clear educational reasoning

Output MUST follow the required JSON format.`;

export async function generateDiagnosis(
  data: StudentData,
  profile: StudentProfile,
): Promise<AIDiagnosisResponse> {
  const prompt = `You are given a student's recent mock exam results and mistakes.

Subject: ${data.subject}
Topic: ${data.topic}

Student Data:
- Score: ${data.score}%
- Strengths: ${data.strengths.join(', ')}
- Weaknesses: ${data.weaknesses.join(', ')}
- Common mistakes: ${data.commonMistakes.join(', ')}

Student profile:
- Learning style: ${profile.learningStyle}
- English comprehension: ${profile.englishComprehension}
- Attention span: ${profile.attentionSpan}

Task:
1. Diagnose the student's weaknesses in depth
2. Identify root causes (conceptual vs careless vs language)
3. Generate a 2-week improvement plan
4. Generate 5 targeted practice questions (in increasing difficulty)
5. For each question, explain:
   - what skill it targets
   - why it helps improvement
6. Generate a teacher summary:
   - 3 bullet key concerns
   - 3 actionable teaching strategies

Output in JSON format:
{
  "diagnosis": "Detailed diagnosis string",
  "root_causes": ["Cause 1", "Cause 2"],
  "improvement_plan": {
    "week_1": ["Step 1", "Step 2"],
    "week_2": ["Step 3", "Step 4"]
  },
  "practice_questions": [
    {
      "question": "Question text",
      "skill_targeted": "Skill name",
      "reason": "Why it helps"
    }
  ],
  "teacher_summary": {
    "key_concerns": ["Concern 1", "Concern 2", "Concern 3"],
    "actionable_strategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
  }
}`;

  const content = await requestOpenRouter(prompt, diagnosisSchema);
  return parseJsonResponse<AIDiagnosisResponse>(content);
}

export async function generateProgressEvaluation(
  previousWeaknesses: string[],
  newResults: StudentData,
): Promise<ProgressEvaluation> {
  const prompt = `Based on previous performance and improvement plan, evaluate whether the student has improved.

Previous weaknesses: ${previousWeaknesses.join(', ')}
New results:
- Subject: ${newResults.subject}
- Topic: ${newResults.topic}
- Score: ${newResults.score}%
- Current Strengths: ${newResults.strengths.join(', ')}
- Current Weaknesses: ${newResults.weaknesses.join(', ')}

Task:
1. Compare performance
2. Identify improvement / stagnation
3. Adjust learning plan

Output in JSON format:
{
  "comparison": "Detailed comparison string",
  "status": "improved" | "stagnant" | "declined",
  "adjusted_plan": ["Step 1", "Step 2"]
}`;

  const content = await requestOpenRouter(prompt, progressSchema);
  return parseJsonResponse<ProgressEvaluation>(content);
}

async function requestOpenRouter(prompt: string, schema: object): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY on server.');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openrouter/hunter-alpha',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'edu_pulse_response',
          strict: true,
          schema,
        },
      },
    }),
  });

  const payload = (await response.json()) as OpenRouterResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || 'OpenRouter request failed.');
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter returned an empty response.');
  }

  return content;
}

function buildHeaders(apiKey: string): HeadersInit {
  const headers: HeadersInit = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const referer = getRefererUrl();
  if (referer) {
    headers['HTTP-Referer'] = referer;
  }

  headers['X-Title'] = process.env.SCHOOL_NAME || 'EduPulse Safe AI Classroom';
  return headers;
}

function getRefererUrl(): string | undefined {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return undefined;
}

function parseJsonResponse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('AI response was not valid JSON.');
  }
}

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const diagnosisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    diagnosis: { type: 'string' },
    root_causes: {
      type: 'array',
      items: { type: 'string' },
    },
    improvement_plan: {
      type: 'object',
      additionalProperties: false,
      properties: {
        week_1: {
          type: 'array',
          items: { type: 'string' },
        },
        week_2: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['week_1', 'week_2'],
    },
    practice_questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string' },
          skill_targeted: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['question', 'skill_targeted', 'reason'],
      },
    },
    teacher_summary: {
      type: 'object',
      additionalProperties: false,
      properties: {
        key_concerns: {
          type: 'array',
          items: { type: 'string' },
        },
        actionable_strategies: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['key_concerns', 'actionable_strategies'],
    },
  },
  required: ['diagnosis', 'root_causes', 'improvement_plan', 'practice_questions', 'teacher_summary'],
};

const progressSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    comparison: { type: 'string' },
    status: {
      type: 'string',
      enum: ['improved', 'stagnant', 'declined'],
    },
    adjusted_plan: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['comparison', 'status', 'adjusted_plan'],
};
