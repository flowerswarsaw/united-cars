'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Globe, Search, FileText, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import toast from 'react-hot-toast'

interface VehicleTypeTax {
  car: number // 10% - Regular cars
  classicCar: number // 0% - Classic cars
  truck: number // 22% - Trucks/Vans
  motorcycle: number // 6% - Motorcycles
  jetSki: number // 1.7% - Jet Ski/Boats
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
  consolidationPricing: ConsolidationPricing // expedition + clearance combined (like €500 "All In" fee)
  vatRate: number // Country-specific VAT rate (21% Rotterdam, 19% Bremen, 23% Gdynia, 9% Classic Cars)
  taxRatesByVehicle: VehicleTypeTax // Tax/duty rates by vehicle type (applied to vehicle value)
  thc?: number // Terminal Handling Charge (optional)
  freeParkingDays: number | 'unlimited' // Free parking days or unlimited
  parkingPricePerDay: number // Parking price per day after free period
  t1Declaration: number // T1 declaration cost
  currency: 'USD' | 'EUR' | 'GBP'
  active: boolean
  createdAt: string
  updatedAt: string
}

const DESTINATION_PORTS = [
  { port: 'Rotterdam, Netherlands', country: 'Netherlands', region: 'Europe', currency: 'EUR' },
  { port: 'Bremerhaven, Germany', country: 'Germany', region: 'Europe', currency: 'EUR' },
  { port: 'Hamburg, Germany', country: 'Germany', region: 'Europe', currency: 'EUR' },
  { port: 'Gdynia, Poland', country: 'Poland', region: 'Europe', currency: 'EUR' },
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
  { key: 'car', label: 'Car' },
  { key: 'classicCar', label: 'Classic Car' },
  { key: 'truck', label: 'Truck' },
  { key: 'motorcycle', label: 'Motorcycle' },
  { key: 'jetSki', label: 'Jet Ski/Boat' }
]

