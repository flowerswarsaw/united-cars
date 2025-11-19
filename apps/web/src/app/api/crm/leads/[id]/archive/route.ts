import { NextRequest, NextResponse } from 'next/server';
import { leadRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | undefined;

  try {
    const paramsData = await params;
    id = paramsData.id;
    console.log(`Attempting to archive lead with ID: ${id}`);

    const body = await request.json();
    const { reason = 'not_qualified', userId } = body;

    const lead = await leadRepository.archive(id, reason, userId);
    await jsonPersistence.save();

    console.log(`Successfully archived lead: ${id}`);
    return NextResponse.json(lead);
  } catch (error: any) {
    console.error(`Error archiving lead ${id || 'unknown'}:`, error.message);

    if (error.message === 'Lead not found') {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Lead is already archived') {
      return NextResponse.json(
        { error: 'Lead is already archived' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to archive lead' },
      { status: 500 }
    );
  }
}