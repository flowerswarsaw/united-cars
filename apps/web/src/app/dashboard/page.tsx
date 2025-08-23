'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Car, 
  FileText, 
  Wrench, 
  Shield, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Plus 
} from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'

interface DashboardStats {
  vehicles: {
    total: number
    inTransit: number
    pending: number
  }
  titles: {
    total: number
    pending: number
    received: number
  }
  services: {
    total: number
    pending: number
    inProgress: number
  }
  claims: {
    total: number
    new: number
    underReview: number
  }
}

interface PendingItem {
  id: string
  type: 'service' | 'claim' | 'intake' | 'title'
  title: string
  subtitle: string
  status: string
  createdAt: string
  href: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user] = useState({
    name: 'John Doe',
    email: 'john@demo.com',
    roles: ['DEALER'],
    orgName: 'Demo Dealer'
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // In a real app, this would be a single dashboard API endpoint
      const [vehiclesRes, titlesRes, servicesRes, claimsRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/titles'), 
        fetch('/api/services'),
        fetch('/api/claims')
      ])

      const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : { vehicles: [] }
      const titles = titlesRes.ok ? await titlesRes.json() : { titles: [] }
      const services = servicesRes.ok ? await servicesRes.json() : { serviceRequests: [] }
      const claims = claimsRes.ok ? await claimsRes.json() : { claims: [] }

      // Calculate stats
      const dashStats: DashboardStats = {
        vehicles: {
          total: vehicles.vehicles?.length || 0,
          inTransit: vehicles.vehicles?.filter((v: any) => v.status === 'IN_TRANSIT').length || 0,
          pending: vehicles.vehicles?.filter((v: any) => v.status === 'SOURCING').length || 0
        },
        titles: {
          total: titles.titles?.length || 0,
          pending: titles.titles?.filter((t: any) => t.status === 'pending').length || 0,
          received: titles.titles?.filter((t: any) => t.status === 'received').length || 0
        },
        services: {
          total: services.serviceRequests?.length || 0,
          pending: services.serviceRequests?.filter((s: any) => s.status === 'pending').length || 0,
          inProgress: services.serviceRequests?.filter((s: any) => s.status === 'in_progress').length || 0
        },
        claims: {
          total: claims.claims?.length || 0,
          new: claims.claims?.filter((c: any) => c.status === 'new').length || 0,
          underReview: claims.claims?.filter((c: any) => c.status === 'review').length || 0
        }
      }

      setStats(dashStats)

      // Build pending items
      const pending: PendingItem[] = []
      
      // Add pending services
      services.serviceRequests?.filter((s: any) => s.status === 'pending').forEach((service: any) => {
        pending.push({
          id: service.id,
          type: 'service',
          title: `${service.type} Service`,
          subtitle: `${service.vehicle.year} ${service.vehicle.make} ${service.vehicle.model}`,
          status: service.status,
          createdAt: service.createdAt,
          href: `/services/${service.id}`
        })
      })

      // Add new claims
      claims.claims?.filter((c: any) => c.status === 'new').forEach((claim: any) => {
        pending.push({
          id: claim.id,
          type: 'claim',
          title: 'Insurance Claim',
          subtitle: `${claim.vehicle.year} ${claim.vehicle.make} ${claim.vehicle.model}`,
          status: claim.status,
          createdAt: claim.createdAt,
          href: `/claims/${claim.id}`
        })
      })

      setPendingItems(pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'service': return <Wrench className="h-4 w-4" />
      case 'claim': return <Shield className="h-4 w-4" />
      case 'intake': return <Car className="h-4 w-4" />
      case 'title': return <FileText className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <AppLayout user={user}>
        <LoadingState text="Loading dashboard..." />
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Dashboard"
        description="Welcome back! Here's what's happening with your vehicles."
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link 
            href="/vehicles" 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.vehicles.total || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.vehicles.inTransit || 0} in transit
                </p>
              </div>
            </div>
          </Link>

          <Link 
            href="/titles" 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vehicle Titles</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.titles.total || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.titles.pending || 0} pending
                </p>
              </div>
            </div>
          </Link>

          <Link 
            href="/services" 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Service Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.services.total || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.services.pending || 0} pending
                </p>
              </div>
            </div>
          </Link>

          <Link 
            href="/claims" 
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Insurance Claims</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.claims.total || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.claims.new || 0} new
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions & Pending Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/intake/new"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <Plus className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Add Vehicle</p>
                    <p className="text-xs text-gray-500">Submit new intake</p>
                  </div>
                </Link>
                
                <Link
                  href="/services"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
                >
                  <Wrench className="h-8 w-8 text-gray-400 group-hover:text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Request Service</p>
                    <p className="text-xs text-gray-500">Get vehicle services</p>
                  </div>
                </Link>
                
                <Link
                  href="/claims"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors group"
                >
                  <Shield className="h-8 w-8 text-gray-400 group-hover:text-red-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">File Claim</p>
                    <p className="text-xs text-gray-500">Submit insurance claim</p>
                  </div>
                </Link>
                
                <Link
                  href="/calculators"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                >
                  <TrendingUp className="h-8 w-8 text-gray-400 group-hover:text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Calculate Costs</p>
                    <p className="text-xs text-gray-500">Estimate shipping</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
            </div>
            <div className="p-6">
              {pendingItems.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle className="h-12 w-12" />}
                  title="All caught up!"
                  description="No pending actions at the moment."
                />
              ) : (
                <div className="space-y-4">
                  {pendingItems.slice(0, 5).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex-shrink-0 text-gray-400">
                        {getItemIcon(item.type)}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                      <div className="ml-3 flex items-center space-x-3">
                        <StatusBadge status={item.status} size="sm" />
                        <span className="text-xs text-gray-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {pendingItems.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500">
                        And {pendingItems.length - 5} more items...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}