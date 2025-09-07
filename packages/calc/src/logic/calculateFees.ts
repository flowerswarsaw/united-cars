import { ShipperFee, FeeResult } from '../types/pricing'

interface FeeParams {
  shipperId: string
  vehicleTypeId: string
  isHybridElectric?: boolean
  needsTitleChange?: boolean
  shipperFees: ShipperFee[]
}

/**
 * Calculates additional fees (service, hybrid/electric, title change)
 */
export function calculateAdditionalFees({
  shipperId,
  vehicleTypeId,
  isHybridElectric = false,
  needsTitleChange = false,
  shipperFees
}: FeeParams): FeeResult {
  try {
    // Find shipper fee structure
    const shipperFee = shipperFees.find(fee => 
      fee.shipperId === shipperId && fee.active
    )

    if (!shipperFee) {
      return {
        price: 0,
        breakdown: {
          serviceFee: 0,
          hybridElectro: 0,
          titleChange: 0
        },
        errorCode: "SHIPPER_FEES_NOT_FOUND"
      }
    }

    // Calculate individual fees
    const serviceFee = shipperFee.fees.serviceFee || 0
    const hybridElectroFee = isHybridElectric ? (shipperFee.fees.hybridElectro || 0) : 0
    const titleChangeFee = needsTitleChange ? (shipperFee.fees.titleChange || 0) : 0

    const totalFees = serviceFee + hybridElectroFee + titleChangeFee

    return {
      price: totalFees,
      breakdown: {
        serviceFee,
        hybridElectro: hybridElectroFee,
        titleChange: titleChangeFee
      }
    }

  } catch (error) {
    console.error("Error calculating additional fees:", error)
    return {
      price: 0,
      breakdown: {
        serviceFee: 0,
        hybridElectro: 0,
        titleChange: 0
      },
      errorCode: "FEE_CALCULATION_ERROR"
    }
  }
}