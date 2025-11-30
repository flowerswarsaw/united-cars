import { hashPassword } from './password-utils';

export interface MockUser {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  orgId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  roles: string[]; // RoleKey values
  createdAt: Date;
  updatedAt: Date;
}

// In-memory user store initialized with seed data
let users: MockUser[] = [];

// Initialize with default admin user
async function initializeDefaultUsers() {
  if (users.length === 0) {
    const defaultPasswordHash = await hashPassword('admin123');

    users = [
      {
        id: 'admin-dev-user',
        email: 'admin@unitedcars.com',
        name: 'Development Admin',
        passwordHash: defaultPasswordHash,
        orgId: 'united-cars',
        status: 'ACTIVE',
        roles: ['ADMIN'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-ops-001',
        email: 'ops@unitedcars.com',
        name: 'Operations Manager',
        passwordHash: defaultPasswordHash,
        orgId: 'united-cars',
        status: 'ACTIVE',
        roles: ['OPS'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'user-accountant-001',
        email: 'accountant@unitedcars.com',
        name: 'Chief Accountant',
        passwordHash: defaultPasswordHash,
        orgId: 'united-cars',
        status: 'ACTIVE',
        roles: ['ACCOUNTANT'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

// Ensure users are initialized
initializeDefaultUsers();

export const mockUserRepository = {
  async findMany(filter?: { orgId?: string; status?: { not: string } }) {
    await initializeDefaultUsers();

    let filtered = users;

    if (filter?.orgId) {
      filtered = filtered.filter(u => u.orgId === filter.orgId);
    }

    if (filter?.status?.not) {
      filtered = filtered.filter(u => u.status !== filter.status!.not);
    }

    return filtered.sort((a, b) => {
      // ACTIVE first
      if (a.status !== b.status) {
        if (a.status === 'ACTIVE') return -1;
        if (b.status === 'ACTIVE') return 1;
      }
      // Then by email
      return a.email.localeCompare(b.email);
    });
  },

  async findUnique(where: { email: string }) {
    await initializeDefaultUsers();
    return users.find(u => u.email === where.email) || null;
  },

  async findFirst(where: { id: string; orgId: string; status?: { not: string } }) {
    await initializeDefaultUsers();

    let user = users.find(u => u.id === where.id && u.orgId === where.orgId);

    if (user && where.status?.not && user.status === where.status.not) {
      return null;
    }

    return user || null;
  },

  async create(data: {
    email: string;
    name: string | null;
    passwordHash: string;
    orgId: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    roles: string[];
  }) {
    await initializeDefaultUsers();

    const newUser: MockUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      orgId: data.orgId,
      status: data.status,
      roles: data.roles,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    return newUser;
  },

  async update(where: { id: string }, data: Partial<{
    name: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
    passwordHash: string;
    roles: string[];
  }>) {
    await initializeDefaultUsers();

    const userIndex = users.findIndex(u => u.id === where.id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const user = users[userIndex];
    users[userIndex] = {
      ...user,
      ...data,
      updatedAt: new Date()
    };

    return users[userIndex];
  },

  async delete(where: { id: string }) {
    await initializeDefaultUsers();

    return this.update(where, { status: 'DELETED' });
  }
};
