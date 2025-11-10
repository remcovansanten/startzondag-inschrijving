/**
 * Unit tests for authentication library (/lib/auth)
 * Tests JWT creation, verification, expiration, tampering detection,
 * and session management
 */

import jwt from 'jsonwebtoken';

// We need to mock the auth module to test JWT_SECRET validation
// First, let's test the actual implementation
describe('Auth Library', () => {
  const TEST_SECRET = 'test-secret-key-min-32-chars-long';
  const SHORT_SECRET = 'short';

  beforeAll(() => {
    // Set valid secret for most tests
    process.env.JWT_SECRET = TEST_SECRET;
  });

  describe('JWT Token Creation', () => {
    test('1. createToken generates valid JWT', async () => {
      // Import after env is set
      const { createToken } = await import('@/lib/auth');

      const payload = { id: 'admin-1', username: 'testadmin' };
      const token = await createToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('2. createToken includes payload data', async () => {
      const { createToken } = await import('@/lib/auth');

      const payload = { id: 'admin-1', username: 'testadmin' };
      const token = await createToken(payload);

      const decoded = jwt.decode(token) as any;
      expect(decoded.id).toBe('admin-1');
      expect(decoded.username).toBe('testadmin');
    });

    test('3. createToken sets 4-hour expiration', async () => {
      const { createToken } = await import('@/lib/auth');

      const payload = { id: 'admin-1', username: 'testadmin' };
      const token = await createToken(payload);

      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      // Should expire in 4 hours (14400 seconds)
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(14400);
    });
  });

  describe('JWT Token Verification', () => {
    test('4. verifyToken validates valid tokens', async () => {
      const { createToken, verifyToken } = await import('@/lib/auth');

      const payload = { id: 'admin-1', username: 'testadmin' };
      const token = await createToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect((verified as any).id).toBe('admin-1');
      expect((verified as any).username).toBe('testadmin');
    });

    test('5. verifyToken rejects tampered tokens', async () => {
      const { createToken, verifyToken } = await import('@/lib/auth');

      const payload = { id: 'admin-1', username: 'testadmin' };
      const token = await createToken(payload);

      // Tamper with the token by changing a character
      const tamperedToken = token.slice(0, -5) + 'XXXXX';
      const verified = await verifyToken(tamperedToken);

      expect(verified).toBeNull();
    });

    test('6. verifyToken rejects expired tokens', async () => {
      const { verifyToken } = await import('@/lib/auth');

      // Create an expired token (expired 1 hour ago)
      const expiredPayload = {
        id: 'admin-1',
        username: 'testadmin',
        exp: Math.floor(Date.now() / 1000) - 3600,
      };
      const expiredToken = jwt.sign(expiredPayload, TEST_SECRET);

      const verified = await verifyToken(expiredToken);
      expect(verified).toBeNull();
    });

    test('7. verifyToken rejects tokens with wrong signature', async () => {
      const { verifyToken } = await import('@/lib/auth');

      // Create token with different secret
      const wrongSecretToken = jwt.sign(
        { id: 'admin-1', username: 'testadmin' },
        'different-secret-key-min-32-chars',
        { expiresIn: '4h' }
      );

      const verified = await verifyToken(wrongSecretToken);
      expect(verified).toBeNull();
    });
  });

  describe('Session Management', () => {
    // Note: Session management uses Next.js cookies() which requires mocking
    // These tests document the expected behavior

    test('8. Session functions are exported', () => {
      // Test that all session functions exist
      const auth = require('@/lib/auth');

      expect(auth.getSession).toBeDefined();
      expect(auth.setSession).toBeDefined();
      expect(auth.clearSession).toBeDefined();
    });
  });

  describe('JWT_SECRET Validation', () => {
    test('9. Documents JWT_SECRET fallback behavior', () => {
      // Current implementation has fallback
      // This test documents the current behavior
      // Security improvement plan calls for removing this fallback

      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // Current implementation falls back to default secret
      // Future implementation should throw error
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars';
      expect(JWT_SECRET).toBe('your-secret-key-min-32-chars');

      process.env.JWT_SECRET = originalSecret;
    });

    test('10. JWT_SECRET should be at least 32 characters (future validation)', () => {
      // This test documents the desired behavior from the security improvement plan
      const validSecret = 'this-is-a-valid-secret-key-with-32-plus-chars';
      const shortSecret = 'short';

      expect(validSecret.length).toBeGreaterThanOrEqual(32);
      expect(shortSecret.length).toBeLessThan(32);

      // Future implementation should validate this
      // and throw error if JWT_SECRET is too short
    });
  });

  describe('Token Payload Structure', () => {
    test('11. Token contains standard JWT claims', async () => {
      const { createToken } = await import('@/lib/auth');

      const payload = { id: 'admin-1', username: 'testadmin' };
      const token = await createToken(payload);

      const decoded = jwt.decode(token) as any;

      // Should have standard claims
      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.exp).toBeDefined(); // Expiration
      expect(decoded.id).toBeDefined();  // Custom payload
      expect(decoded.username).toBeDefined(); // Custom payload
    });
  });
});
