import { User, Role, UserRole } from '../types';
import bcrypt from 'bcryptjs';

// Pre-hashed passwords for consistency
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
const dealerPasswordHash = bcrypt.hashSync('dealer123', 10);
const opsPasswordHash = bcrypt.hashSync('ops123', 10);
const claimsPasswordHash = bcrypt.hashSync('claims123', 10);

export const users: User[] = [
  {
    id: 'admin-user-001',
    email: 'admin@unitedcars.com',
    name: 'System Administrator',
    passwordHash: adminPasswordHash,
    orgId: 'united-cars',
    status: 'ACTIVE',
    balance: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: 1
  },
  {
    id: 'user-dealer-1',
    email: 'dealer@demo.com',
    name: 'Dealer User',
    passwordHash: dealerPasswordHash,
    orgId: 'org-dealer-1',
    status: 'ACTIVE',
    balance: 15000, // Starting balance for testing
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    version: 1
  },
  {
    id: 'user-ops-1',
    email: 'ops@demo.com',
    name: 'Operations User',
    passwordHash: opsPasswordHash,
    orgId: 'united-cars',
    status: 'ACTIVE',
    balance: 0,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    version: 1
  },
  {
    id: 'user-claims-1',
    email: 'claims@demo.com',
    name: 'Claims Specialist',
    passwordHash: claimsPasswordHash,
    orgId: 'united-cars',
    status: 'ACTIVE',
    balance: 0,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    version: 1
  }
];

export const roles: Role[] = [
  { id: 'role-admin', key: 'ADMIN' },
  { id: 'role-accounting', key: 'ACCOUNTING' },
  { id: 'role-claims', key: 'CLAIMS' },
  { id: 'role-support', key: 'SUPPORT' },
  { id: 'role-dealer', key: 'DEALER' },
  { id: 'role-retail', key: 'RETAIL' },
  { id: 'role-dispatch', key: 'DISPATCH' },
  { id: 'role-ops', key: 'OPS' }
];

export const userRoles: UserRole[] = [
  // Admin user has admin role
  {
    id: 'user-role-1',
    userId: 'admin-user-001',
    roleId: 'role-admin',
    orgId: 'united-cars'
  },
  // Admin user also has accounting role
  {
    id: 'user-role-2',
    userId: 'admin-user-001',
    roleId: 'role-accounting',
    orgId: 'united-cars'
  },
  // Dealer user has dealer role
  {
    id: 'user-role-3',
    userId: 'user-dealer-1',
    roleId: 'role-dealer',
    orgId: 'org-dealer-1'
  },
  // Ops user has ops role
  {
    id: 'user-role-4',
    userId: 'user-ops-1',
    roleId: 'role-ops',
    orgId: 'united-cars'
  },
  // Claims user has claims role
  {
    id: 'user-role-5',
    userId: 'user-claims-1',
    roleId: 'role-claims',
    orgId: 'united-cars'
  }
];