import { NextRequest, NextResponse } from 'next/server';
import { updateDealSchema } from '@united-cars/crm-core';
import { getServerSessionFromRequest } from '@/lib/auth';
import { getEnhancedDealById, getAllEnhancedDeals, saveEnhancedDeals } from '@/lib/pipeline-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = getEnhancedDealById(id);

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
    const session = await getServerSessionFromRequest(request);
    const userId = session?.user?.id;

    const body = await request.json();

    // Get current deal
    const currentDeal = getEnhancedDealById(id);
    if (!currentDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Update deal with new data
    const updatedDeal = {
      ...currentDeal,
      ...body,
      updatedAt: new Date().toISOString()
    };

    // Get all deals and update the specific one
    const allDeals = getAllEnhancedDeals();
    const dealIndex = allDeals.findIndex(d => d.id === id);

    if (dealIndex === -1) {
      return NextResponse.json(
        { error: 'Deal not found in store' },
        { status: 404 }
      );
    }

    // Update the deal in the array
    allDeals[dealIndex] = updatedDeal;

    // Save the updated deals array
    const dealsMap = new Map(allDeals.map(deal => [deal.id, deal]));
    saveEnhancedDeals(dealsMap);

    console.log(`✅ Deal ${id} updated successfully with:`, body);
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
    const currentDeal = getEnhancedDealById(id);
    if (!currentDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Get all deals and remove the specific one
    const allDeals = getAllEnhancedDeals();
    const filteredDeals = allDeals.filter(deal => deal.id !== id);

    // Save the updated deals array
    const dealsMap = new Map(filteredDeals.map(deal => [deal.id, deal]));
    saveEnhancedDeals(dealsMap);

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