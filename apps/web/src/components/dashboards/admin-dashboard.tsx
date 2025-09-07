'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Car, FileText, Wrench, Shield, Package, Users, TrendingUp, 
  Clock, AlertCircle, Plus, Settings, Database, DollarSign,
  BarChart3, Activity, Map, Truck, Calculator
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'

interface AdminStats {
  totalRevenue: number
  monthlyRevenue: number
  activeUsers: number
  newUsers: number
  vehicles: {
    total: number
    inTransit: number
    atAuction: number
    delivered: number
  }
  titles: {
    total: number
    processing: number
    qualityReview: number
    shipped: number
  }
  services: {
    total: number
    pending: number
    inProgress: number
    completed: number
  }
  claims: {
    total: number
    new: number
    underReview: number
    approved: number
  }
  packages: {
    total: number
    inTransit: number
    delivered: number
  }
}

interface SystemActivity {
  id: string
  type: string
  message: string
  timestamp: string
  userId: string
  userName: string
  metadata?: any
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activities, setActivities] = useState<SystemActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const [vehiclesRes, titlesRes, servicesRes, claimsRes, intakesRes, paymentsRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/titles'),
        fetch('/api/services'),
        fetch('/api/claims'),
        fetch('/api/intakes'),
        fetch('/api/payments')
      ])

      const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : { vehicles: [] }
      const titles = titlesRes.ok ? await titlesRes.json() : { titles: [] }
      const services = servicesRes.ok ? await servicesRes.json() : { serviceRequests: [] }
      const claims = claimsRes.ok ? await claimsRes.json() : { claims: [] }
      const intakes = intakesRes.ok ? await intakesRes.json() : { intakes: [] }
      const payments = paymentsRes.ok ? await paymentsRes.json() : { payments: [] }

      // Calculate comprehensive admin stats
      const adminStats: AdminStats = {
        totalRevenue: payments.payments?.reduce((sum: number, p: any) => 
          p.status === 'completed' ? sum + p.amount : sum, 0) || 0,
        monthlyRevenue: payments.payments?.filter((p: any) => {
          const date = new Date(p.createdAt)
          const now = new Date()
          return date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear() &&
                 p.status === 'completed'
        }).reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
        activeUsers: 156, // Mock data
        newUsers: 12, // Mock data
        vehicles: {
          total: vehicles.vehicles?.length || 0,
          inTransit: vehicles.vehicles?.filter((v: any) => v.status === 'IN_TRANSIT').length || 0,
          atAuction: vehicles.vehicles?.filter((v: any) => v.status === 'AT_AUCTION').length || 0,
          delivered: vehicles.vehicles?.filter((v: any) => v.status === 'DELIVERED').length || 0
        },
        titles: {
          total: titles.titles?.length || 0,
          processing: titles.titles?.filter((t: any) => t.status === 'processing').length || 0,
          qualityReview: titles.titles?.filter((t: any) => t.status === 'quality_review').length || 0,
          shipped: titles.titles?.filter((t: any) => t.status === 'shipped').length || 0
        },
        services: {
          total: services.serviceRequests?.length || 0,
          pending: services.serviceRequests?.filter((s: any) => s.status === 'pending').length || 0,
          inProgress: services.serviceRequests?.filter((s: any) => s.status === 'in_progress').length || 0,
          completed: services.serviceRequests?.filter((s: any) => s.status === 'completed').length || 0
        },
        claims: {
          total: claims.claims?.length || 0,
          new: claims.claims?.filter((c: any) => c.status === 'new').length || 0,
          underReview: claims.claims?.filter((c: any) => c.status === 'review').length || 0,
          approved: claims.claims?.filter((c: any) => c.status === 'approved').length || 0
        },
        packages: {
          total: titles.packages?.length || 0,
          inTransit: titles.packages?.filter((p: any) => p.status === 'in_transit').length || 0,
          delivered: titles.packages?.filter((p: any) => p.status === 'delivered').length || 0
        }
      }

      // Create recent activities from various sources
      const recentActivities: SystemActivity[] = []
      
      // Add recent intakes
      intakes.intakes?.slice(0, 3).forEach((intake: any) => {
        recentActivities.push({
          id: intake.id,
          type: 'intake',
          message: `New vehicle intake submitted: ${intake.year} ${intake.make} ${intake.model}`,
          timestamp: intake.createdAt,
          userId: intake.userId || 'system',
          userName: intake.userName || 'System'
        })
      })

      // Add recent service requests
      services.serviceRequests?.slice(0, 3).forEach((service: any) => {
        recentActivities.push({
          id: service.id,
          type: 'service',
          message: `Service request created: ${service.type}`,
          timestamp: service.createdAt,
          userId: service.userId || 'system',
          userName: 'Service Team'
        })
      })

      // Add recent claims
      claims.claims?.slice(0, 2).forEach((claim: any) => {
        recentActivities.push({
          id: claim.id,
          type: 'claim',
          message: `New insurance claim filed for ${claim.vehicle?.year} ${claim.vehicle?.make} ${claim.vehicle?.model}`,
          timestamp: claim.createdAt,
          userId: claim.userId || 'system',
          userName: 'Claims Department'
        })
      })

      setStats(adminStats)
      setActivities(recentActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
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
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-success via-success to-success/90 rounded-lg shadow-sm p-6 text-success-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-foreground/80">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-success-foreground/80 text-sm mt-1">All time</p>
            </div>
            <DollarSign className="h-10 w-10 text-success-foreground/60" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary via-primary to-primary/90 rounded-lg shadow-sm p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80">Monthly Revenue</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-primary-foreground/80 text-sm mt-1">Current month</p>
            </div>
            <BarChart3 className="h-10 w-10 text-primary-foreground/60" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-chart-4 via-chart-4 to-chart-4/90 rounded-lg shadow-sm p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80">Active Users</p>
              <p className="text-3xl font-bold mt-2">{stats.activeUsers}</p>
              <p className="text-primary-foreground/80 text-sm mt-1">+{stats.newUsers} new this month</p>
            </div>
            <Users className="h-10 w-10 text-primary-foreground/60" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-warning via-warning to-warning/90 rounded-lg shadow-sm p-6 text-warning-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-warning-foreground/80">Active Vehicles</p>
              <p className="text-3xl font-bold mt-2">{stats.vehicles.inTransit}</p>
              <p className="text-warning-foreground/80 text-sm mt-1">In transit now</p>
            </div>
            <Truck className="h-10 w-10 text-warning-foreground/60" />
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Vehicles</h3>
            <Link href="/vehicles" className="text-primary hover:text-primary/80 text-sm">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total Vehicles</span>
              <span className="font-semibold">{stats.vehicles.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">At Auction</span>
              <span className="font-semibold text-warning">{stats.vehicles.atAuction}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">In Transit</span>
              <span className="font-semibold text-primary">{stats.vehicles.inTransit}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Delivered</span>
              <span className="font-semibold text-success">{stats.vehicles.delivered}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Titles</h3>
            <Link href="/admin/titles" className="text-primary hover:text-primary/80 text-sm">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total Titles</span>
              <span className="font-semibold">{stats.titles.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Processing</span>
              <span className="font-semibold text-warning">{stats.titles.processing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Quality Review</span>
              <span className="font-semibold text-warning">{stats.titles.qualityReview}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Shipped</span>
              <span className="font-semibold text-primary">{stats.titles.shipped}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Services & Claims</h3>
            <Link href="/admin/services" className="text-primary hover:text-primary/80 text-sm">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Service Requests</span>
              <span className="font-semibold">{stats.services.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Pending Services</span>
              <span className="font-semibold text-warning">{stats.services.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total Claims</span>
              <span className="font-semibold">{stats.claims.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Claims Under Review</span>
              <span className="font-semibold text-warning">{stats.claims.underReview}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions & System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Admin Quick Actions */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Admin Tools</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/admin/users"
                className="flex items-center p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors group"
              >
                <Users className="h-8 w-8 text-text-tertiary group-hover:text-primary" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">User Management</p>
                  <p className="text-xs text-text-tertiary">Manage users & roles</p>
                </div>
              </Link>
              
              <Link
                href="/admin/pricing"
                className="flex items-center p-4 border border-border rounded-lg hover:border-success/50 hover:bg-success/5 transition-colors group"
              >
                <Calculator className="h-8 w-8 text-text-tertiary group-hover:text-success" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">Pricing Rules</p>
                  <p className="text-xs text-text-tertiary">Configure pricing</p>
                </div>
              </Link>
              
              <Link
                href="/admin/towing-matrices"
                className="flex items-center p-4 border border-border rounded-lg hover:border-chart-4/50 hover:bg-chart-4/5 transition-colors group"
              >
                <Map className="h-8 w-8 text-text-tertiary group-hover:text-chart-4" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">Towing Matrix</p>
                  <p className="text-xs text-text-tertiary">Update routes & costs</p>
                </div>
              </Link>
              
              <Link
                href="/admin/intake"
                className="flex items-center p-4 border border-border rounded-lg hover:border-warning/50 hover:bg-warning/5 transition-colors group"
              >
                <Database className="h-8 w-8 text-text-tertiary group-hover:text-warning" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-foreground">Intake Review</p>
                  <p className="text-xs text-text-tertiary">Review submissions</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* System Activity Feed */}
        <div className="bg-card rounded-lg shadow-sm border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">System Activity</h2>
          </div>
          <div className="p-6">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-tertiary">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'intake' && <Car className="h-5 w-5 text-primary" />}
                      {activity.type === 'service' && <Wrench className="h-5 w-5 text-success" />}
                      {activity.type === 'claim' && <Shield className="h-5 w-5 text-destructive" />}
                      {activity.type === 'title' && <FileText className="h-5 w-5 text-chart-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {activity.userName} • {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}