import { NextRequest, NextResponse } from 'next/server';
import { organisationConnectionRepository, jsonPersistence } from '@united-cars/crm-mocks';
import { parseDate } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const connection = await organisationConnectionRepository.get(id);
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Organisation connection not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(connection);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch organisation connection' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const connection = await organisationConnectionRepository.update(id, {
      ...body,
      startDate: parseDate(body.startDate) || undefined,
      endDate: parseDate(body.endDate) || undefined
    });
    
    if (!connection) {
      return NextResponse.json(
        { error: 'Organisation connection not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json(connection);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update organisation connection' },
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
    const deleted = await organisationConnectionRepository.remove(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Organisation connection not found' },
        { status: 404 }
      );
    }
    
    await jsonPersistence.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete organisation connection' },
      { status: 500 }
    );
  }
}