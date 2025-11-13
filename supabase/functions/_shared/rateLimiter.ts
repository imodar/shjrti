/**
 * Simple in-memory rate limiter for edge functions
 * Note: This is per-instance, not global. For production, consider using Redis or Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  backoffMultiplier?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  attemptsRemaining?: number;
}

/**
 * Check if a request is allowed under rate limiting
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    // New entry or expired window
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
      lastAttempt: now,
    });
    return {
      allowed: true,
      attemptsRemaining: config.maxAttempts - 1,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxAttempts) {
    // Apply exponential backoff if configured
    const backoff = config.backoffMultiplier || 1;
    const additionalDelay = (entry.count - config.maxAttempts) * backoff * config.windowMs;
    const retryAfter = Math.max(0, entry.resetTime + additionalDelay - now);

    return {
      allowed: false,
      retryAfter: Math.ceil(retryAfter / 1000), // Convert to seconds
      attemptsRemaining: 0,
    };
  }

  // Increment count
  entry.count++;
  entry.lastAttempt = now;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    attemptsRemaining: config.maxAttempts - entry.count,
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Get client IP from request (considering various proxy headers)
 */
export function getClientIP(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return 'unknown';
}
