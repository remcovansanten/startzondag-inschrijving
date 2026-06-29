import { promises as dns } from 'dns';
import { EMAIL_STATUS } from './aanmelding';

type EmailStatus = (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS];

// Controleer of het e-maildomein een mailserver heeft (MX-record). Vangt nep-/
// typedomeinen. Geen MX of niet-bestaand domein -> CONTROLEREN (admin checkt het,
// de plek blijft). Een tijdelijke DNS-fout -> ONBEKEND (niet onterecht vlaggen).
export async function checkEmailDomain(email: string): Promise<EmailStatus> {
  const domain = email.split('@')[1];
  if (!domain) return EMAIL_STATUS.CONTROLEREN;
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0 ? EMAIL_STATUS.OK : EMAIL_STATUS.CONTROLEREN;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ENOTFOUND' || code === 'ENODATA') return EMAIL_STATUS.CONTROLEREN;
    return EMAIL_STATUS.ONBEKEND;
  }
}
