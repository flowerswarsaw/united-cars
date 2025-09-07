import { ShippingRule, GeneralFee } from '../shipping'

/**
 * General shipping fees applicable across carriers and routes
 */
export const generalShippingFees: GeneralFee[] = [
  // Universal Fees (All Shippers)
  { key: 'fuel_surcharge', value: 85, currency: 'USD' },
  { key: 'port_handling', value: 120, currency: 'USD' },
  { key: 'documentation', value: 45, currency: 'USD' },
  { key: 'security_fee', value: 25, currency: 'USD' },
  { key: 'terminal_handling', value: 95, currency: 'USD' },
  
  // Premium Shipper Specific
  { key: 'express_processing', value: 75, currency: 'USD', shipperId: 'premium-ocean' },
  { key: 'priority_loading', value: 150, currency: 'USD', shipperId: 'premium-ocean' },
  
  // Economy Shipper Specific  
  { key: 'consolidation_fee', value: 35, currency: 'USD', shipperId: 'economy-ocean' },
  { key: 'extended_transit_insurance', value: 25, currency: 'USD', shipperId: 'economy-ocean' },
  
  // Specialty Carriers
  { key: 'enclosed_transport_fee', value: 200, currency: 'USD', shipperId: 'specialty-carriers' },
  { key: 'white_glove_service', value: 350, currency: 'USD', shipperId: 'specialty-carriers' }
]

/**
 * Comprehensive shipping rules matrix covering major global routes
 * US Exit Ports: Los Angeles, NY/NJ, Savannah, Houston, Jacksonville
 * Major Destination Countries/Ports: UAE, Germany, UK, Japan, Australia, Ghana, Nigeria
 */
