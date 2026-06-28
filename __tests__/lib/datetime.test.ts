import { formatDateTimeNL } from '@/lib/datetime';

describe('formatDateTimeNL', () => {
  it('toont datum en tijd in het formaat dd-mm-jjjj uu:mm', () => {
    // 2026-06-28 08:48 UTC -> zomertijd (CEST, UTC+2) -> 10:48
    expect(formatDateTimeNL('2026-06-28T08:48:00Z')).toBe('28-06-2026 10:48');
  });

  it('rekent om naar Nederlandse tijdzone, niet UTC (wintertijd)', () => {
    // 2026-01-15 08:48 UTC -> wintertijd (CET, UTC+1) -> 09:48
    expect(formatDateTimeNL('2026-01-15T08:48:00Z')).toBe('15-01-2026 09:48');
  });

  it('accepteert ook een Date-object', () => {
    expect(formatDateTimeNL(new Date('2026-06-28T08:48:00Z'))).toBe('28-06-2026 10:48');
  });
});
