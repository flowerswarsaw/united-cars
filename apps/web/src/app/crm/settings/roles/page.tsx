'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';
import { RolesTab } from '@/components/crm/admin/roles-tab';

export default function CRMRolesPage() {
  const { user } = useSession();

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Role Management"
        description="Manage custom roles and permissions"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Settings', href: '/crm/settings/users' },
          { label: 'Roles' }
        ]}
      />

      <div className="container mx-auto py-6">
        <RolesTab />
      </div>
    </AppLayout>
  );
}
