import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Temporary fix: return basic test data while fixing import issues
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isTarget = searchParams.get('isTarget');
    const source = searchParams.get('source');
    const pipelineId = searchParams.get('pipelineId');
    const organisationId = searchParams.get('organisationId');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    
    const testLeads = [
      // High-Priority Target Leads - Ready for Conversion
      {
        id: 'lead_1',
        title: 'Southwest Auto Mall Partnership',
        firstName: 'Michael',
        lastName: 'Thompson',
        email: 'michael.thompson@southwestautomall.com',
        phone: '+1-602-555-8901',
        company: 'Southwest Auto Mall',
        position: 'Operations Director',
        source: 'REFERRAL',
        status: 'QUALIFIED',
        isTarget: true,
        score: 95,
        pipelineId: 'pipeline-dealer-acquisition',
        organisationId: 'org_1',
        notes: 'High-potential dealer with 3 locations interested in premium vehicle processing. Ready for proposal.',
        customFields: {
          lead_source_details: 'Referred by AutoMax Luxury Dealership',
          estimated_monthly_volume: 250,
          decision_timeline: '30 days',
          budget_range: '1M-2M',
          competition: 'Currently using CarGurus Pro',
          pain_points: ['Manual processing delays', 'High transaction fees', 'Limited auction access']
        },
        createdAt: '2024-09-01T10:30:00Z',
        updatedAt: '2024-09-14T14:20:00Z'
      },
      {
        id: 'lead_2',
        title: 'National Fleet Integration Project',
        firstName: 'Jennifer',
        lastName: 'Davis',
        email: 'jennifer.davis@nationalfleetcorp.com',
        phone: '+1-214-555-7890',
        company: 'National Fleet Corp',
        position: 'Fleet Technology Manager',
        source: 'WEBSITE',
        status: 'QUALIFIED',
        isTarget: true,
        score: 88,
        pipelineId: 'pipeline-integration',
        organisationId: null,
        notes: 'Enterprise fleet management company seeking API integration for automated vehicle lifecycle management.',
        customFields: {
          lead_source_details: 'Downloaded whitepaper on fleet automation',
          company_size: '500+ vehicles',
          integration_timeline: '6 months',
          technical_requirements: ['REST API', 'Real-time tracking', 'Multi-location support'],
          current_solution: 'Legacy in-house system',
          decision_makers: ['CTO', 'Operations VP', 'IT Director']
        },
        createdAt: '2024-08-25T09:15:00Z',
        updatedAt: '2024-09-13T16:45:00Z'
      },
      {
        id: 'lead_3',
        title: 'Midwest Regional Dealer Network',
        firstName: 'Robert',
        lastName: 'Martinez',
        email: 'robert.martinez@midwestdealer.com',
        phone: '+1-312-555-6789',
        company: 'Midwest Regional Dealers',
        position: 'Regional Manager',
        source: 'TRADE_SHOW',
        status: 'NURTURING',
        isTarget: true,
        score: 75,
        pipelineId: 'pipeline-dealer-acquisition',
        organisationId: null,
        notes: 'Multi-location dealer group exploring centralized auction services. Strong interest but longer decision cycle.',
        customFields: {
          lead_source_details: 'Met at NADA 2024 - Booth #456',
          dealer_locations: 8,
          current_providers: ['Manheim', 'Copart'],
          evaluation_stage: 'Vendor comparison',
          key_concerns: ['Integration complexity', 'Training requirements', 'Cost vs current'],
          follow_up_date: '2024-10-01'
        },
        createdAt: '2024-08-15T14:00:00Z',
        updatedAt: '2024-09-12T11:30:00Z'
      },
      // Medium Priority Leads
      {
        id: 'lead_4',
        title: 'Classic Car Auction House Integration',
        firstName: 'Victoria',
        lastName: 'Sterling',
        email: 'victoria@classicauctions.com',
        phone: '+1-480-555-5678',
        company: 'Classic Car Auctions LLC',
        position: 'Technology Director',
        source: 'LINKEDIN',
        status: 'CONTACTED',
        isTarget: true,
        score: 65,
        pipelineId: 'pipeline-integration',
        organisationId: null,
        notes: 'Boutique auction house specializing in classic vehicles. Interested in custom portal development.',
        customFields: {
          specialization: 'Classic and vintage vehicles',
          auction_frequency: 'Monthly events',
          avg_vehicle_value: '50k-500k',
          tech_budget: '100k-300k',
          timeline: 'Q1 2025',
          special_requirements: ['Condition reporting', 'Provenance tracking', 'High-res imagery']
        },
        createdAt: '2024-09-02T16:20:00Z',
        updatedAt: '2024-09-10T13:15:00Z'
      },
      {
        id: 'lead_5',
        title: 'Transportation Logistics Partnership',
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        email: 'carlos.rodriguez@speedytransport.com',
        phone: '+1-713-555-4567',
        company: 'Speedy Transport Solutions',
        position: 'Business Development Manager',
        source: 'COLD_CALL',
        status: 'QUALIFIED',
        isTarget: true,
        score: 70,
        pipelineId: 'pipeline-integration',
        organisationId: null,
        notes: 'Regional transport company looking to expand into vehicle shipping. Strong growth potential.',
        customFields: {
          current_focus: 'Commercial freight',
          expansion_goals: 'Vehicle transport division',
          coverage_area: 'Texas, Oklahoma, Louisiana',
          fleet_capacity: '45 trucks',
          target_launch: 'Q2 2025',
          partnership_interest: ['Route planning', 'Load optimization', 'Customer portal']
        },
        createdAt: '2024-08-20T10:45:00Z',
        updatedAt: '2024-09-08T15:30:00Z'
      },
      {
        id: 'lead_6',
        title: 'International Shipping Portal Inquiry',
        firstName: 'Hiroshi',
        lastName: 'Yamamoto',
        email: 'h.yamamoto@pacificlogistics.jp',
        phone: '+81-3-5555-3456',
        company: 'Pacific Logistics Japan',
        position: 'International Operations Manager',
        source: 'REFERRAL',
        status: 'NURTURING',
        isTarget: true,
        score: 80,
        pipelineId: 'pipeline-integration',
        organisationId: null,
        notes: 'Japanese logistics company interested in US-Japan vehicle shipping portal. High value opportunity.',
        customFields: {
          lead_source_details: 'Referred by Pacific Shipping Solutions',
          shipping_routes: ['US West Coast to Tokyo', 'US West Coast to Yokohama'],
          vehicle_types: ['Luxury vehicles', 'Classic cars', 'Commercial vehicles'],
          volume_projection: '200-300 vehicles/month',
          language_requirements: ['Japanese', 'English'],
          compliance_needs: ['Japanese customs', 'DOT regulations', 'EPA certification']
        },
        createdAt: '2024-08-30T08:00:00Z',
        updatedAt: '2024-09-14T09:20:00Z'
      },
      // Early Stage Leads
      {
        id: 'lead_7',
        title: 'Small Town Dealer Inquiry',
        firstName: 'Betty',
        lastName: 'Johnson',
        email: 'betty@countrydealer.com',
        phone: '+1-417-555-2345',
        company: 'Country Motor Sales',
        position: 'Owner',
        source: 'WEBSITE',
        status: 'NEW',
        isTarget: false,
        score: 35,
        pipelineId: 'pipeline-dealer-acquisition',
        organisationId: null,
        notes: 'Small family dealership exploring digital solutions. Budget constraints but growing interest.',
        customFields: {
          dealership_size: 'Small (15-20 vehicles on lot)',
          family_business: true,
          years_in_business: 25,
          current_process: 'Manual paperwork and phone calls',
          budget_concerns: 'Very cost-sensitive',
          growth_goals: 'Modernize operations gradually'
        },
        createdAt: '2024-09-05T12:30:00Z',
        updatedAt: '2024-09-05T12:30:00Z'
      },
      {
        id: 'lead_8',
        title: 'Salvage Yard Processing Inquiry',
        firstName: 'Frank',
        lastName: 'Miller',
        email: 'frank.miller@salvageplus.com',
        phone: '+1-916-555-1234',
        company: 'SalvagePlus Auto Recovery',
        position: 'Operations Manager',
        source: 'TRADE_SHOW',
        status: 'CONTACTED',
        isTarget: false,
        score: 45,
        pipelineId: 'pipeline-integration',
        organisationId: null,
        notes: 'Salvage yard looking for inventory management integration. Exploring options.',
        customFields: {
          lead_source_details: 'IAAI Convention 2024',
          business_type: 'Salvage and recovery',
          inventory_size: '500-800 vehicles',
          processing_volume: '50-75 vehicles/week',
          current_challenges: ['Manual inventory tracking', 'Auction scheduling', 'Part cataloging'],
          evaluation_timeline: '6-9 months'
        },
        createdAt: '2024-08-28T14:45:00Z',
        updatedAt: '2024-09-06T10:15:00Z'
      },
      // Cold Leads - Lower Priority
      {
        id: 'lead_9',
        title: 'Independent Lot Management',
        firstName: 'Steve',
        lastName: 'Wilson',
        email: 'steve@autolotmanager.com',
        phone: '+1-303-555-9876',
        company: 'Auto Lot Management Services',
        position: 'Service Manager',
        source: 'COLD_EMAIL',
        status: 'NEW',
        isTarget: false,
        score: 25,
        pipelineId: 'pipeline-dealer-acquisition',
        organisationId: null,
        notes: 'Service company managing multiple small lots. Very early inquiry stage.',
        customFields: {
          service_model: 'Manages inventory for small dealers',
          client_base: '12 small dealerships',
          geographic_focus: 'Colorado and Wyoming',
          interest_level: 'Information gathering only',
          budget_timeline: 'No immediate budget allocated',
          next_steps: 'Educational content and case studies'
        },
        createdAt: '2024-09-08T11:20:00Z',
        updatedAt: '2024-09-08T11:20:00Z'
      },
      {
        id: 'lead_10',
        title: 'RV and Specialty Vehicle Dealer',
        firstName: 'Nancy',
        lastName: 'Peterson',
        email: 'nancy@rvspecialty.com',
        phone: '+1-541-555-8765',
        company: 'RV & Specialty Vehicle Center',
        position: 'General Manager',
        source: 'REFERRAL',
        status: 'NURTURING',
        isTarget: false,
        score: 40,
        pipelineId: 'pipeline-dealer-acquisition',
        organisationId: null,
        notes: 'Specialty dealer focused on RVs and recreational vehicles. Niche market opportunity.',
        customFields: {
          lead_source_details: 'Referred by Johnson Family Auto',
          specialization: 'RVs, boats, motorcycles, ATVs',
          seasonal_business: 'Peak season: March-September',
          inventory_challenges: 'Large vehicle storage and transport',
          market_position: 'Regional leader in specialty vehicles',
          expansion_plans: 'Considering additional locations'
        },
        createdAt: '2024-08-18T15:00:00Z',
        updatedAt: '2024-09-11T14:30:00Z'
      },
      // Marketing Qualified Leads
      {
        id: 'lead_11',
        title: 'Digital Marketing Agency Partnership',
        firstName: 'Alex',
        lastName: 'Chen',
        email: 'alex.chen@digitalautomktg.com',
        phone: '+1-408-555-7654',
        company: 'Digital Auto Marketing',
        position: 'Partnership Director',
        source: 'LINKEDIN',
        status: 'QUALIFIED',
        isTarget: true,
        score: 60,
        pipelineId: 'pipeline-integration',
        organisationId: null,
        notes: 'Marketing agency wanting to integrate our services into their dealer client solutions.',
        customFields: {
          agency_model: 'Full-service automotive marketing',
          client_portfolio: '50+ automotive dealers',
          integration_goals: 'White-label auction and transport services',
          revenue_sharing: 'Open to partnership models',
          target_clients: 'Mid-size to large dealerships',
          technical_capability: 'Strong API integration experience'
        },
        createdAt: '2024-09-01T13:45:00Z',
        updatedAt: '2024-09-12T16:00:00Z'
      },
      // Converted Lead Example
      {
        id: 'lead_12',
        title: 'Express Auto Transport Integration',
        firstName: 'Carlos',
        lastName: 'Vasquez',
        email: 'carlos.vasquez@expressautotransport.com',
        phone: '+1-214-555-7447',
        company: 'Express Auto Transport',
        position: 'Dispatch Manager',
        source: 'TRADE_SHOW',
        status: 'CONVERTED',
        isTarget: true,
        score: 90,
        pipelineId: 'pipeline-integration',
        organisationId: 'org_6',
        convertedToDealId: 'deal_5',
        convertedAt: '2024-08-30T13:00:00Z',
        notes: 'Successfully converted to active integration deal. Now in development phase.',
        customFields: {
          lead_source_details: 'Met at Transportation & Logistics Expo',
          conversion_timeline: '45 days from first contact',
          final_decision_factors: ['API capabilities', 'Real-time tracking', 'Competitive pricing'],
          deal_value: 450000,
          implementation_timeline: '4 months',
          success_metrics: ['API uptime 99.9%', 'Real-time tracking accuracy', 'Customer satisfaction']
        },
        createdAt: '2024-07-15T10:00:00Z',
        updatedAt: '2024-08-30T13:00:00Z'
      }
    ];
    
    let filteredLeads = testLeads;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLeads = filteredLeads.filter(lead => 
        lead.title.toLowerCase().includes(searchLower) ||
        (lead.firstName && lead.firstName.toLowerCase().includes(searchLower)) ||
        (lead.lastName && lead.lastName.toLowerCase().includes(searchLower)) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.company && lead.company.toLowerCase().includes(searchLower)) ||
        (lead.notes && lead.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply target filter
    if (isTarget !== null) {
      filteredLeads = filteredLeads.filter(lead => lead.isTarget === (isTarget === 'true'));
    }
    
    // Apply source filter
    if (source) {
      const sourceLower = source.toLowerCase();
      filteredLeads = filteredLeads.filter(lead => 
        lead.source && lead.source.toLowerCase().includes(sourceLower)
      );
    }
    
    // Apply pipeline filter
    if (pipelineId) {
      filteredLeads = filteredLeads.filter(lead => lead.pipelineId === pipelineId);
    }
    
    // Apply organisation filter
    if (organisationId) {
      filteredLeads = filteredLeads.filter(lead => lead.organisationId === organisationId);
    }
    
    // Apply score range filters
    if (minScore) {
      const min = parseInt(minScore);
      if (!isNaN(min)) {
        filteredLeads = filteredLeads.filter(lead => lead.score && lead.score >= min);
      }
    }
    
    if (maxScore) {
      const max = parseInt(maxScore);
      if (!isNaN(max)) {
        filteredLeads = filteredLeads.filter(lead => lead.score && lead.score <= max);
      }
    }
    
    return NextResponse.json(filteredLeads);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Temporary fix: return created lead data
    const newLead = {
      id: 'lead_new',
      ...body,
      status: body.status || 'NEW',
      isTarget: body.isTarget !== false, // default to true
      score: body.score || 50,
      customFields: body.customFields || {},
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json(newLead, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}