import {
  generateLoginToken,
  hashLoginToken,
  loginTokenExpiry,
  MAGIC_LINK_TTL_MINUTES,
} from '@/lib/magic-link';

describe('magic-link', () => {
  it('genereert een 256-bit hex-token waarvan de hash klopt', () => {
    const { token, tokenHash } = generateLoginToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenHash).toBe(hashLoginToken(token));
    expect(tokenHash).toHaveLength(64);
  });

  it('genereert unieke tokens', () => {
    expect(generateLoginToken().token).not.toBe(generateLoginToken().token);
  });

  it('vervaltijd ligt TTL minuten in de toekomst', () => {
    const now = new Date('2026-06-29T10:00:00Z');
    expect(loginTokenExpiry(now).getTime()).toBe(now.getTime() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
  });
});
