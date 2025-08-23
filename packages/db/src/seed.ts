import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { key: 'ADMIN' },
    update: {},
    create: { key: 'ADMIN' }
  })

  const accountantRole = await prisma.role.upsert({
    where: { key: 'ACCOUNTANT' },
    update: {},
    create: { key: 'ACCOUNTANT' }
  })

  const opsRole = await prisma.role.upsert({
    where: { key: 'OPS' },
    update: {},
    create: { key: 'OPS' }
  })

  const dealerRole = await prisma.role.upsert({
    where: { key: 'DEALER' },
    update: {},
    create: { key: 'DEALER' }
  })

  // Create admin org
  const adminOrg = await prisma.org.upsert({
    where: { id: 'admin-org' },
    update: {},
    create: {
      id: 'admin-org',
      name: 'United Cars Admin',
      type: 'ADMIN'
    }
  })

  // Create demo dealer org
  const dealerOrg = await prisma.org.upsert({
    where: { id: 'demo-dealer' },
    update: {},
    create: {
      id: 'demo-dealer',
      name: 'Demo Dealer',
      type: 'DEALER'
    }
  })

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin User',
      passwordHash: await bcrypt.hash('admin123', 10),
      orgId: adminOrg.id,
      status: 'ACTIVE'
    }
  })

  const dealerUser = await prisma.user.upsert({
    where: { email: 'dealer@demo.com' },
    update: {},
    create: {
      email: 'dealer@demo.com',
      name: 'Dealer User',
      passwordHash: await bcrypt.hash('dealer123', 10),
      orgId: dealerOrg.id,
      status: 'ACTIVE'
    }
  })

  // Assign roles
  await prisma.userRole.upsert({
    where: {
      userId_roleId_orgId: {
        userId: adminUser.id,
        roleId: adminRole.id,
        orgId: adminOrg.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
      orgId: adminOrg.id
    }
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId_orgId: {
        userId: adminUser.id,
        roleId: accountantRole.id,
        orgId: adminOrg.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: accountantRole.id,
      orgId: adminOrg.id
    }
  })

  await prisma.userRole.upsert({
    where: {
      userId_roleId_orgId: {
        userId: dealerUser.id,
        roleId: dealerRole.id,
        orgId: dealerOrg.id
      }
    },
    update: {},
    create: {
      userId: dealerUser.id,
      roleId: dealerRole.id,
      orgId: dealerOrg.id
    }
  })

  // Create vehicle types
  const vehicleTypes = [
    { key: 'SEDAN' as const, multiplier: 1.0, category: 'standard' },
    { key: 'SUV' as const, multiplier: 1.2, category: 'standard' },
    { key: 'BIGSUV' as const, multiplier: 1.5, category: 'oversize' },
    { key: 'VAN' as const, multiplier: 1.3, category: 'standard' },
    { key: 'PICKUP' as const, multiplier: 1.1, category: 'standard' }
  ]

  for (const vtype of vehicleTypes) {
    await prisma.vehicleType.upsert({
      where: { key: vtype.key },
      update: {},
      create: vtype
    })
  }

  // Create auction locations
  const auctionLocations = [
    { id: 'copart-dallas', auction: 'COPART', code: 'TX-DALLAS', name: 'Dallas', state: 'TX', country: 'US' },
    { id: 'copart-atlanta', auction: 'COPART', code: 'GA-ATLANTA', name: 'Atlanta', state: 'GA', country: 'US' },
    { id: 'iaa-chicago', auction: 'IAA', code: 'IL-CHICAGO', name: 'Chicago', state: 'IL', country: 'US' },
    { id: 'iaa-phoenix', auction: 'IAA', code: 'AZ-PHOENIX', name: 'Phoenix', state: 'AZ', country: 'US' }
  ]

  for (const location of auctionLocations) {
    await prisma.auctionLocation.upsert({
      where: { 
        auction_code: { auction: location.auction as any, code: location.code }
      },
      update: {},
      create: location as any
    })
  }

  // Create ports
  const ports = [
    { id: 'port-newark', name: 'Port of Newark', state: 'NJ', country: 'US', code: 'USNWK' },
    { id: 'port-houston', name: 'Port of Houston', state: 'TX', country: 'US', code: 'USHOU' },
    { id: 'port-los-angeles', name: 'Port of Los Angeles', state: 'CA', country: 'US', code: 'USLAX' }
  ]

  for (const port of ports) {
    await prisma.port.upsert({
      where: { id: port.id },
      update: {},
      create: port
    })
  }

  // Create shippers
  const shipper = await prisma.shipper.upsert({
    where: { id: 'demo-shipper' },
    update: {},
    create: {
      id: 'demo-shipper',
      name: 'Demo Shipping Company',
      ruleType: 'FLAT'
    }
  })

  // Create auction fee matrices
  const auctionFeeMatrices = [
    {
      auction: 'COPART',
      accountType: 'C',
      title: 'CLEAN',
      payment: 'SECURED',
      bracketsJson: [
        { min: 0, max: 499.99, fee: 0 },
        { min: 500, max: 999.99, fee: 25 },
        { min: 1000, max: 1499.99, fee: 40 },
        { min: 1500, max: 1999.99, fee: 50 },
        { min: 2000, max: 2999.99, fee: 60 },
        { min: 3000, max: 4999.99, fee: 75 },
        { min: 5000, max: 7499.99, fee: 100 },
        { min: 7500, max: 9999.99, fee: 125 },
        { min: 10000, max: null, fee: 200 }
      ]
    },
    {
      auction: 'IAA',
      accountType: 'C',
      title: 'CLEAN',
      payment: 'SECURED',
      bracketsJson: [
        { min: 0, max: 999.99, fee: 40 },
        { min: 1000, max: 2999.99, fee: 70 },
        { min: 3000, max: 4999.99, fee: 100 },
        { min: 5000, max: 9999.99, fee: 150 },
        { min: 10000, max: null, fee: 250 }
      ]
    }
  ]

  for (const matrix of auctionFeeMatrices) {
    await prisma.auctionFeeMatrix.upsert({
      where: {
        auction_accountType_title_payment: {
          auction: matrix.auction as any,
          accountType: matrix.accountType as any,
          title: matrix.title as any,
          payment: matrix.payment as any
        }
      },
      update: {},
      create: matrix as any
    })
  }

  // Create demo vehicles
  const vehicles = [
    {
      id: 'vehicle-1',
      orgId: dealerOrg.id,
      vin: '1HGCM82633A123456',
      make: 'Honda',
      model: 'Accord',
      year: 2020,
      purchasePriceUSD: 15000,
      status: 'PURCHASED',
      currentStage: 'auction_purchased'
    },
    {
      id: 'vehicle-2',
      orgId: dealerOrg.id,
      vin: '2T1BURHE8JC123457',
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      purchasePriceUSD: 12000,
      status: 'IN_TRANSIT',
      currentStage: 'towing'
    }
  ]

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: vehicle.id },
      update: {},
      create: vehicle as any
    })
  }

  // Create demo invoice
  const invoice = await prisma.invoice.upsert({
    where: { id: 'demo-invoice-1' },
    update: {},
    create: {
      id: 'demo-invoice-1',
      orgId: dealerOrg.id,
      number: 'INV-2024-001',
      status: 'ISSUED',
      currency: 'USD',
      issuedAt: new Date(),
      subtotal: 1500.00,
      vat: 150.00,
      total: 1650.00,
      notes: 'Demo invoice for vehicle services'
    }
  })

  // Create invoice lines
  await prisma.invoiceLine.upsert({
    where: { id: 'demo-line-1' },
    update: {},
    create: {
      id: 'demo-line-1',
      invoiceId: invoice.id,
      itemType: 'towing',
      description: 'Towing service from Dallas to Houston Port',
      qty: 1,
      unitPrice: 800.00,
      vehicleId: 'vehicle-1'
    }
  })

  await prisma.invoiceLine.upsert({
    where: { id: 'demo-line-2' },
    update: {},
    create: {
      id: 'demo-line-2',
      invoiceId: invoice.id,
      itemType: 'shipping',
      description: 'Ocean freight to destination port',
      qty: 1,
      unitPrice: 700.00,
      vehicleId: 'vehicle-1'
    }
  })

  // Create payment intent
  await prisma.paymentIntent.upsert({
    where: { id: 'demo-payment-1' },
    update: {},
    create: {
      id: 'demo-payment-1',
      orgId: dealerOrg.id,
      invoiceId: invoice.id,
      method: 'bank_transfer',
      amount: 1650.00,
      currency: 'USD',
      status: 'SUBMITTED',
      ref: 'DEMO-REF-001',
      createdByUserId: dealerUser.id
    }
  })

  // Create vehicle intakes
  console.log('Creating vehicle intakes...')
  
  // Create a pending intake for the dealer
  const pendingIntake = await prisma.vehicleIntake.create({
    data: {
      orgId: dealerOrg.id,
      createdById: dealerUser.id,
      status: 'PENDING',
      auction: 'COPART',
      auctionLot: '12345678',
      vin: '1HGBH41JXMN109186',
      make: 'Honda',
      model: 'Civic',
      year: 2018,
      purchasePriceUSD: 8500.00,
      auctionLocationId: 'copart-dallas',
      destinationPort: 'Rotterdam',
      notes: 'Clean title, minor damage on left side. Runs and drives well.'
    }
  })

  // Create an approved intake with corresponding vehicle
  const approvedVehicle = await prisma.vehicle.upsert({
    where: {
      orgId_vin: {
        orgId: dealerOrg.id,
        vin: '1HGBH41JXMN556789'
      }
    },
    update: {},
    create: {
      vin: '1HGBH41JXMN556789',
      make: 'Honda',
      model: 'Accord',
      year: 2019,
      purchasePriceUSD: 12500.00,
      orgId: dealerOrg.id,
      status: 'PURCHASED',
      currentStage: 'INTAKE_APPROVED'
    }
  })

  const approvedIntake = await prisma.vehicleIntake.create({
    data: {
      orgId: dealerOrg.id,
      createdById: dealerUser.id,
      status: 'APPROVED',
      auction: 'IAA',
      auctionLot: '87654321',
      vin: '1HGBH41JXMN556789',
      make: 'Honda',
      model: 'Accord',
      year: 2019,
      purchasePriceUSD: 12500.00,
      destinationPort: 'Rotterdam',
      notes: 'Excellent condition, approved for processing.',
      reviewedAt: new Date(),
      reviewedById: adminUser.id
    }
  })

  // Create stage history for approved vehicle
  await prisma.vehicleStageHistory.createMany({
    data: [
      {
        vehicleId: approvedVehicle.id,
        stage: 'INTAKE_SUBMITTED',
        dataJson: {
          intakeId: approvedIntake.id,
          auction: 'IAA',
          auctionLot: '87654321',
          vin: '1HGBH41JXMN556789',
          destinationPort: 'Rotterdam',
          purchasePriceUSD: '12500.00'
        },
        at: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        vehicleId: approvedVehicle.id,
        stage: 'INTAKE_APPROVED',
        dataJson: {
          reviewerUserId: adminUser.id,
          reviewerName: 'Admin User',
          destinationPort: 'Rotterdam',
          reason: 'Approved for processing'
        }
      }
    ]
  })

  // Create general fees
  const generalFees = [
    { key: 'service_fee', value: 50.00, currency: 'USD' },
    { key: 'title_change', value: 75.00, currency: 'USD' },
    { key: 'hybrid_electro', value: 100.00, currency: 'USD' }
  ]

  for (const fee of generalFees) {
    await prisma.generalFee.create({
      data: fee
    })
  }

  // Create titles for Sprint 2
  console.log('Creating titles...')
  const titles = [
    {
      id: 'title-1',
      vehicleId: 'vehicle-1',
      status: 'pending',
      location: 'Dallas Office',
      notes: 'Waiting for title from auction house'
    },
    {
      id: 'title-2', 
      vehicleId: 'vehicle-2',
      status: 'received',
      location: 'Processing Center',
      notes: 'Title received and verified'
    },
    {
      id: 'title-3',
      vehicleId: approvedVehicle.id,
      status: 'packed',
      location: 'Shipping Department',
      notes: 'Packaged for international shipping'
    }
  ]

  for (const title of titles) {
    await prisma.title.upsert({
      where: { id: title.id },
      update: {},
      create: title as any
    })
  }

  // Create stage history for titles
  await prisma.vehicleStageHistory.createMany({
    data: [
      {
        vehicleId: 'vehicle-1',
        stage: 'title_pending',
        dataJson: {
          titleId: 'title-1',
          location: 'Dallas Office',
          notes: 'Initial title request submitted'
        },
        at: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        vehicleId: 'vehicle-2',
        stage: 'title_received',
        dataJson: {
          titleId: 'title-2',
          location: 'Processing Center',
          previousStatus: 'pending',
          newStatus: 'received',
          updatedBy: adminUser.id
        },
        at: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ]
  })

  // Create service requests for Sprint 2
  console.log('Creating service requests...')
  const serviceRequests = [
    {
      id: 'service-1',
      orgId: dealerOrg.id,
      vehicleId: 'vehicle-1',
      type: 'inspection',
      status: 'pending',
      notes: 'Pre-shipment inspection required'
    },
    {
      id: 'service-2',
      orgId: dealerOrg.id,
      vehicleId: 'vehicle-2', 
      type: 'cleaning',
      status: 'approved',
      priceUSD: 150.00,
      notes: 'Full detail cleaning approved'
    },
    {
      id: 'service-3',
      orgId: dealerOrg.id,
      vehicleId: approvedVehicle.id,
      type: 'repair',
      status: 'completed',
      priceUSD: 450.00,
      notes: 'Minor body repair completed successfully'
    }
  ]

  for (const service of serviceRequests) {
    await prisma.serviceRequest.upsert({
      where: { id: service.id },
      update: {},
      create: service as any
    })
  }

  // Create stage history for services
  await prisma.vehicleStageHistory.createMany({
    data: [
      {
        vehicleId: 'vehicle-2',
        stage: 'service_approved',
        dataJson: {
          serviceId: 'service-2',
          serviceType: 'cleaning',
          priceUSD: 150.00,
          updatedBy: adminUser.id
        },
        at: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
      },
      {
        vehicleId: approvedVehicle.id,
        stage: 'service_completed',
        dataJson: {
          serviceId: 'service-3',
          serviceType: 'repair',
          priceUSD: 450.00,
          previousStatus: 'in_progress',
          newStatus: 'completed',
          updatedBy: adminUser.id
        },
        at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ]
  })

  // Create insurance claims for Sprint 2
  console.log('Creating insurance claims...')
  const claims = [
    {
      id: 'claim-1',
      orgId: dealerOrg.id,
      vehicleId: 'vehicle-1',
      status: 'new',
      incidentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      description: 'Minor hail damage discovered during inspection. Small dents on hood and roof.',
      photos: [
        { filename: 'hail_damage_hood.jpg', url: '/uploads/claims/claim-1/hail_damage_hood.jpg' },
        { filename: 'hail_damage_roof.jpg', url: '/uploads/claims/claim-1/hail_damage_roof.jpg' }
      ]
    },
    {
      id: 'claim-2',
      orgId: dealerOrg.id,
      vehicleId: 'vehicle-2',
      status: 'approved',
      incidentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      description: 'Windshield crack occurred during transport. Replacement required.',
      photos: [
        { filename: 'windshield_crack.jpg', url: '/uploads/claims/claim-2/windshield_crack.jpg' }
      ]
    },
    {
      id: 'claim-3',
      orgId: dealerOrg.id,
      vehicleId: approvedVehicle.id,
      status: 'rejected',
      description: 'Claim for pre-existing scratches - determined to be auction condition, not transport damage.',
      incidentAt: null
    }
  ]

  for (const claim of claims) {
    await prisma.insuranceClaim.upsert({
      where: { id: claim.id },
      update: {},
      create: claim as any
    })
  }

  // Create stage history for claims
  await prisma.vehicleStageHistory.createMany({
    data: [
      {
        vehicleId: 'vehicle-2',
        stage: 'claim_approved',
        dataJson: {
          claimId: 'claim-2',
          description: 'Windshield crack claim approved',
          previousStatus: 'review',
          newStatus: 'approved',
          updatedBy: adminUser.id
        },
        at: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        vehicleId: approvedVehicle.id,
        stage: 'claim_rejected',
        dataJson: {
          claimId: 'claim-3',
          description: 'Pre-existing damage claim rejected',
          previousStatus: 'review',
          newStatus: 'rejected',
          updatedBy: adminUser.id
        },
        at: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    ]
  })

  // Add service request to invoice (completed service)
  await prisma.invoiceLine.upsert({
    where: { id: 'demo-line-3' },
    update: {},
    create: {
      id: 'demo-line-3',
      invoiceId: invoice.id,
      itemType: 'service',
      description: 'Vehicle repair service - minor body work',
      qty: 1,
      unitPrice: 450.00,
      vehicleId: approvedVehicle.id
    }
  })

  // Update invoice totals to include the service
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      subtotal: 1950.00, // 1500 + 450
      vat: 195.00, // 10% of subtotal
      total: 2145.00 // subtotal + vat
    }
  })

  console.log('✅ Seed completed!')
  console.log('👤 Users created:')
  console.log('   - admin@demo.com / admin123 (admin, accountant, ops)')
  console.log('   - dealer@demo.com / dealer123 (dealer)')
  console.log('🚗 Sample vehicles, invoices, and vehicle intakes created')
  console.log('📋 Vehicle Intakes:')
  console.log('   - 1 pending intake (Honda Civic 2018)')
  console.log('   - 1 approved intake with vehicle (Honda Accord 2019)')
  console.log('📄 Titles:')
  console.log('   - 1 pending title (Honda Accord)')
  console.log('   - 1 received title (Toyota Corolla)')
  console.log('   - 1 packed title (Honda Accord 2019)')
  console.log('🔧 Service Requests:')
  console.log('   - 1 pending inspection request')
  console.log('   - 1 approved cleaning service ($150)')
  console.log('   - 1 completed repair service ($450)')
  console.log('🛡️ Insurance Claims:')
  console.log('   - 1 new hail damage claim')
  console.log('   - 1 approved windshield claim')
  console.log('   - 1 rejected pre-existing damage claim')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })