'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IntakeCreateInput } from '@united-cars/core'

export default function NewIntakePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    auction: '',
    auctionLot: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    purchasePriceUSD: '',
    destinationPort: 'Rotterdam',
    notes: ''
  })

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
        destinationPort: formData.destinationPort
      }

      if (formData.auctionLot) submitData.auctionLot = formData.auctionLot
      if (formData.make) submitData.make = formData.make
      if (formData.model) submitData.model = formData.model
      if (formData.year) submitData.year = parseInt(formData.year)
      if (formData.purchasePriceUSD) submitData.purchasePriceUSD = parseFloat(formData.purchasePriceUSD)
      if (formData.notes) submitData.notes = formData.notes

      // Validate with Zod
      IntakeCreateInput.parse(submitData)

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
      router.push(`/intake/${result.intake.id}`)
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
            <h1 className="text-xl font-semibold">New Vehicle Intake Request</h1>
            <p className="text-gray-600 text-sm mt-1">
              Submit details for a vehicle you've won at auction for pickup and shipping
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
                onChange={(e) => handleInputChange('auction', e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select auction house</option>
                <option value="COPART">Copart</option>
                <option value="IAA">IAA</option>
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

            {/* Destination Port */}
            <div>
              <label htmlFor="destinationPort" className="block text-sm font-medium text-gray-700 mb-1">
                Destination Port *
              </label>
              <input
                id="destinationPort"
                type="text"
                value={formData.destinationPort}
                onChange={(e) => handleInputChange('destinationPort', e.target.value)}
                placeholder="e.g., Rotterdam"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

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
                disabled={isSubmitting || !formData.auction || !formData.vin || !formData.destinationPort}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Intake Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}