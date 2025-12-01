'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { useSession } from '@/hooks/useSession';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTab } from '@/components/crm/admin/users-tab';
import { RolesTab } from '@/components/crm/admin/roles-tab';
import { TeamsTab } from '@/components/crm/admin/teams-tab';
import { Users, Shield, UsersRound } from 'lucide-react';

export default function CRMUsersPage() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <AppLayout user={user}>
      <PageHeader
        title="User Management"
        description="Manage CRM users, roles, and teams"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Settings', href: '/crm/settings/users' },
          { label: 'Users' }
        ]}
      />

      <div className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Roles</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <UsersRound className="h-4 w-4" />
              <span>Teams</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>

          <TabsContent value="roles" className="mt-6">
            <RolesTab />
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <TeamsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
