import { NextRequest, NextResponse } from 'next/server';
import { seedData, resetSeeds } from '@united-cars/crm-mocks';

export async function POST(request: NextRequest) {
  try {
    resetSeeds();
    seedData();
    
    // Save the seeded data to persistence
    const { jsonPersistence } = await import('@united-cars/crm-mocks');
    await jsonPersistence.save();
    
    return NextResponse.json({ success: true, message: 'Data seeded successfully' });
  } catch (error) {
    console.error('Seeding failed:', error);
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}