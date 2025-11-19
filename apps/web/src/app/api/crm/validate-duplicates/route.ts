import { NextRequest, NextResponse } from 'next/server';
import { duplicateDetectionService } from '@united-cars/crm-mocks/src/services/duplicate-detection';
import { ContactMethodType } from '@united-cars/crm-core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      entityType,
      data,
      excludeId
    } = body;

    let result;

    switch (entityType) {
      case 'contact':
        result = await duplicateDetectionService.checkContactDuplicates(
          {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            contactMethods: data.contactMethods || []
          },
          excludeId
        );
        break;

      case 'organisation':
        result = await duplicateDetectionService.checkOrganisationDuplicates(
          {
            name: data.name || '',
            companyId: data.companyId || '',
            contactMethods: data.contactMethods || []
          },
          excludeId
        );
        break;

      case 'lead':
        result = await duplicateDetectionService.checkLeadDuplicates(
          {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone
          },
          excludeId
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to validate duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to validate duplicates' },
      { status: 500 }
    );
  }
}