/**
 * Test data fixtures for E2E tests
 * Provides consistent test data across all test suites
 */

export const testTasks = {
  openTask: {
    naam: 'Test Task - Open',
    beschrijving: 'Test task with availability for E2E testing',
    maxAantal: 5,
    categorie: 'Test Category'
  },
  fullTask: {
    naam: 'Test Task - Full',
    beschrijving: 'Test task that is full',
    maxAantal: 1,
    categorie: 'Test Category'
  },
  largeCapacityTask: {
    naam: 'Test Task - Large Capacity',
    beschrijving: 'Test task with large capacity for concurrency tests',
    maxAantal: 100,
    categorie: 'Test Category'
  },
  smallCapacityTask: {
    naam: 'Test Task - Small Capacity',
    beschrijving: 'Test task with small capacity for concurrency tests',
    maxAantal: 3,
    categorie: 'Test Category'
  }
};

export const testRegistration = {
  valid: {
    naam: 'Test User',
    email: 'test@example.com',
    telefoon: '06-12345678',
    opmerking: 'Test registration'
  },
  validAlternative: {
    naam: 'Another Test User',
    email: 'another@example.com',
    telefoon: '06-87654321',
    opmerking: 'Another test registration'
  },
  invalidEmail: {
    naam: 'Test User',
    email: 'invalid-email',
    telefoon: '06-12345678',
    opmerking: ''
  },
  invalidPhone: {
    naam: 'Test User',
    email: 'test@example.com',
    telefoon: 'invalid-phone',
    opmerking: ''
  },
  emptyFields: {
    naam: '',
    email: '',
    telefoon: '',
    opmerking: ''
  }
};

export const testAdmin = {
  username: 'testadmin',
  password: 'test-password-32-chars-minimum!'
};

export const invalidAdmin = {
  username: 'wronguser',
  password: 'wrongpassword'
};

/**
 * Generate unique test data to avoid conflicts between parallel test runs
 */
export function generateUniqueTestData(baseName: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    naam: `${baseName} ${timestamp}`,
    email: `test-${timestamp}-${random}@example.com`,
    telefoon: `06-${Math.floor(10000000 + Math.random() * 90000000)}`,
    opmerking: `Test registration at ${timestamp}`
  };
}

/**
 * Generate unique task data
 */
export function generateUniqueTask(baseTask: any) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    ...baseTask,
    naam: `${baseTask.naam} ${timestamp}-${random}`
  };
}
