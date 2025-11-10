/**
 * Unit tests for registration API endpoint (/api/aanmelden)
 * Tests successful registration, validation errors, duplicate detection,
 * task capacity enforcement, and rate limiting
 */

import { POST } from '@/app/api/aanmelden/route';
import { prisma } from '@/lib/db';
import { sendConfirmationEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    taak: {
      findUnique: jest.fn(),
    },
    aanmelding: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email', () => ({
  sendConfirmationEmail: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(),
  getRemainingTime: jest.fn(),
}));

describe('POST /api/aanmelden', () => {
  const mockTaak = {
    id: 'task-1',
    naam: 'Test Task',
    beschrijving: 'Test Description',
    maxAantal: 5,
    categorie: 'Test',
    _count: { aanmeldingen: 2 },
    aanmeldingen: [],
  };

  const validRegistration = {
    taakId: 'task-1',
    naam: 'John Doe',
    email: 'john@example.com',
    telefoon: '06-12345678',
    opmerking: 'Test opmerking',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: rate limit passes
    (checkRateLimit as jest.Mock).mockResolvedValue({ success: true });
    // Default: email sends successfully
    (sendConfirmationEmail as jest.Mock).mockResolvedValue({ id: 'email-123' });
  });

  function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
    return {
      json: async () => body,
      headers: {
        get: (key: string) => headers[key] || null,
      },
    } as unknown as NextRequest;
  }

  test('1. Successfully creates registration with all valid data', async () => {
    const mockAanmelding = {
      id: 'reg-1',
      ...validRegistration,
      token: 'mock-token',
      bevestigd: true,
      createdAt: new Date(),
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        taak: {
          findUnique: jest.fn().mockResolvedValue(mockTaak),
        },
        aanmelding: {
          create: jest.fn().mockResolvedValue(mockAanmelding),
        },
      });
    });

    const request = createMockRequest(validRegistration);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Aanmelding succesvol');
  });

  test('2. Returns 400 when required fields are missing (naam)', async () => {
    const invalidData = { ...validRegistration, naam: '' };
    const request = createMockRequest(invalidData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('verplichte velden');
  });

  test('3. Returns 400 when required fields are missing (email)', async () => {
    const invalidData = { ...validRegistration, email: '' };
    const request = createMockRequest(invalidData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('verplichte velden');
  });

  test('4. Returns 400 when email format is invalid', async () => {
    const invalidData = { ...validRegistration, email: 'invalid-email' };
    const request = createMockRequest(invalidData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('geldig e-mailadres');
  });

  test('5. Returns 400 when phone number format is invalid', async () => {
    const invalidData = { ...validRegistration, telefoon: '123' };
    const request = createMockRequest(invalidData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('telefoonnummer');
  });

  test('6. Returns 400 when duplicate email detected for same task', async () => {
    const duplicateTaak = {
      ...mockTaak,
      aanmeldingen: [{ id: 'existing-reg' }], // Already registered
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        taak: {
          findUnique: jest.fn().mockResolvedValue(duplicateTaak),
        },
        aanmelding: {
          create: jest.fn(),
        },
      });
    });

    const request = createMockRequest(validRegistration);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('al aangemeld');
  });

  test('7. Returns 400 when task is full', async () => {
    const fullTaak = {
      ...mockTaak,
      _count: { aanmeldingen: 5 }, // maxAantal is 5
    };

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        taak: {
          findUnique: jest.fn().mockResolvedValue(fullTaak),
        },
        aanmelding: {
          create: jest.fn(),
        },
      });
    });

    const request = createMockRequest(validRegistration);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('vol');
  });

  test('8. Returns 404 when task does not exist', async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        taak: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
        aanmelding: {
          create: jest.fn(),
        },
      });
    });

    const request = createMockRequest(validRegistration);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain('bestaat niet');
  });

  test('9. Returns 429 when IP rate limit is exceeded', async () => {
    // Mock rate limit check to return false for IP
    (checkRateLimit as jest.Mock)
      .mockResolvedValueOnce({ success: false, reset: Date.now() + 3600000 }); // IP limit exceeded

    const request = createMockRequest(validRegistration, {
      'x-forwarded-for': '192.168.1.1',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.message).toContain('Te veel aanmeldpogingen');
  });

  test('10. Returns 429 when email rate limit is exceeded', async () => {
    (checkRateLimit as jest.Mock)
      .mockResolvedValueOnce({ success: true })  // IP limit OK
      .mockResolvedValueOnce({ success: false, reset: Date.now() + 3600000 }); // Email limit exceeded

    const request = createMockRequest(validRegistration);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.message).toContain('Te veel aanmeldpogingen');
  });

  test('11. Generates unique token for each registration', async () => {
    let capturedToken: string | null = null;

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        taak: {
          findUnique: jest.fn().mockResolvedValue(mockTaak),
        },
        aanmelding: {
          create: jest.fn().mockImplementation((data) => {
            capturedToken = data.data.token;
            return { id: 'reg-1', ...data.data };
          }),
        },
      });
    });

    const request = createMockRequest(validRegistration);
    await POST(request);

    expect(capturedToken).toBeTruthy();
    expect(capturedToken?.length).toBeGreaterThan(32);
  });

  test('12. Continues registration even if email sending fails', async () => {
    (sendConfirmationEmail as jest.Mock).mockRejectedValue(
      new Error('Email service unavailable')
    );

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        taak: {
          findUnique: jest.fn().mockResolvedValue(mockTaak),
        },
        aanmelding: {
          create: jest.fn().mockResolvedValue({
            id: 'reg-1',
            ...validRegistration,
            token: 'mock-token',
          }),
        },
      });
    });

    const request = createMockRequest(validRegistration);
    const response = await POST(request);
    const data = await response.json();

    // Registration should still succeed
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('13. Sanitizes phone number before storing', async () => {
    let storedPhone: string | null = null;

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        taak: {
          findUnique: jest.fn().mockResolvedValue(mockTaak),
        },
        aanmelding: {
          create: jest.fn().mockImplementation((data) => {
            storedPhone = data.data.telefoon;
            return { id: 'reg-1', ...data.data };
          }),
        },
      });
    });

    const dataWithFormattedPhone = {
      ...validRegistration,
      telefoon: '06-12 34 56 78', // Formatted phone
    };

    const request = createMockRequest(dataWithFormattedPhone);
    await POST(request);

    // Should be sanitized to 0612345678
    expect(storedPhone).toBe('0612345678');
  });
});
