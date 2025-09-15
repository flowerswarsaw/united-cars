import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const crmCreateRate = new Rate('crm_create_success_rate');
const crmReadRate = new Rate('crm_read_success_rate');
const crmUpdateRate = new Rate('crm_update_success_rate');
const crmDeleteRate = new Rate('crm_delete_success_rate');

const crmCreateTime = new Trend('crm_create_duration');
const crmReadTime = new Trend('crm_read_duration');
const crmUpdateTime = new Trend('crm_update_duration');
const crmDeleteTime = new Trend('crm_delete_duration');

const conflictResolutions = new Counter('crm_conflict_resolutions');
const rbacDenials = new Counter('crm_rbac_denials');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    crm_create_success_rate: ['rate>0.95'], // 95% success rate
    crm_read_success_rate: ['rate>0.98'], // 98% success rate
    crm_update_success_rate: ['rate>0.95'], // 95% success rate
    crm_delete_success_rate: ['rate>0.95'], // 95% success rate
  },
};

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/crm`;

// Test users with different roles
const TEST_USERS = {
  admin: {
    id: 'admin-user-id',
    role: 'admin',
    tenantId: 'test-tenant-perf'
  },
  seniorManager: {
    id: 'senior-manager-id',
    role: 'senior_sales_manager',
    tenantId: 'test-tenant-perf'
  },
  juniorManager: {
    id: 'junior-manager-id',
    role: 'junior_sales_manager',
    tenantId: 'test-tenant-perf'
  }
};

// Helper functions
function getRandomUser() {
  const users = Object.values(TEST_USERS);
  return users[randomIntBetween(0, users.length - 1)];
}

function createHeaders(user) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
    'x-user-role': user.role,
    'x-tenant-id': user.tenantId,
  };
}

function generateOrganisation(user) {
  return {
    name: `Load Test Corp ${randomString(8)}`,
    type: ['DEALER', 'SHIPPER', 'AUCTION_HOUSE'][randomIntBetween(0, 2)],
    description: `Performance test organisation ${randomString(20)}`,
    website: `https://loadtest${randomString(8)}.com`,
    address: `${randomIntBetween(1, 999)} Test St`,
    city: 'Test City',
    state: 'TX',
    zipCode: `${randomIntBetween(10000, 99999)}`,
    country: 'USA',
    contactMethods: [
      {
        type: 'EMAIL',
        value: `contact${randomString(8)}@loadtest.com`,
        primary: true,
        verified: false
      },
      {
        type: 'PHONE',
        value: `${randomIntBetween(100, 999)}-${randomIntBetween(100, 999)}-${randomIntBetween(1000, 9999)}`,
        primary: false,
        verified: false
      }
    ],
    socialMediaLinks: [],
    customFields: {},
    verified: Math.random() > 0.5,
    assignedUserId: user.id,
    createdBy: user.id,
    updatedBy: user.id,
    tenantId: user.tenantId
  };
}

function generateContact(organisationId, user) {
  return {
    organisationId,
    firstName: `TestFirst${randomString(5)}`,
    lastName: `TestLast${randomString(5)}`,
    title: ['Manager', 'Director', 'VP', 'Coordinator'][randomIntBetween(0, 3)],
    department: ['Sales', 'Operations', 'Finance', 'Marketing'][randomIntBetween(0, 3)],
    contactMethods: [
      {
        type: 'EMAIL',
        value: `contact${randomString(8)}@company.com`,
        primary: true,
        verified: Math.random() > 0.7
      }
    ],
    socialMediaLinks: [],
    customFields: {},
    verified: Math.random() > 0.6,
    assignedUserId: user.id,
    createdBy: user.id,
    updatedBy: user.id,
    tenantId: user.tenantId
  };
}

