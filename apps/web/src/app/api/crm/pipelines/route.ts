import { NextRequest, NextResponse } from 'next/server';
import { getAllPipelines } from '@/lib/pipeline-data';
import { PipelineService, hasPermission } from '@/lib/services/pipeline-service';
import { getServerSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    const pipelines = getAllPipelines();
    return NextResponse.json(pipelines);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionFromRequest(request);
    const user = { 
      id: session?.user?.id || 'anonymous', 
      role: (session?.user as any)?.role || 'junior' as 'admin' | 'senior' | 'junior'
    };

    if (!hasPermission(user, 'pipeline:create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const pipelineService = new PipelineService();
    
    const result = await pipelineService.createPipeline(user, {
      name: body.name,
      description: body.description,
      isActive: body.isActive !== false,
      isDefault: body.isDefault || false,
      createdBy: user.id,
      stages: body.stages || []
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pipeline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create pipeline' },
      { status: error.message?.includes('permissions') ? 403 : 500 }
    );
  }
}