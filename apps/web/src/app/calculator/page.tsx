'use client'

import { useState, useEffect } from 'react'
import { Calculator, Car, Truck, Ship, FileText, TrendingUp, RefreshCw, Plus, Minus } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { useSession } from '@/hooks/useSession'
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion'
import { auctionLocations, shippingPorts, vehicleTypes, getAuctionHouses, getLocationsByAuctionHouse } from '@united-cars/calc'
import { getTowingPrice, getShippingPrice, getExpeditionRates, getAvailableDestinations, getTowingMatrices, getShippingMatrices, getExpeditionMatrices } from '@/lib/pricing-matrices'
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
    customsClearance: number
    expedition: number
    declaredValueEUR: number
    customClearanceTotal: number
    total: number
  }
}

export default function CalculatorPage() {
  const [activeCalculator, setActiveCalculator] = useState<'auction' | 'towing' | 'shipping' | 'customs'>('auction')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)

  // Auction calculator inputs
  const [auctionInputs, setAuctionInputs] = useState({
    winningBid: '10000',
    auction: 'COPART',
    // Copart fields
    accountType: 'A',
    titleType: 'non_clean',
    payment: 'secured',
    bidType: 'pre_bid',
    // IAA fields
    buyerType: 'class_a',
    iaaBidType: 'proxy'
  })

  // Towing calculator inputs
  const [towingInputs, setTowingInputs] = useState({
    vehicleType: 'sedan',
    auctionHouse: 'COPART',
    auctionLocation: '',
    shippingPort: ''
  })

  // Shipping calculator inputs
  const [shippingInputs, setShippingInputs] = useState({
    vehicleType: 'sedan',
    port: '',
    destination: '',
    consolidationType: 'quarterContainer' // Default for sedan
  })

  // Customs calculator inputs
  const [customsInputs, setCustomsInputs] = useState({
    declaredValue: '10000',
    destinationPort: '',
    vehicleType: 'car'
  })
  
  // Dynamic data from matrices
  const [availableRoutes, setAvailableRoutes] = useState({
    towingRoutes: [],
    shippingRoutes: [],
    expeditionDestinations: []
  })
  
  // Available locations and ports based on current selections
  const [availableTowingLocations, setAvailableTowingLocations] = useState<any[]>([])
  const [availableTowingPorts, setAvailableTowingPorts] = useState<string[]>([])
  const [availableShippingDestinations, setAvailableShippingDestinations] = useState<string[]>([])

  const { user, loading: sessionLoading } = useSession()
  const { exchangeRate, convert, loading: exchangeLoading, error: exchangeError, lastUpdated, isFallback, refresh } = useCurrencyConversion('USD', 'EUR')

  // Load available routes from matrices and populate dropdowns
  useEffect(() => {
    const routes = getAvailableDestinations()
    setAvailableRoutes(routes as any)
    
    // Set available towing locations based on selected auction house
    const towingLocations = routes.towingRoutes.filter(r => 
      r.auctionHouse === towingInputs.auctionHouse.toUpperCase()
    )
    setAvailableTowingLocations(towingLocations)
    
    // Set available shipping destinations based on selected port
    const shippingRoutes = routes.shippingRoutes.find(r => 
      r.shippingPort.toLowerCase().includes(towingInputs.shippingPort.toLowerCase())
    )
    setAvailableShippingDestinations(shippingRoutes?.destinations || [])
  }, [])

  // Listen for localStorage changes to ensure data persistence across admin panel edits
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'towing-matrices' || e.key === 'shipping-matrices' || e.key === 'expedition-matrices') {
        // Refresh available routes when matrices are updated
        const routes = getAvailableDestinations()
        setAvailableRoutes(routes as any)
        
        // Clear any existing results to force recalculation
        setResult(null)
        
        toast.success('Pricing matrices updated - calculator data refreshed!')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for manual updates within the same tab
    const handlePricingUpdate = () => {
      const routes = getAvailableDestinations()
      setAvailableRoutes(routes as any)
      
      // Update dropdown options
      const towingLocations = routes.towingRoutes.filter(r => 
        r.auctionHouse === towingInputs.auctionHouse.toUpperCase()
      )
      setAvailableTowingLocations(towingLocations)
      
      const shippingRoutes = routes.shippingRoutes.find(r => 
        r.shippingPort.toLowerCase().includes(towingInputs.shippingPort.toLowerCase())
      )
      setAvailableShippingDestinations(shippingRoutes?.destinations || [])
      
      setResult(null)
    }
    
    window.addEventListener('pricingMatricesUpdated', handlePricingUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('pricingMatricesUpdated', handlePricingUpdate)
    }
  }, [])

  // Update available towing locations when auction house changes
  useEffect(() => {
    const routes = getAvailableDestinations()
    const towingLocations = routes.towingRoutes.filter(r => 
      r.auctionHouse === towingInputs.auctionHouse
    )
    setAvailableTowingLocations(towingLocations)
    
    // Reset location and port when auction house changes
    if (towingLocations.length > 0) {
      const firstLocation = towingLocations[0]
      setTowingInputs({
        ...towingInputs,
        auctionLocation: firstLocation.auctionLocation,
        shippingPort: firstLocation.ports[0] || ''
      })
      setAvailableTowingPorts(firstLocation.ports)
    } else {
      setTowingInputs({
        ...towingInputs,
        auctionLocation: '',
        shippingPort: ''
      })
      setAvailableTowingPorts([])
    }
  }, [towingInputs.auctionHouse])

  // Update available ports when towing location changes  
  useEffect(() => {
    const selectedLocation = availableTowingLocations.find(l => 
      l.auctionLocation === towingInputs.auctionLocation
    )
    if (selectedLocation) {
      setAvailableTowingPorts(selectedLocation.ports)
      // Auto-select first port if current selection is not available
      if (!selectedLocation.ports.includes(towingInputs.shippingPort)) {
        setTowingInputs({
          ...towingInputs,
          shippingPort: selectedLocation.ports[0] || ''
        })
      }
    }
  }, [towingInputs.auctionLocation, availableTowingLocations])

  // Update available shipping destinations when port changes
  useEffect(() => {
    const routes = getAvailableDestinations()
    const shippingRoute = routes.shippingRoutes.find(r => 
      r.shippingPort.toLowerCase().includes(shippingInputs.port.toLowerCase()) ||
      r.shippingPort === shippingInputs.port
    )
    setAvailableShippingDestinations(shippingRoute?.destinations || [])
    
    // Reset destination when port changes
    if (shippingRoute && shippingRoute.destinations.length > 0) {
      setShippingInputs({
        ...shippingInputs,
        destination: shippingRoute.destinations[0]
      })
    } else {
      setShippingInputs({
        ...shippingInputs,
        destination: ''
      })
    }
  }, [shippingInputs.port])

  // Update consolidation type when shipping vehicle type changes
  useEffect(() => {
    const defaultConsolidationType = getDefaultConsolidationType(shippingInputs.vehicleType)
    const availableOptions = getConsolidationOptions(shippingInputs.vehicleType)
    
    // If current consolidation type is not available for the new vehicle type, reset to default
    const isCurrentOptionAvailable = availableOptions.some(option => option.key === shippingInputs.consolidationType)
    
    if (!isCurrentOptionAvailable) {
      setShippingInputs({
        ...shippingInputs,
        consolidationType: defaultConsolidationType
      })
    }
  }, [shippingInputs.vehicleType])

  // Initialize default selections when routes load
  useEffect(() => {
    const routes = getAvailableDestinations()
    
    // Initialize towing defaults
    if (routes.towingRoutes.length > 0 && !towingInputs.auctionLocation) {
      const copartLocations = routes.towingRoutes.filter(r => r.auctionHouse === 'COPART')
      if (copartLocations.length > 0) {
        const firstLocation = copartLocations[0]
        setTowingInputs({
          ...towingInputs,
          auctionLocation: firstLocation.auctionLocation,
          shippingPort: firstLocation.ports[0] || ''
        })
      }
    }
    
    // Initialize shipping defaults
    if (routes.shippingRoutes.length > 0 && !shippingInputs.port) {
      const firstRoute = routes.shippingRoutes[0]
      setShippingInputs({
        ...shippingInputs,
        port: firstRoute.shippingPort,
        destination: firstRoute.destinations[0] || ''
      })
    }
    
    // Initialize customs defaults
    if (routes.expeditionDestinations.length > 0 && !customsInputs.destinationPort) {
      const firstDest = routes.expeditionDestinations[0]
      setCustomsInputs({
        ...customsInputs,
        destinationPort: firstDest.destinationPort.toLowerCase()
      })
    }
  }, [availableRoutes])

  // Reset results when calculator type changes
  useEffect(() => {
    setResult(null)
  }, [activeCalculator])

  // Auto-calculate auction fees when inputs change
  useEffect(() => {
    if (activeCalculator !== 'auction') return
    
    const winningBid = parseFloat(auctionInputs.winningBid)
    if (isNaN(winningBid) || winningBid <= 0) {
      setResult(null)
      return
    }
    
    const calculateAuction = async () => {
      setLoading(true)
      try {
        const endpoint = '/api/calc/auction'
        const payload = {
          carPriceUSD: winningBid,
          auction: auctionInputs.auction
        }
        
        if (auctionInputs.auction === 'COPART') {
          payload.accountType = auctionInputs.accountType
          payload.titleType = auctionInputs.titleType
          payload.payment = auctionInputs.payment
          payload.bidType = auctionInputs.bidType
        } else if (auctionInputs.auction === 'IAA') {
          payload.buyerType = auctionInputs.buyerType
          payload.iaaBidType = auctionInputs.iaaBidType
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (response.ok && data.success) {
          let transformedData = data.data
          
          if (data.data.breakdown) {
            if (auctionInputs.auction === 'COPART') {
              transformedData = {
                buyersPremium: data.data.breakdown.auctionFee || 0,
                documentation: data.data.breakdown.bidFee || 0,
                gate: data.data.breakdown.gateFee || 0,
                title: (data.data.breakdown.titleFee || 0) + (data.data.breakdown.envFee || 0),
                total: data.data.total
              }
            } else if (auctionInputs.auction === 'IAA') {
              transformedData = {
                buyersPremium: data.data.breakdown.buyFee || 0,
                documentation: data.data.breakdown.bidFee || 0,
                gate: 0,
                title: data.data.breakdown.fixedFees || 0,
                total: data.data.total
              }
            }
          }
          
          setResult({ auction: transformedData })
        } else {
          setResult(null)
        }
      } catch (error) {
        console.error('Auction calculation error:', error)
        setResult(null)
      } finally {
        setLoading(false)
      }
    }
    
    calculateAuction()
  }, [activeCalculator, auctionInputs])

  // Auto-calculate towing costs when inputs change
  useEffect(() => {
    if (activeCalculator !== 'towing') return
    
    if (!towingInputs.auctionHouse || !towingInputs.auctionLocation || !towingInputs.shippingPort || !towingInputs.vehicleType) {
      setResult(null)
      return
    }
    
    const calculateTowing = () => {
      setLoading(true)
      try {
        const towingPrice = getTowingPrice(
          towingInputs.auctionHouse.toUpperCase(),
          towingInputs.auctionLocation,
          towingInputs.shippingPort,
          towingInputs.vehicleType
        )
        
        if (towingPrice === null) {
          setResult(null)
        } else {
          setResult({
            towing: {
              baseCost: towingPrice,
              distanceCost: 0,
              total: towingPrice
            }
          })
        }
      } catch (error) {
        console.error('Towing calculation error:', error)
        setResult(null)
      } finally {
        setLoading(false)
      }
    }
    
    calculateTowing()
  }, [activeCalculator, towingInputs])

  // Auto-calculate shipping costs when inputs change
  useEffect(() => {
    if (activeCalculator !== 'shipping') return
    
    if (!shippingInputs.port || !shippingInputs.destination || !shippingInputs.vehicleType || !shippingInputs.consolidationType) {
      setResult(null)
      return
    }
    
    const calculateShipping = () => {
      setLoading(true)
      try {
        const shippingPricing = getShippingPrice(
          shippingInputs.port,
          shippingInputs.destination,
          shippingInputs.vehicleType
        )
        
        if (shippingPricing === null) {
          setResult(null)
        } else {
          let finalPrice = 0
          
          if (shippingInputs.vehicleType === 'motorcycle') {
            // Motorcycle uses fixed vehicle pricing
            finalPrice = shippingPricing.vehiclePrice
          } else {
            // Other vehicles use consolidation pricing
            finalPrice = shippingPricing.consolidationPricing[shippingInputs.consolidationType] || 0
          }
          
          setResult({
            shipping: {
              baseCost: finalPrice,
              sizeSurcharge: 0,
              total: finalPrice
            }
          })
        }
      } catch (error) {
        console.error('Shipping calculation error:', error)
        setResult(null)
      } finally {
        setLoading(false)
      }
    }
    
    calculateShipping()
  }, [activeCalculator, shippingInputs])

  // Auto-calculate customs costs when inputs change
  useEffect(() => {
    if (activeCalculator !== 'customs') return
    
    const declaredValue = parseFloat(customsInputs.declaredValue)
    if (isNaN(declaredValue) || declaredValue <= 0 || !customsInputs.destinationPort || !customsInputs.vehicleType) {
      setResult(null)
      return
    }
    
    const calculateCustoms = () => {
      setLoading(true)
      try {
        const customsValueUSD = declaredValue
        const customsValueEUR = customsValueUSD * exchangeRate
        
        const expeditionRates = getExpeditionRates(
          customsInputs.destinationPort,
          customsInputs.vehicleType
        )
        
        if (expeditionRates === null) {
          setResult(null)
        } else {
          const taxAmount = customsValueEUR * expeditionRates.taxRate
          const vatAmount = (customsValueEUR + taxAmount) * expeditionRates.vatRate
          const customAgencyFee = expeditionRates.consolidationPricing.quarterContainer || 500
          const additionalCharges = (expeditionRates.additionalCharges.thc || 0) + 
                                  expeditionRates.additionalCharges.t1Declaration
          const customClearanceTotal = taxAmount + vatAmount + customAgencyFee + additionalCharges
          const total = customsValueEUR + customClearanceTotal
          
          setResult({
            customs: {
              dutyRate: expeditionRates.taxRate,
              dutyAmount: taxAmount,
              vat: vatAmount,
              customsClearance: customAgencyFee + additionalCharges,
              expedition: 0,
              declaredValueEUR: customsValueEUR,
              customClearanceTotal,
              total
            }
          })
        }
      } catch (error) {
        console.error('Customs calculation error:', error)
        setResult(null)
      } finally {
        setLoading(false)
      }
    }
    
    calculateCustoms()
  }, [activeCalculator, customsInputs, exchangeRate])

  // Helper function to increment/decrement values by $100
  const adjustValue = (currentValue: string, increment: boolean, step: number = 100) => {
    const current = parseFloat(currentValue) || 0
    const newValue = increment ? current + step : Math.max(0, current - step)
    return newValue.toString()
  }

  // Helper function to get available consolidation options based on vehicle type
  const getConsolidationOptions = (vehicleType: string) => {
    const options = {
      quarterContainer: { label: '1/4 Container', key: 'quarterContainer' },
      thirdContainer: { label: '1/3 Container', key: 'thirdContainer' },
      halfContainer: { label: '1/2 Container', key: 'halfContainer' }
    }

    switch (vehicleType) {
      case 'sedan':
      case 'smallMediumSUV':
        return [options.quarterContainer, options.thirdContainer, options.halfContainer]
      case 'bigSUV':
      case 'pickup':
      case 'van':
        return [options.thirdContainer, options.halfContainer]
      case 'motorcycle':
        // Motorcycle uses fixed rate, no container options needed
        return []
      default:
        return [options.quarterContainer, options.thirdContainer, options.halfContainer]
    }
  }

  // Helper function to get default consolidation type for vehicle
  const getDefaultConsolidationType = (vehicleType: string) => {
    switch (vehicleType) {
      case 'sedan':
      case 'smallMediumSUV':
        return 'quarterContainer'
      case 'bigSUV':
      case 'pickup':
      case 'van':
        return 'thirdContainer'
      case 'motorcycle':
        // Motorcycle uses fixed rate, no consolidation needed
        return 'fixed'
      default:
        return 'quarterContainer'
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
                        <div className="relative flex items-stretch">
                          <button
                            type="button"
                            onClick={() => setAuctionInputs({...auctionInputs, winningBid: adjustValue(auctionInputs.winningBid, false)})}
                            className="relative -mr-px inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-l-lg bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={auctionInputs.winningBid}
                            onChange={(e) => setAuctionInputs({...auctionInputs, winningBid: e.target.value})}
                            className="relative flex-1 min-w-0 border border-gray-300 px-4 py-2 text-center focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="10000"
                          />
                          <button
                            type="button"
                            onClick={() => setAuctionInputs({...auctionInputs, winningBid: adjustValue(auctionInputs.winningBid, true)})}
                            className="relative -ml-px inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-r-lg bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auction House
                        </label>
                        <select
                          value={auctionInputs.auction}
                          onChange={(e) => {
                            setAuctionInputs({...auctionInputs, auction: e.target.value})
                            setResult(null) // Clear results when auction type changes
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="COPART">Copart</option>
                          <option value="IAA">IAA</option>
                        </select>
                      </div>
                      
                      {/* Copart-specific fields */}
                      {auctionInputs.auction === 'COPART' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Type
                            </label>
                            <select
                              value={auctionInputs.accountType}
                              onChange={(e) => setAuctionInputs({...auctionInputs, accountType: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="A">A Class</option>
                              <option value="C">C Class</option>
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
                              <option value="non_clean">Non-Clean</option>
                              <option value="clean">Clean</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Method
                            </label>
                            <select
                              value={auctionInputs.payment}
                              onChange={(e) => setAuctionInputs({...auctionInputs, payment: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="secured">Secured Payment</option>
                              <option value="unsecured">Unsecured Payment</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bid Type
                            </label>
                            <select
                              value={auctionInputs.bidType}
                              onChange={(e) => setAuctionInputs({...auctionInputs, bidType: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="pre_bid">Pre-Bid</option>
                              <option value="live_bid">Live Bid</option>
                            </select>
                          </div>
                        </>
                      )}
                      
                      {/* IAA-specific fields */}
                      {auctionInputs.auction === 'IAA' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Account Type
                            </label>
                            <select
                              value={auctionInputs.buyerType}
                              onChange={(e) => setAuctionInputs({...auctionInputs, buyerType: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="class_a">A Class</option>
                              <option value="standard">C Class</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bid Type
                            </label>
                            <select
                              value={auctionInputs.iaaBidType}
                              onChange={(e) => setAuctionInputs({...auctionInputs, iaaBidType: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="proxy">Pre-Bid</option>
                              <option value="live">Live Bid</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeCalculator === 'towing' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Towing Cost Calculator</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Type
                        </label>
                        <select
                          value={towingInputs.vehicleType}
                          onChange={(e) => setTowingInputs({...towingInputs, vehicleType: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="sedan">Sedan</option>
                          <option value="smallMediumSUV">Small/Medium SUV</option>
                          <option value="bigSUV">Big SUV</option>
                          <option value="pickup">Pickup Truck</option>
                          <option value="van">Van</option>
                          <option value="motorcycle">Motorcycle</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auction House
                        </label>
                        <select
                          value={towingInputs.auctionHouse}
                          onChange={(e) => setTowingInputs({...towingInputs, auctionHouse: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Array.from(new Set((availableRoutes.towingRoutes as any[]).map(r => r.auctionHouse))).map(house => (
                            <option key={house} value={house}>{house}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <select
                          value={towingInputs.auctionLocation}
                          onChange={(e) => setTowingInputs({...towingInputs, auctionLocation: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={availableTowingLocations.length === 0}
                        >
                          {availableTowingLocations.length === 0 ? (
                            <option value="">No locations available for this auction house</option>
                          ) : (
                            availableTowingLocations.map(location => (
                              <option key={location.auctionLocation} value={location.auctionLocation}>
                                {location.auctionLocation}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Shipping Port
                        </label>
                        <select
                          value={towingInputs.shippingPort}
                          onChange={(e) => setTowingInputs({...towingInputs, shippingPort: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={availableTowingPorts.length === 0}
                        >
                          {availableTowingPorts.length === 0 ? (
                            <option value="">No ports available for this location</option>
                          ) : (
                            availableTowingPorts.map(port => (
                              <option key={port} value={port}>
                                {port}
                              </option>
                            ))
                          )}
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
                          <option value="sedan">Sedan</option>
                          <option value="smallMediumSUV">Small/Medium SUV</option>
                          <option value="bigSUV">Big SUV</option>
                          <option value="pickup">Pickup Truck</option>
                          <option value="van">Van</option>
                          <option value="motorcycle">Motorcycle</option>
                        </select>
                      </div>
                      {shippingInputs.vehicleType !== 'motorcycle' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Consolidation Type
                          </label>
                          <select
                            value={shippingInputs.consolidationType}
                            onChange={(e) => setShippingInputs({...shippingInputs, consolidationType: e.target.value})}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {getConsolidationOptions(shippingInputs.vehicleType).map(option => (
                              <option key={option.key} value={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Origin Port
                        </label>
                        <select
                          value={shippingInputs.port}
                          onChange={(e) => setShippingInputs({...shippingInputs, port: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {(availableRoutes.shippingRoutes as any[]).length === 0 ? (
                            <option value="">No shipping ports available</option>
                          ) : (
                            (availableRoutes.shippingRoutes as any[]).map(route => (
                              <option key={route.shippingPort} value={route.shippingPort}>
                                {route.shippingPort}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destination
                        </label>
                        <select
                          value={shippingInputs.destination}
                          onChange={(e) => setShippingInputs({...shippingInputs, destination: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={availableShippingDestinations.length === 0}
                        >
                          {availableShippingDestinations.length === 0 ? (
                            <option value="">No destinations available for this port</option>
                          ) : (
                            availableShippingDestinations.map(destination => (
                              <option key={destination} value={destination}>
                                {destination}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeCalculator === 'customs' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">EU Customs & Duties Calculator</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`${isFallback ? 'text-amber-600' : 'text-green-600'}`}>
                          USD/EUR: {exchangeRate.toFixed(4)}
                        </span>
                        <button
                          onClick={async () => {
                            await refresh()
                            toast.success('Exchange rate updated!')
                          }}
                          disabled={exchangeLoading}
                          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          title="Refresh exchange rate"
                        >
                          <RefreshCw className={`h-4 w-4 ${exchangeLoading ? 'animate-spin' : ''}`} />
                        </button>
                        {lastUpdated && (
                          <span className="text-gray-500 text-xs">
                            {isFallback ? 'Fallback rate' : new Date(lastUpdated).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Customs Value ($)
                        </label>
                        <div className="relative flex items-stretch">
                          <button
                            type="button"
                            onClick={() => setCustomsInputs({...customsInputs, declaredValue: adjustValue(customsInputs.declaredValue, false)})}
                            className="relative -mr-px inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-l-lg bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={customsInputs.declaredValue}
                            onChange={(e) => setCustomsInputs({...customsInputs, declaredValue: e.target.value})}
                            className="relative flex-1 min-w-0 border border-gray-300 px-4 py-2 text-center focus:z-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="10000"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomsInputs({...customsInputs, declaredValue: adjustValue(customsInputs.declaredValue, true)})}
                            className="relative -ml-px inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-r-lg bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Type
                        </label>
                        <select
                          value={customsInputs.vehicleType}
                          onChange={(e) => setCustomsInputs({...customsInputs, vehicleType: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="car">Car</option>
                          <option value="classicCar">Classic Car</option>
                          <option value="truck">Truck</option>
                          <option value="motorcycle">Motorcycle</option>
                          <option value="jetSki">Jet Ski/Boat</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Destination Port
                        </label>
                        <select
                          value={customsInputs.destinationPort}
                          onChange={(e) => setCustomsInputs({...customsInputs, destinationPort: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {(availableRoutes.expeditionDestinations as any[]).length === 0 ? (
                            <option value="">No expedition destinations available</option>
                          ) : (
                            (availableRoutes.expeditionDestinations as any[]).map(dest => (
                              <option key={dest.destinationPort} value={dest.destinationPort.toLowerCase()}>
                                {dest.destinationPort} ({dest.country})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Calculation Results</h4>
                    {result.auction && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-gray-600">Auction Fees</div>
                            <div className="font-medium">{auctionInputs.auction} - ${auctionInputs.winningBid}</div>
                          </div>
                          <div className="text-2xl font-bold">{formatCurrency(result.auction.total)}</div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>{auctionInputs.auction === 'COPART' ? 'Auction Fee' : 'Volume Fee'}:</span>
                            <span>{formatCurrency(result.auction.buyersPremium)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{auctionInputs.auction === 'COPART' ? 'Bid Fee' : 'Internet Bid Fee'}:</span>
                            <span>{formatCurrency(result.auction.documentation)}</span>
                          </div>
                          {auctionInputs.auction === 'COPART' && result.auction.gate > 0 && (
                            <div className="flex justify-between">
                              <span>Gate Fee:</span>
                              <span>{formatCurrency(result.auction.gate)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>{auctionInputs.auction === 'COPART' ? 'Title & Environmental' : 'Service Fees'}:</span>
                            <span>{formatCurrency(result.auction.title)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.towing && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-gray-600">Ground Transport</div>
                            <div className="font-medium">{towingInputs.auctionLocation} → {towingInputs.shippingPort}</div>
                          </div>
                          <div className="text-2xl font-bold">{formatCurrency(result.towing.total)}</div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Vehicle: {towingInputs.vehicleType.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div>Auction: {towingInputs.auctionHouse}</div>
                        </div>
                      </div>
                    )}
                    {result.shipping && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-gray-600">Ocean Freight</div>
                            <div className="font-medium">{shippingInputs.port} → {shippingInputs.destination}</div>
                          </div>
                          <div className="text-2xl font-bold">{formatCurrency(result.shipping.total)}</div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Vehicle: {shippingInputs.vehicleType.replace(/([A-Z])/g, ' $1').trim()}</div>
                          {shippingInputs.vehicleType === 'motorcycle' ? (
                            <div>Method: Fixed Rate</div>
                          ) : (
                            <div>Container: {getConsolidationOptions(shippingInputs.vehicleType).find(opt => opt.key === shippingInputs.consolidationType)?.label}</div>
                          )}
                        </div>
                      </div>
                    )}
                    {result.customs && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm text-gray-600">EU Customs & Duties</div>
                            <div className="font-medium">{customsInputs.destinationPort.charAt(0).toUpperCase() + customsInputs.destinationPort.slice(1)} - €{result.customs.declaredValueEUR.toLocaleString()}</div>
                          </div>
                          <div className="text-2xl font-bold">€{result.customs.customClearanceTotal.toLocaleString()}</div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Tax ({(result.customs.dutyRate * 100).toFixed(1)}%):</span>
                            <span>€{result.customs.dutyAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>VAT ({(result.customs.vat / (result.customs.declaredValueEUR + result.customs.dutyAmount) * 100).toFixed(1)}%):</span>
                            <span>€{result.customs.vat.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Custom Agency:</span>
                            <span>€{result.customs.customsClearance.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total (incl. vehicle):</span>
                            <span className="font-semibold">€{result.customs.total.toLocaleString()}</span>
                          </div>
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