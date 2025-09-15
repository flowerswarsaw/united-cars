import { NextRequest, NextResponse } from 'next/server';
import { getPipelineById } from '@/lib/pipeline-data';
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
    const pipeline = getPipelineById(id);
    
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}

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
    const result = await pipelineService.updatePipeline(user, id, body);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating pipeline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update pipeline' },
      { status: error.message?.includes('permissions') ? 403 : 500 }
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

    if (!hasPermission(user, 'pipeline:delete')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const pipelineService = new PipelineService();
    
    const result = await pipelineService.deletePipeline(user, id);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete pipeline' },
      { status: error.message?.includes('permissions') ? 403 : error.message?.includes('not found') ? 404 : 500 }
    );
  }
}