import { NextRequest, NextResponse } from 'next/server';
import { dealRepository } from '@united-cars/crm-mocks';
import { getCRMUser, checkEntityAccess } from '@/lib/crm-auth';

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
    const lossReason = searchParams.get('lossReason');
    const originalOwnerId = searchParams.get('originalOwnerId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Get all deals from repository
    let deals = await dealRepository.list();

    // 3. Filter by tenantId
    deals = deals.filter(deal => deal.tenantId === user.tenantId);

    // 4. Filter LOST deals ONLY
    // NOTE: All lost deals are visible to ALL users in tenant for audit purposes
    deals = deals.filter(deal => deal.status === 'LOST');

    // 5. Apply additional filters
    if (pipelineId) {
      deals = deals.filter(deal =>
        deal.currentStages?.some(stage => stage.pipelineId === pipelineId)
      );
    }

    if (lossReason) {
      deals = deals.filter(deal => deal.lossReason === lossReason);
    }

    if (originalOwnerId) {
      deals = deals.filter(deal => deal.responsibleUserId === originalOwnerId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      deals = deals.filter(deal =>
        deal.title.toLowerCase().includes(searchLower)
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      deals = deals.filter(deal => new Date(deal.updatedAt) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      deals = deals.filter(deal => new Date(deal.updatedAt) <= toDate);
    }

    // 6. Sort deals
    deals.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'lossReason':
          aValue = a.lossReason || '';
          bValue = b.lossReason || '';
          break;
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    console.log(`📋 Lost deals found: ${deals.length} for tenant ${user.tenantId}`);

    return NextResponse.json({
      data: deals,
      total: deals.length
    });
  } catch (error) {
    console.error('Failed to fetch lost deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lost deals' },
      { status: 500 }
    );
  }
}
