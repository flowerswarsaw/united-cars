import { users, roles, userRoles } from './data/users';
import { organizations } from './data/organizations';
import { vehicles } from './data/vehicles';
import { serviceRequests, insuranceClaims, titles, vehicleIntakes } from './data/services';
import { invoices, paymentIntents } from './data/financial';
import bcrypt from 'bcryptjs';

// In-memory storage (acts like our database)
class MockDatabase {
  private data = {
    users: [...users],
    roles: [...roles],
    userRoles: [...userRoles],
    organizations: [...organizations],
    vehicles: [...vehicles],
    serviceRequests: [...serviceRequests],
    insuranceClaims: [...insuranceClaims],
    titles: [...titles],
    vehicleIntakes: [...vehicleIntakes],
    invoices: [...invoices],
    paymentIntents: [...paymentIntents]
  };

  // User operations
  users = {
    findMany: (filter?: any) => {
      let result = [...this.data.users];
      if (filter?.where?.orgId) {
        result = result.filter(u => u.orgId === filter.where.orgId);
      }
      return Promise.resolve(result);
    },
    
    findUnique: (params: { where: { email?: string; id?: string } }) => {
      const user = this.data.users.find(u => 
        u.email === params.where.email || u.id === params.where.id
      );
      return Promise.resolve(user || null);
    },

    findWithRoles: async (email: string) => {
      const user = this.data.users.find(u => u.email === email);
      if (!user) return null;
      
      const userRoles = this.data.userRoles.filter(ur => ur.userId === user.id);
      const roleKeys = userRoles.map(ur => {
        const role = this.data.roles.find(r => r.id === ur.roleId);
        return role?.key;
      }).filter(Boolean);
      
      const org = this.data.organizations.find(o => o.id === user.orgId);
      
      return {
        ...user,
        org,
        roles: roleKeys
      };
    },

    verifyPassword: async (email: string, password: string) => {
      const user = this.data.users.find(u => u.email === email);
      if (!user) return null;
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;
      
      return this.users.findWithRoles(email);
    }
  };

  // Organization operations
  organizations = {
    findMany: () => Promise.resolve([...this.data.organizations]),
    findById: (id: string) => Promise.resolve(this.data.organizations.find(o => o.id === id) || null)
  };

