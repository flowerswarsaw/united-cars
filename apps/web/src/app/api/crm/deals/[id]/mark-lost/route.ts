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

    const { id } = await params;

    if (!hasPermission(user, 'deal:mark-lost', id)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to mark deal as lost' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lostReasonId, lostNote } = body;

    if (!lostReasonId) {
      return NextResponse.json(
        { error: 'Lost reason is required' },
        { status: 400 }
      );
    }

    const pipelineService = new PipelineService();
    const result = await pipelineService.markDealLost(user, id, lostReasonId, lostNote);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error marking deal as lost:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark deal as lost' },
      { status: error.message?.includes('permissions') ? 403 : 500 }
    );
  }
}