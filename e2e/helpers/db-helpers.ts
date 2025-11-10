/**
 * Database helper functions for E2E tests
 * Provides utilities for database setup, teardown, and data management
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Clean up test data from the database
 * Removes all test tasks, registrations, and admin users created during testing
 */
export async function cleanupTestData() {
  try {
    // Delete test registrations (those with test emails)
    await prisma.aanmelding.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { email: { contains: 'example.com' } }
        ]
      }
    });

    // Delete test tasks (those with 'Test' in the name)
    await prisma.taak.deleteMany({
      where: {
        naam: { contains: 'Test' }
      }
    });

    // Delete test admin users
    await prisma.admin.deleteMany({
      where: {
        username: { contains: 'test' }
      }
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

/**
 * Create a test task in the database
 */
export async function createTestTask(taskData: {
  naam: string;
  beschrijving?: string;
  maxAantal: number;
  categorie?: string;
}) {
  try {
    const task = await prisma.taak.create({
      data: taskData
    });
    return task;
  } catch (error) {
    console.error('Error creating test task:', error);
    throw error;
  }
}

/**
 * Create a test registration in the database
 */
export async function createTestRegistration(registrationData: {
  taakId: string;
  naam: string;
  email: string;
  telefoon: string;
  opmerking?: string;
}) {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const registration = await prisma.aanmelding.create({
      data: {
        ...registrationData,
        token,
        bevestigd: true
      }
    });
    return registration;
  } catch (error) {
    console.error('Error creating test registration:', error);
    throw error;
  }
}

/**
 * Create a test admin user in the database
 */
export async function createTestAdmin(username: string, password: string) {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: {
        username,
        passwordHash
      }
    });
    return admin;
  } catch (error) {
    console.error('Error creating test admin:', error);
    throw error;
  }
}

/**
 * Get a task by ID
 */
export async function getTaskById(id: string) {
  try {
    return await prisma.taak.findUnique({
      where: { id },
      include: {
        aanmeldingen: true,
        _count: {
          select: { aanmeldingen: true }
        }
      }
    });
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
}

/**
 * Get a registration by token
 */
export async function getRegistrationByToken(token: string) {
  try {
    return await prisma.aanmelding.findUnique({
      where: { token },
      include: {
        taak: true
      }
    });
  } catch (error) {
    console.error('Error getting registration:', error);
    throw error;
  }
}

/**
 * Get a registration by email and task ID
 */
export async function getRegistrationByEmailAndTask(email: string, taakId: string) {
  try {
    return await prisma.aanmelding.findFirst({
      where: {
        email,
        taakId
      }
    });
  } catch (error) {
    console.error('Error getting registration:', error);
    throw error;
  }
}

/**
 * Get registration count for a task
 */
export async function getRegistrationCount(taakId: string) {
  try {
    return await prisma.aanmelding.count({
      where: { taakId }
    });
  } catch (error) {
    console.error('Error counting registrations:', error);
    throw error;
  }
}

/**
 * Delete a task and all its registrations
 */
export async function deleteTask(id: string) {
  try {
    // Prisma will handle cascade delete for registrations
    await prisma.taak.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Delete a registration
 */
export async function deleteRegistration(id: string) {
  try {
    await prisma.aanmelding.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    throw error;
  }
}

/**
 * Delete an admin user
 */
export async function deleteAdmin(id: string) {
  try {
    await prisma.admin.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw error;
  }
}

/**
 * Get all tasks
 */
export async function getAllTasks() {
  try {
    return await prisma.taak.findMany({
      include: {
        _count: {
          select: { aanmeldingen: true }
        }
      },
      orderBy: [
        { categorie: 'asc' },
        { naam: 'asc' }
      ]
    });
  } catch (error) {
    console.error('Error getting all tasks:', error);
    throw error;
  }
}

/**
 * Check if admin exists
 */
export async function adminExists(username: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { username }
    });
    return !!admin;
  } catch (error) {
    console.error('Error checking admin existence:', error);
    throw error;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

export { prisma };
