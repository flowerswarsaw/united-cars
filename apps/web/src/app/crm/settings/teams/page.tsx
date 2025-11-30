'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';
import { TeamsTab } from '@/components/crm/admin/teams-tab';

export default function CRMTeamsPage() {
  const { user } = useSession();

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Team Management"
        description="Manage CRM teams and team memberships"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Settings', href: '/crm/settings/users' },
          { label: 'Teams' }
        ]}
      />

      <div className="container mx-auto py-6">
        <TeamsTab />
      </div>
    </AppLayout>
  );
}
