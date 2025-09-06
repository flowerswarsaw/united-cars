import { NextRequest, NextResponse } from 'next/server';
import { organisationConnectionRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { organisationConnectionSchema, OrganisationRelationType } from '@united-cars/crm-core';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const type = searchParams.get('type');
    const direction = searchParams.get('direction'); // 'incoming', 'outgoing', 'all'
    
    if (orgId) {
      // Get connections for a specific organisation
      let connections;
      
      switch (direction) {
        case 'incoming':
          connections = await organisationConnectionRepository.getIncomingConnections(orgId);
          break;
        case 'outgoing':
          connections = await organisationConnectionRepository.getOutgoingConnections(orgId);
          break;
        default:
          connections = await organisationConnectionRepository.getConnectionsForOrganisation(orgId);
      }
      
      // Filter by type if specified
      if (type && Object.values(OrganisationRelationType).includes(type as OrganisationRelationType)) {
        connections = connections.filter(conn => conn.type === type);
      }
      
      return NextResponse.json(connections);
    }
    
    // Get all connections
    const connections = await organisationConnectionRepository.list();
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
    
    // Check if connection already exists
    const existingConnection = await organisationConnectionRepository.findConnection(
      body.fromOrganisationId,
      body.toOrganisationId,
      body.type
    );
    
    if (existingConnection) {
      return NextResponse.json(
        { error: 'Connection already exists between these organisations' },
        { status: 409 }
      );
    }
    
    // Create the connection
    const connection = await organisationConnectionRepository.createConnection(
      body.fromOrganisationId,
      body.toOrganisationId,
      body.type,
      {
        description: body.description,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        metadata: body.metadata
      }
    );
    
    await jsonPersistence.save();
    return NextResponse.json(connection, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create organisation connection' },
      { status: 500 }
    );
  }
}