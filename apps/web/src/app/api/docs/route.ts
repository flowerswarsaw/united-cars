import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  
  const apiDocs = {
    openapi: '3.0.3',
    info: {
      title: 'United Cars CRM API',
      version: '1.0.0',
      description: 'Enterprise CRM system for automotive industry with organizations, contacts, deals, leads, and task management.',
      contact: {
        name: 'United Cars',
        url: baseUrl
      }
    },
    servers: [
      {
        url: `${baseUrl}/api`,
        description: 'Production API'
      }
    ],
    tags: [
      { name: 'Health', description: 'System health and monitoring' },
      { name: 'Organizations', description: 'Organization management' },
      { name: 'Contacts', description: 'Contact management' },
      { name: 'Deals', description: 'Deal pipeline management' },
      { name: 'Leads', description: 'Lead management and conversion' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'Pipelines', description: 'Pipeline configuration' }
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'System health check',
          description: 'Comprehensive health check including database, CRM system, and persistence layer',
          responses: {
            200: {
              description: 'System is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                      timestamp: { type: 'string', format: 'date-time' },
                      responseTime: { type: 'string' },
                      uptime: { type: 'number' },
                      checks: {
                        type: 'object',
                        properties: {
                          database: { type: 'object' },
                          crm: { type: 'object' },
                          persistence: { type: 'object' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/metrics': {
        get: {
          tags: ['Health'],
          summary: 'System performance metrics',
          description: 'Detailed performance metrics for monitoring and observability',
          responses: {
            200: {
              description: 'Performance metrics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      responseTime: { type: 'string' },
                      system: { type: 'object' },
                      crm: { type: 'object' },
                      persistence: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/crm/organisations': {
        get: {
          tags: ['Organizations'],
          summary: 'List organizations',
          description: 'Get all organizations with optional filtering',
          parameters: [
            {
              name: 'search',
              in: 'query',
              description: 'Search term for organization name, company ID, industry, or email',
              schema: { type: 'string' }
            },
            {
              name: 'type',
              in: 'query',
              description: 'Filter by organization type',
              schema: { 
                type: 'string',
                enum: ['AUCTION_HOUSE', 'DEALER', 'SHIPPER', 'PROCESSING_CENTER', 'INSURANCE_COMPANY']
              }
            },
            {
              name: 'industry',
              in: 'query',
              description: 'Filter by industry',
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'List of organizations',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Organization' }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Organizations'],
          summary: 'Create organization',
          description: 'Create a new organization',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateOrganization' }
              }
            }
          },
          responses: {
            201: {
              description: 'Organization created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Organization' }
                }
              }
            }
          }
        }
      },
      '/crm/organisations/{id}': {
        get: {
          tags: ['Organizations'],
          summary: 'Get organization',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Organization details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Organization' }
                }
              }
            }
          }
        },
        patch: {
          tags: ['Organizations'],
          summary: 'Update organization',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateOrganization' }
              }
            }
          },
          responses: {
            200: {
              description: 'Organization updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Organization' }
                }
              }
            }
          }
        }
      },
      '/crm/deals': {
        get: {
          tags: ['Deals'],
          summary: 'List deals',
          description: 'Get all deals with optional filtering by stage and pipeline',
          parameters: [
            {
              name: 'stageId',
              in: 'query',
              description: 'Filter by stage ID',
              schema: { type: 'string' }
            },
            {
              name: 'pipelineId',
              in: 'query',
              description: 'Filter by pipeline ID',
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'List of deals',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Deal' }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Deals'],
          summary: 'Create deal',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateDeal' }
              }
            }
          },
          responses: {
            201: {
              description: 'Deal created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Deal' }
                }
              }
            }
          }
        }
      },
      '/crm/deals/{id}': {
        get: {
          tags: ['Deals'],
          summary: 'Get deal',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Deal details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Deal' }
                }
              }
            }
          }
        },
        patch: {
          tags: ['Deals'],
          summary: 'Update deal',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateDeal' }
              }
            }
          },
          responses: {
            200: {
              description: 'Deal updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Deal' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['AUCTION_HOUSE', 'DEALER', 'SHIPPER', 'PROCESSING_CENTER', 'INSURANCE_COMPANY']
            },
            companyId: { type: 'string', nullable: true },
            industry: { type: 'string', nullable: true },
            size: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            website: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            state: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            zipCode: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateOrganization: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['AUCTION_HOUSE', 'DEALER', 'SHIPPER', 'PROCESSING_CENTER', 'INSURANCE_COMPANY']
            },
            companyId: { type: 'string' },
            industry: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            zipCode: { type: 'string' }
          }
        },
        UpdateOrganization: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            companyId: { type: 'string' },
            industry: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            address: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            zipCode: { type: 'string' }
          }
        },
        Deal: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            value: { type: 'number', nullable: true },
            currency: { type: 'string', default: 'USD' },
            probability: { type: 'number', minimum: 0, maximum: 1 },
            expectedCloseDate: { type: 'string', format: 'date', nullable: true },
            actualCloseDate: { type: 'string', format: 'date', nullable: true },
            lossReason: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            organisationId: { type: 'string', format: 'uuid', nullable: true },
            contactId: { type: 'string', format: 'uuid', nullable: true },
            pipelineId: { type: 'string', format: 'uuid' },
            stageId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CreateDeal: {
          type: 'object',
          required: ['title', 'pipelineId', 'stageId'],
          properties: {
            title: { type: 'string' },
            value: { type: 'number' },
            currency: { type: 'string', default: 'USD' },
            probability: { type: 'number', minimum: 0, maximum: 1 },
            expectedCloseDate: { type: 'string', format: 'date' },
            organisationId: { type: 'string', format: 'uuid' },
            contactId: { type: 'string', format: 'uuid' },
            pipelineId: { type: 'string', format: 'uuid' },
            stageId: { type: 'string', format: 'uuid' },
            notes: { type: 'string' }
          }
        },
        UpdateDeal: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            value: { type: 'number' },
            currency: { type: 'string' },
            probability: { type: 'number', minimum: 0, maximum: 1 },
            expectedCloseDate: { type: 'string', format: 'date' },
            actualCloseDate: { type: 'string', format: 'date' },
            stageId: { type: 'string', format: 'uuid' },
            lossReason: { type: 'string' },
            notes: { type: 'string' }
          }
        }
      }
    }
  };

  return NextResponse.json(apiDocs);
}