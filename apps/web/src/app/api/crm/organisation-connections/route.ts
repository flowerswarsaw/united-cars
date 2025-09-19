import { NextRequest, NextResponse } from 'next/server';
import { organisationConnectionRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const type = searchParams.get('type');
    const direction = searchParams.get('direction');

    let connections = await organisationConnectionRepository.list();

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

    // Create connection using repository
    const connectionData = {
      fromOrganisationId: body.fromOrganisationId,
      toOrganisationId: body.toOrganisationId,
      type: body.type || 'PARTNER',
      description: body.description || '',
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || null,
      metadata: body.metadata || {}
    };

    const newConnection = await organisationConnectionRepository.create(connectionData);
    await jsonPersistence.save();

    return NextResponse.json(newConnection, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create organisation connection' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Update connection using repository
    const updatedConnection = await organisationConnectionRepository.update(connectionId, body);

    if (!updatedConnection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    await jsonPersistence.save();
    return NextResponse.json(updatedConnection);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update organisation connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Delete connection using repository
    const deleted = await organisationConnectionRepository.remove(connectionId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    await jsonPersistence.save();
    return NextResponse.json({ success: true, deletedId: connectionId });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete organisation connection' },
      { status: 500 }
    );
  }
}