import { NextRequest, NextResponse } from 'next/server';
import { leadRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    const lead = await leadRepository.restore(id, userId);
    await jsonPersistence.save();

    return NextResponse.json(lead);
  } catch (error: any) {
    if (error.message === 'Lead not found') {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Lead is not archived') {
      return NextResponse.json(
        { error: 'Lead is not archived' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to restore lead' },
      { status: 500 }
    );
  }
}