// Statuswaarden als tekst (i.p.v. DB-enum) zodat we later eenvoudig waarden
// kunnen toevoegen (bijv. WACHTLIJST in Fase 3).
export const STATUS = {
  ACTIEF: 'ACTIEF',
  GEANNULEERD: 'GEANNULEERD',
  WACHTLIJST: 'WACHTLIJST',
} as const;

export const EMAIL_STATUS = {
  ONBEKEND: 'ONBEKEND',
  OK: 'OK',
  CONTROLEREN: 'CONTROLEREN',
} as const;

// Hergebruikt filter: alleen ACTIEVE aanmeldingen tellen mee voor de bezetting.
// Geannuleerde (soft-deleted) blijven bewaard maar tellen niet mee.
export const ACTIEF_FILTER = { status: STATUS.ACTIEF } as const;
