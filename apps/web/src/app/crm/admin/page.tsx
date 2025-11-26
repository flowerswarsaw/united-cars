'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, UsersIcon } from 'lucide-react';

// Import tab components (we'll create these next)
import { UsersTab } from '@/components/crm/admin/users-tab';
import { RolesTab } from '@/components/crm/admin/roles-tab';
import { TeamsTab } from '@/components/crm/admin/teams-tab';

export default function CRMAdminPage() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <AppLayout user={user}>
      <PageHeader
        title="CRM Administration"
        description="Manage users, roles, and teams"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Administration' }
        ]}
      />

      <div className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Teams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UsersTab />
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <RolesTab />
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <TeamsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
