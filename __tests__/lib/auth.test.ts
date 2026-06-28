describe('admin allowlist + JWT-sessie', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, ADMIN_EMAILS: 'a@x.nl, B@Y.NL', JWT_SECRET: 'x'.repeat(40) };
  });
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('parseert en normaliseert de allowlist', async () => {
    const { getAdminEmails, isAllowedAdminEmail } = await import('@/lib/auth');
    expect(getAdminEmails()).toEqual(['a@x.nl', 'b@y.nl']);
    expect(isAllowedAdminEmail('A@X.NL')).toBe(true);
    expect(isAllowedAdminEmail('c@z.nl')).toBe(false);
  });

  it('createToken/verifyToken round-trip levert het e-mailadres', async () => {
    const { createToken, verifyToken } = await import('@/lib/auth');
    const token = await createToken({ email: 'a@x.nl' });
    expect(await verifyToken(token)).toEqual({ email: 'a@x.nl' });
  });

  it('verifyToken weigert geknoeide tokens', async () => {
    const { verifyToken } = await import('@/lib/auth');
    expect(await verifyToken('niet.een.jwt')).toBeNull();
  });

  it('faalt luid als ADMIN_EMAILS ontbreekt', async () => {
    delete process.env.ADMIN_EMAILS;
    const { getAdminEmails } = await import('@/lib/auth');
    expect(() => getAdminEmails()).toThrow();
  });
});
