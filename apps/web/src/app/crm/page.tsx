'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/app-layout';
import { PageHeader } from '@/components/layout/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useSession } from '@/hooks/useSession';
import { 
  TrendingUp, 
  UserCheck, 
  Building2, 
  Users, 
  GitBranch,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Deal, Contact, Organisation, Lead, Pipeline } from '@united-cars/crm-core';
import { 
  useDeals, 
  useContacts, 
  useOrganisations, 
  useLeads, 
  usePipelines 
} from '@/hooks/useCrmApi';

interface CRMStats {
  totalDeals: number;
  activeDeals: number;
  totalContacts: number;
  totalOrganisations: number;
  totalLeads: number;
  totalPipelines: number;
}

export default function CRMDashboard() {
  const { user, loading: sessionLoading } = useSession();
  
  // React Query hooks for data fetching
  const { data: deals = [], isLoading: dealsLoading, error: dealsError } = useDeals();
  const { data: contacts = [], isLoading: contactsLoading, error: contactsError } = useContacts();
  const { data: organisations = [], isLoading: orgsLoading, error: orgsError } = useOrganisations();
  const { data: leads = [], isLoading: leadsLoading, error: leadsError } = useLeads();
  const { data: pipelines = [], isLoading: pipelinesLoading, error: pipelinesError } = usePipelines();

  // Calculate stats from fetched data
  const stats = useMemo((): CRMStats => {
    const activeDeals = deals.filter((deal: Deal) => 
      deal.status !== 'WON' && deal.status !== 'LOST'
    ).length;

    return {
      totalDeals: deals.length,
      activeDeals,
      totalContacts: contacts.length,
      totalOrganisations: organisations.length,
      totalLeads: leads.length,
      totalPipelines: pipelines.length
    };
  }, [deals, contacts, organisations, leads, pipelines]);

  // Get recent data (first 5 items)
  const recentDeals = useMemo(() => deals.slice(0, 5), [deals]);
  const recentContacts = useMemo(() => contacts.slice(0, 5), [contacts]);

  // Check if any data is loading
  const isInitialLoading = dealsLoading || contactsLoading || orgsLoading || leadsLoading || pipelinesLoading;
  
  // Check for errors
  const hasErrors = dealsError || contactsError || orgsError || leadsError || pipelinesError;

  const quickActions = [
    { title: 'New Deal', href: '/crm/deals?create=true', icon: TrendingUp, color: 'bg-green-500' },
    { title: 'New Contact', href: '/crm/contacts?create=true', icon: UserCheck, color: 'bg-blue-500' },
    { title: 'New Lead', href: '/crm/leads?create=true', icon: Users, color: 'bg-purple-500' },
    { title: 'New Organisation', href: '/crm/organisations?create=true', icon: Building2, color: 'bg-orange-500' },
  ];

  const moduleCards = [
    {
      title: 'Deals',
      count: stats.totalDeals,
      subtext: `${stats.activeDeals} active`,
      href: '/crm/deals/kanban',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      borderColor: 'border-emerald-200/50 dark:border-emerald-800/50'
    },
    {
      title: 'Contacts',
      count: stats.totalContacts,
      subtext: 'People in system',
      href: '/crm/contacts',
      icon: UserCheck,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      borderColor: 'border-blue-200/50 dark:border-blue-800/50'
    },
    {
      title: 'Organisations',
      count: stats.totalOrganisations,
      subtext: 'Companies tracked',
      href: '/crm/organisations',
      icon: Building2,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
      gradient: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
      borderColor: 'border-orange-200/50 dark:border-orange-800/50'
    },
    {
      title: 'Leads',
      count: stats.totalLeads,
      subtext: 'Potential customers',
      href: '/crm/leads',
      icon: Users,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      gradient: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
      borderColor: 'border-purple-200/50 dark:border-purple-800/50'
    },
    {
      title: 'Pipelines',
      count: stats.totalPipelines,
      subtext: 'Sales workflows',
      href: '/crm/settings/pipelines',
      icon: GitBranch,
      iconColor: 'text-slate-600 dark:text-slate-400',
      iconBg: 'bg-slate-100 dark:bg-slate-800/50',
      gradient: 'from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30',
      borderColor: 'border-slate-200/50 dark:border-slate-700/50'
    },
  ];

  // Show loading for session
  if (sessionLoading || !user) {
    return (
      <AppLayout user={user}>
        <LoadingState text="Loading CRM dashboard..." />
      </AppLayout>
    );
  }

  // Show error state if any queries failed
  if (hasErrors) {
    return (
      <AppLayout user={user}>
        <PageHeader 
          title="CRM Dashboard"
          description="Welcome to your Customer Relationship Management system"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Dashboard' }]}
        />
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard Data</h3>
            <p className="text-red-600">
              There was an issue loading your CRM data. Please try refreshing the page or contact support if the problem persists.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show loading state if initial data is loading
  if (isInitialLoading) {
    return (
      <AppLayout user={user}>
        <PageHeader 
          title="CRM Dashboard"
          description="Welcome to your Customer Relationship Management system"
          breadcrumbs={[{ label: 'CRM' }, { label: 'Dashboard' }]}
        />
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <LoadingState text="Loading CRM data..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="CRM Dashboard"
        description="Welcome to your Customer Relationship Management system"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Dashboard' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <Button 
                      variant="outline" 
                      className="h-20 w-full flex items-center justify-center space-x-3 hover:shadow-md transition-shadow"
                    >
                      <div className={`p-2 rounded-full ${action.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium">{action.title}</span>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {moduleCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link key={card.title} href={card.href}>
                    <div className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 border ${card.borderColor} hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-sm`}>
                          <Icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 group-hover:text-gray-600 transition-all" />
                      </div>
                      <div className="space-y-1">
                        {(dealsLoading || contactsLoading || orgsLoading || leadsLoading || pipelinesLoading) ? (
                          <div className="space-y-2">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                          </div>
                        ) : (
                          <>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{card.count}</p>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{card.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{card.subtext}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Deals</h3>
              <Link href="/crm/deals">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {dealsLoading ? (
                // Loading skeleton
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="w-8 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))
              ) : recentDeals.length > 0 ? (
                recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{deal.title}</p>
                      <p className="text-xs text-gray-500">
                        {deal.amount && `$${deal.amount.toLocaleString()}`}
                        {deal.currency && deal.currency !== 'USD' && ` ${deal.currency}`}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {deal.probability && `${deal.probability}%`}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No deals yet</p>
              )}
            </div>
          </div>

          {/* Recent Contacts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Contacts</h3>
              <Link href="/crm/contacts">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {contactsLoading ? (
                // Loading skeleton
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="ml-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                ))
              ) : recentContacts.length > 0 ? (
                recentContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {contact.firstName?.charAt(0)}{contact.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{contact.title || contact.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No contacts yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}