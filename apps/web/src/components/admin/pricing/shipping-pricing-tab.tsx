'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Ship, Search, Anchor, Car, Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import toast from 'react-hot-toast'

interface VehicleTypePricing {
  sedan: number
  smallMediumSUV: number
  bigSUV: number
  pickup: number
  van: number
  motorcycle: number
}

interface ConsolidationPricing {
  quarterContainer: number // 1/4 container
  thirdContainer: number   // 1/3 container
  halfContainer: number    // 1/2 container
  fullContainer: number    // Full container
}

interface ShippingMatrix {
  id: string
  shippingPort: string
  destinationPricing: {
    [destinationPort: string]: {
      vehicleTypePricing: VehicleTypePricing
      consolidationPricing: ConsolidationPricing
      country: string
    }
  }
  active: boolean
  createdAt: string
  updatedAt: string
}

const US_PORTS = [
  'Newark/New York, NJ',
  'Savannah, GA',
  'Houston, TX',
  'Los Angeles, CA',
  'Seattle, WA',
  'Norfolk, VA',
  'Miami, FL'
]

const DESTINATION_PORTS = [
  { port: 'Rotterdam, Netherlands', country: 'Netherlands', code: 'NLRTM' },
  { port: 'Bremerhaven, Germany', country: 'Germany', code: 'DEBRV' },
  { port: 'Klaipeda, Lithuania', country: 'Lithuania', code: 'LTKLP' },
  { port: 'Poti, Georgia', country: 'Georgia', code: 'GEPOT' },
  { port: 'Batumi, Georgia', country: 'Georgia', code: 'GEBAT' },
  { port: 'Dubai, UAE', country: 'UAE', code: 'AEDXB' },
  { port: 'Singapore', country: 'Singapore', code: 'SGSIN' },
  { port: 'Tokyo, Japan', country: 'Japan', code: 'JPTYO' }
]

const VEHICLE_TYPES = [
  { key: 'sedan', label: 'Sedan' },
  { key: 'smallMediumSUV', label: 'Small/Medium SUV' },
  { key: 'bigSUV', label: 'Big SUV' },
  { key: 'pickup', label: 'Pickup Truck' },
  { key: 'van', label: 'Van' },
  { key: 'motorcycle', label: 'Motorcycle' }
]

const CONSOLIDATION_TYPES = [
  { key: 'quarterContainer', label: '1/4 Container' },
  { key: 'thirdContainer', label: '1/3 Container' },
  { key: 'halfContainer', label: '1/2 Container' },
  { key: 'fullContainer', label: 'Full Container' }
]