export const shippingRulesMatrix: ShippingRule[] = [
  // ========== US WEST COAST (LOS ANGELES) TO MIDDLE EAST ==========
  
  // Los Angeles to UAE (Dubai/Jebel Ali)
  {
    id: 'ship-lax-dubai-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'UAE',
    destinationPort: 'jebel-ali',
    pricingData: {
      baseFreight: 1450,
      currency: 'USD',
      surcharges: [
        { key: 'gulf_surcharge', amount: 180, description: 'Persian Gulf surcharge' },
        { key: 'peak_season', amount: 120, description: 'Peak season surcharge (Nov-Feb)', condition: 'seasonal' },
        { key: 'oversize_gulf', amount: 300, description: 'Oversize vehicle - Gulf route', condition: 'oversize' }
      ]
    }
  },
  {
    id: 'ship-lax-dubai-premium',
    shipperId: 'premium-ocean',
    exitPortId: 'port-los-angeles', 
    destinationCountry: 'UAE',
    destinationPort: 'jebel-ali',
    pricingData: {
      baseFreight: 1680,
      currency: 'USD',
      surcharges: [
        { key: 'gulf_surcharge', amount: 180, description: 'Persian Gulf surcharge' },
        { key: 'fast_transit', amount: 200, description: 'Express 14-day transit' },
        { key: 'priority_discharge', amount: 150, description: 'Priority port discharge' }
      ]
    }
  },

  // Los Angeles to UAE (Sharjah) 
  {
    id: 'ship-lax-sharjah-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'UAE',
    destinationPort: 'sharjah',
    pricingData: {
      baseFreight: 1520,
      currency: 'USD',
      surcharges: [
        { key: 'gulf_surcharge', amount: 180, description: 'Persian Gulf surcharge' },
        { key: 'secondary_port', amount: 95, description: 'Secondary port handling' }
      ]
    }
  },

  // ========== US WEST COAST TO EUROPE ==========

  // Los Angeles to Germany (Hamburg)
  {
    id: 'ship-lax-hamburg-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'Germany', 
    destinationPort: 'hamburg',
    pricingData: {
      baseFreight: 1850,
      currency: 'USD',
      surcharges: [
        { key: 'panama_canal', amount: 240, description: 'Panama Canal transit fee' },
        { key: 'eu_compliance', amount: 85, description: 'EU regulatory compliance' },
        { key: 'winter_surcharge', amount: 150, description: 'Winter weather surcharge (Dec-Mar)', condition: 'seasonal' }
      ]
    }
  },
  {
    id: 'ship-lax-bremerhaven-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'Germany',
    destinationPort: 'bremerhaven', 
    pricingData: {
      baseFreight: 1920,
      currency: 'USD',
      surcharges: [
        { key: 'panama_canal', amount: 240, description: 'Panama Canal transit fee' },
        { key: 'eu_compliance', amount: 85, description: 'EU regulatory compliance' }
      ]
    }
  },

  // Los Angeles to UK (Southampton)
  {
    id: 'ship-lax-southampton-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'United Kingdom',
    destinationPort: 'southampton',
    pricingData: {
      baseFreight: 1780,
      currency: 'USD', 
      surcharges: [
        { key: 'panama_canal', amount: 240, description: 'Panama Canal transit fee' },
        { key: 'uk_port_congestion', amount: 125, description: 'UK port congestion fee' },
        { key: 'brexit_documentation', amount: 65, description: 'Additional UK documentation' }
      ]
    }
  },

  // ========== US EAST COAST (NY/NJ) TO EUROPE ==========

  // NY/NJ to Germany (Hamburg) - Shorter Atlantic Route
  {
    id: 'ship-ny-hamburg-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-ny-nj',
    destinationCountry: 'Germany',
    destinationPort: 'hamburg',
    pricingData: {
      baseFreight: 1280,
      currency: 'USD',
      surcharges: [
        { key: 'atlantic_crossing', amount: 180, description: 'Atlantic ocean crossing' },
        { key: 'eu_compliance', amount: 85, description: 'EU regulatory compliance' }
      ]
    }
  },

  // NY/NJ to UK (Southampton)
  {
    id: 'ship-ny-southampton-united', 
    shipperId: 'united-ocean',
    exitPortId: 'port-ny-nj',
    destinationCountry: 'United Kingdom', 
    destinationPort: 'southampton',
    pricingData: {
      baseFreight: 1180,
      currency: 'USD',
      surcharges: [
        { key: 'atlantic_crossing', amount: 180, description: 'Atlantic ocean crossing' },
        { key: 'uk_port_congestion', amount: 125, description: 'UK port congestion fee' }
      ]
    }
  },

  // ========== US SOUTH (HOUSTON/SAVANNAH) TO WEST AFRICA ==========

  // Houston to Ghana (Tema)
  {
    id: 'ship-hou-tema-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-houston',
    destinationCountry: 'Ghana',
    destinationPort: 'tema',
    pricingData: {
      baseFreight: 1650,
      currency: 'USD',
      surcharges: [
        { key: 'west_africa_surcharge', amount: 220, description: 'West Africa service surcharge' },
        { key: 'tropical_route', amount: 95, description: 'Tropical climate protection' },
        { key: 'port_congestion_tema', amount: 180, description: 'Tema port congestion' }
      ]
    }
  },

  // Savannah to Ghana (Tema) 
  {
    id: 'ship-sav-tema-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-savannah',
    destinationCountry: 'Ghana',
    destinationPort: 'tema',
    pricingData: {
      baseFreight: 1580, 
      currency: 'USD',
      surcharges: [
        { key: 'west_africa_surcharge', amount: 220, description: 'West Africa service surcharge' },
        { key: 'tropical_route', amount: 95, description: 'Tropical climate protection' }
      ]
    }
  },

  // Houston to Nigeria (Lagos/Apapa)
  {
    id: 'ship-hou-lagos-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-houston', 
    destinationCountry: 'Nigeria',
    destinationPort: 'apapa',
    pricingData: {
      baseFreight: 1750,
      currency: 'USD',
      surcharges: [
        { key: 'west_africa_surcharge', amount: 220, description: 'West Africa service surcharge' },
        { key: 'lagos_port_premium', amount: 280, description: 'Lagos port handling premium' },
        { key: 'security_escort', amount: 150, description: 'Port security escort service' },
        { key: 'tropical_route', amount: 95, description: 'Tropical climate protection' }
      ]
    }
  },

  // ========== TRANS-PACIFIC ROUTES ==========

  // Los Angeles to Japan (Yokohama/Tokyo)
  {
    id: 'ship-lax-yokohama-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'Japan',
    destinationPort: 'yokohama',
    pricingData: {
      baseFreight: 1350,
      currency: 'USD',
      surcharges: [
        { key: 'pacific_crossing', amount: 150, description: 'Trans-Pacific service' },
        { key: 'japan_import_fee', amount: 120, description: 'Japan import processing' },
        { key: 'earthquake_insurance', amount: 45, description: 'Natural disaster coverage' }
      ]
    }
  },

  // Los Angeles to Australia (Melbourne/Sydney)  
  {
    id: 'ship-lax-melbourne-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'Australia',
    destinationPort: 'melbourne',
    pricingData: {
      baseFreight: 1950,
      currency: 'USD',
      surcharges: [
        { key: 'southern_pacific', amount: 280, description: 'Southern Pacific route' },
        { key: 'australia_biosecurity', amount: 180, description: 'Australian biosecurity inspection' },
        { key: 'long_haul_premium', amount: 220, description: 'Extended transit premium' }
      ]
    }
  },

  // ========== PREMIUM SERVICE ROUTES ==========

  // Premium Express Service - Higher rates, faster transit, better service
  {
    id: 'ship-lax-dubai-premium-express',
    shipperId: 'premium-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'UAE',
    destinationPort: 'jebel-ali',
    pricingData: {
      baseFreight: 1850,  // ~27% premium over standard
      currency: 'USD',
      surcharges: [
        { key: 'gulf_surcharge', amount: 180, description: 'Persian Gulf surcharge' },
        { key: 'express_service', amount: 250, description: '12-day express transit' },
        { key: 'priority_loading', amount: 150, description: 'Priority vessel loading' },
        { key: 'dedicated_space', amount: 180, description: 'Dedicated cargo space' }
      ]
    }
  },

  // ========== ECONOMY SERVICE ROUTES ==========

  // Economy consolidation service - Lower rates, longer transit times
  {
    id: 'ship-lax-hamburg-economy',
    shipperId: 'economy-ocean',
    exitPortId: 'port-los-angeles',
    destinationCountry: 'Germany',
    destinationPort: 'hamburg', 
    pricingData: {
      baseFreight: 1480,  // ~20% discount from standard
      currency: 'USD',
      surcharges: [
        { key: 'panama_canal', amount: 240, description: 'Panama Canal transit fee' },
        { key: 'eu_compliance', amount: 85, description: 'EU regulatory compliance' },
        { key: 'consolidation_delay', amount: 0, description: 'Extended 45-day transit' }
      ]
    }
  },

  // ========== SPECIALTY/HIGH-VALUE VEHICLE ROUTES ==========

  // Enclosed transport for luxury/classic vehicles
  {
    id: 'ship-ny-southampton-specialty',
    shipperId: 'specialty-carriers',
    exitPortId: 'port-ny-nj',
    destinationCountry: 'United Kingdom',
    destinationPort: 'southampton',
    pricingData: {
      baseFreight: 2850,  // ~140% premium for enclosed transport
      currency: 'USD',
      surcharges: [
        { key: 'atlantic_crossing', amount: 180, description: 'Atlantic ocean crossing' },
        { key: 'enclosed_container', amount: 800, description: 'Climate-controlled enclosed container' },
        { key: 'white_glove_handling', amount: 350, description: 'Premium handling and loading' },
        { key: 'comprehensive_insurance', amount: 200, description: 'Enhanced insurance coverage' }
      ]
    }
  },

  // ========== ADDITIONAL CROSS-ROUTES FOR COVERAGE ==========

  // Jacksonville to Ghana (Alternative East Coast to West Africa)
  {
    id: 'ship-jax-tema-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-jacksonville',
    destinationCountry: 'Ghana', 
    destinationPort: 'tema',
    pricingData: {
      baseFreight: 1620,
      currency: 'USD',
      surcharges: [
        { key: 'west_africa_surcharge', amount: 220, description: 'West Africa service surcharge' },
        { key: 'tropical_route', amount: 95, description: 'Tropical climate protection' }
      ]
    }
  },

  // Houston to UAE (Gulf of Mexico to Persian Gulf)
  {
    id: 'ship-hou-dubai-united', 
    shipperId: 'united-ocean',
    exitPortId: 'port-houston',
    destinationCountry: 'UAE',
    destinationPort: 'jebel-ali',
    pricingData: {
      baseFreight: 1580,
      currency: 'USD',
      surcharges: [
        { key: 'gulf_to_gulf', amount: 150, description: 'Gulf of Mexico to Persian Gulf' },
        { key: 'suez_canal', amount: 320, description: 'Suez Canal transit fee' },
        { key: 'gulf_surcharge', amount: 180, description: 'Persian Gulf surcharge' }
      ]
    }
  },

  // Savannah to Germany (Alternative Atlantic Route)
  {
    id: 'ship-sav-hamburg-united',
    shipperId: 'united-ocean',
    exitPortId: 'port-savannah',
    destinationCountry: 'Germany',
    destinationPort: 'hamburg',
    pricingData: {
      baseFreight: 1320,
      currency: 'USD',
      surcharges: [
        { key: 'atlantic_crossing', amount: 180, description: 'Atlantic ocean crossing' },
        { key: 'eu_compliance', amount: 85, description: 'EU regulatory compliance' },
        { key: 'southern_route', amount: 75, description: 'Southern Atlantic route premium' }
      ]
    }
  }
]