import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Temporary fix: return basic test data while fixing import issues
    const testConnections = [
      {
        id: 'conn_1',
        fromOrganisationId: 'org_1',
        toOrganisationId: 'org_2',
        type: 'BUSINESS_PARTNER',
        description: 'Strategic partnership for vehicle logistics',
        startDate: new Date('2024-01-15').toISOString(),
        endDate: null,
        metadata: { partnershipLevel: 'tier1' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'conn_2',
        fromOrganisationId: 'org_2',
        toOrganisationId: 'org_3',
        type: 'SUPPLIER',
        description: 'Vehicle parts supplier relationship',
        startDate: new Date('2024-02-01').toISOString(),
        endDate: null,
        metadata: { contractValue: 250000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'conn_3',
        fromOrganisationId: 'org_1',
        toOrganisationId: 'org_4',
        type: 'CLIENT',
        description: 'Regular vehicle procurement client',
        startDate: new Date('2023-12-01').toISOString(),
        endDate: null,
        metadata: { monthlyCutoff: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'conn_4',
        fromOrganisationId: 'org_3',
        toOrganisationId: 'org_1',
        type: 'VENDOR',
        description: 'Transportation service vendor',
        startDate: new Date('2024-03-10').toISOString(),
        endDate: null,
        metadata: { serviceType: 'transportation' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const type = searchParams.get('type');
    const direction = searchParams.get('direction');
    
    let connections = [...testConnections];
    
    if (orgId) {
      // Filter connections for a specific organisation
      switch (direction) {
        case 'incoming':
          connections = connections.filter(conn => conn.toOrganisationId === orgId);
          break;
        case 'outgoing':
          connections = connections.filter(conn => conn.fromOrganisationId === orgId);
          break;
        default:
          connections = connections.filter(conn => 
            conn.fromOrganisationId === orgId || conn.toOrganisationId === orgId
          );
      }
      
      // Filter by type if specified
      if (type) {
        connections = connections.filter(conn => conn.type === type);
      }
    }
    
    return NextResponse.json(connections);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch organisation connections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.fromOrganisationId || !body.toOrganisationId || !body.type) {
      return NextResponse.json(
        { error: 'fromOrganisationId, toOrganisationId, and type are required' },
        { status: 400 }
      );
    }
    
    // Temporary fix: return created connection data
    const newConnection = {
      id: 'conn_new',
      fromOrganisationId: body.fromOrganisationId,
      toOrganisationId: body.toOrganisationId,
      type: body.type,
      description: body.description || '',
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || null,
      metadata: body.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(newConnection, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create organisation connection' },
      { status: 500 }
    );
  }
}