export function ShippingPricingTab() {
  const [matrices, setMatrices] = useState<ShippingMatrix[]>([])
  const [allMatrices, setAllMatrices] = useState<ShippingMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPort, setFilterPort] = useState<string>('all')
  const [filterDestination, setFilterDestination] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMatrix, setEditingMatrix] = useState<ShippingMatrix | null>(null)
  const [formData, setFormData] = useState({
    shippingPort: 'Newark/New York, NJ',
    destinationPricing: {} as { [destinationPort: string]: {
      vehicleTypePricing: VehicleTypePricing
      consolidationPricing: ConsolidationPricing
      country: string
    }}
  })
  
  const [selectedDestination, setSelectedDestination] = useState<string>('')
  const [destinationPricingForm, setDestinationPricingForm] = useState<{
    vehicleTypePricing: VehicleTypePricing
    consolidationPricing: ConsolidationPricing
    country: string
  }>({
    vehicleTypePricing: {
      sedan: 1200,
      smallMediumSUV: 1350,
      bigSUV: 1500,
      pickup: 1400,
      van: 1600,
      motorcycle: 800
    },
    consolidationPricing: {
      quarterContainer: 1200,
      thirdContainer: 1000,
      halfContainer: 800,
      fullContainer: 600
    },
    country: 'Netherlands'
  })
  
  // Inline editing state
  const [editingPrice, setEditingPrice] = useState<{
    matrixId: string
    destinationPort: string
    priceType: 'vehicle' | 'consolidation'
    priceKey: string
  } | null>(null)
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0)

  // Mock data - shipping port to multiple destinations with vehicle and consolidation pricing
  const mockShippingData: ShippingMatrix[] = [
    {
      id: 'shipping-1',
      shippingPort: 'Newark/New York, NJ',
      destinationPricing: {
        'Rotterdam, Netherlands': {
          vehicleTypePricing: {
            sedan: 1200,
            smallMediumSUV: 1350,
            bigSUV: 1500,
            pickup: 1400,
            van: 1600,
            motorcycle: 800
          },
          consolidationPricing: {
            quarterContainer: 1200,
            thirdContainer: 1000,
            halfContainer: 800,
            fullContainer: 600
          },
          country: 'Netherlands'
        },
        'Bremerhaven, Germany': {
          vehicleTypePricing: {
            sedan: 1100,
            smallMediumSUV: 1250,
            bigSUV: 1400,
            pickup: 1300,
            van: 1500,
            motorcycle: 750
          },
          consolidationPricing: {
            quarterContainer: 1150,
            thirdContainer: 950,
            halfContainer: 750,
            fullContainer: 550
          },
          country: 'Germany'
        }
      },
      active: true,
      createdAt: '2024-02-01T11:00:00Z',
      updatedAt: '2024-03-01T13:20:00Z'
    },
    {
      id: 'shipping-2',
      shippingPort: 'Houston, TX',
      destinationPricing: {
        'Poti, Georgia': {
          vehicleTypePricing: {
            sedan: 1350,
            smallMediumSUV: 1500,
            bigSUV: 1650,
            pickup: 1550,
            van: 1750,
            motorcycle: 900
          },
          consolidationPricing: {
            quarterContainer: 1300,
            thirdContainer: 1100,
            halfContainer: 900,
            fullContainer: 700
          },
          country: 'Georgia'
        }
      },
      active: true,
      createdAt: '2024-02-01T12:00:00Z',
      updatedAt: '2024-03-02T09:30:00Z'
    },
    {
      id: 'shipping-3',
      shippingPort: 'Los Angeles, CA',
      destinationPricing: {
        'Dubai, UAE': {
          vehicleTypePricing: {
            sedan: 1800,
            smallMediumSUV: 2000,
            bigSUV: 2200,
            pickup: 2100,
            van: 2400,
            motorcycle: 1200
          },
          consolidationPricing: {
            quarterContainer: 1800,
            thirdContainer: 1500,
            halfContainer: 1200,
            fullContainer: 900
          },
          country: 'UAE'
        },
        'Singapore': {
          vehicleTypePricing: {
            sedan: 1600,
            smallMediumSUV: 1800,
            bigSUV: 2000,
            pickup: 1900,
            van: 2200,
            motorcycle: 1000
          },
          consolidationPricing: {
            quarterContainer: 1600,
            thirdContainer: 1300,
            halfContainer: 1000,
            fullContainer: 750
          },
          country: 'Singapore'
        }
      },
      active: true,
      createdAt: '2024-02-02T12:00:00Z',
      updatedAt: '2024-03-03T16:45:00Z'
    }
  ]

  useEffect(() => {
    // Load data from localStorage if available
    const savedMatrices = localStorage.getItem('shipping-matrices')
    if (savedMatrices) {
      try {
        const parsedMatrices = JSON.parse(savedMatrices)
        setAllMatrices(parsedMatrices)
        setMatrices(parsedMatrices)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load saved matrices:', error)
        fetchMatrices()
      }
    } else {
      fetchMatrices()
    }
  }, [])

  useEffect(() => {
    if (allMatrices.length > 0) {
      // Save to localStorage whenever all matrices change
      localStorage.setItem('shipping-matrices', JSON.stringify(allMatrices))
      // Dispatch custom event to notify calculator of updates
      window.dispatchEvent(new CustomEvent('pricingMatricesUpdated'))
    }
  }, [allMatrices])

  useEffect(() => {
    // Apply filters when they change
    if (allMatrices.length > 0) {
      applyFilters()
    }
  }, [filterPort, filterDestination, searchTerm, allMatrices])

  const fetchMatrices = async () => {
    try {
      // Load initial mock data
      setAllMatrices(mockShippingData)
      setMatrices(mockShippingData)
      // Save to localStorage for persistence
      localStorage.setItem('shipping-matrices', JSON.stringify(mockShippingData))
    } catch (error) {
      toast.error('Failed to fetch shipping matrices')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filteredData = [...allMatrices]
    
    if (filterPort !== 'all') {
      filteredData = filteredData.filter((m: ShippingMatrix) => m.shippingPort === filterPort)
    }
    
    if (filterDestination !== 'all') {
      filteredData = filteredData.filter((m: ShippingMatrix) => 
        Object.values(m.destinationPricing).some((dest: any) => dest.country === filterDestination)
      )
    }
    
    if (searchTerm) {
      filteredData = filteredData.filter((m: ShippingMatrix) => 
        Object.keys(m.destinationPricing).some(port => 
          port.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
    
    setMatrices(filteredData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (Object.keys(formData.destinationPricing).length === 0) {
      toast.error('Please add at least one destination with pricing')
      return
    }
    
    try {
      if (editingMatrix) {
        // Update existing matrix
        const updatedMatrix = { ...editingMatrix, ...formData, updatedAt: new Date().toISOString() }
        setAllMatrices(prev => prev.map(m => 
          m.id === editingMatrix.id ? updatedMatrix : m
        ))
        toast.success('Shipping matrix updated successfully')
      } else {
        // Create new matrix
        const newMatrix: ShippingMatrix = {
          id: `shipping-${Date.now()}`,
          ...formData,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setAllMatrices(prev => [newMatrix, ...prev])
        toast.success('Shipping matrix created successfully')
      }
      
      resetForm()
    } catch (error) {
      toast.error('Failed to save shipping matrix')
    }
  }

  const handleEdit = (matrix: ShippingMatrix) => {
    setEditingMatrix(matrix)
    setFormData({
      shippingPort: matrix.shippingPort,
      destinationPricing: { ...matrix.destinationPricing }
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this shipping matrix?')) {
      try {
        setAllMatrices(prev => prev.filter(m => m.id !== id))
        toast.success('Shipping matrix deleted successfully')
      } catch (error) {
        toast.error('Failed to delete shipping matrix')
      }
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      setAllMatrices(prev => prev.map(m => 
        m.id === id ? { ...m, active: !m.active, updatedAt: new Date().toISOString() } : m
      ))
      toast.success('Status updated successfully')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const resetForm = () => {
    setShowAddForm(false)
    setEditingMatrix(null)
    setFormData({
      shippingPort: 'Newark/New York, NJ',
      destinationPricing: {}
    })
    setSelectedDestination('')
    setDestinationPricingForm({
      vehicleTypePricing: {
        sedan: 1200,
        smallMediumSUV: 1350,
        bigSUV: 1500,
        pickup: 1400,
        van: 1600,
        motorcycle: 800
      },
      consolidationPricing: {
        quarterContainer: 1200,
        thirdContainer: 1000,
        halfContainer: 800,
        fullContainer: 600
      },
      country: 'Netherlands'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const addDestinationPricing = () => {
    if (!selectedDestination) return
    
    setFormData({
      ...formData,
      destinationPricing: {
        ...formData.destinationPricing,
        [selectedDestination]: { ...destinationPricingForm }
      }
    })
    
    // Reset for next destination
    setSelectedDestination('')
    setDestinationPricingForm({
      vehicleTypePricing: {
        sedan: 1200,
        smallMediumSUV: 1350,
        bigSUV: 1500,
        pickup: 1400,
        van: 1600,
        motorcycle: 800
      },
      consolidationPricing: {
        quarterContainer: 1200,
        thirdContainer: 1000,
        halfContainer: 800,
        fullContainer: 600
      },
      country: 'Netherlands'
    })
  }

  const removeDestinationPricing = (destinationPort: string) => {
    const newDestinationPricing = { ...formData.destinationPricing }
    delete newDestinationPricing[destinationPort]
    setFormData({
      ...formData,
      destinationPricing: newDestinationPricing
    })
  }

  const startEditingPrice = (matrixId: string, destinationPort: string, priceType: 'vehicle' | 'consolidation', priceKey: string, currentPrice: number) => {
    setEditingPrice({ matrixId, destinationPort, priceType, priceKey })
    setEditingPriceValue(currentPrice)
  }

  const saveEditedPrice = async () => {
    if (!editingPrice) return
    
    try {
      setAllMatrices(prev => prev.map(matrix => {
        if (matrix.id === editingPrice.matrixId) {
          const updatedMatrix = { ...matrix }
          if (editingPrice.priceType === 'vehicle') {
            updatedMatrix.destinationPricing[editingPrice.destinationPort].vehicleTypePricing[editingPrice.priceKey as keyof VehicleTypePricing] = editingPriceValue
          } else {
            updatedMatrix.destinationPricing[editingPrice.destinationPort].consolidationPricing[editingPrice.priceKey as keyof ConsolidationPricing] = editingPriceValue
          }
          updatedMatrix.updatedAt = new Date().toISOString()
          return updatedMatrix
        }
        return matrix
      }))
      
      setEditingPrice(null)
      setEditingPriceValue(0)
      toast.success('Price updated successfully')
    } catch (error) {
      toast.error('Failed to update price')
    }
  }

  const cancelEditingPrice = () => {
    setEditingPrice(null)
    setEditingPriceValue(0)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipping pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search destinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterPort}
          onChange={(e) => setFilterPort(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All US Ports</option>
          {US_PORTS.map(port => (
            <option key={port} value={port}>{port}</option>
          ))}
        </select>

        <select
          value={filterDestination}
          onChange={(e) => setFilterDestination(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Destinations</option>
          {[...new Set(DESTINATION_PORTS.map(d => d.country))].map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
        
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Matrix
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingMatrix ? 'Edit Shipping Matrix' : 'New Shipping Matrix'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                US Shipping Port
              </label>
              <select
                value={formData.shippingPort}
                onChange={(e) => setFormData({ ...formData, shippingPort: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {US_PORTS.map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
            </div>

            {/* Destination Pricing Section */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Destination Ports & Pricing</h4>
              
              {/* Existing Destination Pricing */}
              {Object.keys(formData.destinationPricing).length > 0 && (
                <div className="mb-4 space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Configured Destinations:</h5>
                  {Object.entries(formData.destinationPricing).map(([destinationPort, pricing]) => (
                    <div key={destinationPort} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-medium text-gray-900">{destinationPort}</h6>
                        <button
                          type="button"
                          onClick={() => removeDestinationPricing(destinationPort)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Vehicle Type Pricing */}
                        <div>
                          <h6 className="text-xs font-medium text-gray-600 mb-2">Vehicle Type Pricing</h6>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {VEHICLE_TYPES.map(type => (
                              <div key={type.key} className="text-center">
                                <div className="text-gray-600">{type.label}</div>
                                <div className="font-medium">${pricing.vehicleTypePricing[type.key as keyof VehicleTypePricing]}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Consolidation Pricing */}
                        <div>
                          <h6 className="text-xs font-medium text-gray-600 mb-2">Consolidation Pricing</h6>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {CONSOLIDATION_TYPES.map(type => (
                              <div key={type.key} className="text-center">
                                <div className="text-gray-600">{type.label}</div>
                                <div className="font-medium">${pricing.consolidationPricing[type.key as keyof ConsolidationPricing]}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Destination */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Add Destination Port</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Destination Port
                    </label>
                    <select
                      value={selectedDestination}
                      onChange={(e) => {
                        const selected = DESTINATION_PORTS.find(d => d.port === e.target.value)
                        setSelectedDestination(e.target.value)
                        setDestinationPricingForm({
                          ...destinationPricingForm,
                          country: selected?.country || 'Netherlands'
                        })
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose destination port</option>
                      {DESTINATION_PORTS.filter(port => !formData.destinationPricing[port.port]).map(dest => (
                        <option key={dest.port} value={dest.port}>{dest.port}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addDestinationPricing}
                      disabled={!selectedDestination}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Destination Pricing
                    </button>
                  </div>
                </div>

                {selectedDestination && (
                  <div className="space-y-4">
                    {/* Vehicle Type Pricing Form */}
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-3">
                        Vehicle Type Pricing for {selectedDestination}
                      </h6>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {VEHICLE_TYPES.map(vehicleType => (
                          <div key={vehicleType.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {vehicleType.label} ($)
                            </label>
                            <input
                              type="number"
                              value={destinationPricingForm.vehicleTypePricing[vehicleType.key as keyof VehicleTypePricing]}
                              onChange={(e) => setDestinationPricingForm({ 
                                ...destinationPricingForm,
                                vehicleTypePricing: {
                                  ...destinationPricingForm.vehicleTypePricing,
                                  [vehicleType.key]: parseFloat(e.target.value) || 0
                                }
                              })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                              step="25"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Consolidation Pricing Form */}
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 mb-3">
                        Consolidation Pricing for {selectedDestination}
                      </h6>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {CONSOLIDATION_TYPES.map(consolidationType => (
                          <div key={consolidationType.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {consolidationType.label} ($)
                            </label>
                            <input
                              type="number"
                              value={destinationPricingForm.consolidationPricing[consolidationType.key as keyof ConsolidationPricing]}
                              onChange={(e) => setDestinationPricingForm({ 
                                ...destinationPricingForm,
                                consolidationPricing: {
                                  ...destinationPricingForm.consolidationPricing,
                                  [consolidationType.key]: parseFloat(e.target.value) || 0
                                }
                              })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="0"
                              step="25"
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingMatrix ? 'Update Matrix' : 'Create Matrix'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Matrices List */}
      {matrices.length === 0 ? (
        <EmptyState
          icon={<Ship className="h-12 w-12" />}
          title="No shipping matrices found"
          description="Add your first shipping pricing matrix to get started"
        />
      ) : (
        <div className="space-y-6">
          {matrices.map((matrix) => (
            <div key={matrix.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Anchor className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-lg font-semibold text-gray-900">{matrix.shippingPort}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      matrix.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {matrix.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(matrix.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        matrix.active
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {matrix.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(matrix)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(matrix.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Destinations */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Destination Ports & Pricing</h4>
                <div className="space-y-4">
                  {Object.entries(matrix.destinationPricing).map(([destinationPort, pricing]) => (
                    <div key={destinationPort} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-900">{destinationPort}</span>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{pricing.country}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Vehicle Type Pricing */}
                        <div>
                          <h5 className="text-xs font-medium text-gray-600 mb-2">Vehicle Type Pricing</h5>
                          <div className="grid grid-cols-3 gap-2">
                            {VEHICLE_TYPES.map(vehicleType => {
                              const isEditing = editingPrice && 
                                editingPrice.matrixId === matrix.id && 
                                editingPrice.destinationPort === destinationPort && 
                                editingPrice.priceType === 'vehicle' &&
                                editingPrice.priceKey === vehicleType.key
                              
                              return (
                                <div key={vehicleType.key} className="text-center">
                                  <div className="text-xs text-gray-600 mb-1">{vehicleType.label}</div>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={editingPriceValue === 0 ? '' : editingPriceValue}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9.]/g, '')
                                        setEditingPriceValue(value === '' ? 0 : parseFloat(value) || 0)
                                      }}
                                      className="w-full text-xs font-medium text-center px-1 py-1 border border-blue-500 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      min="0"
                                      step="25"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditedPrice()
                                        if (e.key === 'Escape') cancelEditingPrice()
                                      }}
                                      onBlur={saveEditedPrice}
                                      autoFocus
                                    />
                                  ) : (
                                    <div 
                                      className="text-xs font-medium text-gray-900 bg-gray-50 py-1 px-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                                      onClick={() => startEditingPrice(
                                        matrix.id, 
                                        destinationPort, 
                                        'vehicle',
                                        vehicleType.key,
                                        pricing.vehicleTypePricing[vehicleType.key as keyof VehicleTypePricing]
                                      )}
                                    >
                                      ${pricing.vehicleTypePricing[vehicleType.key as keyof VehicleTypePricing]}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                        
                        {/* Consolidation Pricing */}
                        <div>
                          <h5 className="text-xs font-medium text-gray-600 mb-2">Consolidation Pricing</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {CONSOLIDATION_TYPES.map(consolidationType => {
                              const isEditing = editingPrice && 
                                editingPrice.matrixId === matrix.id && 
                                editingPrice.destinationPort === destinationPort && 
                                editingPrice.priceType === 'consolidation' &&
                                editingPrice.priceKey === consolidationType.key
                              
                              return (
                                <div key={consolidationType.key} className="text-center">
                                  <div className="text-xs text-gray-600 mb-1">{consolidationType.label}</div>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={editingPriceValue === 0 ? '' : editingPriceValue}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9.]/g, '')
                                        setEditingPriceValue(value === '' ? 0 : parseFloat(value) || 0)
                                      }}
                                      className="w-full text-xs font-medium text-center px-1 py-1 border border-blue-500 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      min="0"
                                      step="25"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditedPrice()
                                        if (e.key === 'Escape') cancelEditingPrice()
                                      }}
                                      onBlur={saveEditedPrice}
                                      autoFocus
                                    />
                                  ) : (
                                    <div 
                                      className="text-xs font-medium text-gray-900 bg-gray-50 py-1 px-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                                      onClick={() => startEditingPrice(
                                        matrix.id, 
                                        destinationPort, 
                                        'consolidation',
                                        consolidationType.key,
                                        pricing.consolidationPricing[consolidationType.key as keyof ConsolidationPricing]
                                      )}
                                    >
                                      ${pricing.consolidationPricing[consolidationType.key as keyof ConsolidationPricing]}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(matrix.destinationPricing).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Anchor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No destination ports configured</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span>{Object.keys(matrix.destinationPricing).length} destination{Object.keys(matrix.destinationPricing).length !== 1 ? 's' : ''}</span>
                  <span>Updated: {formatDate(matrix.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}