// Maximale lengtes per veld (voorkomt opslag-/DoS-misbruik en kapotte e-mails).
export const FIELD_LIMITS = { naam: 100, email: 254, telefoon: 30, opmerking: 1000 } as const;

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= FIELD_LIMITS.email;
}

export interface RegistrationInput {
  naam?: unknown;
  email?: unknown;
  telefoon?: unknown;
  opmerking?: unknown;
}

export interface RegistrationResult {
  error?: string;
  data?: { naam: string; email: string; telefoon: string; opmerking: string | null };
}

// Gedeelde validatie + sanitisatie voor aanmelden én wijzigen.
export function validateRegistration(input: RegistrationInput): RegistrationResult {
  const naam = typeof input.naam === 'string' ? input.naam.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const telefoon = typeof input.telefoon === 'string' ? input.telefoon.trim() : '';
  const opmerking = typeof input.opmerking === 'string' ? input.opmerking.trim() : '';

  if (!naam || !email || !telefoon) return { error: 'Naam, e-mail en telefoon zijn verplicht' };
  if (naam.length > FIELD_LIMITS.naam) return { error: 'Naam is te lang' };
  if (!validateEmail(email)) return { error: 'Ongeldig e-mailadres' };
  if (!validateDutchPhoneNumber(telefoon)) return { error: 'Ongeldig telefoonnummer' };
  if (opmerking.length > FIELD_LIMITS.opmerking) return { error: 'Opmerking is te lang' };

  return { data: { naam, email, telefoon, opmerking: opmerking || null } };
}

// Dutch phone number validation
export function validateDutchPhoneNumber(phone: string): boolean {
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Dutch phone number patterns
  const patterns = [
    /^06\d{8}$/,           // Mobile: 06xxxxxxxx
    /^\+316\d{8}$/,        // Mobile international: +316xxxxxxxx
    /^0[1-578]\d{8}$/,     // Landline: 0xxxxxxxxx (various area codes)
    /^\+31[1-578]\d{8}$/,  // Landline international
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // International format
  if (cleaned.startsWith('+31')) {
    const number = cleaned.substring(3);
    if (number.startsWith('6') && number.length === 9) {
      // Mobile: +31 6 xxxx xxxx
      return `+31 ${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
    } else if (number.length === 9) {
      // Landline: +31 xx xxx xxxxx (depending on area)
      return `+31 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
    }
  }
  
  // National format
  if (cleaned.startsWith('06') && cleaned.length === 10) {
    // Mobile: 06-xxxx xxxx
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 6)} ${cleaned.substring(6)}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Landline: 0xx-xxx xxxx
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone; // Return as-is if no pattern matches
}

// Sanitize phone number for storage
export function sanitizePhoneNumber(phone: string): string {
  // Keep only digits and leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Convert international format to national for consistency
  if (cleaned.startsWith('+31')) {
    cleaned = '0' + cleaned.substring(3);
  }
  
  return cleaned;
}