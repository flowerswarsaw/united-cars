import { NextRequest, NextResponse } from 'next/server';
import { updateDealSchema } from '@united-cars/crm-core';
import { dealRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = await dealRepository.get(id);

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deal' },
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

    console.log(`Updating deal ${id} with:`, body);

    // Update the deal using CRM repository
    const updatedDeal = await dealRepository.update(id, body);

    if (!updatedDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`✅ Deal ${id} updated successfully`);
    return NextResponse.json(updatedDeal);
  } catch (error: any) {
    console.error('❌ Failed to update deal:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update deal' },
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

    // Check if deal exists
    const currentDeal = await dealRepository.get(id);
    if (!currentDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Delete the deal using repository
    const success = await dealRepository.remove(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete deal' },
        { status: 500 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    console.log(`✅ Deal ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Failed to delete deal:', error);
    return NextResponse.json(
      { error: 'Failed to delete deal' },
      { status: 500 }
    );
  }
}