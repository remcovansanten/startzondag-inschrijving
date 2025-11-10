// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Next.js
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ADMIN_USERNAME = 'testadmin'
process.env.ADMIN_PASSWORD = 'testpassword'
process.env.JWT_SECRET = 'test-secret-key-min-32-characters'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.EMAIL_FROM = 'test@example.com'
process.env.RESEND_API_KEY = 'test-api-key'

// Mock Next.js server components
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
  }

  static json(data, init) {
    return {
      json: async () => data,
      status: init?.status || 200,
      headers: new global.Headers(),
    };
  }
};

global.Headers = class Headers {
  constructor() {
    this.headers = new Map();
  }
  get(name) {
    return this.headers.get(name) || null;
  }
  set(name, value) {
    this.headers.set(name, value);
  }
  getSetCookie() {
    return [];
  }
};