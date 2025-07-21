import { checkRateLimit, getRemainingTime } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear rate limit cache before each test
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('allows requests under the limit', () => {
    const identifier = 'test-user-1';
    
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(identifier, 5, 3600000)).toBe(true);
    }
  });

  test('blocks requests over the limit', () => {
    const identifier = 'test-user-2';
    
    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(identifier, 5, 3600000)).toBe(true);
    }
    
    // Next attempt should be blocked
    expect(checkRateLimit(identifier, 5, 3600000)).toBe(false);
  });

  test('resets after time window expires', () => {
    const identifier = 'test-user-3';
    const windowMs = 3600000; // 1 hour
    
    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      checkRateLimit(identifier, 5, windowMs);
    }
    
    // Should be blocked
    expect(checkRateLimit(identifier, 5, windowMs)).toBe(false);
    
    // Fast forward time past the window
    jest.advanceTimersByTime(windowMs + 1000);
    
    // Should be allowed again
    expect(checkRateLimit(identifier, 5, windowMs)).toBe(true);
  });

  test('returns correct remaining time', () => {
    const identifier = 'test-user-4';
    const windowMs = 3600000; // 1 hour
    
    // Use up all attempts
    for (let i = 0; i < 5; i++) {
      checkRateLimit(identifier, 5, windowMs);
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