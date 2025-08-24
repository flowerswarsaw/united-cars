import { User, Role, UserRole } from '../types';
import bcrypt from 'bcryptjs';

// Pre-hashed passwords for consistency
const adminPasswordHash = bcrypt.hashSync('admin123', 10);
const dealerPasswordHash = bcrypt.hashSync('dealer123', 10);
const opsPasswordHash = bcrypt.hashSync('ops123', 10);

export const users: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@demo.com',
    name: 'Admin User',
    passwordHash: adminPasswordHash,
    orgId: 'org-admin',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'user-dealer-1',
    email: 'dealer@demo.com',
    name: 'Dealer User',
    passwordHash: dealerPasswordHash,
    orgId: 'org-dealer-1',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'user-ops-1',
    email: 'ops@demo.com',
    name: 'Operations User',
    passwordHash: opsPasswordHash,
    orgId: 'org-admin',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  }
];

export const roles: Role[] = [
  { id: 'role-admin', key: 'ADMIN' },
  { id: 'role-dealer', key: 'DEALER' },
  { id: 'role-ops', key: 'OPS' },
  { id: 'role-accountant', key: 'ACCOUNTANT' }
];

export const userRoles: UserRole[] = [
  // Admin user has admin role
  {
    id: 'user-role-1',
    userId: 'user-admin-1',
    roleId: 'role-admin',
    orgId: 'org-admin'
  },
  // Admin user also has accountant role
  {
    id: 'user-role-2',
    userId: 'user-admin-1',
    roleId: 'role-accountant',
    orgId: 'org-admin'
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
    orgId: 'org-admin'
  }
];