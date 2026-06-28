// Datum/tijd-formattering voor weergave (admin-dashboard, Excel-export).
// Altijd in Nederlandse tijdzone, ongeacht de servertijdzone (Vercel draait UTC).
const TIME_ZONE = 'Europe/Amsterdam';

// "28-06-2026 10:48" — datum en tijd los geformatteerd en samengevoegd,
// zodat de uitvoer niet afhangt van het scheidingsteken van de locale.
export function formatDateTimeNL(date: Date | string): string {
  const d = new Date(date);
  const datum = d.toLocaleDateString('nl-NL', {
    timeZone: TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const tijd = d.toLocaleTimeString('nl-NL', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datum} ${tijd}`;
}
