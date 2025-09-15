import { NextRequest, NextResponse } from 'next/server';
import { PipelineService, hasPermission } from '@/lib/services/pipeline-service';
import { getServerSessionFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionFromRequest(request);
    const user = { 
      id: session?.user?.id || 'anonymous', 
      role: (session?.user as any)?.role || 'junior' as 'admin' | 'senior' | 'junior'
    };

    if (!hasPermission(user, 'stage:reorder')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to reorder stages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pipelineId, items } = body;

    if (!pipelineId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid input: pipelineId and items array are required' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      if (!item.stageId || typeof item.order !== 'number') {
        return NextResponse.json(
          { error: 'Invalid item structure: stageId and order are required' },
          { status: 400 }
        );
      }
    }

    const pipelineService = new PipelineService();
    const result = await pipelineService.reorderStages(user, { pipelineId, items });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error reordering stages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder stages' },
      { status: error.message?.includes('permissions') ? 403 : 500 }
    );
  }
}