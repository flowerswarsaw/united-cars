'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingState } from '@/components/ui/loading-state'
import { EmptyState } from '@/components/ui/empty-state'
import { useSession } from '@/hooks/useSession'
import { 
  Truck, 
  Ship, 
  Edit, 
  Plus, 
  Settings,
  MapPin,
  DollarSign,
  Filter,
  Save,
  X,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Port {
  id: string
  name: string
  state: string
  country: string
  code: string
}

interface AuctionLocation {
  id: string
  auction: 'COPART' | 'IAA' | 'MANHEIM' | 'ADESA'
  code: string
  name: string
  state: string
  country: string
  preferredPortId: string | null
  preferredPort?: Port | null
}

interface VehicleType {
  id: string
  key: string
  name: string
  category: string
  multiplier: number
}

interface TowingRoute {
  id: string
  auctionLocationId: string
  deliveryPortId: string
  basePrice: number
  active: boolean
  vehiclePrices: { [vehicleTypeId: string]: number }
  auctionLocation?: AuctionLocation
  deliveryPort?: Port
}

export default function AdminTowingMatricesPage() {
  const router = useRouter()
  const { user, loading: sessionLoading } = useSession()
  
  const [towingRoutes, setTowingRoutes] = useState<TowingRoute[]>([])
  const [auctionLocations, setAuctionLocations] = useState<AuctionLocation[]>([])
  const [ports, setPorts] = useState<Port[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  
  const [loading, setLoading] = useState(true)
  const [editingRoute, setEditingRoute] = useState<string | null>(null)
  const [showNewRouteForm, setShowNewRouteForm] = useState(false)
  
  const [filters, setFilters] = useState({
    auction: 'all',
    location: 'all',
    port: 'all',
    status: 'all'
  })

  const [newRouteForm, setNewRouteForm] = useState({
    auctionLocationId: '',
    deliveryPortId: '',
    basePrice: 0,
    active: true
  })

  const [editForm, setEditForm] = useState<Partial<TowingRoute>>({})

  useEffect(() => {
    if (user && !sessionLoading) {
      if (!user.roles?.includes('ADMIN')) {
        router.push('/calculator')
        return
      }
      fetchData()
    }
  }, [user, sessionLoading, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [routesRes, locationsRes, portsRes, vehicleTypesRes] = await Promise.all([
        fetch(`/api/admin/towing-matrices?${new URLSearchParams({
          ...(filters.auction !== 'all' && { auction: filters.auction }),
          ...(filters.location !== 'all' && { location: filters.location }),
          ...(filters.port !== 'all' && { port: filters.port }),
        })}`),
        fetch('/api/admin/locations'),
        fetch('/api/admin/ports'),
        fetch('/api/admin/vehicle-types')
      ])

      const [routesData, locationsData, portsData, vehicleTypesData] = await Promise.all([
        routesRes.json(),
        locationsRes.json(),
        portsRes.json(),
        vehicleTypesRes.json()
      ])

      if (routesData.success) {
        let filteredRoutes = routesData.data.routes
        
        if (filters.status === 'active') {
          filteredRoutes = filteredRoutes.filter((route: TowingRoute) => route.active)
        } else if (filters.status === 'inactive') {
          filteredRoutes = filteredRoutes.filter((route: TowingRoute) => !route.active)
        }
        
        setTowingRoutes(filteredRoutes)
      }
      
      if (locationsData.success) {
        setAuctionLocations(locationsData.data.locations)
      }
      
      if (portsData.success) {
        setPorts(portsData.data.ports)
      }
      
      if (vehicleTypesData.success) {
        setVehicleTypes(vehicleTypesData.data.vehicleTypes)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load towing matrices data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoute = async () => {
    try {
      if (!newRouteForm.auctionLocationId || !newRouteForm.deliveryPortId || newRouteForm.basePrice <= 0) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await fetch('/api/admin/towing-matrices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRouteForm)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Towing route created successfully!')
        setTowingRoutes([result.data, ...towingRoutes])
        setShowNewRouteForm(false)
        setNewRouteForm({
          auctionLocationId: '',
          deliveryPortId: '',
          basePrice: 0,
          active: true
        })
      } else {
        toast.error(result.error || 'Failed to create route')
      }

    } catch (error) {
      console.error('Error creating route:', error)
      toast.error('Failed to create route')
    }
  }

  const handleUpdateRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/admin/towing-matrices/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Route updated successfully!')
        setTowingRoutes(routes => 
          routes.map(route => route.id === routeId ? result.data : route)
        )
        setEditingRoute(null)
        setEditForm({})
      } else {
        toast.error(result.error || 'Failed to update route')
      }

    } catch (error) {
      console.error('Error updating route:', error)
      toast.error('Failed to update route')
    }
  }

  const startEditingRoute = (route: TowingRoute) => {
    setEditingRoute(route.id)
    setEditForm({
      basePrice: route.basePrice,
      vehiclePrices: { ...route.vehiclePrices },
      active: route.active
    })
  }

  const recalculateBasePrice = () => {
    if (!editForm.vehiclePrices) return

    const sedanPrice = editForm.vehiclePrices['vt-sedan'] || 0
    const suvPrice = editForm.vehiclePrices['vt-suv'] || 0
    const newBasePrice = Math.round((sedanPrice + suvPrice) / 2)

    setEditForm({ ...editForm, basePrice: newBasePrice })
  }

  // Auto-recalculate base price when sedan or SUV prices change
  const updateVehiclePrice = (vehicleTypeId: string, price: number) => {
    const newVehiclePrices = {
      ...editForm.vehiclePrices,
      [vehicleTypeId]: price
    }
    
    let newBasePrice = editForm.basePrice || 0
    if (vehicleTypeId === 'vt-sedan' || vehicleTypeId === 'vt-suv') {
      const sedanPrice = newVehiclePrices['vt-sedan'] || 0
      const suvPrice = newVehiclePrices['vt-suv'] || 0
      newBasePrice = Math.round((sedanPrice + suvPrice) / 2)
    }
    
    setEditForm({
      ...editForm,
      vehiclePrices: newVehiclePrices,
      basePrice: newBasePrice
    })
  }

  const getAuctionHouses = () => {
    return [...new Set(auctionLocations.map(loc => loc.auction))]
  }

  const getStates = () => {
    return [...new Set(auctionLocations.map(loc => loc.state))].sort()
  }

  if (loading || sessionLoading) {
    return (
      <AppLayout user={user}>
        <div className="flex items-center justify-center min-h-96">
          <LoadingState text="Loading towing matrices..." />
        </div>
      </AppLayout>
    )
  }

  if (!user || !user.roles?.includes('ADMIN')) {
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

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Admin - Towing Matrices"
        description="Manage towing routes from auction locations to shipping ports with vehicle-specific pricing"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Towing Matrices' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                
                <select
                  value={filters.auction}
                  onChange={(e) => setFilters({ ...filters, auction: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Auctions</option>
                  {getAuctionHouses().map(auction => (
                    <option key={auction} value={auction}>{auction}</option>
                  ))}
                </select>
                
                <select
                  value={filters.port}
                  onChange={(e) => setFilters({ ...filters, port: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Ports</option>
                  {ports.map(port => (
                    <option key={port.id} value={port.id}>{port.name}, {port.state}</option>
                  ))}
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowNewRouteForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Towing Route
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Routes</p>
                <p className="text-2xl font-semibold text-gray-900">{towingRoutes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auction Locations</p>
                <p className="text-2xl font-semibold text-gray-900">{auctionLocations.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Ship className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Shipping Ports</p>
                <p className="text-2xl font-semibold text-gray-900">{ports.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Routes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {towingRoutes.filter(r => r.active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* New Route Form Modal */}
        {showNewRouteForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Towing Route</h3>
                  <button
                    onClick={() => setShowNewRouteForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Auction Location *
                    </label>
                    <select
                      value={newRouteForm.auctionLocationId}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, auctionLocationId: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select auction location</option>
                      {auctionLocations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.auction} - {location.name}, {location.state}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Port *
                    </label>
                    <select
                      value={newRouteForm.deliveryPortId}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, deliveryPortId: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select delivery port</option>
                      {ports.map(port => (
                        <option key={port.id} value={port.id}>
                          {port.name}, {port.state} ({port.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price (USD) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={newRouteForm.basePrice}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, basePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 250"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Fixed prices will be set for all vehicle types (no multipliers)
                    </p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newRouteForm.active}
                        onChange={(e) => setNewRouteForm({ ...newRouteForm, active: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active route</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowNewRouteForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateRoute}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Route
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Towing Routes List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                Towing Routes
              </h2>
              <span className="text-sm text-gray-500">
                {towingRoutes.length} routes
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {towingRoutes.length === 0 ? (
              <EmptyState
                icon={<Truck className="h-12 w-12" />}
                title="No towing routes found"
                description="Create your first towing route to start managing pricing matrices."
              />
            ) : (
              <div className="space-y-4">
                {towingRoutes.map((route) => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-6">
                    {editingRoute === route.id ? (
                      /* Edit Form */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900">
                            Edit Route: {route.auctionLocation?.auction} {route.auctionLocation?.name} → {route.deliveryPort?.name}
                          </h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateRoute(route.id)}
                              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingRoute(null)
                                setEditForm({})
                              }}
                              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Reference Base Price (Auto-calculated)
                            </label>
                            <input
                              type="number"
                              value={editForm.basePrice || route.basePrice || 0}
                              disabled
                              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Auto-calculated as average of Sedan + SUV prices
                            </p>
                          </div>
                          
                          <div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editForm.active ?? route.active}
                                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Active route</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Fixed Vehicle Pricing (no multipliers)</h5>
                          <p className="text-xs text-gray-500 mb-3">Set exact price for each vehicle type on this route</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {vehicleTypes.map(vt => (
                              <div key={vt.id} className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 w-20 flex-shrink-0">
                                  {vt.name}:
                                </span>
                                <div className="flex items-center flex-1">
                                  <span className="text-sm text-gray-500 mr-1">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={editForm.vehiclePrices?.[vt.id] || route.vehiclePrices[vt.id] || 0}
                                    onChange={(e) => updateVehiclePrice(vt.id, parseFloat(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              💡 Tip: Base price is auto-calculated as average of Sedan + SUV prices for reference only
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Route Info */}
                        <div className="lg:col-span-2">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 mt-1">
                              <Truck className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-medium text-gray-900">
                                  {route.auctionLocation?.auction} {route.auctionLocation?.name}
                                </h4>
                                <span className="text-gray-400">→</span>
                                <h4 className="text-lg font-medium text-gray-900">
                                  {route.deliveryPort?.name}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  route.active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {route.active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {route.auctionLocation?.state} → {route.deliveryPort?.state} ({route.deliveryPort?.code})
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Pricing Info */}
                        <div className="lg:col-span-1">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Pricing Range</h5>
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="text-lg font-semibold text-gray-900">
                              ${Math.min(...Object.values(route.vehiclePrices))} - ${Math.max(...Object.values(route.vehiclePrices))}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {Object.keys(route.vehiclePrices).length} vehicle types with fixed prices
                            </p>
                            <p className="text-xs text-gray-400">
                              Ref. base: ${route.basePrice}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-1">
                          <div className="space-y-2">
                            <button
                              onClick={() => startEditingRoute(route)}
                              className="w-full bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Route
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}