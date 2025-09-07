'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/ui/loading-state'
import { AdminDashboard } from '@/components/dashboards/admin-dashboard'
import { DealerDashboard } from '@/components/dashboards/dealer-dashboard'

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  orgId: string
  orgName: string
  orgType: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchSessionData()
  }, [])

  const fetchSessionData = async () => {
    try {
      // Fetch session data to determine user role
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        // Redirect to login if not authenticated
        window.location.href = '/login'
        return
      }
      
      const sessionData = await sessionRes.json()
      setUser(sessionData.user)
    } catch (error) {
      console.error('Failed to fetch session:', error)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  // Determine if user is admin based on their roles
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ACCOUNTING') || user?.roles?.includes('OPS')
  const isDealer = user?.roles?.includes('DEALER') || user?.roles?.includes('RETAIL')

  if (loading || !user) {
    return (
      <AppLayout user={user}>
        <LoadingState text="Loading dashboard..." />
      </AppLayout>
    )
  }

  // Get dashboard title and description based on user role
  const getDashboardInfo = () => {
    if (isAdmin) {
      return {
        title: 'Admin Dashboard',
        description: 'System overview and management tools'
      }
    } else if (isDealer) {
      return {
        title: 'Dashboard',
        description: 'Your vehicles and account overview'
      }
    } else {
      return {
        title: 'Dashboard',
        description: 'Welcome to United Cars'
      }
    }
  }

  const dashboardInfo = getDashboardInfo()

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={dashboardInfo.title}
        description={dashboardInfo.description}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Render role-specific dashboard */}
        {isAdmin ? (
          <AdminDashboard />
        ) : isDealer ? (
          <DealerDashboard user={{ name: user.name, orgName: user.orgName }} />
        ) : (
          // Default dashboard for other roles
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900">Welcome to United Cars</h2>
            <p className="text-gray-600 mt-2">Please contact support for access to your dashboard.</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}