import type { StudentData } from '../src/types';
import { generateProgressEvaluation } from './_lib/gemini';

type RequestLike = {
  method?: string;
  body?: {
    previousWeaknesses?: string[];
    newResults?: StudentData;
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

  const { previousWeaknesses, newResults } = req.body || {};
  if (!previousWeaknesses || !newResults) {
    res.status(400).json({ error: 'Missing previousWeaknesses or newResults.' });
    return;
  }

  try {
    const evaluation = await generateProgressEvaluation(previousWeaknesses, newResults);
    res.status(200).json(evaluation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Progress request failed.';
    res.status(500).json({ error: message });
  }
}
