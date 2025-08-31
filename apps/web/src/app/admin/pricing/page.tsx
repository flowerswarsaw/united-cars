'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { 
  DollarSign, Calculator, Truck, Ship, Globe, Plus
} from 'lucide-react'
import { AuctionPricingTab } from '@/components/admin/pricing/auction-pricing-tab'
import { TowingPricingTab } from '@/components/admin/pricing/towing-pricing-tab'
import { ShippingPricingTab } from '@/components/admin/pricing/shipping-pricing-tab'
import { ExpeditionPricingTab } from '@/components/admin/pricing/expedition-pricing-tab'

type TabType = 'auction' | 'towing' | 'shipping' | 'expedition'

export default function AdminPricingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('auction')
  const [loading, setLoading] = useState(true)
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    if (user && !sessionLoading) {
      // Check if user has admin access
      if (!user.roles?.includes('ADMIN') && !user.roles?.includes('ACCOUNTING')) {
        router.push('/dashboard')
        return
      }
      setLoading(false)
    }
  }, [user, sessionLoading, router])

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading pricing management..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || (!user.roles?.includes('ADMIN') && !user.roles?.includes('ACCOUNTING'))) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">You need admin privileges to view this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const tabs = [
    {
      id: 'auction' as TabType,
      name: 'Auction',
      icon: Calculator,
      description: 'Manage auction fees and buyer charges'
    },
    {
      id: 'towing' as TabType,
      name: 'Towing',
      icon: Truck,
      description: 'Configure towing rates and regional pricing'
    },
    {
      id: 'shipping' as TabType,
      name: 'Shipping',
      icon: Ship,
      description: 'Set shipping costs by route and vehicle type'
    },
    {
      id: 'expedition' as TabType,
      name: 'Expedition',
      icon: Globe,
      description: 'Manage customs duties and expedition fees'
    }
  ]

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Pricing Management"
        description="Configure and manage all pricing matrices across the platform"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Pricing' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                Pricing Configuration
              </h2>
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Matrix
              </button>
            </div>
            
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        py-2 px-1 border-b-2 font-medium text-sm transition-colors
                        ${activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-2">
                        <TabIcon className="h-5 w-5" />
                        <span>{tab.name}</span>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
            
            {/* Tab Description */}
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {tabs.find(t => t.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'auction' && <AuctionPricingTab />}
          {activeTab === 'towing' && <TowingPricingTab />}
          {activeTab === 'shipping' && <ShippingPricingTab />}
          {activeTab === 'expedition' && <ExpeditionPricingTab />}
        </div>
      </div>
    </AppLayout>
  )
}