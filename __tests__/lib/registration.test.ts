import { validateRegistration } from '@/lib/validation';

describe('validateRegistration', () => {
  const valid = { naam: 'Jan Jansen', email: 'jan@example.nl', telefoon: '06-12345678', opmerking: 'hoi' };

  it('accepteert geldige invoer en trimt/normaliseert', () => {
    const r = validateRegistration({ ...valid, naam: '  Jan  ' });
    expect(r.error).toBeUndefined();
    expect(r.data).toEqual({ naam: 'Jan', email: 'jan@example.nl', telefoon: '06-12345678', opmerking: 'hoi' });
  });

  it('lege opmerking wordt null', () => {
    expect(validateRegistration({ ...valid, opmerking: '' }).data?.opmerking).toBeNull();
  });

  it('verplicht naam/e-mail/telefoon', () => {
    expect(validateRegistration({ naam: '', email: 'a@b.nl', telefoon: '0612345678' }).error).toBeTruthy();
    expect(validateRegistration({ naam: 'X', email: '', telefoon: '0612345678' }).error).toBeTruthy();
  });

  it('weigert ongeldig e-mailadres', () => {
    expect(validateRegistration({ ...valid, email: 'geen-email' }).error).toMatch(/e-mail/i);
  });

  it('weigert ongeldig telefoonnummer', () => {
    expect(validateRegistration({ ...valid, telefoon: '12' }).error).toMatch(/telefoon/i);
  });

  it('begrenst de lengte van naam en opmerking', () => {
    expect(validateRegistration({ ...valid, naam: 'a'.repeat(101) }).error).toBeTruthy();
    expect(validateRegistration({ ...valid, opmerking: 'a'.repeat(1001) }).error).toBeTruthy();
  });

  it('negeert niet-string types', () => {
    expect(validateRegistration({ naam: 123, email: {}, telefoon: [] }).error).toBeTruthy();
  });
});
