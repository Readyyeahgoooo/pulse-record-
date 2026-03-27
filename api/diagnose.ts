import type { StudentData, StudentProfile } from '../src/types';
import { generateDiagnosis } from './_lib/openrouter';
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

  const limit = rateLimit(req, 'diagnose');
  attachRateLimitHeaders(res, limit);
  if (!limit.allowed) {
    res.status(429).json({ error: 'Too many requests. Please slow down.' });
    return;
  }

  const { studentData, profile } = req.body || {};
  if (!isValidStudentData(studentData) || !isValidStudentProfile(profile)) {
    res.status(400).json({ error: 'Invalid studentData or profile.' });
    return;
  }

  try {
    const diagnosis = await generateDiagnosis(studentData, profile);
    res.status(200).json(diagnosis);
  } catch (error) {
    console.error('Diagnose API failed:', error);
    res.status(500).json({ error: getSafeErrorMessage(error) });
  }
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

function isValidStudentProfile(value: unknown): value is StudentProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as StudentProfile;
  return (
    typeof profile.learningStyle === 'string' &&
    typeof profile.englishComprehension === 'string' &&
    typeof profile.attentionSpan === 'string'
  );
}
