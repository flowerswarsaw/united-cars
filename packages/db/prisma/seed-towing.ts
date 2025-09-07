import { PrismaClient, AuctionSource, RuleType, VehicleTypeKey } from '@prisma/client'

const prisma = new PrismaClient()

// Port data with codes
const portsData = [
  { id: 'port-ny-nj', name: 'Newark/New York Port', state: 'NJ', code: 'USNWK' },
  { id: 'port-savannah', name: 'Savannah Port', state: 'GA', code: 'USSAV' },
  { id: 'port-houston', name: 'Houston Port', state: 'TX', code: 'USHOU' },
  { id: 'port-los-angeles', name: 'Los Angeles Port', state: 'CA', code: 'USLAX' },
  { id: 'port-seattle', name: 'Seattle Port', state: 'WA', code: 'USSEA' },
  { id: 'port-norfolk', name: 'Norfolk Port', state: 'VA', code: 'USNFK' },
  { id: 'port-chicago', name: 'Chicago Port', state: 'IL', code: 'USCHI' },
  { id: 'port-jacksonville', name: 'Jacksonville Port', state: 'FL', code: 'USJAX' },
  { id: 'port-baltimore', name: 'Baltimore Port', state: 'MD', code: 'USBAL' },
  { id: 'port-miami', name: 'Miami Port', state: 'FL', code: 'USMIA' },
]

