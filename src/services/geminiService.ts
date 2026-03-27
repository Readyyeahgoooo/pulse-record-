import { GoogleGenAI, Type } from "@google/genai";
import { StudentData, StudentProfile, AIDiagnosisResponse, ProgressEvaluation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function diagnoseStudentPerformance(
  data: StudentData,
  profile: StudentProfile
): Promise<AIDiagnosisResponse> {
  const prompt = `You are given a student's recent mock exam results and mistakes.

Subject: ${data.subject}
Topic: ${data.topic}

Student Data:
- Score: ${data.score}%
- Strengths: ${data.strengths.join(", ")}
- Weaknesses: ${data.weaknesses.join(", ")}
- Common mistakes: ${data.commonMistakes.join(", ")}

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

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diagnosis: { type: Type.STRING },
          root_causes: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvement_plan: {
            type: Type.OBJECT,
            properties: {
              week_1: { type: Type.ARRAY, items: { type: Type.STRING } },
              week_2: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["week_1", "week_2"],
          },
          practice_questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                skill_targeted: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ["question", "skill_targeted", "reason"],
            },
          },
          teacher_summary: {
            type: Type.OBJECT,
            properties: {
              key_concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionable_strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["key_concerns", "actionable_strategies"],
          },
        },
        required: ["diagnosis", "root_causes", "improvement_plan", "practice_questions", "teacher_summary"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function evaluateProgress(
  previousWeaknesses: string[],
  newResults: StudentData
): Promise<ProgressEvaluation> {
  const prompt = `Based on previous performance and improvement plan, evaluate whether the student has improved.

Previous weaknesses: ${previousWeaknesses.join(", ")}
New results:
- Subject: ${newResults.subject}
- Topic: ${newResults.topic}
- Score: ${newResults.score}%
- Current Strengths: ${newResults.strengths.join(", ")}
- Current Weaknesses: ${newResults.weaknesses.join(", ")}

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

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          comparison: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["improved", "stagnant", "declined"] },
          adjusted_plan: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["comparison", "status", "adjusted_plan"],
      },
    },
  });

  return JSON.parse(response.text);
}
