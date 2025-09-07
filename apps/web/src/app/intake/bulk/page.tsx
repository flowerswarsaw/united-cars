'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'

interface ParsedVehicle {
  id: string
  vin?: string
  make?: string
  model?: string
  year?: number
  lot?: string
  price?: number
  auction?: string
  usPort?: string
  destinationPort?: string
  insurance?: string
  paymentMethod?: string
  rawMessage?: string
  errors?: string[]
}

const US_PORTS = [
  'NY - New York',
  'GA - Georgia', 
  'Los Angeles',
  'New Jersey',
  'FL - Florida',
  'TX - Texas'
]

const DESTINATION_PORTS = [
  'Batumi',
  'Poti', 
  'Odessa',
  'Constanta',
  'Hamburg',
  'Antwerp',
  'Rotterdam'
]

export default function BulkIntakePage() {
  const router = useRouter()
  const { user } = useSession()
  const [rawMessages, setRawMessages] = useState('')
  const [parsedVehicles, setParsedVehicles] = useState<ParsedVehicle[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSettings, setUserSettings] = useState({
    defaultInsurance: '1%',
    defaultUsPort: null,
    defaultDestinationPort: null
  })

  useEffect(() => {
    loadUserSettings()
  }, [user])

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setUserSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
    }
  }

  const parseMessages = () => {
    if (!rawMessages.trim()) return

    const messages = rawMessages.split(/\n\s*\n/).filter(msg => msg.trim())
    const parsed: ParsedVehicle[] = []

    messages.forEach((message, index) => {
      const vehicle: ParsedVehicle = {
        id: `temp-${index}`,
        rawMessage: message,
        errors: [],
        insurance: userSettings.defaultInsurance,
        usPort: userSettings.defaultUsPort || '',
        destinationPort: userSettings.defaultDestinationPort || 'Rotterdam'
      }

      // Parse VIN
      const vinMatch = message.match(/vin:?\s*([A-HJ-NPR-Z0-9]{11,17})/i)
      if (vinMatch) {
        vehicle.vin = vinMatch[1].toUpperCase()
      } else {
        vehicle.errors?.push('VIN not found')
      }

      // Parse Make
      const makeMatch = message.match(/make:?\s*([A-Za-z]+)/i)
      if (makeMatch) {
        vehicle.make = makeMatch[1]
      }

      // Parse Model  
      const modelMatch = message.match(/model:?\s*([A-Za-z0-9\s-]+?)(?:\s|year|$)/i)
      if (modelMatch) {
        vehicle.model = modelMatch[1].trim()
      }

      // Parse Year
      const yearMatch = message.match(/year:?\s*(\d{4})/i)
      if (yearMatch) {
        vehicle.year = parseInt(yearMatch[1])
      }

      // Parse Lot
      const lotMatch = message.match(/lot:?\s*([A-Z0-9]+)/i)
      if (lotMatch) {
        vehicle.lot = lotMatch[1]
      }

      // Parse Price
      const priceMatch = message.match(/price:?\s*\$?([0-9,]+\.?\d*)/i)
      if (priceMatch) {
        const priceStr = priceMatch[1].replace(/,/g, '')
        vehicle.price = parseFloat(priceStr)
      }

      // Parse Auction House
      if (message.toLowerCase().includes('copart')) {
        vehicle.auction = 'COPART'
      } else if (message.toLowerCase().includes('iaa')) {
        vehicle.auction = 'IAA'
      } else if (message.toLowerCase().includes('manheim')) {
        vehicle.auction = 'MANHEIM'
      } else {
        vehicle.auction = 'COPART' // Default
      }

      // Parse US Port
      const portMatches = message.match(/(NY|Georgia|Los Angeles|New Jersey|FL|TX)/gi)
      if (portMatches) {
        const port = portMatches[0].toLowerCase()
        if (port === 'ny') vehicle.usPort = 'NY - New York'
        else if (port === 'georgia') vehicle.usPort = 'GA - Georgia'
        else if (port === 'los angeles') vehicle.usPort = 'Los Angeles'
        else if (port === 'new jersey') vehicle.usPort = 'New Jersey'
        else if (port === 'fl') vehicle.usPort = 'FL - Florida'
        else if (port === 'tx') vehicle.usPort = 'TX - Texas'
      }

      // Parse Insurance
      const insuranceMatch = message.match(/insurance:?\s*(no|1%|2%)/i)
      if (insuranceMatch) {
        vehicle.insurance = insuranceMatch[1].toLowerCase() === 'no' ? 'no' : insuranceMatch[1]
      }

      // Parse Payment Method
      if (message.toLowerCase().includes('vs') || message.toLowerCase().includes('company')) {
        vehicle.paymentMethod = 'COMPANY_PAYS'
      } else {
        vehicle.paymentMethod = 'DIRECT_TO_AUCTION'
      }

      // Validation
      if (!vehicle.vin) {
        vehicle.errors?.push('VIN is required')
      }

      parsed.push(vehicle)
    })

    setParsedVehicles(parsed)
  }

  const updateVehicle = (id: string, field: string, value: any) => {
    setParsedVehicles(prev => prev.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ))
  }

  const removeVehicle = (id: string) => {
    setParsedVehicles(prev => prev.filter(v => v.id !== id))
  }

  const submitAll = async () => {
    setIsSubmitting(true)
    setError(null)

    const validVehicles = parsedVehicles.filter(v => 
      v.vin && !v.errors?.length && v.usPort && v.destinationPort
    )

    if (validVehicles.length === 0) {
      setError('No valid vehicles to submit')
      setIsSubmitting(false)
      return
    }

    try {
      const results = []
      
      for (const vehicle of validVehicles) {
        const submitData = {
          auction: vehicle.auction,
          auctionLot: vehicle.lot,
          vin: vehicle.vin,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          purchasePriceUSD: vehicle.price,
          usPort: vehicle.usPort,
          destinationPort: vehicle.destinationPort,
          insurance: vehicle.insurance,
          paymentMethod: vehicle.paymentMethod,
          isPrivateLocation: false,
          paymentConfirmations: []
        }

        const response = await fetch('/api/intakes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })

        if (response.ok) {
          const result = await response.json()
          results.push(result.intake)
        } else {
          throw new Error(`Failed to create intake for VIN ${vehicle.vin}`)
        }
      }

      // Redirect to intake list
      router.push('/intake?success=' + results.length + '&type=declared')
      
    } catch (error: any) {
      setError(error.message || 'Failed to create intake requests')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h1 className="text-xl font-semibold">📝 Bulk Auction Wins</h1>
            <p className="text-gray-600 text-sm mt-1">
              Paste multiple auction winning messages to bulk declare your wins for admin approval
            </p>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Message Input */}
            <div>
              <label htmlFor="messages" className="block text-sm font-medium text-gray-700 mb-2">
                Paste Your Winning Auction Messages
              </label>
              <textarea
                id="messages"
                value={rawMessages}
                onChange={(e) => setRawMessages(e.target.value)}
                placeholder="Paste your winning auction messages here. Example:
WINNING AUCTION Vin: WDCTG4GB4JJ516956 Make: Mercedes Model: C-Class Year: 2020 Lot: 12345 Price: $18,500
US Port: GA - Georgia Destination: Poti Insurance: 1% Payment: Company Pays

Separate multiple wins with empty lines."
                rows={8}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={parseMessages}
                  disabled={!rawMessages.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Parse Messages
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawMessages('')
                    setParsedVehicles([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Parsed Vehicles */}
            {parsedVehicles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium">Parsed Vehicles ({parsedVehicles.length})</h2>
                  <button
                    onClick={submitAll}
                    disabled={isSubmitting || parsedVehicles.filter(v => v.vin && !v.errors?.length).length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
{isSubmitting ? 'Declaring...' : `🏆 Declare All Wins (${parsedVehicles.filter(v => v.vin && !v.errors?.length).length})`}
                  </button>
                </div>

                <div className="space-y-4">
                  {parsedVehicles.map((vehicle) => (
                    <div key={vehicle.id} className={`border rounded-lg p-4 ${vehicle.errors?.length ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          {vehicle.errors?.length > 0 && (
                            <div className="mb-2 text-sm text-red-600">
                              ⚠️ {vehicle.errors.join(', ')}
                            </div>
                          )}
                          <div className="text-sm text-gray-600 font-mono whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                            {vehicle.rawMessage}
                          </div>
                        </div>
                        <button
                          onClick={() => removeVehicle(vehicle.id)}
                          className="ml-4 text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">VIN *</label>
                          <input
                            type="text"
                            value={vehicle.vin || ''}
                            onChange={(e) => updateVehicle(vehicle.id, 'vin', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Make</label>
                          <input
                            type="text"
                            value={vehicle.make || ''}
                            onChange={(e) => updateVehicle(vehicle.id, 'make', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                          <input
                            type="text"
                            value={vehicle.model || ''}
                            onChange={(e) => updateVehicle(vehicle.id, 'model', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                          <input
                            type="number"
                            value={vehicle.year || ''}
                            onChange={(e) => updateVehicle(vehicle.id, 'year', parseInt(e.target.value) || undefined)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            value={vehicle.price || ''}
                            onChange={(e) => updateVehicle(vehicle.id, 'price', parseFloat(e.target.value) || undefined)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Auction</label>
                          <select
                            value={vehicle.auction || ''}
                            onChange={(e) => updateVehicle(vehicle.id, 'auction', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="COPART">Copart</option>
                            <option value="IAA">IAA</option>
                            <option value="MANHEIM">Manheim</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">US Port *</label>
                          <select
                            value={vehicle.usPort || ''}
                            onChange={(e) => updateVehicle(vehicle.id, 'usPort', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Select port</option>
                            {US_PORTS.map(port => (
                              <option key={port} value={port}>{port}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Destination *</label>
                          <select
                            value={vehicle.destinationPort || ''}
                            onChange={(e) => updateVehicle(vehicle.id, 'destinationPort', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="">Select port</option>
                            {DESTINATION_PORTS.map(port => (
                              <option key={port} value={port}>{port}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Insurance</label>
                          <select
                            value={vehicle.insurance || '1%'}
                            onChange={(e) => updateVehicle(vehicle.id, 'insurance', e.target.value)}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="1%">1%</option>
                            <option value="2%">2%</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Intake List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}