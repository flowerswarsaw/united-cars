import { NextRequest, NextResponse } from 'next/server';
import { organisationRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the specific organization
    const organisation = await organisationRepository.get(id);

    if (!organisation) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    console.log(`Found organization: ${organisation.name} (ID: ${id})`);
    return NextResponse.json(organisation);
  } catch (error) {
    console.error('Failed to fetch organisation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organisation' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    // Update the organization using the repository
    const updatedOrg = await organisationRepository.update(id, body);

    if (!updatedOrg) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`Updated organization: ${updatedOrg.name} (ID: ${id})`);

    return NextResponse.json(updatedOrg);
  } catch (error: any) {
    console.error('Failed to update organisation:', error);
    return NextResponse.json(
      { error: 'Failed to update organisation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete the organization using the repository
    const deleted = await organisationRepository.delete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`Deleted organization with ID: ${id}`);

    return NextResponse.json(
      { message: 'Organisation deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete organisation' },
      { status: 500 }
    );
  }
}