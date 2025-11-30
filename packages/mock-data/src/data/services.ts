import { ServiceRequest, InsuranceClaim, Title, VehicleIntake } from '../types';

export const serviceRequests: ServiceRequest[] = [

  // Premium Video Services
  {
    id: 'service-video-1',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-from-intake-1',
    type: 'video_service',
    status: 'completed',
    notes: 'Detailed video documentation with startup test - Honda Civic 2018. Video shows exterior, interior, engine bay, and successful startup.',
    priceUSD: 50,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-16'),
    version: 1
  },
  {
    id: 'service-video-2',
    orgId: 'org-dealer-3',
    vehicleId: 'vehicle-13',
    type: 'video_service',
    status: 'approved',
    notes: 'Premium video service for BMW M5 2019 - detailed documentation including performance test',
    priceUSD: 50,
    createdAt: new Date('2024-03-09'),
    updatedAt: new Date('2024-03-10'),
    version: 1
  },

  // VIP Full Services
  {
    id: 'service-vip-full-1',
    orgId: 'org-dealer-3',
    vehicleId: 'vehicle-15',
    type: 'vip_full',
    status: 'in_progress',
    notes: 'VIP Full Service Package - Mercedes S-Class 2020. Includes: immediate payment (10 days to pay), detailed photos/video, damage sealing, absorbents, plastic covering, priority container loading. 1% daily rate.',
    priceUSD: 850,
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-14'),
    version: 2
  },
  {
    id: 'service-vip-full-2',
    orgId: 'org-dealer-3',
    vehicleId: 'vehicle-14',
    type: 'vip_full',
    status: 'completed',
    notes: 'VIP Full Service Package - Audi RS7 2017. All premium services delivered including parts installation and priority shipping.',
    priceUSD: 720,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-15'),
    version: 1
  },

  // VIP Fastest Services
  {
    id: 'service-vip-fastest-1',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-5',
    type: 'vip_fastest',
    status: 'completed',
    notes: 'VIP Fastest Service - BMW 328i 2016. Priority container loading, 10-day guarantee, immediate payment option. 0.5% daily rate.',
    priceUSD: 250,
    createdAt: new Date('2024-03-04'),
    updatedAt: new Date('2024-03-06'),
    version: 1
  },
  {
    id: 'service-vip-fastest-2',
    orgId: 'united-cars',
    vehicleId: 'vehicle-9',
    type: 'vip_fastest',
    status: 'pending',
    notes: 'VIP Fastest Service requested - Ford F-150 2020. Fast-track processing with priority handling.',
    priceUSD: 300,
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-03-11'),
    version: 0
  },

  // Plastic Covering Services
  {
    id: 'service-plastic-1',
    orgId: 'united-cars',
    vehicleId: 'vehicle-10',
    type: 'plastic_covering',
    status: 'completed',
    notes: 'Clear plastic covering applied - Mazda CX-5 2018. Full vehicle protection from dirt and dust during container transport.',
    priceUSD: 50,
    createdAt: new Date('2024-03-07'),
    updatedAt: new Date('2024-03-08'),
    version: 1
  },
  {
    id: 'service-plastic-2',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-6',
    type: 'plastic_covering',
    status: 'approved',
    notes: 'Clear plastic covering scheduled - Audi A4 2022. Protection during ocean transport.',
    priceUSD: 50,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-11'),
    version: 1
  },

  // Extra Photos Services
  {
    id: 'service-photos-1',
    orgId: 'org-dealer-2',
    vehicleId: 'vehicle-8',
    type: 'extra_photos',
    status: 'completed',
    notes: 'Extra detailed photography - Toyota Highlander 2017. Additional damage documentation and parts inventory photos provided.',
    priceUSD: 25,
    createdAt: new Date('2024-03-06'),
    updatedAt: new Date('2024-03-07'),
    version: 1
  },
  {
    id: 'service-photos-2',
    orgId: 'united-cars',
    vehicleId: 'vehicle-12',
    type: 'extra_photos',
    status: 'completed',
    notes: 'Extra photography service - Honda Civic 2021. Detailed undercarriage and engine bay photos.',
    priceUSD: 25,
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-09'),
    version: 1
  },

  // Window Covering Services
  {
    id: 'service-window-1',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-4',
    type: 'window_covering',
    status: 'completed',
    notes: 'Window covering with wrap film - Toyota Camry 2019. Front windshield and side windows protected to prevent water ingress. 3 pieces covered.',
    priceUSD: 75,
    createdAt: new Date('2024-03-03'),
    updatedAt: new Date('2024-03-04'),
    version: 1
  },
  {
    id: 'service-window-2',
    orgId: 'united-cars',
    vehicleId: 'vehicle-11',
    type: 'window_covering',
    status: 'completed',
    notes: 'Window wrap film protection - Hyundai Sonata 2019. Windshield and rear window sealed. 2 pieces.',
    priceUSD: 50,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-21'),
    version: 1
  },


  // Moisture Absorber Services
  {
    id: 'service-moisture-1',
    orgId: 'united-cars',
    vehicleId: 'vehicle-2',
    type: 'moisture_absorber',
    status: 'completed',
    notes: 'Moisture absorber package - Toyota Corolla 2018. 3 hanging bags installed to prevent musty odors during ocean transport.',
    priceUSD: 50,
    createdAt: new Date('2024-03-02'),
    updatedAt: new Date('2024-03-03'),
    version: 1
  },
  {
    id: 'service-moisture-2',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-from-intake-1',
    type: 'moisture_absorber',
    status: 'pending',
    notes: 'Moisture absorber requested - Honda Civic 2018. Recommended for flood protection during shipping.',
    priceUSD: 50,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    version: 0
  },

  // Additional Premium Services for High-Value Vehicles
  {
    id: 'service-combo-1',
    orgId: 'org-dealer-3',
    vehicleId: 'vehicle-13',
    type: 'extra_photos',
    status: 'completed',
    notes: 'Premium photography package - BMW M5 2019. Extensive documentation for luxury vehicle including detailed damage assessment.',
    priceUSD: 25,
    createdAt: new Date('2024-03-09'),
    updatedAt: new Date('2024-03-10'),
    version: 1
  },
  {
    id: 'service-combo-2',
    orgId: 'org-dealer-3',
    vehicleId: 'vehicle-13',
    type: 'plastic_covering',
    status: 'completed',
    notes: 'Premium plastic covering - BMW M5 2019. Full vehicle protection with high-grade clear plastic film.',
    priceUSD: 50,
    createdAt: new Date('2024-03-09'),
    updatedAt: new Date('2024-03-10'),
    version: 1
  },
  {
    id: 'service-combo-3',
    orgId: 'org-dealer-3',
    vehicleId: 'vehicle-15',
    type: 'moisture_absorber',
    status: 'in_progress',
    notes: 'Premium moisture control - Mercedes S-Class 2020. Industrial-grade moisture absorbers for luxury vehicle protection.',
    priceUSD: 50,
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-13'),
    version: 1
  },

  // Rejected Service Example
  {
    id: 'service-rejected-1',
    orgId: 'org-dealer-2',
    vehicleId: 'vehicle-7',
    type: 'vip_full',
    status: 'rejected',
    notes: 'VIP Full Service request - Nissan Altima 2016. Service not justified for vehicle value.',
    priceUSD: null,
    rejectionReason: 'Vehicle value too low for VIP Full service. Standard processing recommended.',
    rejectedBy: 'user-admin-1',
    rejectedAt: new Date('2024-03-14'),
    statusHistory: [
      { id: 'hist-1', status: 'pending', changedAt: new Date('2024-03-13'), changedBy: 'user-dealer-2', notes: 'Initial request' },
      { id: 'hist-2', status: 'rejected', changedAt: new Date('2024-03-14'), changedBy: 'user-admin-1', notes: 'Vehicle value too low' }
    ],
    createdAt: new Date('2024-03-13'),
    updatedAt: new Date('2024-03-14'),
    version: 1
  }
];

