import { NextRequest, NextResponse } from 'next/server';
import { moveDealInputSchema } from '@united-cars/crm-core';
import { getServerSessionFromRequest } from '@/lib/auth';
import { getEnhancedDealById, getAllEnhancedDeals, saveEnhancedDeals } from '@/lib/pipeline-data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionFromRequest(request);
    const userId = session?.user?.id;

    const body = await request.json();
    const validated = moveDealInputSchema.parse({ ...body, movedBy: userId });
    const { id } = await params;

    // Get current deal
    const currentDeal = getEnhancedDealById(id);
    if (!currentDeal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Update deal with new stage
    const updatedDeal = {
      ...currentDeal,
      pipelineId: validated.pipelineId,
      stageId: validated.toStageId,
      enteredStageAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Update currentStages array for backward compatibility
      currentStages: [{
        pipelineId: validated.pipelineId,
        stageId: validated.toStageId,
        enteredAt: new Date().toISOString()
      }]
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

    console.log(`✅ Deal ${id} moved to stage ${validated.toStageId} in pipeline ${validated.pipelineId}`);
    return NextResponse.json(updatedDeal);
  } catch (error: any) {
    console.error('❌ Failed to move deal:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'Loss reason required for lost stage') {
      return NextResponse.json(
        { error: 'Loss reason required for lost stage' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to move deal' },
      { status: 500 }
    );
  }
}