import type { StudentData } from '../src/types';
import { generateProgressEvaluation } from './_lib/openrouter';
import {
  applySecurityHeaders,
  attachRateLimitHeaders,
  getSafeErrorMessage,
  isAllowedOrigin,
  rateLimit,
} from './_lib/security';

type RequestLike = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
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
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!isAllowedOrigin(req)) {
    res.status(403).json({ error: 'Origin not allowed.' });
    return;
  }

  const limit = rateLimit(req, 'progress');
  attachRateLimitHeaders(res, limit);
  if (!limit.allowed) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }

  const { previousWeaknesses, newResults } = req.body || {};
  if (!isValidWeaknessList(previousWeaknesses) || !isValidStudentData(newResults)) {
    res.status(400).json({ error: 'Invalid previousWeaknesses or newResults.' });
    return;
  }

  try {
    const evaluation = await generateProgressEvaluation(previousWeaknesses, newResults);
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Progress API failed:', error);
    res.status(500).json({ error: getSafeErrorMessage(error) });
  }
}

function isValidWeaknessList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isValidStudentData(value: unknown): value is StudentData {
  if (!value || typeof value !== 'object') return false;
  const data = value as StudentData;
  return (
    typeof data.subject === 'string' &&
    typeof data.topic === 'string' &&
    typeof data.score === 'number' &&
    Array.isArray(data.strengths) &&
    Array.isArray(data.weaknesses) &&
    Array.isArray(data.commonMistakes)
  );
}
