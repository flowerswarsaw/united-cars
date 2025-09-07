'use client'

import React from 'react'
import { CheckCircle, Circle, Clock, MapPin, Truck, Ship, Anchor, Package } from 'lucide-react'

interface StatusUpdate {
  id: string
  status: string
  stage: string
  updatedAt: Date
  notes?: string | null
  location?: string | null
  updatedBy?: string | null
}

interface EstimatedDates {
  pickupDate?: Date | null
  portArrivalDate?: Date | null
  vesselDepartureDate?: Date | null
  destinationArrivalDate?: Date | null
  deliveryDate?: Date | null
}

interface VehicleStatusTrackerProps {
  currentStatus: string
  currentStage: string
  statusHistory?: StatusUpdate[]
  estimatedDates?: EstimatedDates
}

const statusConfig = {
  SOURCING: { 
    label: 'Sourcing', 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50', 
    icon: Circle,
    stages: ['auction_bidding', 'auction_won', 'payment_processing', 'documentation_pending']
  },
  PICKUP: { 
    label: 'Pickup', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50', 
    icon: Truck,
    stages: ['pickup_scheduled', 'pickup_confirmed', 'picked_up', 'damage_inspection']
  },
  GROUND_TRANSPORT: { 
    label: 'Ground Transport', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50', 
    icon: Truck,
    stages: ['carrier_assigned', 'in_transit_to_port', 'arrived_at_warehouse']
  },
  PORT_PROCESSING: { 
    label: 'Port Processing', 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50', 
    icon: Package,
    stages: ['warehouse_inspection', 'documentation_complete', 'export_clearance', 'loading_scheduled']
  },
  OCEAN_SHIPPING: { 
    label: 'Ocean Shipping', 
    color: 'text-cyan-600', 
    bgColor: 'bg-cyan-50', 
    icon: Ship,
    stages: ['loaded_on_vessel', 'vessel_departed', 'in_transit_ocean', 'vessel_arriving']
  },
  DESTINATION_PORT: { 
    label: 'Destination Port', 
    color: 'text-teal-600', 
    bgColor: 'bg-teal-50', 
    icon: Anchor,
    stages: ['vessel_arrived', 'customs_clearance', 'container_unloading', 'ready_for_pickup']
  },
  DELIVERED: { 
    label: 'Delivered', 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    icon: CheckCircle,
    stages: ['pickup_scheduled_final', 'in_final_delivery', 'delivered_to_customer']
  }
}

const formatStageLabel = (stage: string): string => {
  return stage
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function VehicleStatusTracker({ 
  currentStatus, 
  currentStage, 
  statusHistory = [],
  estimatedDates = {}
}: VehicleStatusTrackerProps) {
  const allStatuses = Object.keys(statusConfig)
  const currentStatusIndex = allStatuses.indexOf(currentStatus)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Status Update Info</h3>
      
      {/* Current Status Highlight */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {React.createElement(statusConfig[currentStatus as keyof typeof statusConfig]?.icon || Circle, {
              className: `h-6 w-6 ${statusConfig[currentStatus as keyof typeof statusConfig]?.color}`
            })}
            <div>
              <h4 className="font-medium text-gray-900">
                {statusConfig[currentStatus as keyof typeof statusConfig]?.label}
              </h4>
              <p className="text-sm text-gray-600">{formatStageLabel(currentStage)}</p>
            </div>
          </div>
          <span className="text-sm font-medium text-blue-700">Current</span>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="space-y-4">
        {allStatuses.map((status, statusIndex) => {
          const config = statusConfig[status as keyof typeof statusConfig]
          const isCompleted = statusIndex < currentStatusIndex
          const isCurrent = statusIndex === currentStatusIndex
          const isPending = statusIndex > currentStatusIndex
          
          // Get history for this status
          const statusHistory_ = statusHistory.filter(h => h.status === status)
          
          return (
            <div key={status} className="relative">
              {/* Status Header */}
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                isCurrent ? config.bgColor : 'bg-gray-50'
              }`}>
                {React.createElement(config.icon, {
                  className: `h-5 w-5 ${
                    isCompleted ? 'text-green-600' : 
                    isCurrent ? config.color : 
                    'text-gray-400'
                  }`
                })}
                <span className={`font-medium ${
                  isCompleted ? 'text-green-700' :
                  isCurrent ? config.color.replace('600', '700') :
                  'text-gray-500'
                }`}>
                  {config.label}
                </span>
                {isCompleted && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {isCurrent && (
                  <Clock className="h-4 w-4 text-blue-600" />
                )}
              </div>

              {/* Stage Details */}
              {(isCompleted || isCurrent) && (
                <div className="ml-8 mt-2 space-y-2">
                  {statusHistory_.length > 0 ? (
                    statusHistory_.map((update) => (
                      <div key={update.id} className="flex items-center justify-between py-2 px-3 bg-white rounded border border-gray-200">
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {formatStageLabel(update.stage)}
                          </div>
                          {update.location && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span>{update.location}</span>
                            </div>
                          )}
                          {update.notes && (
                            <div className="text-xs text-gray-600 mt-1">{update.notes}</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(update.updatedAt)}
                        </div>
                      </div>
                    ))
                  ) : isCurrent ? (
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                      <div className="font-medium text-sm text-gray-700">
                        {formatStageLabel(currentStage)}
                      </div>
                      <div className="text-xs text-gray-500">In Progress</div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Estimated Dates */}
              {isPending && (
                <div className="ml-8 mt-2">
                  <div className="py-2 px-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Estimated</div>
                    <div className="text-xs text-gray-500">
                      {status === 'PICKUP' && estimatedDates.pickupDate && formatDate(estimatedDates.pickupDate)}
                      {status === 'PORT_PROCESSING' && estimatedDates.portArrivalDate && formatDate(estimatedDates.portArrivalDate)}
                      {status === 'OCEAN_SHIPPING' && estimatedDates.vesselDepartureDate && formatDate(estimatedDates.vesselDepartureDate)}
                      {status === 'DESTINATION_PORT' && estimatedDates.destinationArrivalDate && formatDate(estimatedDates.destinationArrivalDate)}
                      {status === 'DELIVERED' && estimatedDates.deliveryDate && formatDate(estimatedDates.deliveryDate)}
                      {!estimatedDates.pickupDate && !estimatedDates.portArrivalDate && !estimatedDates.vesselDepartureDate && !estimatedDates.destinationArrivalDate && !estimatedDates.deliveryDate && 'TBA'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}