  // Vehicle operations
  vehicles = {
    findMany: (filter?: any) => {
      let result = [...this.data.vehicles];
      
      // Filter by organization
      if (filter?.where?.orgId) {
        result = result.filter(v => v.orgId === filter.where.orgId);
      }
      
      // Filter by status
      if (filter?.where?.status) {
        result = result.filter(v => v.status === filter.where.status);
      }
      
      // Search
      if (filter?.where?.OR) {
        const searchTerm = filter.where.OR[0]?.vin?.contains?.toLowerCase();
        if (searchTerm) {
          result = result.filter(v => 
            v.vin?.toLowerCase().includes(searchTerm) ||
            v.make?.toLowerCase().includes(searchTerm) ||
            v.model?.toLowerCase().includes(searchTerm)
          );
        }
      }
      
      // Pagination
      const page = filter?.skip ? Math.floor(filter.skip / (filter.take || 25)) + 1 : 1;
      const perPage = filter?.take || 25;
      const start = (page - 1) * perPage;
      const paginatedResult = result.slice(start, start + perPage);
      
      return Promise.resolve({
        data: paginatedResult,
        total: result.length,
        page,
        perPage,
        totalPages: Math.ceil(result.length / perPage)
      });
    },
    
    findById: (id: string) => {
      return Promise.resolve(this.data.vehicles.find(v => v.id === id) || null);
    },
    
    create: (data: any) => {
      const newVehicle = {
        id: `vehicle-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      this.data.vehicles.push(newVehicle);
      return Promise.resolve(newVehicle);
    },
    
    update: (id: string, data: any) => {
      const index = this.data.vehicles.findIndex(v => v.id === id);
      if (index === -1) return Promise.resolve(null);
      
      this.data.vehicles[index] = {
        ...this.data.vehicles[index],
        ...data,
        updatedAt: new Date()
      };
      return Promise.resolve(this.data.vehicles[index]);
    },
    
    delete: (id: string) => {
      const index = this.data.vehicles.findIndex(v => v.id === id);
      if (index === -1) return Promise.resolve(false);
      
      this.data.vehicles.splice(index, 1);
      return Promise.resolve(true);
    },

    count: (filter?: any) => {
      let result = [...this.data.vehicles];
      if (filter?.where?.orgId) {
        result = result.filter(v => v.orgId === filter.where.orgId);
      }
      return Promise.resolve(result.length);
    }
  };

  // Service requests operations
  serviceRequests = {
    findMany: (filter?: any) => {
      let result = [...this.data.serviceRequests];
      if (filter?.where?.orgId) {
        result = result.filter(s => s.orgId === filter.where.orgId);
      }
      if (filter?.where?.vehicleId) {
        if (typeof filter.where.vehicleId === 'string') {
          result = result.filter(s => s.vehicleId === filter.where.vehicleId);
        } else if (filter.where.vehicleId.in) {
          result = result.filter(s => filter.where.vehicleId.in.includes(s.vehicleId));
        } else if (filter.where.vehicleId === 'no-match') {
          result = [];
        }
      }
      
      // Enrich service requests with vehicle and org information
      const enrichedResult = result.map(service => {
        const vehicle = this.data.vehicles.find(v => v.id === service.vehicleId);
        const org = this.data.organizations.find(o => o.id === service.orgId);
        
        return {
          ...service,
          vehicle: vehicle ? {
            id: vehicle.id,
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            status: vehicle.status,
            org: org ? {
              id: org.id,
              name: org.name,
              type: org.type
            } : null
          } : null,
          org: org ? {
            id: org.id,
            name: org.name,
            type: org.type
          } : null
        };
      });
      
      return Promise.resolve(enrichedResult);
    },
    
    findById: (id: string) => {
      const service = this.data.serviceRequests.find(s => s.id === id);
      if (!service) return Promise.resolve(null);
      
      const vehicle = this.data.vehicles.find(v => v.id === service.vehicleId);
      const org = this.data.organizations.find(o => o.id === service.orgId);
      
      return Promise.resolve({
        ...service,
        vehicle: vehicle ? {
          id: vehicle.id,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          status: vehicle.status,
          org: org ? {
            id: org.id,
            name: org.name,
            type: org.type
          } : null
        } : null,
        org: org ? {
          id: org.id,
          name: org.name,
          type: org.type
        } : null
      });
    },
    
    updateStatus: (id: string, status: any) => {
      const index = this.data.serviceRequests.findIndex(s => s.id === id);
      if (index === -1) return Promise.resolve(null);
      
      this.data.serviceRequests[index].status = status;
      this.data.serviceRequests[index].updatedAt = new Date();
      this.data.serviceRequests[index].version++;
      
      return Promise.resolve(this.data.serviceRequests[index]);
    }
  };

  // Insurance claims operations
  insuranceClaims = {
    findMany: (filter?: any) => {
      let result = [...this.data.insuranceClaims];
      if (filter?.where?.orgId) {
        result = result.filter(c => c.orgId === filter.where.orgId);
      }
      if (filter?.where?.vehicleId) {
        if (typeof filter.where.vehicleId === 'string') {
          result = result.filter(c => c.vehicleId === filter.where.vehicleId);
        } else if (filter.where.vehicleId.in) {
          result = result.filter(c => filter.where.vehicleId.in.includes(c.vehicleId));
        } else if (filter.where.vehicleId === 'no-match') {
          result = [];
        }
      }
      
      // Enrich claims with vehicle and org information
      const enrichedResult = result.map(claim => {
        const vehicle = this.data.vehicles.find(v => v.id === claim.vehicleId);
        const org = this.data.organizations.find(o => o.id === claim.orgId);
        
        return {
          ...claim,
          vehicle: vehicle ? {
            id: vehicle.id,
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            status: vehicle.status,
            org: org ? {
              id: org.id,
              name: org.name,
              type: org.type
            } : null
          } : null,
          org: org ? {
            id: org.id,
            name: org.name,
            type: org.type
          } : null
        };
      });
      
      return Promise.resolve(enrichedResult);
    },
    
    findById: (id: string) => {
      const claim = this.data.insuranceClaims.find(c => c.id === id);
      if (!claim) return Promise.resolve(null);
      
      const vehicle = this.data.vehicles.find(v => v.id === claim.vehicleId);
      const org = this.data.organizations.find(o => o.id === claim.orgId);
      
      return Promise.resolve({
        ...claim,
        vehicle: vehicle ? {
          id: vehicle.id,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          status: vehicle.status,
          org: org ? {
            id: org.id,
            name: org.name,
            type: org.type
          } : null
        } : null,
        org: org ? {
          id: org.id,
          name: org.name,
          type: org.type
        } : null
      });
    },
    
    updateStatus: (id: string, status: any) => {
      const index = this.data.insuranceClaims.findIndex(c => c.id === id);
      if (index === -1) return Promise.resolve(null);
      
      this.data.insuranceClaims[index].status = status;
      this.data.insuranceClaims[index].updatedAt = new Date();
      this.data.insuranceClaims[index].version++;
      
      return Promise.resolve(this.data.insuranceClaims[index]);
    }
  };

  // Titles operations
  titles = {
    findMany: (filter?: any) => {
      let result = [...this.data.titles];
      if (filter?.where?.vehicleId) {
        if (typeof filter.where.vehicleId === 'string') {
          // Single vehicleId filter
          result = result.filter(t => t.vehicleId === filter.where.vehicleId);
        } else if (filter.where.vehicleId.in) {
          // Multiple vehicleIds filter
          result = result.filter(t => filter.where.vehicleId.in.includes(t.vehicleId));
        } else if (filter.where.vehicleId === 'no-match') {
          // No match case
          result = [];
        }
      }
      
      // Enrich titles with vehicle information
      const enrichedResult = result.map(title => {
        const vehicle = this.data.vehicles.find(v => v.id === title.vehicleId);
        if (vehicle) {
          const org = this.data.organizations.find(o => o.id === vehicle.orgId);
          return {
            ...title,
            vehicle: {
              id: vehicle.id,
              vin: vehicle.vin,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              status: vehicle.status,
              org: org ? {
                id: org.id,
                name: org.name,
                type: org.type
              } : null
            }
          };
        }
        return {
          ...title,
          vehicle: null
        };
      });
      
      return Promise.resolve(enrichedResult);
    },
    
    findById: (id: string) => {
      const title = this.data.titles.find(t => t.id === id);
      if (!title) return Promise.resolve(null);
      
      const vehicle = this.data.vehicles.find(v => v.id === title.vehicleId);
      if (vehicle) {
        const org = this.data.organizations.find(o => o.id === vehicle.orgId);
        return Promise.resolve({
          ...title,
          vehicle: {
            id: vehicle.id,
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            status: vehicle.status,
            org: org ? {
              id: org.id,
              name: org.name,
              type: org.type
            } : null
          }
        });
      }
      
      return Promise.resolve({
        ...title,
        vehicle: null
      });
    },
    
    updateStatus: (id: string, status: any) => {
      const index = this.data.titles.findIndex(t => t.id === id);
      if (index === -1) return Promise.resolve(null);
      
      this.data.titles[index].status = status;
      this.data.titles[index].updatedAt = new Date();
      
      return Promise.resolve(this.data.titles[index]);
    }
  };

  // Invoice operations
  invoices = {
    findMany: (filter?: any) => {
      let result = [...this.data.invoices];
      if (filter?.where?.orgId) {
        result = result.filter(i => i.orgId === filter.where.orgId);
      }
      return Promise.resolve(result);
    },
    
    findById: (id: string) => {
      return Promise.resolve(this.data.invoices.find(i => i.id === id) || null);
    }
  };

  // Payment operations
  paymentIntents = {
    findMany: (filter?: any) => {
      let result = [...this.data.paymentIntents];
      if (filter?.where?.orgId) {
        result = result.filter(p => p.orgId === filter.where.orgId);
      }
      return Promise.resolve(result);
    },
    
    findById: (id: string) => {
      return Promise.resolve(this.data.paymentIntents.find(p => p.id === id) || null);
    }
  };

  // Vehicle intakes operations
  vehicleIntakes = {
    findMany: (filter?: any) => {
      let result = [...this.data.vehicleIntakes];
      if (filter?.where?.orgId) {
        result = result.filter(i => i.orgId === filter.where.orgId);
      }
      if (filter?.where?.status) {
        result = result.filter(i => i.status === filter.where.status);
      }
      return Promise.resolve(result);
    },
    
    findById: (id: string) => {
      return Promise.resolve(this.data.vehicleIntakes.find(i => i.id === id) || null);
    },
    
    create: (data: any) => {
      const newIntake = {
        id: `intake-${Date.now()}`,
        createdAt: new Date(),
        reviewedAt: null,
        reviewedById: null,
        ...data
      };
      this.data.vehicleIntakes.push(newIntake);
      return Promise.resolve(newIntake);
    },
    
    approve: (id: string, reviewerId: string) => {
      const index = this.data.vehicleIntakes.findIndex(i => i.id === id);
      if (index === -1) return Promise.resolve(null);
      
      this.data.vehicleIntakes[index].status = 'APPROVED';
      this.data.vehicleIntakes[index].reviewedAt = new Date();
      this.data.vehicleIntakes[index].reviewedById = reviewerId;
      
      return Promise.resolve(this.data.vehicleIntakes[index]);
    },
    
    reject: (id: string, reviewerId: string) => {
      const index = this.data.vehicleIntakes.findIndex(i => i.id === id);
      if (index === -1) return Promise.resolve(null);
      
      this.data.vehicleIntakes[index].status = 'REJECTED';
      this.data.vehicleIntakes[index].reviewedAt = new Date();
      this.data.vehicleIntakes[index].reviewedById = reviewerId;
      
      return Promise.resolve(this.data.vehicleIntakes[index]);
    }
  };

  // Utility methods
  reset = () => {
    this.data = {
      users: [...users],
      roles: [...roles],
      userRoles: [...userRoles],
      organizations: [...organizations],
      vehicles: [...vehicles],
      serviceRequests: [...serviceRequests],
      insuranceClaims: [...insuranceClaims],
      titles: [...titles],
      vehicleIntakes: [...vehicleIntakes],
      invoices: [...invoices],
      paymentIntents: [...paymentIntents]
    };
  };

  getStats = () => {
    return {
      users: this.data.users.length,
      organizations: this.data.organizations.length,
      vehicles: this.data.vehicles.length,
      serviceRequests: this.data.serviceRequests.length,
      insuranceClaims: this.data.insuranceClaims.length,
      titles: this.data.titles.length,
      invoices: this.data.invoices.length,
      paymentIntents: this.data.paymentIntents.length,
      vehicleIntakes: this.data.vehicleIntakes.length
    };
  };
}

// Export singleton instance
export const mockDB = new MockDatabase();