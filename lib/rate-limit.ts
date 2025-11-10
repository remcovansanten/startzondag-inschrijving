import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only use Redis in production, fallback to in-memory for development
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

// IP-based rate limiter: 10 requests per hour
export const ipRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "ratelimit:ip",
    })
  : null;

// Email-based rate limiter: 5 requests per hour
export const emailRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      analytics: true,
      prefix: "ratelimit:email",
    })
  : null;

// Fallback in-memory rate limiter for development
const memoryAttempts = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 3600000
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  // Use Redis in production
  if (ipRateLimiter && identifier.startsWith('ip:')) {
    const result = await ipRateLimiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset
    };
  }

  if (emailRateLimiter && identifier.startsWith('email:')) {
    const result = await emailRateLimiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset
    };
  }

  // Fallback to in-memory for development
  const now = Date.now();
  const userAttempts = memoryAttempts.get(identifier);

  // Clean up old entries periodically
  if (memoryAttempts.size > 1000) {
    for (const [key, value] of memoryAttempts.entries()) {
      if (value.resetTime < now) {
        memoryAttempts.delete(key);
      }
    }
  }

  if (!userAttempts || userAttempts.resetTime < now) {
    memoryAttempts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true };
  }

  if (userAttempts.count >= maxAttempts) {
    return { success: false, reset: userAttempts.resetTime };
  }

  userAttempts.count++;
  return { success: true };
}

export function getRemainingTime(identifier: string): number {
  const userAttempts = memoryAttempts.get(identifier);
  if (!userAttempts) return 0;

  const remaining = userAttempts.resetTime - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
}