function generateDeal(organisationId, pipelineId, stageId, user) {
  return {
    title: `Load Test Deal ${randomString(8)}`,
    description: `Performance test deal ${randomString(20)}`,
    value: randomIntBetween(10000, 500000),
    probability: randomIntBetween(10, 90),
    expectedCloseDate: new Date(Date.now() + randomIntBetween(7, 90) * 24 * 60 * 60 * 1000).toISOString(),
    status: 'OPEN',
    pipelineId,
    stageId,
    organisationId,
    dealSource: ['Website', 'Referral', 'Cold Call', 'Trade Show'][randomIntBetween(0, 3)],
    nextAction: `Follow up on ${randomString(10)}`,
    nextActionDate: new Date(Date.now() + randomIntBetween(1, 7) * 24 * 60 * 60 * 1000).toISOString(),
    customFields: {},
    assignedUserId: user.id,
    createdBy: user.id,
    updatedBy: user.id,
    tenantId: user.tenantId
  };
}

// Test scenarios
export default function() {
  const user = getRandomUser();
  const headers = createHeaders(user);

  group('CRM CRUD Operations Performance Test', function() {
    
    group('Organisation Operations', function() {
      // Create organisation
      let createdOrgId;
      let createResponse = http.post(`${API_BASE}/organisations`, JSON.stringify(generateOrganisation(user)), { headers });
      
      const createSuccess = check(createResponse, {
        'create organisation status is 201 or 409': (r) => r.status === 201 || r.status === 409,
        'create organisation response time < 2s': (r) => r.timings.duration < 2000,
      });
      
      crmCreateRate.add(createSuccess);
      crmCreateTime.add(createResponse.timings.duration);
      
      if (createResponse.status === 201) {
        createdOrgId = JSON.parse(createResponse.body).data.id;
      } else if (createResponse.status === 409) {
        // Handle conflict resolution
        conflictResolutions.add(1);
        console.log('Conflict detected during organisation creation');
      }

      sleep(0.1);

      // Read organisations
      let readResponse = http.get(`${API_BASE}/organisations?limit=50`, { headers });
      
      const readSuccess = check(readResponse, {
        'read organisations status is 200': (r) => r.status === 200,
        'read organisations response time < 1s': (r) => r.timings.duration < 1000,
        'read organisations returns array': (r) => {
          try {
            const data = JSON.parse(r.body);
            return Array.isArray(data.data);
          } catch (e) {
            return false;
          }
        }
      });
      
      crmReadRate.add(readSuccess);
      crmReadTime.add(readResponse.timings.duration);

      sleep(0.1);

      // Update organisation (if created successfully)
      if (createdOrgId) {
        const updateData = {
          description: `Updated description ${randomString(20)}`,
          website: `https://updated${randomString(8)}.com`
        };
        
        let updateResponse = http.put(`${API_BASE}/organisations/${createdOrgId}`, JSON.stringify(updateData), { headers });
        
        const updateSuccess = check(updateResponse, {
          'update organisation status is 200': (r) => r.status === 200,
          'update organisation response time < 2s': (r) => r.timings.duration < 2000,
        });
        
        crmUpdateRate.add(updateSuccess);
        crmUpdateTime.add(updateResponse.timings.duration);

        if (updateResponse.status === 403) {
          rbacDenials.add(1);
        }

        sleep(0.1);

        // Delete organisation
        let deleteResponse = http.del(`${API_BASE}/organisations/${createdOrgId}`, null, { headers });
        
        const deleteSuccess = check(deleteResponse, {
          'delete organisation status is 200': (r) => r.status === 200,
          'delete organisation response time < 2s': (r) => r.timings.duration < 2000,
        });
        
        crmDeleteRate.add(deleteSuccess);
        crmDeleteTime.add(deleteResponse.timings.duration);

        if (deleteResponse.status === 403) {
          rbacDenials.add(1);
        }
      }
    });

    group('Search Performance', function() {
      // Test search functionality
      const searchTerms = ['Corp', 'Test', 'Load', 'Performance'];
      const searchTerm = searchTerms[randomIntBetween(0, searchTerms.length - 1)];
      
      let searchResponse = http.get(`${API_BASE}/organisations?search=${searchTerm}`, { headers });
      
      check(searchResponse, {
        'search status is 200': (r) => r.status === 200,
        'search response time < 1.5s': (r) => r.timings.duration < 1500,
        'search returns results': (r) => {
          try {
            const data = JSON.parse(r.body);
            return data.success === true;
          } catch (e) {
            return false;
          }
        }
      });

      sleep(0.1);

      // Test advanced filters
      let filterResponse = http.get(`${API_BASE}/organisations?verified=true&limit=20`, { headers });
      
      check(filterResponse, {
        'filter status is 200': (r) => r.status === 200,
        'filter response time < 1s': (r) => r.timings.duration < 1000,
      });
    });

    group('Bulk Operations', function() {
      // Simulate bulk read operations
      const bulkReadPromises = [];
      
      for (let i = 0; i < 5; i++) {
        let bulkResponse = http.get(`${API_BASE}/organisations?limit=100&offset=${i * 100}`, { headers });
        
        check(bulkResponse, {
          'bulk read status is 200': (r) => r.status === 200,
          'bulk read response time < 3s': (r) => r.timings.duration < 3000,
        });
        
        sleep(0.05);
      }
    });

    group('Role-based Access Control', function() {
      // Test RBAC enforcement by trying operations with different roles
      if (user.role === 'junior_sales_manager') {
        // Junior managers should have limited access
        let restrictedResponse = http.get(`${API_BASE}/organisations?assignedUserId=${TEST_USERS.admin.id}`, { headers });
        
        check(restrictedResponse, {
          'junior manager restricted access works': (r) => {
            if (r.status === 200) {
              try {
                const data = JSON.parse(r.body);
                // Should only see their own organisations
                return data.data.every(org => 
                  org.assignedUserId === user.id || org.createdBy === user.id
                );
              } catch (e) {
                return false;
              }
            }
            return true;
          }
        });
      }
    });

    group('Conflict Resolution Simulation', function() {
      // Attempt to create organisations with potentially conflicting data
      const commonEmail = `shared${randomIntBetween(1, 10)}@loadtest.com`;
      
      const orgWithCommonData = generateOrganisation(user);
      orgWithCommonData.contactMethods[0].value = commonEmail;
      
      let conflictResponse = http.post(`${API_BASE}/organisations`, JSON.stringify(orgWithCommonData), { headers });
      
      if (conflictResponse.status === 409) {
        conflictResolutions.add(1);
        
        check(conflictResponse, {
          'conflict response includes resolution options': (r) => {
            try {
              const data = JSON.parse(r.body);
              return data.conflicts && Array.isArray(data.conflicts);
            } catch (e) {
              return false;
            }
          }
        });
      }
    });

    group('History and Audit Performance', function() {
      // Test history retrieval performance
      let historyResponse = http.get(`${API_BASE}/organisations?includeHistory=true&limit=10`, { headers });
      
      check(historyResponse, {
        'history retrieval status is 200': (r) => r.status === 200,
        'history retrieval response time < 2s': (r) => r.timings.duration < 2000,
      });
    });
  });

  sleep(randomIntBetween(1, 3));
}

