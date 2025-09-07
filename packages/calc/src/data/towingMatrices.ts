import { TowingRule, VehicleTypeData } from '../towing'

/**
 * Vehicle type definitions with multipliers and categories for towing calculations
 */
export const vehicleTypeData: VehicleTypeData[] = [
  { key: 'SEDAN', multiplier: 1.0, category: 'regular' },
  { key: 'SUV', multiplier: 1.2, category: 'regular' },
  { key: 'BIGSUV', multiplier: 1.5, category: 'oversize' },
  { key: 'VAN', multiplier: 1.3, category: 'regular' },
  { key: 'PICKUP', multiplier: 1.15, category: 'regular' },
  { key: 'MOTORCYCLE', multiplier: 0.7, category: 'small' },
  { key: 'ATV', multiplier: 0.8, category: 'small' },
  { key: 'BOAT', multiplier: 2.0, category: 'specialty' },
  { key: 'RV', multiplier: 2.5, category: 'specialty' }
]

/**
 * Comprehensive towing rules matrix covering major US auction locations and ports
 * Covers major auction houses: Copart, IAA, Manheim across key states
 * Destination ports: NY/NJ, GA (Savannah), CA (Los Angeles), TX (Houston), FL (Jacksonville)
 */
export const towingRulesMatrix: TowingRule[] = [
  // ========== COPART LOCATIONS ==========
  
  // COPART - California Locations to LA Port
  {
    id: 'tow-copart-ca-fresno-lax',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-fresno-ca',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'multiplier',
    basePrice: 280
  },
  {
    id: 'tow-copart-ca-vallejo-lax',
    shipperId: 'united-logistics', 
    auctionLocationId: 'copart-vallejo-ca',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'multiplier',
    basePrice: 420
  },
  {
    id: 'tow-copart-ca-rancho-lax',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-rancho-cucamonga-ca',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'flat',
    basePrice: 180
  },

  // COPART - Texas Locations to Houston Port  
  {
    id: 'tow-copart-tx-houston-hou',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-houston-tx',
    deliveryPortId: 'port-houston',
    ruleType: 'flat',
    basePrice: 150
  },
  {
    id: 'tow-copart-tx-dallas-hou',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-dallas-tx',
    deliveryPortId: 'port-houston',
    ruleType: 'multiplier',
    basePrice: 320
  },
  {
    id: 'tow-copart-tx-austin-hou',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-austin-tx', 
    deliveryPortId: 'port-houston',
    ruleType: 'multiplier',
    basePrice: 190
  },

  // COPART - Florida Locations to Jacksonville Port
  {
    id: 'tow-copart-fl-orlando-jax',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-orlando-fl',
    deliveryPortId: 'port-jacksonville',
    ruleType: 'multiplier', 
    basePrice: 220
  },
  {
    id: 'tow-copart-fl-miami-jax',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-miami-fl',
    deliveryPortId: 'port-jacksonville',
    ruleType: 'multiplier',
    basePrice: 380
  },

  // COPART - Georgia Locations to Savannah Port
  {
    id: 'tow-copart-ga-atlanta-sav',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-atlanta-ga',
    deliveryPortId: 'port-savannah', 
    ruleType: 'multiplier',
    basePrice: 320
  },
  {
    id: 'tow-copart-ga-savannah-sav',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-savannah-ga',
    deliveryPortId: 'port-savannah',
    ruleType: 'flat',
    basePrice: 120
  },

  // COPART - Northeast Locations to NY/NJ Port
  {
    id: 'tow-copart-nj-trenton-ny',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-trenton-nj',
    deliveryPortId: 'port-ny-nj',
    ruleType: 'flat',
    basePrice: 160
  },
  {
    id: 'tow-copart-pa-philadelphia-ny',
    shipperId: 'united-logistics', 
    auctionLocationId: 'copart-philadelphia-pa',
    deliveryPortId: 'port-ny-nj',
    ruleType: 'multiplier',
    basePrice: 180
  },
  {
    id: 'tow-copart-ny-syracuse-ny',
    shipperId: 'united-logistics',
    auctionLocationId: 'copart-syracuse-ny', 
    deliveryPortId: 'port-ny-nj',
    ruleType: 'multiplier',
    basePrice: 280
  },

  // ========== IAA LOCATIONS ==========

  // IAA - California Locations to LA Port
  {
    id: 'tow-iaa-ca-losangeles-lax',
    shipperId: 'united-logistics',
    auctionLocationId: 'iaa-los-angeles-ca',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'flat',
    basePrice: 140
  },
  {
    id: 'tow-iaa-ca-fresno-lax', 
    shipperId: 'united-logistics',
    auctionLocationId: 'iaa-fresno-ca',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'multiplier',
    basePrice: 290
  },

  // IAA - Texas Locations to Houston Port
  {
    id: 'tow-iaa-tx-houston-hou',
    shipperId: 'united-logistics', 
    auctionLocationId: 'iaa-houston-tx',
    deliveryPortId: 'port-houston',
    ruleType: 'flat',
    basePrice: 140
  },
  {
    id: 'tow-iaa-tx-dallas-hou',
    shipperId: 'united-logistics',
    auctionLocationId: 'iaa-dallas-tx',
    deliveryPortId: 'port-houston',
    ruleType: 'multiplier',
    basePrice: 310
  },

  // IAA - Florida Locations  
  {
    id: 'tow-iaa-fl-orlando-jax',
    shipperId: 'united-logistics',
    auctionLocationId: 'iaa-orlando-fl',
    deliveryPortId: 'port-jacksonville',
    ruleType: 'multiplier',
    basePrice: 210
  },

  // ========== MANHEIM LOCATIONS ==========

  // MANHEIM - Pennsylvania to NY/NJ
  {
    id: 'tow-manheim-pa-manheim-ny',
    shipperId: 'united-logistics',
    auctionLocationId: 'manheim-pennsylvania-pa',
    deliveryPortId: 'port-ny-nj', 
    ruleType: 'multiplier',
    basePrice: 220
  },

  // MANHEIM - California to LA
  {
    id: 'tow-manheim-ca-riverside-lax',
    shipperId: 'united-logistics',
    auctionLocationId: 'manheim-riverside-ca',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'multiplier',
    basePrice: 160
  },

  // ========== CROSS-COUNTRY ROUTES (Higher Distance) ==========

  // California to East Coast Ports (Long Distance)
  {
    id: 'tow-copart-ca-fresno-ny',
    shipperId: 'national-transport',
    auctionLocationId: 'copart-fresno-ca',
    deliveryPortId: 'port-ny-nj',
    ruleType: 'category',
    basePrice: 0,
    perTypeData: {
      'regular': 1250,
      'oversize': 1680,
      'small': 980,
      'specialty': 2100
    }
  },
  {
    id: 'tow-copart-ca-rancho-sav',
    shipperId: 'national-transport',
    auctionLocationId: 'copart-rancho-cucamonga-ca', 
    deliveryPortId: 'port-savannah',
    ruleType: 'category',
    basePrice: 0,
    perTypeData: {
      'regular': 1380,
      'oversize': 1850,
      'small': 1100,
      'specialty': 2300
    }
  },

  // East Coast to West Coast (Reverse Long Distance)
  {
    id: 'tow-copart-nj-trenton-lax',
    shipperId: 'national-transport',
    auctionLocationId: 'copart-trenton-nj',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'category',
    basePrice: 0,
    perTypeData: {
      'regular': 1420,
      'oversize': 1920,
      'small': 1150,
      'specialty': 2400
    }
  },

  // ========== SPECIALTY/PREMIUM SHIPPER ROUTES ==========

  // Premium Express Service (Higher Rates, Faster)
  {
    id: 'tow-premium-copart-ca-vallejo-lax',
    shipperId: 'premium-express',
    auctionLocationId: 'copart-vallejo-ca',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'multiplier',
    basePrice: 580  // ~38% premium
  },
  {
    id: 'tow-premium-copart-tx-dallas-hou',
    shipperId: 'premium-express', 
    auctionLocationId: 'copart-dallas-tx',
    deliveryPortId: 'port-houston',
    ruleType: 'multiplier',
    basePrice: 440  // ~38% premium
  },

  // Economy Service (Lower Rates, Longer Transit)
  {
    id: 'tow-economy-iaa-ca-fresno-lax',
    shipperId: 'economy-transport',
    auctionLocationId: 'iaa-fresno-ca',
    deliveryPortId: 'port-los-angeles',
    ruleType: 'multiplier',
    basePrice: 220  // ~24% discount
  },
  {
    id: 'tow-economy-copart-fl-orlando-jax',
    shipperId: 'economy-transport',
    auctionLocationId: 'copart-orlando-fl', 
    deliveryPortId: 'port-jacksonville',
    ruleType: 'multiplier',
    basePrice: 180  // ~18% discount
  }
]