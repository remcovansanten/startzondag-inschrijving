import { validateDutchPhoneNumber, formatPhoneNumber, sanitizePhoneNumber } from '@/lib/validation';

describe('Phone Number Validation', () => {
  describe('validateDutchPhoneNumber', () => {
    test('validates Dutch mobile numbers', () => {
      expect(validateDutchPhoneNumber('0612345678')).toBe(true);
      expect(validateDutchPhoneNumber('06-12345678')).toBe(true);
      expect(validateDutchPhoneNumber('06 12 34 56 78')).toBe(true);
      expect(validateDutchPhoneNumber('+31612345678')).toBe(true);
      expect(validateDutchPhoneNumber('+31 6 12345678')).toBe(true);
    });

    test('validates Dutch landline numbers', () => {
      expect(validateDutchPhoneNumber('0201234567')).toBe(true);
      expect(validateDutchPhoneNumber('020-1234567')).toBe(true);
      expect(validateDutchPhoneNumber('0123456789')).toBe(true);
      expect(validateDutchPhoneNumber('+31201234567')).toBe(true);
    });

    test('rejects invalid numbers', () => {
      expect(validateDutchPhoneNumber('123')).toBe(false);
      expect(validateDutchPhoneNumber('0912345678')).toBe(false); // Invalid area code (09x doesn't exist)
      expect(validateDutchPhoneNumber('061234567')).toBe(false); // Too short
      expect(validateDutchPhoneNumber('06123456789')).toBe(false); // Too long
      expect(validateDutchPhoneNumber('+32612345678')).toBe(false); // Wrong country
    });
  });

  describe('formatPhoneNumber', () => {
    test('formats mobile numbers correctly', () => {
      expect(formatPhoneNumber('0612345678')).toBe('06-1234 5678');
      expect(formatPhoneNumber('+31612345678')).toBe('+31 6 1234 5678');
    });

    test('formats landline numbers correctly', () => {
      expect(formatPhoneNumber('0201234567')).toBe('020-123 4567');
      expect(formatPhoneNumber('+31201234567')).toBe('+31 20 123 4567');
    });
  });

  describe('sanitizePhoneNumber', () => {
    test('sanitizes phone numbers for storage', () => {
      expect(sanitizePhoneNumber('06-12 34 56 78')).toBe('0612345678');
      expect(sanitizePhoneNumber('+31 6 12345678')).toBe('0612345678');
      expect(sanitizePhoneNumber('020-123 4567')).toBe('0201234567');
    });
  });
});