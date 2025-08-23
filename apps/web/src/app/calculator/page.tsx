'use client'

import { useState } from 'react'
import { Calculator, Car, Truck, Ship, FileText, TrendingUp } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import toast from 'react-hot-toast'

interface CalculationResult {
  auction?: {
    buyersPremium: number
    documentation: number
    gate: number
    title: number
    total: number
  }
  towing?: {
    baseCost: number
    distanceCost: number
    total: number
  }
  shipping?: {
    baseCost: number
    sizeSurcharge: number
    total: number
  }
  customs?: {
    dutyRate: number
    dutyAmount: number
    vat: number
    total: number
  }
}

export default function CalculatorPage() {
  const [activeCalculator, setActiveCalculator] = useState<'auction' | 'towing' | 'shipping' | 'customs'>('auction')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)

  // Auction calculator inputs
  const [auctionInputs, setAuctionInputs] = useState({
    winningBid: '',
    auction: 'COPART',
    accountType: 'C',
    titleType: 'clean',
    payment: 'secured'
  })

  // Towing calculator inputs
  const [towingInputs, setTowingInputs] = useState({
    distance: '',
    vehicleType: 'SEDAN'
  })

  // Shipping calculator inputs
  const [shippingInputs, setShippingInputs] = useState({
    vehicleType: 'SEDAN',
    port: 'USNWK',
    destination: 'rotterdam'
  })

  // Customs calculator inputs
  const [customsInputs, setCustomsInputs] = useState({
    vehicleValue: '',
    vehicleAge: '',
    destination: 'netherlands'
  })

  const [user] = useState({
    name: 'John Doe',
    email: 'john@demo.com',
    roles: ['DEALER'],
    orgName: 'Demo Dealer'
  })

  const handleCalculate = async () => {
    setLoading(true)
    setResult(null)

    try {
      let endpoint = ''
      let payload = {}

      switch (activeCalculator) {
        case 'auction':
          endpoint = '/api/calc/auction'
          payload = {
            winningBid: parseFloat(auctionInputs.winningBid),
            auction: auctionInputs.auction,
            accountType: auctionInputs.accountType,
            titleType: auctionInputs.titleType,
            payment: auctionInputs.payment
          }
          break
        case 'towing':
          endpoint = '/api/calc/towing'
          payload = {
            distance: parseFloat(towingInputs.distance),
            vehicleType: towingInputs.vehicleType
          }
          break
        case 'shipping':
          endpoint = '/api/calc/shipping'
          payload = {
            vehicleType: shippingInputs.vehicleType,
            port: shippingInputs.port,
            destination: shippingInputs.destination
          }
          break
        case 'customs':
          endpoint = '/api/calc/customs'
          payload = {
            vehicleValue: parseFloat(customsInputs.vehicleValue),
            vehicleAge: parseInt(customsInputs.vehicleAge),
            destination: customsInputs.destination
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({ [activeCalculator]: data.data })
        toast.success('Calculation completed!')
      } else {
        toast.error(data.error || 'Calculation failed')
      }
    } catch (error) {
      console.error('Calculation error:', error)
      toast.error('Error performing calculation')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const calculators = [
    { id: 'auction', label: 'Auction Fees', icon: <Car className="h-5 w-5" />, color: 'blue' },
    { id: 'towing', label: 'Towing Costs', icon: <Truck className="h-5 w-5" />, color: 'green' },
    { id: 'shipping', label: 'Shipping Costs', icon: <Ship className="h-5 w-5" />, color: 'purple' },
    { id: 'customs', label: 'Customs & Duties', icon: <FileText className="h-5 w-5" />, color: 'orange' },
  ]

  return (
    <AppLayout user={user}>
      <PageHeader 
        title="Cost Calculator"
        description="Calculate auction fees, towing, shipping, and customs costs"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Calculator' }]}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Calculator Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Select Calculator
                </h3>
                <div className="space-y-2">
                  {calculators.map((calc) => (
                    <button
                      key={calc.id}
                      onClick={() => setActiveCalculator(calc.id as any)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg border transition-colors ${
                        activeCalculator === calc.id
                          ? `bg-${calc.color}-50 border-${calc.color}-200 text-${calc.color}-700`
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {calc.icon}
                      <span className="ml-3 font-medium">{calc.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Calculator Forms */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                {activeCalculator === 'auction' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Auction Fee Calculator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Winning Bid ($)
                        </label>
                        <input
                          type="number"
                          value={auctionInputs.winningBid}
                          onChange={(e) => setAuctionInputs({...auctionInputs, winningBid: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="15000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auction House
                        </label>
                        <select
                          value={auctionInputs.auction}
                          onChange={(e) => setAuctionInputs({...auctionInputs, auction: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="COPART">Copart</option>
                          <option value="IAA">IAA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Account Type
                        </label>
                        <select
                          value={auctionInputs.accountType}
                          onChange={(e) => setAuctionInputs({...auctionInputs, accountType: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="C">Commercial</option>
                          <option value="P">Personal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title Type
                        </label>
                        <select
                          value={auctionInputs.titleType}
                          onChange={(e) => setAuctionInputs({...auctionInputs, titleType: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="clean">Clean</option>
                          <option value="salvage">Salvage</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeCalculator === 'towing' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Towing Cost Calculator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Distance (miles)
                        </label>
                        <input
                          type="number"
                          value={towingInputs.distance}
                          onChange={(e) => setTowingInputs({...towingInputs, distance: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="250"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Type
                        </label>
                        <select
                          value={towingInputs.vehicleType}
                          onChange={(e) => setTowingInputs({...towingInputs, vehicleType: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="SEDAN">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="BIGSUV">Large SUV</option>
                          <option value="VAN">Van</option>
                          <option value="PICKUP">Pickup Truck</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeCalculator === 'shipping' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Cost Calculator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Type
                        </label>
                        <select
                          value={shippingInputs.vehicleType}
                          onChange={(e) => setShippingInputs({...shippingInputs, vehicleType: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="SEDAN">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="BIGSUV">Large SUV</option>
                          <option value="VAN">Van</option>
                          <option value="PICKUP">Pickup Truck</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Origin Port
                        </label>
                        <select
                          value={shippingInputs.port}
                          onChange={(e) => setShippingInputs({...shippingInputs, port: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="USNWK">Newark, NJ</option>
                          <option value="USHOU">Houston, TX</option>
                          <option value="USLAX">Los Angeles, CA</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destination
                        </label>
                        <select
                          value={shippingInputs.destination}
                          onChange={(e) => setShippingInputs({...shippingInputs, destination: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="rotterdam">Rotterdam, Netherlands</option>
                          <option value="hamburg">Hamburg, Germany</option>
                          <option value="antwerp">Antwerp, Belgium</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeCalculator === 'customs' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Customs & Duties Calculator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Value ($)
                        </label>
                        <input
                          type="number"
                          value={customsInputs.vehicleValue}
                          onChange={(e) => setCustomsInputs({...customsInputs, vehicleValue: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="25000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Age (years)
                        </label>
                        <input
                          type="number"
                          value={customsInputs.vehicleAge}
                          onChange={(e) => setCustomsInputs({...customsInputs, vehicleAge: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="5"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destination Country
                        </label>
                        <select
                          value={customsInputs.destination}
                          onChange={(e) => setCustomsInputs({...customsInputs, destination: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="netherlands">Netherlands</option>
                          <option value="germany">Germany</option>
                          <option value="belgium">Belgium</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Calculating...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Calculate
                      </>
                    )}
                  </button>
                </div>

                {/* Results */}
                {result && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Calculation Results</h4>
                    {result.auction && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Buyer's Premium:</span>
                          <span className="font-medium">{formatCurrency(result.auction.buyersPremium)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Documentation Fee:</span>
                          <span className="font-medium">{formatCurrency(result.auction.documentation)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gate Fee:</span>
                          <span className="font-medium">{formatCurrency(result.auction.gate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Title Fee:</span>
                          <span className="font-medium">{formatCurrency(result.auction.title)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Fees:</span>
                          <span>{formatCurrency(result.auction.total)}</span>
                        </div>
                      </div>
                    )}
                    {result.towing && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base Cost:</span>
                          <span className="font-medium">{formatCurrency(result.towing.baseCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance Cost:</span>
                          <span className="font-medium">{formatCurrency(result.towing.distanceCost)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Cost:</span>
                          <span>{formatCurrency(result.towing.total)}</span>
                        </div>
                      </div>
                    )}
                    {result.shipping && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base Cost:</span>
                          <span className="font-medium">{formatCurrency(result.shipping.baseCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size Surcharge:</span>
                          <span className="font-medium">{formatCurrency(result.shipping.sizeSurcharge)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Cost:</span>
                          <span>{formatCurrency(result.shipping.total)}</span>
                        </div>
                      </div>
                    )}
                    {result.customs && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Duty Rate:</span>
                          <span className="font-medium">{(result.customs.dutyRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duty Amount:</span>
                          <span className="font-medium">{formatCurrency(result.customs.dutyAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VAT:</span>
                          <span className="font-medium">{formatCurrency(result.customs.vat)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total Cost:</span>
                          <span>{formatCurrency(result.customs.total)}</span>
                        </div>
                      </div>
                    )}
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