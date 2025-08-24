import { Org } from '../types';

export const organizations: Org[] = [
  {
    id: 'org-admin',
    name: 'United Cars Admin',
    type: 'ADMIN',
    parentOrgId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'org-dealer-1',
    name: 'Premium Auto Imports',
    type: 'DEALER',
    parentOrgId: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'org-dealer-2',
    name: 'Elite Motors LLC',
    type: 'DEALER',
    parentOrgId: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'org-dealer-3',
    name: 'Global Vehicle Solutions',
    type: 'DEALER',
    parentOrgId: null,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  }
];