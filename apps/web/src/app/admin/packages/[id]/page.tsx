'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import { 
  ArrowLeft,
  Package,
  Truck,
  Calendar,
  Weight,
  Ruler,
  DollarSign,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { mockPackageData, getOrganizationTypeLabel, formatTrackingNumber, packageStatusConfig, packagePriorityConfig } from '@/lib/package-mock-data'
import { formatDate } from '@/lib/title-mock-data'
import type { EnhancedPackage } from '@/types/title-enhanced'

interface PackageDetailPageProps {
  params: {
    id: string
  }
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState<EnhancedPackage | null>(null)

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push('/auth/login')
      return
    }
    
    if (user) {
      fetchPackageData()
    }
  }, [user, sessionLoading, params.id])

  const fetchPackageData = async () => {
    try {
      setLoading(true)
      
      // Find package in mock data
      const foundPackage = mockPackageData.find(p => p.id === params.id)
      
      if (!foundPackage) {
        toast.error('Package not found')
        router.push('/admin/titles')
        return
      }
      
      setPkg(foundPackage)
    } catch (error) {
      toast.error('Error fetching package data')
      console.error('Error fetching package:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const config = packageStatusConfig[status as keyof typeof packageStatusConfig]
    return config?.color || 'default'
  }

  const getPriorityColor = (priority: string) => {
    const config = packagePriorityConfig[priority as keyof typeof packagePriorityConfig]
    return config?.color || 'text-gray-600'
  }

  if (sessionLoading || loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading package details..." />
      </AppLayout>
    )
  }

  if (!pkg) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Package not found</h3>
            <p className="mt-1 text-sm text-gray-500">The requested package could not be found.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/titles')}
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </button>
          
          <PageHeader 
            title={`Package ${pkg.id}`}
            subtitle="Package details and tracking information"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Package Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package ID</label>
                  <p className="text-sm text-gray-900 font-mono">{pkg.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <StatusBadge status={getStatusColor(pkg.status)} />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={`text-sm font-medium ${getPriorityColor(pkg.priority)}`}>
                    {packagePriorityConfig[pkg.priority as keyof typeof packagePriorityConfig]?.label || pkg.priority}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <p className="text-sm text-gray-900 font-mono">{formatTrackingNumber(pkg.trackingNumber)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                  <p className="text-sm text-gray-900">{pkg.provider || 'Not assigned'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(pkg.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sender</label>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{pkg.senderOrg.name}</p>
                    <p className="text-sm text-gray-500">{getOrganizationTypeLabel(pkg.senderOrg.type)}</p>
                    <p className="text-sm text-gray-600 mt-1">{pkg.senderOrg.email}</p>
                    <p className="text-sm text-gray-600">{pkg.senderOrg.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{pkg.recipientOrg.name}</p>
                    <p className="text-sm text-gray-500">{getOrganizationTypeLabel(pkg.recipientOrg.type)}</p>
                    <p className="text-sm text-gray-600 mt-1">{pkg.recipientOrg.email}</p>
                    <p className="text-sm text-gray-600">{pkg.recipientOrg.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Physical Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Weight className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Weight:</span>
                  <span className="text-sm text-gray-900 ml-1">{pkg.weight} lbs</span>
                </div>
                
                {pkg.dimensions && (
                  <div className="flex items-center">
                    <Ruler className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Dimensions:</span>
                    <span className="text-sm text-gray-900 ml-1">
                      {pkg.dimensions.length}"×{pkg.dimensions.width}"×{pkg.dimensions.height}"
                    </span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Insurance:</span>
                  <span className="text-sm text-gray-900 ml-1">${pkg.insuranceValue?.toLocaleString() || 'N/A'}</span>
                </div>
                
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">Titles:</span>
                  <span className="text-sm text-gray-900 ml-1">{pkg.titles.length}</span>
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery</h3>
              
              <div className="space-y-4">
                {pkg.estimatedDelivery && (
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <span className="text-sm text-gray-600 block">Estimated:</span>
                      <span className="text-sm text-gray-900">{formatDate(pkg.estimatedDelivery)}</span>
                    </div>
                  </div>
                )}
                
                {pkg.actualDelivery && (
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <span className="text-sm text-gray-600 block">Delivered:</span>
                      <span className="text-sm text-gray-900">{formatDate(pkg.actualDelivery)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}