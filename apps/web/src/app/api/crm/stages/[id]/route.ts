import { NextRequest, NextResponse } from 'next/server';
import { pipelineRepository, jsonPersistence } from '@united-cars/crm-mocks';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Ensure we have the latest data
    await jsonPersistence.load();

    // Build update object with only provided fields
    const updateData: any = {};
    if (body.name !== undefined || body.label !== undefined) {
      updateData.name = body.name || body.label;
    }
    if (body.color !== undefined) {
      updateData.color = body.color;
    }
    if (body.isClosing !== undefined) {
      updateData.isClosing = body.isClosing;
    }
    if (body.isLost !== undefined) {
      updateData.isLost = body.isLost;
    }
    if (body.wipLimit !== undefined) {
      updateData.wipLimit = body.wipLimit;
    }
    if (body.slaTarget !== undefined) {
      updateData.slaTarget = body.slaTarget;
    }
    if (body.slaUnit !== undefined) {
      updateData.slaUnit = body.slaUnit;
    }

    // Update the stage using the CRM repository
    const updatedStage = await pipelineRepository.updateStage(id, updateData);

    if (!updatedStage) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json(updatedStage);
  } catch (error: any) {
    console.error('Error updating stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update stage' },
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

    // Ensure we have the latest data
    await jsonPersistence.load();

    // Delete the stage using the CRM repository
    const success = await pipelineRepository.deleteStage(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    // Save to persistent storage
    await jsonPersistence.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete stage' },
      { status: 500 }
    );
  }
}
