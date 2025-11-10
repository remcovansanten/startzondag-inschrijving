/**
 * Unit tests for admin login API endpoint (/api/admin/login)
 * Tests authentication, auto-creation of first admin, cookie handling,
 * and JWT token generation
 */

import { POST } from '@/app/api/admin/login/route';
import { prisma } from '@/lib/db';
import { createToken, setSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    admin: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  createToken: jest.fn(),
  setSession: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('POST /api/admin/login', () => {
  const mockAdmin = {
    id: 'admin-1',
    username: 'testadmin',
    passwordHash: '$2a$10$hashedpassword',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set default environment variables
    process.env.ADMIN_USERNAME = 'testadmin';
    process.env.ADMIN_PASSWORD = 'testpassword';
  });

  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  }

  test('1. Successfully logs in with valid credentials', async () => {
    (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (createToken as jest.Mock).mockResolvedValue('mock-jwt-token');

    const request = createMockRequest({
      username: 'testadmin',
      password: 'testpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('Succesvol ingelogd');
    expect(setSession).toHaveBeenCalledWith('mock-jwt-token');
  });

  test('2. Returns 401 with invalid username', async () => {
    (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createMockRequest({
      username: 'nonexistent',
      password: 'testpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toContain('Ongeldige inloggegevens');
  });

  test('3. Returns 401 with invalid password', async () => {
    (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const request = createMockRequest({
      username: 'testadmin',
      password: 'wrongpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.message).toContain('Ongeldige inloggegevens');
  });

  test('4. Auto-creates first admin from environment variables', async () => {
    (prisma.admin.findUnique as jest.Mock).mockResolvedValueOnce(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$10$hashedpassword');
    (prisma.admin.create as jest.Mock).mockResolvedValue(mockAdmin);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (createToken as jest.Mock).mockResolvedValue('mock-jwt-token');

    const request = createMockRequest({
      username: 'testadmin', // Same as ADMIN_USERNAME
      password: 'testpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.admin.create).toHaveBeenCalledWith({
      data: {
        username: 'testadmin',
        passwordHash: '$2a$10$hashedpassword',
      },
    });
    expect(data.success).toBe(true);
  });

  test('5. Returns 400 when username is missing', async () => {
    const request = createMockRequest({
      username: '',
      password: 'testpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('verplicht');
  });

  test('6. Returns 400 when password is missing', async () => {
    const request = createMockRequest({
      username: 'testadmin',
      password: '',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toContain('verplicht');
  });

  test('7. Creates JWT token with correct payload', async () => {
    (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (createToken as jest.Mock).mockResolvedValue('mock-jwt-token');

    const request = createMockRequest({
      username: 'testadmin',
      password: 'testpassword',
    });

    await POST(request);

    expect(createToken).toHaveBeenCalledWith({
      id: 'admin-1',
      username: 'testadmin',
    });
  });

  test('8. Handles database errors gracefully', async () => {
    (prisma.admin.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = createMockRequest({
      username: 'testadmin',
      password: 'testpassword',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toContain('fout opgetreden');
  });
});
