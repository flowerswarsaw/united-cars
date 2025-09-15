import { NextRequest, NextResponse } from 'next/server';
import { organizationsStore } from '@/lib/organizations-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Find the specific organization
    const organisation = organizationsStore.getById(id);
    
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
    
    // Update the organization using the store
    const updatedOrg = organizationsStore.update(id, body);
    
    if (!updatedOrg) {
      return NextResponse.json(
        { error: 'Organisation not found' },
        { status: 404 }
      );
    }
    
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
    
    // For now, return a simple success response since we don't have delete functionality
    // This would need to be implemented with the same storage system as the main endpoint
    return NextResponse.json(
      { message: 'Delete functionality not yet implemented with in-memory storage' },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete organisation' },
      { status: 500 }
    );
  }
}