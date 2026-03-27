const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 12;

type RateEntry = {
  count: number;
  resetAt: number;
};

type RequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
};

type ResponseLike = {
  setHeader: (name: string, value: string | string[]) => void;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function applySecurityHeaders(res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
}

export function isAllowedOrigin(req: RequestLike): boolean {
  const origin = getHeader(req, 'origin') || getOriginFromReferer(getHeader(req, 'referer'));
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.has(origin);
}

export function rateLimit(req: RequestLike, bucket: string): RateLimitResult {
  const store = getRateLimitStore();
  const key = `${bucket}:${getClientIdentifier(req)}`;
  const now = Date.now();
  const maxRequests = Number(process.env.RATE_LIMIT_MAX || DEFAULT_MAX_REQUESTS);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_WINDOW_MS);
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(maxRequests - 1, 0),
      resetAt,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: existing.count <= maxRequests,
    remaining: Math.max(maxRequests - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

export function attachRateLimitHeaders(res: ResponseLike, result: RateLimitResult) {
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
}

export function getSafeErrorMessage(error: unknown): string {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  if (isDevelopment && error instanceof Error) {
    return error.message;
  }
  return 'Request failed on the server.';
}

function getAllowedOrigins(): Set<string> {
  const configured = new Set<string>();
  if (process.env.APP_URL) {
    configured.add(stripTrailingSlash(process.env.APP_URL));
  }

  const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => stripTrailingSlash(value.trim()))
    .filter(Boolean);

  extraOrigins.forEach((origin) => configured.add(origin));

  if (process.env.NODE_ENV !== 'production') {
    configured.add('http://localhost:3000');
    configured.add('http://127.0.0.1:3000');
    configured.add('http://localhost:5173');
    configured.add('http://127.0.0.1:5173');
  }

  return configured;
}

function getHeader(req: RequestLike, name: string): string | undefined {
  const value = req.headers?.[name] || req.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function getOriginFromReferer(referer?: string): string | undefined {
  if (!referer) return undefined;
  try {
    const parsed = new URL(referer);
    return stripTrailingSlash(parsed.origin);
  } catch {
    return undefined;
  }
}

function getClientIdentifier(req: RequestLike): string {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = getHeader(req, 'x-real-ip');
  if (realIp) {
    return realIp;
  }

  return req.socket?.remoteAddress || 'unknown';
}

function getRateLimitStore(): Map<string, RateEntry> {
  const globalStore = globalThis as typeof globalThis & {
    __eduPulseRateLimitStore__?: Map<string, RateEntry>;
  };

  if (!globalStore.__eduPulseRateLimitStore__) {
    globalStore.__eduPulseRateLimitStore__ = new Map<string, RateEntry>();
  }

  return globalStore.__eduPulseRateLimitStore__;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