export const insuranceClaims: InsuranceClaim[] = [
  // Traditional Damage Claims - Various Statuses
  {
    id: 'claim-1',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-2',
    serviceRequestId: null,
    claimType: 'damage',
    status: 'new',
    incidentAt: new Date('2024-03-18'),
    description: 'Hail damage on roof and hood during transport - Toyota Corolla 2018',
    photos: ['hail_damage_1.jpg', 'hail_damage_2.jpg'],
    createdAt: new Date('2024-03-18'),
    updatedAt: new Date('2024-03-18'),
    version: 0
  },
  
  {
    id: 'claim-2',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-5',
    serviceRequestId: null,
    claimType: 'damage',
    status: 'paid',
    incidentAt: new Date('2024-03-06'),
    description: 'Windshield crack during transport - BMW 328i 2016',
    photos: ['windshield_crack_1.jpg', 'windshield_crack_2.jpg'],
    assignedTo: 'user-claims-1',
    reviewNotes: 'Damage confirmed. Transport company liability established.',
    reviewStartedAt: new Date('2024-03-07'),
    settlementAmount: 350,
    settlementReason: 'Windshield replacement covered under transport insurance',
    processedBy: 'user-admin-1',
    settledAt: new Date('2024-03-09'),
    paidAt: new Date('2024-03-10'),
    claimHistory: [
      { id: 'ch-1', status: 'new', changedAt: new Date('2024-03-06'), changedBy: 'user-dealer-1', notes: 'Initial claim submission' },
      { id: 'ch-2', status: 'investigating', changedAt: new Date('2024-03-07'), changedBy: 'user-claims-1', notes: 'Reviewing transport records' },
      { id: 'ch-3', status: 'approved', changedAt: new Date('2024-03-08'), changedBy: 'user-claims-1', notes: 'Damage confirmed, liability established' },
      { id: 'ch-4', status: 'settled', changedAt: new Date('2024-03-09'), changedBy: 'user-admin-1', notes: 'Settlement approved - $350' },
      { id: 'ch-5', status: 'paid', changedAt: new Date('2024-03-10'), changedBy: 'user-admin-1', notes: 'Payment processed to dealer account' }
    ],
    createdAt: new Date('2024-03-06'),
    updatedAt: new Date('2024-03-10'),
    version: 5
  },

  {
    id: 'claim-3',
    orgId: 'org-dealer-2',
    vehicleId: 'vehicle-7',
    serviceRequestId: null,
    claimType: 'damage',
    status: 'investigating',
    incidentAt: new Date('2024-03-15'),
    description: 'Side mirror damage during container loading - Nissan Altima 2016',
    photos: ['mirror_damage_1.jpg', 'mirror_damage_2.jpg', 'container_loading.jpg'],
    assignedTo: 'user-claims-1',
    reviewNotes: 'Reviewing loading footage and worker statements. Damage appears consistent with loading equipment contact.',
    reviewStartedAt: new Date('2024-03-16'),
    claimHistory: [
      { id: 'ch-6', status: 'new', changedAt: new Date('2024-03-15'), changedBy: 'user-dealer-2', notes: 'Mirror damage reported' },
      { id: 'ch-7', status: 'investigating', changedAt: new Date('2024-03-16'), changedBy: 'user-claims-1', notes: 'Investigation started - requesting loading footage' }
    ],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-16'),
    version: 2
  },

  {
    id: 'claim-4',
    orgId: 'org-dealer-3',
    vehicleId: 'vehicle-11',
    serviceRequestId: null,
    claimType: 'damage',
    status: 'rejected',
    incidentAt: new Date('2024-02-25'),
    description: 'Pre-existing damage claim - scratches on left side - Hyundai Sonata 2019',
    photos: ['scratch_claim_1.jpg', 'scratch_claim_2.jpg'],
    assignedTo: 'user-claims-1',
    reviewNotes: 'Review completed. Damage appears to be pre-existing based on auction photos and condition report. Scratches show weathering inconsistent with recent transport damage.',
    reviewStartedAt: new Date('2024-02-26'),
    claimHistory: [
      { id: 'ch-8', status: 'new', changedAt: new Date('2024-02-25'), changedBy: 'user-dealer-3', notes: 'Scratch damage claimed' },
      { id: 'ch-9', status: 'investigating', changedAt: new Date('2024-02-26'), changedBy: 'user-claims-1', notes: 'Reviewing auction photos and transport records' },
      { id: 'ch-10', status: 'rejected', changedAt: new Date('2024-02-28'), changedBy: 'user-claims-1', notes: 'Damage determined to be pre-existing' }
    ],
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-02-28'),
    version: 3
  },

  {
    id: 'claim-5',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-6',
    serviceRequestId: null,
    claimType: 'damage',
    status: 'under_review',
    incidentAt: new Date('2024-03-12'),
    description: 'Interior water damage - seat staining and electronics malfunction - Audi A4 2022',
    photos: ['water_damage_interior_1.jpg', 'water_damage_interior_2.jpg', 'electronics_damage.jpg'],
    assignedTo: 'user-claims-1',
    reviewNotes: 'Complex claim involving both physical and electrical damage. Coordinating with technical assessment team for electronics evaluation. Estimated settlement range $1,200-$2,800.',
    reviewStartedAt: new Date('2024-03-13'),
    claimHistory: [
      { id: 'ch-11', status: 'new', changedAt: new Date('2024-03-12'), changedBy: 'user-dealer-1', notes: 'Water damage discovered upon delivery' },
      { id: 'ch-12', status: 'investigating', changedAt: new Date('2024-03-13'), changedBy: 'user-claims-1', notes: 'Initial assessment - significant water ingress' },
      { id: 'ch-13', status: 'under_review', changedAt: new Date('2024-03-14'), changedBy: 'user-claims-1', notes: 'Technical assessment requested for electronics damage' }
    ],
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-14'),
    version: 3
  },

  // Service Dispute Claims - Full Workflow Examples
  {
    id: 'claim-service-dispute-1',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-3',
    serviceRequestId: 'service-plastic-1',
    claimType: 'service_dispute',
    status: 'under_review',
    incidentAt: new Date('2024-03-08'),
    description: 'Plastic covering service - Ford Explorer 2020. Covering was not applied properly.',
    photos: ['poor_covering_1.jpg', 'water_damage_result.jpg'],
    disputeReason: 'Plastic covering was not applied correctly - left gaps that allowed water ingress during transport',
    disputeEvidence: ['damage_photo_1.jpg', 'damage_photo_2.jpg', 'original_covering_photo.jpg'],
    disputedBy: 'user-dealer-1',
    disputedAt: new Date('2024-03-16'),
    assignedTo: 'user-claims-1',
    reviewNotes: 'Investigating claim. Reviewing photos and service completion records. Site inspection scheduled. Initial assessment suggests improper application.',
    reviewStartedAt: new Date('2024-03-17'),
    claimHistory: [
      { id: 'ch-14', status: 'new', changedAt: new Date('2024-03-16'), changedBy: 'user-dealer-1', notes: 'Service dispute filed - improper covering application' },
      { id: 'ch-15', status: 'under_review', changedAt: new Date('2024-03-17'), changedBy: 'user-claims-1', notes: 'Assigned for investigation - requesting service photos' }
    ],
    createdAt: new Date('2024-03-16'),
    updatedAt: new Date('2024-03-17'),
    version: 2
  },

  {
    id: 'claim-service-dispute-2',
    orgId: 'org-dealer-3',
    vehicleId: 'vehicle-16',
    serviceRequestId: 'service-video-1',
    claimType: 'quality_issue',
    status: 'paid',
    incidentAt: new Date('2024-03-09'),
    description: 'Video service - BMW X5 2021. Video quality was poor and unusable for dealer purposes.',
    photos: ['poor_video_screenshot_1.jpg', 'poor_video_screenshot_2.jpg'],
    disputeReason: 'Video quality was extremely poor - blurry footage, bad lighting, could not assess vehicle condition',
    disputeEvidence: ['poor_video_screenshot_1.jpg', 'poor_video_screenshot_2.jpg', 'quality_comparison.jpg'],
    disputedBy: 'user-dealer-3',
    disputedAt: new Date('2024-03-10'),
    assignedTo: 'user-claims-1',
    reviewNotes: 'Review completed. Video quality was indeed substandard. Service standards not met. Partial refund approved.',
    reviewStartedAt: new Date('2024-03-11'),
    settlementAmount: 25,
    settlementReason: 'Partial refund due to substandard video quality - 50% of service fee',
    processedBy: 'user-admin-1',
    settledAt: new Date('2024-03-13'),
    paidAt: new Date('2024-03-14'),
    claimHistory: [
      { id: 'ch-16', status: 'new', changedAt: new Date('2024-03-10'), changedBy: 'user-dealer-3', notes: 'Quality issue reported - video unusable' },
      { id: 'ch-17', status: 'investigating', changedAt: new Date('2024-03-11'), changedBy: 'user-claims-1', notes: 'Reviewing video quality standards' },
      { id: 'ch-18', status: 'under_review', changedAt: new Date('2024-03-12'), changedBy: 'user-claims-1', notes: 'Quality assessment completed - standards not met' },
      { id: 'ch-19', status: 'settled', changedAt: new Date('2024-03-13'), changedBy: 'user-admin-1', notes: 'Partial refund approved - $25' },
      { id: 'ch-20', status: 'paid', changedAt: new Date('2024-03-14'), changedBy: 'user-admin-1', notes: 'Refund processed to dealer balance' }
    ],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-14'),
    version: 5
  },

  // Billing Dispute Claims
  {
    id: 'claim-billing-1',
    orgId: 'org-dealer-2',
    vehicleId: 'vehicle-8',
    serviceRequestId: 'service-window-1',
    claimType: 'billing_dispute',
    status: 'investigating',
    incidentAt: new Date('2024-03-11'),
    description: 'Window covering billing dispute - Toyota Highlander 2017. Charged for 5 windows, only 3 were covered.',
    photos: ['window_coverage_actual.jpg', 'invoice_dispute.jpg'],
    disputeReason: 'Billed for covering 5 windows ($125) but only 3 windows were actually covered. Should be charged $75.',
    disputeEvidence: ['window_count_photo.jpg', 'original_quote.jpg'],
    disputedBy: 'user-dealer-2',
    disputedAt: new Date('2024-03-11'),
    assignedTo: 'user-claims-1',
    reviewNotes: 'Reviewing service completion photos and billing records. Initial review suggests overbilling occurred.',
    reviewStartedAt: new Date('2024-03-12'),
    claimHistory: [
      { id: 'ch-21', status: 'new', changedAt: new Date('2024-03-11'), changedBy: 'user-dealer-2', notes: 'Billing discrepancy reported' },
      { id: 'ch-22', status: 'investigating', changedAt: new Date('2024-03-12'), changedBy: 'user-claims-1', notes: 'Reviewing service photos and billing records' }
    ],
    createdAt: new Date('2024-03-11'),
    updatedAt: new Date('2024-03-12'),
    version: 2
  },

  // Additional Quality Issue Claim
  {
    id: 'claim-quality-1',
    orgId: 'org-dealer-1',
    vehicleId: 'vehicle-4',
    serviceRequestId: 'service-moisture-1',
    claimType: 'quality_issue',
    status: 'closed',
    incidentAt: new Date('2024-03-04'),
    description: 'Moisture absorber service - Toyota Camry 2019. Absorber bags were not properly secured.',
    photos: ['loose_bags.jpg', 'improper_placement.jpg'],
    disputeReason: 'Moisture absorber bags were not secured and fell during transport, providing no protection',
    disputeEvidence: ['loose_bags.jpg', 'moisture_damage_result.jpg'],
    disputedBy: 'user-dealer-1',
    disputedAt: new Date('2024-03-05'),
    assignedTo: 'user-claims-1',
    reviewNotes: 'Review completed. Service was improperly executed but no additional damage occurred. Service fee refunded.',
    reviewStartedAt: new Date('2024-03-06'),
    settlementAmount: 50,
    settlementReason: 'Full refund - service not properly executed',
    processedBy: 'user-admin-1',
    settledAt: new Date('2024-03-08'),
    paidAt: new Date('2024-03-09'),
    claimHistory: [
      { id: 'ch-23', status: 'new', changedAt: new Date('2024-03-05'), changedBy: 'user-dealer-1', notes: 'Service execution issue reported' },
      { id: 'ch-24', status: 'investigating', changedAt: new Date('2024-03-06'), changedBy: 'user-claims-1', notes: 'Reviewing service completion photos' },
      { id: 'ch-25', status: 'approved', changedAt: new Date('2024-03-07'), changedBy: 'user-claims-1', notes: 'Service failure confirmed' },
      { id: 'ch-26', status: 'settled', changedAt: new Date('2024-03-08'), changedBy: 'user-admin-1', notes: 'Full refund approved' },
      { id: 'ch-27', status: 'paid', changedAt: new Date('2024-03-09'), changedBy: 'user-admin-1', notes: 'Refund processed' },
      { id: 'ch-28', status: 'closed', changedAt: new Date('2024-03-10'), changedBy: 'user-admin-1', notes: 'Case closed - resolved' }
    ],
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-10'),
    version: 6
  }
];

