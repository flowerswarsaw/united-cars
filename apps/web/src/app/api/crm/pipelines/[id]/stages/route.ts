import { NextRequest, NextResponse } from 'next/server';
import { PipelineService, hasPermission } from '@/lib/services/pipeline-service';
import { getServerSessionFromRequest } from '@/lib/auth';

export async function POST(
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
    const stage = await pipelineService.addStage(user, id, body);
    
    return NextResponse.json(stage, { status: 201 });
  } catch (error: any) {
    console.error('Error creating stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create stage' },
      { status: error.message?.includes('permissions') ? 403 : error.message?.includes('not found') ? 404 : 500 }
    );
  }
}