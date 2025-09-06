import { NextRequest, NextResponse } from 'next/server';
import { contactRepository } from '@united-cars/crm-mocks';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contacts = await contactRepository.getByOrganisation(params.id);
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}