export function ExpeditionPricingTab() {
  const [matrices, setMatrices] = useState<ExpeditionMatrix[]>([])
  const [allMatrices, setAllMatrices] = useState<ExpeditionMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterCurrency, setFilterCurrency] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMatrix, setEditingMatrix] = useState<ExpeditionMatrix | null>(null)
  const [editingPrice, setEditingPrice] = useState<{
    matrixId: string
    priceType: 'consolidation'
    priceKey: keyof ConsolidationPricing
  } | null>(null)
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0)
  const [formData, setFormData] = useState({
    destinationPort: 'Rotterdam, Netherlands',
    country: 'Netherlands',
    region: 'Europe',
    consolidationPricing: {
      quarterContainer: 500, // 1/4 container expedition + clearance
      thirdContainer: 550,   // 1/3 container expedition + clearance
      halfContainer: 700     // 1/2 container expedition + clearance
    },
    vatRate: 0.21, // Rotterdam standard rate
    taxRatesByVehicle: {
      car: 0.10,          // 10% - Car
      classicCar: 0.00,   // 0% - Classic Car
      truck: 0.22,        // 22% - Truck
      motorcycle: 0.06,   // 6% - Motorcycle
      jetSki: 0.017       // 1.7% - Jet Ski/Boat
    },
    thc: undefined as number | undefined,
    freeParkingDays: 14 as number | 'unlimited',
    parkingPricePerDay: 10,
    t1Declaration: 150,
    currency: 'EUR' as 'USD' | 'EUR' | 'GBP'
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
      vatRate: 0.21, // Netherlands standard rate
      taxRatesByVehicle: {
        car: 0.10,          // 10% - Car
        classicCar: 0.00,   // 0% - Classic Car
        truck: 0.22,        // 22% - Truck
        motorcycle: 0.06,   // 6% - Motorcycle
        jetSki: 0.017       // 1.7% - Jet Ski/Boat
      },
      currency: 'EUR',
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
      vatRate: 0.19, // Germany standard rate
      taxRatesByVehicle: {
        car: 0.10,          // 10% - Car
        classicCar: 0.00,   // 0% - Classic Car
        truck: 0.22,        // 22% - Truck
        motorcycle: 0.06,   // 6% - Motorcycle
        jetSki: 0.017       // 1.7% - Jet Ski/Boat
      },
      thc: undefined,
      freeParkingDays: 21,
      parkingPricePerDay: 12,
      t1Declaration: 175,
      currency: 'EUR',
      active: true,
      createdAt: '2024-02-10T11:00:00Z',
      updatedAt: '2024-03-15T10:30:00Z'
    },
    {
      id: 'expedition-3',
      destinationPort: 'Gdynia, Poland',
      country: 'Poland',
      region: 'Europe',
      consolidationPricing: {
        quarterContainer: 450,
        thirdContainer: 500,
        halfContainer: 650
      },
      vatRate: 0.23, // Poland standard rate
      taxRatesByVehicle: {
        car: 0.10,          // 10% - Car
        classicCar: 0.00,   // 0% - Classic Car
        truck: 0.22,        // 22% - Truck
        motorcycle: 0.06,   // 6% - Motorcycle
        jetSki: 0.017       // 1.7% - Jet Ski/Boat
      },
      thc: undefined,
      freeParkingDays: 7,
      parkingPricePerDay: 8,
      t1Declaration: 120,
      currency: 'EUR',
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
      vatRate: 0.18, // Georgia rate (not EU)
      taxRatesByVehicle: {
        car: 0.08,          // Georgia rates (different from EU)
        classicCar: 0.00,   // 0% - Classic Car
        truck: 0.12,        // Truck rate for Georgia
        motorcycle: 0.05,   // Motorcycle rate for Georgia
        jetSki: 0.08        // Jet Ski rate for Georgia
      },
      thc: 200, // Terminal Handling Charge for Poti
      freeParkingDays: 5,
      parkingPricePerDay: 15,
      t1Declaration: 100,
      currency: 'USD',
      active: true,
      createdAt: '2024-02-10T13:00:00Z',
      updatedAt: '2024-03-15T12:30:00Z'
    }
  ]

  useEffect(() => {
    // Check for version compatibility and clear old data
    const dataVersion = localStorage.getItem('expedition-matrices-version')
    const currentVersion = '2.0' // Updated version for simplified vehicle types
    
    if (dataVersion !== currentVersion) {
      // Clear old incompatible data
      localStorage.removeItem('expedition-matrices')
      localStorage.setItem('expedition-matrices-version', currentVersion)
      fetchMatrices()
      return
    }
    
    // Load data from localStorage if available
    const savedMatrices = localStorage.getItem('expedition-matrices')
    if (savedMatrices) {
      try {
        const parsedMatrices = JSON.parse(savedMatrices)
        // Validate data structure
        if (parsedMatrices[0]?.taxRatesByVehicle?.car !== undefined) {
          setAllMatrices(parsedMatrices)
          setMatrices(parsedMatrices)
          setLoading(false)
        } else {
          // Old data structure, reload fresh data
          fetchMatrices()
        }
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
      localStorage.setItem('expedition-matrices', JSON.stringify(allMatrices))
      // Dispatch custom event to notify calculator of updates
      window.dispatchEvent(new CustomEvent('pricingMatricesUpdated'))
    }
  }, [allMatrices])

  useEffect(() => {
    // Apply filters when they change
    if (allMatrices.length > 0) {
      applyFilters()
    }
  }, [filterRegion, filterCurrency, searchTerm, allMatrices])

  const fetchMatrices = async () => {
    try {
      // Load initial mock data
      setAllMatrices(mockExpeditionData)
      setMatrices(mockExpeditionData)
      // Save to localStorage for persistence
      localStorage.setItem('expedition-matrices', JSON.stringify(mockExpeditionData))
    } catch (error) {
      toast.error('Failed to fetch expedition matrices')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filteredData = [...allMatrices]
    
    if (filterRegion !== 'all') {
      filteredData = filteredData.filter((m: ExpeditionMatrix) => m.region === filterRegion)
    }
    
    if (filterCurrency !== 'all') {
      filteredData = filteredData.filter((m: ExpeditionMatrix) => m.currency === filterCurrency)
    }
    
    if (searchTerm) {
      filteredData = filteredData.filter((m: ExpeditionMatrix) => 
        m.destinationPort.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.country.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setMatrices(filteredData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingMatrix) {
        // Update existing matrix
        const updatedMatrix = { ...editingMatrix, ...formData, updatedAt: new Date().toISOString() }
        setAllMatrices(prev => prev.map(m => 
          m.id === editingMatrix.id ? updatedMatrix : m
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
        setAllMatrices(prev => [newMatrix, ...prev])
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
      vatRate: matrix.vatRate,
      taxRatesByVehicle: { ...matrix.taxRatesByVehicle },
      thc: matrix.thc,
      freeParkingDays: matrix.freeParkingDays,
      parkingPricePerDay: matrix.parkingPricePerDay,
      t1Declaration: matrix.t1Declaration,
      currency: matrix.currency
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expedition matrix?')) {
      try {
        setAllMatrices(prev => prev.filter(m => m.id !== id))
        toast.success('Expedition matrix deleted successfully')
      } catch (error) {
        toast.error('Failed to delete expedition matrix')
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
      destinationPort: 'Rotterdam, Netherlands',
      country: 'Netherlands',
      region: 'Europe',
      consolidationPricing: {
        quarterContainer: 500,
        thirdContainer: 550,
        halfContainer: 700
      },
      vatRate: 0.21, // Reset form VAT rate
      taxRatesByVehicle: {
        car: 0.10,          // 10% - Car
        classicCar: 0.00,   // 0% - Classic Car
        truck: 0.22,        // 22% - Truck
        motorcycle: 0.06,   // 6% - Motorcycle
        jetSki: 0.017       // 1.7% - Jet Ski/Boat
      },
      thc: undefined,
      freeParkingDays: 14,
      parkingPricePerDay: 10,
      t1Declaration: 150,
      currency: 'EUR'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getVATRate = (matrix: ExpeditionMatrix) => {
    return matrix.vatRate
  }

  const startEditingPrice = (matrixId: string, priceKey: keyof ConsolidationPricing, currentValue: number) => {
    setEditingPrice({
      matrixId,
      priceType: 'consolidation',
      priceKey
    })
    setEditingPriceValue(currentValue)
  }

  const saveEditedPrice = () => {
    if (!editingPrice) return
    
    setAllMatrices(prev => prev.map(matrix => {
      if (matrix.id === editingPrice.matrixId) {
        return {
          ...matrix,
          consolidationPricing: {
            ...matrix.consolidationPricing,
            [editingPrice.priceKey]: editingPriceValue
          },
          updatedAt: new Date().toISOString()
        }
      }
      return matrix
    }))
    
    cancelEditingPrice()
    toast.success('Price updated successfully')
  }

  const cancelEditingPrice = () => {
    setEditingPrice(null)
    setEditingPriceValue(0)
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
                    const newFormData = { 
                      ...formData, 
                      destinationPort: e.target.value,
                      country: selected?.country || '',
                      region: selected?.region || '',
                      currency: selected?.currency as 'USD' | 'EUR' | 'GBP' || 'USD'
                    }
                    
                    // Set port-specific defaults
                    if (e.target.value === 'Rotterdam, Netherlands') {
                      newFormData.vatRate = 0.21 // 21%
                      newFormData.freeParkingDays = 14
                      newFormData.parkingPricePerDay = 10
                      newFormData.thc = undefined
                    } else if (e.target.value === 'Bremerhaven, Germany' || e.target.value === 'Hamburg, Germany') {
                      newFormData.vatRate = 0.19 // 19%
                      newFormData.freeParkingDays = 21
                      newFormData.parkingPricePerDay = 12
                      newFormData.thc = undefined
                    } else if (e.target.value === 'Gdynia, Poland') {
                      newFormData.vatRate = 0.23 // 23%
                      newFormData.freeParkingDays = 7
                      newFormData.parkingPricePerDay = 8
                      newFormData.thc = undefined
                    } else if (e.target.value === 'Poti, Georgia') {
                      newFormData.vatRate = 0.18 // 18% (non-EU)
                      newFormData.thc = 200
                      newFormData.freeParkingDays = 5
                      newFormData.parkingPricePerDay = 15
                    }
                    
                    setFormData(newFormData)
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

            {/* VAT Rate (Country-specific) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VAT Rate (%) - Country Standard
                </label>
                <input
                  type="number"
                  value={Number((formData.vatRate * 100).toFixed(2))}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    vatRate: (parseFloat(e.target.value) || 0) / 100
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="30"
                  step="0.1"
                  required
                  placeholder="21% (Netherlands), 19% (Germany), 23% (Poland), 9% (Classic)"
                />
              </div>
              <div className="text-sm text-gray-600 pt-6">
                <div><strong>Standard Rates:</strong></div>
                <div>Netherlands: 21% • Germany: 19%</div>
                <div>Poland: 23% • Classic Cars: 9%</div>
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
                      value={Number((formData.taxRatesByVehicle[type.key as keyof VehicleTypeTax] * 100).toFixed(2))}
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
                      step="0.1"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Port Charges */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  THC (Terminal Handling Charge) {formData.currency}
                </label>
                <input
                  type="number"
                  value={formData.thc ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    thc: e.target.value ? parseFloat(e.target.value) || 0 : undefined
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional (e.g., 200 for Poti)"
                  min="0"
                  step="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  T1 Declaration Cost {formData.currency}
                </label>
                <input
                  type="number"
                  value={formData.t1Declaration}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    t1Declaration: parseFloat(e.target.value) || 0
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="T1 declaration cost"
                  min="0"
                  step="10"
                  required
                />
              </div>
            </div>

            {/* Parking Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Free Parking Days
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.freeParkingDays === 'unlimited' ? '' : formData.freeParkingDays}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      freeParkingDays: e.target.value ? parseInt(e.target.value) : 0
                    })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Days"
                    min="0"
                    disabled={formData.freeParkingDays === 'unlimited'}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      freeParkingDays: formData.freeParkingDays === 'unlimited' ? 14 : 'unlimited'
                    })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      formData.freeParkingDays === 'unlimited' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Unlimited
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parking Price per Day {formData.currency}
                </label>
                <input
                  type="number"
                  value={formData.parkingPricePerDay}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    parkingPricePerDay: parseFloat(e.target.value) || 0
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Price per day after free period"
                  min="0"
                  step="1"
                  required
                />
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
          icon={<Globe className="h-12 w-12" />}
          title="No expedition matrices found"
          description="Add your first expedition pricing matrix to get started"
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
                      matrix.region === 'Europe' ? 'bg-blue-100 text-blue-800' :
                      matrix.region === 'Caucasus' ? 'bg-green-100 text-green-800' :
                      matrix.region === 'Middle East' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {matrix.region}
                    </span>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-lg font-semibold text-gray-900">{matrix.destinationPort}</span>
                    </div>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">{matrix.country}</span>
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

              {/* Pricing Details */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Expedition Pricing & Customs Rates</h4>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">All-in Expedition Service</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{matrix.currency}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Consolidation Pricing */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 mb-2">Consolidation Pricing</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {CONSOLIDATION_TYPES.map(type => {
                          const isEditing = editingPrice && 
                            editingPrice.matrixId === matrix.id && 
                            editingPrice.priceType === 'consolidation' &&
                            editingPrice.priceKey === type.key
                          
                          return (
                            <div key={type.key} className="text-center">
                              <div className="text-xs text-gray-600 mb-1">{type.label}</div>
                              {isEditing ? (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editingPriceValue === 0 ? '' : editingPriceValue}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9.]/g, '')
                                    setEditingPriceValue(value === '' ? 0 : parseFloat(value) || 0)
                                  }}
                                  className="w-full text-sm font-medium text-center px-2 py-1 border border-blue-500 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                  className="text-sm font-medium text-gray-900 bg-gray-50 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => startEditingPrice(
                                    matrix.id, 
                                    type.key as keyof ConsolidationPricing,
                                    matrix.consolidationPricing[type.key as keyof ConsolidationPricing]
                                  )}
                                >
                                  {formatCurrency(matrix.consolidationPricing[type.key as keyof ConsolidationPricing], matrix.currency)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Tax & VAT Rates */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 mb-2">Customs Rates</h5>
                      <div className="space-y-2">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="text-xs text-gray-600">VAT Rate (Country)</div>
                          <div className="text-sm font-medium text-blue-700">
                            {formatPercentage(matrix.vatRate)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {VEHICLE_TYPES.slice(0, 4).map(type => (
                            <div key={type.key} className="text-center">
                              <div className="text-xs text-gray-600 mb-1">{type.label}</div>
                              <div className="text-xs font-medium text-gray-900">
                                {formatPercentage(matrix.taxRatesByVehicle[type.key as keyof VehicleTypeTax])}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {VEHICLE_TYPES.slice(4).map(type => (
                            <div key={type.key} className="text-center">
                              <div className="text-xs text-gray-600 mb-1">{type.label}</div>
                              <div className="text-xs font-medium text-gray-900">
                                {formatPercentage(matrix.taxRatesByVehicle[type.key as keyof VehicleTypeTax])}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Additional Charges */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-600 mb-2">Additional Services</h5>
                      <div className="space-y-2">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-600">T1 Declaration</div>
                          <div className="text-sm font-medium text-blue-700">
                            {formatCurrency(matrix.t1Declaration, matrix.currency)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-600">Free Parking</div>
                          <div className="text-sm font-medium text-green-700">
                            {matrix.freeParkingDays === 'unlimited' ? 'Unlimited' : `${matrix.freeParkingDays} days`}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-xs text-gray-600">Parking/Day</div>
                          <div className="text-sm font-medium text-orange-700">
                            {formatCurrency(matrix.parkingPricePerDay, matrix.currency)}
                          </div>
                        </div>
                        {matrix.thc && (
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-xs text-gray-600">THC</div>
                            <div className="text-sm font-medium text-purple-700">
                              {formatCurrency(matrix.thc, matrix.currency)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
            <h4 className="text-sm font-medium text-blue-800">Customs Calculation Structure</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• <strong>Tax/Duty</strong>: Applied to vehicle value (e.g., €10,000 × 10% = €1,000)</li>
              <li>• <strong>VAT</strong>: Applied to value + tax (e.g., €11,000 × 21% = €2,310)</li>
              <li>• <strong>Consolidation</strong>: Fixed expedition + clearance fee based on container size</li>
              <li>• <strong>Total Customs</strong>: Tax + VAT + Consolidation + THC (if applicable)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}