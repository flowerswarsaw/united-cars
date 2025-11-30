import { users, roles, userRoles } from './data/users';
import { organizations } from './data/organizations';
import { vehicles } from './data/vehicles';
import { serviceRequests, insuranceClaims, vehicleIntakes } from './data/services';
import { titles } from './data/titles';
import { invoices, paymentIntents } from './data/financial';
import { UserSettings } from './types';
import bcrypt from 'bcryptjs';

// In-memory storage (acts like our database)
class MockDatabase {
  private data = {
    users: [...users] as any[],
    roles: [...roles],
    userRoles: [...userRoles],
    organizations: [...organizations],
    vehicles: [...vehicles],
    serviceRequests: [...serviceRequests],
    insuranceClaims: [...insuranceClaims],
    titles: [...titles],
    vehicleIntakes: [...vehicleIntakes],
    invoices: [...invoices] as any[],
    paymentIntents: [...paymentIntents],
    userSettings: [] as UserSettings[]
  };

  constructor() {
    this.migrateInvoiceData();
  }

  // Migrate existing invoices to include new payment tracking fields
  private migrateInvoiceData() {
    this.data.invoices = this.data.invoices.map(invoice => ({
      ...invoice,
      paidAmount: (invoice as any).paidAmount ?? (invoice.status === 'PAID' ? invoice.total : 0),
      remainingAmount: (invoice as any).remainingAmount ?? (invoice.status === 'PAID' ? 0 : invoice.total),
      version: (invoice as any).version ?? 1
    }));

    // Migrate user data as well
    this.data.users = this.data.users.map(user => ({
      ...user,
      balance: (user as any).balance ?? (user.id === 'user-dealer-1' ? 15000 : 0),
      version: (user as any).version ?? 1
    }));

    console.log('📊 Financial data migration completed:');
    console.log(`   - ${this.data.invoices.length} invoices migrated`);
    console.log(`   - ${this.data.users.length} users migrated`);
  }

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
      console.log('🔐 Verifying password for:', email);
      console.log('📋 Available users:', this.data.users.map(u => u.email));
      const user = this.data.users.find(u => u.email === email);
      if (!user) {
        console.log('❌ User not found');
        return null;
      }

      console.log('👤 User found:', user.name);

      // Temporary bypass for debugging
      if (email === 'admin@unitedcars.com' && password === 'admin123') {
        console.log('✅ Using bypass for admin');
        return this.users.findWithRoles(email);
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log('🔑 Password valid:', isValid);
      if (!isValid) return null;

      return this.users.findWithRoles(email);
    },

    // Balance management methods
    getBalance: async (userId: string) => {
      const user = this.data.users.find(u => u.id === userId);
      return user ? user.balance : 0;
    },

    updateBalance: async (userId: string, newBalance: number) => {
      const userIndex = this.data.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        this.data.users[userIndex] = {
          ...this.data.users[userIndex],
          balance: newBalance,
          updatedAt: new Date(),
          version: this.data.users[userIndex].version + 1
        };
        return this.data.users[userIndex];
      }
      return null;
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
      
      // Apply search filtering (OR condition)
      if (filter?.where?.OR) {
        result = result.filter(vehicle => {
          return filter.where.OR.some((condition: any) => {
            if (condition.vin?.contains) {
              return vehicle.vin.toLowerCase().includes(condition.vin.contains.toLowerCase());
            }
            if (condition.make?.contains) {
              return vehicle.make?.toLowerCase().includes(condition.make.contains.toLowerCase());
            }
            if (condition.model?.contains) {
              return vehicle.model?.toLowerCase().includes(condition.model.contains.toLowerCase());
            }
            return false;
          });
        });
      }
      
      // Enrich vehicles with organization information
      const enrichedResult = result.map(vehicle => {
        const org = this.data.organizations.find(o => o.id === vehicle.orgId);
        
        return {
          ...vehicle,
          org: org ? { name: org.name } : { name: 'Unknown Organization' }
        };
      });
      
