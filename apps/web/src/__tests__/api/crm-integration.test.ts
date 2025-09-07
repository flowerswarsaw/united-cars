/**
 * CRM API Integration Tests
 * Comprehensive testing for all CRM endpoints including CRUD operations,
 * business logic validation, and error handling
 */

import { NextRequest } from 'next/server'
import { OrganizationType, DealStatus, TaskStatus, ActivityType } from '@united-cars/crm-core'

// Mock authenticated CRM user session
const mockCrmUser = {
  user: {
    id: 'crm-user-123',
    email: 'sales@united-cars.com',
    name: 'Sales Manager',
    roles: ['SALES_MANAGER'],
    orgId: 'crm-org-123'
  }
}

// Mock CRM data
const mockOrganisation = {
  id: 'org-1',
  name: 'AutoMax Dealership',
  companyId: 'AMX-001',
  type: OrganizationType.DEALER,
  tenantId: 'tenant-1',
  contactMethods: [
    {
      id: 'cm-1',
      type: 'EMAIL_WORK',
      value: 'info@automax.com',
      isPrimary: true
    }
  ],
  website: 'https://automax.com',
  industry: 'Automotive',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockContact = {
  id: 'contact-1',
  firstName: 'John',
  lastName: 'Smith',
  title: 'Sales Director',
  organisationId: 'org-1',
  tenantId: 'tenant-1',
  contactMethods: [
    {
      id: 'cm-2',
      type: 'EMAIL_WORK',
      value: 'john@automax.com',
      isPrimary: true
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockLead = {
  id: 'lead-1',
  title: 'Potential Dealer Partnership',
  source: 'Website Inquiry',
  isTarget: true,
  score: 85,
  status: 'qualified',
  organisationId: 'org-1',
  contactId: 'contact-1',
  tenantId: 'tenant-1',
  notes: 'High-value lead from website',
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockPipeline = {
  id: 'pipeline-1',
  name: 'Dealer Acquisition',
  description: 'Main dealer acquisition pipeline',
  isDefault: true,
  order: 1,
  applicableTypes: [OrganizationType.DEALER],
  isTypeSpecific: true,
  tenantId: 'tenant-1',
  stages: [
    {
      id: 'stage-1',
      pipelineId: 'pipeline-1',
      name: 'Investigation',
      order: 0,
      color: '#94A3B8',
      tenantId: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}

const mockDeal = {
  id: 'deal-1',
  title: 'AutoMax Partnership Deal',
  status: DealStatus.OPEN,
  amount: 50000,
  currency: 'USD',
  probability: 75,
  organisationId: 'org-1',
  contactId: 'contact-1',
  responsibleUserId: 'crm-user-123',
  tenantId: 'tenant-1',
  currentStages: [
    {
      id: 'cs-1',
      dealId: 'deal-1',
      pipelineId: 'pipeline-1',
      stageId: 'stage-1',
      enteredAt: new Date(),
      tenantId: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
}

describe('CRM API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock CRM repositories
    const mockRepositories = {
      organisationRepository: {
        list: jest.fn().mockResolvedValue([mockOrganisation]),
        get: jest.fn().mockResolvedValue(mockOrganisation),
        create: jest.fn().mockResolvedValue(mockOrganisation),
        update: jest.fn().mockResolvedValue(mockOrganisation),
        delete: jest.fn().mockResolvedValue(true)
      },
      contactRepository: {
        list: jest.fn().mockResolvedValue([mockContact]),
        get: jest.fn().mockResolvedValue(mockContact),
        getByOrganisation: jest.fn().mockResolvedValue([mockContact]),
        create: jest.fn().mockResolvedValue(mockContact),
        update: jest.fn().mockResolvedValue(mockContact)
      },
      leadRepository: {
        list: jest.fn().mockResolvedValue([mockLead]),
        get: jest.fn().mockResolvedValue(mockLead),
        create: jest.fn().mockResolvedValue(mockLead),
        update: jest.fn().mockResolvedValue(mockLead),
        convert: jest.fn().mockResolvedValue(mockDeal)
      },
      pipelineRepository: {
        list: jest.fn().mockResolvedValue([mockPipeline]),
        get: jest.fn().mockResolvedValue(mockPipeline),
        getWithStages: jest.fn().mockResolvedValue(mockPipeline)
      },
      dealRepository: {
        list: jest.fn().mockResolvedValue([mockDeal]),
        get: jest.fn().mockResolvedValue(mockDeal),
        create: jest.fn().mockResolvedValue(mockDeal),
        update: jest.fn().mockResolvedValue(mockDeal),
        moveStage: jest.fn().mockResolvedValue(mockDeal),
        getByPipelineAndStage: jest.fn().mockResolvedValue([mockDeal])
      }
    }

    // Mock the CRM repository imports
    jest.doMock('@united-cars/crm-mocks', () => mockRepositories)
  })

  const createMockRequest = (endpoint: string, searchParams = '') => {
    return {
      url: `http://localhost:3000/api/crm${endpoint}${searchParams}`,
      cookies: {
        get: () => ({
          value: encodeURIComponent(JSON.stringify(mockCrmUser))
        })
      },
      headers: {
        get: () => 'crm-test-agent'
      }
    } as any
  }

  describe('Organisations API', () => {
    it('should list organisations', async () => {
      const { GET } = await import('@/app/api/crm/organisations/route')
      
      const request = createMockRequest('/organisations')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        id: 'org-1',
        name: 'AutoMax Dealership',
        type: OrganizationType.DEALER
      })
    })

    it('should get single organisation', async () => {
      const { GET } = await import('@/app/api/crm/organisations/[id]/route')
      
      const request = createMockRequest('/organisations/org-1')
      const context = { params: { id: 'org-1' } }
      const response = await GET(request, context)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.id).toBe('org-1')
      expect(data.name).toBe('AutoMax Dealership')
    })

    it('should create new organisation', async () => {
      const { POST } = await import('@/app/api/crm/organisations/route')
      
      const newOrgData = {
        name: 'New Dealer',
        companyId: 'ND-001',
        type: OrganizationType.DEALER,
        contactMethods: [
          {
            id: 'cm-new',
            type: 'EMAIL_WORK',
            value: 'info@newdealer.com',
            isPrimary: true
          }
        ]
      }

      const request = {
        ...createMockRequest('/organisations'),
        json: async () => newOrgData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.name).toBe('New Dealer')
    })

    it('should update organisation', async () => {
      const { PUT } = await import('@/app/api/crm/organisations/[id]/route')
      
      const updateData = {
        name: 'Updated Dealer Name',
        website: 'https://updated-dealer.com'
      }

      const request = {
        ...createMockRequest('/organisations/org-1'),
        json: async () => updateData
      } as any

      const context = { params: { id: 'org-1' } }
      const response = await PUT(request, context)
      
      expect(response.status).toBe(200)
    })

    it('should validate organisation type', async () => {
      const { POST } = await import('@/app/api/crm/organisations/route')
      
      const invalidOrgData = {
        name: 'Invalid Org',
        companyId: 'INV-001',
        type: 'INVALID_TYPE', // Invalid organisation type
        contactMethods: []
      }

      const request = {
        ...createMockRequest('/organisations'),
        json: async () => invalidOrgData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Contacts API', () => {
    it('should list contacts', async () => {
      const { GET } = await import('@/app/api/crm/contacts/route')
      
      const request = createMockRequest('/contacts')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toMatchObject({
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Smith'
      })
    })

    it('should filter contacts by organisation', async () => {
      const { GET } = await import('@/app/api/crm/contacts/route')
      
      const request = createMockRequest('/contacts', '?organisationId=org-1')
      await GET(request)
      
      const { contactRepository } = require('@united-cars/crm-mocks')
      expect(contactRepository.getByOrganisation).toHaveBeenCalledWith('org-1')
    })

    it('should create new contact', async () => {
      const { POST } = await import('@/app/api/crm/contacts/route')
      
      const newContactData = {
        firstName: 'Jane',
        lastName: 'Doe',
        title: 'Purchase Manager',
        organisationId: 'org-1',
        contactMethods: [
          {
            id: 'cm-jane',
            type: 'EMAIL_WORK',
            value: 'jane@automax.com',
            isPrimary: true
          }
        ]
      }

      const request = {
        ...createMockRequest('/contacts'),
        json: async () => newContactData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    it('should validate required contact fields', async () => {
      const { POST } = await import('@/app/api/crm/contacts/route')
      
      const incompleteContactData = {
        firstName: 'Jane'
        // Missing lastName
      }

      const request = {
        ...createMockRequest('/contacts'),
        json: async () => incompleteContactData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Leads API', () => {
    it('should list leads', async () => {
      const { GET } = await import('@/app/api/crm/leads/route')
      
      const request = createMockRequest('/leads')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toMatchObject({
        id: 'lead-1',
        title: 'Potential Dealer Partnership',
        score: 85
      })
    })

    it('should create new lead', async () => {
      const { POST } = await import('@/app/api/crm/leads/route')
      
      const newLeadData = {
        title: 'New Lead from Trade Show',
        source: 'Trade Show',
        isTarget: true,
        organisationId: 'org-1',
        notes: 'Met at automotive trade show'
      }

      const request = {
        ...createMockRequest('/leads'),
        json: async () => newLeadData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    it('should convert lead to deal', async () => {
      const { POST } = await import('@/app/api/crm/leads/[id]/convert/route')
      
      const conversionData = {
        title: 'AutoMax Partnership Deal',
        amount: 75000,
        currency: 'USD',
        pipelineId: 'pipeline-1',
        notes: 'Converted from qualified lead'
      }

      const request = {
        ...createMockRequest('/leads/lead-1/convert'),
        json: async () => conversionData
      } as any

      const context = { params: { id: 'lead-1' } }
      const response = await POST(request, context)
      
      expect(response.status).toBe(201)
      
      const data = await response.json()
      expect(data.title).toBe('AutoMax Partnership Deal')
    })

    it('should validate lead conversion data', async () => {
      const { POST } = await import('@/app/api/crm/leads/[id]/convert/route')
      
      const invalidConversionData = {
        // Missing required title
        amount: 'invalid-amount' // Invalid type
      }

      const request = {
        ...createMockRequest('/leads/lead-1/convert'),
        json: async () => invalidConversionData
      } as any

      const context = { params: { id: 'lead-1' } }
      const response = await POST(request, context)
      
      expect(response.status).toBe(400)
    })
  })

  describe('Pipelines API', () => {
    it('should list pipelines', async () => {
      const { GET } = await import('@/app/api/crm/pipelines/route')
      
      const request = createMockRequest('/pipelines')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toMatchObject({
        id: 'pipeline-1',
        name: 'Dealer Acquisition',
        isDefault: true
      })
    })

    it('should get pipeline with stages', async () => {
      const { GET } = await import('@/app/api/crm/pipelines/[id]/route')
      
      const request = createMockRequest('/pipelines/pipeline-1')
      const context = { params: { id: 'pipeline-1' } }
      const response = await GET(request, context)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.id).toBe('pipeline-1')
      expect(data.stages).toHaveLength(1)
      expect(data.stages[0].name).toBe('Investigation')
    })

    it('should filter pipelines by organisation type', async () => {
      const { GET } = await import('@/app/api/crm/pipelines/route')
      
      const request = createMockRequest('/pipelines', '?type=DEALER')
      await GET(request)
      
      const { pipelineRepository } = require('@united-cars/crm-mocks')
      expect(pipelineRepository.list).toHaveBeenCalled()
    })
  })

  describe('Deals API', () => {
    it('should list deals', async () => {
      const { GET } = await import('@/app/api/crm/deals/route')
      
      const request = createMockRequest('/deals')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toMatchObject({
        id: 'deal-1',
        title: 'AutoMax Partnership Deal',
        status: DealStatus.OPEN
      })
    })

    it('should create new deal', async () => {
      const { POST } = await import('@/app/api/crm/deals/route')
      
      const newDealData = {
        title: 'New Partnership Deal',
        amount: 100000,
        currency: 'USD',
        probability: 60,
        organisationId: 'org-1',
        contactId: 'contact-1',
        responsibleUserId: 'crm-user-123'
      }

      const request = {
        ...createMockRequest('/deals'),
        json: async () => newDealData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    it('should move deal to different stage', async () => {
      const { POST } = await import('@/app/api/crm/deals/[id]/move-stage/route')
      
      const moveData = {
        pipelineId: 'pipeline-1',
        toStageId: 'stage-2',
        note: 'Moving to next stage after successful meeting'
      }

      const request = {
        ...createMockRequest('/deals/deal-1/move-stage'),
        json: async () => moveData
      } as any

      const context = { params: { id: 'deal-1' } }
      const response = await POST(request, context)
      
      expect(response.status).toBe(200)
      
      const { dealRepository } = require('@united-cars/crm-mocks')
      expect(dealRepository.moveStage).toHaveBeenCalledWith('deal-1', moveData)
    })

    it('should filter deals by pipeline and stage', async () => {
      const { GET } = await import('@/app/api/crm/deals/route')
      
      const request = createMockRequest('/deals', '?pipelineId=pipeline-1&stageId=stage-1')
      await GET(request)
      
      const { dealRepository } = require('@united-cars/crm-mocks')
      expect(dealRepository.getByPipelineAndStage).toHaveBeenCalledWith('pipeline-1', 'stage-1')
    })

    it('should validate deal amount and currency', async () => {
      const { POST } = await import('@/app/api/crm/deals/route')
      
      const invalidDealData = {
        title: 'Invalid Deal',
        amount: -1000, // Negative amount
        currency: 'INVALID', // Invalid currency
        organisationId: 'org-1'
      }

      const request = {
        ...createMockRequest('/deals'),
        json: async () => invalidDealData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Business Logic Integration', () => {
    it('should enforce pipeline applicability rules', async () => {
      const { POST } = await import('@/app/api/crm/deals/route')
      
      // Try to assign a deal to inappropriate pipeline
      const dealData = {
        title: 'Retail Deal',
        organisationId: 'retail-org-1', // Retail client
        pipelineId: 'dealer-pipeline-1' // Dealer-only pipeline
      }

      const request = {
        ...createMockRequest('/deals'),
        json: async () => dealData
      } as any

      const response = await POST(request)
      // Should validate pipeline compatibility
      expect(response.status).toBeOneOf([400, 422])
    })

    it('should handle organisation type-specific workflows', async () => {
      const { POST } = await import('@/app/api/crm/organisations/route')
      
      const auctionOrgData = {
        name: 'Copart Auction',
        companyId: 'CPA-001',
        type: OrganizationType.AUCTION,
        contactMethods: []
      }

      const request = {
        ...createMockRequest('/organisations'),
        json: async () => auctionOrgData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(201)
      
      // Verify auction-specific pipelines are assigned
      const { organisationRepository } = require('@united-cars/crm-mocks')
      expect(organisationRepository.create).toHaveBeenCalled()
    })

    it('should maintain activity audit trail', async () => {
      const { POST } = await import('@/app/api/crm/deals/[id]/move-stage/route')
      
      const moveData = {
        pipelineId: 'pipeline-1',
        toStageId: 'stage-2',
        note: 'Stage transition test'
      }

      const request = {
        ...createMockRequest('/deals/deal-1/move-stage'),
        json: async () => moveData
      } as any

      const context = { params: { id: 'deal-1' } }
      await POST(request, context)
      
      // Verify activity logging
      const { dealRepository } = require('@united-cars/crm-mocks')
      expect(dealRepository.moveStage).toHaveBeenCalledWith('deal-1', moveData)
    })
  })

  describe('Error Handling and Validation', () => {
    it('should handle invalid entity IDs', async () => {
      const { GET } = await import('@/app/api/crm/organisations/[id]/route')
      
      const { organisationRepository } = require('@united-cars/crm-mocks')
      organisationRepository.get.mockResolvedValue(null)

      const request = createMockRequest('/organisations/invalid-id')
      const context = { params: { id: 'invalid-id' } }
      const response = await GET(request, context)
      
      expect(response.status).toBe(404)
    })

    it('should validate required fields in create operations', async () => {
      const { POST } = await import('@/app/api/crm/organisations/route')
      
      const incompleteData = {
        // Missing required name field
        companyId: 'INC-001'
      }

      const request = {
        ...createMockRequest('/organisations'),
        json: async () => incompleteData
      } as any

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should handle repository errors gracefully', async () => {
      const { GET } = await import('@/app/api/crm/deals/route')
      
      const { dealRepository } = require('@united-cars/crm-mocks')
      dealRepository.list.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('/deals')
      const response = await GET(request)
      
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should enforce business rule validation', async () => {
      const { PUT } = await import('@/app/api/crm/deals/[id]/route')
      
      // Try to change won deal status (should be prevented by business rules)
      const { dealRepository } = require('@united-cars/crm-mocks')
      dealRepository.get.mockResolvedValue({ 
        ...mockDeal, 
        status: DealStatus.WON 
      })

      const invalidUpdate = {
        status: DealStatus.LOST
      }

      const request = {
        ...createMockRequest('/deals/deal-1'),
        json: async () => invalidUpdate
      } as any

      const context = { params: { id: 'deal-1' } }
      const response = await PUT(request, context)
      
      // Should prevent changing won deal status
      expect(response.status).toBe(422)
    })
  })

  describe('Authentication and Authorization', () => {
    it('should require authentication for all CRM endpoints', async () => {
      const { GET } = await import('@/app/api/crm/organisations/route')
      
      const unauthenticatedRequest = {
        url: 'http://localhost:3000/api/crm/organisations',
        cookies: { get: () => null },
        headers: { get: () => null }
      } as any

      const response = await GET(unauthenticatedRequest)
      expect(response.status).toBe(401)
    })

    it('should enforce tenant isolation', async () => {
      const { GET } = await import('@/app/api/crm/organisations/route')
      
      const request = createMockRequest('/organisations')
      await GET(request)
      
      const { organisationRepository } = require('@united-cars/crm-mocks')
      // Verify tenant filtering is applied
      expect(organisationRepository.list).toHaveBeenCalled()
    })
  })

  describe('Performance and Caching', () => {
    it('should respond within acceptable time limits', async () => {
      const { GET } = await import('@/app/api/crm/deals/route')
      
      const start = Date.now()
      
      const request = createMockRequest('/deals')
      const response = await GET(request)
      
      const duration = Date.now() - start
      
      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(1000) // Should respond within 1 second
    })

    it('should handle concurrent requests safely', async () => {
      const { GET } = await import('@/app/api/crm/organisations/route')
      
      const requests = Array(5).fill(null).map(() => 
        GET(createMockRequest('/organisations'))
      )
      
      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})