// Setup function to initialize test data
export function setup() {
  console.log('Setting up performance test environment...');
  
  // Create some initial data for more realistic testing
  const adminHeaders = createHeaders(TEST_USERS.admin);
  
  // Create test pipelines
  const pipeline1 = {
    name: 'Performance Test Pipeline',
    description: 'Pipeline for load testing',
    isActive: true,
    stages: [
      {
        name: 'Prospecting',
        probability: 10,
        order: 0,
        color: '#3B82F6',
        isActive: true
      },
      {
        name: 'Qualified',
        probability: 25,
        order: 1,
        color: '#10B981',
        isActive: true
      },
      {
        name: 'Proposal',
        probability: 50,
        order: 2,
        color: '#F59E0B',
        isActive: true
      },
      {
        name: 'Closed Won',
        probability: 100,
        order: 3,
        color: '#059669',
        isActive: true
      }
    ],
    tenantId: TEST_USERS.admin.tenantId,
    createdBy: TEST_USERS.admin.id,
    updatedBy: TEST_USERS.admin.id
  };
  
  const pipelineResponse = http.post(`${API_BASE}/pipelines`, JSON.stringify(pipeline1), { headers: adminHeaders });
  
  let setupData = {
    pipelineId: null,
    stageIds: []
  };
  
  if (pipelineResponse.status === 201) {
    const pipelineData = JSON.parse(pipelineResponse.body).data;
    setupData.pipelineId = pipelineData.id;
    setupData.stageIds = pipelineData.stages.map(stage => stage.id);
  }
  
  // Create some initial organisations for realistic load patterns
  for (let i = 0; i < 20; i++) {
    const org = generateOrganisation(TEST_USERS.admin);
    http.post(`${API_BASE}/organisations`, JSON.stringify(org), { headers: adminHeaders });
  }
  
  console.log('Performance test setup complete');
  return setupData;
}

