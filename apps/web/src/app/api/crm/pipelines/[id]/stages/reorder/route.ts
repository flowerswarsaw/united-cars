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

    if (!hasPermission(user, 'stage:reorder')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id: pipelineId } = await params;
    const body = await request.json();
    
    const pipelineService = new PipelineService();
    const result = await pipelineService.reorderStages(user, {
      pipelineId,
      items: body.items || body.stageIds?.map((stageId: string, index: number) => ({ stageId, order: index + 1 }))
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error reordering stages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder stages' },
      { status: error.message?.includes('permissions') ? 403 : error.message?.includes('not found') ? 404 : 500 }
    );
  }
}