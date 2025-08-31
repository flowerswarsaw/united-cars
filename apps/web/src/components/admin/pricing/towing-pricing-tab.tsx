'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Truck, Search, Map } from 'lucide-react'
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

interface TowingMatrix {
  id: string
  auctionHouse: 'COPART' | 'IAA' | 'MANHEIM' | 'ACV' | 'ADESA'
  auctionLocation: string
  portPricing: {
    [portName: string]: VehicleTypePricing
  }
  preferredPort?: string // Main shipping port for this location
  active: boolean
  createdAt: string
  updatedAt: string
}

const AUCTION_HOUSES = ['COPART', 'IAA', 'MANHEIM', 'ACV', 'ADESA']

const AUCTION_LOCATIONS = {
  COPART: [
    'Fontana, CA', 'Fresno, CA', 'Hayward, CA', 'Los Angeles, CA', 'Sacramento, CA', 'San Diego, CA',
    'Dallas, TX', 'Houston, TX', 'Austin, TX', 'San Antonio, TX',
    'Miami, FL', 'Jacksonville, FL', 'Orlando, FL', 'Tampa, FL',
    'Atlanta, GA', 'Chicago, IL', 'Phoenix, AZ', 'Las Vegas, NV'
  ],
  IAA: [
    'Riverside, CA', 'San Jose, CA', 'Bakersfield, CA',
    'Houston, TX', 'Dallas, TX', 'Fort Worth, TX',
    'Miami, FL', 'Tampa, FL',
    'Atlanta, GA', 'Chicago, IL', 'Phoenix, AZ'
  ],
  MANHEIM: [
    'Los Angeles, CA', 'San Francisco, CA',
    'Dallas, TX', 'Houston, TX',
    'Miami, FL', 'Atlanta, GA',
    'Chicago, IL', 'New York, NY'
  ],
  ACV: [
    'Los Angeles, CA', 'Chicago, IL', 'Atlanta, GA', 'Dallas, TX'
  ],
  ADESA: [
    'Los Angeles, CA', 'Phoenix, AZ', 'Atlanta, GA', 'Chicago, IL'
  ]
}

const US_PORTS = [
  'Newark/New York, NJ',
  'Savannah, GA',
  'Houston, TX',
  'Los Angeles, CA',
  'Seattle, WA',
  'Norfolk, VA',
  'Miami, FL',
  'Charleston, SC',
  'Baltimore, MD',
  'Chicago, IL (Inland)',
  'Indianapolis, IN (Inland)'
]

const VEHICLE_TYPES = [
  { key: 'sedan', label: 'Sedan' },
  { key: 'smallMediumSUV', label: 'Small/Medium SUV' },
  { key: 'bigSUV', label: 'Big SUV' },
  { key: 'pickup', label: 'Pickup Truck' },
  { key: 'van', label: 'Van' },
  { key: 'motorcycle', label: 'Motorcycle' }
]

