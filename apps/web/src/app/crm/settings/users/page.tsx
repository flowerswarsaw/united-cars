'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';
import { UsersTab } from '@/components/crm/admin/users-tab';

export default function CRMUsersPage() {
  const { user } = useSession();

  return (
    <AppLayout user={user}>
      <PageHeader
        title="User Management"
        description="Manage CRM users, roles, and permissions"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Settings', href: '/crm/settings/users' },
          { label: 'Users' }
        ]}
      />

      <div className="container mx-auto py-6">
        <UsersTab />
      </div>
    </AppLayout>
  );
}
