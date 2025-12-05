import { NextRequest, NextResponse } from 'next/server';
import { PipelineService, hasPermission, mapSessionUserToPipelineUser } from '@/lib/services/pipeline-service';
import { getServerSessionFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionFromRequest(request);
    const user = mapSessionUserToPipelineUser(session?.user);

    const { id } = await params;

    if (!hasPermission(user, 'deal:mark-won', id)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to mark deal as won' },
        { status: 403 }
      );
    }

    const pipelineService = new PipelineService();
    const result = await pipelineService.markDealWon(user, id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error marking deal as won:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark deal as won' },
      { status: error.message?.includes('permissions') ? 403 : 500 }
    );
  }
}