// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ADMIN_USERNAME = 'testadmin'
process.env.ADMIN_PASSWORD = 'testpassword'
process.env.JWT_SECRET = 'test-secret-key'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'