// Simple in-memory rate limiter
const attempts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const userAttempts = attempts.get(identifier);

  // Clean up old entries
  if (attempts.size > 1000) {
    for (const [key, value] of attempts.entries()) {
      if (value.resetTime < now) {
        attempts.delete(key);
      }
    }
  }

  if (!userAttempts || userAttempts.resetTime < now) {
    // First attempt or window expired
    attempts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (userAttempts.count >= maxAttempts) {
    return false;
  }

  userAttempts.count++;
  return true;
}

export function getRemainingTime(identifier: string): number {
  const userAttempts = attempts.get(identifier);
  if (!userAttempts) return 0;
  
  const remaining = userAttempts.resetTime - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 60000) : 0; // Return minutes
}