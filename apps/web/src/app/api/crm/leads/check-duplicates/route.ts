import { NextRequest, NextResponse } from 'next/server';
import { leadRepository } from '@united-cars/crm-mocks';

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }

    const duplicates = await leadRepository.findDuplicates(email, phone);

    return NextResponse.json(duplicates);
  } catch (error: any) {
    console.error('Failed to check duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check duplicates' },
      { status: 500 }
    );
  }
}