import { NextRequest, NextResponse } from 'next/server';
import { organisationConnectionRepository } from '@united-cars/crm-mocks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId parameter is required' },
        { status: 400 }
      );
    }
    
    const stats = await organisationConnectionRepository.getConnectionStats(orgId);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch connection statistics' },
      { status: 500 }
    );
  }
}