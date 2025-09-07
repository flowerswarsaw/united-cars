'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Car, FileText, Package, DollarSign, Clock, CheckCircle,
  AlertCircle, TrendingUp, Calendar, Plus, Search, Eye,
  CreditCard, Receipt, Truck, Shield
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { VehicleStatusTracker } from '@/components/ui/vehicle-status-tracker'

interface DealerStats {
  totalSpent: number
  monthlySpent: number
  pendingPayments: number
  vehicles: {
    total: number
    inTransit: number
    delivered: number
    pending: number
  }
  titles: {
    total: number
    processing: number
    received: number
    pending: number
  }
  invoices: {
    total: number
    pending: number
    paid: number
    overdue: number
  }
  services: {
    total: number
    active: number
    completed: number
  }
}

interface DealerVehicle {
  id: string
  vin: string
  year: number
  make: string
  model: string
  status: string
  purchaseDate: string
  estimatedDelivery?: string
  titleStatus?: string
  location?: string
  totalCost?: number
}

interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: string
  status?: string
}

interface UserData {
  name: string
  orgName: string
}

export function DealerDashboard({ user }: { user: UserData }) {
  const [stats, setStats] = useState<DealerStats | null>(null)
  const [vehicles, setVehicles] = useState<DealerVehicle[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDealerData()
  }, [])

  const fetchDealerData = async () => {
    try {
      const [vehiclesRes, titlesRes, invoicesRes, servicesRes, paymentsRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/titles'),
        fetch('/api/invoices'),
        fetch('/api/services'),
        fetch('/api/payments')
      ])

      const vehiclesData = vehiclesRes.ok ? await vehiclesRes.json() : { vehicles: [] }
      const titlesData = titlesRes.ok ? await titlesRes.json() : { titles: [] }
      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : { invoices: [] }
      const servicesData = servicesRes.ok ? await servicesRes.json() : { serviceRequests: [] }
      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { payments: [] }

      // Filter data for this dealer (in production, this would be done server-side)
      const dealerVehicles = vehiclesData.vehicles || []
      const dealerTitles = titlesData.titles || []
      const dealerInvoices = invoicesData.invoices || []
      const dealerServices = servicesData.serviceRequests || []
      const dealerPayments = paymentsData.payments || []

      // Calculate dealer-specific stats
      const dealerStats: DealerStats = {
        totalSpent: dealerPayments.filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + p.amount, 0),
        monthlySpent: dealerPayments.filter((p: any) => {
          const date = new Date(p.createdAt)
          const now = new Date()
          return date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear() &&
                 p.status === 'completed'
        }).reduce((sum: number, p: any) => sum + p.amount, 0),
        pendingPayments: dealerInvoices.filter((i: any) => i.status === 'pending')
          .reduce((sum: number, i: any) => sum + i.totalAmount, 0),
        vehicles: {
          total: dealerVehicles.length,
          inTransit: dealerVehicles.filter((v: any) => v.status === 'IN_TRANSIT').length,
          delivered: dealerVehicles.filter((v: any) => v.status === 'DELIVERED').length,
          pending: dealerVehicles.filter((v: any) => v.status === 'SOURCING').length
        },
        titles: {
          total: dealerTitles.length,
          processing: dealerTitles.filter((t: any) => t.status === 'processing').length,
          received: dealerTitles.filter((t: any) => t.status === 'received').length,
          pending: dealerTitles.filter((t: any) => t.status === 'pending').length
        },
        invoices: {
          total: dealerInvoices.length,
          pending: dealerInvoices.filter((i: any) => i.status === 'pending').length,
          paid: dealerInvoices.filter((i: any) => i.status === 'paid').length,
          overdue: dealerInvoices.filter((i: any) => i.status === 'overdue').length
        },
        services: {
          total: dealerServices.length,
          active: dealerServices.filter((s: any) => 
            s.status === 'pending' || s.status === 'in_progress').length,
          completed: dealerServices.filter((s: any) => s.status === 'completed').length
        }
      }

      // Get recent vehicles for the dealer
      const recentVehicles = dealerVehicles.slice(0, 5).map((v: any) => ({
        id: v.id,
        vin: v.vin,
        year: v.year,
        make: v.make,
        model: v.model,
        status: v.status,
        purchaseDate: v.purchaseDate || v.createdAt,
        estimatedDelivery: v.estimatedDelivery,
        titleStatus: dealerTitles.find((t: any) => t.vin === v.vin)?.status,
        location: v.currentLocation,
        totalCost: v.totalCost
      }))

      // Build recent activities
      const recentActivities: RecentActivity[] = []
      
      // Add recent vehicle updates
      dealerVehicles.slice(0, 3).forEach((v: any) => {
        recentActivities.push({
          id: `vehicle-${v.id}`,
          type: 'vehicle',
          description: `${v.year} ${v.make} ${v.model} status updated to ${v.status}`,
          timestamp: v.updatedAt || v.createdAt,
          status: v.status
        })
      })

      // Add recent title updates
      dealerTitles.slice(0, 2).forEach((t: any) => {
        recentActivities.push({
          id: `title-${t.id}`,
          type: 'title',
          description: `Title for VIN ${t.vin} - ${t.status}`,
          timestamp: t.updatedAt || t.createdAt,
          status: t.status
        })
      })

      // Add recent invoice updates
      dealerInvoices.slice(0, 2).forEach((i: any) => {
        recentActivities.push({
          id: `invoice-${i.id}`,
          type: 'invoice',
          description: `Invoice #${i.invoiceNumber} - ${i.status}`,
          timestamp: i.createdAt,
          status: i.status
        })
      })

      setStats(dealerStats)
      setVehicles(recentVehicles)
      setActivities(recentActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))
    } catch (error) {
      console.error('Failed to fetch dealer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vehicle': return <Car className="h-5 w-5 text-blue-500" />
      case 'title': return <FileText className="h-5 w-5 text-purple-500" />
      case 'invoice': return <Receipt className="h-5 w-5 text-green-500" />
      case 'service': return <Shield className="h-5 w-5 text-orange-500" />
      default: return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome back, {user.name}!</h2>
        <p className="text-blue-100 mt-2">{user.orgName} • Dealer Dashboard</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Vehicles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.vehicles.inTransit}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.vehicles.total} total vehicles
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Titles</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.titles.processing}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.titles.received} received
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Spend</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.monthlySpent)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.pendingPayments)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.invoices.pending} invoices
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/intake/new"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-2" />
              <p className="text-sm font-medium text-gray-900">New Vehicle</p>
              <p className="text-xs text-gray-500">Submit intake</p>
            </Link>
            
            <Link
              href="/titles"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
            >
              <Search className="h-8 w-8 text-gray-400 group-hover:text-purple-500 mb-2" />
              <p className="text-sm font-medium text-gray-900">Track Title</p>
              <p className="text-xs text-gray-500">Check status</p>
            </Link>
            
            <Link
              href="/invoices"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
            >
              <Receipt className="h-8 w-8 text-gray-400 group-hover:text-green-500 mb-2" />
              <p className="text-sm font-medium text-gray-900">View Invoices</p>
              <p className="text-xs text-gray-500">Payment history</p>
            </Link>
            
            <Link
              href="/calculator"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors group"
            >
              <TrendingUp className="h-8 w-8 text-gray-400 group-hover:text-orange-500 mb-2" />
              <p className="text-sm font-medium text-gray-900">Calculator</p>
              <p className="text-xs text-gray-500">Estimate costs</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Vehicles & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Vehicles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Your Recent Vehicles</h2>
            <Link href="/vehicles" className="text-blue-600 hover:text-blue-700 text-sm">
              View all →
            </Link>
          </div>
          <div className="p-6">
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No vehicles yet</p>
                <Link href="/intake/new" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                  Add your first vehicle →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/vehicles/${vehicle.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          VIN: {vehicle.vin}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={vehicle.status} size="sm" />
                        {vehicle.titleStatus && (
                          <p className="text-xs text-gray-500 mt-1">
                            Title: {vehicle.titleStatus}
                          </p>
                        )}
                      </div>
                    </div>
                    {vehicle.estimatedDelivery && (
                      <p className="text-xs text-gray-500 mt-2">
                        Est. delivery: {formatDate(vehicle.estimatedDelivery)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    {activity.status && (
                      <StatusBadge status={activity.status} size="sm" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Items Alert */}
      {(stats.invoices.overdue > 0 || stats.titles.pending > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-900">Action Required</h3>
              <div className="text-sm text-yellow-700 mt-1">
                {stats.invoices.overdue > 0 && (
                  <p>• You have {stats.invoices.overdue} overdue invoice(s)</p>
                )}
                {stats.titles.pending > 0 && (
                  <p>• {stats.titles.pending} title(s) pending documentation</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}