// Auction location data with preferred ports mapping
const auctionLocationData = [
  // COPART California - prefer LA Port
  { auction: AuctionSource.COPART, code: 'fresno-ca', name: 'Fresno', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.COPART, code: 'vallejo-ca', name: 'Vallejo', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.COPART, code: 'rancho-cucamonga-ca', name: 'Rancho Cucamonga', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.COPART, code: 'sacramento-ca', name: 'Sacramento', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.COPART, code: 'san-diego-ca', name: 'San Diego', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.COPART, code: 'los-angeles-ca', name: 'Los Angeles', state: 'CA', preferredPortId: 'port-los-angeles' },

  // COPART Texas - prefer Houston Port
  { auction: AuctionSource.COPART, code: 'houston-tx', name: 'Houston', state: 'TX', preferredPortId: 'port-houston' },
  { auction: AuctionSource.COPART, code: 'dallas-tx', name: 'Dallas', state: 'TX', preferredPortId: 'port-houston' },
  { auction: AuctionSource.COPART, code: 'austin-tx', name: 'Austin', state: 'TX', preferredPortId: 'port-houston' },
  { auction: AuctionSource.COPART, code: 'san-antonio-tx', name: 'San Antonio', state: 'TX', preferredPortId: 'port-houston' },
  { auction: AuctionSource.COPART, code: 'el-paso-tx', name: 'El Paso', state: 'TX', preferredPortId: 'port-houston' },

  // COPART Florida - prefer Jacksonville Port
  { auction: AuctionSource.COPART, code: 'orlando-fl', name: 'Orlando', state: 'FL', preferredPortId: 'port-jacksonville' },
  { auction: AuctionSource.COPART, code: 'miami-fl', name: 'Miami', state: 'FL', preferredPortId: 'port-miami' },
  { auction: AuctionSource.COPART, code: 'tampa-fl', name: 'Tampa', state: 'FL', preferredPortId: 'port-jacksonville' },
  { auction: AuctionSource.COPART, code: 'jacksonville-fl', name: 'Jacksonville', state: 'FL', preferredPortId: 'port-jacksonville' },
  { auction: AuctionSource.COPART, code: 'ft-myers-fl', name: 'Fort Myers', state: 'FL', preferredPortId: 'port-jacksonville' },

  // COPART Georgia - prefer Savannah Port
  { auction: AuctionSource.COPART, code: 'atlanta-ga', name: 'Atlanta', state: 'GA', preferredPortId: 'port-savannah' },
  { auction: AuctionSource.COPART, code: 'savannah-ga', name: 'Savannah', state: 'GA', preferredPortId: 'port-savannah' },

  // COPART Northeast - prefer NY/NJ Port
  { auction: AuctionSource.COPART, code: 'trenton-nj', name: 'Trenton', state: 'NJ', preferredPortId: 'port-ny-nj' },
  { auction: AuctionSource.COPART, code: 'philadelphia-pa', name: 'Philadelphia', state: 'PA', preferredPortId: 'port-ny-nj' },
  { auction: AuctionSource.COPART, code: 'syracuse-ny', name: 'Syracuse', state: 'NY', preferredPortId: 'port-ny-nj' },
  { auction: AuctionSource.COPART, code: 'albany-ny', name: 'Albany', state: 'NY', preferredPortId: 'port-ny-nj' },
  { auction: AuctionSource.COPART, code: 'buffalo-ny', name: 'Buffalo', state: 'NY', preferredPortId: 'port-ny-nj' },

  // COPART Midwest - prefer Chicago Port
  { auction: AuctionSource.COPART, code: 'chicago-il', name: 'Chicago', state: 'IL', preferredPortId: 'port-chicago' },
  { auction: AuctionSource.COPART, code: 'detroit-mi', name: 'Detroit', state: 'MI', preferredPortId: 'port-chicago' },
  { auction: AuctionSource.COPART, code: 'cleveland-oh', name: 'Cleveland', state: 'OH', preferredPortId: 'port-chicago' },
  { auction: AuctionSource.COPART, code: 'columbus-oh', name: 'Columbus', state: 'OH', preferredPortId: 'port-chicago' },

  // COPART West Coast - prefer Seattle Port
  { auction: AuctionSource.COPART, code: 'seattle-wa', name: 'Seattle', state: 'WA', preferredPortId: 'port-seattle' },
  { auction: AuctionSource.COPART, code: 'portland-or', name: 'Portland', state: 'OR', preferredPortId: 'port-seattle' },

  // IAA locations
  { auction: AuctionSource.IAA, code: 'los-angeles-ca', name: 'Los Angeles', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.IAA, code: 'fresno-ca', name: 'Fresno', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.IAA, code: 'san-diego-ca', name: 'San Diego', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.IAA, code: 'houston-tx', name: 'Houston', state: 'TX', preferredPortId: 'port-houston' },
  { auction: AuctionSource.IAA, code: 'dallas-tx', name: 'Dallas', state: 'TX', preferredPortId: 'port-houston' },
  { auction: AuctionSource.IAA, code: 'orlando-fl', name: 'Orlando', state: 'FL', preferredPortId: 'port-jacksonville' },
  { auction: AuctionSource.IAA, code: 'miami-fl', name: 'Miami', state: 'FL', preferredPortId: 'port-miami' },
  { auction: AuctionSource.IAA, code: 'atlanta-ga', name: 'Atlanta', state: 'GA', preferredPortId: 'port-savannah' },
  { auction: AuctionSource.IAA, code: 'philadelphia-pa', name: 'Philadelphia', state: 'PA', preferredPortId: 'port-ny-nj' },
  { auction: AuctionSource.IAA, code: 'long-island-ny', name: 'Long Island', state: 'NY', preferredPortId: 'port-ny-nj' },
  { auction: AuctionSource.IAA, code: 'chicago-il', name: 'Chicago', state: 'IL', preferredPortId: 'port-chicago' },
  { auction: AuctionSource.IAA, code: 'detroit-mi', name: 'Detroit', state: 'MI', preferredPortId: 'port-chicago' },
  { auction: AuctionSource.IAA, code: 'seattle-wa', name: 'Seattle', state: 'WA', preferredPortId: 'port-seattle' },
  { auction: AuctionSource.IAA, code: 'portland-or', name: 'Portland', state: 'OR', preferredPortId: 'port-seattle' },

  // MANHEIM locations
  { auction: AuctionSource.MANHEIM, code: 'riverside-ca', name: 'Riverside', state: 'CA', preferredPortId: 'port-los-angeles' },
  { auction: AuctionSource.MANHEIM, code: 'atlanta-ga', name: 'Atlanta', state: 'GA', preferredPortId: 'port-savannah' },
  { auction: AuctionSource.MANHEIM, code: 'dallas-tx', name: 'Dallas', state: 'TX', preferredPortId: 'port-houston' },
  { auction: AuctionSource.MANHEIM, code: 'orlando-fl', name: 'Orlando', state: 'FL', preferredPortId: 'port-jacksonville' },
  { auction: AuctionSource.MANHEIM, code: 'pennsylvania-pa', name: 'Pennsylvania', state: 'PA', preferredPortId: 'port-ny-nj' },
  { auction: AuctionSource.MANHEIM, code: 'newburgh-ny', name: 'Newburgh', state: 'NY', preferredPortId: 'port-ny-nj' },
]

