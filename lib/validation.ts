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