import '@testing-library/jest-dom'

// Mock Next.js 15 server globals
global.Request = class MockRequest {
  constructor(input: string | Request, init?: RequestInit) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers)
    this.body = init?.body || null
  }
  
  async json() {
    if (this.body) {
      return JSON.parse(this.body as string)
    }
    return {}
  }
  
  async text() {
    return this.body ? this.body.toString() : ''
  }
  
  cookies = {
    get: jest.fn(() => null)
  }
} as any

global.Response = class MockResponse {
  constructor(body?: any, init?: ResponseInit) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Headers(init?.headers)
  }
  
  async json() {
    return this.body
  }
  
  async text() {
    return JSON.stringify(this.body)
  }
} as any

global.Headers = class MockHeaders extends Map {
  get(name: string) {
    return super.get(name?.toLowerCase())
  }
  
  set(name: string, value: string) {
    return super.set(name?.toLowerCase(), value)
  }
  
  has(name: string) {
    return super.has(name?.toLowerCase())
  }
  
  delete(name: string) {
    return super.delete(name?.toLowerCase())
  }
} as any

global.URL = URL
global.URLSearchParams = URLSearchParams

// Mock Next.js modules that don't work well in test environment
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
}))

// Mock nanoid for ESM compatibility
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-id-123'),
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((input, init) => ({
    url: typeof input === 'string' ? input : input.url,
    method: init?.method || 'GET',
    headers: new Map(),
    cookies: {
      get: jest.fn(() => null)
    },
    json: jest.fn(() => Promise.resolve({}))
  })),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map()
    }))
  }
}))

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Global test utilities
global.console = {
  ...console,
  // Suppress logs in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock Prisma client for tests
jest.mock('@united-cars/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
    // Mock all Prisma models
    vehicle: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    insuranceClaim: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    serviceRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    title: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    org: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    }
  }
}))

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})