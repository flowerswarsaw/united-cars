import { NextRequest, NextResponse } from 'next/server';
import { PipelineService, hasPermission } from '@/lib/services/pipeline-service';
import { getServerSessionFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionFromRequest(request);
    const user = { 
      id: session?.user?.id || 'anonymous', 
      role: (session?.user as any)?.role || 'junior' as 'admin' | 'senior' | 'junior'
    };

    if (!hasPermission(user, 'pipeline:update')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    const pipelineService = new PipelineService();
    const result = await pipelineService.updateStage(user, id, {
      label: body.name || body.label,
      color: body.color,
      isClosing: body.isClosing,
      isLost: body.isLost,
      wipLimit: body.wipLimit,
      slaTarget: body.slaTarget
    });
    
    return NextResponse.json(result.stage);
  } catch (error: any) {
    console.error('Error updating stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update stage' },
      { status: error.message?.includes('permissions') ? 403 : error.message?.includes('not found') ? 404 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionFromRequest(request);
    const user = { 
      id: session?.user?.id || 'anonymous', 
      role: (session?.user as any)?.role || 'junior' as 'admin' | 'senior' | 'junior'
    };

    if (!hasPermission(user, 'stage:delete')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Try to parse JSON body, but handle empty body gracefully
    let body: any = {};
    try {
      const text = await request.text();
      if (text.trim()) {
        body = JSON.parse(text);
      }
    } catch (parseError) {
      // If JSON parsing fails, continue with empty body
      console.warn('Could not parse request body for DELETE request, using empty object');
    }
    
    const pipelineService = new PipelineService();
    
    // Check if stage has deals before requiring remap target
    const stageHasDeals = await pipelineService.stageHasDeals(id);
    
    if (stageHasDeals && !body.remapTarget) {
      return NextResponse.json(
        { error: 'Remap target required for stage deletion because stage contains deals. Please provide targetStageId or targetOutcome in request body.' },
        { status: 400 }
      );
    }
    
    const result = await pipelineService.deleteStage(user, id, body.remapTarget || null);
    
    return NextResponse.json({ success: result.success });
  } catch (error: any) {
    // Force recompilation
    console.error('Error deleting stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete stage' },
      { status: error.message?.includes('permissions') ? 403 : error.message?.includes('not found') ? 404 : 500 }
    );
  }
}