export const vehicleIntakes: VehicleIntake[] = [
  {
    id: 'intake-1',
    orgId: 'org-dealer-1',
    createdById: 'user-dealer-1',
    status: 'APPROVED',
    auction: 'COPART',
    auctionLot: '12345678',
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Civic',
    year: 2018,
    purchasePriceUSD: 8500,
    auctionLocationId: 'copart-dallas',
    usPort: 'TX - Texas',
    destinationPort: 'Rotterdam',
    insurance: '1%',
    paymentMethod: 'DIRECT_TO_AUCTION',
    isPrivateLocation: false,
    pickupAddress: null,
    contactPerson: null,
    contactPhone: null,
    insuranceValue: null,
    paymentConfirmations: [
      {
        id: 'conf-1',
        filename: 'payment_receipt_copart.pdf',
        url: '/uploads/intakes/intake-1/payment_receipt_copart.pdf',
        uploadedAt: new Date('2024-03-14')
      }
    ],
    notes: 'Clean title, minor damage on left side',
    createdAt: new Date('2024-03-14'),
    reviewedAt: new Date('2024-03-15'),
    reviewedById: 'user-admin-1'
  },
  {
    id: 'intake-5',
    orgId: 'org-dealer-1',
    createdById: 'user-dealer-1',
    status: 'PENDING',
    auction: 'COPART',
    auctionLot: '55667788',
    vin: 'JH4TB2H26CC000123',
    make: 'Acura',
    model: 'TLX',
    year: 2021,
    purchasePriceUSD: 22500,
    auctionLocationId: 'copart-atlanta',
    usPort: 'GA - Georgia',
    destinationPort: 'Batumi',
    insurance: '2%',
    paymentMethod: 'DIRECT_TO_AUCTION',
    isPrivateLocation: false,
    pickupAddress: null,
    contactPerson: null,
    contactPhone: null,
    insuranceValue: null,
    paymentConfirmations: [
      {
        id: 'conf-5',
        filename: 'copart_payment_acura.pdf',
        url: '/uploads/intakes/intake-5/copart_payment_acura.pdf',
        uploadedAt: new Date('2024-03-16')
      }
    ],
    notes: 'New arrival, excellent condition - dealer just declared this win',
    createdAt: new Date('2024-03-16'),
    reviewedAt: null,
    reviewedById: null
  },
  {
    id: 'intake-2',
    orgId: 'org-dealer-2',
    createdById: 'user-dealer-1',
    status: 'APPROVED',
    auction: 'IAA',
    auctionLot: '87654321',
    vin: '1HGBH41JXMN556789',
    make: 'Honda',
    model: 'Accord',
    year: 2019,
    purchasePriceUSD: 12500,
    auctionLocationId: 'iaa-chicago',
    usPort: 'NY - New York',
    destinationPort: 'Hamburg',
    insurance: '2%',
    paymentMethod: 'COMPANY_PAYS',
    isPrivateLocation: false,
    pickupAddress: null,
    contactPerson: null,
    contactPhone: null,
    insuranceValue: null,
    paymentConfirmations: [
      {
        id: 'conf-2',
        filename: 'wire_transfer_confirmation.pdf',
        url: '/uploads/intakes/intake-2/wire_transfer_confirmation.pdf',
        uploadedAt: new Date('2024-03-10')
      }
    ],
    notes: 'Excellent condition, approved for processing',
    createdAt: new Date('2024-03-10'),
    reviewedAt: new Date('2024-03-11'),
    reviewedById: 'user-admin-1'
  },
  {
    id: 'intake-3',
    orgId: 'org-dealer-3',
    createdById: 'user-dealer-1',
    status: 'REJECTED',
    auction: 'COPART',
    auctionLot: '99887766',
    vin: '2C3CDXBG5CH234567',
    make: 'Dodge',
    model: 'Charger',
    year: 2012,
    purchasePriceUSD: 5500,
    auctionLocationId: 'copart-miami',
    usPort: 'FL - Florida',
    destinationPort: 'Rotterdam',
    insurance: 'no',
    paymentMethod: 'DIRECT_TO_AUCTION',
    isPrivateLocation: false,
    pickupAddress: null,
    contactPerson: null,
    contactPhone: null,
    insuranceValue: null,
    paymentConfirmations: [],
    notes: 'Too much damage, not worth importing',
    createdAt: new Date('2024-03-08'),
    reviewedAt: new Date('2024-03-09'),
    reviewedById: 'user-admin-1'
  },
  {
    id: 'intake-4',
    orgId: 'org-dealer-1',
    createdById: 'user-dealer-1',
    status: 'PENDING',
    auction: 'PRIVATE',
    auctionLot: null,
    vin: 'WDCTG4GB4JJ516956',
    make: 'Mercedes',
    model: 'C-Class',
    year: 2020,
    purchasePriceUSD: 18500,
    auctionLocationId: null,
    usPort: 'GA - Georgia',
    destinationPort: 'Poti',
    insurance: '1%',
    paymentMethod: 'COMPANY_PAYS',
    isPrivateLocation: true,
    pickupAddress: '123 Main St, Atlanta, GA 30309\nPrivate garage, unit B',
    contactPerson: 'John Smith',
    contactPhone: '+1-555-123-4567',
    insuranceValue: 18500,
    paymentConfirmations: [
      {
        id: 'conf-4',
        filename: 'private_sale_receipt.pdf',
        url: '/uploads/intakes/intake-4/private_sale_receipt.pdf',
        uploadedAt: new Date('2024-03-15')
      }
    ],
    notes: 'Private sale from individual seller, excellent condition',
    createdAt: new Date('2024-03-15'),
    reviewedAt: null,
    reviewedById: null
  }
];