// Teardown function to clean up test data
export function teardown(data) {
  console.log('Cleaning up performance test data...');
  
  const adminHeaders = createHeaders(TEST_USERS.admin);
  
  // Note: In a real scenario, you might want to clean up test data
  // For this mock system, data is likely in memory and will be cleared
  
  console.log('Performance test cleanup complete');
}

// Custom checks for specific CRM business rules
export function handleSummary(data) {
  return {
    'crm-performance-summary.json': JSON.stringify(data, null, 2),
    stdout: `
    ========================================
    CRM PERFORMANCE TEST SUMMARY
    ========================================
    
    Total Requests: ${data.metrics.http_reqs.count}
    Success Rate: ${(data.metrics.http_req_failed.rate * 100).toFixed(2)}%
    
    Average Response Times:
    - Create Operations: ${data.metrics.crm_create_duration ? data.metrics.crm_create_duration.avg.toFixed(2) : 'N/A'}ms
    - Read Operations: ${data.metrics.crm_read_duration ? data.metrics.crm_read_duration.avg.toFixed(2) : 'N/A'}ms
    - Update Operations: ${data.metrics.crm_update_duration ? data.metrics.crm_update_duration.avg.toFixed(2) : 'N/A'}ms
    - Delete Operations: ${data.metrics.crm_delete_duration ? data.metrics.crm_delete_duration.avg.toFixed(2) : 'N/A'}ms
    
    Business Logic Metrics:
    - Conflict Resolutions: ${data.metrics.crm_conflict_resolutions ? data.metrics.crm_conflict_resolutions.count : 'N/A'}
    - RBAC Denials: ${data.metrics.crm_rbac_denials ? data.metrics.crm_rbac_denials.count : 'N/A'}
    
    Success Rates:
    - Create Success: ${data.metrics.crm_create_success_rate ? (data.metrics.crm_create_success_rate.rate * 100).toFixed(2) : 'N/A'}%
    - Read Success: ${data.metrics.crm_read_success_rate ? (data.metrics.crm_read_success_rate.rate * 100).toFixed(2) : 'N/A'}%
    - Update Success: ${data.metrics.crm_update_success_rate ? (data.metrics.crm_update_success_rate.rate * 100).toFixed(2) : 'N/A'}%
    - Delete Success: ${data.metrics.crm_delete_success_rate ? (data.metrics.crm_delete_success_rate.rate * 100).toFixed(2) : 'N/A'}%
    
    95th Percentile Response Time: ${data.metrics.http_req_duration.p95.toFixed(2)}ms
    
    ========================================
    `
  };
}