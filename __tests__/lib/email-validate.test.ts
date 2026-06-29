// MOCK REASON: dns is een externe, non-deterministische systeemafhankelijkheid.
jest.mock('dns', () => ({ promises: { resolveMx: jest.fn() } }));

import { promises as dns } from 'dns';
import { checkEmailDomain } from '@/lib/email-validate';

const mockResolveMx = dns.resolveMx as unknown as jest.Mock;

describe('checkEmailDomain', () => {
  beforeEach(() => mockResolveMx.mockReset());

  it('domein met MX-record -> OK', async () => {
    mockResolveMx.mockResolvedValue([{ exchange: 'mx.example.nl', priority: 10 }]);
    expect(await checkEmailDomain('jan@example.nl')).toBe('OK');
  });

  it('domein zonder MX-records -> CONTROLEREN', async () => {
    mockResolveMx.mockResolvedValue([]);
    expect(await checkEmailDomain('jan@geen-mx.nl')).toBe('CONTROLEREN');
  });

  it('niet-bestaand domein (ENOTFOUND) -> CONTROLEREN', async () => {
    mockResolveMx.mockRejectedValue(Object.assign(new Error('nope'), { code: 'ENOTFOUND' }));
    expect(await checkEmailDomain('jan@bestaat-niet.xyz')).toBe('CONTROLEREN');
  });

  it('tijdelijke DNS-fout -> ONBEKEND (niet onterecht vlaggen)', async () => {
    mockResolveMx.mockRejectedValue(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' }));
    expect(await checkEmailDomain('jan@example.nl')).toBe('ONBEKEND');
  });

  it('geen @ in adres -> CONTROLEREN', async () => {
    expect(await checkEmailDomain('geen-email')).toBe('CONTROLEREN');
  });
});