// Vehicle type data
const vehicleTypeData = [
  { key: VehicleTypeKey.SEDAN, multiplier: 1.0, category: 'regular' },
  { key: VehicleTypeKey.SUV, multiplier: 1.2, category: 'regular' },
  { key: VehicleTypeKey.BIGSUV, multiplier: 1.5, category: 'oversize' },
  { key: VehicleTypeKey.VAN, multiplier: 1.3, category: 'regular' },
  { key: VehicleTypeKey.PICKUP, multiplier: 1.15, category: 'regular' },
  { key: VehicleTypeKey.MOTORCYCLE, multiplier: 0.7, category: 'small' },
  { key: VehicleTypeKey.ATV, multiplier: 0.8, category: 'small' },
  { key: VehicleTypeKey.BOAT, multiplier: 2.0, category: 'specialty' },
  { key: VehicleTypeKey.RV, multiplier: 2.5, category: 'specialty' },
  { key: VehicleTypeKey.COUPE, multiplier: 1.0, category: 'regular' },
  { key: VehicleTypeKey.HATCHBACK, multiplier: 1.0, category: 'regular' },
  { key: VehicleTypeKey.CONVERTIBLE, multiplier: 1.1, category: 'regular' },
  { key: VehicleTypeKey.WAGON, multiplier: 1.1, category: 'regular' },
  { key: VehicleTypeKey.TRUCK, multiplier: 1.25, category: 'regular' },
]

// Shipper data
const shippersData = [
  { id: 'united-logistics', name: 'United Logistics', ruleType: RuleType.MULTIPLIER },
  { id: 'premium-express', name: 'Premium Express', ruleType: RuleType.MULTIPLIER },
  { id: 'economy-transport', name: 'Economy Transport', ruleType: RuleType.MULTIPLIER },
  { id: 'national-transport', name: 'National Transport', ruleType: RuleType.CATEGORY },
]

