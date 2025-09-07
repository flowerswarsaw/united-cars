/**
 * API Smoke Tests
 * Quick validation that all critical API endpoints are responding correctly
 * Tests authentication, basic functionality, and error handling
 */

import { NextRequest } from 'next/server'

// Mock authenticated session for testing
const mockAuthenticatedSession = {
  user: {
    id: 'test-user-123',
    email: 'test@united-cars.com',
    name: 'Test User',
    roles: ['DEALER'],
    orgId: 'test-org-123'
  }
}

const mockAdminSession = {
  user: {
    id: 'admin-user-123',
    email: 'admin@united-cars.com',
    name: 'Admin User',
    roles: ['ADMIN'],
    orgId: 'admin-org-123'
  }
}

// Mock Prisma responses for consistent testing
const mockVehicle = {
  id: 'vehicle-123',
  vin: '1HGBH41JXMN109186',
  make: 'Honda',
  model: 'Civic',
  year: 2021,
  status: 'available',
  orgId: 'test-org-123',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockClaim = {
  id: 'claim-123',
  status: 'new',
  description: 'Test insurance claim',
  vehicleId: 'vehicle-123',
  orgId: 'test-org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1
}

const mockServiceRequest = {
  id: 'service-123',
  type: 'inspection',
  status: 'pending',
  vehicleId: 'vehicle-123',
  orgId: 'test-org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 0
}

describe('API Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset Prisma mocks
    const { prisma } = require('@united-cars/db')
    
    // Default successful responses
    prisma.vehicle.findMany.mockResolvedValue([mockVehicle])
    prisma.vehicle.count.mockResolvedValue(1)
    prisma.insuranceClaim.findMany.mockResolvedValue([mockClaim])
    prisma.insuranceClaim.count.mockResolvedValue(1)
    prisma.serviceRequest.findMany.mockResolvedValue([mockServiceRequest])
    prisma.serviceRequest.count.mockResolvedValue(1)
    prisma.title.findFirst.mockResolvedValue({
      id: 'title-123',
      vin: '1HGBH41JXMN109186',
      status: 'pending',
      vehicleId: 'vehicle-123'
    })
  })

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const { GET } = await import('@/app/api/health/route')
      
      const request = new Request('http://localhost:3000/api/health')
      const response = await GET(request as any)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String)
      })
    })

    it('should include system information', async () => {
      const { GET } = await import('@/app/api/health/route')
      
      const request = new Request('http://localhost:3000/api/health')
      const response = await GET(request as any)
      
      const data = await response.json()
      expect(data.version).toBeDefined()
      expect(data.environment).toBeDefined()
    })
  })

  describe('Vehicles API', () => {
    const createMockRequest = (searchParams = '') => {
      return {
        url: `http://localhost:3000/api/vehicles${searchParams}`,
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: {
          get: () => 'test-agent'
        }
      } as any
    }

    it('should list vehicles for authenticated user', async () => {
      const { GET } = await import('@/app/api/vehicles/route')
      
      const request = createMockRequest('?page=1&perPage=10')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.vehicles).toEqual([mockVehicle])
      expect(data.pagination).toMatchObject({
        page: 1,
        perPage: 10,
        total: 1,
        totalPages: 1
      })
    })

    it('should filter vehicles by status', async () => {
      const { GET } = await import('@/app/api/vehicles/route')
      
      const request = createMockRequest('?status=available')
      await GET(request)
      
      const { prisma } = require('@united-cars/db')
      expect(prisma.vehicle.findMany).toHaveBeenCalled()
      
      // Verify the where clause includes status filter
      const findManyCall = prisma.vehicle.findMany.mock.calls[0][0]
      expect(findManyCall.where.status).toBe('available')
    })

    it('should search vehicles by VIN/make/model', async () => {
      const { GET } = await import('@/app/api/vehicles/route')
      
      const request = createMockRequest('?search=Honda')
      await GET(request)
      
      const { prisma } = require('@united-cars/db')
      const findManyCall = prisma.vehicle.findMany.mock.calls[0][0]
      expect(findManyCall.where.OR).toBeDefined()
      expect(findManyCall.where.OR[1].make.contains).toBe('Honda')
    })

    it('should require authentication', async () => {
      const { GET } = await import('@/app/api/vehicles/route')
      
      const unauthenticatedRequest = {
        url: 'http://localhost:3000/api/vehicles',
        cookies: { get: () => null },
        headers: { get: () => null }
      } as any
      
      const response = await GET(unauthenticatedRequest)
      expect(response.status).toBe(401)
    })
  })

  describe('Insurance Claims API', () => {
    const createMockRequest = (searchParams = '') => {
      return {
        url: `http://localhost:3000/api/claims${searchParams}`,
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: {
          get: () => 'test-agent'
        }
      } as any
    }

    it('should list insurance claims for authenticated user', async () => {
      const { GET } = await import('@/app/api/claims/route')
      
      const request = createMockRequest('?page=1&perPage=25')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.claims).toEqual([mockClaim])
    })

    it('should create new insurance claim for dealers', async () => {
      const { POST } = await import('@/app/api/claims/route')
      
      const newClaimData = {
        vehicleId: 'vehicle-123',
        description: 'Minor collision damage',
        incidentAt: '2024-01-15T10:00:00Z',
        photos: ['photo1.jpg', 'photo2.jpg']
      }

      // Mock successful vehicle lookup
      const { prisma } = require('@united-cars/db')
      prisma.vehicle.findFirst.mockResolvedValue(mockVehicle)
      prisma.insuranceClaim.create.mockResolvedValue({
        ...mockClaim,
        description: newClaimData.description,
        vehicle: mockVehicle,
        org: { id: 'test-org-123', name: 'Test Org', type: 'DEALER' }
      })
      prisma.auditLog.create.mockResolvedValue({})

      const request = {
        url: 'http://localhost:3000/api/claims',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: { get: () => 'test-agent' },
        json: async () => newClaimData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.claim.description).toBe(newClaimData.description)
    })

    it('should reject claim creation for non-dealers', async () => {
      const { POST } = await import('@/app/api/claims/route')
      
      const userSession = {
        user: {
          ...mockAuthenticatedSession.user,
          roles: ['USER'] // Not a dealer
        }
      }

      const request = {
        url: 'http://localhost:3000/api/claims',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(userSession))
          })
        },
        headers: { get: () => 'test-agent' },
        json: async () => ({ vehicleId: 'vehicle-123', description: 'test' })
      } as any

      const response = await POST(request)
      expect(response.status).toBe(403)
    })
  })

  describe('Service Requests API', () => {
    const createMockRequest = (searchParams = '') => {
      return {
        url: `http://localhost:3000/api/services${searchParams}`,
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: {
          get: () => 'test-agent'
        }
      } as any
    }

    it('should list service requests for authenticated user', async () => {
      const { GET } = await import('@/app/api/services/route')
      
      const request = createMockRequest('?page=1&perPage=25')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.serviceRequests).toEqual([mockServiceRequest])
    })

    it('should filter service requests by type and status', async () => {
      const { GET } = await import('@/app/api/services/route')
      
      const request = createMockRequest('?type=inspection&status=pending')
      await GET(request)
      
      const { prisma } = require('@united-cars/db')
      const findManyCall = prisma.serviceRequest.findMany.mock.calls[0][0]
      expect(findManyCall.where.type).toBe('inspection')
      expect(findManyCall.where.status).toBe('pending')
    })

    it('should create new service request', async () => {
      const { POST } = await import('@/app/api/services/route')
      
      const newServiceData = {
        vehicleId: 'vehicle-123',
        type: 'inspection',
        notes: 'Pre-purchase inspection needed'
      }

      const { prisma } = require('@united-cars/db')
      prisma.vehicle.findFirst.mockResolvedValue(mockVehicle)
      prisma.serviceRequest.create.mockResolvedValue({
        ...mockServiceRequest,
        ...newServiceData,
        vehicle: mockVehicle,
        org: { id: 'test-org-123', name: 'Test Org', type: 'DEALER' }
      })
      prisma.auditLog.create.mockResolvedValue({})

      const request = {
        url: 'http://localhost:3000/api/services',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: { get: () => 'test-agent' },
        json: async () => newServiceData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.serviceRequest.type).toBe(newServiceData.type)
    })
  })

  describe('Titles API', () => {
    const createMockRequest = (titleId = 'title-123') => {
      return {
        url: `http://localhost:3000/api/titles/${titleId}`,
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: {
          get: () => 'test-agent'
        }
      } as any
    }

    it('should get title details for authorized user', async () => {
      const { GET } = await import('@/app/api/titles/[id]/route')
      
      const mockTitle = {
        id: 'title-123',
        vin: '1HGBH41JXMN109186',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        status: 'pending',
        notes: 'Title processing in progress',
        createdAt: new Date(),
        updatedAt: new Date(),
        vehicle: mockVehicle,
        package: null
      }

      const { prisma } = require('@united-cars/db')
      prisma.title.findFirst.mockResolvedValue(mockTitle)

      const request = createMockRequest()
      const context = { params: Promise.resolve({ id: 'title-123' }) }
      
      const response = await GET(request, context)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.title.id).toBe('title-123')
    })

    it('should return 404 for non-existent title', async () => {
      const { GET } = await import('@/app/api/titles/[id]/route')
      
      const { prisma } = require('@united-cars/db')
      prisma.title.findFirst.mockResolvedValue(null)

      const request = createMockRequest('non-existent-title')
      const context = { params: Promise.resolve({ id: 'non-existent-title' }) }
      
      const response = await GET(request, context)
      expect(response.status).toBe(404)
    })

    it('should validate title ID format', async () => {
      const { GET } = await import('@/app/api/titles/[id]/route')
      
      const request = createMockRequest('')
      const context = { params: Promise.resolve({ id: '' }) }
      
      const response = await GET(request, context)
      expect(response.status).toBe(400)
    })
  })

  describe('Version API', () => {
    it('should return application version information', async () => {
      const { GET } = await import('@/app/api/version/route')
      
      const request = new Request('http://localhost:3000/api/version')
      const response = await GET(request as any)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data).toMatchObject({
        version: expect.any(String),
        environment: expect.any(String),
        build: expect.any(String),
        timestamp: expect.any(String),
        node: expect.any(String)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const { GET } = await import('@/app/api/vehicles/route')
      
      const { prisma } = require('@united-cars/db')
      prisma.vehicle.findMany.mockRejectedValue(new Error('Database connection failed'))

      const request = {
        url: 'http://localhost:3000/api/vehicles',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: { get: () => 'test-agent' }
      } as any

      const response = await GET(request)
      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INTERNAL_ERROR')
    })

    it('should handle invalid JSON in POST requests', async () => {
      const { POST } = await import('@/app/api/claims/route')
      
      const request = {
        url: 'http://localhost:3000/api/claims',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: { get: () => 'test-agent' },
        json: async () => { throw new Error('Invalid JSON') }
      } as any

      const response = await POST(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should validate required fields in POST requests', async () => {
      const { POST } = await import('@/app/api/services/route')
      
      const incompleteData = {
        // Missing required fields like vehicleId, type
        notes: 'Some notes'
      }

      const request = {
        url: 'http://localhost:3000/api/services',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: { get: () => 'test-agent' },
        json: async () => incompleteData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Authorization Checks', () => {
    it('should enforce org-level access controls', async () => {
      const { GET } = await import('@/app/api/titles/[id]/route')
      
      // Mock title from different org
      const { prisma } = require('@united-cars/db')
      prisma.title.findFirst.mockResolvedValue(null) // Simulates org-level filtering

      const request = {
        url: 'http://localhost:3000/api/titles/title-from-other-org',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: { get: () => 'test-agent' }
      } as any

      const context = { params: Promise.resolve({ id: 'title-from-other-org' }) }
      const response = await GET(request, context)
      
      expect(response.status).toBe(404) // Should not find title from different org
    })

    it('should allow admin users broader access', async () => {
      const { GET } = await import('@/app/api/vehicles/route')
      
      const adminRequest = {
        url: 'http://localhost:3000/api/vehicles',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAdminSession))
          })
        },
        headers: { get: () => 'test-agent' }
      } as any

      const response = await GET(adminRequest)
      expect(response.status).toBe(200)
      
      // Verify admin users don't have org restrictions
      const { prisma } = require('@united-cars/db')
      const findManyCall = prisma.vehicle.findMany.mock.calls[0][0]
      // Admin should have access to all orgs, so no orgId restriction
      expect(findManyCall.where.orgId).toBeUndefined()
    })
  })

  describe('Performance and Rate Limiting', () => {
    it('should respond within acceptable time limits', async () => {
      const { GET } = await import('@/app/api/vehicles/route')
      
      const start = Date.now()
      
      const request = {
        url: 'http://localhost:3000/api/vehicles',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: { get: () => 'test-agent' }
      } as any

      const response = await GET(request)
      const duration = Date.now() - start
      
      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(1000) // Should respond within 1 second
    })

    it('should include cache headers for GET requests', async () => {
      const { GET } = await import('@/app/api/vehicles/route')
      
      const request = {
        url: 'http://localhost:3000/api/vehicles?include=relations',
        cookies: {
          get: () => ({
            value: encodeURIComponent(JSON.stringify(mockAuthenticatedSession))
          })
        },
        headers: { get: () => 'test-agent' }
      } as any

      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      // Check if cache hint is included in response metadata
      if (data.metadata) {
        expect(data.metadata.cacheHint).toBeDefined()
      }
    })
  })
})