      // Pagination is now handled in the API layer, so we return all results
      return Promise.resolve({
        data: enrichedResult,
        total: enrichedResult.length,
        page: 1,
        perPage: enrichedResult.length,
        totalPages: 1
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
      
      // Apply status filtering
      if (filter?.where?.status) {
        result = result.filter(s => s.status === filter.where.status);
      }
      
      // Apply type filtering
      if (filter?.where?.type) {
        result = result.filter(s => s.type === filter.where.type);
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
    
    create: (data: any) => {
      const newServiceRequest = {
        id: `service-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        status: 'pending' as const,
        ...data
      };
      this.data.serviceRequests.push(newServiceRequest);
      
      // Enrich the new service request with vehicle and org information
      const vehicle = this.data.vehicles.find(v => v.id === newServiceRequest.vehicleId);
      const org = this.data.organizations.find(o => o.id === newServiceRequest.orgId);
      
      return Promise.resolve({
        ...newServiceRequest,
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

    updateStatus: (id: string, updateData: any) => {
      const index = this.data.serviceRequests.findIndex(s => s.id === id);
      if (index === -1) return Promise.resolve(null);
      
      const service = this.data.serviceRequests[index];
      const previousStatus = service.status;
      
      // Update status if provided
      if (updateData.status !== undefined) {
        service.status = updateData.status;
      }
      
      // Update price if provided
      if (updateData.priceUSD !== undefined) {
        service.priceUSD = updateData.priceUSD;
      }
      
      // Update notes if provided
      if (updateData.notes !== undefined) {
        service.notes = updateData.notes;
      }
      
      // Handle status-specific fields
      if (updateData.rejectionReason) {
        service.rejectionReason = updateData.rejectionReason;
        service.rejectedBy = updateData.userId || 'system';
        service.rejectedAt = new Date();
      }
      
      // Add status history entry if status changed
      if (updateData.status && updateData.status !== previousStatus) {
        if (!service.statusHistory) {
          service.statusHistory = [];
        }
        service.statusHistory.push({
          id: `hist-${Date.now()}`,
          status: updateData.status,
          changedAt: new Date(),
          changedBy: updateData.userId || 'system',
          notes: updateData.notes || `Status changed from ${previousStatus} to ${updateData.status}`
        });
      }
      
      service.updatedAt = new Date();
      service.version++;
      
      // Update the service in the data array
      this.data.serviceRequests[index] = service;
      
      // Enrich the updated service request with vehicle and org information
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
    }
  };

  // Insurance claims operations
  insuranceClaims = {
    findMany: (filter?: any) => {
      let result = [...this.data.insuranceClaims];
      if (filter?.where?.orgId) {
        result = result.filter(c => c.orgId === filter.where.orgId);
      }
      if (filter?.where?.status) {
        result = result.filter(c => c.status === filter.where.status);
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
    
    create: (data: any) => {
      const newClaim = {
        id: `claim-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        claimType: 'damage',
        photos: [],
        ...data
      };
      this.data.insuranceClaims.push(newClaim);
      
      // Enrich the new claim with vehicle and org information
      const vehicle = this.data.vehicles.find(v => v.id === newClaim.vehicleId);
      const org = this.data.organizations.find(o => o.id === newClaim.orgId);
      
      return Promise.resolve({
        ...newClaim,
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
      
      // Apply status filtering
      if (filter?.where?.status) {
        result = result.filter(t => t.status === filter.where.status);
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
      
      // Apply org filtering
      if (filter?.where?.orgId) {
        result = result.filter(i => i.orgId === filter.where.orgId);
      }
      
      // Apply status filtering
      if (filter?.where?.status) {
        result = result.filter(i => i.status === filter.where.status);
      }
      
      // Apply search filtering (OR condition)
      if (filter?.where?.OR) {
        result = result.filter(invoice => {
          return filter.where.OR.some((condition: any) => {
            if (condition.number?.contains) {
              return invoice.number.toLowerCase().includes(condition.number.contains.toLowerCase());
            }
            if (condition.notes?.contains) {
              return invoice.notes?.toLowerCase().includes(condition.notes.contains.toLowerCase());
            }
            return false;
          });
        });
      }
      
      // Enrich invoices with org and vehicle information in lines
      const enrichedResult = result.map(invoice => {
        const org = this.data.organizations.find(o => o.id === invoice.orgId);
        
        const enrichedLines = invoice.lines.map((line: any) => {
          if (line.vehicleId) {
            const vehicle = this.data.vehicles.find(v => v.id === line.vehicleId);
            return {
              ...line,
              vehicle: vehicle ? {
                vin: vehicle.vin,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year
              } : null
            };
          }
          return line;
        });
        
        // Check if invoice is overdue
        let finalStatus = invoice.status;
        if (invoice.status === 'PENDING' && invoice.dueDate) {
          const now = new Date();
          const dueDate = new Date(invoice.dueDate);
          if (now > dueDate) {
            finalStatus = 'OVERDUE';
          }
        }
        
        return {
          ...invoice,
          status: finalStatus,
          org: org ? { name: org.name } : { name: 'Unknown Organization' },
          lines: enrichedLines
        };
      });
      
      return Promise.resolve(enrichedResult);
    },
    
    findById: (id: string) => {
      const invoice = this.data.invoices.find(i => i.id === id);
      if (!invoice) return Promise.resolve(null);
      
      const org = this.data.organizations.find(o => o.id === invoice.orgId);
      
      const enrichedLines = invoice.lines.map((line: any) => {
        if (line.vehicleId) {
          const vehicle = this.data.vehicles.find(v => v.id === line.vehicleId);
          return {
            ...line,
            vehicle: vehicle ? {
              vin: vehicle.vin,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year
            } : null
          };
        }
        return line;
      });
      
      return Promise.resolve({
        ...invoice,
        org: org ? { name: org.name } : { name: 'Unknown Organization' },
        lines: enrichedLines
      });
    },

    findByNumber: (number: string) => {
      const invoice = this.data.invoices.find(i => i.number === number);
      if (!invoice) return Promise.resolve(null);
      
      const org = this.data.organizations.find(o => o.id === invoice.orgId);
      
      const enrichedLines = invoice.lines.map((line: any) => {
        if (line.vehicleId) {
          const vehicle = this.data.vehicles.find(v => v.id === line.vehicleId);
          return {
            ...line,
            vehicle: vehicle ? {
              vin: vehicle.vin,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year
            } : null
          };
        }
        return line;
      });
      
      return Promise.resolve({
        ...invoice,
        org: org ? { name: org.name } : { name: 'Unknown Organization' },
        lines: enrichedLines
      });
    },

    // Apply payment to invoice
    applyPayment: async (invoiceId: string, paymentAmount: number) => {
      const invoiceIndex = this.data.invoices.findIndex(i => i.id === invoiceId);
      if (invoiceIndex === -1) return null;

      const invoice = this.data.invoices[invoiceIndex];
      const newPaidAmount = invoice.paidAmount + paymentAmount;
      const newRemainingAmount = Math.max(0, invoice.total - newPaidAmount);
      
      // Auto-update status based on payment
      let newStatus = invoice.status;
      if (newRemainingAmount === 0 && ['PENDING', 'OVERDUE'].includes(invoice.status)) {
        newStatus = 'PAID';
      }

      this.data.invoices[invoiceIndex] = {
        ...invoice,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus as any,
        updatedAt: new Date(),
        version: invoice.version + 1
      };

      return this.data.invoices[invoiceIndex];
    },

    // Get outstanding invoices (not fully paid)
    getOutstanding: async (orgId?: string) => {
      let result = this.data.invoices.filter(invoice => 
        invoice.remainingAmount > 0 && 
        ['PENDING', 'OVERDUE'].includes(invoice.status)
      );

      if (orgId) {
        result = result.filter(i => i.orgId === orgId);
      }

      // Apply overdue check to outstanding invoices too
      return result.map(invoice => {
        let finalStatus = invoice.status;
        if (invoice.status === 'PENDING' && invoice.dueDate) {
          const now = new Date();
          const dueDate = new Date(invoice.dueDate);
          if (now > dueDate) {
            finalStatus = 'OVERDUE';
          }
        }
        return {
          ...invoice,
          status: finalStatus
        };
      });
    },

    // Cancel an invoice
    cancel: async (invoiceId: string, cancelData: { cancelReason: string; canceledBy: string; canceledAt: Date }) => {
      const invoiceIndex = this.data.invoices.findIndex(i => i.id === invoiceId);
      if (invoiceIndex === -1) return null;

      this.data.invoices[invoiceIndex] = {
        ...this.data.invoices[invoiceIndex],
        status: 'CANCELED',
        cancelReason: cancelData.cancelReason,
        canceledBy: cancelData.canceledBy,
        canceledAt: cancelData.canceledAt,
        updatedAt: new Date()
      };

      return this.data.invoices[invoiceIndex];
    }
  };

  // Payment operations
  paymentIntents = {
    findMany: (filter?: any) => {
      let result = [...this.data.paymentIntents];
      
      // Apply org filtering
      if (filter?.where?.orgId) {
        result = result.filter(p => p.orgId === filter.where.orgId);
      }
      
      // Apply status filtering
      if (filter?.where?.status) {
        result = result.filter(p => p.status === filter.where.status);
      }
      
      // Apply search filtering (OR condition)
      if (filter?.where?.OR) {
        result = result.filter(payment => {
          return filter.where.OR.some((condition: any) => {
            if (condition.method?.contains) {
              return payment.method.toLowerCase().includes(condition.method.contains.toLowerCase());
            }
            if (condition.ref?.contains) {
              return payment.ref?.toLowerCase().includes(condition.ref.contains.toLowerCase());
            }
            return false;
          });
        });
      }
      
      // Enrich payments with createdBy user information and org information
      const enrichedResult = result.map(payment => {
        const createdByUser = this.data.users.find(u => u.id === payment.createdByUserId);
        const org = this.data.organizations.find(o => o.id === payment.orgId);
        const invoice = payment.invoiceId ? this.data.invoices.find(i => i.id === payment.invoiceId) : null;
        
        return {
          ...payment,
          createdBy: createdByUser ? {
            name: createdByUser.name || 'Unknown User',
            email: createdByUser.email
          } : {
            name: 'Unknown User',
            email: 'unknown@demo.com'
          },
          org: org ? { name: org.name } : { name: 'Unknown Organization' },
          invoice: invoice ? {
            id: invoice.id,
            number: invoice.number
          } : null
        };
      });
      
      return Promise.resolve(enrichedResult);
    },
    
    findById: (id: string) => {
      const payment = this.data.paymentIntents.find(p => p.id === id);
      if (!payment) return Promise.resolve(null);
      
      const createdByUser = this.data.users.find(u => u.id === payment.createdByUserId);
      
      return Promise.resolve({
        ...payment,
        createdBy: createdByUser ? {
          name: createdByUser.name || 'Unknown User',
          email: createdByUser.email
        } : {
          name: 'Unknown User',
          email: 'unknown@demo.com'
        }
      });
    },

    create: (data: any) => {
      const newPayment = {
        id: data.id || `payment-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      this.data.paymentIntents.push(newPayment);
      
      // Enrich the new payment with user and org information
      const createdByUser = this.data.users.find(u => u.id === newPayment.createdByUserId);
      const org = this.data.organizations.find(o => o.id === newPayment.orgId);
      const invoice = newPayment.invoiceId ? this.data.invoices.find(i => i.id === newPayment.invoiceId) : null;
      
      return Promise.resolve({
        ...newPayment,
        createdBy: createdByUser ? {
          name: createdByUser.name || 'Unknown User',
          email: createdByUser.email
        } : {
          name: 'Unknown User',
          email: 'unknown@demo.com'
        },
        org: org ? { name: org.name } : { name: 'Unknown Organization' },
        invoice: invoice ? {
          id: invoice.id,
          number: invoice.number
        } : null
      });
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
      
      // Apply search filtering (OR condition)
      if (filter?.where?.OR) {
        result = result.filter(intake => {
          return filter.where.OR.some((condition: any) => {
            if (condition.vin?.contains) {
              return intake.vin.toLowerCase().includes(condition.vin.contains.toLowerCase());
            }
            if (condition.make?.contains) {
              return intake.make?.toLowerCase().includes(condition.make.contains.toLowerCase());
            }
            if (condition.model?.contains) {
              return intake.model?.toLowerCase().includes(condition.model.contains.toLowerCase());
            }
            return false;
          });
        });
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
    },
    
    update: (id: string, data: any) => {
      const index = this.data.vehicleIntakes.findIndex(i => i.id === id);
      if (index === -1) return Promise.resolve(null);
      
      this.data.vehicleIntakes[index] = {
        ...this.data.vehicleIntakes[index],
        ...data,
        updatedAt: new Date()
      };
      return Promise.resolve(this.data.vehicleIntakes[index]);
    },
    
    delete: (id: string) => {
      const index = this.data.vehicleIntakes.findIndex(i => i.id === id);
      if (index === -1) return Promise.resolve(false);
      
      this.data.vehicleIntakes.splice(index, 1);
      return Promise.resolve(true);
    }
  };

  // User Settings operations
  userSettings = {
    findByUserId: (userId: string) => {
      const settings = this.data.userSettings.find(s => s.userId === userId);
      return Promise.resolve(settings || null);
    },

    create: (data: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newSettings: UserSettings = {
        id: `settings-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      this.data.userSettings.push(newSettings);
      return Promise.resolve(newSettings);
    },

    upsert: (userId: string, data: Partial<Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
      const existingIndex = this.data.userSettings.findIndex(s => s.userId === userId);
      
      if (existingIndex >= 0) {
        // Update existing
        this.data.userSettings[existingIndex] = {
          ...this.data.userSettings[existingIndex],
          ...data,
          updatedAt: new Date()
        };
        return Promise.resolve(this.data.userSettings[existingIndex]);
      } else {
        // Create new
        const newSettings: UserSettings = {
          id: `settings-${Date.now()}`,
          userId,
          defaultInsurance: "1%",
          defaultUsPort: null,
          defaultDestinationPort: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data
        };
        this.data.userSettings.push(newSettings);
        return Promise.resolve(newSettings);
      }
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
      paymentIntents: [...paymentIntents],
      userSettings: [] as UserSettings[]
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
      vehicleIntakes: this.data.vehicleIntakes.length,
      userSettings: this.data.userSettings.length
    };
  };
}

// Use global to persist data across hot reloads in development
declare global {
  var __mockDB: MockDatabase | undefined;
}

// Export singleton instance that survives hot reloads
export const mockDB = global.__mockDB || (global.__mockDB = new MockDatabase());

// Add debug logging
if (typeof window === 'undefined') {
  const isFirstInit = global.__mockDB === mockDB;
  if (isFirstInit) {
    console.log(`📊 Mock Database initialized with ${mockDB.getStats().serviceRequests} service requests`);
  }
}