// Utility functions to read pricing matrices from localStorage
// This connects the admin pricing panels with the calculator

export interface TowingMatrix {
  id: string
  auctionHouse: 'COPART' | 'IAA' | 'MANHEIM' | 'ACV' | 'ADESA'
  auctionLocation: string
  portPricing: {
    [portName: string]: {
      sedan: number
      smallMediumSUV: number
      bigSUV: number
      pickup: number
      van: number
      motorcycle: number
    }
  }
  preferredPort?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ShippingMatrix {
  id: string
  shippingPort: string
  destinationPricing: {
    [destinationPort: string]: {
      vehicleTypePricing: {
        sedan: number
        smallMediumSUV: number
        bigSUV: number
        pickup: number
        van: number
        motorcycle: number
      }
      consolidationPricing: {
        quarterContainer: number
        thirdContainer: number
        halfContainer: number
        fullContainer: number
      }
      country: string
    }
  }
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ExpeditionMatrix {
  id: string
  destinationPort: string
  country: string
  region: string
  consolidationPricing: {
    quarterContainer: number
    thirdContainer: number
    halfContainer: number
  }
  vatRate: number // Country-specific VAT rate
  taxRatesByVehicle: {
    car: number // Regular cars
    classicCar: number // Classic cars
    truck: number // Trucks/Vans
    motorcycle: number // Motorcycles
    jetSki: number // Jet Ski/Boats
  }
  thc?: number // Terminal Handling Charge (optional)
  freeParkingDays: number | 'unlimited'
  parkingPricePerDay: number
  t1Declaration: number
  currency: 'USD' | 'EUR' | 'GBP'
  active: boolean
  createdAt: string
  updatedAt: string
}

// Helper function to normalize location names for matching
const normalizeLocationName = (location: string): string => {
  return location.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Helper function to normalize port names for matching
const normalizePortName = (port: string): string => {
  return port.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Helper function to map vehicle types between systems
const mapVehicleType = (
  calculatorType: string, 
  targetSystem: 'towing' | 'shipping' | 'expedition'
): string | null => {
  const typeMapping: { [key: string]: { [system: string]: string } } = {
    // Calculator types -> Matrix types
    'sedan': { towing: 'sedan', shipping: 'sedan', expedition: 'car' },
    'smallMediumSUV': { towing: 'smallMediumSUV', shipping: 'smallMediumSUV', expedition: 'car' },
    'bigSUV': { towing: 'bigSUV', shipping: 'bigSUV', expedition: 'car' },
    'pickup': { towing: 'pickup', shipping: 'pickup', expedition: 'truck' },
    'van': { towing: 'van', shipping: 'van', expedition: 'truck' },
    'motorcycle': { towing: 'motorcycle', shipping: 'motorcycle', expedition: 'motorcycle' },
    // Additional shipping calculator types
    'SEDAN': { towing: 'sedan', shipping: 'sedan', expedition: 'car' },
    'SUV': { towing: 'smallMediumSUV', shipping: 'smallMediumSUV', expedition: 'car' },
    'BIGSUV': { towing: 'bigSUV', shipping: 'bigSUV', expedition: 'car' },
    'PICKUP': { towing: 'pickup', shipping: 'pickup', expedition: 'truck' },
    'VAN': { towing: 'van', shipping: 'van', expedition: 'truck' },
    // Expedition/Customs calculator types (direct mapping)
    'car': { towing: 'sedan', shipping: 'sedan', expedition: 'car' },
    'classicCar': { towing: 'sedan', shipping: 'sedan', expedition: 'classicCar' },
    'truck': { towing: 'pickup', shipping: 'pickup', expedition: 'truck' },
    'jetSki': { towing: 'motorcycle', shipping: 'motorcycle', expedition: 'jetSki' },
  }
  
  return typeMapping[calculatorType]?.[targetSystem] || null
}

// Load towing matrices from localStorage
export const getTowingMatrices = (): TowingMatrix[] => {
  try {
    const data = localStorage.getItem('towing-matrices')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading towing matrices:', error)
    return []
  }
}

// Load shipping matrices from localStorage
export const getShippingMatrices = (): ShippingMatrix[] => {
  try {
    const data = localStorage.getItem('shipping-matrices')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading shipping matrices:', error)
    return []
  }
}

// Load expedition matrices from localStorage
export const getExpeditionMatrices = (): ExpeditionMatrix[] => {
  try {
    const data = localStorage.getItem('expedition-matrices')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error loading expedition matrices:', error)
    return []
  }
}

// Find towing price for specific auction location -> shipping port
export const getTowingPrice = (
  auctionHouse: string,
  auctionLocation: string, 
  shippingPort: string,
  vehicleType: string
): number | null => {
  const matrices = getTowingMatrices().filter(m => m.active)
  
  // Normalize search terms
  const normalizedAuctionHouse = auctionHouse.toUpperCase()
  const normalizedLocation = normalizeLocationName(auctionLocation)
  const normalizedPort = normalizePortName(shippingPort)
  const mappedVehicleType = mapVehicleType(vehicleType, 'towing')
  
  if (!mappedVehicleType) return null
  
  for (const matrix of matrices) {
    // Check if auction house matches
    if (matrix.auctionHouse !== normalizedAuctionHouse) continue
    
    // Check if location matches (normalize both sides)
    const matrixLocation = normalizeLocationName(matrix.auctionLocation)
    if (matrixLocation !== normalizedLocation) continue
    
    // Check if port exists in this matrix
    for (const [portName, pricing] of Object.entries(matrix.portPricing)) {
      const normalizedMatrixPort = normalizePortName(portName)
      if (normalizedMatrixPort === normalizedPort) {
        return pricing[mappedVehicleType as keyof typeof pricing] || null
      }
    }
  }
  
  return null
}

// Find shipping price for specific shipping port -> destination
export const getShippingPrice = (
  shippingPort: string,
  destination: string,
  vehicleType: string
): { vehiclePrice: number; consolidationPricing: any; country: string } | null => {
  const matrices = getShippingMatrices().filter(m => m.active)
  
  // Normalize search terms
  const normalizedShippingPort = normalizePortName(shippingPort)
  const normalizedDestination = normalizeLocationName(destination)
  const mappedVehicleType = mapVehicleType(vehicleType, 'shipping')
  
  if (!mappedVehicleType) return null
  
  for (const matrix of matrices) {
    // Check if shipping port matches
    const matrixPort = normalizePortName(matrix.shippingPort)
    if (matrixPort !== normalizedShippingPort) continue
    
    // Check if destination exists in this matrix
    for (const [destPort, pricing] of Object.entries(matrix.destinationPricing)) {
      const normalizedMatrixDest = normalizeLocationName(destPort)
      if (normalizedMatrixDest === normalizedDestination) {
        const vehiclePrice = pricing.vehicleTypePricing[mappedVehicleType as keyof typeof pricing.vehicleTypePricing]
        return {
          vehiclePrice: vehiclePrice || 0,
          consolidationPricing: pricing.consolidationPricing,
          country: pricing.country
        }
      }
    }
  }
  
  return null
}

// Find expedition/customs rates for specific destination
export const getExpeditionRates = (
  destinationPort: string,
  vehicleType: string
): {
  vatRate: number;
  taxRate: number;
  consolidationPricing: any;
  additionalCharges: {
    thc?: number;
    t1Declaration: number;
    freeParkingDays: number | 'unlimited';
    parkingPricePerDay: number;
  };
  currency: string;
} | null => {
  const matrices = getExpeditionMatrices().filter(m => m.active)
  
  // Normalize search terms
  const normalizedDestination = normalizeLocationName(destinationPort)
  const mappedVehicleType = mapVehicleType(vehicleType, 'expedition')
  
  if (!mappedVehicleType) return null
  
  for (const matrix of matrices) {
    // Check if destination port matches
    const matrixPort = normalizeLocationName(matrix.destinationPort)
    
    if (matrixPort === normalizedDestination) {
      return {
        vatRate: matrix.vatRate,
        taxRate: matrix.taxRatesByVehicle[mappedVehicleType as keyof typeof matrix.taxRatesByVehicle] || 0,
        consolidationPricing: matrix.consolidationPricing,
        additionalCharges: {
          thc: matrix.thc,
          t1Declaration: matrix.t1Declaration,
          freeParkingDays: matrix.freeParkingDays,
          parkingPricePerDay: matrix.parkingPricePerDay
        },
        currency: matrix.currency
      }
    }
  }
  
  return null
}

// Get available destinations for dropdowns
export const getAvailableDestinations = (): {
  towingRoutes: Array<{ auctionHouse: string; auctionLocation: string; ports: string[] }>;
  shippingRoutes: Array<{ shippingPort: string; destinations: string[] }>;
  expeditionDestinations: Array<{ destinationPort: string; country: string; region: string }>;
} => {
  const towingMatrices = getTowingMatrices().filter(m => m.active)
  const shippingMatrices = getShippingMatrices().filter(m => m.active)
  const expeditionMatrices = getExpeditionMatrices().filter(m => m.active)
  
  
  return {
    towingRoutes: towingMatrices.map(m => ({
      auctionHouse: m.auctionHouse,
      auctionLocation: m.auctionLocation,
      ports: Object.keys(m.portPricing)
    })),
    shippingRoutes: shippingMatrices.map(m => ({
      shippingPort: m.shippingPort,
      destinations: Object.keys(m.destinationPricing)
    })),
    expeditionDestinations: expeditionMatrices.map(m => ({
      destinationPort: m.destinationPort,
      country: m.country,
      region: m.region
    }))
  }
}