async function seedTowingData() {
  console.log('🚀 Starting towing data seed...')

  // Seed Ports
  console.log('📍 Seeding ports...')
  for (const port of portsData) {
    await prisma.port.upsert({
      where: { id: port.id },
      update: port,
      create: port,
    })
  }
  console.log(`✅ Seeded ${portsData.length} ports`)

  // Seed Vehicle Types
  console.log('🚗 Seeding vehicle types...')
  for (const vehicleType of vehicleTypeData) {
    await prisma.vehicleType.upsert({
      where: { key: vehicleType.key },
      update: {
        multiplier: vehicleType.multiplier,
        category: vehicleType.category,
      },
      create: vehicleType,
    })
  }
  console.log(`✅ Seeded ${vehicleTypeData.length} vehicle types`)

  // Seed Shippers
  console.log('🚚 Seeding shippers...')
  for (const shipper of shippersData) {
    await prisma.shipper.upsert({
      where: { id: shipper.id },
      update: shipper,
      create: shipper,
    })
  }
  console.log(`✅ Seeded ${shippersData.length} shippers`)

  // Seed Auction Locations
  console.log('🏢 Seeding auction locations...')
  for (const location of auctionLocationData) {
    await prisma.auctionLocation.upsert({
      where: {
        auction_code: {
          auction: location.auction,
          code: location.code,
        },
      },
      update: {
        name: location.name,
        state: location.state,
        preferredPortId: location.preferredPortId,
      },
      create: location,
    })
  }
  console.log(`✅ Seeded ${auctionLocationData.length} auction locations`)

  // Seed sample towing rules for key routes
  console.log('📋 Seeding towing rules...')
  const towingRules = [
    // COPART California to LA Port
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'fresno-ca' }, deliveryPortId: 'port-los-angeles', basePrice: 280 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'vallejo-ca' }, deliveryPortId: 'port-los-angeles', basePrice: 420 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'rancho-cucamonga-ca' }, deliveryPortId: 'port-los-angeles', basePrice: 180 },
    
    // COPART Texas to Houston Port
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'houston-tx' }, deliveryPortId: 'port-houston', basePrice: 150 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'dallas-tx' }, deliveryPortId: 'port-houston', basePrice: 320 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'austin-tx' }, deliveryPortId: 'port-houston', basePrice: 190 },

    // COPART Florida to Jacksonville Port
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'orlando-fl' }, deliveryPortId: 'port-jacksonville', basePrice: 220 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'miami-fl' }, deliveryPortId: 'port-jacksonville', basePrice: 380 },

    // COPART Georgia to Savannah Port
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'atlanta-ga' }, deliveryPortId: 'port-savannah', basePrice: 320 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'savannah-ga' }, deliveryPortId: 'port-savannah', basePrice: 120 },

    // COPART Northeast to NY/NJ Port
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'trenton-nj' }, deliveryPortId: 'port-ny-nj', basePrice: 160 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'philadelphia-pa' }, deliveryPortId: 'port-ny-nj', basePrice: 180 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.COPART, code: 'syracuse-ny' }, deliveryPortId: 'port-ny-nj', basePrice: 280 },

    // IAA locations
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.IAA, code: 'los-angeles-ca' }, deliveryPortId: 'port-los-angeles', basePrice: 140 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.IAA, code: 'fresno-ca' }, deliveryPortId: 'port-los-angeles', basePrice: 290 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.IAA, code: 'houston-tx' }, deliveryPortId: 'port-houston', basePrice: 140 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.IAA, code: 'dallas-tx' }, deliveryPortId: 'port-houston', basePrice: 310 },
    { shipperId: 'united-logistics', auctionLocation: { auction: AuctionSource.IAA, code: 'orlando-fl' }, deliveryPortId: 'port-jacksonville', basePrice: 210 },

    // Premium service routes
    { shipperId: 'premium-express', auctionLocation: { auction: AuctionSource.COPART, code: 'vallejo-ca' }, deliveryPortId: 'port-los-angeles', basePrice: 580 },
    { shipperId: 'premium-express', auctionLocation: { auction: AuctionSource.COPART, code: 'dallas-tx' }, deliveryPortId: 'port-houston', basePrice: 440 },

    // Economy service routes
    { shipperId: 'economy-transport', auctionLocation: { auction: AuctionSource.IAA, code: 'fresno-ca' }, deliveryPortId: 'port-los-angeles', basePrice: 220 },
    { shipperId: 'economy-transport', auctionLocation: { auction: AuctionSource.COPART, code: 'orlando-fl' }, deliveryPortId: 'port-jacksonville', basePrice: 180 },
  ]

  let towingRuleCount = 0
  for (const rule of towingRules) {
    const auctionLocation = await prisma.auctionLocation.findUnique({
      where: {
        auction_code: rule.auctionLocation,
      },
    })

    if (auctionLocation) {
      await prisma.towingRule.upsert({
        where: {
          shipperId_auctionLocationId_deliveryPortId: {
            shipperId: rule.shipperId,
            auctionLocationId: auctionLocation.id,
            deliveryPortId: rule.deliveryPortId,
          },
        },
        update: {
          basePrice: rule.basePrice,
          ruleType: RuleType.MULTIPLIER,
        },
        create: {
          shipperId: rule.shipperId,
          auctionLocationId: auctionLocation.id,
          deliveryPortId: rule.deliveryPortId,
          basePrice: rule.basePrice,
          ruleType: RuleType.MULTIPLIER,
        },
      })
      towingRuleCount++
    }
  }
  console.log(`✅ Seeded ${towingRuleCount} towing rules`)

  console.log('🎉 Towing data seeding completed!')
}

// Run the seed function
seedTowingData()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })