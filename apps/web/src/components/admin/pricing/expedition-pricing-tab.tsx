'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Globe, Search, FileText, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import toast from 'react-hot-toast'

interface VehicleTypeTax {
  sedan: number
  suv: number
  bigSuv: number
  pickup: number
  van: number
  motorcycle: number
}

interface ConsolidationPricing {
  quarterContainer: number // 1/4 container
  thirdContainer: number   // 1/3 container
  halfContainer: number    // 1/2 container
}

interface ExpeditionMatrix {
  id: string
  destinationPort: string
  country: string
  region: string
  consolidationPricing: ConsolidationPricing // expedition + clearance combined
  vatRatesByVehicle: VehicleTypeTax // VAT rates by vehicle type
  taxRatesByVehicle: VehicleTypeTax // Tax/duty rates by vehicle type
  currency: 'USD' | 'EUR' | 'GBP'
  estimatedDays: string
  notes: string
  active: boolean
  createdAt: string
  updatedAt: string
}

const DESTINATION_PORTS = [
  { port: 'Rotterdam, Netherlands', country: 'Netherlands', region: 'Europe', currency: 'EUR' },
  { port: 'Bremerhaven, Germany', country: 'Germany', region: 'Europe', currency: 'EUR' },
  { port: 'Hamburg, Germany', country: 'Germany', region: 'Europe', currency: 'EUR' },
  { port: 'Klaipeda, Lithuania', country: 'Lithuania', region: 'Europe', currency: 'EUR' },
  { port: 'Poti, Georgia', country: 'Georgia', region: 'Caucasus', currency: 'USD' },
  { port: 'Batumi, Georgia', country: 'Georgia', region: 'Caucasus', currency: 'USD' },
  { port: 'Dubai, UAE', country: 'UAE', region: 'Middle East', currency: 'USD' },
  { port: 'Singapore', country: 'Singapore', region: 'Asia', currency: 'USD' },
  { port: 'Tokyo, Japan', country: 'Japan', region: 'Asia', currency: 'USD' },
  { port: 'Southampton, UK', country: 'United Kingdom', region: 'Europe', currency: 'GBP' }
]

const REGIONS = ['Europe', 'Caucasus', 'Middle East', 'Asia']
const CURRENCIES = ['USD', 'EUR', 'GBP']

const CONSOLIDATION_TYPES = [
  { key: 'quarterContainer', label: '1/4 Container' },
  { key: 'thirdContainer', label: '1/3 Container' },
  { key: 'halfContainer', label: '1/2 Container' }
]

const VEHICLE_TYPES = [
  { key: 'sedan', label: 'Sedan' },
  { key: 'suv', label: 'SUV' },
  { key: 'bigSuv', label: 'Big SUV' },
  { key: 'pickup', label: 'Pickup Truck' },
  { key: 'van', label: 'Van' },
  { key: 'motorcycle', label: 'Motorcycle' }
]

