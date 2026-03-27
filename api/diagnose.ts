import type { StudentData, StudentProfile } from '../src/types';
import { generateDiagnosis } from './_lib/gemini';

type RequestLike = {
  method?: string;
  body?: {
    studentData?: StudentData;
    profile?: StudentProfile;
  };
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const { studentData, profile } = req.body || {};
  if (!studentData || !profile) {
    res.status(400).json({ error: 'Missing studentData or profile.' });
    return;
  }

  try {
    const diagnosis = await generateDiagnosis(studentData, profile);
    res.status(200).json(diagnosis);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Diagnosis request failed.';
    res.status(500).json({ error: message });
  }
}
