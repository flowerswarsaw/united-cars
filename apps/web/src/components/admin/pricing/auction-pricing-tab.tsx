'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash, Search, Calculator, Info } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import toast from 'react-hot-toast'

interface FeeBracket {
  min: number
  max: number
  fee: number | string
}

interface AuctionMatrix {
  id: string
  auctionHouse: 'COPART' | 'IAA'
  accountType: 'C' | 'A' | 'standard' | 'class_a'
  titleType: 'clean' | 'non_clean' | 'salvage'
  paymentMethod: 'secured' | 'unsecured'
  bidType: 'pre_bid' | 'live_bid' | 'live' | 'proxy'
  gateFee: number
  titleFee: number
  envFee: number
  auctionFeeBrackets: FeeBracket[]
  bidFeeBrackets: FeeBracket[]
  fixedFees?: number // for IAA
  active: boolean
  createdAt: string
  updatedAt: string
}

export function AuctionPricingTab() {
  const [matrices, setMatrices] = useState<AuctionMatrix[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAuction, setFilterAuction] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMatrix, setEditingMatrix] = useState<AuctionMatrix | null>(null)
  const [formData, setFormData] = useState({
    auctionHouse: 'COPART' as 'COPART' | 'IAA',
    accountType: 'C' as 'C' | 'A' | 'standard' | 'class_a',
    titleType: 'clean' as 'clean' | 'non_clean' | 'salvage',
    paymentMethod: 'secured' as 'secured' | 'unsecured',
    bidType: 'pre_bid' as 'pre_bid' | 'live_bid' | 'live' | 'proxy',
    gateFee: 79,
    titleFee: 20,
    envFee: 0,
    fixedFees: 95
  })

  // Mock data based on actual COPART fee calculator matrices
  const mockAuctionData: AuctionMatrix[] = [
    {
      id: 'copart-c-clean-secured',
      auctionHouse: 'COPART',
      accountType: 'C',
      titleType: 'clean',
      paymentMethod: 'secured',
      bidType: 'pre_bid',
      gateFee: 79,
      titleFee: 20,
      envFee: 0,
      auctionFeeBrackets: [
        { min: 0, max: 49.99, fee: 25 },
        { min: 50, max: 99.99, fee: 45 },
        { min: 100, max: 199.99, fee: 80 },
        { min: 200, max: 299.99, fee: 120 },
        { min: 300, max: 349.99, fee: 120 },
        { min: 350, max: 399.99, fee: 120 },
        { min: 400, max: 449.99, fee: 160 },
        { min: 450, max: 499.99, fee: 160 },
        { min: 500, max: 549.99, fee: 185 },
        { min: 550, max: 599.99, fee: 185 },
        { min: 600, max: 699.99, fee: 210 },
        { min: 700, max: 799.99, fee: 230 },
        { min: 800, max: 899.99, fee: 250 },
        { min: 900, max: 999.99, fee: 275 },
        { min: 1000, max: 1199.99, fee: 325 },
        { min: 1200, max: 1299.99, fee: 350 },
        { min: 1300, max: 1399.99, fee: 365 },
        { min: 1400, max: 1499.99, fee: 380 },
        { min: 1500, max: 1599.99, fee: 390 },
        { min: 1600, max: 1699.99, fee: 410 },
        { min: 1700, max: 1799.99, fee: 420 },
        { min: 1800, max: 1999.99, fee: 440 },
        { min: 2000, max: 2399.99, fee: 470 },
        { min: 2400, max: 2499.99, fee: 480 },
        { min: 2500, max: 2999.99, fee: 500 },
        { min: 3000, max: 3499.99, fee: 600 },
        { min: 3500, max: 3999.99, fee: 675 },
        { min: 4000, max: 4499.99, fee: 710 },
        { min: 4500, max: 4999.99, fee: 750 },
        { min: 5000, max: 5499.99, fee: 750 },
        { min: 5500, max: 5999.99, fee: 750 },
        { min: 6000, max: 6499.99, fee: 800 },
        { min: 6500, max: 6999.99, fee: 800 },
        { min: 7000, max: 7499.99, fee: 800 },
        { min: 7500, max: 7999.99, fee: 815 },
        { min: 8000, max: 8499.99, fee: 840 },
        { min: 8500, max: 8999.99, fee: 840 },
        { min: 9000, max: 9999.99, fee: 840 },
        { min: 10000, max: 10499.99, fee: 850 },
        { min: 10500, max: 10999.99, fee: 850 },
        { min: 11000, max: 11499.99, fee: 850 },
        { min: 11500, max: 11999.99, fee: 850 },
        { min: 12000, max: 12499.99, fee: 850 },
        { min: 12500, max: 14999.99, fee: 850 },
        { min: 15000, max: Infinity, fee: '7.25%' }
      ],
      bidFeeBrackets: [
        { min: 0, max: 99.99, fee: 0 },
        { min: 100, max: 499.99, fee: 39 },
        { min: 500, max: 999.99, fee: 49 },
        { min: 1000, max: 1499.99, fee: 69 },
        { min: 1500, max: 1999.99, fee: 79 },
        { min: 2000, max: 3999.99, fee: 89 },
        { min: 4000, max: 5999.99, fee: 99 },
        { min: 6000, max: 7999.99, fee: 119 },
        { min: 8000, max: Infinity, fee: 129 }
      ],
      active: true,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-03-10T14:30:00Z'
    },
    {
      id: 'copart-c-non_clean-secured',
      auctionHouse: 'COPART',
      accountType: 'C',
      titleType: 'non_clean',
      paymentMethod: 'secured',
      bidType: 'pre_bid',
      gateFee: 95,
      titleFee: 20,
      envFee: 15,
      auctionFeeBrackets: [
        { min: 0, max: 49.99, fee: 25 },
        { min: 50, max: 99.99, fee: 45 },
        { min: 100, max: 199.99, fee: 80 },
        { min: 200, max: 299.99, fee: 130 },
        { min: 300, max: 349.99, fee: 137.5 },
        { min: 350, max: 399.99, fee: 145 },
        { min: 400, max: 449.99, fee: 175 },
        { min: 450, max: 499.99, fee: 185 },
        { min: 500, max: 549.99, fee: 205 },
        { min: 550, max: 599.99, fee: 210 },
        { min: 600, max: 699.99, fee: 240 },
        { min: 700, max: 799.99, fee: 270 },
        { min: 800, max: 899.99, fee: 295 },
        { min: 900, max: 999.99, fee: 320 },
        { min: 1000, max: 1199.99, fee: 375 },
        { min: 1200, max: 1299.99, fee: 395 },
        { min: 1300, max: 1399.99, fee: 410 },
        { min: 1400, max: 1499.99, fee: 430 },
        { min: 1500, max: 1599.99, fee: 445 },
        { min: 1600, max: 1699.99, fee: 465 },
        { min: 1700, max: 1799.99, fee: 485 },
        { min: 1800, max: 1999.99, fee: 510 },
        { min: 2000, max: 2399.99, fee: 535 },
        { min: 2400, max: 2499.99, fee: 570 },
        { min: 2500, max: 2999.99, fee: 610 },
        { min: 3000, max: 3499.99, fee: 655 },
        { min: 3500, max: 3999.99, fee: 705 },
        { min: 4000, max: 4499.99, fee: 725 },
        { min: 4500, max: 4999.99, fee: 750 },
        { min: 5000, max: 5499.99, fee: 775 },
        { min: 5500, max: 5999.99, fee: 800 },
        { min: 6000, max: 6499.99, fee: 825 },
        { min: 6500, max: 6999.99, fee: 845 },
        { min: 7000, max: 7499.99, fee: 880 },
        { min: 7500, max: 7999.99, fee: 900 },
        { min: 8000, max: 8499.99, fee: 925 },
        { min: 8500, max: 8999.99, fee: 945 },
        { min: 9000, max: 9999.99, fee: 945 },
        { min: 10000, max: 10499.99, fee: 1000 },
        { min: 10500, max: 10999.99, fee: 1000 },
        { min: 11000, max: 11499.99, fee: 1000 },
        { min: 11500, max: 11999.99, fee: 1000 },
        { min: 12000, max: 12499.99, fee: 1000 },
        { min: 12500, max: 14999.99, fee: 1000 },
        { min: 15000, max: Infinity, fee: '7.5%' }
      ],
      bidFeeBrackets: [
        { min: 0, max: 99.99, fee: 0 },
        { min: 100, max: 499.99, fee: 40 },
        { min: 500, max: 999.99, fee: 55 },
        { min: 1000, max: 1499.99, fee: 75 },
        { min: 1500, max: 1999.99, fee: 85 },
        { min: 2000, max: 3999.99, fee: 100 },
        { min: 4000, max: 5999.99, fee: 110 },
        { min: 6000, max: 7999.99, fee: 125 },
        { min: 8000, max: Infinity, fee: 140 }
      ],
      active: true,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-02-20T10:15:00Z'
    },
    {
      id: 'copart-a-clean-secured',
      auctionHouse: 'COPART',
      accountType: 'A',
      titleType: 'clean',
      paymentMethod: 'secured',
      bidType: 'pre_bid',
      gateFee: 79,
      titleFee: 20,
      envFee: 0,
      auctionFeeBrackets: [
        { min: 0, max: 49.99, fee: 1 },
        { min: 50, max: 99.99, fee: 1 },
        { min: 100, max: 199.99, fee: 25 },
        { min: 200, max: 299.99, fee: 50 },
        { min: 300, max: 349.99, fee: 75 },
        { min: 350, max: 399.99, fee: 75 },
        { min: 400, max: 449.99, fee: 110 },
        { min: 450, max: 499.99, fee: 110 },
        { min: 500, max: 549.99, fee: 125 },
        { min: 550, max: 599.99, fee: 130 },
        { min: 600, max: 699.99, fee: 140 },
        { min: 700, max: 799.99, fee: 155 },
        { min: 800, max: 899.99, fee: 170 },
        { min: 900, max: 999.99, fee: 185 },
        { min: 1000, max: 1199.99, fee: 200 },
        { min: 1200, max: 1299.99, fee: 225 },
        { min: 1300, max: 1399.99, fee: 240 },
        { min: 1400, max: 1499.99, fee: 250 },
        { min: 1500, max: 1599.99, fee: 260 },
        { min: 1600, max: 1699.99, fee: 275 },
        { min: 1700, max: 1799.99, fee: 285 },
        { min: 1800, max: 1999.99, fee: 300 },
        { min: 2000, max: 2399.99, fee: 325 },
        { min: 2400, max: 2499.99, fee: 335 },
        { min: 2500, max: 2999.99, fee: 350 },
        { min: 3000, max: 3499.99, fee: 400 },
        { min: 3500, max: 3999.99, fee: 455 },
        { min: 4000, max: 4499.99, fee: 600 },
        { min: 4500, max: 4999.99, fee: 625 },
        { min: 5000, max: 5499.99, fee: 625 },
        { min: 5500, max: 5999.99, fee: 625 },
        { min: 6000, max: 6499.99, fee: 675 },
        { min: 6500, max: 6999.99, fee: 675 },
        { min: 7000, max: 7499.99, fee: 675 },
        { min: 7500, max: 7999.99, fee: 690 },
        { min: 8000, max: 8499.99, fee: 715 },
        { min: 8500, max: 8999.99, fee: 715 },
        { min: 9000, max: 9999.99, fee: 715 },
        { min: 10000, max: 10499.99, fee: 720 },
        { min: 10500, max: 10999.99, fee: 720 },
        { min: 11000, max: 11499.99, fee: 720 },
        { min: 11500, max: 11999.99, fee: 720 },
        { min: 12000, max: 12499.99, fee: 720 },
        { min: 12500, max: 14999.99, fee: 720 },
        { min: 15000, max: Infinity, fee: '5.75%' }
      ],
      bidFeeBrackets: [
        { min: 0, max: 99.99, fee: 0 },
        { min: 100, max: 499.99, fee: 39 },
        { min: 500, max: 999.99, fee: 49 },
        { min: 1000, max: 1499.99, fee: 69 },
        { min: 1500, max: 1999.99, fee: 79 },
        { min: 2000, max: 3999.99, fee: 89 },
        { min: 4000, max: 5999.99, fee: 99 },
        { min: 6000, max: 7999.99, fee: 119 },
        { min: 8000, max: Infinity, fee: 129 }
      ],
      active: true,
      createdAt: '2024-01-20T09:00:00Z',
      updatedAt: '2024-03-12T11:15:00Z'
    },
    {
      id: 'iaa-standard-live',
      auctionHouse: 'IAA',
      accountType: 'standard',
      titleType: 'clean',
      paymentMethod: 'secured',
      bidType: 'live',
      gateFee: 0,
      titleFee: 20,
      envFee: 15,
      fixedFees: 95,
      auctionFeeBrackets: [
        { min: 0, max: 49.99, fee: 0 },
        { min: 50, max: 99.99, fee: 25 },
        { min: 100, max: 199.99, fee: 80 },
        { min: 200, max: 299.99, fee: 130 },
        { min: 300, max: 349.99, fee: 137.5 },
        { min: 350, max: 399.99, fee: 145 },
        { min: 400, max: 449.99, fee: 175 },
        { min: 450, max: 499.99, fee: 185 },
        { min: 500, max: 549.99, fee: 205 },
        { min: 550, max: 599.99, fee: 210 },
        { min: 600, max: 699.99, fee: 240 },
        { min: 700, max: 799.99, fee: 270 },
        { min: 800, max: 899.99, fee: 295 },
        { min: 900, max: 999.99, fee: 320 },
        { min: 1000, max: 1199.99, fee: 375 },
        { min: 1200, max: 1299.99, fee: 395 },
        { min: 1300, max: 1399.99, fee: 410 },
        { min: 1400, max: 1499.99, fee: 430 },
        { min: 1500, max: 1599.99, fee: 445 },
        { min: 1600, max: 1699.99, fee: 465 },
        { min: 1700, max: 1799.99, fee: 485 },
        { min: 1800, max: 1999.99, fee: 510 },
        { min: 2000, max: 2399.99, fee: 535 },
        { min: 2400, max: 2499.99, fee: 570 },
        { min: 2500, max: 2999.99, fee: 610 },
        { min: 3000, max: 3499.99, fee: 655 },
        { min: 3500, max: 3999.99, fee: 705 },
        { min: 4000, max: 4499.99, fee: 725 },
        { min: 4500, max: 4999.99, fee: 750 },
        { min: 5000, max: 5499.99, fee: 775 },
        { min: 5500, max: 5999.99, fee: 800 },
        { min: 6000, max: 6499.99, fee: 825 },
        { min: 6500, max: 6999.99, fee: 845 },
        { min: 7000, max: 7499.99, fee: 880 },
        { min: 7500, max: 7999.99, fee: 900 },
        { min: 8000, max: 8499.99, fee: 925 },
        { min: 8500, max: 9999.99, fee: 945 },
        { min: 10000, max: 14999.99, fee: 1000 },
        { min: 15000, max: Infinity, fee: '7.5%' }
      ],
      bidFeeBrackets: [
        { min: 0, max: 99.99, fee: 0 },
        { min: 100, max: 499.99, fee: 50 },
        { min: 500, max: 999.99, fee: 65 },
        { min: 1000, max: 1499.99, fee: 85 },
        { min: 1500, max: 1999.99, fee: 95 },
        { min: 2000, max: 3999.99, fee: 110 },
        { min: 4000, max: 5999.99, fee: 125 },
        { min: 6000, max: 7999.99, fee: 145 },
        { min: 8000, max: Infinity, fee: 160 }
      ],
      active: true,
      createdAt: '2024-02-01T09:00:00Z',
      updatedAt: '2024-03-01T11:00:00Z'
    }
  ]

  useEffect(() => {
    fetchMatrices()
  }, [filterAuction, searchTerm])

  const fetchMatrices = async () => {
    try {
      let filteredData = [...mockAuctionData]
      
      if (filterAuction !== 'all') {
        filteredData = filteredData.filter(m => m.auctionHouse === filterAuction)
      }
      
      if (searchTerm) {
        filteredData = filteredData.filter(m => 
          m.accountType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.titleType.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      setMatrices(filteredData)
    } catch (error) {
      toast.error('Failed to fetch auction matrices')
    } finally {
      setLoading(false)
    }
  }

  const calculateSampleFee = (matrix: AuctionMatrix, price: number = 5000) => {
    // Calculate auction fee
    let auctionFee = 0
    for (const bracket of matrix.auctionFeeBrackets) {
      if (price >= bracket.min && price <= bracket.max) {
        auctionFee = typeof bracket.fee === 'string' 
          ? price * (parseFloat(bracket.fee) / 100) 
          : bracket.fee
        break
      }
    }

    // Calculate bid fee
    let bidFee = 0
    for (const bracket of matrix.bidFeeBrackets) {
      if (price >= bracket.min && price <= bracket.max) {
        bidFee = typeof bracket.fee === 'string' 
          ? price * (parseFloat(bracket.fee) / 100) 
          : bracket.fee
        break
      }
    }

    const total = auctionFee + bidFee + matrix.gateFee + matrix.titleFee + matrix.envFee + (matrix.fixedFees || 0)
    return Math.round(total)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getMatrixDescription = (matrix: AuctionMatrix) => {
    if (matrix.auctionHouse === 'COPART') {
      return `${matrix.auctionHouse} - Account ${matrix.accountType} - ${matrix.titleType} title - ${matrix.paymentMethod} payment`
    } else {
      return `${matrix.auctionHouse} - ${matrix.accountType} buyer - ${matrix.bidType} bid`
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auction pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Auction Fee Structure</h3>
            <p className="text-sm text-blue-700 mt-1">
              These matrices represent the complex fee structures used by COPART and IAA auctions. 
              Fees are calculated based on vehicle price brackets and account parameters.
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
              placeholder="Search account or title type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterAuction}
            onChange={(e) => setFilterAuction(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Auctions</option>
            <option value="COPART">COPART</option>
            <option value="IAA">IAA</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Auction Matrix
        </button>
      </div>

      {/* Matrices List */}
      {matrices.length === 0 ? (
        <EmptyState
          icon={<Calculator className="h-12 w-12" />}
          title="No auction matrices found"
          description="Add your first auction pricing matrix to get started"
        />
      ) : (
        <div className="space-y-4">
          {matrices.map((matrix) => (
            <div key={matrix.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Matrix Info */}
                <div className="lg:col-span-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      matrix.auctionHouse === 'COPART' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {matrix.auctionHouse}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      matrix.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {matrix.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {getMatrixDescription(matrix)}
                  </h4>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Updated:</strong> {formatDate(matrix.updatedAt)}</p>
                    <p><strong>Sample $5K Fee:</strong> ${calculateSampleFee(matrix)}</p>
                  </div>
                </div>

                {/* Fixed Fees */}
                <div className="lg:col-span-1">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Fixed Fees</h5>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    {matrix.gateFee > 0 && <div>Gate Fee: ${matrix.gateFee}</div>}
                    <div>Title Fee: ${matrix.titleFee}</div>
                    {matrix.envFee > 0 && <div>Environmental: ${matrix.envFee}</div>}
                    {matrix.fixedFees && <div>Service Fees: ${matrix.fixedFees}</div>}
                  </div>
                </div>

                {/* Actions & Fee Preview */}
                <div className="lg:col-span-1">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Sample Calculations</h5>
                  <div className="bg-gray-50 p-3 rounded text-xs space-y-1 mb-4">
                    <div>$1,000 → ${calculateSampleFee(matrix, 1000)}</div>
                    <div>$5,000 → ${calculateSampleFee(matrix, 5000)}</div>
                    <div>$10,000 → ${calculateSampleFee(matrix, 10000)}</div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleToggleStatus(matrix.id)}
                      className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        matrix.active
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {matrix.active ? 'Deactivate' : 'Activate'}
                    </button>
                    
                    <button
                      className="w-full bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Matrix
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes Section */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <Calculator className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-amber-800">Fee Calculation Notes</h4>
            <ul className="text-sm text-amber-700 mt-1 space-y-1">
              <li>• <strong>COPART:</strong> Account type (A/C), title type, payment method, and bid type all affect fees</li>
              <li>• <strong>IAA:</strong> Buyer type (standard/class_a) and bid type (live/proxy) determine fee structure</li>
              <li>• Fees are calculated using bracket-based systems with different rates for each price range</li>
              <li>• Some high-value brackets use percentage-based fees instead of fixed amounts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}