export function ExpeditionPricingTab() {
  const [matrices, setMatrices] = useState<ExpeditionMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterCurrency, setFilterCurrency] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMatrix, setEditingMatrix] = useState<ExpeditionMatrix | null>(null)
  const [formData, setFormData] = useState({
    destinationPort: 'Rotterdam, Netherlands',
    country: 'Netherlands',
    region: 'Europe',
    consolidationPricing: {
      quarterContainer: 500, // 1/4 container expedition + clearance
      thirdContainer: 550,   // 1/3 container expedition + clearance
      halfContainer: 700     // 1/2 container expedition + clearance
    },
    vatRatesByVehicle: {
      sedan: 0.21,
      suv: 0.21,
      bigSuv: 0.21,
      pickup: 0.21,
      van: 0.21,
      motorcycle: 0.21
    },
    taxRatesByVehicle: {
      sedan: 0.10,
      suv: 0.12,
      bigSuv: 0.15,
      pickup: 0.12,
      van: 0.15,
      motorcycle: 0.08
    },
    currency: 'EUR' as 'USD' | 'EUR' | 'GBP',
    estimatedDays: '3-5 days',
    notes: ''
  })

  // Mock data based on consolidation pricing structure
  const mockExpeditionData: ExpeditionMatrix[] = [
    {
      id: 'expedition-1',
      destinationPort: 'Rotterdam, Netherlands',
      country: 'Netherlands',
      region: 'Europe',
      consolidationPricing: {
        quarterContainer: 500, // 1/4 container expedition + clearance
        thirdContainer: 550,   // 1/3 container expedition + clearance
        halfContainer: 700     // 1/2 container expedition + clearance
      },
      vatRatesByVehicle: {
        sedan: 0.21,
        suv: 0.21,
        bigSuv: 0.21,
        pickup: 0.21,
        van: 0.21,
        motorcycle: 0.21
      },
      taxRatesByVehicle: {
        sedan: 0.10,
        suv: 0.12,
        bigSuv: 0.15,
        pickup: 0.12,
        van: 0.15,
        motorcycle: 0.08
      },
      currency: 'EUR',
      estimatedDays: '3-5 days',
      notes: 'Standard EU customs procedures. VAT and tax rates vary by vehicle type.',
      active: true,
      createdAt: '2024-02-10T10:00:00Z',
      updatedAt: '2024-03-15T09:30:00Z'
    },
    {
      id: 'expedition-2',
      destinationPort: 'Bremerhaven, Germany',
      country: 'Germany',
      region: 'Europe',
      consolidationPricing: {
        quarterContainer: 525,
        thirdContainer: 575,
        halfContainer: 725
      },
      vatRatesByVehicle: {
        sedan: 0.19,
        suv: 0.19,
        bigSuv: 0.19,
        pickup: 0.19,
        van: 0.19,
        motorcycle: 0.19
      },
      taxRatesByVehicle: {
        sedan: 0.10,
        suv: 0.12,
        bigSuv: 0.15,
        pickup: 0.12,
        van: 0.15,
        motorcycle: 0.08
      },
      currency: 'EUR',
      estimatedDays: '4-6 days',
      notes: 'German customs requires additional environmental certificate for certain vehicles.',
      active: true,
      createdAt: '2024-02-10T11:00:00Z',
      updatedAt: '2024-03-15T10:30:00Z'
    },
    {
      id: 'expedition-3',
      destinationPort: 'Klaipeda, Lithuania',
      country: 'Lithuania',
      region: 'Europe',
      consolidationPricing: {
        quarterContainer: 450,
        thirdContainer: 500,
        halfContainer: 650
      },
      vatRatesByVehicle: {
        sedan: 0.21,
        suv: 0.21,
        bigSuv: 0.21,
        pickup: 0.21,
        van: 0.21,
        motorcycle: 0.21
      },
      taxRatesByVehicle: {
        sedan: 0.10,
        suv: 0.11,
        bigSuv: 0.13,
        pickup: 0.11,
        van: 0.13,
        motorcycle: 0.07
      },
      currency: 'EUR',
      estimatedDays: '2-4 days',
      notes: 'Lower consolidation fees due to Lithuania\'s competitive port position.',
      active: true,
      createdAt: '2024-02-10T12:00:00Z',
      updatedAt: '2024-03-15T11:30:00Z'
    },
    {
      id: 'expedition-4',
      destinationPort: 'Poti, Georgia',
      country: 'Georgia',
      region: 'Caucasus',
      consolidationPricing: {
        quarterContainer: 380,
        thirdContainer: 430,
        halfContainer: 580
      },
      vatRatesByVehicle: {
        sedan: 0.18,
        suv: 0.18,
        bigSuv: 0.18,
        pickup: 0.18,
        van: 0.18,
        motorcycle: 0.18
      },
      taxRatesByVehicle: {
        sedan: 0.08,
        suv: 0.10,
        bigSuv: 0.12,
        pickup: 0.10,
        van: 0.12,
        motorcycle: 0.05
      },
      currency: 'USD',
      estimatedDays: '2-3 days',
      notes: 'Favorable rates for vehicles over 3 years old. Lower consolidation costs.',
      active: true,
      createdAt: '2024-02-10T13:00:00Z',
      updatedAt: '2024-03-15T12:30:00Z'
    }
  ]

  useEffect(() => {
    fetchMatrices()
  }, [filterRegion, filterCurrency, searchTerm])

  const fetchMatrices = async () => {
    try {
      // In production, this would fetch from API
      let filteredData = [...mockExpeditionData]
      
      if (filterRegion !== 'all') {
        filteredData = filteredData.filter(m => m.region === filterRegion)
      }
      
      if (filterCurrency !== 'all') {
        filteredData = filteredData.filter(m => m.currency === filterCurrency)
      }
      
      if (searchTerm) {
        filteredData = filteredData.filter(m => 
          m.destinationPort.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.country.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      setMatrices(filteredData)
    } catch (error) {
      toast.error('Failed to fetch expedition matrices')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingMatrix) {
        // Update existing matrix
        setMatrices(prev => prev.map(m => 
          m.id === editingMatrix.id 
            ? { ...m, ...formData, updatedAt: new Date().toISOString() }
            : m
        ))
        toast.success('Expedition matrix updated successfully')
      } else {
        // Create new matrix
        const newMatrix: ExpeditionMatrix = {
          id: `expedition-${Date.now()}`,
          ...formData,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setMatrices(prev => [newMatrix, ...prev])
        toast.success('Expedition matrix created successfully')
      }
      
      resetForm()
    } catch (error) {
      toast.error('Failed to save expedition matrix')
    }
  }

  const handleEdit = (matrix: ExpeditionMatrix) => {
    setEditingMatrix(matrix)
    setFormData({
      destinationPort: matrix.destinationPort,
      country: matrix.country,
      region: matrix.region,
      consolidationPricing: { ...matrix.consolidationPricing },
      vatRatesByVehicle: { ...matrix.vatRatesByVehicle },
      taxRatesByVehicle: { ...matrix.taxRatesByVehicle },
      currency: matrix.currency,
      estimatedDays: matrix.estimatedDays,
      notes: matrix.notes
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expedition matrix?')) {
      try {
        setMatrices(prev => prev.filter(m => m.id !== id))
        toast.success('Expedition matrix deleted successfully')
      } catch (error) {
        toast.error('Failed to delete expedition matrix')
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
      destinationPort: 'Rotterdam, Netherlands',
      country: 'Netherlands',
      region: 'Europe',
      consolidationPricing: {
        quarterContainer: 500,
        thirdContainer: 550,
        halfContainer: 700
      },
      vatRatesByVehicle: {
        sedan: 0.21,
        suv: 0.21,
        bigSuv: 0.21,
        pickup: 0.21,
        van: 0.21,
        motorcycle: 0.21
      },
      taxRatesByVehicle: {
        sedan: 0.10,
        suv: 0.12,
        bigSuv: 0.15,
        pickup: 0.12,
        van: 0.15,
        motorcycle: 0.08
      },
      currency: 'EUR',
      estimatedDays: '3-5 days',
      notes: ''
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getAverageConsolidationPrice = (matrix: ExpeditionMatrix) => {
    const prices = Object.values(matrix.consolidationPricing)
    return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
  }

  const getAverageVATRate = (matrix: ExpeditionMatrix) => {
    const rates = Object.values(matrix.vatRatesByVehicle)
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length
  }

  const getAverageTaxRate = (matrix: ExpeditionMatrix) => {
    const rates = Object.values(matrix.taxRatesByVehicle)
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
    return `${symbol}${amount}`
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expedition pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Warning Banner */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
            <p className="text-sm text-amber-700 mt-1">
              Customs duties and VAT rates change frequently. Always verify current rates with local customs authorities.
              These matrices are for estimation purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search countries or ports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Regions</option>
            {REGIONS.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Currencies</option>
            {CURRENCIES.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expedition Matrix
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingMatrix ? 'Edit Expedition Matrix' : 'New Expedition Matrix'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination Port
                </label>
                <select
                  value={formData.destinationPort}
                  onChange={(e) => {
                    const selected = DESTINATION_PORTS.find(d => d.port === e.target.value)
                    setFormData({ 
                      ...formData, 
                      destinationPort: e.target.value,
                      country: selected?.country || '',
                      region: selected?.region || '',
                      currency: selected?.currency as 'USD' | 'EUR' | 'GBP' || 'USD'
                    })
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {DESTINATION_PORTS.map(dest => (
                    <option key={dest.port} value={dest.port}>
                      {dest.port}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Time
                </label>
                <input
                  type="text"
                  value={formData.estimatedDays}
                  onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3-5 days"
                  required
                />
              </div>
            </div>

            {/* Consolidation Pricing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consolidation Pricing ({formData.currency}) - Expedition + Clearance Combined
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CONSOLIDATION_TYPES.map(type => (
                  <div key={type.key}>
                    <label className="block text-sm text-gray-600 mb-1">
                      {type.label}
                    </label>
                    <input
                      type="number"
                      value={formData.consolidationPricing[type.key as keyof ConsolidationPricing]}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        consolidationPricing: { 
                          ...formData.consolidationPricing, 
                          [type.key]: parseFloat(e.target.value) || 0 
                        }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="25"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* VAT Rates by Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VAT Rates by Vehicle Type (%)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {VEHICLE_TYPES.map(type => (
                  <div key={type.key}>
                    <label className="block text-xs text-gray-600 mb-1">
                      {type.label}
                    </label>
                    <input
                      type="number"
                      value={formData.vatRatesByVehicle[type.key as keyof VehicleTypeTax] * 100}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        vatRatesByVehicle: { 
                          ...formData.vatRatesByVehicle, 
                          [type.key]: (parseFloat(e.target.value) || 0) / 100
                        }
                      })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                      step="0.5"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Tax/Duty Rates by Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax/Duty Rates by Vehicle Type (%)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {VEHICLE_TYPES.map(type => (
                  <div key={type.key}>
                    <label className="block text-xs text-gray-600 mb-1">
                      {type.label}
                    </label>
                    <input
                      type="number"
                      value={formData.taxRatesByVehicle[type.key as keyof VehicleTypeTax] * 100}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        taxRatesByVehicle: { 
                          ...formData.taxRatesByVehicle, 
                          [type.key]: (parseFloat(e.target.value) || 0) / 100
                        }
                      })}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                      step="0.5"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Important notes about customs procedures, requirements, or special conditions..."
              />
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
          icon={<Globe className="h-12 w-12" />}
          title="No expedition matrices found"
          description="Add your first expedition pricing matrix to get started"
        />
      ) : (
        <div className="space-y-6">
          {matrices.map((matrix) => (
            <div key={matrix.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{matrix.destinationPort}</h3>
                    <p className="text-sm text-gray-600">{matrix.country} • {matrix.region}</p>
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

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Consolidation Pricing */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Consolidation Pricing</h4>
                  <div className="bg-blue-50 p-3 rounded space-y-2">
                    {CONSOLIDATION_TYPES.map(type => (
                      <div key={type.key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{type.label}:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(matrix.consolidationPricing[type.key as keyof ConsolidationPricing], matrix.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-lg font-semibold text-blue-700">
                      Avg: {formatCurrency(getAverageConsolidationPrice(matrix), matrix.currency)}
                    </span>
                  </div>
                </div>

                {/* VAT Rates */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">VAT Rates by Vehicle</h4>
                  <div className="space-y-2">
                    {VEHICLE_TYPES.map(type => (
                      <div key={type.key} className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">{type.label}:</span>
                        <span className="text-xs font-medium text-gray-900">
                          {formatPercentage(matrix.vatRatesByVehicle[type.key as keyof VehicleTypeTax])}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPercentage(getAverageVATRate(matrix))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tax/Duty Rates */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Tax/Duty Rates by Vehicle</h4>
                  <div className="space-y-2">
                    {VEHICLE_TYPES.map(type => (
                      <div key={type.key} className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">{type.label}:</span>
                        <span className="text-xs font-medium text-gray-900">
                          {formatPercentage(matrix.taxRatesByVehicle[type.key as keyof VehicleTypeTax])}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPercentage(getAverageTaxRate(matrix))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Summary</h4>
                  <div className="bg-gray-50 p-3 rounded space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Processing:</span>
                      <span className="text-sm font-medium text-gray-900">{matrix.estimatedDays}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Currency:</span>
                      <span className="text-sm font-medium text-gray-900">{matrix.currency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Updated:</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(matrix.updatedAt)}</span>
                    </div>
                  </div>
                  {matrix.notes && (
                    <div className="mt-3 p-2 bg-amber-50 rounded text-xs text-amber-800">
                      <FileText className="h-3 w-3 inline mr-1" />
                      {matrix.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800">Expedition Consolidation Structure</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Consolidation pricing combines expedition and clearance fees based on container size (1/4, 1/3, 1/2)</li>
              <li>• VAT rates vary by vehicle type and destination country customs regulations</li>
              <li>• Tax/duty rates are differentiated by vehicle category (sedans, SUVs, trucks, motorcycles)</li>
              <li>• Processing time varies by destination port and documentation requirements</li>
              <li>• Example: Rotterdam 500 EUR (1/4), 550 EUR (1/3), 700 EUR (1/2)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}