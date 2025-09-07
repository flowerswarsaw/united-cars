'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Car, MapPin, Calendar, DollarSign, Info } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '@/hooks/useSession'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Vehicle {
  id: string
  vin: string
  make: string | null
  model: string | null
  year: number | null
  status: 'SOURCING' | 'PURCHASED' | 'IN_TRANSIT' | 'AT_PORT' | 'SHIPPED' | 'DELIVERED'
  priceUSD: number | null
  purchasedAt: string | null
  createdAt: string
  updatedAt: string
  org: {
    name: string
  }
}

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params?.id as string
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: sessionLoading } = useSession()

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle()
    }
  }, [vehicleId])

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`)
      const data = await response.json()
      
      if (response.ok) {
        setVehicle(data.vehicle)
      } else {
        toast.error(`Failed to fetch vehicle: ${data.error}`)
        router.push('/vehicles')
      }
    } catch (error) {
      toast.error('Error fetching vehicle details')
      console.error('Error:', error)
      router.push('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const getVehicleDisplay = (vehicle: Vehicle) => {
    if (vehicle.year && vehicle.make && vehicle.model) {
      return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    }
    return 'Unknown Vehicle'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not available'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Not available'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(price))
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading vehicle details..." />
        </div>
      </AppLayout>
    )
  }

  if (!vehicle) {
    return (
      <AppLayout user={user}>
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Vehicle not found</h2>
            <Link
              href="/vehicles"
              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to vehicles
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <PageHeader 
        title={getVehicleDisplay(vehicle)}
        description={`VIN: ${vehicle.vin}`}
        breadcrumbs={[
          { label: 'Main' }, 
          { label: 'Vehicles', href: '/vehicles' }, 
          { label: getVehicleDisplay(vehicle) }
        ]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/vehicles"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to vehicles
          </Link>
        </div>

        {/* Vehicle Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Car className="h-5 w-5 mr-2 text-blue-600" />
                Vehicle Details
              </h2>
              <StatusBadge status={vehicle.status} />
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Basic Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">VIN</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{vehicle.vin}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Make</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vehicle.make || 'Not specified'}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Model</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vehicle.model || 'Not specified'}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Year</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vehicle.year || 'Not specified'}</dd>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Financial Information
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Purchase Price</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">
                      {formatPrice(vehicle.priceUSD)}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Organization</dt>
                    <dd className="mt-1 text-sm text-gray-900">{vehicle.org.name}</dd>
                  </div>
                </div>
              </div>

              {/* Timeline Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Timeline
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Purchased At</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(vehicle.purchasedAt)}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(vehicle.createdAt)}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(vehicle.updatedAt)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Current Status</h3>
              <p className="mt-1 text-sm text-blue-700">
                This vehicle is currently in <strong>{vehicle.status.toLowerCase().replace('_', ' ')}</strong> status.
                {vehicle.status === 'SOURCING' && ' The vehicle is being located and acquired.'}
                {vehicle.status === 'PURCHASED' && ' The vehicle has been successfully purchased.'}
                {vehicle.status === 'IN_TRANSIT' && ' The vehicle is being transported.'}
                {vehicle.status === 'AT_PORT' && ' The vehicle has arrived at the port.'}
                {vehicle.status === 'SHIPPED' && ' The vehicle is being shipped to its destination.'}
                {vehicle.status === 'DELIVERED' && ' The vehicle has been delivered to the customer.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}