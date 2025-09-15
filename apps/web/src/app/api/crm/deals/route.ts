import { NextRequest, NextResponse } from 'next/server';
import { getAllEnhancedDeals } from '@/lib/pipeline-data';
import { hasPermission } from '@/lib/services/pipeline-service';
import { getServerSessionFromRequest } from '@/lib/auth';
import { ensureMigrationCompleted } from '@/lib/services/migration-service';

export async function GET(request: NextRequest) {
  try {
    // Ensure migration is completed before serving requests
    await ensureMigrationCompleted();

    const session = await getServerSessionFromRequest(request);
    const user = { 
      id: session?.user?.id || 'anonymous', 
      role: (session?.user as any)?.role || 'junior' as 'admin' | 'senior' | 'junior',
      assignedDeals: (session?.user as any)?.assignedDeals || []
    };

    const { searchParams } = new URL(request.url);
    const pipeline = searchParams.get('pipeline');
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');
    
    const allDeals = getAllEnhancedDeals();
    console.log(`Deals API: Found ${allDeals.length} total deals`);
    console.log(`User: ${JSON.stringify(user, null, 2)}`);
    
    // Filter deals based on user permissions
    let filteredDeals = allDeals.filter(deal => {
      return hasPermission(user, 'deal:read', deal.id);
    });
    console.log(`After permission filtering: ${filteredDeals.length} deals`);
    
    // Apply enhanced filtering
    if (pipeline) {
      filteredDeals = filteredDeals.filter(deal => 
        deal.pipelineId === pipeline && (!stage || deal.stageId === stage)
      );
    }
    
    if (status) {
      filteredDeals = filteredDeals.filter(deal => deal.status === status);
    }
    
    if (contactId) {
      filteredDeals = filteredDeals.filter(deal => deal.contactId === contactId);
    }
    
    return NextResponse.json(filteredDeals);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipelineId, stageId, ...dealData } = body;
    
    // Temporary fix: return created deal data
    const newDeal = {
      id: 'deal_new',
      ...dealData,
      status: 'ACTIVE',
      currentStages: pipelineId ? [{
        pipelineId,
        stageId: stageId || 'stage-da-prospect',
        enteredAt: new Date().toISOString()
      }] : [],
      customFields: {},
      createdAt: new Date().toISOString()
    };
    
    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}