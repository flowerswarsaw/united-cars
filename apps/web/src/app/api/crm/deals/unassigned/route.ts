import { NextRequest, NextResponse } from 'next/server';
import { dealRepository } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess, filterByUserAccess } from '@/lib/crm-auth';

export async function GET(request: NextRequest) {
  try {
    // 1. Extract user session
    const userOrError = await getCRMUser(request);
    if (userOrError instanceof NextResponse) return userOrError;
    const user = userOrError;

    // 2. Check read permission
    const accessCheck = checkEntityAccess(user, 'Deal', 'canRead');
    if (accessCheck instanceof NextResponse) return accessCheck;

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'unassignedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Get all deals from repository
    let deals = await dealRepository.list();

    // 3. Filter by tenantId
    deals = deals.filter(deal => deal.tenantId === user.tenantId);

    // 4. Filter unassigned deals ONLY (no responsibleUserId)
    // NOTE: All unassigned deals are visible to ALL users in tenant
    deals = deals.filter(deal => !deal.responsibleUserId);

    // 5. Apply additional filters
    if (pipelineId) {
      deals = deals.filter(deal =>
        deal.currentStages?.some(stage => stage.pipelineId === pipelineId)
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      deals = deals.filter(deal =>
        deal.title.toLowerCase().includes(searchLower)
      );
    }

    // 6. Sort deals
    deals.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'unassignedAt':
          aValue = a.unassignedAt ? new Date(a.unassignedAt).getTime() : 0;
          bValue = b.unassignedAt ? new Date(b.unassignedAt).getTime() : 0;
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    console.log(`📋 Unassigned deals found: ${deals.length} for tenant ${user.tenantId}`);

    return NextResponse.json({
      data: deals,
      total: deals.length
    });
  } catch (error) {
    console.error('Failed to fetch unassigned deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unassigned deals' },
      { status: 500 }
    );
  }
}
