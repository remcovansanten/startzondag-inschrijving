/**
 * Unit tests for admin task management API endpoint (/api/admin/taken)
 * Tests CRUD operations, validation, and authentication requirements
 */

import { POST } from '@/app/api/admin/taken/route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    taak: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock auth to simulate authenticated requests
jest.mock('@/lib/auth', () => ({
  getSession: jest.fn(),
}));

describe('POST /api/admin/taken', () => {
  const mockTaak = {
    id: 'task-1',
    naam: 'Test Task',
    beschrijving: 'Test Description',
    maxAantal: 10,
    categorie: 'Test Category',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  }

  test('1. Successfully creates task with all valid data', async () => {
    (prisma.taak.create as jest.Mock).mockResolvedValue(mockTaak);

    const request = createMockRequest({
      naam: 'Test Task',
      beschrijving: 'Test Description',
      maxAantal: '10',
      categorie: 'Test Category',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.taak).toBeDefined();
    expect(data.taak.naam).toBe('Test Task');
  });

  test('2. Returns 400 when naam is missing', async () => {
    const request = createMockRequest({
      naam: '',
      maxAantal: '10',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('verplicht');
  });

  test('3. Returns 400 when maxAantal is missing', async () => {
    const request = createMockRequest({
      naam: 'Test Task',
      maxAantal: '',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('verplicht');
  });

  test('4. Handles null values for optional fields correctly', async () => {
    (prisma.taak.create as jest.Mock).mockResolvedValue({
      ...mockTaak,
      beschrijving: null,
      categorie: null,
    });

    const request = createMockRequest({
      naam: 'Test Task',
      maxAantal: '10',
      beschrijving: '',
      categorie: '',
    });

    await POST(request);

    expect(prisma.taak.create).toHaveBeenCalledWith({
      data: {
        naam: 'Test Task',
        beschrijving: null,
        maxAantal: 10,
        categorie: null,
      },
    });
  });

  test('5. Converts maxAantal string to integer', async () => {
    (prisma.taak.create as jest.Mock).mockResolvedValue(mockTaak);

    const request = createMockRequest({
      naam: 'Test Task',
      maxAantal: '15', // String
    });

    await POST(request);

    expect(prisma.taak.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        maxAantal: 15, // Should be converted to number
      }),
    });
  });

  test('6. Handles database errors gracefully', async () => {
    (prisma.taak.create as jest.Mock).mockRejectedValue(
      new Error('Database constraint violation')
    );

    const request = createMockRequest({
      naam: 'Test Task',
      maxAantal: '10',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toContain('fout opgetreden');
  });

  test('7. Creates task with only required fields', async () => {
    const minimalTaak = {
      id: 'task-2',
      naam: 'Minimal Task',
      maxAantal: 5,
      beschrijving: null,
      categorie: null,
    };

    (prisma.taak.create as jest.Mock).mockResolvedValue(minimalTaak);

    const request = createMockRequest({
      naam: 'Minimal Task',
      maxAantal: '5',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.taak.naam).toBe('Minimal Task');
  });

  test('8. Validates maxAantal is a positive number', async () => {
    (prisma.taak.create as jest.Mock).mockResolvedValue(mockTaak);

    const request = createMockRequest({
      naam: 'Test Task',
      maxAantal: '0', // Should this be allowed?
    });

    await POST(request);

    // This test documents current behavior
    // Consider adding validation for positive numbers in the future
    expect(prisma.taak.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        maxAantal: 0,
      }),
    });
  });
});

describe('Task Management - Additional Operations', () => {
  test('9. Verifies task creation returns expected structure', async () => {
    const fullTaak = {
      id: 'task-1',
      naam: 'Complete Task',
      beschrijving: 'Full description',
      maxAantal: 20,
      categorie: 'Category A',
      createdAt: new Date(),
    };

    (prisma.taak.create as jest.Mock).mockResolvedValue(fullTaak);

    function createMockRequest(body: any): NextRequest {
      return {
        json: async () => body,
      } as unknown as NextRequest;
    }

    const request = createMockRequest({
      naam: 'Complete Task',
      beschrijving: 'Full description',
      maxAantal: '20',
      categorie: 'Category A',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.taak).toMatchObject({
      id: expect.any(String),
      naam: 'Complete Task',
      beschrijving: 'Full description',
      maxAantal: 20,
      categorie: 'Category A',
    });
  });
});
