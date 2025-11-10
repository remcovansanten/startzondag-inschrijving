// Mock @upstash/ratelimit before importing
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn(),
}));

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn(),
  },
}));

import { checkRateLimit, getRemainingTime } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit cache before each test
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('allows requests under the limit', async () => {
    const identifier = 'test-user-1';

    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(identifier, 5, 3600000);
      expect(result.success).toBe(true);
    }
  });

  test('blocks requests over the limit', async () => {
    const identifier = 'test-user-2';

    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(identifier, 5, 3600000);
    }

    // Next attempt should be blocked
    const result = await checkRateLimit(identifier, 5, 3600000);
    expect(result.success).toBe(false);
  });

  test('resets after time window expires', async () => {
    const identifier = 'test-user-3';
    const windowMs = 3600000; // 1 hour

    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(identifier, 5, windowMs);
    }

    // Should be blocked
    const blockedResult = await checkRateLimit(identifier, 5, windowMs);
    expect(blockedResult.success).toBe(false);

    // Fast forward time past the window
    jest.advanceTimersByTime(windowMs + 1000);

    // Should be allowed again
    const allowedResult = await checkRateLimit(identifier, 5, windowMs);
    expect(allowedResult.success).toBe(true);
  });

  test('returns correct remaining time', async () => {
    const identifier = 'test-user-4';
    const windowMs = 3600000; // 1 hour

    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(identifier, 5, windowMs);
    }

    // Should return approximately 60 minutes
    const remaining = getRemainingTime(identifier);
    expect(remaining).toBe(60);

    // Fast forward 30 minutes
    jest.advanceTimersByTime(1800000);

    // Should return approximately 30 minutes
    const remainingAfter = getRemainingTime(identifier);
    expect(remainingAfter).toBe(30);
  });
});