export function TowingPricingTab() {
  const [matrices, setMatrices] = useState<TowingMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAuction, setFilterAuction] = useState<string>('all')
  const [filterLocation, setFilterLocation] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMatrix, setEditingMatrix] = useState<TowingMatrix | null>(null)
  const [formData, setFormData] = useState({
    auctionHouse: 'COPART' as 'COPART' | 'IAA' | 'MANHEIM' | 'ACV' | 'ADESA',
    auctionLocation: '',
    portPricing: {} as { [portName: string]: VehicleTypePricing },
    preferredPort: ''
  })
  
  const [selectedPort, setSelectedPort] = useState<string>('')
  const [portPricingForm, setPortPricingForm] = useState<VehicleTypePricing>({
    sedan: 350,
    smallMediumSUV: 400,
    bigSUV: 500,
    pickup: 450,
    van: 550,
    motorcycle: 250
  })
  
  // Inline editing state
  const [editingPrice, setEditingPrice] = useState<{
    matrixId: string
    portName: string
    vehicleType: keyof VehicleTypePricing
  } | null>(null)
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0)

  // Mock data - each auction location with multiple port destinations and pricing
  const mockTowingData: TowingMatrix[] = [
    {
      id: 'towing-1',
      auctionHouse: 'COPART',
      auctionLocation: 'Los Angeles, CA',
      portPricing: {
        'Los Angeles, CA': {
          sedan: 280,
          smallMediumSUV: 320,
          bigSUV: 380,
          pickup: 340,
          van: 420,
          motorcycle: 200
        },
        'Newark/New York, NJ': {
          sedan: 2800,
          smallMediumSUV: 3200,
          bigSUV: 3800,
          pickup: 3400,
          van: 4200,
          motorcycle: 2000
        }
      },
      preferredPort: 'Los Angeles, CA',
      active: true,
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-03-05T16:45:00Z'
    },
    {
      id: 'towing-2',
      auctionHouse: 'COPART',
      auctionLocation: 'Atlanta, GA',
      portPricing: {
        'Savannah, GA': {
          sedan: 350,
          smallMediumSUV: 400,
          bigSUV: 480,
          pickup: 420,
          van: 520,
          motorcycle: 250
        },
        'Norfolk, VA': {
          sedan: 580,
          smallMediumSUV: 650,
          bigSUV: 780,
          pickup: 680,
          van: 820,
          motorcycle: 420
        },
        'Charleston, SC': {
          sedan: 450,
          smallMediumSUV: 500,
          bigSUV: 600,
          pickup: 520,
          van: 640,
          motorcycle: 320
        }
      },
      preferredPort: 'Savannah, GA',
      active: true,
      createdAt: '2024-01-20T09:30:00Z',
      updatedAt: '2024-03-05T17:00:00Z'
    },
    {
      id: 'towing-3',
      auctionHouse: 'IAA',
      auctionLocation: 'Houston, TX',
      portPricing: {
        'Houston, TX': {
          sedan: 320,
          smallMediumSUV: 370,
          bigSUV: 450,
          pickup: 390,
          van: 480,
          motorcycle: 230
        },
        'Savannah, GA': {
          sedan: 1200,
          smallMediumSUV: 1350,
          bigSUV: 1600,
          pickup: 1400,
          van: 1700,
          motorcycle: 850
        }
      },
      preferredPort: 'Houston, TX',
      active: true,
      createdAt: '2024-01-24T09:00:00Z',
      updatedAt: '2024-03-09T16:45:00Z'
    },
    {
      id: 'towing-4',
      auctionHouse: 'IAA',
      auctionLocation: 'Chicago, IL',
      portPricing: {
        'Newark/New York, NJ': {
          sedan: 950,
          smallMediumSUV: 1100,
          bigSUV: 1300,
          pickup: 1150,
          van: 1400,
          motorcycle: 680
        }
      },
      preferredPort: 'Newark/New York, NJ',
      active: true,
      createdAt: '2024-01-24T10:00:00Z',
      updatedAt: '2024-03-09T17:30:00Z'
    }
  ]

  useEffect(() => {
    fetchMatrices()
  }, [filterLocation, filterAuction, searchTerm])

  const fetchMatrices = async () => {
    try {
      // In production, this would fetch from API
      let filteredData = [...mockTowingData]
      
      if (filterAuction !== 'all') {
        filteredData = filteredData.filter(m => m.auctionHouse === filterAuction)
      }
      
      if (filterLocation !== 'all') {
        filteredData = filteredData.filter(m => m.auctionLocation === filterLocation)
      }
      
      if (searchTerm) {
        filteredData = filteredData.filter(m => 
          m.auctionLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          Object.keys(m.portPricing).some(port => port.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }
      
      setMatrices(filteredData)
    } catch (error) {
      toast.error('Failed to fetch towing matrices')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (Object.keys(formData.portPricing).length === 0) {
      toast.error('Please add at least one port destination with pricing')
      return
    }
    
    try {
      if (editingMatrix) {
        // Update existing matrix
        setMatrices(prev => prev.map(m => 
          m.id === editingMatrix.id 
            ? { ...m, ...formData, updatedAt: new Date().toISOString() }
            : m
        ))
        toast.success('Towing matrix updated successfully')
      } else {
        // Create new matrix
        const newMatrix: TowingMatrix = {
          id: `towing-${Date.now()}`,
          ...formData,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setMatrices(prev => [newMatrix, ...prev])
        toast.success('Towing matrix created successfully')
      }
      
      resetForm()
    } catch (error) {
      toast.error('Failed to save towing matrix')
    }
  }

  const handleEdit = (matrix: TowingMatrix) => {
    setEditingMatrix(matrix)
    setFormData({
      auctionHouse: matrix.auctionHouse,
      auctionLocation: matrix.auctionLocation,
      portPricing: { ...matrix.portPricing },
      preferredPort: matrix.preferredPort || ''
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this towing matrix?')) {
      try {
        setMatrices(prev => prev.filter(m => m.id !== id))
        toast.success('Towing matrix deleted successfully')
      } catch (error) {
        toast.error('Failed to delete towing matrix')
      }
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      setMatrices(prev => prev.map(m => 
        m.id === id ? { ...m, active: !m.active } : m
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
      auctionHouse: 'COPART',
      auctionLocation: '',
      portPricing: {},
      preferredPort: ''
    })
    setSelectedPort('')
    setPortPricingForm({
      sedan: 350,
      smallMediumSUV: 400,
      bigSUV: 500,
      pickup: 450,
      van: 550,
      motorcycle: 250
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getAveragePrice = (portPricing: VehicleTypePricing) => {
    const prices = Object.values(portPricing)
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length
    return Math.round(average)
  }

  const getAvailableLocations = () => {
    if (filterAuction === 'all') return []
    return AUCTION_LOCATIONS[filterAuction as keyof typeof AUCTION_LOCATIONS] || []
  }

  const addPortPricing = () => {
    if (!selectedPort) return
    
    setFormData({
      ...formData,
      portPricing: {
        ...formData.portPricing,
        [selectedPort]: { ...portPricingForm }
      }
    })
    
    // Reset for next port
    setSelectedPort('')
    setPortPricingForm({
      sedan: 350,
      smallMediumSUV: 400,
      bigSUV: 500,
      pickup: 450,
      van: 550,
      motorcycle: 250
    })
  }

  const removePortPricing = (portName: string) => {
    const newPortPricing = { ...formData.portPricing }
    delete newPortPricing[portName]
    setFormData({
      ...formData,
      portPricing: newPortPricing
    })
  }

  const startEditingPrice = (matrixId: string, portName: string, vehicleType: keyof VehicleTypePricing, currentPrice: number) => {
    setEditingPrice({ matrixId, portName, vehicleType })
    setEditingPriceValue(currentPrice)
  }

  const saveEditedPrice = async () => {
    if (!editingPrice) return
    
    try {
      setMatrices(prev => prev.map(matrix => {
        if (matrix.id === editingPrice.matrixId) {
          return {
            ...matrix,
            portPricing: {
              ...matrix.portPricing,
              [editingPrice.portName]: {
                ...matrix.portPricing[editingPrice.portName],
                [editingPrice.vehicleType]: editingPriceValue
              }
            },
            updatedAt: new Date().toISOString()
          }
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
          <p className="mt-4 text-gray-600">Loading towing pricing...</p>
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
            placeholder="Search locations or ports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterAuction}
          onChange={(e) => {
            setFilterAuction(e.target.value)
            setFilterLocation('all') // Reset location filter when auction changes
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Auctions</option>
          {AUCTION_HOUSES.map(house => (
            <option key={house} value={house}>{house}</option>
          ))}
        </select>

        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={filterAuction === 'all'}
        >
          <option value="all">All Locations</option>
          {getAvailableLocations().map(location => (
            <option key={location} value={location}>{location}</option>
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
            {editingMatrix ? 'Edit Towing Matrix' : 'New Towing Matrix'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auction House
                </label>
                <select
                  value={formData.auctionHouse}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    auctionHouse: e.target.value as any,
                    auctionLocation: '' // Reset location when auction changes
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {AUCTION_HOUSES.map(house => (
                    <option key={house} value={house}>{house}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auction Location
                </label>
                <select
                  value={formData.auctionLocation}
                  onChange={(e) => setFormData({ ...formData, auctionLocation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.auctionHouse}
                >
                  <option value="">Select Location</option>
                  {formData.auctionHouse && AUCTION_LOCATIONS[formData.auctionHouse as keyof typeof AUCTION_LOCATIONS]?.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Port (Main shipping port)
                </label>
                <select
                  value={formData.preferredPort}
                  onChange={(e) => setFormData({ ...formData, preferredPort: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Preferred Port</option>
                  {US_PORTS.map(port => (
                    <option key={port} value={port}>{port}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Port Pricing Section */}
            <div className="border-t pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Port Destinations & Pricing</h4>
              
              {/* Existing Port Pricing */}
              {Object.keys(formData.portPricing).length > 0 && (
                <div className="mb-4 space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Configured Ports:</h5>
                  {Object.entries(formData.portPricing).map(([portName, pricing]) => (
                    <div key={portName} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h6 className="font-medium text-gray-900">{portName}</h6>
                        <button
                          type="button"
                          onClick={() => removePortPricing(portName)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                        {VEHICLE_TYPES.map(type => (
                          <div key={type.key} className="text-center">
                            <div className="text-gray-600">{type.label}</div>
                            <div className="font-medium">${pricing[type.key as keyof VehicleTypePricing]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Port */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Add Port Destination</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Port
                    </label>
                    <select
                      value={selectedPort}
                      onChange={(e) => setSelectedPort(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose destination port</option>
                      {US_PORTS.filter(port => !formData.portPricing[port]).map(port => (
                        <option key={port} value={port}>{port}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addPortPricing}
                      disabled={!selectedPort}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Port Pricing
                    </button>
                  </div>
                </div>

                {selectedPort && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-3">
                      Vehicle Pricing for {selectedPort}
                    </h6>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {VEHICLE_TYPES.map(vehicleType => (
                        <div key={vehicleType.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {vehicleType.label} ($)
                          </label>
                          <input
                            type="number"
                            value={portPricingForm[vehicleType.key as keyof VehicleTypePricing]}
                            onChange={(e) => setPortPricingForm({ 
                              ...portPricingForm,
                              [vehicleType.key]: parseFloat(e.target.value) || 0
                            })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="10"
                            required
                          />
                        </div>
                      ))}
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
          icon={<Truck className="h-12 w-12" />}
          title="No towing matrices found"
          description="Add your first towing pricing matrix to get started"
        />
      ) : (
        <div className="space-y-6">
          {matrices.map((matrix) => (
            <div key={matrix.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      matrix.auctionHouse === 'COPART' ? 'bg-blue-100 text-blue-800' :
                      matrix.auctionHouse === 'IAA' ? 'bg-green-100 text-green-800' :
                      matrix.auctionHouse === 'MANHEIM' ? 'bg-purple-100 text-purple-800' :
                      matrix.auctionHouse === 'ACV' ? 'bg-orange-100 text-orange-800' :
                      'bg-indigo-100 text-indigo-800'
                    }`}>
                      {matrix.auctionHouse}
                    </span>
                    <div className="flex items-center">
                      <Map className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-lg font-semibold text-gray-900">{matrix.auctionLocation}</span>
                    </div>
                    {matrix.preferredPort && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Main: {matrix.preferredPort}
                      </span>
                    )}
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

              {/* Port Routes */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Destination Ports & Pricing</h4>
                <div className="space-y-4">
                  {Object.entries(matrix.portPricing).map(([portName, pricing]) => (
                    <div key={portName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-900">{portName}</span>
                          {matrix.preferredPort === portName && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Preferred</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Avg: ${getAveragePrice(pricing)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {VEHICLE_TYPES.map(vehicleType => {
                          const isEditing = editingPrice && 
                            editingPrice.matrixId === matrix.id && 
                            editingPrice.portName === portName && 
                            editingPrice.vehicleType === vehicleType.key
                          
                          return (
                            <div key={vehicleType.key} className="text-center">
                              <div className="text-xs text-gray-600 mb-1">{vehicleType.label}</div>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editingPriceValue}
                                  onChange={(e) => setEditingPriceValue(parseFloat(e.target.value) || 0)}
                                  className="w-full text-sm font-medium text-center px-2 py-1 border border-blue-500 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="0"
                                  step="10"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditedPrice()
                                    if (e.key === 'Escape') cancelEditingPrice()
                                  }}
                                  onBlur={saveEditedPrice}
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  className="text-sm font-medium text-gray-900 bg-gray-50 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => startEditingPrice(
                                    matrix.id, 
                                    portName, 
                                    vehicleType.key as keyof VehicleTypePricing,
                                    pricing[vehicleType.key as keyof VehicleTypePricing]
                                  )}
                                >
                                  ${pricing[vehicleType.key as keyof VehicleTypePricing]}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                {Object.keys(matrix.portPricing).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Map className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No port destinations configured</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span>{Object.keys(matrix.portPricing).length} port destination{Object.keys(matrix.portPricing).length !== 1 ? 's' : ''}</span>
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