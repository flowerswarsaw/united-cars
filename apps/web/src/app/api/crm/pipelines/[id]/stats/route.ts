import { NextRequest, NextResponse } from 'next/server';
import { PipelineService, hasPermission } from '@/lib/services/pipeline-service';
import { getServerSessionFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionFromRequest(request);
    const user = { 
      id: session?.user?.id || 'anonymous', 
      role: (session?.user as any)?.role || 'junior' as 'admin' | 'senior' | 'junior'
    };

    if (!hasPermission(user, 'pipeline:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const pipelineService = new PipelineService();
    const stats = await pipelineService.getPipelineStats(id);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching pipeline stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pipeline statistics' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}