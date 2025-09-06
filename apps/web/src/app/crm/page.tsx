'use client';

import { useEffect, useState } from 'react';
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
import toast from 'react-hot-toast';

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
  const [stats, setStats] = useState<CRMStats>({
    totalDeals: 0,
    activeDeals: 0,
    totalContacts: 0,
    totalOrganisations: 0,
    totalLeads: 0,
    totalPipelines: 0
  });
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState({
    stats: true,
    deals: true,
    contacts: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load stats first (faster)
    loadStats();
    
    // Then load recent data
    loadRecentDeals();
    loadRecentContacts();
  };

  const loadStats = async () => {
    try {
      const [
        dealsResponse,
        contactsResponse,
        organisationsResponse,
        leadsResponse,
        pipelinesResponse
      ] = await Promise.all([
        fetch('/api/crm/deals'),
        fetch('/api/crm/contacts'),
        fetch('/api/crm/organisations'),
        fetch('/api/crm/leads'),
        fetch('/api/crm/pipelines')
      ]);

      const [deals, contacts, organisations, leads, pipelines] = await Promise.all([
        dealsResponse.json(),
        contactsResponse.json(),
        organisationsResponse.json(),
        leadsResponse.json(),
        pipelinesResponse.json()
      ]);

      // Calculate stats
      const activeDeals = deals.filter((deal: Deal) => 
        deal.status !== 'WON' && deal.status !== 'LOST'
      ).length;

      setStats({
        totalDeals: deals.length,
        activeDeals,
        totalContacts: contacts.length,
        totalOrganisations: organisations.length,
        totalLeads: leads.length,
        totalPipelines: pipelines.length
      });

    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const loadRecentDeals = async () => {
    try {
      const response = await fetch('/api/crm/deals');
      const deals = await response.json();
      setRecentDeals(deals.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent deals:', error);
    } finally {
      setLoading(prev => ({ ...prev, deals: false }));
    }
  };

  const loadRecentContacts = async () => {
    try {
      const response = await fetch('/api/crm/contacts');
      const contacts = await response.json();
      setRecentContacts(contacts.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent contacts:', error);
    } finally {
      setLoading(prev => ({ ...prev, contacts: false }));
    }
  };

  // Show loading skeleton for initial load
  const isInitialLoading = loading.stats && loading.deals && loading.contacts;

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
      href: '/crm/deals',
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50'
    },
    { 
      title: 'Contacts', 
      count: stats.totalContacts, 
      subtext: 'People in system', 
      href: '/crm/contacts',
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50'
    },
    { 
      title: 'Organisations', 
      count: stats.totalOrganisations, 
      subtext: 'Companies tracked', 
      href: '/crm/organisations',
      icon: Building2,
      color: 'text-orange-600 bg-orange-50'
    },
    { 
      title: 'Leads', 
      count: stats.totalLeads, 
      subtext: 'Potential customers', 
      href: '/crm/leads',
      icon: Users,
      color: 'text-purple-600 bg-purple-50'
    },
    { 
      title: 'Pipelines', 
      count: stats.totalPipelines, 
      subtext: 'Sales workflows', 
      href: '/crm/pipelines',
      icon: GitBranch,
      color: 'text-gray-600 bg-gray-50'
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
                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${card.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        {loading.stats ? (
                          <div className="space-y-2">
                            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xl font-bold text-gray-900">{card.count}</p>
                            <p className="text-sm font-medium text-gray-900">{card.title}</p>
                            <p className="text-xs text-gray-500">{card.subtext}</p>
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
              {loading.deals ? (
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
              {loading.contacts ? (
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