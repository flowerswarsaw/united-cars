/**
 * Database Service Abstraction
 * Provides a unified interface that can use either mock data or real Prisma
 * This allows us to develop without database dependencies
 */

import { mockDB } from '@united-cars/mock-data';
import { prisma } from '@united-cars/db';

// Toggle this to switch between mock and real database
const USE_MOCK_DATA = process.env.USE_MOCK_DATA !== 'false';

// Log which data source we're using
if (typeof window === 'undefined') {
  console.log(`🗄️  Using ${USE_MOCK_DATA ? 'MOCK' : 'REAL'} database`);
}

/**
 * Database service that abstracts the data source
 * All API routes should use this instead of direct Prisma calls
 */
export const db = USE_MOCK_DATA ? mockDB : {
  // User operations
  users: {
    findMany: (filter?: any) => prisma.user.findMany(filter),
    findUnique: (params: any) => prisma.user.findUnique(params),
    findWithRoles: async (email: string) => {
      return prisma.user.findUnique({
        where: { email },
        include: {
          org: true,
          roles: {
            include: {
              role: true
            }
          }
        }
      });
    },
    verifyPassword: async (email: string, password: string) => {
      // This would use bcrypt in real implementation
      const bcrypt = require('bcryptjs');
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          org: true,
          roles: {
            include: {
              role: true
            }
          }
        }
      });
      
      if (!user) return null;
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;
      
      return user;
    },

    // Balance management methods
    getBalance: async (userId: string) => {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      return user ? (user as any).balance || 0 : 0
    },

    updateBalance: async (userId: string, newBalance: number) => {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          balance: newBalance,
          updatedAt: new Date(),
          version: { increment: 1 }
        }
      })
    }
  },

  // Organization operations
  organizations: {
    findMany: () => prisma.org.findMany(),
    findById: (id: string) => prisma.org.findUnique({ where: { id } })
  },

  // Vehicle operations
  vehicles: {
    findMany: async (filter?: any) => {
      const vehicles = await prisma.vehicle.findMany(filter);
      const total = await prisma.vehicle.count({ where: filter?.where });
      
      const page = filter?.skip ? Math.floor(filter.skip / (filter.take || 25)) + 1 : 1;
      const perPage = filter?.take || 25;
      
      return {
        data: vehicles,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage)
      };
    },
    findById: (id: string) => prisma.vehicle.findUnique({ where: { id } }),
    create: (data: any) => prisma.vehicle.create({ data }),
    update: (id: string, data: any) => prisma.vehicle.update({ where: { id }, data }),
    delete: (id: string) => prisma.vehicle.delete({ where: { id } }),
    count: (filter?: any) => prisma.vehicle.count(filter)
  },

  // Service requests operations
  serviceRequests: {
    findMany: (filter?: any) => prisma.serviceRequest.findMany(filter),
    findById: (id: string) => prisma.serviceRequest.findUnique({ where: { id } }),
    updateStatus: (id: string, status: any) => 
      prisma.serviceRequest.update({ 
        where: { id }, 
        data: { status, version: { increment: 1 } } 
      })
  },

  // Insurance claims operations
  insuranceClaims: {
    findMany: (filter?: any) => prisma.insuranceClaim.findMany(filter),
    findById: (id: string) => prisma.insuranceClaim.findUnique({ where: { id } }),
    create: (data: any) => prisma.insuranceClaim.create({ data }),
    updateStatus: (id: string, status: any) => 
      prisma.insuranceClaim.update({ 
        where: { id }, 
        data: { status, version: { increment: 1 } } 
      })
  },

  // Titles operations
  titles: {
    findMany: (filter?: any) => prisma.title.findMany(filter),
    findById: (id: string) => prisma.title.findUnique({ where: { id } }),
    updateStatus: (id: string, status: any) => 
      prisma.title.update({ where: { id }, data: { status } })
  },

  // Invoice operations
  invoices: {
    findMany: (filter?: any) => prisma.invoice.findMany(filter),
    findById: (id: string) => prisma.invoice.findUnique({ where: { id } }),
    findByNumber: (number: string) => prisma.invoice.findUnique({ where: { number } }),
    applyPayment: async (invoiceId: string, paymentAmount: number) => {
      // For Prisma - would implement proper payment application logic
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
      if (!invoice) return null
      
      const newPaidAmount = (invoice as any).paidAmount + paymentAmount
      const newRemainingAmount = Math.max(0, invoice.total - newPaidAmount)
      
      return await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newRemainingAmount === 0 ? 'PAID' : invoice.status,
          updatedAt: new Date(),
          version: { increment: 1 }
        }
      })
    },
    getOutstanding: async (orgId?: string) => {
      const where: any = {
        remainingAmount: { gt: 0 },
        status: { in: ['PENDING', 'OVERDUE'] }
      }
      if (orgId) {
        where.orgId = orgId
      }
      return await prisma.invoice.findMany({ where })
    },
    cancel: async (invoiceId: string, cancelData: { cancelReason: string; canceledBy: string; canceledAt: Date }) => {
      return await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'CANCELED',
          cancelReason: cancelData.cancelReason,
          canceledBy: cancelData.canceledBy,
          canceledAt: cancelData.canceledAt,
          updatedAt: new Date()
        }
      })
    }
  },

  // Payment operations
  paymentIntents: {
    findMany: (filter?: any) => prisma.paymentIntent.findMany(filter),
    findById: (id: string) => prisma.paymentIntent.findUnique({ where: { id } }),
    create: (data: any) => prisma.paymentIntent.create({ data })
  },

  // Vehicle intakes operations
  vehicleIntakes: {
    findMany: (filter?: any) => prisma.vehicleIntake.findMany(filter),
    findById: (id: string) => prisma.vehicleIntake.findUnique({ where: { id } }),
    create: (data: any) => prisma.vehicleIntake.create({ data }),
    approve: (id: string, reviewerId: string) => 
      prisma.vehicleIntake.update({ 
        where: { id }, 
        data: { 
          status: 'APPROVED', 
          reviewedAt: new Date(), 
          reviewedById: reviewerId 
        } 
      }),
    reject: (id: string, reviewerId: string) => 
      prisma.vehicleIntake.update({ 
        where: { id }, 
        data: { 
          status: 'REJECTED', 
          reviewedAt: new Date(), 
          reviewedById: reviewerId 
        } 
      })
  }
};