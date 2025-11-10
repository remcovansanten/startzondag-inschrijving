/**
 * Unit tests for edit/cancel registration API endpoint (/api/wijzig/[token])
 * Tests GET, PUT, and DELETE operations with valid and invalid tokens
 */

import { GET, PUT, DELETE } from '@/app/api/wijzig/[token]/route';
import { prisma } from '@/lib/db';
import { sendCancellationEmail } from '@/lib/email';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    aanmelding: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email', () => ({
  sendCancellationEmail: jest.fn(),
}));

describe('GET /api/wijzig/[token]', () => {
  const mockAanmelding = {
    id: 'reg-1',
    naam: 'John Doe',
    email: 'john@example.com',
    telefoon: '0612345678',
    opmerking: 'Test opmerking',
    token: 'valid-token-123',
    taak: {
      id: 'task-1',
      naam: 'Test Task',
      beschrijving: 'Description',
      maxAantal: 5,
      categorie: 'Test',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createMockRequest(): NextRequest {
    return {} as NextRequest;
  }

  async function createMockParams(token: string) {
    return Promise.resolve({ token });
  }

  test('1. Returns registration data with valid token', async () => {
    (prisma.aanmelding.findUnique as jest.Mock).mockResolvedValue(mockAanmelding);

    const request = createMockRequest();
    const params = await createMockParams('valid-token-123');
    const response = await GET(request, { params: createMockParams('valid-token-123') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.aanmelding).toBeDefined();
    expect(data.aanmelding.naam).toBe('John Doe');
    expect(data.aanmelding.taak).toBeDefined();
  });

  test('2. Returns 404 with invalid token', async () => {
    (prisma.aanmelding.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest();
    const response = await GET(request, { params: createMockParams('invalid-token') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain('niet gevonden');
  });

  test('3. Handles database errors gracefully', async () => {
    (prisma.aanmelding.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database connection error')
    );

    const request = createMockRequest();
    const response = await GET(request, { params: createMockParams('valid-token-123') });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toContain('fout opgetreden');
  });
});

describe('PUT /api/wijzig/[token]', () => {
  const mockAanmelding = {
    id: 'reg-1',
    naam: 'Updated Name',
    email: 'updated@example.com',
    telefoon: '0687654321',
    opmerking: 'Updated opmerking',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  }

  test('4. Successfully updates registration with valid data', async () => {
    (prisma.aanmelding.update as jest.Mock).mockResolvedValue(mockAanmelding);

    const updateData = {
      naam: 'Updated Name',
      email: 'updated@example.com',
      telefoon: '0687654321',
      opmerking: 'Updated opmerking',
    };

    const request = createMockRequest(updateData);
    const response = await PUT(request, { params: createMockParams('valid-token-123') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.aanmelding).toBeDefined();
    expect(prisma.aanmelding.update).toHaveBeenCalledWith({
      where: { token: 'valid-token-123' },
      data: {
        naam: 'Updated Name',
        email: 'updated@example.com',
        telefoon: '0687654321',
        opmerking: 'Updated opmerking',
      },
    });
  });

  test('5. Returns 400 when required fields are missing', async () => {
    const invalidData = {
      naam: '',
      email: 'test@example.com',
      telefoon: '0612345678',
    };

    const request = createMockRequest(invalidData);
    const response = await PUT(request, { params: createMockParams('valid-token-123') });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('verplichte velden');
  });

  test('6. Handles null opmerking correctly', async () => {
    (prisma.aanmelding.update as jest.Mock).mockResolvedValue(mockAanmelding);

    const updateData = {
      naam: 'Updated Name',
      email: 'updated@example.com',
      telefoon: '0687654321',
      opmerking: '', // Empty opmerking should be stored as null
    };

    const request = createMockRequest(updateData);
    await PUT(request, { params: createMockParams('valid-token-123') });

    expect(prisma.aanmelding.update).toHaveBeenCalledWith({
      where: { token: 'valid-token-123' },
      data: expect.objectContaining({
        opmerking: null,
      }),
    });
  });
});

describe('DELETE /api/wijzig/[token]', () => {
  const mockAanmelding = {
    id: 'reg-1',
    naam: 'John Doe',
    email: 'john@example.com',
    telefoon: '0612345678',
    opmerking: 'Test',
    token: 'valid-token-123',
    taak: {
      id: 'task-1',
      naam: 'Test Task',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (sendCancellationEmail as jest.Mock).mockResolvedValue({ id: 'email-123' });
  });

  function createMockRequest(): NextRequest {
    return {} as NextRequest;
  }

  test('7. Successfully deletes registration with valid token', async () => {
    (prisma.aanmelding.findUnique as jest.Mock).mockResolvedValue(mockAanmelding);
    (prisma.aanmelding.delete as jest.Mock).mockResolvedValue(mockAanmelding);

    const request = createMockRequest();
    const response = await DELETE(request, { params: createMockParams('valid-token-123') });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('geannuleerd');
    expect(prisma.aanmelding.delete).toHaveBeenCalledWith({
      where: { token: 'valid-token-123' },
    });
  });

  test('8. Sends cancellation email after successful deletion', async () => {
    (prisma.aanmelding.findUnique as jest.Mock).mockResolvedValue(mockAanmelding);
    (prisma.aanmelding.delete as jest.Mock).mockResolvedValue(mockAanmelding);

    const request = createMockRequest();
    await DELETE(request, { params: createMockParams('valid-token-123') });

    expect(sendCancellationEmail).toHaveBeenCalledWith('john@example.com', {
      naam: 'John Doe',
      taakNaam: 'Test Task',
    });
  });

  test('9. Returns 404 when trying to delete non-existent registration', async () => {
    (prisma.aanmelding.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest();
    const response = await DELETE(request, { params: createMockParams('invalid-token') });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toContain('niet gevonden');
    expect(prisma.aanmelding.delete).not.toHaveBeenCalled();
  });
});

// Helper function to create mock params
async function createMockParams(token: string) {
  return Promise.resolve({ token });
}
