'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'

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

export default function NewIntakePage() {
  const router = useRouter()
  const { user } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSettings, setUserSettings] = useState({
    defaultInsurance: '1%',
    defaultUsPort: null,
    defaultDestinationPort: null
  })
  const [formData, setFormData] = useState({
    auction: '',
    auctionLot: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    purchasePriceUSD: '',
    usPort: '',
    destinationPort: 'Rotterdam',
    insurance: '1%',
    paymentMethod: 'DIRECT_TO_AUCTION',
    isPrivateLocation: false,
    pickupAddress: '',
    contactPerson: '',
    contactPhone: '',
    insuranceValue: '',
    notes: ''
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
        
        // Apply user defaults to form
        setFormData(prev => ({
          ...prev,
          insurance: data.settings.defaultInsurance || '1%',
          usPort: data.settings.defaultUsPort || '',
          destinationPort: data.settings.defaultDestinationPort || 'Rotterdam'
        }))
      }
    } catch (error) {
      console.error('Failed to load user settings:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare data for submission
      const submitData: any = {
        auction: formData.auction,
        vin: formData.vin,
        usPort: formData.usPort,
        destinationPort: formData.destinationPort,
        insurance: formData.insurance,
        paymentMethod: formData.paymentMethod,
        isPrivateLocation: formData.isPrivateLocation,
        paymentConfirmations: [] // Will be handled in file upload step
      }

      if (formData.auctionLot) submitData.auctionLot = formData.auctionLot
      if (formData.make) submitData.make = formData.make
      if (formData.model) submitData.model = formData.model
      if (formData.year) submitData.year = parseInt(formData.year)
      if (formData.purchasePriceUSD) submitData.purchasePriceUSD = parseFloat(formData.purchasePriceUSD)
      if (formData.notes) submitData.notes = formData.notes

      // Private location fields
      if (formData.isPrivateLocation) {
        if (formData.pickupAddress) submitData.pickupAddress = formData.pickupAddress
        if (formData.contactPerson) submitData.contactPerson = formData.contactPerson
        if (formData.contactPhone) submitData.contactPhone = formData.contactPhone
        if (formData.insuranceValue) submitData.insuranceValue = parseFloat(formData.insuranceValue)
      }

      const response = await fetch('/api/intakes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create intake')
      }

      // Redirect to intake detail page for file upload  
      router.push(`/intake/${result.intake.id}?success=declared`)
    } catch (error: any) {
      console.error('Submit error:', error)
      setError(error.message || 'Failed to create intake request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h1 className="text-xl font-semibold">🎯 Declare Winning Auction</h1>
            <p className="text-gray-600 text-sm mt-1">
              Submit your auction win details for admin approval. Once approved, the vehicle will be added to your fleet and processed for shipping.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Auction Selection */}
            <div>
              <label htmlFor="auction" className="block text-sm font-medium text-gray-700 mb-1">
                Auction House *
              </label>
              <select
                id="auction"
                value={formData.auction}
                onChange={(e) => {
                  handleInputChange('auction', e.target.value)
                  // Auto-set private location flag
                  if (e.target.value === 'PRIVATE') {
                    setFormData(prev => ({ ...prev, auction: e.target.value, isPrivateLocation: true }))
                  } else {
                    setFormData(prev => ({ ...prev, auction: e.target.value, isPrivateLocation: false }))
                  }
                }}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select auction house</option>
                <option value="COPART">Copart</option>
                <option value="IAA">IAA</option>
                <option value="MANHEIM">Manheim</option>
                <option value="PRIVATE">Private Location</option>
              </select>
            </div>

            {/* Auction Lot */}
            <div>
              <label htmlFor="auctionLot" className="block text-sm font-medium text-gray-700 mb-1">
                Auction Lot Number
              </label>
              <input
                id="auctionLot"
                type="text"
                value={formData.auctionLot}
                onChange={(e) => handleInputChange('auctionLot', e.target.value)}
                placeholder="e.g., 12345678"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* VIN */}
            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
                VIN *
              </label>
              <input
                id="vin"
                type="text"
                value={formData.vin}
                onChange={(e) => handleInputChange('vin', e.target.value)}
                placeholder="17-character Vehicle Identification Number"
                required
                minLength={11}
                maxLength={20}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                  Make
                </label>
                <input
                  id="make"
                  type="text"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  placeholder="e.g., Honda"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  id="model"
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="e.g., Civic"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="purchasePriceUSD" className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price (USD)
                </label>
                <input
                  id="purchasePriceUSD"
                  type="number"
                  step="0.01"
                  value={formData.purchasePriceUSD}
                  onChange={(e) => handleInputChange('purchasePriceUSD', e.target.value)}
                  placeholder="e.g., 15000.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Shipping Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="usPort" className="block text-sm font-medium text-gray-700 mb-1">
                    US Port (Departure) *
                  </label>
                  <select
                    id="usPort"
                    value={formData.usPort}
                    onChange={(e) => handleInputChange('usPort', e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select US port</option>
                    {US_PORTS.map(port => (
                      <option key={port} value={port}>{port}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="destinationPort" className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Port *
                  </label>
                  <select
                    id="destinationPort"
                    value={formData.destinationPort}
                    onChange={(e) => handleInputChange('destinationPort', e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select destination port</option>
                    {DESTINATION_PORTS.map(port => (
                      <option key={port} value={port}>{port}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance
                </label>
                <select
                  id="insurance"
                  value={formData.insurance}
                  onChange={(e) => handleInputChange('insurance', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1%">1%</option>
                  <option value="2%">2%</option>
                  <option value="no">No Insurance</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Default can be changed in settings</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DIRECT_TO_AUCTION">Paid directly to auction</option>
                  <option value="COMPANY_PAYS">Company will pay</option>
                </select>
              </div>
              
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  📄 You'll be able to upload payment confirmation documents after creating this intake request.
                </p>
              </div>
            </div>

            {/* Private Location Fields */}
            {formData.isPrivateLocation && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Private Location Details</h3>
                
                <div>
                  <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Address *
                  </label>
                  <textarea
                    id="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                    placeholder="Full address where the vehicle is located"
                    required={formData.isPrivateLocation}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person *
                    </label>
                    <input
                      id="contactPerson"
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="Name of contact person"
                      required={formData.isPrivateLocation}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="Phone number"
                      required={formData.isPrivateLocation}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="insuranceValue" className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Value for Insurance (USD)
                  </label>
                  <input
                    id="insuranceValue"
                    type="number"
                    step="0.01"
                    value={formData.insuranceValue}
                    onChange={(e) => handleInputChange('insuranceValue', e.target.value)}
                    placeholder="Vehicle value for insurance calculation"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about the vehicle or special instructions"
                rows={3}
                maxLength={2000}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  !formData.auction || 
                  !formData.vin || 
                  !formData.usPort ||
                  !formData.destinationPort ||
                  (formData.isPrivateLocation && (!formData.pickupAddress || !formData.contactPerson || !formData.contactPhone))
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
{isSubmitting ? 'Submitting...' : '🏆 Submit Auction Win'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}